import { TerrainType } from '../../../types'
import { SeededRandom } from '../random'
import { smoothNoise, fbm } from './noise'
import {
  SAFE_CELLS, isInSafeZone, setIfPlain, placeBlob,
  placeBridgesH, placeSmallFort,
} from './helpers'

// ============ Crossroads ============
export function genCrossroads(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
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
export function genFortress(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
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

// ============ Arena ============
export function genArena(t: TerrainType[][], cols: number, rows: number, _rng: SeededRandom, seed: number) {
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

// ============ Great Wall ============
export function genGreatWall(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
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

// ============ Starfort ============
export function genStarfort(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, _seed: number) {
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

// ============ Siege Castle ============
export function genSiegeCastle(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
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
