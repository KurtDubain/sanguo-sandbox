import { BattleMap, TerrainType } from '../../types'
import { BALANCE } from '../../config/balance'
import { TERRAIN_MODIFIERS } from '../../config/balance'
import { SeededRandom } from './random'

export type MapTemplate = 'valley' | 'crossroads' | 'fortress' | 'plains' | 'river_delta' | 'mountain_pass' | 'siege_castle' | 'changban' | 'chibi' | 'hulao' | 'jieting' | 'twin_lakes' | 'canyon_bridge' | 'three_kingdoms' | 'swamp' | 'random'

const MAP_TEMPLATE_NAMES: Record<MapTemplate, string> = {
  valley: '峡谷', crossroads: '十字路口', fortress: '中央要塞',
  plains: '大平原', river_delta: '三叉河口', mountain_pass: '关隘',
  siege_castle: '攻城', changban: '长坂坡', chibi: '赤壁',
  hulao: '虎牢关', jieting: '街亭',
  twin_lakes: '双湖', canyon_bridge: '栈道', three_kingdoms: '三分天下', swamp: '沼泽',
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
    tmpl = rng.pick(['valley', 'crossroads', 'fortress', 'plains', 'river_delta', 'mountain_pass', 'changban', 'chibi', 'hulao', 'jieting', 'twin_lakes', 'canyon_bridge', 'three_kingdoms', 'swamp'])
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
}

// ============ Crossroads ============
function genCrossroads(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
  const midX = Math.floor(cols / 2), midY = Math.floor(rows / 2)
  const roadW = 3

  // Fill quadrants with noise
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (Math.abs(x - midX) < roadW || Math.abs(y - midY) < roadW) continue
      if (isInSafeZone(x, y, cols, rows)) continue
      const n = fbm(x, y, seed)
      if (n > 0.65) t[y][x] = 'forest'
    }
  }
  // Mountain clusters in quadrant centers (NOT corners!)
  const qCenters = [
    [Math.floor(cols * 0.3), Math.floor(rows * 0.3)],
    [Math.floor(cols * 0.7), Math.floor(rows * 0.3)],
    [Math.floor(cols * 0.3), Math.floor(rows * 0.7)],
    [Math.floor(cols * 0.7), Math.floor(rows * 0.7)],
  ]
  for (const [cx, cy] of qCenters) {
    if (rng.chance(0.6)) placeBlob(t, cx, cy, rng.int(2, 3), 'mountain', rng, rows, cols)
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
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (isInSafeZone(x, y, cols, rows)) continue
      const n = fbm(x, y, seed)
      if (n > 0.58 && n < 0.7) t[y][x] = 'forest'
    }
  }
  // Small hills (away from edges)
  for (let i = 0; i < rng.int(3, 5); i++) {
    const cx = rng.int(SAFE_CELLS + 2, cols - SAFE_CELLS - 2)
    const cy = rng.int(SAFE_CELLS + 2, rows - SAFE_CELLS - 2)
    placeBlob(t, cx, cy, rng.int(1, 2), 'mountain', rng, rows, cols)
  }
  // Optional stream
  if (rng.chance(0.5)) {
    let x = rng.int(Math.floor(cols * 0.3), Math.floor(cols * 0.7))
    for (let y = SAFE_CELLS; y < rows - SAFE_CELLS; y++) {
      if (t[y][x] !== 'mountain') t[y][x] = 'river'
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
  for (let i = 0; i < rng.int(4, 7); i++) {
    const hx = rng.int(SAFE_CELLS + 3, cols - SAFE_CELLS - 3)
    const hy = rng.int(SAFE_CELLS + 3, rows - SAFE_CELLS - 3)
    placeBlob(t, hx, hy, rng.int(1, 3), 'mountain', rng, rows, cols)
  }
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
