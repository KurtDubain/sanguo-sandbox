// Tactical AI: per-troop-type behavior logic
// This runs BEFORE the generic target system to override behavior

import { BattleUnit, BattleMode, Position } from '../../types'
import { distance, angle } from '../utils/math'
import { SeededRandom } from '../utils/random'

export interface TacticalOrder {
  targetId: string | null
  moveTarget: Position | null  // override movement destination
  behavior: 'attack' | 'kite' | 'flank' | 'protect' | 'hold'
}

// Returns tactical orders for each unit based on troop type + personality
export function tacticalAI(
  units: BattleUnit[],
  mode: BattleMode,
  rng: SeededRandom,
): Map<string, TacticalOrder> {
  const orders = new Map<string, TacticalOrder>()

  for (const unit of units) {
    if (unit.state === 'dead' || unit.state === 'routed' || unit.state === 'retreating') continue

    const enemies = getEnemies(unit, units, mode)
    const allies = getAllies(unit, units)
    if (enemies.length === 0) continue

    switch (unit.troopType) {
      case 'archer':
        orders.set(unit.id, archerTactic(unit, enemies, allies, rng))
        break
      case 'cavalry':
        orders.set(unit.id, cavalryTactic(unit, enemies, allies, rng))
        break
      case 'shield':
        orders.set(unit.id, shieldTactic(unit, enemies, allies, rng))
        break
      case 'spearman':
        orders.set(unit.id, spearmanTactic(unit, enemies, allies, rng))
        break
      case 'infantry':
        orders.set(unit.id, infantryTactic(unit, enemies, allies, rng))
        break
    }
  }

  return orders
}

// === Archer: kite, keep distance, retreat if approached ===
function archerTactic(
  unit: BattleUnit,
  enemies: BattleUnit[],
  _allies: BattleUnit[],
  _rng: SeededRandom,
): TacticalOrder {
  const nearest = enemies.reduce((a, b) =>
    distance(unit.position, a.position) < distance(unit.position, b.position) ? a : b
  )
  const dist = distance(unit.position, nearest.position)

  // If enemy is too close, retreat backward
  if (dist < unit.range * 0.5) {
    const awayAngle = angle(nearest.position, unit.position)
    const retreatDist = unit.range * 0.8
    return {
      targetId: nearest.id,
      moveTarget: {
        x: unit.position.x + Math.cos(awayAngle) * retreatDist,
        y: unit.position.y + Math.sin(awayAngle) * retreatDist,
      },
      behavior: 'kite',
    }
  }

  // If in good range, stay and shoot the weakest visible enemy
  if (dist <= unit.range * 1.1) {
    // Pick weakest in range
    const inRange = enemies.filter((e) => distance(unit.position, e.position) <= unit.range)
    if (inRange.length > 0) {
      const weakest = inRange.reduce((a, b) => (a.hp / a.maxHp < b.hp / b.maxHp ? a : b))
      return { targetId: weakest.id, moveTarget: null, behavior: 'attack' }
    }
  }

  // Move toward nearest but don't get too close
  const idealDist = unit.range * 0.8
  if (dist > idealDist) {
    const toAngle = angle(unit.position, nearest.position)
    return {
      targetId: nearest.id,
      moveTarget: {
        x: nearest.position.x - Math.cos(toAngle) * idealDist,
        y: nearest.position.y - Math.sin(toAngle) * idealDist,
      },
      behavior: 'kite',
    }
  }

  return { targetId: nearest.id, moveTarget: null, behavior: 'attack' }
}

// === Cavalry: flank, charge from behind, hit and run ===
function cavalryTactic(
  unit: BattleUnit,
  enemies: BattleUnit[],
  _allies: BattleUnit[],
  rng: SeededRandom,
): TacticalOrder {
  // Priority 1: hunt enemy archers (cavalry crush archers)
  const enemyArchers = enemies.filter((e) => e.troopType === 'archer')
  if (enemyArchers.length > 0 && unit.strategy > 50) {
    const target = enemyArchers.reduce((a, b) =>
      distance(unit.position, a.position) < distance(unit.position, b.position) ? a : b
    )
    // Try to approach from behind
    const flankPos = getFlankPosition(unit, target, rng)
    return { targetId: target.id, moveTarget: flankPos, behavior: 'flank' }
  }

  // Priority 2: flank engaged enemies (attack from behind)
  const engaged = enemies.filter((e) => e.state === 'attacking' && e.targetId !== unit.id)
  if (engaged.length > 0 && rng.chance(0.6 + unit.strategy * 0.003)) {
    const target = engaged.reduce((a, b) =>
      distance(unit.position, a.position) < distance(unit.position, b.position) ? a : b
    )
    const flankPos = getFlankPosition(unit, target, rng)
    return { targetId: target.id, moveTarget: flankPos, behavior: 'flank' }
  }

  // Default: charge the nearest
  const nearest = enemies.reduce((a, b) =>
    distance(unit.position, a.position) < distance(unit.position, b.position) ? a : b
  )
  return { targetId: nearest.id, moveTarget: null, behavior: 'attack' }
}

