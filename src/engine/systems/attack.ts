import { BattleUnit, GameEvent, WeatherState } from '../../types'
import { BALANCE } from '../../config/balance'
import { TROOP_EFFECTIVENESS, TERRAIN_MODIFIERS } from '../../config/balance'
import { distance, angle } from '../utils/math'
import { SeededRandom } from '../utils/random'
import { getWeatherModifiers } from './weather'
import { hasLineOfSight } from '../utils/pathfinding'
import {
  getChargeDamageBonus, consumeCharge, getAmbushBonus,
  commanderDeathCheck, isInDuel,
} from './combatMechanics'

const attackCooldowns = new Map<string, number>()

export function resetAttackCooldowns() {
  attackCooldowns.clear()
}

export function attackSystem(
  units: BattleUnit[],
  tick: number,
  rng: SeededRandom,
  weather: WeatherState,
  map?: import('../../types').BattleMap,
): GameEvent[] {
  const events: GameEvent[] = []
  const wm = getWeatherModifiers(weather)

  for (const unit of units) {
    if (unit.state !== 'attacking' || !unit.targetId) continue
    // Skip units in a duel (duel system handles their damage)
    if (isInDuel(unit.id)) continue

    const target = units.find((u) => u.id === unit.targetId)
    if (!target || target.state === 'dead') continue

    const dist = distance(unit.position, target.position)
    if (dist > unit.range * 1.2) continue

    const isMelee = unit.range <= 60

    // === Line of Sight check ===
    if (map) {
      const losMode = isMelee ? 'melee' as const : 'ranged' as const
      if (!hasLineOfSight(map, unit.position, target.position, losMode)) {
        // Can't see/reach target through terrain — cancel attack, go back to moving
        unit.state = 'moving'
        continue
      }
    }

    // Check attack cooldown
    const lastAttack = attackCooldowns.get(unit.id) ?? 0
    if (tick - lastAttack < BALANCE.ATTACK_COOLDOWN) continue
    attackCooldowns.set(unit.id, tick)

    // === Base Attack Power ===
    let atkPower = unit.atk

    // Martial bonus (especially for melee)
    if (isMelee) {
      atkPower *= 1 + unit.martial * BALANCE.MARTIAL_MELEE_BONUS
    }

    // Attack buffs
    for (const buff of unit.buffs) {
      if (buff.type === 'buff_atk') {
        atkPower *= 1 + buff.value * 0.01
      }
    }

    // Troop type effectiveness
    const troopMult = TROOP_EFFECTIVENESS[unit.troopType]?.[target.troopType] ?? 1.0

    // Terrain modifiers for ranged attacks
    const terrainMod = TERRAIN_MODIFIERS[unit.currentTerrain]
    if (!isMelee) {
      atkPower *= terrainMod.rangedAtkMult * wm.rangedAtkMult
    }
    atkPower += terrainMod.atkBonus

    // Command coordination bonus
    atkPower *= 1 + unit.command * BALANCE.COMMAND_EFFICIENCY * 0.3

    // === Flanking Check ===
    let flankMult = 1
    let isFlank = false
    if (target.targetId && target.targetId !== unit.id) {
      // Target is facing someone else — check angle
      const attackAngle = angle(unit.position, target.position)
      const facingDiff = Math.abs(attackAngle - target.facing)
      const normalizedDiff = facingDiff > Math.PI ? 2 * Math.PI - facingDiff : facingDiff
      if (normalizedDiff > BALANCE.FLANK_ANGLE_THRESHOLD) {
        flankMult = 1 + BALANCE.FLANK_DAMAGE_BONUS
        isFlank = true
        // Strategy improves flanking effectiveness
        flankMult += unit.strategy * 0.001
      }
    }
    atkPower *= flankMult

    // === Intimidation aura: high martial units debuff nearby enemies ===
    if (target.martial >= BALANCE.INTIMIDATION_MARTIAL_THRESHOLD && isMelee) {
      const intimidDist = distance(unit.position, target.position)
      if (intimidDist < BALANCE.INTIMIDATION_RANGE) {
        atkPower *= 1 - BALANCE.INTIMIDATION_ATK_PENALTY
      }
    }

    // === Formation Defense Bonus ===
    let defPower = target.def
    const targetTerrainMod = TERRAIN_MODIFIERS[target.currentTerrain]
    defPower += targetTerrainMod.defBonus

    // Nearby allies boost defense
    const nearbyAllies = units.filter(
      (u) =>
        u.id !== target.id &&
        u.faction === target.faction &&
        u.state !== 'dead' &&
        u.state !== 'routed' &&
        distance(u.position, target.position) < BALANCE.FORMATION_RANGE
    )
    const formationCount = Math.min(nearbyAllies.length, BALANCE.FORMATION_MAX_ALLIES)
    let formationBonus = 1 + formationCount * BALANCE.FORMATION_DEF_BONUS
    const avgAllyCommand = formationCount > 0
      ? nearbyAllies.slice(0, formationCount).reduce((s, u) => s + u.command, 0) / formationCount
      : 0

    // === Formation break: high martial attacker reduces formation bonus ===
    if (unit.martial > target.command && formationCount > 0) {
      const breakFactor = (unit.martial - target.command) * BALANCE.FORMATION_BREAK_FACTOR
      formationBonus *= Math.max(0.6, 1 - breakFactor)
    }

    defPower *= formationBonus * (1 + avgAllyCommand * 0.001)

    // Defense buffs
    for (const buff of target.buffs) {
      if (buff.type === 'buff_def') {
        defPower *= 1 + buff.value * 0.01
      }
    }

    defPower *= 1 + target.command * BALANCE.COMMAND_EFFICIENCY * 0.3

    // === Fatigue ===
    let fatigueMult = 1
    if (unit.survivalTicks > BALANCE.FATIGUE_TICK_THRESHOLD) {
      const fatigueTicks = unit.survivalTicks - BALANCE.FATIGUE_TICK_THRESHOLD
      const politicsResist = 1 - unit.politics * BALANCE.FATIGUE_POLITICS_RESIST
      fatigueMult = Math.max(0.5, 1 - fatigueTicks * BALANCE.FATIGUE_ATK_PENALTY * Math.max(0.1, politicsResist))
    }
    atkPower *= fatigueMult

    // === Pursuit Bonus ===
    let pursuitMult = 1
    if (target.state === 'retreating' || target.state === 'routed') {
      pursuitMult = BALANCE.PURSUIT_SPEED_BONUS
      pursuitMult += unit.martial * BALANCE.PURSUIT_MARTIAL_BONUS
    }
    atkPower *= pursuitMult

    // === Cavalry charge momentum ===
    let chargeMult = 1
    const chargeBonus = getChargeDamageBonus(unit.id)
    if (chargeBonus > 0 && unit.troopType === 'cavalry') {
      chargeMult = 1 + chargeBonus
      consumeCharge(unit.id) // consume on first hit
    }
    atkPower *= chargeMult

    // === Forest ambush bonus ===
    let ambushMult = 1
    const ambush = getAmbushBonus(unit, target)
    if (ambush.damageBonus > 0) {
      ambushMult = 1 + ambush.damageBonus
      target.morale -= ambush.moralePenalty
    }
    atkPower *= ambushMult

    // Achievement intimidation
    const intimidation = unit.achievement * BALANCE.ACHIEVEMENT_PRESTIGE * 0.3
    defPower *= Math.max(0.5, 1 - intimidation)

    // Damage variance
    const variance = rng.float(1 - BALANCE.DAMAGE_VARIANCE, 1 + BALANCE.DAMAGE_VARIANCE)

    // Critical hit
    let critMult = 1
    const critChance = BALANCE.CRIT_BASE_CHANCE + unit.martial * 0.001 + unit.strategy * 0.0005
    const isCrit = rng.chance(critChance)
    if (isCrit) {
      critMult = BALANCE.CRIT_MULTIPLIER
    }

    // Last stand
    let lastStandMult = 1
    if (unit.hp / unit.maxHp < BALANCE.LAST_STAND_HP_THRESHOLD) {
      lastStandMult = 1 + unit.martial * BALANCE.LAST_STAND_MARTIAL_BONUS
    }

    // === Dodge check: target can dodge based on speed + martial ===
    const dodgeChance = Math.min(
      BALANCE.DODGE_MAX,
      target.speed * BALANCE.DODGE_SPEED_FACTOR + target.martial * BALANCE.DODGE_MARTIAL_FACTOR
    )
    if (isMelee && rng.chance(dodgeChance)) {
      events.push({
        tick, type: 'attack', sourceId: unit.id, targetId: target.id, value: 0,
        message: `${target.name} 闪避了 ${unit.name} 的攻击！`,
      })
      continue
    }

    // Final damage
    const rawDamage = Math.max(1, atkPower * troopMult * variance * critMult * lastStandMult - defPower * 0.5)
    const finalDamage = Math.round(rawDamage)

    // Apply damage
    target.hp -= finalDamage
    unit.damageDealt += finalDamage
    target.damageTaken += finalDamage

    // === Counter-attack: high martial targets strike back ===
    if (isMelee && target.martial >= BALANCE.COUNTER_MARTIAL_THRESHOLD && rng.chance(BALANCE.COUNTER_CHANCE)) {
      const counterDmg = Math.round(target.atk * BALANCE.COUNTER_DAMAGE_RATIO)
      unit.hp -= counterDmg
      target.damageDealt += counterDmg
      unit.damageTaken += counterDmg
      if (unit.hp <= 0) {
        unit.hp = 0
        unit.state = 'dead'
        target.kills++
        events.push({
          tick, type: 'kill', sourceId: target.id, targetId: unit.id,
          message: `${target.name} 反击斩杀了 ${unit.name}！`,
        })
      }
    }

    // Morale impact
    let moralePenalty = finalDamage * BALANCE.MORALE_DECAY_ON_HIT * 0.1
    if (isFlank) moralePenalty += BALANCE.FLANK_MORALE_PENALTY
    target.morale -= moralePenalty

    // Build attack message
    const tags: string[] = []
    if (isCrit) tags.push('暴击')
    if (isFlank) tags.push('侧击')
    if (pursuitMult > 1) tags.push('追击')
    if (chargeMult > 1) tags.push('冲锋')
    if (ambushMult > 1) tags.push('伏击')
    if (lastStandMult > 1) tags.push('背水')
    if (fatigueMult < 0.9) tags.push('疲惫')
    const tagStr = tags.length > 0 ? `[${tags.join('·')}] ` : ''

    events.push({
      tick,
      type: 'attack',
      sourceId: unit.id,
      targetId: target.id,
      value: finalDamage,
      message: `${unit.name} ${tagStr}攻击 ${target.name}，造成 ${finalDamage} 点伤害`,
    })

    // Check kill
    if (target.hp <= 0) {
      target.hp = 0
      target.state = 'dead'
      unit.kills++
      unit.morale = Math.min(unit.maxMorale, unit.morale + BALANCE.MORALE_BOOST_ON_KILL)
      unit.targetId = null

      events.push({
        tick,
        type: 'kill',
        sourceId: unit.id,
        targetId: target.id,
        message: `${unit.name} 击杀了 ${target.name}！`,
      })

      // === Death Burst ===
      // High-martial warriors deal AoE damage on death
      if (target.martial >= BALANCE.DEATH_BURST_MARTIAL_THRESHOLD) {
        const burstDamage = Math.round(target.atk * BALANCE.DEATH_BURST_DAMAGE_RATIO)
        const nearbyEnemies = units.filter(
          (u) =>
            u.faction !== target.faction &&
            u.state !== 'dead' &&
            distance(u.position, target.position) < BALANCE.DEATH_BURST_RANGE
        )
        for (const enemy of nearbyEnemies) {
          enemy.hp -= burstDamage
          enemy.damageTaken += burstDamage
          target.damageDealt += burstDamage
          if (enemy.hp <= 0) {
            enemy.hp = 0
            enemy.state = 'dead'
            target.kills++
          }
        }
        if (nearbyEnemies.length > 0) {
          events.push({
            tick,
            type: 'skill_trigger',
            sourceId: target.id,
            message: `${target.name} 临死一搏，对周围 ${nearbyEnemies.length} 人造成 ${burstDamage} 点伤害！`,
          })
        }
      }

      // Nearby allies of the dead unit lose morale
      for (const ally of units) {
        if (ally.faction === target.faction && ally.state !== 'dead' && ally.id !== target.id) {
          const d = distance(ally.position, target.position)
          if (d < 150) {
            ally.morale -= BALANCE.MORALE_NEARBY_DEATH_PENALTY
          }
        }
      }

      // Commander death check — faction-wide morale impact
      const cmdDeathEvents = commanderDeathCheck(target, units, tick)
      events.push(...cmdDeathEvents)
    }

    // === Cleave: high martial melee units hit secondary targets ===
    if (isMelee && unit.martial >= BALANCE.CLEAVE_MARTIAL_THRESHOLD && unit.state !== 'dead') {
      const maxCleave = Math.min(
        BALANCE.CLEAVE_MAX_TARGETS,
        1 + Math.floor((unit.martial - BALANCE.CLEAVE_MARTIAL_THRESHOLD) / 10)
      )
      const cleaveTargets = units.filter(
        (u) => u.id !== target.id && u.id !== unit.id &&
               u.state !== 'dead' && u.faction !== unit.faction &&
               distance(unit.position, u.position) < BALANCE.CLEAVE_RANGE
      ).slice(0, maxCleave)

      for (const ct of cleaveTargets) {
        const cleaveDmg = Math.round(finalDamage * BALANCE.CLEAVE_DAMAGE_FALLOFF)
        ct.hp -= cleaveDmg
        unit.damageDealt += cleaveDmg
        ct.damageTaken += cleaveDmg
        ct.morale -= 2

        if (ct.hp <= 0) {
          ct.hp = 0
          ct.state = 'dead'
          unit.kills++
          events.push({
            tick, type: 'kill', sourceId: unit.id, targetId: ct.id,
            message: `${unit.name} 横扫斩杀 ${ct.name}！`,
          })
        }
      }
      if (cleaveTargets.length > 0) {
        events.push({
          tick, type: 'attack', sourceId: unit.id, value: Math.round(finalDamage * BALANCE.CLEAVE_DAMAGE_FALLOFF),
          message: `${unit.name} 横扫 ${cleaveTargets.length} 人！`,
        })
      }
    }
  }

  return events
}
