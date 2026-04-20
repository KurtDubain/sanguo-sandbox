import { BattleUnit, GameEvent } from '../../types'
import { distance } from '../utils/math'
import { SeededRandom } from '../utils/random'
import { FACTION_NAMES } from '../../config/factionDisplay'
import { BALANCE } from '../../config/balance'
import type { SystemState, ActiveDuel } from '../SystemState'

export function updateChargeDistance(units: BattleUnit[], sys: SystemState) {
  for (const unit of units) {
    if (unit.state === 'dead') continue
    if (unit.troopType !== 'cavalry') continue

    const last = sys.lastPositions.get(unit.id)
    if (last && unit.state === 'moving') {
      const moved = distance(last, unit.position)
      const current = sys.chargeDistances.get(unit.id) ?? 0
      sys.chargeDistances.set(unit.id, current + moved)
    } else if (unit.state === 'attacking' || unit.state === 'idle') {
      sys.chargeDistances.set(unit.id, 0)
    }
    sys.lastPositions.set(unit.id, { x: unit.position.x, y: unit.position.y })
  }
}

export function getChargeDamageBonus(unitId: string, sys: SystemState): number {
  const dist = sys.chargeDistances.get(unitId) ?? 0
  if (dist < 60) return 0
  return Math.min(0.8, dist * 0.004)
}

export function consumeCharge(unitId: string, sys: SystemState) {
  sys.chargeDistances.set(unitId, 0)
}

export function activateChargeMoraleShield(unitId: string, sys: SystemState) {
  sys.chargeMoraleShield.set(unitId, BALANCE.CHARGE_MORALE_SHIELD_TICKS)
}

export function hasChargeMoraleShield(unitId: string, sys: SystemState): boolean {
  return (sys.chargeMoraleShield.get(unitId) ?? 0) > 0
}

export function tickChargeMoraleShields(sys: SystemState) {
  for (const [id, ticks] of sys.chargeMoraleShield) {
    if (ticks <= 0) sys.chargeMoraleShield.delete(id)
    else sys.chargeMoraleShield.set(id, ticks - 1)
  }
}

export function getAmbushBonus(attacker: BattleUnit, target: BattleUnit): { damageBonus: number; moralePenalty: number } {
  if (attacker.currentTerrain !== 'forest') return { damageBonus: 0, moralePenalty: 0 }
  if (target.currentTerrain === 'forest') return { damageBonus: 0, moralePenalty: 0 }
  const strategyFactor = attacker.strategy * 0.003
  return {
    damageBonus: 0.25 + strategyFactor,
    moralePenalty: 5 + attacker.strategy * 0.05,
  }
}

export function duelSystem(
  units: BattleUnit[],
  tick: number,
  rng: SeededRandom,
  sys: SystemState,
): GameEvent[] {
  const events: GameEvent[] = []
  const activeDuels = sys.activeDuels

  for (let i = activeDuels.length - 1; i >= 0; i--) {
    if (activeDuels[i].resolved) activeDuels.splice(i, 1)
  }

  if (activeDuels.length < 2) {
    for (const unit of units) {
      if (unit.state !== 'attacking' || unit.martial < 80) continue
      if (activeDuels.some((d) => d.unitA === unit.id || d.unitB === unit.id)) continue

      if (!unit.targetId) continue
      const target = units.find((u) => u.id === unit.targetId)
      if (!target || target.state !== 'attacking' || target.martial < 80) continue
      if (target.targetId !== unit.id) continue

      const dist2 = distance(unit.position, target.position)
      if (dist2 > 55) continue

      if (rng.chance(0.08)) {
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

  for (const duel of activeDuels) {
    const a = units.find((u) => u.id === duel.unitA)
    const b = units.find((u) => u.id === duel.unitB)
    if (!a || !b || a.state === 'dead' || b.state === 'dead') {
      duel.resolved = true
      continue
    }

    const elapsed = tick - duel.startTick
    if (elapsed >= duel.duration) {
      const aScore = a.martial * 0.6 + a.hp / a.maxHp * 30 + rng.float(0, 20)
      const bScore = b.martial * 0.6 + b.hp / b.maxHp * 30 + rng.float(0, 20)

      const winner = aScore >= bScore ? a : b
      const loser = aScore >= bScore ? b : a

      const duelDmg = Math.round(winner.martial * 1.2 + winner.atk * 0.5)
      loser.hp -= duelDmg
      winner.damageDealt += duelDmg
      loser.damageTaken += duelDmg
      loser.morale -= 15

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

export function commanderDeathCheck(
  deadUnit: BattleUnit,
  allUnits: BattleUnit[],
  tick: number,
): GameEvent[] {
  const events: GameEvent[] = []

  const factionUnits = allUnits.filter(
    (u) => u.faction === deadUnit.faction && u.id !== deadUnit.id
  )
  const wasCommander = factionUnits.every((u) => u.command <= deadUnit.command)

  if (wasCommander && factionUnits.length > 0) {
    for (const ally of factionUnits) {
      if (ally.state === 'dead') continue
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

export function isInDuel(unitId: string, sys: SystemState): boolean {
  return sys.activeDuels.some((d) => !d.resolved && (d.unitA === unitId || d.unitB === unitId))
}
