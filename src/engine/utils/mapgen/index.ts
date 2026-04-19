import { BattleMap, TerrainType } from '../../../types'
import { BALANCE } from '../../../config/balance'
import { TERRAIN_MODIFIERS } from '../../../config/balance'
import { SeededRandom } from '../random'

export type MapTemplate = 'valley' | 'crossroads' | 'fortress' | 'plains' | 'river_delta' | 'mountain_pass' | 'siege_castle' | 'changban' | 'chibi' | 'hulao' | 'jieting' | 'twin_lakes' | 'canyon_bridge' | 'three_kingdoms' | 'swamp' | 'labyrinth' | 'islands' | 'ambush_valley' | 'volcano' | 'great_wall' | 'spiral' | 'oasis' | 'frozen_river' | 'arena' | 'bagua' | 'wasteland' | 'waterfall' | 'starfort' | 'dungeon' | 'chessboard' | 'random'

const MAP_TEMPLATE_NAMES: Record<MapTemplate, string> = {
  valley: '峡谷', crossroads: '十字路口', fortress: '中央要塞',
  plains: '大平原', river_delta: '三叉河口', mountain_pass: '关隘',
  siege_castle: '攻城', changban: '长坂坡', chibi: '赤壁',
  hulao: '虎牢关', jieting: '街亭',
  twin_lakes: '双湖', canyon_bridge: '栈道', three_kingdoms: '三分天下', swamp: '沼泽',
  labyrinth: '迷宫', islands: '群岛', ambush_valley: '伏兵谷', volcano: '火山口', great_wall: '长城',
  spiral: '螺旋', oasis: '绿洲', frozen_river: '冰河', arena: '斗兽场', bagua: '八卦阵',
  wasteland: '荒原', waterfall: '瀑布峡', starfort: '棱堡', dungeon: '地牢', chessboard: '棋盘',
  random: '随机',
}
export { MAP_TEMPLATE_NAMES }

// Spawn safe zone: 10 cells around each corner guaranteed clear
const SAFE_CELLS = 12

// Smooth noise for organic terrain
function noise2d(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 43758.5453) * 43758.5453
  return n - Math.floor(n)
}

function smoothNoise(x: number, y: number, scale: number, seed: number): number {
  const sx = x / scale, sy = y / scale
  const ix = Math.floor(sx), iy = Math.floor(sy)
  const fx = sx - ix, fy = sy - iy
  // Hermite interpolation for smoother transitions
  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)
  const a = noise2d(ix, iy, seed)
  const b = noise2d(ix + 1, iy, seed)
  const c = noise2d(ix, iy + 1, seed)
  const d = noise2d(ix + 1, iy + 1, seed)
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy
}

function fbm(x: number, y: number, seed: number): number {
  return smoothNoise(x, y, 10, seed) * 0.5 +
         smoothNoise(x, y, 5, seed + 100) * 0.3 +
         smoothNoise(x, y, 2.5, seed + 200) * 0.2
}

export function generateMap(rng: SeededRandom, template?: MapTemplate): BattleMap {
  const cols = Math.floor(BALANCE.MAP_WIDTH / BALANCE.CELL_SIZE)
  const rows = Math.floor(BALANCE.MAP_HEIGHT / BALANCE.CELL_SIZE)
  const terrain: TerrainType[][] = Array.from({ length: rows }, () => Array(cols).fill('plain'))
  const seed = rng.int(0, 99999)

  let tmpl = template ?? 'random'
  if (tmpl === 'random') {
    tmpl = rng.pick(['valley', 'crossroads', 'fortress', 'plains', 'river_delta', 'mountain_pass', 'changban', 'chibi', 'hulao', 'jieting', 'twin_lakes', 'canyon_bridge', 'three_kingdoms', 'swamp', 'labyrinth', 'islands', 'ambush_valley', 'volcano', 'great_wall', 'spiral', 'oasis', 'frozen_river', 'arena', 'bagua', 'wasteland', 'waterfall', 'starfort', 'dungeon', 'chessboard'])
  }

  switch (tmpl) {
    case 'valley': genValley(terrain, cols, rows, rng, seed); break
    case 'crossroads': genCrossroads(terrain, cols, rows, rng, seed); break
    case 'fortress': genFortress(terrain, cols, rows, rng, seed); break
    case 'plains': genPlains(terrain, cols, rows, rng, seed); break
    case 'river_delta': genRiverDelta(terrain, cols, rows, rng, seed); break
    case 'mountain_pass': genMountainPass(terrain, cols, rows, rng, seed); break
    case 'siege_castle': genSiegeCastle(terrain, cols, rows, rng, seed); break
    case 'changban': genChangban(terrain, cols, rows, rng, seed); break
    case 'chibi': genChibi(terrain, cols, rows, rng, seed); break
    case 'hulao': genHulao(terrain, cols, rows, rng, seed); break
    case 'jieting': genJieting(terrain, cols, rows, rng, seed); break
    case 'twin_lakes': genTwinLakes(terrain, cols, rows, rng, seed); break
    case 'canyon_bridge': genCanyonBridge(terrain, cols, rows, rng, seed); break
    case 'three_kingdoms': genThreeKingdoms(terrain, cols, rows, rng, seed); break
    case 'swamp': genSwamp(terrain, cols, rows, rng, seed); break
    case 'labyrinth': genLabyrinth(terrain, cols, rows, rng, seed); break
    case 'islands': genIslands(terrain, cols, rows, rng, seed); break
    case 'ambush_valley': genAmbushValley(terrain, cols, rows, rng, seed); break
    case 'volcano': genVolcano(terrain, cols, rows, rng, seed); break
    case 'great_wall': genGreatWall(terrain, cols, rows, rng, seed); break
    case 'spiral': genSpiral(terrain, cols, rows, rng, seed); break
    case 'oasis': genOasis(terrain, cols, rows, rng, seed); break
    case 'frozen_river': genFrozenRiver(terrain, cols, rows, rng, seed); break
    case 'arena': genArena(terrain, cols, rows, rng, seed); break
    case 'bagua': genBagua(terrain, cols, rows, rng, seed); break
    case 'wasteland': genWasteland(terrain, cols, rows, rng, seed); break
    case 'waterfall': genWaterfall(terrain, cols, rows, rng, seed); break
    case 'starfort': genStarfort(terrain, cols, rows, rng, seed); break
    case 'dungeon': genDungeon(terrain, cols, rows, rng, seed); break
    case 'chessboard': genChessboard(terrain, cols, rows, rng, seed); break
  }

  // Noise-based forest scatter (only on plain cells)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (terrain[y][x] !== 'plain') continue
      const n = fbm(x, y, seed + 500)
      if (n > 0.6 && n < 0.7) terrain[y][x] = 'forest'
    }
  }

  // LAST STEP: clear spawn zones — 4 corners + edge midpoints, guaranteed safe
  clearSpawnZones(terrain, cols, rows)

  return { width: BALANCE.MAP_WIDTH, height: BALANCE.MAP_HEIGHT, terrain, cellSize: BALANCE.CELL_SIZE }
}

// Clear generous safe zones for spawning (runs AFTER all terrain generation)
function clearSpawnZones(t: TerrainType[][], cols: number, rows: number) {
  const s = SAFE_CELLS
  // Four corners
  clearRect(t, 0, 0, s, s, cols, rows)
  clearRect(t, cols - s, 0, s, s, cols, rows)
  clearRect(t, 0, rows - s, s, s, cols, rows)
  clearRect(t, cols - s, rows - s, s, s, cols, rows)
  // Edge midpoints (for 2-faction left/right spawns)
  clearRect(t, 0, Math.floor(rows / 2) - 4, 6, 8, cols, rows)
  clearRect(t, cols - 6, Math.floor(rows / 2) - 4, 6, 8, cols, rows)
}

function clearRect(t: TerrainType[][], sx: number, sy: number, w: number, h: number, cols: number, rows: number) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const x = sx + dx, y = sy + dy
      if (x >= 0 && x < cols && y >= 0 && y < rows) t[y][x] = 'plain'
    }
  }
}

// ============ Valley ============
function genValley(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
  const midY = Math.floor(rows / 2)

  // Top ridge
  for (let x = 0; x < cols; x++) {
    const n = smoothNoise(x, 0, 6, seed) * 3
    const ry = Math.floor(midY - 6 + n)
    for (let dy = -2; dy <= 1; dy++) {
      const y = ry + dy
      if (y >= SAFE_CELLS && y < rows - SAFE_CELLS) setIfPlain(t, x, y, 'mountain', cols, rows)
    }
  }
  // Bottom ridge
  for (let x = 0; x < cols; x++) {
    const n = smoothNoise(x, 1, 6, seed + 50) * 3
    const ry = Math.floor(midY + 6 + n)
    for (let dy = -1; dy <= 2; dy++) {
      const y = ry + dy
      if (y >= SAFE_CELLS && y < rows - SAFE_CELLS) setIfPlain(t, x, y, 'mountain', cols, rows)
    }
  }
  // River through center
  let ry = midY
  for (let x = 0; x < cols; x++) {
    if (t[ry]?.[x] === 'mountain') { if (rng.chance(0.2)) ry += rng.int(-1, 1); continue }
    t[ry][x] = 'river'
    if (rng.chance(0.2)) ry += rng.int(-1, 1)
    ry = Math.max(midY - 3, Math.min(midY + 3, ry))
  }
  placeBridgesH(t, cols, rows, rng, 3)
  punchPasses(t, cols, rows, rng, 2)

  // Fortified checkpoint in the center of the valley
  const fortX = Math.floor(cols / 2)
  placeSmallFort(t, fortX, midY, 3, 2, cols, rows, ['e', 'w'])
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const x = fortX + dx, y = midY + dy
      if (x >= 0 && x < cols && y >= 0 && y < rows) t[y][x] = 'plain'
    }
  }

  // Watchtowers at pass entrances
  if (rng.chance(0.7)) {
    const passX1 = Math.floor(cols * 0.3)
    placeSmallFort(t, passX1, midY - 4, 2, 1, cols, rows, ['s'])
  }
  if (rng.chance(0.7)) {
    const passX2 = Math.floor(cols * 0.7)
    placeSmallFort(t, passX2, midY + 4, 2, 1, cols, rows, ['n'])
  }
}

