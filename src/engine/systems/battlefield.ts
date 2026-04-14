import { BattleUnit, SupplyPoint, DangerZone, GameEvent } from '../../types'
import { distance } from '../utils/math'
import { SeededRandom } from '../utils/random'

// Create initial supply points
export function createSupplyPoints(
  mapWidth: number,
  mapHeight: number,
  rng: SeededRandom,
): SupplyPoint[] {
  const count = rng.int(2, 4)
  const points: SupplyPoint[] = []
  for (let i = 0; i < count; i++) {
    points.push({
      x: rng.float(mapWidth * 0.15, mapWidth * 0.85),
      y: rng.float(mapHeight * 0.15, mapHeight * 0.85),
      radius: 40,
      healPerTick: 0.8,
      moralePerTick: 0.3,
      active: true,
    })
  }
  return points
}

// Create initial danger zone
export function createDangerZone(mapWidth: number, mapHeight: number): DangerZone {
  return {
    centerX: mapWidth / 2,
    centerY: mapHeight / 2,
    currentRadius: Math.max(mapWidth, mapHeight), // starts covering everything
    targetRadius: 80,
    shrinkRate: 0.08,
    damagePerTick: 1.5,
    active: false, // activates after tick 800
  }
}

// Process supply points: heal and boost morale for nearby units
export function supplySystem(
  units: BattleUnit[],
  supplyPoints: SupplyPoint[],
  tick: number,
): GameEvent[] {
  const events: GameEvent[] = []

  for (const sp of supplyPoints) {
    if (!sp.active) continue

    // Deactivate supply after some time
    if (tick > 2000) {
      sp.active = false
      continue
    }

    for (const unit of units) {
      if (unit.state === 'dead') continue
      const dist = distance(unit.position, { x: sp.x, y: sp.y })
      if (dist <= sp.radius) {
        unit.hp = Math.min(unit.maxHp, unit.hp + sp.healPerTick)
        unit.morale = Math.min(unit.maxMorale, unit.morale + sp.moralePerTick)
      }
    }
  }

  return events
}

// Process danger zone: shrink circle and damage units outside
export function dangerZoneSystem(
  units: BattleUnit[],
  zone: DangerZone,
  tick: number,
): GameEvent[] {
  const events: GameEvent[] = []

  // Activate after tick 800
  if (tick < 800) return events
  if (!zone.active) {
    zone.active = true
    events.push({
      tick,
      type: 'danger_zone',
      message: '⚠ 战场开始缩圈！安全区域正在缩小！',
    })
  }

  // Shrink
  if (zone.currentRadius > zone.targetRadius) {
    zone.currentRadius -= zone.shrinkRate
    zone.currentRadius = Math.max(zone.targetRadius, zone.currentRadius)
  }

  // Damage units outside the zone
  for (const unit of units) {
    if (unit.state === 'dead') continue
    const dist = distance(unit.position, { x: zone.centerX, y: zone.centerY })
    if (dist > zone.currentRadius) {
      unit.hp -= zone.damagePerTick
      unit.morale -= 0.2
      if (unit.hp <= 0) {
        unit.hp = 0
        unit.state = 'dead'
        events.push({
          tick,
          type: 'danger_zone',
          sourceId: unit.id,
          message: `${unit.name} 被毒圈吞噬！`,
        })
      }
    }
  }

  return events
}
