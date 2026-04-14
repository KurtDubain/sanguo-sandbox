import { BattleUnit, BattleMap, Position, WeatherState } from '../../types'
import { BALANCE } from '../../config/balance'
import { TERRAIN_MODIFIERS } from '../../config/balance'
import { distance, moveToward, clampPosition, angle } from '../utils/math'
import { getTerrainAt, isPassable } from '../utils/mapgen'
import { SeededRandom } from '../utils/random'
import { getWeatherModifiers } from './weather'
import { TacticalOrder } from './tacticalAI'
import { findPath, isPathClear } from '../utils/pathfinding'

// ======== Path Cache ========
// Each unit stores: computed waypoints, the goal position, and tick of computation
interface CachedPath {
  waypoints: Position[]  // remaining waypoints (NOT mutated; we track index separately)
  waypointIdx: number
  goalPos: Position
  computedTick: number
}

const pathCache = new Map<string, CachedPath>()

// How long before last-known position is considered "stuck"
const stuckTracker = new Map<string, { x: number; y: number; stuckTicks: number }>()

export function resetPaths() {
  pathCache.clear()
  stuckTracker.clear()
}

const RECOMPUTE_INTERVAL = 25
const GOAL_MOVE_THRESHOLD = 50
const STUCK_THRESHOLD = 15      // if unit hasn't moved > 3px in this many ticks, it's stuck
const STUCK_MOVE_MIN = 3        // minimum movement to not be considered stuck

export function movementSystem(
  units: BattleUnit[],
  map: BattleMap,
  rng: SeededRandom,
  weather: WeatherState,
  tacticalOrders?: Map<string, TacticalOrder>,
): void {
  const wm = getWeatherModifiers(weather)

  for (const unit of units) {
    if (unit.state === 'dead') continue

    unit.currentTerrain = getTerrainAt(map, unit.position.x, unit.position.y)
    const terrainMod = TERRAIN_MODIFIERS[unit.currentTerrain]

    let moveSpeed = BALANCE.BASE_SPEED * (unit.speed / 50) * (terrainMod.passable ? terrainMod.speedMult : 1) * wm.speedMult

    // Speed buffs
    for (const buff of unit.buffs) {
      if (buff.type === 'buff_speed') moveSpeed *= 1 + buff.value * 0.01
    }

    // Fatigue
    if (unit.survivalTicks > BALANCE.FATIGUE_TICK_THRESHOLD) {
      const ft = unit.survivalTicks - BALANCE.FATIGUE_TICK_THRESHOLD
      const pr = Math.max(0.1, 1 - unit.politics * BALANCE.FATIGUE_POLITICS_RESIST)
      moveSpeed *= Math.max(0.5, 1 - ft * BALANCE.FATIGUE_SPEED_PENALTY * pr)
    }

    // ===== Determine goal position =====
    let goalPos: Position | null = null
    let goalIsTarget = false // true if goal is an enemy (not tactical override)

    if (unit.state === 'routed') {
      moveSpeed *= BALANCE.ROUT_SPEED_MULT
      const ne = findNearestEnemy(unit, units)
      if (ne) {
        const away = angle(ne.position, unit.position) + rng.float(-1.0, 1.0)
        goalPos = { x: unit.position.x + Math.cos(away) * 150, y: unit.position.y + Math.sin(away) * 150 }
      }
    } else if (unit.state === 'retreating') {
      moveSpeed *= BALANCE.RETREAT_SPEED_MULT
      const ne = findNearestEnemy(unit, units)
      if (ne) {
        const away = angle(ne.position, unit.position) + rng.float(-0.3, 0.3)
        goalPos = { x: unit.position.x + Math.cos(away) * 150, y: unit.position.y + Math.sin(away) * 150 }
      }
    } else if (unit.targetId) {
      const target = units.find((u) => u.id === unit.targetId)
      if (target && target.state !== 'dead') {
        const dist2 = distance(unit.position, target.position)
        if (target.state === 'retreating' || target.state === 'routed') {
          moveSpeed *= BALANCE.PURSUIT_SPEED_BONUS
        }

        // Tactical AI override
        const tactic = tacticalOrders?.get(unit.id)
        if (tactic?.moveTarget) {
          const tactDist = distance(unit.position, tactic.moveTarget)
          if (tactDist > 8) {
            unit.state = 'moving'
            goalPos = { ...tactic.moveTarget }
          } else if (dist2 <= unit.range) {
            unit.state = 'attacking'
            unit.facing = angle(unit.position, target.position)
          } else {
            unit.state = 'moving'
            goalPos = { ...target.position }
            goalIsTarget = true
          }
        } else if (dist2 > unit.range) {
          unit.state = 'moving'
          goalPos = { ...target.position }
          goalIsTarget = true
        } else {
          unit.state = 'attacking'
          unit.facing = angle(unit.position, target.position)
        }
        if (goalPos) unit.facing = angle(unit.position, goalPos)
      }
    }

    // No target → search
    if (!goalPos && unit.state !== 'attacking' && unit.state !== 'routed' && unit.state !== 'retreating') {
      const ne = findNearestEnemy(unit, units)
      if (ne) {
        unit.state = 'moving'
        moveSpeed *= BALANCE.SEARCH_SPEED_MULT
        goalPos = { ...ne.position }
        goalIsTarget = true
        unit.facing = angle(unit.position, ne.position)
      } else {
        unit.state = 'idle'
      }
    }

    // ===== Execute movement =====
    if (goalPos) {
      const prevPos = { x: unit.position.x, y: unit.position.y }
      const newPos = smartMove(unit, goalPos, goalIsTarget, moveSpeed, map, rng)

      // Clamp and apply
      unit.position = clampPosition(newPos, map.width, map.height)

      // Stuck detection: if unit barely moved, track it
      trackStuck(unit.id, prevPos, unit.position, map, rng)
    }
  }

  // ===== Collision avoidance (spatial hash, throttled) =====
  const tick = units[0]?.survivalTicks ?? 0
  if (tick % 3 === 0) {
    spatialCollision(units, map)
  }
}

