import { TerrainType } from '../../../types'
import { SeededRandom } from '../random'
import { smoothNoise, fbm } from './noise'
import { SAFE_CELLS, isInSafeZone, carveRoom } from './helpers'

// ============ Labyrinth ============
export function genLabyrinth(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, _seed: number) {
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

// ============ Islands ============
export function genIslands(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
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

// ============ Spiral ============
export function genSpiral(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
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

// ============ Bagua ============
export function genBagua(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
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

// ============ Volcano ============
export function genVolcano(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
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

// ============ Dungeon ============
export function genDungeon(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, _seed: number) {
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

// ============ Chessboard ============
export function genChessboard(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, _seed: number) {
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

// ============ Ambush Valley ============
export function genAmbushValley(t: TerrainType[][], cols: number, rows: number, rng: SeededRandom, seed: number) {
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
