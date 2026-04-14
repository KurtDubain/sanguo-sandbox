import { General, BattleUnit, BattleMode, BattleMap, Position } from '../../types'
import { BALANCE } from '../../config/balance'
import { SeededRandom } from './random'
import { isPassable } from './mapgen'

export function createBattleUnit(
  general: General,
  position: Position,
): BattleUnit {
  const commandBonus = 1 + general.command * BALANCE.COMMAND_EFFICIENCY
  const achievementMorale = general.achievement * BALANCE.ACHIEVEMENT_PRESTIGE * 100

  return {
    id: general.id, generalId: general.id, name: general.name,
    faction: general.faction, troopType: general.troopType, color: general.color,
    command: general.command, strategy: general.strategy, politics: general.politics,
    martial: general.martial, achievement: general.achievement, charisma: general.charisma,
    maxHp: Math.round(general.hp * commandBonus),
    hp: Math.round(general.hp * commandBonus),
    atk: general.atk, def: general.def, speed: general.speed,
    morale: Math.min(100, general.morale + achievementMorale),
    maxMorale: Math.min(100, general.morale + achievementMorale),
    range: general.range, vision: general.vision,
    position: { ...position }, targetId: null, state: 'idle', facing: 0,
    personality: { ...general.personality },
    skills: general.skills.map((s) => ({ skillId: s.id, cooldownRemaining: Math.floor(s.cooldown * 0.3) })),
    buffs: [],
    damageDealt: 0, damageTaken: 0, kills: 0, survivalTicks: 0, currentTerrain: 'plain',
  }
}

const DEPLOY_ORDER: Record<string, number> = {
  shield: 0, spearman: 1, infantry: 2, cavalry: 3, archer: 4,
}

const SPAWN_MARGIN = 30

export function generateSpawnPositions(
  generals: General[],
  mode: BattleMode,
  map: BattleMap,
  rng: SeededRandom,
  defendingFaction?: string,
): Position[] {
  let positions: Position[]
  if (mode === 'siege' && defendingFaction) {
    positions = generateSiegeSpawns(generals, map, rng, defendingFaction)
  } else if (mode === 'faction_battle') {
    positions = generateFactionSpawns(generals, map, rng)
  } else {
    positions = generateFFASpawns(generals, map, rng)
  }

  // Validate every position is passable
  for (let i = 0; i < positions.length; i++) {
    positions[i] = ensurePassable(positions[i], map, rng)
  }

  return positions
}

function ensurePassable(pos: Position, map: BattleMap, rng: SeededRandom): Position {
  if (isPassable(map, pos.x, pos.y)) return pos
  for (let radius = 16; radius < 250; radius += 12) {
    for (let attempt = 0; attempt < 12; attempt++) {
      const angle = (Math.PI * 2 * attempt) / 12 + rng.float(-0.2, 0.2)
      const x = pos.x + Math.cos(angle) * radius
      const y = pos.y + Math.sin(angle) * radius
      if (x > SPAWN_MARGIN && x < map.width - SPAWN_MARGIN &&
          y > SPAWN_MARGIN && y < map.height - SPAWN_MARGIN &&
          isPassable(map, x, y)) {
        return { x, y }
      }
    }
  }
  return { x: map.width / 2, y: map.height / 2 }
}

function generateFactionSpawns(
  generals: General[],
  map: BattleMap,
  rng: SeededRandom,
): Position[] {
  const positions: Position[] = new Array(generals.length)
  const factions = [...new Set(generals.map((g) => g.faction))]
  const spawnZones = getSpawnZones(factions.length, map.width, map.height, rng)
  const factionZones: Record<string, { cx: number; cy: number; angle: number }> = {}
  factions.forEach((f, i) => { factionZones[f] = spawnZones[i] })

  for (const faction of factions) {
    const zone = factionZones[faction]
    const factionGenerals = generals
      .map((g, idx) => ({ g, idx }))
      .filter(({ g }) => g.faction === faction)
      .sort((a, b) => (DEPLOY_ORDER[a.g.troopType] ?? 2) - (DEPLOY_ORDER[b.g.troopType] ?? 2))

    const faceAngle = zone.angle
    const perp = faceAngle + Math.PI / 2

    // Dynamic spacing based on unit count — spread out more with more units
    const unitCount = factionGenerals.length
    const rowSpacing = 28 + Math.floor(unitCount / 8) * 4
    const colSpacing = 26 + Math.floor(unitCount / 8) * 3
    const maxCols = Math.min(7, Math.ceil(Math.sqrt(unitCount * 1.5)))

    factionGenerals.forEach(({ idx }, i) => {
      const row = Math.floor(i / maxCols)
      const col = i % maxCols
      const colOffset = col - (maxCols - 1) / 2
      const x = zone.cx + Math.cos(perp) * colOffset * colSpacing + Math.cos(faceAngle) * row * rowSpacing
      const y = zone.cy + Math.sin(perp) * colOffset * colSpacing + Math.sin(faceAngle) * row * rowSpacing
      positions[idx] = {
        x: clamp(x + rng.float(-8, 8), SPAWN_MARGIN, map.width - SPAWN_MARGIN),
        y: clamp(y + rng.float(-8, 8), SPAWN_MARGIN, map.height - SPAWN_MARGIN),
      }
    })
  }

  return positions
}

