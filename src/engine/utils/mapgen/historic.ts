import { TerrainType } from '../../../types'
import { SeededRandom } from '../random'
import { smoothNoise, fbm } from './noise'
import {
  SAFE_CELLS, isInSafeZone, setIfPlain, placeBlob,
  placeBridgesH, placeSmallFort, carveCorridorToPass,
} from './helpers'

// ============ Changban ============
export function genChangban(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
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

  // ONE narrow bridge in the center
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

// ============ Chibi ============
export function genChibi(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
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

// ============ Hulao ============
export function genHulao(t: TerrainType[][], cols: number, rows: number, _rng: SeededRandom, seed: number) {
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

// ============ Jieting ============
export function genJieting(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
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

// ============ Canyon Bridge ============
export function genCanyonBridge(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, _seed: number) {
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

// ============ Three Kingdoms ============
export function genThreeKingdoms(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
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
