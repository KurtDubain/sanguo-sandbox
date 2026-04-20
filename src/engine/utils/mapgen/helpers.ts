import { TerrainType } from '../../../types'
import { SeededRandom } from '../random'

// Spawn safe zone: 12 cells around each corner guaranteed clear
export const SAFE_CELLS = 12

// Clear generous safe zones for spawning (runs AFTER all terrain generation)
export function clearSpawnZones(t: TerrainType[][], cols: number, rows: number) {
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

export function clearRect(t: TerrainType[][], sx: number, sy: number, w: number, h: number, cols: number, rows: number) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const x = sx + dx, y = sy + dy
      if (x >= 0 && x < cols && y >= 0 && y < rows) t[y][x] = 'plain'
    }
  }
}

export function isInSafeZone(x: number, y: number, cols: number, rows: number): boolean {
  const s = SAFE_CELLS
  return (x < s && y < s) || (x >= cols - s && y < s) ||
         (x < s && y >= rows - s) || (x >= cols - s && y >= rows - s) ||
         (x < 6 && Math.abs(y - rows / 2) < 4) ||
         (x >= cols - 6 && Math.abs(y - rows / 2) < 4)
}

export function setIfPlain(t: TerrainType[][], x: number, y: number, type: TerrainType, cols: number, rows: number) {
  if (x >= 0 && x < cols && y >= 0 && y < rows && t[y][x] === 'plain') t[y][x] = type
}

export function placeBlob(t: TerrainType[][], cx: number, cy: number, r: number, type: TerrainType, rng: SeededRandom, rows: number, cols: number) {
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

export function placeBridgesH(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, count: number) {
  for (let i = 0; i < count; i++) {
    const bx = rng.int(SAFE_CELLS + 2 + i * Math.floor(cols / count), Math.min(cols - SAFE_CELLS - 2, SAFE_CELLS + 2 + (i + 1) * Math.floor(cols / count)))
    for (let y = 0; y < rows; y++) {
      if (t[y][bx] === 'river') t[y][bx] = 'bridge'
      if (bx + 1 < cols && t[y][bx + 1] === 'river') t[y][bx + 1] = 'bridge'
    }
  }
}

export function placeBridgesV(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, count: number) {
  for (let i = 0; i < count; i++) {
    const by = rng.int(SAFE_CELLS + 2 + i * Math.floor(rows / count), Math.min(rows - SAFE_CELLS - 2, SAFE_CELLS + 2 + (i + 1) * Math.floor(rows / count)))
    for (let x = 0; x < cols; x++) {
      if (t[by][x] === 'river') t[by][x] = 'bridge'
      if (by + 1 < rows && t[by + 1][x] === 'river') t[by + 1][x] = 'bridge'
    }
  }
}

export function punchPasses(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, count: number) {
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

// Place a small fort/town: rectangular wall with gate openings
export function placeSmallFort(
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

export function carveRoom(t: TerrainType[][], rx: number, ry: number, w: number, h: number, cols: number, rows: number) {
  for (let dy = 1; dy < h - 1; dy++) {
    for (let dx = 1; dx < w - 1; dx++) {
      const x = rx + dx, y = ry + dy
      if (x >= 0 && x < cols && y >= 0 && y < rows) t[y][x] = 'plain'
    }
  }
}

// Carve a diagonal corridor from a corner to the pass level
export function carveCorridorToPass(
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