// ============ Crossroads ============
function genCrossroads(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
  const midX = Math.floor(cols / 2), midY = Math.floor(rows / 2)
  const roadW = 3

  // Fill quadrants with noise forests
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (Math.abs(x - midX) < roadW || Math.abs(y - midY) < roadW) continue
      if (isInSafeZone(x, y, cols, rows)) continue
      const n = fbm(x, y, seed)
      if (n > 0.6) t[y][x] = 'forest'
    }
  }

  // Central crossroads fort (small watchtower)
  placeSmallFort(t, midX, midY, 3, 3, cols, rows, ['n', 's', 'e', 'w'])
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const x = midX + dx, y = midY + dy
      if (x >= 0 && x < cols && y >= 0 && y < rows) t[y][x] = 'plain'
    }
  }

  // Four outposts in each quadrant
  const outposts = [
    [Math.floor(cols * 0.28), Math.floor(rows * 0.28)],
    [Math.floor(cols * 0.72), Math.floor(rows * 0.28)],
    [Math.floor(cols * 0.28), Math.floor(rows * 0.72)],
    [Math.floor(cols * 0.72), Math.floor(rows * 0.72)],
  ]
  for (const [ox, oy] of outposts) {
    if (rng.chance(0.6)) {
      placeSmallFort(t, ox, oy, 3, 2, cols, rows, ['s', 'e'])
      // Clear interior
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const x = ox + dx, y = oy + dy
          if (x >= 0 && x < cols && y >= 0 && y < rows) t[y][x] = 'plain'
        }
      }
    } else {
      placeBlob(t, ox, oy, rng.int(2, 3), 'mountain', rng, rows, cols)
    }
  }
}

// ============ Fortress ============
function genFortress(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
  const midX = Math.floor(cols / 2), midY = Math.floor(rows / 2)
  const outerR = Math.min(cols, rows) * 0.25
  const innerR = outerR * 0.6

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (isInSafeZone(x, y, cols, rows)) continue
      const dx = x - midX, dy = y - midY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const noise = smoothNoise(x, y, 5, seed) * 2
      if (dist >= innerR + noise && dist <= outerR + noise) t[y][x] = 'mountain'
    }
  }
  // Four gates
  const gateAngles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5]
  for (const angle of gateAngles) {
    const gw = rng.int(2, 3)
    for (let r = innerR - 2; r <= outerR + 3; r++) {
      for (let w = -gw; w <= gw; w++) {
        const gx = Math.round(midX + Math.cos(angle) * r + Math.cos(angle + Math.PI / 2) * w)
        const gy = Math.round(midY + Math.sin(angle) * r + Math.sin(angle + Math.PI / 2) * w)
        if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) t[gy][gx] = 'plain'
      }
    }
  }
  // Optional moat
  if (rng.chance(0.6)) {
    const moatR = outerR + 3
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (isInSafeZone(x, y, cols, rows)) continue
        const dx = x - midX, dy = y - midY
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist >= moatR && dist <= moatR + 1.5 && t[y][x] === 'plain') t[y][x] = 'river'
      }
    }
    for (const angle of gateAngles) {
      for (let r = moatR - 1; r <= moatR + 2; r++) {
        const bx = Math.round(midX + Math.cos(angle) * r)
        const by = Math.round(midY + Math.sin(angle) * r)
        if (bx >= 0 && bx < cols && by >= 0 && by < rows && t[by][bx] === 'river') t[by][bx] = 'bridge'
      }
    }
  }
}

// ============ Plains ============
function genPlains(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
  // Noise forests
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (isInSafeZone(x, y, cols, rows)) continue
      const n = fbm(x, y, seed)
      if (n > 0.58 && n < 0.7) t[y][x] = 'forest'
    }
  }

  // Central village (small fort)
  const midX = Math.floor(cols / 2), midY = Math.floor(rows / 2)
  placeSmallFort(t, midX, midY, 4, 3, cols, rows, ['n', 's', 'e', 'w'])
  // Village interior: clear
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const x = midX + dx, y = midY + dy
      if (x >= 0 && x < cols && y >= 0 && y < rows) t[y][x] = 'plain'
    }
  }

  // Two outpost towers on flanks
  if (rng.chance(0.7)) {
    placeSmallFort(t, Math.floor(cols * 0.25), Math.floor(rows * 0.35), 2, 2, cols, rows, ['s', 'e'])
  }
  if (rng.chance(0.7)) {
    placeSmallFort(t, Math.floor(cols * 0.75), Math.floor(rows * 0.65), 2, 2, cols, rows, ['n', 'w'])
  }

  // Small hills
  for (let i = 0; i < rng.int(2, 4); i++) {
    const cx = rng.int(SAFE_CELLS + 4, cols - SAFE_CELLS - 4)
    const cy = rng.int(SAFE_CELLS + 4, rows - SAFE_CELLS - 4)
    if (Math.abs(cx - midX) > 8 || Math.abs(cy - midY) > 6) {
      placeBlob(t, cx, cy, rng.int(1, 2), 'mountain', rng, rows, cols)
    }
  }

  // Stream
  if (rng.chance(0.5)) {
    let x = rng.int(Math.floor(cols * 0.3), Math.floor(cols * 0.7))
    for (let y = SAFE_CELLS; y < rows - SAFE_CELLS; y++) {
      if (t[y][x] === 'plain') t[y][x] = 'river'
      if (rng.chance(0.3)) x += rng.int(-1, 1)
      x = Math.max(SAFE_CELLS, Math.min(cols - SAFE_CELLS - 1, x))
    }
    placeBridgesV(t, cols, rows, rng, 2)
  }
}

// ============ River Delta ============
function genRiverDelta(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, _seed: number) {
  let my = Math.floor(rows / 2)
  const branchX = Math.floor(cols * 0.35)

  // Main river from left edge (avoid safe zone)
  for (let x = SAFE_CELLS; x < branchX; x++) {
    setIfPlain(t, x, my, 'river', cols, rows)
    if (my > 0 && !isInSafeZone(x, my - 1, cols, rows)) setIfPlain(t, x, my - 1, 'river', cols, rows)
    if (rng.chance(0.2)) my += rng.int(-1, 1)
    my = Math.max(SAFE_CELLS + 2, Math.min(rows - SAFE_CELLS - 2, my))
  }

  // Branch into 3
  const branches = [my - 5, my, my + 5]
  for (const startY of branches) {
    let by = startY
    for (let x = branchX; x < cols - SAFE_CELLS; x++) {
      if (!isInSafeZone(x, by, cols, rows)) setIfPlain(t, x, by, 'river', cols, rows)
      if (rng.chance(0.25)) by += rng.int(-1, 1)
      by = Math.max(SAFE_CELLS + 1, Math.min(rows - SAFE_CELLS - 1, by))
    }
    // 2 bridges per branch
    for (let b = 0; b < 2; b++) {
      const bx = rng.int(branchX + 5 + b * 10, Math.min(cols - SAFE_CELLS - 2, branchX + 15 + b * 10))
      for (let dy = -1; dy <= 1; dy++) {
        const ry = startY + dy
        if (ry >= 0 && ry < rows && bx < cols && t[ry][bx] === 'river') t[ry][bx] = 'bridge'
      }
    }
  }

  // Forests between rivers
  for (let y = 0; y < rows; y++) {
    for (let x = branchX; x < cols; x++) {
      if (t[y][x] === 'plain' && !isInSafeZone(x, y, cols, rows) && rng.chance(0.1)) t[y][x] = 'forest'
    }
  }

  // Mountains near origin (not in safe zones)
  placeBlob(t, Math.floor(cols * 0.2), Math.floor(rows * 0.25), 2, 'mountain', rng, rows, cols)
  placeBlob(t, Math.floor(cols * 0.2), Math.floor(rows * 0.75), 2, 'mountain', rng, rows, cols)
}

// ============ Mountain Pass ============
function genMountainPass(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
  const midY = Math.floor(rows / 2)
  const passWidth = rng.int(5, 7) // wider pass

  // Fill with mountains EXCEPT: pass corridor AND safe zones
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (isInSafeZone(x, y, cols, rows)) continue
      const distFromCenter = Math.abs(y - midY)
      const noise = smoothNoise(x, y, 5, seed) * 2.5
      if (distFromCenter > passWidth / 2 + noise) t[y][x] = 'mountain'
    }
  }

  // Guarantee corridors from corners to the pass
  // Top-left → pass
  carveCorridorToPass(t, 0, 0, midY, passWidth, cols, rows)
  // Top-right → pass
  carveCorridorToPass(t, cols - 1, 0, midY, passWidth, cols, rows)
  // Bottom-left → pass
  carveCorridorToPass(t, 0, rows - 1, midY, passWidth, cols, rows)
  // Bottom-right → pass
  carveCorridorToPass(t, cols - 1, rows - 1, midY, passWidth, cols, rows)

  // Widen pass at certain points with forest/plains pockets
  for (let i = 0; i < rng.int(2, 4); i++) {
    const wx = rng.int(SAFE_CELLS + 3, cols - SAFE_CELLS - 3)
    const extra = rng.int(3, 5)
    for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -extra; dy <= extra; dy++) {
        const x = wx + dx, y = midY + dy
        if (x >= 0 && x < cols && y >= 0 && y < rows) t[y][x] = 'plain'
      }
    }
    if (rng.chance(0.5)) placeBlob(t, wx, midY, 2, 'forest', rng, rows, cols)
  }

  // River crossing
  if (rng.chance(0.7)) {
    const rx = rng.int(Math.floor(cols * 0.3), Math.floor(cols * 0.7))
    for (let y = midY - passWidth; y <= midY + passWidth; y++) {
      if (y >= 0 && y < rows && t[y][rx] !== 'mountain') t[y][rx] = 'river'
    }
    t[midY][rx] = 'bridge'
    if (midY + 1 < rows) t[midY + 1][rx] = 'bridge'
  }
}

// Carve a diagonal corridor from a corner to the pass level
function carveCorridorToPass(
  t: TerrainType[][], cornerX: number, cornerY: number,
  passY: number, _passWidth: number, cols: number, rows: number,
) {
  const steps = Math.abs(cornerY - passY)
  const dx = cornerX < cols / 2 ? 1 : -1
  let x = cornerX < cols / 2 ? SAFE_CELLS : cols - SAFE_CELLS - 1
  let y = cornerY < rows / 2 ? SAFE_CELLS : rows - SAFE_CELLS - 1
  const targetY = passY

  for (let s = 0; s < steps + 5; s++) {
    // Clear a 3-wide corridor
    for (let w = -2; w <= 2; w++) {
      const cx = x + w
      if (cx >= 0 && cx < cols && y >= 0 && y < rows) {
        if (t[y][cx] === 'mountain') t[y][cx] = 'plain'
      }
    }
    // Move toward pass
    if (y < targetY) y++
    else if (y > targetY) y--
    // Slight horizontal drift
    if (s % 3 === 0) x += dx
    x = Math.max(0, Math.min(cols - 1, x))
    if (y === targetY) break
  }
}

