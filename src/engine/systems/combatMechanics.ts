// Advanced combat mechanics: duels, charge momentum, forest ambush, commander death

import { BattleUnit, GameEvent } from '../../types'
import { distance } from '../utils/math'
import { SeededRandom } from '../utils/random'
import { FACTION_NAMES } from '../../config/factionDisplay'
import { BALANCE } from '../../config/balance'

// =================== Cavalry Charge Momentum ===================
// Track how far cavalry units have been moving in a straight line before attacking.
// Longer charge = more damage on first hit.

const chargeDistances = new Map<string, number>()
const lastPositions = new Map<string, { x: number; y: number }>()

export function resetCombatMechanics() {
  chargeDistances.clear()
  lastPositions.clear()
  chargeMoraleShield.clear()
}

export function updateChargeDistance(units: BattleUnit[]) {
  for (const unit of units) {
    if (unit.state === 'dead') continue
    if (unit.troopType !== 'cavalry') continue

    const last = lastPositions.get(unit.id)
    if (last && unit.state === 'moving') {
      const moved = distance(last, unit.position)
      const current = chargeDistances.get(unit.id) ?? 0
      chargeDistances.set(unit.id, current + moved)
    } else if (unit.state === 'attacking' || unit.state === 'idle') {
      // Reset on attack or idle
      chargeDistances.set(unit.id, 0)
    }
    lastPositions.set(unit.id, { x: unit.position.x, y: unit.position.y })
  }
}

export function getChargeDamageBonus(unitId: string): number {
  const dist = chargeDistances.get(unitId) ?? 0
  if (dist < 60) return 0
  // Max +80% bonus at 200px charge distance
  return Math.min(0.8, dist * 0.004)
}

export function consumeCharge(unitId: string) {
  chargeDistances.set(unitId, 0)
}

// Charge morale shield: cavalry get temporary morale immunity after a charge hit
const chargeMoraleShield = new Map<string, number>() // unitId → ticks remaining

export function activateChargeMoraleShield(unitId: string) {
  chargeMoraleShield.set(unitId, BALANCE.CHARGE_MORALE_SHIELD_TICKS)
}

export function hasChargeMoraleShield(unitId: string): boolean {
  return (chargeMoraleShield.get(unitId) ?? 0) > 0
}

export function tickChargeMoraleShields() {
  for (const [id, ticks] of chargeMoraleShield) {
    if (ticks <= 0) chargeMoraleShield.delete(id)
    else chargeMoraleShield.set(id, ticks - 1)
  }
}

// =================== Forest Ambush ===================
// Units in forest that haven't been detected yet get a first-strike bonus.

export function getAmbushBonus(attacker: BattleUnit, target: BattleUnit): { damageBonus: number; moralePenalty: number } {
  if (attacker.currentTerrain !== 'forest') return { damageBonus: 0, moralePenalty: 0 }
  // Only works if target is NOT in forest (ambushing from forest into open)
  if (target.currentTerrain === 'forest') return { damageBonus: 0, moralePenalty: 0 }

  // Strategy improves ambush effectiveness
  const strategyFactor = attacker.strategy * 0.003
  return {
    damageBonus: 0.25 + strategyFactor,  // +25-50% damage
    moralePenalty: 5 + attacker.strategy * 0.05,  // morale shock
  }
}

// =================== Duel System ===================
// When two high-martial generals (80+) get within melee range and both are attacking each other,
// a duel is triggered. The duel plays out over several ticks with special damage.

export interface ActiveDuel {
  unitA: string
  unitB: string
  startTick: number
  duration: number
  resolved: boolean
}

const activeDuels: ActiveDuel[] = []