// === Shield: protect nearby archers and hold the line ===
function shieldTactic(
  unit: BattleUnit,
  enemies: BattleUnit[],
  allies: BattleUnit[],
  _rng: SeededRandom,
): TacticalOrder {
  // Find friendly archers that need protection
  const nearbyArchers = allies.filter(
    (a) => a.troopType === 'archer' && distance(unit.position, a.position) < 150
  )

  if (nearbyArchers.length > 0) {
    const archer = nearbyArchers[0]
    // Position between archer and nearest enemy
    const nearestEnemy = enemies.reduce((a, b) =>
      distance(archer.position, a.position) < distance(archer.position, b.position) ? a : b
    )
    const guardAngle = angle(archer.position, nearestEnemy.position)
    const guardDist = 30
    const guardPos = {
      x: archer.position.x + Math.cos(guardAngle) * guardDist,
      y: archer.position.y + Math.sin(guardAngle) * guardDist,
    }
    return {
      targetId: nearestEnemy.id,
      moveTarget: guardPos,
      behavior: 'protect',
    }
  }

  // No archer to protect → hold position and fight nearest
  const nearest = enemies.reduce((a, b) =>
    distance(unit.position, a.position) < distance(unit.position, b.position) ? a : b
  )
  return { targetId: nearest.id, moveTarget: null, behavior: 'hold' }
}

// === Spearman: anti-cavalry, form wall ===
function spearmanTactic(
  unit: BattleUnit,
  enemies: BattleUnit[],
  _allies: BattleUnit[],
  _rng: SeededRandom,
): TacticalOrder {
  // Priority: intercept enemy cavalry
  const enemyCav = enemies.filter((e) => e.troopType === 'cavalry')
  if (enemyCav.length > 0) {
    const target = enemyCav.reduce((a, b) =>
      distance(unit.position, a.position) < distance(unit.position, b.position) ? a : b
    )
    return { targetId: target.id, moveTarget: null, behavior: 'attack' }
  }

  // Default: attack nearest
  const nearest = enemies.reduce((a, b) =>
    distance(unit.position, a.position) < distance(unit.position, b.position) ? a : b
  )
  return { targetId: nearest.id, moveTarget: null, behavior: 'hold' }
}

// === Infantry: balanced, follow commander orders or hold line ===
function infantryTactic(
  unit: BattleUnit,
  enemies: BattleUnit[],
  _allies: BattleUnit[],
  _rng: SeededRandom,
): TacticalOrder {
  // Basic: attack nearest, but prefer wounded targets
  const scored = enemies.map((e) => {
    let score = -distance(unit.position, e.position) * 0.5
    score += (1 - e.hp / e.maxHp) * 100  // prefer wounded
    if (e.state === 'retreating' || e.state === 'routed') score += 80
    return { e, score }
  })
  scored.sort((a, b) => b.score - a.score)

  const target = scored[0]?.e ?? enemies[0]
  return { targetId: target.id, moveTarget: null, behavior: 'attack' }
}

// === Helpers ===
function getFlankPosition(_attacker: BattleUnit, target: BattleUnit, rng: SeededRandom): Position {
  // Go behind the target based on their facing direction
  const behindAngle = target.facing + Math.PI + rng.float(-0.4, 0.4)
  const flankDist = 40
  return {
    x: target.position.x + Math.cos(behindAngle) * flankDist,
    y: target.position.y + Math.sin(behindAngle) * flankDist,
  }
}

function getEnemies(unit: BattleUnit, units: BattleUnit[], mode: BattleMode): BattleUnit[] {
  return units.filter((u) => {
    if (u.id === unit.id || u.state === 'dead') return false
    if (mode === 'faction_battle' || mode === 'siege') return u.faction !== unit.faction
    return true
  })
}

function getAllies(unit: BattleUnit, units: BattleUnit[]): BattleUnit[] {
  return units.filter(
    (u) => u.id !== unit.id && u.faction === unit.faction && u.state !== 'dead'
  )
}