// ============ 长坂坡: narrow bridge over a wide river, forests on both sides ============
function genChangban(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
  // Wide river running horizontally across the center
  const midY = Math.floor(rows / 2)
  for (let x = 0; x < cols; x++) {
    for (let dy = -2; dy <= 2; dy++) {
      const y = midY + dy
      if (y >= 0 && y < rows && !isInSafeZone(x, y, cols, rows)) {
        t[y][x] = 'river'
      }
    }
  }

  // ONE narrow bridge in the center — 长坂桥
  const bridgeX = Math.floor(cols / 2)
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const y = midY + dy, x = bridgeX + dx
      if (y >= 0 && y < rows && x >= 0 && x < cols) t[y][x] = 'bridge'
    }
  }

  // Dense forests on both sides
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (t[y][x] !== 'plain' || isInSafeZone(x, y, cols, rows)) continue
      const n = fbm(x, y, seed)
      if (n > 0.45 && n < 0.68) t[y][x] = 'forest'
    }
  }

  // Mountains on the flanks
  for (let y = 0; y < rows; y++) {
    if (isInSafeZone(0, y, cols, rows) || isInSafeZone(cols - 1, y, cols, rows)) continue
    for (let dx = 0; dx < 4; dx++) {
      if (!isInSafeZone(dx, y, cols, rows) && rng.chance(0.5)) setIfPlain(t, dx, y, 'mountain', cols, rows)
      if (!isInSafeZone(cols - 1 - dx, y, cols, rows) && rng.chance(0.5)) setIfPlain(t, cols - 1 - dx, y, 'mountain', cols, rows)
    }
  }

  // Defender's camp (south side of river)
  placeSmallFort(t, Math.floor(cols * 0.5), midY + rng.int(8, 12), 4, 3, cols, rows, ['n'])

  // Attacker's staging area (north side)
  placeSmallFort(t, Math.floor(cols * 0.4), midY - rng.int(8, 12), 3, 2, cols, rows, ['s', 'e'])
}

// ============ 赤壁: massive river with fire-prone forests, wind terrain ============
function genChibi(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
  // Large river running diagonally from bottom-left to top-right
  for (let x = 0; x < cols; x++) {
    const centerY = Math.floor(rows * 0.65 - x * (rows * 0.3) / cols)
    for (let dy = -2; dy <= 2; dy++) {
      const y = centerY + dy + Math.round(smoothNoise(x, 0, 8, seed) * 2)
      if (y >= 0 && y < rows && !isInSafeZone(x, y, cols, rows)) t[y][x] = 'river'
    }
  }

  // Bridges — only 2, strategic crossing points
  const bridge1 = Math.floor(cols * 0.3)
  const bridge2 = Math.floor(cols * 0.7)
  for (const bx of [bridge1, bridge2]) {
    for (let y = 0; y < rows; y++) {
      if (t[y][bx] === 'river') t[y][bx] = 'bridge'
      if (bx + 1 < cols && t[y][bx + 1] === 'river') t[y][bx + 1] = 'bridge'
    }
  }

  // Dense forests along the southern bank (fire fuel!)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (t[y][x] !== 'plain' || isInSafeZone(x, y, cols, rows)) continue
      const n = fbm(x, y, seed + 300)
      const centerY = Math.floor(rows * 0.65 - x * (rows * 0.3) / cols)
      if (y > centerY + 3 && n > 0.4 && n < 0.65) t[y][x] = 'forest'
      if (y < centerY - 3 && n > 0.55 && n < 0.7) t[y][x] = 'forest'
    }
  }

  // Cliffs/mountains along the river
  for (let x = 0; x < cols; x++) {
    const centerY = Math.floor(rows * 0.65 - x * (rows * 0.3) / cols)
    for (const dy of [-3, 3]) {
      const y = centerY + dy
      if (y >= 0 && y < rows && !isInSafeZone(x, y, cols, rows) && rng.chance(0.3)) {
        setIfPlain(t, x, y, 'mountain', cols, rows)
      }
    }
  }
}

// ============ 虎牢关: narrow fortress gate between mountains ============
function genHulao(t: TerrainType[][], cols: number, rows: number, _rng: SeededRandom, seed: number) {
  const midX = Math.floor(cols / 2)
  const midY = Math.floor(rows / 2)
  const gateWidth = 4

  // Two massive mountain walls from top/bottom toward center, leaving a gate
  for (let y = 0; y < rows; y++) {
    for (let x = midX - 4; x <= midX + 4; x++) {
      if (x < 0 || x >= cols || isInSafeZone(x, y, cols, rows)) continue
      const distFromCenter = Math.abs(y - midY)
      if (distFromCenter > gateWidth / 2) {
        const noise = smoothNoise(x, y, 3, seed) * 1.5
        if (Math.abs(x - midX) < 3 + noise) t[y][x] = 'mountain'
      }
    }
  }

  // Extend mountain walls wider at top and bottom
  for (let y = 0; y < rows; y++) {
    if (isInSafeZone(midX, y, cols, rows)) continue
    const distFromCenter = Math.abs(y - midY)
    if (distFromCenter > gateWidth) {
      const width = Math.min(8, 2 + distFromCenter * 0.3)
      for (let dx = -Math.floor(width); dx <= Math.floor(width); dx++) {
        const x = midX + dx
        if (x >= 0 && x < cols && !isInSafeZone(x, y, cols, rows)) {
          setIfPlain(t, x, y, 'mountain', cols, rows)
        }
      }
    }
  }

  // Gate passage is plain (ensure clear)
  for (let dy = -gateWidth; dy <= gateWidth; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const x = midX + dx, y = midY + dy
      if (x >= 0 && x < cols && y >= 0 && y < rows) t[y][x] = 'plain'
    }
  }

  // Forests on both sides of the pass
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (t[y][x] !== 'plain' || isInSafeZone(x, y, cols, rows)) continue
      if (Math.abs(x - midX) < 10) continue // keep pass area clear
      const n = fbm(x, y, seed + 400)
      if (n > 0.5 && n < 0.65) t[y][x] = 'forest'
    }
  }

  // Small wall/gate structure at the pass
  for (let dx = -3; dx <= 3; dx++) {
    const x = midX + dx
    const topY = midY - gateWidth - 1
    const botY = midY + gateWidth + 1
    if (x >= 0 && x < cols) {
      if (topY >= 0 && topY < rows && Math.abs(dx) > 1) setIfPlain(t, x, topY, 'wall', cols, rows)
      if (botY >= 0 && botY < rows && Math.abs(dx) > 1) setIfPlain(t, x, botY, 'wall', cols, rows)
    }
  }
}

// ============ 街亭: hilltop vs valley, height advantage ============
function genJieting(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
  const midX = Math.floor(cols / 2)
  const midY = Math.floor(rows / 2)

  // Central hill — a large mountain blob with a flat top (plain center)
  const hillR = Math.min(cols, rows) * 0.2
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (isInSafeZone(x, y, cols, rows)) continue
      const dx = x - midX, dy = y - midY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const noise = smoothNoise(x, y, 4, seed) * 2
      if (dist < hillR + noise && dist > hillR * 0.5 + noise) {
        t[y][x] = 'mountain'
      }
    }
  }

  // Ensure the hilltop center is clear (the strategic position)
  for (let y = midY - 4; y <= midY + 4; y++) {
    for (let x = midX - 4; x <= midX + 4; x++) {
      if (x >= 0 && x < cols && y >= 0 && y < rows) t[y][x] = 'plain'
    }
  }

  // Paths up the hill (4 directions)
  for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    for (let r = 0; r < hillR + 3; r++) {
      for (let w = -1; w <= 1; w++) {
        const x = Math.round(midX + Math.cos(angle) * r + Math.cos(angle + Math.PI / 2) * w)
        const y = Math.round(midY + Math.sin(angle) * r + Math.sin(angle + Math.PI / 2) * w)
        if (x >= 0 && x < cols && y >= 0 && y < rows && t[y][x] === 'mountain') {
          t[y][x] = 'plain'
        }
      }
    }
  }

  // Forests in the valleys between paths
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (t[y][x] !== 'plain' || isInSafeZone(x, y, cols, rows)) continue
      const n = fbm(x, y, seed + 600)
      if (n > 0.52 && n < 0.65) t[y][x] = 'forest'
    }
  }

  // Stream at the base of the hill
  if (rng.chance(0.7)) {
    let sy = rng.int(SAFE_CELLS + 2, rows - SAFE_CELLS - 2)
    for (let x = SAFE_CELLS; x < cols - SAFE_CELLS; x++) {
      const dx2 = x - midX, dy2 = sy - midY
      if (Math.sqrt(dx2 * dx2 + dy2 * dy2) < hillR + 4) continue // skip near hill
      setIfPlain(t, x, sy, 'river', cols, rows)
      if (rng.chance(0.25)) sy += rng.int(-1, 1)
      sy = Math.max(SAFE_CELLS + 1, Math.min(rows - SAFE_CELLS - 1, sy))
    }
    placeBridgesH(t, cols, rows, rng, 2)
  }
}

// ============ 双湖: two large lakes with a land bridge between them ============
function genTwinLakes(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
  const midY = Math.floor(rows / 2)
  const lakeR = Math.min(cols, rows) * 0.18

  // Left lake
  const lx = Math.floor(cols * 0.3), ly = midY
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (isInSafeZone(x, y, cols, rows)) continue
      const dx = x - lx, dy = y - ly
      const dist = Math.sqrt(dx * dx + dy * dy)
      const n = smoothNoise(x, y, 6, seed) * 3
      if (dist < lakeR + n) t[y][x] = 'river'
    }
  }

  // Right lake
  const rx = Math.floor(cols * 0.7), ry = midY
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (isInSafeZone(x, y, cols, rows)) continue
      const dx = x - rx, dy = y - ry
      const dist = Math.sqrt(dx * dx + dy * dy)
      const n = smoothNoise(x, y, 6, seed + 50) * 3
      if (dist < lakeR + n) t[y][x] = 'river'
    }
  }

  // Land bridge between lakes (clear a corridor through center)
  for (let dy = -2; dy <= 2; dy++) {
    for (let x = lx; x <= rx; x++) {
      const y = midY + dy
      if (y >= 0 && y < rows && t[y][x] === 'river') t[y][x] = 'bridge'
    }
  }

  // Bridges on north and south edges of lakes
  for (const lake of [{ cx: lx, cy: ly }, { cx: rx, cy: ry }]) {
    for (const angle of [Math.PI * 0.5, -Math.PI * 0.5]) {
      for (let r = 0; r < lakeR + 5; r++) {
        const bx = Math.round(lake.cx + Math.cos(angle) * r)
        const by = Math.round(lake.cy + Math.sin(angle) * r)
        if (bx >= 0 && bx < cols && by >= 0 && by < rows && t[by][bx] === 'river') {
          t[by][bx] = 'bridge'
          if (bx + 1 < cols && t[by][bx + 1] === 'river') t[by][bx + 1] = 'bridge'
        }
      }
    }
  }

  // Forests around lakes
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (t[y][x] !== 'plain' || isInSafeZone(x, y, cols, rows)) continue
      const n = fbm(x, y, seed + 500)
      if (n > 0.52 && n < 0.65) t[y][x] = 'forest'
    }
  }

  // A few hills
  for (let i = 0; i < rng.int(2, 4); i++) {
    const hx = rng.int(SAFE_CELLS + 3, cols - SAFE_CELLS - 3)
    const hy = rng.int(SAFE_CELLS + 3, rows - SAFE_CELLS - 3)
    placeBlob(t, hx, hy, rng.int(1, 2), 'mountain', rng, rows, cols)
  }
}