// ======== Smart Movement: direct → ray-check → A* → wall-slide ========
function smartMove(
  unit: BattleUnit,
  goal: Position,
  _goalIsTarget: boolean,
  speed: number,
  map: BattleMap,
  rng: SeededRandom,
): Position {
  const pos = unit.position

  // 1) If very close to goal, just step there
  const goalDist = distance(pos, goal)
  if (goalDist < speed) {
    return isPassable(map, goal.x, goal.y) ? goal : pos
  }

  // 2) If we already have a cached A* path, prefer following it
  //    (avoids oscillation between direct and A* each frame)
  const cached = pathCache.get(unit.id)
  const tick = unit.survivalTicks

  if (cached && cached.waypointIdx < cached.waypoints.length) {
    const goalMoved = distance(cached.goalPos, goal)
    const age = tick - cached.computedTick
    if (goalMoved < GOAL_MOVE_THRESHOLD && age < RECOMPUTE_INTERVAL) {
      // Follow existing path
      const result = followPath(pos, goal, cached, speed, map, tick)
      if (result) return result
      // Path exhausted or blocked — fall through to recompute
    }
  }

  // 3) Try direct move: straight line
  const direct = moveToward(pos, goal, speed)
  if (isPassable(map, direct.x, direct.y) && isPathClear(map, pos, goal)) {
    // Clear straight path — no A* needed
    pathCache.delete(unit.id)
    return direct
  }

  // 4) Path is blocked — compute A*
  const wp = findPath(map, pos, goal)
  if (wp && wp.length > 0) {
    const newCache: CachedPath = {
      waypoints: wp,
      waypointIdx: 0,
      goalPos: { ...goal },
      computedTick: tick,
    }
    pathCache.set(unit.id, newCache)
    // Immediately start following
    const result = followPath(pos, goal, newCache, speed, map, tick)
    if (result) return result
  }

  // 5) Fallback: wall-slide
  return wallSlide(pos, goal, speed, map, rng)
}

// Follow cached waypoints, return new position or null if path is exhausted/broken
function followPath(
  pos: Position,
  goal: Position,
  cache: CachedPath,
  speed: number,
  map: BattleMap,
  _tick: number,
): Position | null {
  let idx = cache.waypointIdx

  // Skip waypoints we've already passed
  while (idx < cache.waypoints.length) {
    const wp = cache.waypoints[idx]
    const distToWp = distance(pos, wp)
    if (distToWp < speed * 2) {
      idx++
    } else {
      break
    }
  }

  // Update index
  cache.waypointIdx = idx
  cache.computedTick = cache.computedTick // keep original

  if (idx >= cache.waypoints.length) {
    // Path exhausted — try stepping toward final goal
    pathCache.delete('') // don't actually delete, let it expire
    const step = moveToward(pos, goal, speed)
    if (isPassable(map, step.x, step.y)) return step
    return null
  }

  // Move toward current waypoint
  const wp = cache.waypoints[idx]
  const step = moveToward(pos, wp, speed)
  if (isPassable(map, step.x, step.y)) return step

  // Waypoint blocked — path is broken, need recompute
  pathCache.delete(cache.goalPos.toString()) // clear on next frame
  return null
}