export function duelSystem(
  units: BattleUnit[],
  tick: number,
  rng: SeededRandom,
): GameEvent[] {
  const events: GameEvent[] = []

  // Clean up resolved duels
  for (let i = activeDuels.length - 1; i >= 0; i--) {
    if (activeDuels[i].resolved) activeDuels.splice(i, 1)
  }

  // Check for new duel opportunities (limit to 2 concurrent duels)
  if (activeDuels.length < 2) {
    for (const unit of units) {
      if (unit.state !== 'attacking' || unit.martial < 80) continue
      if (activeDuels.some((d) => d.unitA === unit.id || d.unitB === unit.id)) continue

      if (!unit.targetId) continue
      const target = units.find((u) => u.id === unit.targetId)
      if (!target || target.state !== 'attacking' || target.martial < 80) continue
      if (target.targetId !== unit.id) continue // must be attacking each other

      const dist2 = distance(unit.position, target.position)
      if (dist2 > 55) continue

      // Both high-martial, close range, attacking each other — DUEL!
      if (rng.chance(0.08)) { // small chance per tick to trigger
        const duel: ActiveDuel = {
          unitA: unit.id,
          unitB: target.id,
          startTick: tick,
          duration: rng.int(15, 30),
          resolved: false,
        }
        activeDuels.push(duel)
        events.push({
          tick,
          type: 'duel',
          sourceId: unit.id,
          targetId: target.id,
          message: `⚔ ${unit.name} vs ${target.name} — 单挑开始！`,
        })
      }
    }
  }

  // Process active duels
  for (const duel of activeDuels) {
    const a = units.find((u) => u.id === duel.unitA)
    const b = units.find((u) => u.id === duel.unitB)
    if (!a || !b || a.state === 'dead' || b.state === 'dead') {
      duel.resolved = true
      continue
    }

    const elapsed = tick - duel.startTick
    if (elapsed >= duel.duration) {
      // Duel resolution: the one with higher martial + some randomness wins
      const aScore = a.martial * 0.6 + a.hp / a.maxHp * 30 + rng.float(0, 20)
      const bScore = b.martial * 0.6 + b.hp / b.maxHp * 30 + rng.float(0, 20)

      const winner = aScore >= bScore ? a : b
      const loser = aScore >= bScore ? b : a

      // Loser takes big damage
      const duelDmg = Math.round(winner.martial * 1.2 + winner.atk * 0.5)
      loser.hp -= duelDmg
      winner.damageDealt += duelDmg
      loser.damageTaken += duelDmg
      loser.morale -= 15

      // Winner gets morale boost
      winner.morale = Math.min(winner.maxMorale, winner.morale + 10)

      if (loser.hp <= 0) {
        loser.hp = 0
        loser.state = 'dead'
        winner.kills++
        events.push({
          tick, type: 'kill', sourceId: winner.id, targetId: loser.id,
          message: `⚔ ${winner.name} 单挑斩杀 ${loser.name}！`,
        })
      } else {
        events.push({
          tick, type: 'duel', sourceId: winner.id, targetId: loser.id,
          value: duelDmg,
          message: `⚔ ${winner.name} 单挑胜 ${loser.name}，造成 ${duelDmg} 伤害！`,
        })
      }

      duel.resolved = true
    }
  }

  return events
}

// =================== Commander Death Impact ===================
// When a faction's commander (highest command) dies, entire faction loses morale

export function commanderDeathCheck(
  deadUnit: BattleUnit,
  allUnits: BattleUnit[],
  tick: number,
): GameEvent[] {
  const events: GameEvent[] = []

  // Check if this was the highest-command unit in their faction
  const factionUnits = allUnits.filter(
    (u) => u.faction === deadUnit.faction && u.id !== deadUnit.id
  )
  const wasCommander = factionUnits.every((u) => u.command <= deadUnit.command)

  if (wasCommander && factionUnits.length > 0) {
    // All allies lose significant morale
    for (const ally of factionUnits) {
      if (ally.state === 'dead') continue
      // Scale penalty by distance — closer allies feel it more, distant ones less
      const dist = distance(ally.position, deadUnit.position)
      const penalty = dist < 150 ? 15 : dist < 300 ? 10 : 6
      ally.morale -= penalty
      if (ally.morale < 0) ally.morale = 0
    }
    events.push({
      tick,
      type: 'morale_rout',
      sourceId: deadUnit.id,
      message: `主帅 ${deadUnit.name} 阵亡！${FACTION_NAMES[deadUnit.faction] ?? deadUnit.faction}军全军士气崩溃！`,
    })
  }

  return events
}

export function isInDuel(unitId: string): boolean {
  return activeDuels.some((d) => !d.resolved && (d.unitA === unitId || d.unitB === unitId))
}
