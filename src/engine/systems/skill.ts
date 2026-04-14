import { BattleUnit, GameEvent, BattleMap } from '../../types'
import { BALANCE } from '../../config/balance'
import { SKILLS } from '../../config/skills'
import { distance } from '../utils/math'
import { SeededRandom } from '../utils/random'
import { igniteForest } from './terrainInteraction'

export function skillSystem(
  units: BattleUnit[],
  tick: number,
  rng: SeededRandom,
  map?: BattleMap,
): GameEvent[] {
  const events: GameEvent[] = []

  for (const unit of units) {
    if (unit.state === 'dead' || unit.state === 'routed') continue

    // Tick down buff durations
    unit.buffs = unit.buffs.filter((b) => {
      b.remainingTicks--
      return b.remainingTicks > 0
    })

    // Process each skill
    for (const activeSkill of unit.skills) {
      // Tick down cooldown
      if (activeSkill.cooldownRemaining > 0) {
        activeSkill.cooldownRemaining--
        continue
      }

      const skillDef = SKILLS[activeSkill.skillId]
      if (!skillDef) continue

      // Strategy boosts trigger chance
      const adjustedChance =
        skillDef.triggerChance + unit.strategy * BALANCE.STRATEGY_SKILL_BONUS

      // Situation-based trigger logic
      let shouldAttempt = false

      switch (skillDef.targetType) {
        case 'self':
          // Use self-buffs when in combat or low HP
          shouldAttempt =
            unit.state === 'attacking' ||
            unit.hp / unit.maxHp < 0.5 ||
            unit.morale < BALANCE.MORALE_RETREAT_THRESHOLD + 20
          break
        case 'enemy':
          // Use offensive skills when we have a target
          shouldAttempt = !!unit.targetId
          break
        case 'ally':
          // Use ally skills when nearby allies need help
          shouldAttempt = units.some(
            (u) =>
              u.faction === unit.faction &&
              u.id !== unit.id &&
              u.state !== 'dead' &&
              distance(unit.position, u.position) < skillDef.range &&
              (u.morale < 60 || u.hp / u.maxHp < 0.6)
          )
          break
        case 'area':
          // Use area skills when enemies are nearby (lowered from 2 to 1)
          {
            const nearbyEnemies = units.filter(
              (u) =>
                u.faction !== unit.faction &&
                u.state !== 'dead' &&
                distance(unit.position, u.position) < skillDef.range
            )
            shouldAttempt = nearbyEnemies.length >= 1
          }
          break
      }

      if (!shouldAttempt) continue
      if (!rng.chance(adjustedChance)) continue

      // Trigger the skill
      activeSkill.cooldownRemaining = skillDef.cooldown

      // Apply effects
      for (const effect of skillDef.effects) {
        switch (skillDef.targetType) {
          case 'self':
            applyEffect(unit, unit, effect, events, tick, skillDef.name)
            break

          case 'enemy': {
            if (unit.targetId) {
              const target = units.find((u) => u.id === unit.targetId)
              if (target && target.state !== 'dead') {
                applyEffect(unit, target, effect, events, tick, skillDef.name)
              }
            }
            break
          }

          case 'ally': {
            const allies = units.filter(
              (u) =>
                u.faction === unit.faction &&
                u.state !== 'dead' &&
                distance(unit.position, u.position) < skillDef.range
            )
            for (const ally of allies) {
              applyEffect(unit, ally, effect, events, tick, skillDef.name)
            }
            break
          }

          case 'area': {
            const radius = effect.radius ?? skillDef.range
            const targets = units.filter(
              (u) =>
                u.faction !== unit.faction &&
                u.state !== 'dead' &&
                distance(unit.position, u.position) < radius
            )
            for (const target of targets) {
              applyEffect(unit, target, effect, events, tick, skillDef.name)
            }
            // Fire skills ignite nearby forest terrain
            if (effect.type === 'damage' && skillDef.id === 'fire_attack' && map) {
              igniteForest(map, unit.position.x, unit.position.y, radius)
            }
            break
          }
        }
      }

      events.push({
        tick,
        type: 'skill_trigger',
        sourceId: unit.id,
        message: `${unit.name} 发动了【${skillDef.name}】！`,
      })

      break // only one skill per tick
    }
  }

  return events
}

function applyEffect(
  source: BattleUnit,
  target: BattleUnit,
  effect: { type: string; value: number; duration: number },
  events: GameEvent[],
  tick: number,
  skillName: string,
) {
  switch (effect.type) {
    case 'damage': {
      const dmg = Math.round(effect.value * (1 + source.martial * 0.005))
      target.hp -= dmg
      source.damageDealt += dmg
      target.damageTaken += dmg
      if (target.hp <= 0) {
        target.hp = 0
        target.state = 'dead'
        source.kills++
        events.push({
          tick,
          type: 'kill',
          sourceId: source.id,
          targetId: target.id,
          message: `${source.name} 用【${skillName}】击杀了 ${target.name}！`,
        })
      }
      break
    }
    case 'heal': {
      const heal = Math.round(effect.value * (1 + source.politics * 0.01 + source.charisma * 0.003))
      target.hp = Math.min(target.maxHp, target.hp + heal)
      break
    }
    case 'debuff_morale':
      target.morale = Math.max(0, target.morale - effect.value)
      break
    case 'buff_atk':
    case 'buff_def':
    case 'buff_speed':
    case 'buff_morale':
      if (effect.duration > 0) {
        target.buffs.push({
          type: effect.type as any,
          value: effect.value,
          remainingTicks: effect.duration,
          sourceId: source.id,
        })
      }
      if (effect.type === 'buff_morale') {
        target.morale = Math.min(target.maxMorale, target.morale + effect.value * 0.3)
      }
      break
  }
}
