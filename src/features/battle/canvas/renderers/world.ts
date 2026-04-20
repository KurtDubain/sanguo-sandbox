import { BattleState } from '../../../../types'

/** Danger zones, supply points, siege elements, active fires, battle glow. */
export function drawWorld(ctx: CanvasRenderingContext2D, state: BattleState, tick: number): void {
  const { map, units } = state

  // === Battle zone glow: highlight areas with most combat ===
  const attacking = units.filter((u) => u.state === 'attacking')
  if (attacking.length >= 4) {
    const cx = attacking.reduce((s, u) => s + u.position.x, 0) / attacking.length
    const cy = attacking.reduce((s, u) => s + u.position.y, 0) / attacking.length
    const gradient = ctx.createRadialGradient(cx, cy, 20, cx, cy, 120)
    gradient.addColorStop(0, 'rgba(255, 120, 50, 0.06)')
    gradient.addColorStop(1, 'rgba(255, 120, 50, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(cx - 120, cy - 120, 240, 240)
  }

  // === Danger zone overlay ===
  const dz = state.dangerZone
  if (dz.active) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, map.width, map.height)
    ctx.arc(dz.centerX, dz.centerY, dz.currentRadius, 0, Math.PI * 2, true)
    ctx.fillStyle = 'rgba(180, 30, 30, 0.12)'
    ctx.fill()
    ctx.restore()

    // Safe zone border
    ctx.beginPath()
    ctx.arc(dz.centerX, dz.centerY, dz.currentRadius, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255, 60, 60, 0.4)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([6, 4])
    ctx.stroke()
    ctx.setLineDash([])
  }

  // === Supply points ===
  for (const sp of state.supplyPoints) {
    if (!sp.active) continue
    const pulse = 0.7 + Math.sin(tick * 0.1) * 0.3
    ctx.beginPath()
    ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(80, 220, 120, ${0.08 * pulse})`
    ctx.fill()
    ctx.strokeStyle = `rgba(80, 220, 120, ${0.3 * pulse})`
    ctx.lineWidth = 1
    ctx.stroke()
    // Cross icon
    ctx.strokeStyle = `rgba(80, 220, 120, ${0.5 * pulse})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(sp.x - 5, sp.y)
    ctx.lineTo(sp.x + 5, sp.y)
    ctx.moveTo(sp.x, sp.y - 5)
    ctx.lineTo(sp.x, sp.y + 5)
    ctx.stroke()
  }

  // === Siege: control point + towers ===
  if (state.siege) {
    const sg = state.siege
    const cp = sg.controlPoint
    // Control point zone
    const cpPulse = 0.4 + Math.sin(tick * 0.05) * 0.2
    ctx.beginPath()
    ctx.arc(cp.x, cp.y, cp.radius, 0, Math.PI * 2)
    ctx.fillStyle = sg.controlTicks > 0
      ? `rgba(255, 200, 50, ${cpPulse * 0.15})`
      : `rgba(100, 180, 255, ${cpPulse * 0.08})`
    ctx.fill()
    ctx.strokeStyle = sg.controlTicks > 0 ? 'rgba(255,200,50,0.5)' : 'rgba(100,180,255,0.3)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([5, 4])
    ctx.stroke()
    ctx.setLineDash([])
    // Label
    ctx.fillStyle = sg.controlTicks > 0 ? 'rgba(255,200,50,0.7)' : 'rgba(100,180,255,0.5)'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillText(sg.controlTicks > 0 ? `占领中 ${sg.controlTicks}/${sg.controlTicksNeeded}` : '城心', cp.x, cp.y - cp.radius - 4)

    // Towers
    for (const tower of sg.towers) {
      if (tower.destroyed) {
        // Rubble
        ctx.fillStyle = 'rgba(80,60,40,0.4)'
        ctx.fillRect(tower.x - 6, tower.y - 6, 12, 12)
        continue
      }
      // Tower body
      ctx.fillStyle = '#5a4a3a'
      ctx.fillRect(tower.x - 8, tower.y - 8, 16, 16)
      ctx.strokeStyle = '#8a7a6a'
      ctx.lineWidth = 1.5
      ctx.strokeRect(tower.x - 8, tower.y - 8, 16, 16)
      // Tower range circle (subtle)
      ctx.beginPath()
      ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(200,100,50,0.1)'
      ctx.lineWidth = 0.5
      ctx.stroke()
      // HP bar
      const hpPct = tower.hp / tower.maxHp
      ctx.fillStyle = '#333'
      ctx.fillRect(tower.x - 8, tower.y - 12, 16, 2)
      ctx.fillStyle = hpPct > 0.5 ? '#4a4' : '#a44'
      ctx.fillRect(tower.x - 8, tower.y - 12, 16 * hpPct, 2)
      // Icon
      ctx.fillStyle = '#dca'
      ctx.font = '8px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('塔', tower.x, tower.y)
    }
  }

  // === Active fires ===
  const fires = state.activeFires ?? []
  for (const fire of fires) {
    const fx = fire.col * map.cellSize
    const fy = fire.row * map.cellSize
    const pulse = 0.5 + Math.sin(tick * 0.2 + fire.col * 3) * 0.3
    ctx.fillStyle = `rgba(220, 80, 20, ${0.4 * pulse})`
    ctx.fillRect(fx, fy, map.cellSize, map.cellSize)
    // Flame flicker
    ctx.fillStyle = `rgba(255, 160, 40, ${0.3 * pulse})`
    ctx.beginPath()
    ctx.arc(fx + map.cellSize * 0.5, fy + map.cellSize * 0.3, map.cellSize * 0.3, 0, Math.PI * 2)
    ctx.fill()
  }
}