// ============ 栈道: narrow mountain paths along cliff faces ============
function genCanyonBridge(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, _seed: number) {
  // Fill most of the map with mountains
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (isInSafeZone(x, y, cols, rows)) continue
      t[y][x] = 'mountain'
    }
  }

  // Carve winding path from left to right
  let py = Math.floor(rows / 2)
  const pathWidth = 3
  for (let x = 0; x < cols; x++) {
    for (let dy = -pathWidth; dy <= pathWidth; dy++) {
      const y = py + dy
      if (y >= 0 && y < rows) t[y][x] = 'plain'
    }
    // Meander
    if (rng.chance(0.35)) py += rng.int(-2, 2)
    py = Math.max(SAFE_CELLS + pathWidth + 1, Math.min(rows - SAFE_CELLS - pathWidth - 1, py))
  }

  // Add a second path from top to bottom crossing the first
  let px = Math.floor(cols / 2)
  for (let y = 0; y < rows; y++) {
    for (let dx = -pathWidth; dx <= pathWidth; dx++) {
      const x = px + dx
      if (x >= 0 && x < cols) t[y][x] = 'plain'
    }
    if (rng.chance(0.3)) px += rng.int(-2, 2)
    px = Math.max(SAFE_CELLS + pathWidth + 1, Math.min(cols - SAFE_CELLS - pathWidth - 1, px))
  }

  // Widen intersection areas
  const midX = Math.floor(cols / 2), midY = Math.floor(rows / 2)
  for (let dy = -5; dy <= 5; dy++) {
    for (let dx = -5; dx <= 5; dx++) {
      const x = midX + dx, y = midY + dy
      if (x >= 0 && x < cols && y >= 0 && y < rows) t[y][x] = 'plain'
    }
  }

  // Guaranteed corridors from corners to paths
  carveCorridorToPass(t, 0, 0, Math.floor(rows / 2), 0, cols, rows)
  carveCorridorToPass(t, cols - 1, 0, Math.floor(rows / 2), 0, cols, rows)
  carveCorridorToPass(t, 0, rows - 1, Math.floor(rows / 2), 0, cols, rows)
  carveCorridorToPass(t, cols - 1, rows - 1, Math.floor(rows / 2), 0, cols, rows)

  // Add forests in open areas
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (t[y][x] === 'plain' && !isInSafeZone(x, y, cols, rows) && rng.chance(0.08)) {
        t[y][x] = 'forest'
      }
    }
  }

  // River crossing at the intersection
  if (rng.chance(0.6)) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let y = midY - 6; y <= midY + 6; y++) {
        const x = midX + 8 + dx
        if (x >= 0 && x < cols && y >= 0 && y < rows && t[y][x] === 'plain') t[y][x] = 'river'
      }
    }
    t[midY][midX + 8] = 'bridge'
    t[midY + 1][midX + 8] = 'bridge'
  }
}

// ============ 三分天下: map divided into 3 zones by rivers ============
function genThreeKingdoms(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
  const midX = Math.floor(cols / 2)
  const midY = Math.floor(rows / 2)

  // Y-shaped rivers dividing map into 3 zones
  // River 1: center-top to center
  let rx = midX
  for (let y = 0; y < midY; y++) {
    if (!isInSafeZone(rx, y, cols, rows)) t[y][rx] = 'river'
    if (rx + 1 < cols && !isInSafeZone(rx + 1, y, cols, rows)) t[y][rx + 1] = 'river'
    if (rng.chance(0.2)) rx += rng.int(-1, 1)
    rx = Math.max(midX - 5, Math.min(midX + 5, rx))
  }

  // River 2: center to bottom-left
  let r2x = midX, r2y = midY
  for (let step = 0; step < Math.max(cols, rows); step++) {
    if (r2x < 0 || r2y >= rows) break
    if (!isInSafeZone(r2x, r2y, cols, rows)) t[r2y][r2x] = 'river'
    r2x--
    if (rng.chance(0.5)) r2y++
  }

  // River 3: center to bottom-right
  let r3x = midX, r3y = midY
  for (let step = 0; step < Math.max(cols, rows); step++) {
    if (r3x >= cols || r3y >= rows) break
    if (!isInSafeZone(r3x, r3y, cols, rows)) t[r3y][r3x] = 'river'
    r3x++
    if (rng.chance(0.5)) r3y++
  }

  // Bridges on each river branch
  // Top river
  const b1y = Math.floor(midY * 0.5)
  for (let dy = -1; dy <= 1; dy++) {
    if (b1y + dy >= 0 && b1y + dy < rows && t[b1y + dy][midX] === 'river') t[b1y + dy][midX] = 'bridge'
    if (midX + 1 < cols && t[b1y + dy][midX + 1] === 'river') t[b1y + dy][midX + 1] = 'bridge'
  }
  // Left branch
  const blx = Math.floor(midX * 0.5), bly = Math.floor((midY + rows) * 0.5)
  for (let r = -2; r <= 2; r++) {
    const by = Math.min(rows - 1, Math.max(0, bly + r))
    const bx = Math.min(cols - 1, Math.max(0, blx + r))
    if (t[by][bx] === 'river') t[by][bx] = 'bridge'
  }
  // Right branch
  const brx = Math.floor(midX + (cols - midX) * 0.5), bry = Math.floor((midY + rows) * 0.5)
  for (let r = -2; r <= 2; r++) {
    const by = Math.min(rows - 1, Math.max(0, bry + r))
    const bx = Math.min(cols - 1, Math.max(0, brx - r))
    if (t[by][bx] === 'river') t[by][bx] = 'bridge'
  }

  // Forests and mountains in each zone
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (t[y][x] !== 'plain' || isInSafeZone(x, y, cols, rows)) continue
      const n = fbm(x, y, seed)
      if (n > 0.58 && n < 0.68) t[y][x] = 'forest'
    }
  }
  for (let i = 0; i < rng.int(3, 5); i++) {
    const hx = rng.int(SAFE_CELLS + 3, cols - SAFE_CELLS - 3)
    const hy = rng.int(SAFE_CELLS + 3, rows - SAFE_CELLS - 3)
    placeBlob(t, hx, hy, rng.int(1, 2), 'mountain', rng, rows, cols)
  }

  // Three cities — one in each zone
  // Top zone (above Y junction)
  placeSmallFort(t, midX, Math.floor(midY * 0.4), 4, 3, cols, rows, ['s', 'e', 'w'])
  // Bottom-left zone
  placeSmallFort(t, Math.floor(cols * 0.25), Math.floor(rows * 0.75), 3, 3, cols, rows, ['n', 'e'])
  // Bottom-right zone
  placeSmallFort(t, Math.floor(cols * 0.75), Math.floor(rows * 0.75), 3, 3, cols, rows, ['n', 'w'])
}

// ============ 沼泽: swampy terrain with fords and dense vegetation ============
function genSwamp(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
  // Dense forests everywhere
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (isInSafeZone(x, y, cols, rows)) continue
      const n = fbm(x, y, seed)
      if (n > 0.35 && n < 0.62) t[y][x] = 'forest'
      else if (n >= 0.62 && n < 0.72) t[y][x] = 'river' // water pools
    }
  }

  // Convert isolated river cells to fords (crossable swamp)
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      if (t[y][x] !== 'river') continue
      // Count neighboring river cells
      let riverNeighbors = 0
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        if (t[y + dy]?.[x + dx] === 'river') riverNeighbors++
      }
      // Isolated puddles become fords
      if (riverNeighbors <= 1 && rng.chance(0.6)) t[y][x] = 'ford'
    }
  }

  // Bridges across larger water bodies
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (t[y][x] === 'river' && rng.chance(0.03)) t[y][x] = 'bridge'
    }
  }

  // A few small hills poking above the swamp
  for (let i = 0; i < rng.int(3, 6); i++) {
    const hx = rng.int(SAFE_CELLS + 3, cols - SAFE_CELLS - 3)
    const hy = rng.int(SAFE_CELLS + 3, rows - SAFE_CELLS - 3)
    // Clear swamp around hill and place mountain
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = hx + dx, ny = hy + dy
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
          if (dx * dx + dy * dy <= 1) t[ny][nx] = 'mountain'
          else if (t[ny][nx] === 'river') t[ny][nx] = 'plain'
        }
      }
    }
  }
}

// ============ 迷宫: mountain walls forming a maze with corridors ============
function genLabyrinth(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, _seed: number) {
  // Grid-based maze using recursive backtracking on a coarse grid
  const cellW = 6 // maze cell width in terrain cells
  const cellH = 6
  const mazeCols = Math.floor((cols - SAFE_CELLS * 2) / cellW)
  const mazeRows = Math.floor((rows - SAFE_CELLS * 2) / cellH)
  const ox = SAFE_CELLS + 1
  const oy = SAFE_CELLS + 1

  // Fill maze area with walls
  for (let y = oy; y < rows - SAFE_CELLS; y++) {
    for (let x = ox; x < cols - SAFE_CELLS; x++) {
      t[y][x] = 'mountain'
    }
  }

  // Carve rooms
  const visited = new Set<string>()
  const stack: [number, number][] = []
  const start: [number, number] = [0, 0]
  visited.add(`${start[0]},${start[1]}`)
  stack.push(start)
  carveRoom(t, ox, oy, cellW, cellH, cols, rows)

  while (stack.length > 0) {
    const [cx, cy] = stack[stack.length - 1]
    const neighbors: [number, number, number, number][] = [] // nx,ny,wallX,wallY
    const dirs: [number, number][] = [[0, -1], [0, 1], [-1, 0], [1, 0]]
    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy
      if (nx >= 0 && nx < mazeCols && ny >= 0 && ny < mazeRows && !visited.has(`${nx},${ny}`)) {
        neighbors.push([nx, ny, cx * cellW + ox + (dx > 0 ? cellW - 1 : dx < 0 ? 0 : Math.floor(cellW / 2)),
                                cy * cellH + oy + (dy > 0 ? cellH - 1 : dy < 0 ? 0 : Math.floor(cellH / 2))])
      }
    }
    if (neighbors.length === 0) { stack.pop(); continue }
    const [nx, ny] = rng.pick(neighbors)
    visited.add(`${nx},${ny}`)
    stack.push([nx, ny])
    // Carve room at new cell
    carveRoom(t, ox + nx * cellW, oy + ny * cellH, cellW, cellH, cols, rows)
    // Carve corridor between
    const midX = ox + Math.floor((cx + nx) * cellW / 2 + cellW / 2)
    const midY = oy + Math.floor((cy + ny) * cellH / 2 + cellH / 2)
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (midX + dx >= 0 && midX + dx < cols && midY + dy >= 0 && midY + dy < rows)
          t[midY + dy][midX + dx] = 'plain'
      }
    }
  }

  // Scatter some forests in open areas
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (t[y][x] === 'plain' && !isInSafeZone(x, y, cols, rows) && rng.chance(0.06)) t[y][x] = 'forest'
    }
  }
}

function carveRoom(t: TerrainType[][], rx: number, ry: number, w: number, h: number, cols: number, rows: number) {
  for (let dy = 1; dy < h - 1; dy++) {
    for (let dx = 1; dx < w - 1; dx++) {
      const x = rx + dx, y = ry + dy
      if (x >= 0 && x < cols && y >= 0 && y < rows) t[y][x] = 'plain'
    }
  }
}

