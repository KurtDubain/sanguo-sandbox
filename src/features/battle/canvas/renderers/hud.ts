import { BattleState } from '../../../../types'
import { Viewport } from '../../../../engine/utils/viewport'
import { FACTION_COLORS } from '../../../../config/factionDisplay'
import { TERRAIN_FILL } from '../constants'

/** Tick counter, faction counts, weather, zoom indicator, terrain legend. */
export function drawHud(
  ctx: CanvasRenderingContext2D,
  state: BattleState,
  viewport: Viewport,
  canvasW: number,
  canvasH: number,
): void {
  const { units, weather } = state

  ctx.textBaseline = 'top'
  ctx.font = '11px monospace'
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.textAlign = 'left'
  ctx.fillText(`Tick: ${state.tick}`, 8, 8)

  const alive = units.filter((u) => u.state !== 'dead')
  ctx.fillText(`存活: ${alive.length}/${units.length}`, 8, 22)

  // Faction counts
  const fc: Record<string, number> = {}
  for (const u of alive) fc[u.faction] = (fc[u.faction] ?? 0) + 1
  let fy = 38
  for (const [faction, count] of Object.entries(fc)) {
    ctx.fillStyle = FACTION_COLORS[faction] ?? '#888'
    ctx.fillRect(8, fy + 1, 6, 6)
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '10px monospace'
    ctx.fillText(`${count}`, 18, fy)
    fy += 13
  }

  // Weather display
  const weatherNames: Record<string, string> = { clear: '\u2600 \u6674', rain: '\ud83c\udf27 \u96e8', fog: '\ud83c\udf2b \u96fe', wind: '\ud83d\udca8 \u98ce' }
  ctx.fillStyle = weather.type === 'clear' ? 'rgba(255,255,255,0.4)' : 'rgba(150,200,255,0.6)'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(weatherNames[weather.type] ?? '', 8, fy + 4)

  // Zoom indicator
  if (viewport.scale !== 1) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '10px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`${Math.round(viewport.scale * 100)}% (\u53cc\u51fb\u91cd\u7f6e)`, 8, canvasH - 8)
  }

  // Terrain legend
  ctx.textAlign = 'right'
  const legends: [string, string, string][] = [
    ['\u5e73\u539f', TERRAIN_FILL.plain, '\u53ef\u901a\u884c'],
    ['\u6811\u6797', TERRAIN_FILL.forest, '\u51cf\u901f\u00b7\u52a0\u9632'],
    ['\u5c71\u5730', TERRAIN_FILL.mountain, '\u4e0d\u53ef\u901a\u884c'],
    ['\u6cb3\u6d41', TERRAIN_FILL.river, '\u4e0d\u53ef\u901a\u884c'],
    ['\u6865\u6881', TERRAIN_FILL.bridge, '\u53ef\u901a\u884c'],
  ]
  legends.forEach(([label, color, hint], i) => {
    ctx.fillStyle = color
    ctx.fillRect(canvasW - 85, 8 + i * 13, 8, 8)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.strokeRect(canvasW - 85, 8 + i * 13, 8, 8)
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '8px sans-serif'
    ctx.fillText(`${label} ${hint}`, canvasW - 6, 8 + i * 13)
  })
}