// ======== Wall Slide ========
// When blocked, try moving perpendicular to the wall to slide around it
function wallSlide(
  pos: Position,
  goal: Position,
  speed: number,
  map: BattleMap,
  rng: SeededRandom,
): Position {
  const baseAngle = angle(pos, goal)

  // Try progressively wider angles
  const angles = [
    0.3, -0.3,
    0.6, -0.6,
    0.9, -0.9,
    1.2, -1.2,
    1.5, -1.5,
    Math.PI * 0.6, -Math.PI * 0.6,
    Math.PI * 0.8, -Math.PI * 0.8,
  ]

  // Randomize preference (left vs right)
  if (rng.chance(0.5)) {
    for (let i = 0; i < angles.length - 1; i += 2) {
      [angles[i], angles[i + 1]] = [angles[i + 1], angles[i]]
    }
  }

  // Try each angle at full speed, then half speed
  for (const spd of [speed, speed * 0.5]) {
    for (const da of angles) {
      const a = baseAngle + da
      const cx = pos.x + Math.cos(a) * spd
      const cy = pos.y + Math.sin(a) * spd
      if (isPassable(map, cx, cy)) {
        return { x: cx, y: cy }
      }
    }
  }

  return pos // truly stuck
}

// ======== Stuck Detection & Recovery ========
function trackStuck(
  unitId: string,
  prevPos: Position,
  newPos: Position,
  _map: BattleMap,
  _rng: SeededRandom,
) {
  const moved = distance(prevPos, newPos)
  const tracker = stuckTracker.get(unitId) ?? { x: prevPos.x, y: prevPos.y, stuckTicks: 0 }

  if (moved < STUCK_MOVE_MIN) {
    tracker.stuckTicks++
  } else {
    tracker.stuckTicks = 0
    tracker.x = newPos.x
    tracker.y = newPos.y
  }

  // If stuck, just clear the path cache so a fresh A* is computed next frame
  // with full budget. No teleporting — let wall-slide handle it.
  if (tracker.stuckTicks > STUCK_THRESHOLD) {
    pathCache.delete(unitId)
    tracker.stuckTicks = 0 // reset so it doesn't spam
  }

  stuckTracker.set(unitId, tracker)
}

// ======== Spatial Hash Collision ========
function spatialCollision(units: BattleUnit[], map: BattleMap) {
  const cr = BALANCE.COLLISION_RADIUS
  const cellSize = cr * 2
  const grid = new Map<number, number[]>()
  const aliveIdx: number[] = []

  for (let i = 0; i < units.length; i++) {
    if (units[i].state === 'dead') continue
    aliveIdx.push(i)
    const gx = Math.floor(units[i].position.x / cellSize)
    const gy = Math.floor(units[i].position.y / cellSize)
    const k = gy * 1000 + gx
    const cell = grid.get(k)
    if (cell) cell.push(i); else grid.set(k, [i])
  }

  for (const idx of aliveIdx) {
    const a = units[idx]
    const gx = Math.floor(a.position.x / cellSize)
    const gy = Math.floor(a.position.y / cellSize)
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const neighbors = grid.get((gy + dy) * 1000 + gx + dx)
        if (!neighbors) continue
        for (const j of neighbors) {
          if (j <= idx) continue
          const b = units[j]
          const ddx = a.position.x - b.position.x
          const ddy = a.position.y - b.position.y
          const dSq = ddx * ddx + ddy * ddy
          if (dSq < cr * cr && dSq > 0.01) {
            const d = Math.sqrt(dSq)
            const push = (cr - d) * 0.25
            const nx = ddx / d * push
            const ny = ddy / d * push
            const ax = a.position.x + nx, ay = a.position.y + ny
            const bx = b.position.x - nx, by = b.position.y - ny
            if (isPassable(map, ax, ay)) {
              a.position.x = Math.max(10, Math.min(map.width - 10, ax))
              a.position.y = Math.max(10, Math.min(map.height - 10, ay))
            }
            if (isPassable(map, bx, by)) {
              b.position.x = Math.max(10, Math.min(map.width - 10, bx))
              b.position.y = Math.max(10, Math.min(map.height - 10, by))
            }
          }
        }
      }
    }
  }
}

function findNearestEnemy(unit: BattleUnit, units: BattleUnit[]): BattleUnit | null {
  let nearest: BattleUnit | null = null
  let minDist = Infinity
  for (const other of units) {
    if (other.id === unit.id || other.state === 'dead' || other.faction === unit.faction) continue
    const d = distance(unit.position, other.position)
    if (d < minDist) { minDist = d; nearest = other }
  }
  return nearest
}