// ============ 群岛: scattered islands connected by bridges ============
function genIslands(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
  // Fill with water
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!isInSafeZone(x, y, cols, rows)) t[y][x] = 'river'
    }
  }

  // Create 6-10 islands using noise blobs
  const islandCount = rng.int(6, 10)
  const islands: { cx: number; cy: number; r: number }[] = []
  for (let i = 0; i < islandCount; i++) {
    const cx = rng.int(SAFE_CELLS + 5, cols - SAFE_CELLS - 5)
    const cy = rng.int(SAFE_CELLS + 5, rows - SAFE_CELLS - 5)
    const r = rng.int(3, 6)
    islands.push({ cx, cy, r })
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy)
        const noise = smoothNoise(cx + dx, cy + dy, 3, seed + i * 100) * 1.5
        if (dist < r + noise) {
          const x = cx + dx, y = cy + dy
          if (x >= 0 && x < cols && y >= 0 && y < rows) {
            t[y][x] = rng.chance(0.15) ? 'forest' : 'plain'
          }
        }
      }
    }
    // Small mountain in center of big islands
    if (r >= 5 && rng.chance(0.5)) {
      t[cy][cx] = 'mountain'
    }
  }

  // Connect islands with bridges — find closest pairs
  for (let i = 0; i < islands.length; i++) {
    let bestJ = -1, bestDist = Infinity
    for (let j = 0; j < islands.length; j++) {
      if (i === j) continue
      const d = Math.sqrt((islands[i].cx - islands[j].cx) ** 2 + (islands[i].cy - islands[j].cy) ** 2)
      if (d < bestDist) { bestDist = d; bestJ = j }
    }
    if (bestJ >= 0) {
      // Draw bridge line between them
      const a = islands[i], b = islands[bestJ]
      const steps = Math.ceil(bestDist)
      for (let s = 0; s <= steps; s++) {
        const frac = s / steps
        const bx = Math.round(a.cx + (b.cx - a.cx) * frac)
        const by = Math.round(a.cy + (b.cy - a.cy) * frac)
        if (bx >= 0 && bx < cols && by >= 0 && by < rows && t[by][bx] === 'river') {
          t[by][bx] = 'bridge'
        }
      }
    }
  }

  // Ensure corners are connected to nearest island
  const corners = [
    [SAFE_CELLS, SAFE_CELLS], [cols - SAFE_CELLS - 1, SAFE_CELLS],
    [SAFE_CELLS, rows - SAFE_CELLS - 1], [cols - SAFE_CELLS - 1, rows - SAFE_CELLS - 1],
  ]
  for (const [cx, cy] of corners) {
    let best = islands[0]
    let bestD = Infinity
    for (const isl of islands) {
      const d = Math.sqrt((isl.cx - cx) ** 2 + (isl.cy - cy) ** 2)
      if (d < bestD) { bestD = d; best = isl }
    }
    const steps = Math.ceil(bestD)
    for (let s = 0; s <= steps; s++) {
      const frac = s / steps
      const bx = Math.round(cx + (best.cx - cx) * frac)
      const by = Math.round(cy + (best.cy - cy) * frac)
      if (bx >= 0 && bx < cols && by >= 0 && by < rows && t[by][bx] === 'river') {
        t[by][bx] = 'bridge'
      }
    }
  }
}

// ============ 伏兵谷: narrow valley with dense forest on both sides ============
function genAmbushValley(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
  const midY = Math.floor(rows / 2)
  const valleyWidth = rng.int(6, 9)

  // Fill sides with forest
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (isInSafeZone(x, y, cols, rows)) continue
      const distFromCenter = Math.abs(y - midY)
      const noise = smoothNoise(x, y, 5, seed) * 3
      if (distFromCenter > valleyWidth / 2 + noise) {
        t[y][x] = 'forest'
        // Deeper forest becomes mountain
        if (distFromCenter > valleyWidth + 3 + noise && rng.chance(0.3)) {
          t[y][x] = 'mountain'
        }
      }
    }
  }

  // River crossing the valley
  const rx = Math.floor(cols / 2) + rng.int(-5, 5)
  for (let y = midY - valleyWidth; y <= midY + valleyWidth; y++) {
    if (y >= 0 && y < rows && t[y][rx] !== 'mountain') t[y][rx] = 'river'
    if (rx + 1 < cols && t[y][rx + 1] !== 'mountain') t[y][rx + 1] = 'river'
  }
  // Bridge
  t[midY][rx] = 'bridge'
  t[midY][rx + 1] = 'bridge'
  if (midY + 1 < rows) { t[midY + 1][rx] = 'bridge'; t[midY + 1][rx + 1] = 'bridge' }

  // Hidden paths from forest to valley (ambush routes)
  for (let i = 0; i < rng.int(3, 5); i++) {
    const px = rng.int(SAFE_CELLS + 3, cols - SAFE_CELLS - 3)
    for (let dy = -valleyWidth - 5; dy <= valleyWidth + 5; dy++) {
      const y = midY + dy
      if (y >= 0 && y < rows && t[y][px] === 'forest') t[y][px] = 'plain'
      if (px + 1 < cols && y >= 0 && y < rows && t[y][px + 1] === 'forest') t[y][px + 1] = 'plain'
    }
  }
}

// ============ 火山口: central volcanic crater with lava rivers ============
function genVolcano(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
  const midX = Math.floor(cols / 2)
  const midY = Math.floor(rows / 2)
  const craterR = Math.min(cols, rows) * 0.12
  const rimR = craterR + 4

  // Volcanic rim (mountain ring)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (isInSafeZone(x, y, cols, rows)) continue
      const dx = x - midX, dy = y - midY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const noise = smoothNoise(x, y, 4, seed) * 2
      if (dist >= craterR + noise && dist <= rimR + noise) {
        t[y][x] = 'mountain'
      }
      // Inside crater: river (lava lake)
      if (dist < craterR * 0.6 + noise) {
        t[y][x] = 'river'
      }
    }
  }

  // Lava rivers radiating outward (4 directions)
  const lavaAngles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5]
  for (const angle of lavaAngles) {
    let lx = midX, ly = midY
    for (let r = 0; r < Math.max(cols, rows) * 0.4; r++) {
      lx = Math.round(midX + Math.cos(angle + smoothNoise(r, 0, 5, seed + 999) * 0.3) * r)
      ly = Math.round(midY + Math.sin(angle + smoothNoise(r, 1, 5, seed + 999) * 0.3) * r)
      if (lx >= 0 && lx < cols && ly >= 0 && ly < rows && !isInSafeZone(lx, ly, cols, rows)) {
        if (t[ly][lx] !== 'mountain') t[ly][lx] = 'river'
      }
    }
    // Bridges across lava rivers
    const bDist = rng.int(Math.floor(rimR) + 3, Math.floor(rimR) + 10)
    const bx = Math.round(midX + Math.cos(angle + Math.PI / 4) * bDist)
    const by = Math.round(midY + Math.sin(angle + Math.PI / 4) * bDist)
    if (bx >= 0 && bx < cols && by >= 0 && by < rows && t[by][bx] === 'river') t[by][bx] = 'bridge'
  }

  // Crater gates (break rim)
  for (const angle of lavaAngles) {
    for (let w = -2; w <= 2; w++) {
      for (let r = craterR - 1; r <= rimR + 2; r++) {
        const gx = Math.round(midX + Math.cos(angle) * r + Math.cos(angle + Math.PI / 2) * w)
        const gy = Math.round(midY + Math.sin(angle) * r + Math.sin(angle + Math.PI / 2) * w)
        if (gx >= 0 && gx < cols && gy >= 0 && gy < rows && t[gy][gx] === 'mountain') {
          t[gy][gx] = 'plain'
        }
      }
    }
  }

  // Scattered forests outside crater
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (t[y][x] !== 'plain' || isInSafeZone(x, y, cols, rows)) continue
      const dx = x - midX, dy = y - midY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > rimR + 3) {
        const n = fbm(x, y, seed + 700)
        if (n > 0.55 && n < 0.68) t[y][x] = 'forest'
      }
    }
  }
}

// ============ 长城: a long wall dividing the map with towers ============
function genGreatWall(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
  // Wall runs horizontally with some curve
  let wallY = Math.floor(rows * 0.45)
  for (let x = 0; x < cols; x++) {
    if (isInSafeZone(x, wallY, cols, rows)) continue
    // Wall is 2-3 cells thick
    for (let dy = -1; dy <= 1; dy++) {
      const y = wallY + dy
      if (y >= 0 && y < rows && !isInSafeZone(x, y, cols, rows)) t[y][x] = 'wall'
    }
    // Curve
    if (rng.chance(0.15)) wallY += rng.int(-1, 1)
    wallY = Math.max(SAFE_CELLS + 3, Math.min(rows - SAFE_CELLS - 3, wallY))
  }

  // Gates every ~15 cells
  for (let gx = SAFE_CELLS + 8; gx < cols - SAFE_CELLS - 5; gx += rng.int(12, 18)) {
    const gateW = rng.int(2, 3)
    for (let dx = -gateW; dx <= gateW; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const x = gx + dx, y = wallY + dy
        if (x >= 0 && x < cols && y >= 0 && y < rows && t[y][x] === 'wall') {
          t[y][x] = 'bridge'
        }
      }
    }
  }

  // Watchtowers along wall (small mountain bumps)
  for (let tx = SAFE_CELLS + 5; tx < cols - SAFE_CELLS - 3; tx += rng.int(8, 14)) {
    for (let dy = -2; dy <= 2; dy++) {
      const y = wallY + dy
      if (y >= 0 && y < rows && !isInSafeZone(tx, y, cols, rows)) {
        if (Math.abs(dy) <= 1) t[y][tx] = 'wall'
        else t[y][tx] = 'mountain'
      }
    }
  }

  // Northern terrain: mountains + forests (barbarian lands)
  for (let y = 0; y < wallY - 2; y++) {
    for (let x = 0; x < cols; x++) {
      if (isInSafeZone(x, y, cols, rows)) continue
      const n = fbm(x, y, seed)
      if (n > 0.5 && n < 0.65) t[y][x] = 'forest'
      else if (n > 0.72) setIfPlain(t, x, y, 'mountain', cols, rows)
    }
  }

  // Southern terrain: plains + farming (civilized)
  for (let y = wallY + 3; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (isInSafeZone(x, y, cols, rows)) continue
      const n = fbm(x, y, seed + 300)
      if (n > 0.58 && n < 0.68) t[y][x] = 'forest'
    }
  }

  // River on the southern side
  if (rng.chance(0.6)) {
    let ry = wallY + rng.int(5, 8)
    for (let x = SAFE_CELLS; x < cols - SAFE_CELLS; x++) {
      if (!isInSafeZone(x, ry, cols, rows)) setIfPlain(t, x, ry, 'river', cols, rows)
      if (rng.chance(0.2)) ry += rng.int(-1, 1)
      ry = Math.max(wallY + 4, Math.min(rows - SAFE_CELLS - 2, ry))
    }
    placeBridgesH(t, cols, rows, rng, 2)
  }

  // Southern city (civilized side)
  placeSmallFort(t, Math.floor(cols * 0.5), wallY + rng.int(10, 14), 5, 4, cols, rows, ['n', 's', 'e', 'w'])

  // Northern barbarian camp
  placeSmallFort(t, Math.floor(cols * 0.5), Math.floor(wallY * 0.4), 3, 2, cols, rows, ['s'])
}

