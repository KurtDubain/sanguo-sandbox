// Siege mode: tower attacks, control point capture, siege victory

import { BattleUnit, SiegeState, Tower, GameEvent, Faction } from '../../types'
import { distance } from '../utils/math'
import { SeededRandom } from '../utils/random'

export function createSiegeState(
  defendingFaction: Faction,
  attackingFactions: Faction[],
  mapWidth: number,
  mapHeight: number,
): SiegeState {
  const cx = mapWidth / 2
  const cy = mapHeight / 2
  const wallHalfW = mapWidth * 0.18
  const wallHalfH = mapHeight * 0.2

  const towers: Tower[] = [
    makeTower('tower_nw', cx - wallHalfW, cy - wallHalfH, defendingFaction),
    makeTower('tower_ne', cx + wallHalfW, cy - wallHalfH, defendingFaction),
    makeTower('tower_sw', cx - wallHalfW, cy + wallHalfH, defendingFaction),
    makeTower('tower_se', cx + wallHalfW, cy + wallHalfH, defendingFaction),
  ]

  return {
    defendingFaction,
    attackingFactions,
    towers,
    controlPoint: { x: cx, y: cy, radius: 60 },
    controlTicks: 0,
    controlTicksNeeded: 200,
    defenseTimeLimit: 4000,
  }
}

function makeTower(id: string, x: number, y: number, faction: Faction): Tower {
  return {
    id, x, y,
    hp: 500,
    maxHp: 500,
    range: 130,
    damage: 35,
    cooldown: 25,
    lastFireTick: 0,
    faction,
    destroyed: false,
  }
}

export function siegeSystem(
  units: BattleUnit[],
  siege: SiegeState,
  tick: number,
  _rng: SeededRandom,
): GameEvent[] {
  const events: GameEvent[] = []

  // === Tower attacks ===
  for (const tower of siege.towers) {
    if (tower.destroyed) continue

    // Find nearest attacker in range
    if (tick - tower.lastFireTick < tower.cooldown) continue

    let nearestEnemy: BattleUnit | null = null
    let nearestDist = Infinity

    for (const unit of units) {
      if (unit.state === 'dead') continue
      if (unit.faction === tower.faction) continue // don't shoot allies
      const d = distance({ x: tower.x, y: tower.y }, unit.position)
      if (d < tower.range && d < nearestDist) {
        nearestDist = d
        nearestEnemy = unit
      }
    }

    if (nearestEnemy) {
      tower.lastFireTick = tick
      nearestEnemy.hp -= tower.damage
      nearestEnemy.damageTaken += tower.damage
      nearestEnemy.morale -= 2

      events.push({
        tick, type: 'attack',
        sourceId: tower.id,
        targetId: nearestEnemy.id,
        value: tower.damage,
        message: `箭塔射击 ${nearestEnemy.name}，造成 ${tower.damage} 点伤害`,
      })

      if (nearestEnemy.hp <= 0) {
        nearestEnemy.hp = 0
        nearestEnemy.state = 'dead'
        events.push({
          tick, type: 'kill',
          sourceId: tower.id,
          targetId: nearestEnemy.id,
          message: `箭塔击杀了 ${nearestEnemy.name}！`,
        })
      }
    }
  }

  // === Towers can be attacked by nearby melee units ===
  for (const tower of siege.towers) {
    if (tower.destroyed) continue

    for (const unit of units) {
      if (unit.state === 'dead' || unit.faction === tower.faction) continue
      const d = distance({ x: tower.x, y: tower.y }, unit.position)
      if (d < 50 && unit.range <= 60) {
        // Melee unit attacks tower
        const dmg = Math.round(unit.atk * 0.3)
        tower.hp -= dmg

        if (tower.hp <= 0) {
          tower.hp = 0
          tower.destroyed = true
          unit.kills++
          events.push({
            tick, type: 'kill',
            sourceId: unit.id,
            targetId: tower.id,
            message: `${unit.name} 摧毁了一座箭塔！`,
          })
        }
        break // one attacker per tower per tick
      }
    }
  }

  // === Control point capture ===
  const cp = siege.controlPoint
  const attackersInZone = units.filter(
    (u) => u.state !== 'dead' &&
           siege.attackingFactions.includes(u.faction) &&
           distance(u.position, { x: cp.x, y: cp.y }) < cp.radius
  )
  const defendersInZone = units.filter(
    (u) => u.state !== 'dead' &&
           u.faction === siege.defendingFaction &&
           distance(u.position, { x: cp.x, y: cp.y }) < cp.radius
  )

  if (attackersInZone.length >= 3 && defendersInZone.length === 0) {
    siege.controlTicks++
    if (siege.controlTicks === 1) {
      events.push({
        tick, type: 'danger_zone',
        message: `⚔ 攻方正在占领城心！(${siege.controlTicks}/${siege.controlTicksNeeded})`,
      })
    }
    if (siege.controlTicks % 50 === 0) {
      events.push({
        tick, type: 'danger_zone',
        message: `⚔ 占领进度 ${siege.controlTicks}/${siege.controlTicksNeeded}`,
      })
    }
  } else {
    if (siege.controlTicks > 0) {
      siege.controlTicks = Math.max(0, siege.controlTicks - 2) // decay if contested
    }
  }

  // === Guide attackers toward gates ===
  const wallHalfW2 = cp.x * 0.36
  const wallHalfH2 = cp.y * 0.4

  // Gate positions
  const gates = [
    { x: cp.x, y: cp.y - wallHalfH2 },
    { x: cp.x, y: cp.y + wallHalfH2 },
    { x: cp.x - wallHalfW2, y: cp.y },
    { x: cp.x + wallHalfW2, y: cp.y },
  ]

  for (const unit of units) {
    if (unit.state === 'dead' || unit.state === 'routed' || unit.state === 'retreating') continue
    if (unit.faction === siege.defendingFaction) continue

    // Check if unit is inside the castle
    const inside = Math.abs(unit.position.x - cp.x) < wallHalfW2 &&
                   Math.abs(unit.position.y - cp.y) < wallHalfH2
    if (inside) continue // already inside, normal combat

    // Outside castle: force move toward nearest gate
    const nearestGate = gates.reduce((a, b) =>
      distance(unit.position, a) < distance(unit.position, b) ? a : b
    )
    const gateDist = distance(unit.position, nearestGate)

    if (gateDist > 20) {
      // Override target: clear enemy target, move toward gate
      unit.targetId = null
      unit.state = 'moving'
      unit.facing = Math.atan2(nearestGate.y - unit.position.y, nearestGate.x - unit.position.x)
    }
  }

  return events
}

