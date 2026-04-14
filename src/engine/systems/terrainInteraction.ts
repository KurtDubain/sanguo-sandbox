// Terrain interaction: fire spread in forests, rain flooding, mountain ambush

import { BattleMap, BattleUnit, GameEvent, WeatherState } from '../../types'
import { distance } from '../utils/math'
import { SeededRandom } from '../utils/random'

interface ActiveFire {
  col: number
  row: number
  age: number
  maxAge: number
}

const activeFires: ActiveFire[] = []

export function resetTerrainInteraction() {
  activeFires.length = 0
}

export function terrainInteractionSystem(
  units: BattleUnit[],
  map: BattleMap,
  weather: WeatherState,
  tick: number,
  rng: SeededRandom,
): GameEvent[] {
  const events: GameEvent[] = []

  // === Forest fire spread ===
  // Age and remove expired fires
  for (let i = activeFires.length - 1; i >= 0; i--) {
    activeFires[i].age++
    if (activeFires[i].age >= activeFires[i].maxAge) {
      // Fire burns out — convert to plain
      const f = activeFires[i]
      if (f.row >= 0 && f.row < map.terrain.length && f.col >= 0 && f.col < map.terrain[0].length) {
        map.terrain[f.row][f.col] = 'plain'
      }
      activeFires.splice(i, 1)
    }
  }

  // Spread fire to adjacent forest cells (capped at 80 active fires max)
  const MAX_FIRES = 80
  if (tick % 15 === 0 && activeFires.length > 0 && activeFires.length < MAX_FIRES) {
    const newFires: ActiveFire[] = []
    const fireSet = new Set(activeFires.map((f) => `${f.col},${f.row}`))
    for (const fire of activeFires) {
      if (activeFires.length + newFires.length >= MAX_FIRES) break
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
      for (const [dx, dy] of dirs) {
        const nc = fire.col + dx
        const nr = fire.row + dy
        if (nr >= 0 && nr < map.terrain.length && nc >= 0 && nc < map.terrain[0].length) {
          if (map.terrain[nr][nc] === 'forest') {
            // Wind increases spread chance, rain decreases
            let spreadChance = 0.12
            if (weather.type === 'wind') spreadChance += 0.15 * weather.intensity
            if (weather.type === 'rain') spreadChance -= 0.1 * weather.intensity
            if (rng.chance(Math.max(0, spreadChance))) {
              const key = `${nc},${nr}`
              if (!fireSet.has(key)) {
                newFires.push({ col: nc, row: nr, age: 0, maxAge: rng.int(40, 80) })
                fireSet.add(key)
              }
            }
          }
        }
      }
    }
    activeFires.push(...newFires)
    if (newFires.length > 0) {
      events.push({
        tick, type: 'skill_trigger',
        message: `火势蔓延！${newFires.length} 处森林起火`,
      })
    }
  }

  // Damage units standing in fire
  for (const fire of activeFires) {
    const fx = fire.col * map.cellSize + map.cellSize / 2
    const fy = fire.row * map.cellSize + map.cellSize / 2
    for (const unit of units) {
      if (unit.state === 'dead') continue
      if (distance(unit.position, { x: fx, y: fy }) < map.cellSize * 1.2) {
        unit.hp -= 1.5
        unit.morale -= 0.3
      }
    }
  }

  // === Rain flooding: rivers widen slightly during rain (heavily throttled) ===
  if (weather.type === 'rain' && tick % 200 === 0 && weather.intensity > 0.6) {
    let flooded = 0
    const maxFlood = 5 // max cells flooded per check
    for (let row = 0; row < map.terrain.length && flooded < maxFlood; row++) {
      for (let col = 0; col < map.terrain[0].length && flooded < maxFlood; col++) {
        if (map.terrain[row][col] !== 'river') continue
        // Check neighbors — if plain, small chance to flood
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
        for (const [dx, dy] of dirs) {
          const nr = row + dy
          const nc = col + dx
          if (nr >= 0 && nr < map.terrain.length && nc >= 0 && nc < map.terrain[0].length) {
            if (map.terrain[nr][nc] === 'plain' && rng.chance(0.03)) {
              map.terrain[nr][nc] = 'river'
              flooded++
            }
          }
        }
      }
    }
    if (flooded > 0) {
      events.push({
        tick, type: 'weather_change',
        message: `大雨导致河水上涨，${flooded} 处被淹没！`,
      })
    }
  }

  // === Mountain edge advantage: units at the edge of mountains get defense bonus ===
  if (tick % 20 === 0) {
    for (const unit of units) {
      if (unit.state === 'dead') continue
      const col = Math.floor(unit.position.x / map.cellSize)
      const row = Math.floor(unit.position.y / map.cellSize)
      // Check if adjacent to mountain
      let nearMountain = false
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
      for (const [dx, dy] of dirs) {
        const nr = row + dy
        const nc = col + dx
        if (nr >= 0 && nr < map.terrain.length && nc >= 0 && nc < map.terrain[0].length) {
          if (map.terrain[nr][nc] === 'mountain') {
            nearMountain = true
            break
          }
        }
      }
      if (nearMountain && !unit.buffs.some((b) => b.sourceId === 'mountain_edge')) {
        unit.buffs.push({
          type: 'buff_def', value: 15, remainingTicks: 22, sourceId: 'mountain_edge',
        })
      }
    }
  }

  return events
}

// Called when a fire skill hits forest terrain
export function igniteForest(map: BattleMap, x: number, y: number, radius: number) {
  const col = Math.floor(x / map.cellSize)
  const row = Math.floor(y / map.cellSize)
  const cellRadius = Math.ceil(radius / map.cellSize)

  for (let dy = -cellRadius; dy <= cellRadius; dy++) {
    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      const nc = col + dx
      const nr = row + dy
      if (nr >= 0 && nr < map.terrain.length && nc >= 0 && nc < map.terrain[0].length) {
        if (map.terrain[nr][nc] === 'forest') {
          if (!activeFires.some((f) => f.col === nc && f.row === nr)) {
            activeFires.push({ col: nc, row: nr, age: 0, maxAge: 60 })
          }
        }
      }
    }
  }
}

export function getActiveFires(): ActiveFire[] {
  return activeFires
}
