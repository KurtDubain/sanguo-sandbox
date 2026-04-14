// A* Pathfinding + Line of Sight
// Rewritten for reliability: proper ray-cast, robust A*, stuck recovery

import { BattleMap, Position } from '../../types'
import { TERRAIN_MODIFIERS } from '../../config/balance'

// ===================== Line of Sight =====================

type LOSMode = 'melee' | 'ranged'

export function hasLineOfSight(
  map: BattleMap,
  from: Position,
  to: Position,
  mode: LOSMode,
): boolean {
  const cells = bresenham(
    Math.floor(from.x / map.cellSize), Math.floor(from.y / map.cellSize),
    Math.floor(to.x / map.cellSize), Math.floor(to.y / map.cellSize),
  )
  for (const [col, row] of cells) {
    if (row < 0 || row >= map.terrain.length || col < 0 || col >= map.terrain[0].length) continue
    const type = map.terrain[row][col]
    if (type === 'mountain') return false
    if (mode === 'melee' && type === 'river') return false
  }
  return true
}

// Check if the straight line between two world positions crosses any impassable cell
export function isPathClear(map: BattleMap, from: Position, to: Position): boolean {
  const cells = bresenham(
    Math.floor(from.x / map.cellSize), Math.floor(from.y / map.cellSize),
    Math.floor(to.x / map.cellSize), Math.floor(to.y / map.cellSize),
  )
  for (const [col, row] of cells) {
    if (!isCellPassable(map, col, row)) return false
  }
  return true
}

function bresenham(x0: number, y0: number, x1: number, y1: number): [number, number][] {
  const cells: [number, number][] = []
  let dx = Math.abs(x1 - x0)
  let dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy
  let x = x0, y = y0
  for (let i = 0; i < 200; i++) { // safety limit
    cells.push([x, y])
    if (x === x1 && y === y1) break
    const e2 = 2 * err
    if (e2 > -dy) { err -= dy; x += sx }
    if (e2 < dx) { err += dx; y += sy }
  }
  return cells
}

// ===================== A* Pathfinding =====================

interface Node {
  col: number; row: number; g: number; f: number; parent: Node | null
}