// Get nearest gate for a siege attacker (for external systems)
export function getNearestGate(siege: SiegeState, pos: { x: number; y: number }): { x: number; y: number } {
  const cp = siege.controlPoint
  const wallHalfW = cp.x * 0.36
  const wallHalfH = cp.y * 0.4
  const gatePositions = [
    { x: cp.x, y: cp.y - wallHalfH },
    { x: cp.x, y: cp.y + wallHalfH },
    { x: cp.x - wallHalfW, y: cp.y },
    { x: cp.x + wallHalfW, y: cp.y },
  ]
  return gatePositions.reduce((a, b) =>
    distance(pos, a) < distance(pos, b) ? a : b
  )
}

// Siege victory check
export function checkSiegeVictory(
  units: BattleUnit[],
  siege: SiegeState,
  tick: number,
): { winner: 'attacker' | 'defender' | null; message: string } {
  const attackersAlive = units.filter(
    (u) => u.state !== 'dead' && siege.attackingFactions.includes(u.faction)
  )
  const defendersAlive = units.filter(
    (u) => u.state !== 'dead' && u.faction === siege.defendingFaction
  )

  // Attackers win: captured control point
  if (siege.controlTicks >= siege.controlTicksNeeded) {
    return { winner: 'attacker', message: '攻方占领城心，攻城成功！' }
  }

  // Attackers win: all defenders eliminated
  if (defendersAlive.length === 0) {
    return { winner: 'attacker', message: '守方全军覆没，城池陷落！' }
  }

  // Defenders win: all attackers eliminated
  if (attackersAlive.length === 0) {
    return { winner: 'defender', message: '攻方全军覆没，守城成功！' }
  }

  // Defenders win: survived the time limit
  if (tick >= siege.defenseTimeLimit) {
    return { winner: 'defender', message: `守方坚守 ${siege.defenseTimeLimit} 回合，守城成功！` }
  }

  return { winner: null, message: '' }
}
