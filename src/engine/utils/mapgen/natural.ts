import { TerrainType } from '../../../types'
import { SeededRandom } from '../random'
import { smoothNoise, fbm } from './noise'
import {
  SAFE_CELLS, isInSafeZone, setIfPlain, placeBlob,
  placeBridgesH, placeBridgesV, punchPasses, placeSmallFort,
  carveCorridorToPass,
} from './helpers'

// ============ Valley ============
export function genValley(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
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

// ============ Plains ============
export function genPlains(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
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
export function genRiverDelta(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, _seed: number) {
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
export function genMountainPass(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
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
  // Top-left -> pass
  carveCorridorToPass(t, 0, 0, midY, passWidth, cols, rows)
  // Top-right -> pass
  carveCorridorToPass(t, cols - 1, 0, midY, passWidth, cols, rows)
  // Bottom-left -> pass
  carveCorridorToPass(t, 0, rows - 1, midY, passWidth, cols, rows)
  // Bottom-right -> pass
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

// ============ Swamp ============
export function genSwamp(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
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

// ============ Twin Lakes ============
export function genTwinLakes(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
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

// ============ Oasis ============
export function genOasis(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
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

// ============ Frozen River ============
export function genFrozenRiver(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
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

// ============ Wasteland ============
export function genWasteland(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
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

// ============ Waterfall ============
export function genWaterfall(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
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
