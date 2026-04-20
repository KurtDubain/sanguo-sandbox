import { BattleUnit } from '../../../../types'
import { DisplaySettings } from '../../../../store/gameStore'
import { FACTION_COLORS } from '../../../../config/factionDisplay'
import { TROOP_GLYPHS } from '../constants'

/** Unit circles, HP/morale bars, names, glyphs, selection highlight, target lines. */
export function drawUnits(
  ctx: CanvasRenderingContext2D,
  units: BattleUnit[],
  display: DisplaySettings,
  selectedUnitId: string | null,
  tick: number,
  baseR: number,
): void {
  // === Target lines ===
  if (display.showTargetLines) {
    for (const unit of units) {
      if (unit.state === 'dead' || !unit.targetId) continue
      if (unit.state !== 'attacking' && unit.state !== 'moving') continue
      const target = units.find((u) => u.id === unit.targetId)
      if (!target || target.state === 'dead') continue
      ctx.beginPath()
      ctx.moveTo(unit.position.x, unit.position.y)
      ctx.lineTo(target.position.x, target.position.y)
      ctx.strokeStyle = unit.state === 'attacking' ? 'rgba(255,80,80,0.15)' : 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 0.6
      ctx.stroke()
    }
  }

  // === Draw units ===
  const unitCount = units.filter((u) => u.state !== 'dead').length
  const glyphSize = unitCount > 60 ? 6 : 7
  const nameSize = unitCount > 60 ? 6 : 8

  for (const unit of units) {
    if (unit.state === 'dead') continue
    let { x, y } = unit.position
    const fc = FACTION_COLORS[unit.faction] ?? unit.color
    const routed = unit.state === 'routed'
    const retreating = unit.state === 'retreating'
    const hpPct = unit.hp / unit.maxHp

    // Size varies by rarity
    const isLegend = unit.achievement >= 85
    const R = isLegend ? baseR + 2 : baseR

    // Attack shake: small jitter when attacking
    if (unit.state === 'attacking') {
      x += Math.sin(tick * 1.5 + unit.position.x) * 1.2
      y += Math.cos(tick * 1.5 + unit.position.y) * 1.2
    }

    // Shadow
    ctx.beginPath()
    ctx.arc(x + 1, y + 2, R, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fill()

    // Legend glow
    if (isLegend && !routed) {
      ctx.beginPath()
      ctx.arc(x, y, R + 3, 0, Math.PI * 2)
      ctx.fillStyle = fc + '18'
      ctx.fill()
    }

    // Body — low HP flash
    ctx.beginPath()
    ctx.arc(x, y, R, 0, Math.PI * 2)
    let bodyColor = fc
    if (routed) bodyColor = '#444'
    else if (retreating) bodyColor = fc + '88'
    else if (hpPct < 0.25) {
      // Pulse between normal and red
      const pulse = Math.sin(tick * 0.3) * 0.5 + 0.5
      bodyColor = pulse > 0.5 ? fc : '#aa3333'
    }
    ctx.fillStyle = bodyColor
    ctx.fill()

    // Facing indicator
    if (unit.state === 'attacking' || unit.state === 'moving') {
      const fx = x + Math.cos(unit.facing) * (R + 3)
      const fy = y + Math.sin(unit.facing) * (R + 3)
      ctx.beginPath()
      ctx.arc(fx, fy, 2, 0, Math.PI * 2)
      ctx.fillStyle = unit.state === 'attacking' ? '#ff6644' : '#aaa'
      ctx.fill()
    }

    // Border
    ctx.beginPath()
    ctx.arc(x, y, R, 0, Math.PI * 2)
    if (unit.state === 'attacking') {
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1.5
    } else {
      ctx.strokeStyle = isLegend ? 'rgba(255,255,200,0.3)' : 'rgba(255,255,255,0.15)'
      ctx.lineWidth = isLegend ? 1 : 0.6
    }
    ctx.stroke()

    // HP bar
    if (display.showHpBars) {
      const bw = R * 2
      const bx = x - R
      const by = y - R - 4

      ctx.fillStyle = '#111'
      ctx.fillRect(bx, by, bw, 2.5)
      ctx.fillStyle = hpPct > 0.5 ? '#3d9' : hpPct > 0.25 ? '#da3' : '#d44'
      ctx.fillRect(bx, by, bw * hpPct, 2.5)

      // Morale bar
      const mpct = unit.morale / unit.maxMorale
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(bx, by + 3, bw, 1.5)
      ctx.fillStyle = mpct > 0.5 ? '#469' : mpct > 0.2 ? '#a73' : '#a33'
      ctx.fillRect(bx, by + 3, bw * mpct, 1.5)
    }

    // Troop glyph
    ctx.font = `${glyphSize}px sans-serif`
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(TROOP_GLYPHS[unit.troopType] ?? '', x, y + 0.5)

    // Name
    if (display.showNames) {
      ctx.font = `${nameSize}px sans-serif`
      ctx.fillStyle = routed ? 'rgba(160,100,100,0.5)' : '#bbb'
      ctx.textBaseline = 'top'
      ctx.fillText(unit.name, x, y + R + 1)
    }

    // Selected unit highlight
    if (unit.id === selectedUnitId) {
      ctx.beginPath()
      ctx.arc(x, y, R + 4, 0, Math.PI * 2)
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 3])
      ctx.stroke()
      ctx.setLineDash([])
    }
  }
}