// ============ 螺旋: spiral mountain walls forcing circular movement ============
function genSpiral(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
  const midX = Math.floor(cols / 2)
  const midY = Math.floor(rows / 2)
  const maxR = Math.min(cols, rows) * 0.42

  // Draw a spiral wall from outside to inside
  const turns = 2.5
  const totalAngle = turns * Math.PI * 2
  const steps = 300

  for (let s = 0; s < steps; s++) {
    const t2 = s / steps
    const angle = t2 * totalAngle
    const r = maxR * (1 - t2 * 0.85)
    const cx = Math.round(midX + Math.cos(angle) * r)
    const cy = Math.round(midY + Math.sin(angle) * r)

    // Wall thickness: 1-2 cells
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 0; dx++) {
        const wx = cx + dx, wy = cy + dy
        if (wx >= 0 && wx < cols && wy >= 0 && wy < rows && !isInSafeZone(wx, wy, cols, rows)) {
          t[wy][wx] = 'mountain'
        }
      }
    }
  }

  // Clear the center
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      if (midX + dx >= 0 && midX + dx < cols && midY + dy >= 0 && midY + dy < rows)
        t[midY + dy][midX + dx] = 'plain'
    }
  }

  // Add gaps in the spiral walls (passages)
  for (let i = 0; i < rng.int(5, 8); i++) {
    const gAngle = rng.float(0, totalAngle)
    const gR = maxR * (1 - (gAngle / totalAngle) * 0.85)
    const gx = Math.round(midX + Math.cos(gAngle) * gR)
    const gy = Math.round(midY + Math.sin(gAngle) * gR)
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const wx = gx + dx, wy = gy + dy
        if (wx >= 0 && wx < cols && wy >= 0 && wy < rows && t[wy][wx] === 'mountain')
          t[wy][wx] = 'plain'
      }
    }
  }

  // Scatter forests in open areas
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (t[y][x] === 'plain' && !isInSafeZone(x, y, cols, rows)) {
        const n = fbm(x, y, seed)
        if (n > 0.6 && n < 0.7) t[y][x] = 'forest'
      }
    }
  }
}

// ============ 绿洲: desert with central water source ============
function genOasis(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
  const midX = Math.floor(cols / 2)
  const midY = Math.floor(rows / 2)

  // Scatter small mountain "dunes" everywhere
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (isInSafeZone(x, y, cols, rows)) continue
      const n = fbm(x, y, seed)
      if (n > 0.72) t[y][x] = 'mountain' // rocky outcrops
    }
  }

  // Central oasis: water + surrounding forest
  const oasisR = Math.min(cols, rows) * 0.1
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const dx = x - midX, dy = y - midY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const noise = smoothNoise(x, y, 4, seed + 300) * 2
      if (dist < oasisR * 0.5 + noise) {
        t[y][x] = 'river' // water
      } else if (dist < oasisR + noise) {
        t[y][x] = 'forest' // vegetation ring
      }
    }
  }

  // Bridges across the oasis water
  for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    for (let r = 0; r < oasisR; r++) {
      const bx = Math.round(midX + Math.cos(angle) * r)
      const by = Math.round(midY + Math.sin(angle) * r)
      if (bx >= 0 && bx < cols && by >= 0 && by < rows && t[by][bx] === 'river')
        t[by][bx] = 'bridge'
    }
  }

  // Small secondary oases near corners
  const corners = [
    [Math.floor(cols * 0.25), Math.floor(rows * 0.25)],
    [Math.floor(cols * 0.75), Math.floor(rows * 0.75)],
  ]
  for (const [cx, cy] of corners) {
    if (rng.chance(0.7)) {
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          if (dx * dx + dy * dy > 9) continue
          const x = cx + dx, y = cy + dy
          if (x >= 0 && x < cols && y >= 0 && y < rows && !isInSafeZone(x, y, cols, rows)) {
            t[y][x] = dx * dx + dy * dy <= 2 ? 'river' : 'forest'
          }
        }
      }
    }
  }
}

// ============ 冰河: frozen rivers as passable bridges, mountain shores ============
function genFrozenRiver(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
  // Two major frozen rivers crossing the map
  // River 1: horizontal
  let ry = Math.floor(rows * 0.35)
  for (let x = 0; x < cols; x++) {
    for (let dy = -1; dy <= 1; dy++) {
      const y = ry + dy
      if (y >= 0 && y < rows && !isInSafeZone(x, y, cols, rows)) {
        t[y][x] = 'bridge' // frozen = passable but slow
      }
    }
    if (rng.chance(0.2)) ry += rng.int(-1, 1)
    ry = Math.max(SAFE_CELLS + 3, Math.min(rows - SAFE_CELLS - 3, ry))
  }

  // River 2: vertical
  let rx = Math.floor(cols * 0.6)
  for (let y = 0; y < rows; y++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = rx + dx
      if (x >= 0 && x < cols && !isInSafeZone(x, y, cols, rows)) {
        t[y][x] = 'bridge'
      }
    }
    if (rng.chance(0.2)) rx += rng.int(-1, 1)
    rx = Math.max(SAFE_CELLS + 3, Math.min(cols - SAFE_CELLS - 3, rx))
  }

  // Mountain shores along frozen rivers
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (t[y][x] !== 'bridge' || isInSafeZone(x, y, cols, rows)) continue
      // Check neighbors: if plain, maybe add mountain shore
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && t[ny][nx] === 'plain') {
          if (rng.chance(0.15) && !isInSafeZone(nx, ny, cols, rows)) t[ny][nx] = 'mountain'
        }
      }
    }
  }

  // Forests in the quadrants between rivers
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (t[y][x] !== 'plain' || isInSafeZone(x, y, cols, rows)) continue
      const n = fbm(x, y, seed)
      if (n > 0.5 && n < 0.63) t[y][x] = 'forest'
    }
  }
}

// ============ 斗兽场: circular arena with tiered walls ============
function genArena(t: TerrainType[][], cols: number, rows: number, _rng: SeededRandom, seed: number) {
  const midX = Math.floor(cols / 2)
  const midY = Math.floor(rows / 2)
  const outerR = Math.min(cols, rows) * 0.4
  const innerR = outerR * 0.75
  const pitR = outerR * 0.45

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (isInSafeZone(x, y, cols, rows)) continue
      const dx = x - midX, dy = y - midY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const noise = smoothNoise(x, y, 6, seed) * 1.5

      if (dist > outerR + noise) {
        // Outside arena — forest spectators
        const n = fbm(x, y, seed + 400)
        if (n > 0.5 && n < 0.65) t[y][x] = 'forest'
      } else if (dist > innerR + noise) {
        // Outer wall tier
        t[y][x] = 'mountain'
      } else if (dist > pitR + noise && dist < pitR + 2 + noise) {
        // Inner wall tier (lower)
        t[y][x] = 'wall'
      }
      // Inside pit = plain (battle arena)
    }
  }

  // 4 entrance gates through the walls
  for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    for (let r = pitR - 2; r <= outerR + 3; r++) {
      for (let w = -2; w <= 2; w++) {
        const gx = Math.round(midX + Math.cos(angle) * r + Math.cos(angle + Math.PI / 2) * w)
        const gy = Math.round(midY + Math.sin(angle) * r + Math.sin(angle + Math.PI / 2) * w)
        if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) {
          if (t[gy][gx] === 'mountain' || t[gy][gx] === 'wall') t[gy][gx] = 'plain'
        }
      }
    }
  }
}

// ============ 八卦阵: octagonal pattern with inner chambers ============
function genBagua(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
  const midX = Math.floor(cols / 2)
  const midY = Math.floor(rows / 2)

  // Draw 8 radial walls from center outward (like spokes)
  for (let spoke = 0; spoke < 8; spoke++) {
    const angle = (Math.PI * 2 * spoke) / 8
    const length = Math.min(cols, rows) * 0.32
    for (let r = 5; r < length; r++) {
      const wx = Math.round(midX + Math.cos(angle) * r)
      const wy = Math.round(midY + Math.sin(angle) * r)
      if (wx >= 0 && wx < cols && wy >= 0 && wy < rows && !isInSafeZone(wx, wy, cols, rows)) {
        t[wy][wx] = 'mountain'
      }
    }
  }

  // Concentric ring walls at 2 radii
  for (const ringR of [Math.min(cols, rows) * 0.15, Math.min(cols, rows) * 0.28]) {
    for (let a = 0; a < 360; a++) {
      const angle = (a * Math.PI) / 180
      const rx = Math.round(midX + Math.cos(angle) * ringR)
      const ry = Math.round(midY + Math.sin(angle) * ringR)
      if (rx >= 0 && rx < cols && ry >= 0 && ry < rows && !isInSafeZone(rx, ry, cols, rows)) {
        t[ry][rx] = 'mountain'
      }
    }
  }

  // Open gates at every other spoke intersection with rings
  for (let spoke = 0; spoke < 8; spoke += 2) {
    const angle = (Math.PI * 2 * spoke) / 8
    for (const ringR of [Math.min(cols, rows) * 0.15, Math.min(cols, rows) * 0.28]) {
      for (let w = -2; w <= 2; w++) {
        const gx = Math.round(midX + Math.cos(angle) * ringR + Math.cos(angle + Math.PI / 2) * w)
        const gy = Math.round(midY + Math.sin(angle) * ringR + Math.sin(angle + Math.PI / 2) * w)
        if (gx >= 0 && gx < cols && gy >= 0 && gy < rows && t[gy][gx] === 'mountain')
          t[gy][gx] = 'plain'
      }
    }
    // Clear spoke gaps too
    for (let r = 3; r < Math.min(cols, rows) * 0.32; r += rng.int(4, 7)) {
      for (let w = -1; w <= 1; w++) {
        const gx = Math.round(midX + Math.cos(angle) * r)
        const gy = Math.round(midY + Math.sin(angle) * r + w)
        if (gx >= 0 && gx < cols && gy >= 0 && gy < rows && t[gy][gx] === 'mountain')
          t[gy][gx] = 'plain'
      }
    }
  }

  // Center clearing
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      if (midX + dx >= 0 && midX + dx < cols && midY + dy >= 0 && midY + dy < rows)
        t[midY + dy][midX + dx] = 'plain'
    }
  }

  // Forest in some chambers
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (t[y][x] === 'plain' && !isInSafeZone(x, y, cols, rows)) {
        const n = fbm(x, y, seed + 800)
        if (n > 0.6 && n < 0.68) t[y][x] = 'forest'
      }
    }
  }
}