function generateSiegeSpawns(
  generals: General[],
  map: BattleMap,
  rng: SeededRandom,
  defendingFaction: string,
): Position[] {
  const positions: Position[] = new Array(generals.length)
  const cx = map.width / 2
  const cy = map.height / 2
  const m = SPAWN_MARGIN + 30

  const defenders = generals.map((g, i) => ({ g, i })).filter(({ g }) => g.faction === defendingFaction)
  const attackers = generals.map((g, i) => ({ g, i })).filter(({ g }) => g.faction !== defendingFaction)

  defenders.forEach(({ i }, idx) => {
    const angle = (Math.PI * 2 * idx) / Math.max(1, defenders.length)
    const r = 20 + (idx % 3) * 18
    positions[i] = {
      x: clamp(cx + Math.cos(angle) * r + rng.float(-10, 10), m, map.width - m),
      y: clamp(cy + Math.sin(angle) * r + rng.float(-10, 10), m, map.height - m),
    }
  })

  const edgePositions = [
    { x: m, y: cy },
    { x: map.width - m, y: cy },
    { x: cx, y: m },
    { x: cx, y: map.height - m },
  ]

  attackers.forEach(({ i }, idx) => {
    const edge = edgePositions[idx % edgePositions.length]
    const spread = 35
    positions[i] = {
      x: clamp(edge.x + rng.float(-spread, spread), m, map.width - m),
      y: clamp(edge.y + rng.float(-spread, spread), m, map.height - m),
    }
  })

  return positions
}

function generateFFASpawns(
  generals: General[],
  map: BattleMap,
  rng: SeededRandom,
): Position[] {
  const positions: Position[] = []
  const margin = SPAWN_MARGIN + 40
  const n = generals.length
  const angleStep = (2 * Math.PI) / n
  const cx = map.width / 2
  const cy = map.height / 2
  const rx = (map.width - margin * 2) * 0.42
  const ry = (map.height - margin * 2) * 0.42

  for (let i = 0; i < n; i++) {
    const a = angleStep * i + rng.float(-0.2, 0.2)
    const jr = rng.float(0.75, 1.0)
    positions.push({
      x: clamp(cx + Math.cos(a) * rx * jr + rng.float(-15, 15), margin, map.width - margin),
      y: clamp(cy + Math.sin(a) * ry * jr + rng.float(-15, 15), margin, map.height - margin),
    })
  }
  return positions
}

function getSpawnZones(
  count: number, w: number, h: number, rng: SeededRandom,
): { cx: number; cy: number; angle: number }[] {
  const cx = w / 2, cy = h / 2
  // Edge margin: keep units close to map borders for maximum separation
  const edgeX = SPAWN_MARGIN + 50
  const edgeY = SPAWN_MARGIN + 50

  if (count <= 2) {
    return [
      { cx: edgeX, cy: cy + rng.float(-30, 30), angle: 0 },
      { cx: w - edgeX, cy: cy + rng.float(-30, 30), angle: Math.PI },
    ]
  }
  if (count <= 4) {
    const zones = [
      { cx: edgeX, cy: edgeY, angle: Math.PI * 0.25 },
      { cx: w - edgeX, cy: edgeY, angle: Math.PI * 0.75 },
      { cx: edgeX, cy: h - edgeY, angle: -Math.PI * 0.25 },
      { cx: w - edgeX, cy: h - edgeY, angle: -Math.PI * 0.75 },
    ]
    rng.shuffle(zones)
    return zones.slice(0, count)
  }

  // 5+ factions: distribute around map edges (not circular center)
  // Use a mix of corners and edge midpoints
  const edgeSlots: { cx: number; cy: number; angle: number }[] = [
    { cx: edgeX, cy: edgeY, angle: Math.PI * 0.25 },          // TL
    { cx: w - edgeX, cy: edgeY, angle: Math.PI * 0.75 },      // TR
    { cx: edgeX, cy: h - edgeY, angle: -Math.PI * 0.25 },     // BL
    { cx: w - edgeX, cy: h - edgeY, angle: -Math.PI * 0.75 }, // BR
    { cx: edgeX, cy: cy, angle: 0 },                           // Left mid
    { cx: w - edgeX, cy: cy, angle: Math.PI },                 // Right mid
    { cx: cx, cy: edgeY, angle: Math.PI * 0.5 },              // Top mid
    { cx: cx, cy: h - edgeY, angle: -Math.PI * 0.5 },         // Bottom mid
    { cx: cx * 0.5, cy: cy * 0.5, angle: Math.PI * 0.25 },   // TL inner
    { cx: w - cx * 0.5, cy: h - cy * 0.5, angle: -Math.PI * 0.75 }, // BR inner
  ]

  // Return enough slots, cycling if needed
  const result: { cx: number; cy: number; angle: number }[] = []
  for (let i = 0; i < count; i++) {
    result.push(edgeSlots[i % edgeSlots.length])
  }
  return result
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}