export function findPath(
  map: BattleMap,
  from: Position,
  to: Position,
  maxNodes = 500,
): Position[] | null {
  const cs = map.cellSize
  const rows = map.terrain.length
  const cols = map.terrain[0].length

  let sc = Math.floor(from.x / cs)
  let sr = Math.floor(from.y / cs)
  let ec = Math.floor(to.x / cs)
  let er = Math.floor(to.y / cs)

  // Clamp to grid
  sc = clamp(sc, 0, cols - 1); sr = clamp(sr, 0, rows - 1)
  ec = clamp(ec, 0, cols - 1); er = clamp(er, 0, rows - 1)

  // If start is impassable, find nearest passable
  if (!isCellPassable(map, sc, sr)) {
    const p = findNearestPassable(map, sc, sr)
    if (!p) return null
    sc = p[0]; sr = p[1]
  }
  // If end is impassable, find nearest passable
  if (!isCellPassable(map, ec, er)) {
    const p = findNearestPassable(map, ec, er)
    if (!p) return null
    ec = p[0]; er = p[1]
  }

  if (sc === ec && sr === er) return [{ x: ec * cs + cs / 2, y: er * cs + cs / 2 }]

  // A* with open list as binary heap would be ideal but array is fine for ≤500 nodes
  const open: Node[] = [{ col: sc, row: sr, g: 0, f: heuristic(sc, sr, ec, er), parent: null }]
  const closedSet = new Set<number>()
  const key = (c: number, r: number) => r * cols + c
  const gScores = new Map<number, number>()
  gScores.set(key(sc, sr), 0)

  let checked = 0
  while (open.length > 0 && checked < maxNodes) {
    checked++

    // Find lowest f
    let bestIdx = 0
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[bestIdx].f) bestIdx = i
    }
    const cur = open[bestIdx]
    open[bestIdx] = open[open.length - 1]
    open.pop()

    if (cur.col === ec && cur.row === er) {
      return reconstructPath(cur, cs)
    }

    const ck = key(cur.col, cur.row)
    if (closedSet.has(ck)) continue
    closedSet.add(ck)

    // 8-directional neighbors
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue
        const nc = cur.col + dx
        const nr = cur.row + dy
        if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue

        const nk = key(nc, nr)
        if (closedSet.has(nk)) continue
        if (!isCellPassable(map, nc, nr)) continue

        // Diagonal: both adjacent must be passable (no corner cutting)
        if (dx !== 0 && dy !== 0) {
          if (!isCellPassable(map, cur.col + dx, cur.row) ||
              !isCellPassable(map, cur.col, cur.row + dy)) continue
        }

        const moveCost = dx !== 0 && dy !== 0 ? 1.414 : 1
        const terrain = map.terrain[nr][nc]
        const speedMult = TERRAIN_MODIFIERS[terrain].speedMult
        const terrainCost = speedMult > 0 ? 1 / speedMult : 100
        const newG = cur.g + moveCost * terrainCost

        const prevG = gScores.get(nk)
        if (prevG !== undefined && newG >= prevG) continue

        gScores.set(nk, newG)
        open.push({
          col: nc, row: nr, g: newG,
          f: newG + heuristic(nc, nr, ec, er),
          parent: cur,
        })
      }
    }
  }

  // A* failed — return partial path toward the closest visited node to the goal
  let bestNode: Node | null = null
  let bestDist = Infinity
  // Search through closed set is hard, so use gScores map
  for (const [k] of gScores) {
    const c = k % cols
    const r = Math.floor(k / cols)
    const d = heuristic(c, r, ec, er)
    if (d < bestDist) {
      bestDist = d
      // We need to reconstruct from this node, but we don't have the node object
      // Use a simpler fallback: just return the cell position as a single waypoint
      bestNode = { col: c, row: r, g: 0, f: 0, parent: null }
    }
  }
  if (bestNode && (bestNode.col !== sc || bestNode.row !== sr)) {
    return [{ x: bestNode.col * cs + cs / 2, y: bestNode.row * cs + cs / 2 }]
  }

  return null
}

function heuristic(c1: number, r1: number, c2: number, r2: number): number {
  const dc = Math.abs(c1 - c2)
  const dr = Math.abs(r1 - r2)
  return Math.max(dc, dr) + 0.414 * Math.min(dc, dr)
}

function reconstructPath(node: Node, cs: number): Position[] {
  const raw: Position[] = []
  let cur: Node | null = node
  while (cur) {
    raw.push({ x: cur.col * cs + cs / 2, y: cur.row * cs + cs / 2 })
    cur = cur.parent
  }
  raw.reverse()

  // Skip the first point (current position) and simplify
  if (raw.length <= 2) return raw

  // Path simplification: keep only points where direction changes
  const simplified: Position[] = [raw[0]]
  for (let i = 1; i < raw.length - 1; i++) {
    const prev = raw[i - 1]
    const curr = raw[i]
    const next = raw[i + 1]
    const dx1 = Math.sign(curr.x - prev.x)
    const dy1 = Math.sign(curr.y - prev.y)
    const dx2 = Math.sign(next.x - curr.x)
    const dy2 = Math.sign(next.y - curr.y)
    if (dx1 !== dx2 || dy1 !== dy2) {
      simplified.push(curr)
    }
  }
  simplified.push(raw[raw.length - 1])
  return simplified
}

function isCellPassable(map: BattleMap, col: number, row: number): boolean {
  if (row < 0 || row >= map.terrain.length || col < 0 || col >= map.terrain[0].length) return false
  return TERRAIN_MODIFIERS[map.terrain[row][col]].passable
}

function findNearestPassable(map: BattleMap, col: number, row: number): [number, number] | null {
  for (let r = 1; r < 15; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue
        const nc = col + dx
        const nr = row + dy
        if (isCellPassable(map, nc, nr)) return [nc, nr]
      }
    }
  }
  return null
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}