// ============ 荒原: sparse terrain, scattered rocks, dust storm feel ============
function genWasteland(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
  // Sparse rocky outcrops using noise
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (isInSafeZone(x, y, cols, rows)) continue
      const n = fbm(x, y, seed)
      if (n > 0.73) t[y][x] = 'mountain'
      else if (n > 0.67 && n < 0.7) t[y][x] = 'forest' // scrub bushes
    }
  }

  // Dried riverbed (ford terrain — slow but passable)
  let ry = rng.int(Math.floor(rows * 0.3), Math.floor(rows * 0.7))
  for (let x = 0; x < cols; x++) {
    if (!isInSafeZone(x, ry, cols, rows)) t[ry][x] = 'ford'
    if (rng.chance(0.3)) ry += rng.int(-1, 1)
    ry = Math.max(SAFE_CELLS + 2, Math.min(rows - SAFE_CELLS - 2, ry))
  }

  // A few large rock formations
  for (let i = 0; i < rng.int(3, 6); i++) {
    const cx = rng.int(SAFE_CELLS + 4, cols - SAFE_CELLS - 4)
    const cy = rng.int(SAFE_CELLS + 4, rows - SAFE_CELLS - 4)
    const r = rng.int(2, 4)
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue
        const nx = cx + dx, ny = cy + dy
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !isInSafeZone(nx, ny, cols, rows)) {
          t[ny][nx] = rng.chance(0.7) ? 'mountain' : 'plain'
        }
      }
    }
  }
}

// ============ 瀑布峡: vertical river with waterfalls at cliff faces ============
function genWaterfall(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
  const midX = Math.floor(cols / 2)

  // Central river flowing top to bottom
  let rx = midX
  for (let y = 0; y < rows; y++) {
    if (!isInSafeZone(rx, y, cols, rows)) t[y][rx] = 'river'
    if (rx + 1 < cols && !isInSafeZone(rx + 1, y, cols, rows)) t[y][rx + 1] = 'river'
    if (rng.chance(0.2)) rx += rng.int(-1, 1)
    rx = Math.max(SAFE_CELLS + 3, Math.min(cols - SAFE_CELLS - 3, rx))
  }

  // Cliff faces along the river (mountain walls on both sides)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (t[y][x] !== 'river') continue
      for (const dx of [-2, -3, 2, 3]) {
        const nx = x + dx
        if (nx >= 0 && nx < cols && !isInSafeZone(nx, y, cols, rows) && t[y][nx] === 'plain') {
          if (rng.chance(0.6)) t[y][nx] = 'mountain'
        }
      }
    }
  }

  // Bridges at 3 points
  const bridgeYs = [Math.floor(rows * 0.2), Math.floor(rows * 0.5), Math.floor(rows * 0.8)]
  for (const by of bridgeYs) {
    for (let x = 0; x < cols; x++) {
      if (t[by]?.[x] === 'river') t[by][x] = 'bridge'
    }
    // Clear cliffs near bridges
    for (let dx = -4; dx <= 4; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const nx = midX + dx, ny = by + dy
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && t[ny][nx] === 'mountain') {
          t[ny][nx] = 'plain'
        }
      }
    }
  }

  // Forests on both sides
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (t[y][x] !== 'plain' || isInSafeZone(x, y, cols, rows)) continue
      const n = fbm(x, y, seed)
      if (n > 0.52 && n < 0.64) t[y][x] = 'forest'
    }
  }
}

// ============ 棱堡: star-shaped fortress with angular walls ============
function genStarfort(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, _seed: number) {
  const midX = Math.floor(cols / 2)
  const midY = Math.floor(rows / 2)
  const points = 5
  const outerR = Math.min(cols, rows) * 0.3
  const innerR = outerR * 0.55

  // Draw star shape with walls
  for (let a = 0; a < 360; a++) {
    const angle = (a * Math.PI) / 180
    // Alternate between outer and inner radius for star shape
    const pointAngle = (Math.floor(a / (360 / points)) + 0.5) * (360 / points) * Math.PI / 180
    const angleDiff = Math.abs(angle - pointAngle)
    const normalDiff = angleDiff > Math.PI ? 2 * Math.PI - angleDiff : angleDiff
    const starR = innerR + (outerR - innerR) * Math.max(0, 1 - normalDiff * points / Math.PI)

    // Wall line at this radius
    for (let dr = -1; dr <= 1; dr++) {
      const r = starR + dr
      const wx = Math.round(midX + Math.cos(angle) * r)
      const wy = Math.round(midY + Math.sin(angle) * r)
      if (wx >= 0 && wx < cols && wy >= 0 && wy < rows && !isInSafeZone(wx, wy, cols, rows)) {
        t[wy][wx] = 'wall'
      }
    }
  }

  // 5 gates at each point of the star
  for (let p = 0; p < points; p++) {
    const angle = (2 * Math.PI * p) / points
    for (let r = innerR - 2; r <= outerR + 3; r++) {
      for (let w = -2; w <= 2; w++) {
        const gx = Math.round(midX + Math.cos(angle) * r + Math.cos(angle + Math.PI / 2) * w)
        const gy = Math.round(midY + Math.sin(angle) * r + Math.sin(angle + Math.PI / 2) * w)
        if (gx >= 0 && gx < cols && gy >= 0 && gy < rows && t[gy][gx] === 'wall') {
          t[gy][gx] = 'bridge'
        }
      }
    }
  }

  // Moat around the star
  if (rng.chance(0.6)) {
    for (let a = 0; a < 360; a++) {
      const angle = (a * Math.PI) / 180
      const moatR = outerR + 4
      const mx = Math.round(midX + Math.cos(angle) * moatR)
      const my = Math.round(midY + Math.sin(angle) * moatR)
      if (mx >= 0 && mx < cols && my >= 0 && my < rows && !isInSafeZone(mx, my, cols, rows) && t[my][mx] === 'plain') {
        t[my][mx] = 'river'
      }
    }
    // Bridges at gates over moat
    for (let p = 0; p < points; p++) {
      const angle = (2 * Math.PI * p) / points
      const moatR = outerR + 4
      for (let dr = -1; dr <= 2; dr++) {
        const bx = Math.round(midX + Math.cos(angle) * (moatR + dr))
        const by = Math.round(midY + Math.sin(angle) * (moatR + dr))
        if (bx >= 0 && bx < cols && by >= 0 && by < rows && t[by][bx] === 'river') t[by][bx] = 'bridge'
      }
    }
  }
}

// ============ 地牢: dense rooms connected by narrow corridors ============
function genDungeon(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, _seed: number) {
  // Fill with walls
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!isInSafeZone(x, y, cols, rows)) t[y][x] = 'mountain'
    }
  }

  // Place random rooms
  const rooms: { x: number; y: number; w: number; h: number }[] = []
  for (let attempt = 0; attempt < 40; attempt++) {
    const w = rng.int(4, 8)
    const h = rng.int(4, 7)
    const x = rng.int(SAFE_CELLS + 1, cols - SAFE_CELLS - w - 1)
    const y = rng.int(SAFE_CELLS + 1, rows - SAFE_CELLS - h - 1)

    // Check no overlap with existing rooms
    const overlap = rooms.some((r) =>
      x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y
    )
    if (overlap) continue

    rooms.push({ x, y, w, h })
    // Carve room
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        t[y + dy][x + dx] = rng.chance(0.05) ? 'forest' : 'plain'
      }
    }
  }

  // Connect rooms with corridors (connect each room to the nearest)
  for (let i = 0; i < rooms.length; i++) {
    let bestJ = -1, bestDist = Infinity
    for (let j = 0; j < rooms.length; j++) {
      if (i === j) continue
      const d = Math.abs(rooms[i].x - rooms[j].x) + Math.abs(rooms[i].y - rooms[j].y)
      if (d < bestDist) { bestDist = d; bestJ = j }
    }
    if (bestJ < 0) continue

    const a = rooms[i], b = rooms[bestJ]
    const ax = a.x + Math.floor(a.w / 2), ay = a.y + Math.floor(a.h / 2)
    const bx = b.x + Math.floor(b.w / 2), by = b.y + Math.floor(b.h / 2)

    // L-shaped corridor
    let cx = ax
    while (cx !== bx) {
      if (t[ay]?.[cx] === 'mountain') t[ay][cx] = 'plain'
      if (ay + 1 < rows && t[ay + 1]?.[cx] === 'mountain') t[ay + 1][cx] = 'plain'
      cx += cx < bx ? 1 : -1
    }
    let cy = ay
    while (cy !== by) {
      if (t[cy]?.[bx] === 'mountain') t[cy][bx] = 'plain'
      if (bx + 1 < cols && t[cy]?.[bx + 1] === 'mountain') t[cy][bx + 1] = 'plain'
      cy += cy < by ? 1 : -1
    }
  }

  // Ensure corners connect to nearest room
  const corners = [[SAFE_CELLS, SAFE_CELLS], [cols - SAFE_CELLS - 1, SAFE_CELLS],
                   [SAFE_CELLS, rows - SAFE_CELLS - 1], [cols - SAFE_CELLS - 1, rows - SAFE_CELLS - 1]]
  for (const [sx, sy] of corners) {
    let best = rooms[0]
    let bestD = Infinity
    for (const r of rooms) {
      const d = Math.abs(r.x - sx) + Math.abs(r.y - sy)
      if (d < bestD) { bestD = d; best = r }
    }
    if (!best) continue
    const bx = best.x + Math.floor(best.w / 2), by = best.y + Math.floor(best.h / 2)
    let cx = sx, cy = sy
    while (cx !== bx) { if (t[cy]?.[cx] === 'mountain') t[cy][cx] = 'plain'; cx += cx < bx ? 1 : -1 }
    while (cy !== by) { if (t[cy]?.[bx] === 'mountain') t[cy][bx] = 'plain'; cy += cy < by ? 1 : -1 }
  }
}

// ============ 棋盘: alternating blocks of terrain like a chess board ============
function genChessboard(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, _seed: number) {
  const blockSize = rng.int(5, 7)
  const types: TerrainType[] = ['forest', 'mountain', 'plain', 'forest']

  for (let by = 0; by < rows; by += blockSize) {
    for (let bx = 0; bx < cols; bx += blockSize) {
      const gridX = Math.floor(bx / blockSize)
      const gridY = Math.floor(by / blockSize)
      const isBlack = (gridX + gridY) % 2 === 0

      // Black squares: forest or mountain, White squares: plain
      const blockType = isBlack ? rng.pick(types) : 'plain'

      for (let dy = 0; dy < blockSize && by + dy < rows; dy++) {
        for (let dx = 0; dx < blockSize && bx + dx < cols; dx++) {
          const x = bx + dx, y = by + dy
          if (isInSafeZone(x, y, cols, rows)) continue
          t[y][x] = blockType
        }
      }
    }
  }

  // Paths between blocks (ensure connectivity)
  for (let by = 0; by < rows; by += blockSize) {
    for (let bx = 0; bx < cols; bx += blockSize) {
      // Clear 2-wide paths at block edges
      const edgeX = bx + blockSize - 1
      const edgeY = by + blockSize - 1
      if (edgeX < cols) {
        for (let dy = 0; dy < 2 && by + blockSize / 2 + dy < rows; dy++) {
          const y = by + Math.floor(blockSize / 2) + dy
          if (y >= 0 && y < rows && !isInSafeZone(edgeX, y, cols, rows)) t[y][edgeX] = 'plain'
          if (edgeX + 1 < cols && !isInSafeZone(edgeX + 1, y, cols, rows)) t[y][edgeX + 1] = 'plain'
        }
      }
      if (edgeY < rows) {
        for (let dx = 0; dx < 2 && bx + blockSize / 2 + dx < cols; dx++) {
          const x = bx + Math.floor(blockSize / 2) + dx
          if (x >= 0 && x < cols && !isInSafeZone(x, edgeY, cols, rows)) t[edgeY][x] = 'plain'
          if (edgeY + 1 < rows && !isInSafeZone(x, edgeY + 1, cols, rows)) t[edgeY + 1][x] = 'plain'
        }
      }
    }
  }

  // Add some water features in the center
  if (rng.chance(0.5)) {
    const midX = Math.floor(cols / 2), midY = Math.floor(rows / 2)
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (midX + dx >= 0 && midX + dx < cols && midY + dy >= 0 && midY + dy < rows) {
          t[midY + dy][midX + dx] = dx * dx + dy * dy <= 2 ? 'river' : 'bridge'
        }
      }
    }
  }
}

