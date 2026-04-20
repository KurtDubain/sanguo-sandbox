import { BattleMap } from '../../../../types'
import { TERRAIN_FILL, TERRAIN_PATTERN } from '../constants'

/** Create an offscreen canvas with the terrain pre-rendered. */
export function createTerrainCanvas(map: BattleMap): HTMLCanvasElement {
  const offscreen = document.createElement('canvas')
  offscreen.width = map.width
  offscreen.height = map.height
  const ctx = offscreen.getContext('2d')!

  ctx.fillStyle = '#0f1610'
  ctx.fillRect(0, 0, map.width, map.height)

  const s = map.cellSize
  for (let row = 0; row < map.terrain.length; row++) {
    for (let col = 0; col < map.terrain[0].length; col++) {
      const type = map.terrain[row][col]
      const px = col * s
      const py = row * s

      // Fill
      ctx.fillStyle = TERRAIN_FILL[type]
      ctx.fillRect(px, py, s, s)

      // Pattern decoration
      const patternFn = TERRAIN_PATTERN[type]
      if (patternFn) patternFn(ctx, px, py, s)

      // Subtle edge highlight for non-plain cells
      if (type !== 'plain') {
        ctx.strokeStyle = 'rgba(255,255,255,0.04)'
        ctx.lineWidth = 0.5
        ctx.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1)
      }
    }
  }

  // Impassable overlay: darken mountains
  for (let row = 0; row < map.terrain.length; row++) {
    for (let col = 0; col < map.terrain[0].length; col++) {
      if (map.terrain[row][col] === 'mountain') {
        ctx.fillStyle = 'rgba(0,0,0,0.15)'
        ctx.fillRect(col * s, row * s, s, s)
      }
    }
  }

  return offscreen
}
