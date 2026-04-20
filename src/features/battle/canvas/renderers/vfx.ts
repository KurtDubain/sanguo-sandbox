import { VFXManager } from '../../../../engine/utils/vfx'
import { DisplaySettings } from '../../../../store/gameStore'

/** Trails, skill bursts — drawn behind units. */
export function drawVfxBehind(
  ctx: CanvasRenderingContext2D,
  vfx: VFXManager,
  display: DisplaySettings,
): void {
  // === Trails ===
  if (display.showTrails) {
    for (const [, trail] of vfx.trails) {
      if (trail.points.length < 2) continue
      ctx.beginPath()
      ctx.moveTo(trail.points[0].x, trail.points[0].y)
      for (let i = 1; i < trail.points.length; i++) {
        ctx.lineTo(trail.points[i].x, trail.points[i].y)
      }
      ctx.strokeStyle = trail.color + '20'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  }

  // === Skill bursts ===
  for (const burst of vfx.skillBursts) {
    const progress = burst.age / burst.maxAge
    const alpha = (1 - progress) * 0.3
    const r = burst.radius * (0.3 + progress * 0.7)
    ctx.beginPath()
    ctx.arc(burst.x, burst.y, r, 0, Math.PI * 2)
    ctx.strokeStyle = burst.color
    ctx.globalAlpha = alpha
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.globalAlpha = 1
  }
}

/** Death marks, hit flashes, projectiles, duel highlight, floating text — drawn in front of units. */
export function drawVfxFront(
  ctx: CanvasRenderingContext2D,
  vfx: VFXManager,
  display: DisplaySettings,
  baseR: number,
): void {
  // === Death marks ===
  for (const dm of vfx.deathMarks) {
    const alpha = Math.max(0, 1 - dm.age / dm.maxAge)
    ctx.globalAlpha = alpha * 0.5
    ctx.strokeStyle = dm.color
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(dm.x - 5, dm.y - 5)
    ctx.lineTo(dm.x + 5, dm.y + 5)
    ctx.moveTo(dm.x + 5, dm.y - 5)
    ctx.lineTo(dm.x - 5, dm.y + 5)
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  // === Hit flashes ===
  for (const hf of vfx.hitFlashes) {
    const alpha = 1 - hf.age / hf.maxAge
    ctx.beginPath()
    ctx.arc(hf.x, hf.y, baseR + 4, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${alpha * 0.4})`
    ctx.fill()
  }

  // === Projectiles ===
  for (const p of vfx.projectiles) {
    const t = p.age / p.maxAge
    const alpha = 1 - t
    if (p.type === 'arrow') {
      // Arrow: interpolate position from source to target
      const cx = p.fromX + (p.toX - p.fromX) * t
      const cy = p.fromY + (p.toY - p.fromY) * t
      const angle = Math.atan2(p.toY - p.fromY, p.toX - p.fromX)
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(angle)
      ctx.globalAlpha = alpha
      // Arrow body
      ctx.strokeStyle = '#dda'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(-6, 0)
      ctx.lineTo(4, 0)
      ctx.stroke()
      // Arrowhead
      ctx.beginPath()
      ctx.moveTo(5, 0)
      ctx.lineTo(2, -2)
      ctx.moveTo(5, 0)
      ctx.lineTo(2, 2)
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.restore()
    } else {
      // Slash: short arc at target
      ctx.globalAlpha = alpha * 0.6
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      const angle = Math.atan2(p.toY - p.fromY, p.toX - p.fromX)
      ctx.beginPath()
      ctx.arc(p.toX, p.toY, 10, angle - 0.8, angle + 0.8)
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  }

  // === Duel highlight ===
  const duel = vfx.duelHighlight
  if (duel) {
    const pulse = 0.6 + Math.sin(duel.age * 0.3) * 0.4
    ctx.strokeStyle = `rgba(255, 200, 50, ${0.6 * pulse})`
    ctx.lineWidth = 2
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.arc(duel.x1, duel.y1, 20, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(duel.x2, duel.y2, 20, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
    // Crossed swords between them
    const mx = (duel.x1 + duel.x2) / 2
    const my = (duel.y1 + duel.y2) / 2
    ctx.fillStyle = `rgba(255, 200, 50, ${0.8 * pulse})`
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('\u2694', mx, my - 10)
  }

  // === Floating text (damage numbers, morale text) ===
  if (display.showDamageNumbers) {
    for (const ft of vfx.floatingTexts) {
      const alpha = Math.max(0, 1 - ft.age / ft.maxAge)
      const yOff = -ft.age * 0.6
      ctx.globalAlpha = alpha
      ctx.font = ft.text.includes('!') ? 'bold 11px sans-serif' : '9px sans-serif'
      ctx.fillStyle = ft.color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillText(ft.text, ft.x, ft.y + yOff)
      ctx.globalAlpha = 1
    }
  }
}