// ============ Siege Castle ============
function genSiegeCastle(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
  const midX = Math.floor(cols / 2)
  const midY = Math.floor(rows / 2)
  const wallHalfW = Math.floor(cols * 0.18) // castle half-width in cells
  const wallHalfH = Math.floor(rows * 0.2)

  // Build rectangular castle walls
  for (let x = midX - wallHalfW; x <= midX + wallHalfW; x++) {
    for (let y = midY - wallHalfH; y <= midY + wallHalfH; y++) {
      if (x < 0 || x >= cols || y < 0 || y >= rows) continue
      const onEdge =
        x === midX - wallHalfW || x === midX + wallHalfW ||
        y === midY - wallHalfH || y === midY + wallHalfH
      if (onEdge) {
        t[y][x] = 'wall'
      }
    }
  }

  // 4 gates (bridge cells) — one per side, centered
  const gateW = 2

  // North gate
  for (let dx = -gateW; dx <= gateW; dx++) {
    const gx = midX + dx
    if (gx >= 0 && gx < cols) t[midY - wallHalfH][gx] = 'bridge'
  }
  // South gate
  for (let dx = -gateW; dx <= gateW; dx++) {
    const gx = midX + dx
    if (gx >= 0 && gx < cols) t[midY + wallHalfH][gx] = 'bridge'
  }
  // West gate
  for (let dy = -gateW; dy <= gateW; dy++) {
    const gy = midY + dy
    if (gy >= 0 && gy < rows) t[gy][midX - wallHalfW] = 'bridge'
  }
  // East gate
  for (let dy = -gateW; dy <= gateW; dy++) {
    const gy = midY + dy
    if (gy >= 0 && gy < rows) t[gy][midX + wallHalfW] = 'bridge'
  }

  // Inside castle: mostly plain, a few forest patches
  for (let y = midY - wallHalfH + 1; y < midY + wallHalfH; y++) {
    for (let x = midX - wallHalfW + 1; x < midX + wallHalfW; x++) {
      if (x >= 0 && x < cols && y >= 0 && y < rows) {
        const n = fbm(x, y, seed + 777)
        t[y][x] = n > 0.65 ? 'forest' : 'plain'
      }
    }
  }

  // Outside: scattered forests and small hills
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (isInSafeZone(x, y, cols, rows)) continue
      // Skip castle interior
      if (x >= midX - wallHalfW && x <= midX + wallHalfW &&
          y >= midY - wallHalfH && y <= midY + wallHalfH) continue
      const n = fbm(x, y, seed + 888)
      if (n > 0.62 && n < 0.72) t[y][x] = 'forest'
    }
  }

  // A few hills outside
  for (let i = 0; i < rng.int(2, 4); i++) {
    let cx: number, cy: number
    do {
      cx = rng.int(SAFE_CELLS + 2, cols - SAFE_CELLS - 2)
      cy = rng.int(SAFE_CELLS + 2, rows - SAFE_CELLS - 2)
    } while (cx >= midX - wallHalfW - 3 && cx <= midX + wallHalfW + 3 &&
             cy >= midY - wallHalfH - 3 && cy <= midY + wallHalfH + 3)
    placeBlob(t, cx, cy, rng.int(1, 2), 'mountain', rng, rows, cols)
  }

  // Optional moat around castle
  if (rng.chance(0.5)) {
    for (let x = midX - wallHalfW - 1; x <= midX + wallHalfW + 1; x++) {
      for (let y = midY - wallHalfH - 1; y <= midY + wallHalfH + 1; y++) {
        if (x < 0 || x >= cols || y < 0 || y >= rows) continue
        const onMoat =
          x === midX - wallHalfW - 1 || x === midX + wallHalfW + 1 ||
          y === midY - wallHalfH - 1 || y === midY + wallHalfH + 1
        if (onMoat && t[y][x] === 'plain') t[y][x] = 'river'
      }
    }
    // Bridges at moat gates
    for (let dx = -gateW - 1; dx <= gateW + 1; dx++) {
      const gx = midX + dx
      if (gx >= 0 && gx < cols) {
        if (t[midY - wallHalfH - 1]?.[gx] === 'river') t[midY - wallHalfH - 1][gx] = 'bridge'
        if (t[midY + wallHalfH + 1]?.[gx] === 'river') t[midY + wallHalfH + 1][gx] = 'bridge'
      }
    }
    for (let dy = -gateW - 1; dy <= gateW + 1; dy++) {
      const gy = midY + dy
      if (gy >= 0 && gy < rows) {
        if (midX - wallHalfW - 1 >= 0 && t[gy][midX - wallHalfW - 1] === 'river')
          t[gy][midX - wallHalfW - 1] = 'bridge'
        if (midX + wallHalfW + 1 < cols && t[gy][midX + wallHalfW + 1] === 'river')
          t[gy][midX + wallHalfW + 1] = 'bridge'
      }
    }
  }
}

// ============ Helpers ============

// Place a small fort/town: rectangular wall with gate openings
function placeSmallFort(
  t: TerrainType[][], cx: number, cy: number,
  halfW: number, halfH: number,
  cols: number, rows: number,
  gateDirections: ('n' | 's' | 'e' | 'w')[] = ['n', 's', 'e', 'w'],
) {
  // Walls
  for (let x = cx - halfW; x <= cx + halfW; x++) {
    for (let y = cy - halfH; y <= cy + halfH; y++) {
      if (x < 0 || x >= cols || y < 0 || y >= rows || isInSafeZone(x, y, cols, rows)) continue
      const onEdge = x === cx - halfW || x === cx + halfW || y === cy - halfH || y === cy + halfH
      if (onEdge) t[y][x] = 'wall'
    }
  }
  // Gates
  const gateW = 1
  if (gateDirections.includes('n')) {
    for (let dx = -gateW; dx <= gateW; dx++) {
      const gx = cx + dx
      if (gx >= 0 && gx < cols) t[cy - halfH][gx] = 'bridge'
    }
  }
  if (gateDirections.includes('s')) {
    for (let dx = -gateW; dx <= gateW; dx++) {
      const gx = cx + dx
      if (gx >= 0 && gx < cols && cy + halfH < rows) t[cy + halfH][gx] = 'bridge'
    }
  }
  if (gateDirections.includes('w')) {
    for (let dy = -gateW; dy <= gateW; dy++) {
      const gy = cy + dy
      if (gy >= 0 && gy < rows) t[gy][cx - halfW] = 'bridge'
    }
  }
  if (gateDirections.includes('e')) {
    for (let dy = -gateW; dy <= gateW; dy++) {
      const gy = cy + dy
      if (gy >= 0 && gy < rows && cx + halfW < cols) t[gy][cx + halfW] = 'bridge'
    }
  }
}

function isInSafeZone(x: number, y: number, cols: number, rows: number): boolean {
  const s = SAFE_CELLS
  return (x < s && y < s) || (x >= cols - s && y < s) ||
         (x < s && y >= rows - s) || (x >= cols - s && y >= rows - s) ||
         (x < 6 && Math.abs(y - rows / 2) < 4) ||
         (x >= cols - 6 && Math.abs(y - rows / 2) < 4)
}

function setIfPlain(t: TerrainType[][], x: number, y: number, type: TerrainType, cols: number, rows: number) {
  if (x >= 0 && x < cols && y >= 0 && y < rows && t[y][x] === 'plain') t[y][x] = type
}

function placeBlob(t: TerrainType[][], cx: number, cy: number, r: number, type: TerrainType, rng: SeededRandom, rows: number, cols: number) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r && rng.chance(0.6)) {
        const x = cx + dx, y = cy + dy
        if (x >= 0 && x < cols && y >= 0 && y < rows && !isInSafeZone(x, y, cols, rows)) {
          setIfPlain(t, x, y, type, cols, rows)
        }
      }
    }
  }
}

function placeBridgesH(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, count: number) {
  for (let i = 0; i < count; i++) {
    const bx = rng.int(SAFE_CELLS + 2 + i * Math.floor(cols / count), Math.min(cols - SAFE_CELLS - 2, SAFE_CELLS + 2 + (i + 1) * Math.floor(cols / count)))
    for (let y = 0; y < rows; y++) {
      if (t[y][bx] === 'river') t[y][bx] = 'bridge'
      if (bx + 1 < cols && t[y][bx + 1] === 'river') t[y][bx + 1] = 'bridge'
    }
  }
}

function placeBridgesV(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, count: number) {
  for (let i = 0; i < count; i++) {
    const by = rng.int(SAFE_CELLS + 2 + i * Math.floor(rows / count), Math.min(rows - SAFE_CELLS - 2, SAFE_CELLS + 2 + (i + 1) * Math.floor(rows / count)))
    for (let x = 0; x < cols; x++) {
      if (t[by][x] === 'river') t[by][x] = 'bridge'
      if (by + 1 < rows && t[by + 1][x] === 'river') t[by + 1][x] = 'bridge'
    }
  }
}

function punchPasses(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, count: number) {
  for (let i = 0; i < count; i++) {
    const px = rng.int(SAFE_CELLS + 3, cols - SAFE_CELLS - 3)
    const w = rng.int(2, 3)
    for (let y = 0; y < rows; y++) {
      for (let dx = -w; dx <= w; dx++) {
        const x = px + dx
        if (x >= 0 && x < cols && t[y][x] === 'mountain') t[y][x] = 'plain'
      }
    }
  }
}

export function getTerrainAt(map: BattleMap, x: number, y: number): TerrainType {
  const col = Math.floor(x / map.cellSize)
  const row = Math.floor(y / map.cellSize)
  if (row < 0 || row >= map.terrain.length || col < 0 || col >= map.terrain[0].length) return 'plain'
  return map.terrain[row][col]
}

export function isPassable(map: BattleMap, x: number, y: number): boolean {
  return TERRAIN_MODIFIERS[getTerrainAt(map, x, y)].passable
}
