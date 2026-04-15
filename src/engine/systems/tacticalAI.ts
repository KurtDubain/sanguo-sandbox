import { BattleUnit, BattleMode, Position } from '../../types'
import { distance, angle } from '../utils/math'
import { SeededRandom } from '../utils/random'

export interface TacticalOrder {
  targetId: string | null
  moveTarget: Position | null
  behavior: 'attack' | 'kite' | 'flank' | 'protect' | 'hold'
}

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

// === Archer: stay behind allies, kite aggressively, retreat early ===
function archerTactic(
  unit: BattleUnit,
  enemies: BattleUnit[],
  allies: BattleUnit[],
  _rng: SeededRandom,
): TacticalOrder {
  const nearest = enemies.reduce((a, b) =>
    distance(unit.position, a.position) < distance(unit.position, b.position) ? a : b
  )
  const dist = distance(unit.position, nearest.position)

  // Check if any melee enemy is approaching (cavalry/infantry heading toward us)
  const approachingMelee = enemies.filter(
    (e) => e.range <= 60 && distance(unit.position, e.position) < unit.range * 0.7
  )

  // If melee enemy is approaching, retreat toward nearest ally cluster
  if (approachingMelee.length > 0) {
    // Find the center of friendly melee units (they can protect us)
    const meleeAllies = allies.filter((a) => a.range <= 60 && a.state !== 'routed')
    let retreatTarget: Position

    if (meleeAllies.length > 0) {
      // Retreat toward our own melee line
      const cx = meleeAllies.reduce((s, a) => s + a.position.x, 0) / meleeAllies.length
      const cy = meleeAllies.reduce((s, a) => s + a.position.y, 0) / meleeAllies.length
      // Position behind the melee line relative to enemy
      const awayAngle = angle(nearest.position, { x: cx, y: cy })
      retreatTarget = {
        x: cx + Math.cos(awayAngle) * 60,
        y: cy + Math.sin(awayAngle) * 60,
      }
    } else {
      // No allies, just run away
      const awayAngle = angle(nearest.position, unit.position)
      retreatTarget = {
        x: unit.position.x + Math.cos(awayAngle) * unit.range * 0.6,
        y: unit.position.y + Math.sin(awayAngle) * unit.range * 0.6,
      }
    }

    // Still shoot at the nearest enemy while retreating
    const inRange = enemies.filter((e) => distance(unit.position, e.position) <= unit.range)
    const shootTarget = inRange.length > 0
      ? inRange.reduce((a, b) => a.hp / a.maxHp < b.hp / b.maxHp ? a : b)
      : nearest

    return { targetId: shootTarget.id, moveTarget: retreatTarget, behavior: 'kite' }
  }

  // Safe — shoot the weakest in range
  if (dist <= unit.range * 1.1) {
    const inRange = enemies.filter((e) => distance(unit.position, e.position) <= unit.range)
    if (inRange.length > 0) {
      const weakest = inRange.reduce((a, b) => a.hp / a.maxHp < b.hp / b.maxHp ? a : b)
      return { targetId: weakest.id, moveTarget: null, behavior: 'attack' }
    }
  }

  // Move closer but maintain distance
  const idealDist = unit.range * 0.75
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

// === Cavalry: don't suicide into enemy blob, wait for opening ===
function cavalryTactic(
  unit: BattleUnit,
  enemies: BattleUnit[],
  _allies: BattleUnit[],
  rng: SeededRandom,
): TacticalOrder {
  // Low morale: don't charge deep
  if (unit.morale < 40) {
    const nearest = enemies.reduce((a, b) =>
      distance(unit.position, a.position) < distance(unit.position, b.position) ? a : b
    )
    return { targetId: nearest.id, moveTarget: null, behavior: 'attack' }
  }

  // Count how many enemies are near (don't charge into a blob of 5+)
  const nearbyEnemyCount = enemies.filter(
    (e) => distance(unit.position, e.position) < 100
  ).length

  // If already surrounded by 4+, stop charging and fight defensively
  if (nearbyEnemyCount >= 4) {
    const weakest = enemies
      .filter((e) => distance(unit.position, e.position) < 80)
      .reduce((a, b) => a.hp < b.hp ? a : b, enemies[0])
    return { targetId: weakest.id, moveTarget: null, behavior: 'attack' }
  }

  // Priority: hunt enemy archers, but only if they're isolated (not behind a wall of melee)
  const enemyArchers = enemies.filter((e) =>
    e.troopType === 'archer' && distance(unit.position, e.position) < 250
  )
  if (enemyArchers.length > 0 && unit.strategy > 50) {
    // Check if the archer is protected by melee units
    const target = enemyArchers.reduce((a, b) =>
      distance(unit.position, a.position) < distance(unit.position, b.position) ? a : b
    )
    const guardsNearArcher = enemies.filter(
      (e) => e.range <= 60 && distance(e.position, target.position) < 60
    ).length

    // Only go for archer if they have < 2 guards nearby
    if (guardsNearArcher < 2) {
      const flankPos = getFlankPosition(unit, target, rng)
      return { targetId: target.id, moveTarget: flankPos, behavior: 'flank' }
    }
  }

  // Priority: flank enemies already engaged with our allies
  const engaged = enemies.filter((e) =>
    e.state === 'attacking' && e.targetId !== unit.id && distance(unit.position, e.position) < 180
  )
  if (engaged.length > 0 && rng.chance(0.4 + unit.strategy * 0.003)) {
    const target = engaged.reduce((a, b) =>
      distance(unit.position, a.position) < distance(unit.position, b.position) ? a : b
    )
    const flankPos = getFlankPosition(unit, target, rng)
    return { targetId: target.id, moveTarget: flankPos, behavior: 'flank' }
  }

  // Default: attack nearest
  const nearest = enemies.reduce((a, b) =>
    distance(unit.position, a.position) < distance(unit.position, b.position) ? a : b
  )
  return { targetId: nearest.id, moveTarget: null, behavior: 'attack' }
}

// === Shield: actively seek archers to protect, position further ahead ===
function shieldTactic(
  unit: BattleUnit,
  enemies: BattleUnit[],
  allies: BattleUnit[],
  _rng: SeededRandom,
): TacticalOrder {
  // Find friendly archers in wider range (200px instead of 150)
  const nearbyArchers = allies.filter(
    (a) => a.troopType === 'archer' && distance(unit.position, a.position) < 200
  )

  if (nearbyArchers.length > 0) {
    const archer = nearbyArchers[0]
    const nearestEnemy = enemies.reduce((a, b) =>
      distance(archer.position, a.position) < distance(archer.position, b.position) ? a : b
    )
    // Position 50px ahead of archer toward enemy (was 30, too close)
    const guardAngle = angle(archer.position, nearestEnemy.position)
    const guardPos = {
      x: archer.position.x + Math.cos(guardAngle) * 50,
      y: archer.position.y + Math.sin(guardAngle) * 50,
    }
    return {
      targetId: nearestEnemy.id,
      moveTarget: guardPos,
      behavior: 'protect',
    }
  }

  // No archer — find any ranged ally to protect
  const rangedAllies = allies.filter((a) => a.range > 60 && distance(unit.position, a.position) < 200)
  if (rangedAllies.length > 0) {
    const ranged = rangedAllies[0]
    const nearestEnemy = enemies.reduce((a, b) =>
      distance(ranged.position, a.position) < distance(ranged.position, b.position) ? a : b
    )
    const guardAngle = angle(ranged.position, nearestEnemy.position)
    return {
      targetId: nearestEnemy.id,
      moveTarget: {
        x: ranged.position.x + Math.cos(guardAngle) * 45,
        y: ranged.position.y + Math.sin(guardAngle) * 45,
      },
      behavior: 'protect',
    }
  }

  // No one to protect — hold and fight
  const nearest = enemies.reduce((a, b) =>
    distance(unit.position, a.position) < distance(unit.position, b.position) ? a : b
  )
  return { targetId: nearest.id, moveTarget: null, behavior: 'hold' }
}

// === Spearman: intercept cavalry, form front line ===
function spearmanTactic(
  unit: BattleUnit,
  enemies: BattleUnit[],
  _allies: BattleUnit[],
  _rng: SeededRandom,
): TacticalOrder {
  // Priority: intercept enemy cavalry heading toward our archers
  const enemyCav = enemies.filter((e) => e.troopType === 'cavalry' && distance(unit.position, e.position) < 200)
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

// === Infantry: focus weak targets, form the main battle line ===
function infantryTactic(
  unit: BattleUnit,
  enemies: BattleUnit[],
  _allies: BattleUnit[],
  _rng: SeededRandom,
): TacticalOrder {
  const scored = enemies.map((e) => {
    let score = -distance(unit.position, e.position) * 0.5
    score += (1 - e.hp / e.maxHp) * 100
    if (e.state === 'retreating' || e.state === 'routed') score += 80
    return { e, score }
  })
  scored.sort((a, b) => b.score - a.score)

  const target = scored[0]?.e ?? enemies[0]
  return { targetId: target.id, moveTarget: null, behavior: 'attack' }
}

// === Helpers ===
function getFlankPosition(_attacker: BattleUnit, target: BattleUnit, rng: SeededRandom): Position {
  const behindAngle = target.facing + Math.PI + rng.float(-0.4, 0.4)
  return {
    x: target.position.x + Math.cos(behindAngle) * 40,
    y: target.position.y + Math.sin(behindAngle) * 40,
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
