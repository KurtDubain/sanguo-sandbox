import { useEffect, useRef, useCallback, useState } from 'react'
import { useGameStore, vfxManager } from '../../store/gameStore'
import { BattleState, TerrainType } from '../../types'
import { Viewport, DEFAULT_VIEWPORT, zoomAtPoint, screenToWorld, applyViewport, resetTransform } from '../../engine/utils/viewport'
import { getActiveFires } from '../../engine/systems/terrainInteraction'
import { FACTION_COLORS } from '../../config/factionDisplay'

const TERRAIN_FILL: Record<TerrainType, string> = {
  plain: '#161e16',
  forest: '#1a3218',
  mountain: '#3a3632',
  river: '#1a3050',
  ford: '#2a4560',
  bridge: '#4a4035',
  wall: '#4a4038',
}

const TERRAIN_PATTERN: Record<TerrainType, (ctx: CanvasRenderingContext2D, x: number, y: number, s: number) => void> = {
  plain: () => {},
  forest: (ctx, x, y, s) => {
    // Tree dots
    ctx.fillStyle = 'rgba(30,90,25,0.5)'
    ctx.beginPath()
    ctx.arc(x + s * 0.3, y + s * 0.3, s * 0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x + s * 0.7, y + s * 0.6, s * 0.18, 0, Math.PI * 2)
    ctx.fill()
  },
  mountain: (ctx, x, y, s) => {
    // Triangle peaks
    ctx.fillStyle = 'rgba(120,110,95,0.5)'
    ctx.beginPath()
    ctx.moveTo(x + s * 0.5, y + s * 0.15)
    ctx.lineTo(x + s * 0.8, y + s * 0.85)
    ctx.lineTo(x + s * 0.2, y + s * 0.85)
    ctx.closePath()
    ctx.fill()
    // Snow cap
    ctx.fillStyle = 'rgba(200,200,210,0.3)'
    ctx.beginPath()
    ctx.moveTo(x + s * 0.5, y + s * 0.15)
    ctx.lineTo(x + s * 0.6, y + s * 0.35)
    ctx.lineTo(x + s * 0.4, y + s * 0.35)
    ctx.closePath()
    ctx.fill()
  },
  river: (ctx, x, y, s) => {
    // Water ripples
    ctx.strokeStyle = 'rgba(80,140,200,0.25)'
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.moveTo(x + s * 0.1, y + s * 0.4)
    ctx.quadraticCurveTo(x + s * 0.5, y + s * 0.25, x + s * 0.9, y + s * 0.4)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x + s * 0.15, y + s * 0.7)
    ctx.quadraticCurveTo(x + s * 0.5, y + s * 0.55, x + s * 0.85, y + s * 0.7)
    ctx.stroke()
  },
  ford: (ctx, x, y, s) => {
    // Stepping stones
    ctx.fillStyle = 'rgba(120,100,70,0.5)'
    ctx.beginPath()
    ctx.arc(x + s * 0.3, y + s * 0.5, s * 0.12, 0, Math.PI * 2)
    ctx.arc(x + s * 0.6, y + s * 0.4, s * 0.1, 0, Math.PI * 2)
    ctx.fill()
  },
  bridge: (ctx, x, y, s) => {
    // Planks
    ctx.fillStyle = 'rgba(130,100,60,0.6)'
    ctx.fillRect(x + s * 0.15, y + s * 0.2, s * 0.7, s * 0.15)
    ctx.fillRect(x + s * 0.15, y + s * 0.5, s * 0.7, s * 0.15)
    ctx.fillRect(x + s * 0.15, y + s * 0.72, s * 0.7, s * 0.15)
  },
  wall: (ctx, x, y, s) => {
    // Brick pattern
    ctx.fillStyle = 'rgba(100,80,55,0.6)'
    ctx.fillRect(x + 1, y + 1, s * 0.45, s * 0.4)
    ctx.fillRect(x + s * 0.5, y + 1, s * 0.45, s * 0.4)
    ctx.fillRect(x + s * 0.25, y + s * 0.5, s * 0.45, s * 0.4)
    ctx.strokeStyle = 'rgba(60,50,35,0.5)'
    ctx.lineWidth = 0.5
    ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1)
  },
}

const TROOP_GLYPHS: Record<string, string> = {
  cavalry: '骑',
  infantry: '步',
  archer: '弓',
  shield: '盾',
  spearman: '枪',
}

export function BattleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const battleState = useGameStore((s) => s.battleState)
  const vfxTick = useGameStore((s) => s.vfxTick)
  const selectedUnitId = useGameStore((s) => s.selectedUnitId)
  const selectUnit = useGameStore((s) => s.selectUnit)
  const spawnZones = useGameStore((s) => s.spawnZones)
  const moveSpawnZone = useGameStore((s) => s.moveSpawnZone)
  const draggingZone = useGameStore((s) => s.draggingZone)
  const setDraggingZone = useGameStore((s) => s.setDraggingZone)
  const animFrameRef = useRef<number>(0)
  const terrainCacheRef = useRef<ImageBitmap | null>(null)
  const terrainSeedRef = useRef<number>(-1)
  const [viewport, setViewport] = useState<Viewport>(DEFAULT_VIEWPORT)
  const isDragging = useRef(false)
  const lastDrag = useRef({ x: 0, y: 0 })
  const touchStartDist = useRef(0)
  const touchStartScale = useRef(1)

  const drawTerrain = useCallback((state: BattleState): HTMLCanvasElement => {
    const { map } = state
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

    // Impassable overlay: add a subtle "X" pattern to mountains and rivers
    for (let row = 0; row < map.terrain.length; row++) {
      for (let col = 0; col < map.terrain[0].length; col++) {
        const type = map.terrain[row][col]
        if (type === 'mountain') {
          // Dark overlay to emphasize wall
          ctx.fillStyle = 'rgba(0,0,0,0.15)'
          ctx.fillRect(col * s, row * s, s, s)
        }
      }
    }

    return offscreen
  }, [])

  const draw = useCallback((state: BattleState) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { map, units } = state

    // Only set canvas size once (setting it every frame causes flicker)
    if (canvas.width !== map.width || canvas.height !== map.height) {
      canvas.width = map.width
      canvas.height = map.height
    }

    // Clear with resetTransform first (in case viewport was applied)
    resetTransform(ctx)
    ctx.fillStyle = '#0f1610'
    ctx.fillRect(0, 0, map.width, map.height)

    // === Apply viewport transform for world-space rendering ===
    applyViewport(ctx, viewport)

    // Draw cached terrain
    if (terrainSeedRef.current !== state.seed) {
      terrainSeedRef.current = state.seed
      terrainCacheRef.current = null
    }
    if (!terrainCacheRef.current) {
      const terrainCanvas = drawTerrain(state)
      ctx.drawImage(terrainCanvas, 0, 0)
      // Cache as ImageBitmap for future frames
      createImageBitmap(terrainCanvas).then((bmp) => {
        terrainCacheRef.current = bmp
      })
    } else {
      ctx.drawImage(terrainCacheRef.current, 0, 0)
    }

    // === Spawn zones (setup phase only — draggable faction circles) ===
    if (state.phase === 'setup' && spawnZones.length > 0) {
      for (const zone of spawnZones) {
        const zoneR = 35

        // Zone circle
        ctx.beginPath()
        ctx.arc(zone.x, zone.y, zoneR, 0, Math.PI * 2)
        ctx.fillStyle = zone.color + '25'
        ctx.fill()
        ctx.strokeStyle = zone.color + (draggingZone === zone.faction ? 'cc' : '88')
        ctx.lineWidth = draggingZone === zone.faction ? 3 : 2
        ctx.setLineDash([6, 4])
        ctx.stroke()
        ctx.setLineDash([])

        // Faction name
        ctx.fillStyle = zone.color
        ctx.font = 'bold 11px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const fNames: Record<string, string> = {
          wei: '魏', shu: '蜀', wu: '吴', qun: '群', dong: '董',
          yuan: '袁', xiliang: '凉', jingzhou: '荆', yizhou: '益', jin: '晋',
        }
        ctx.fillText(fNames[zone.faction] ?? zone.faction, zone.x, zone.y)

        // Drag hint
        ctx.font = '8px sans-serif'
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.fillText('拖拽', zone.x, zone.y + zoneR + 10)
      }

      // Don't draw individual units during setup
    } else {

    // === Battle zone glow: highlight areas with most combat ===
    const attacking = units.filter((u) => u.state === 'attacking')
    if (attacking.length >= 4) {
      // Find cluster center of attacking units
      const cx = attacking.reduce((s, u) => s + u.position.x, 0) / attacking.length
      const cy = attacking.reduce((s, u) => s + u.position.y, 0) / attacking.length
      const gradient = ctx.createRadialGradient(cx, cy, 20, cx, cy, 120)
      gradient.addColorStop(0, 'rgba(255, 120, 50, 0.06)')
      gradient.addColorStop(1, 'rgba(255, 120, 50, 0)')
      ctx.fillStyle = gradient
      ctx.fillRect(cx - 120, cy - 120, 240, 240)
    }

    // === VFX: Unit trails (before units) ===
    for (const [, trail] of vfxManager.trails) {
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

    // === VFX: Skill bursts (draw behind units) ===
    for (const burst of vfxManager.skillBursts) {
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

    // === Danger zone overlay ===
    const dz = state.dangerZone
    if (dz.active) {
      // Draw everything outside the safe circle as danger
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
      // Glow circle
      const pulse = 0.7 + Math.sin(state.tick * 0.1) * 0.3
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
      const cpPulse = 0.4 + Math.sin(state.tick * 0.05) * 0.2
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
    const fires = getActiveFires()
    for (const fire of fires) {
      const fx = fire.col * map.cellSize
      const fy = fire.row * map.cellSize
      const pulse = 0.5 + Math.sin(state.tick * 0.2 + fire.col * 3) * 0.3
      ctx.fillStyle = `rgba(220, 80, 20, ${0.4 * pulse})`
      ctx.fillRect(fx, fy, map.cellSize, map.cellSize)
      // Flame flicker
      ctx.fillStyle = `rgba(255, 160, 40, ${0.3 * pulse})`
      ctx.beginPath()
      ctx.arc(fx + map.cellSize * 0.5, fy + map.cellSize * 0.3, map.cellSize * 0.3, 0, Math.PI * 2)
      ctx.fill()
    }

    // === Draw target lines ===
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

    // === Draw units ===
    const unitCount = units.filter((u) => u.state !== 'dead').length
    const baseR = unitCount > 60 ? 7 : unitCount > 40 ? 8 : 10
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
        x += Math.sin(state.tick * 1.5 + unit.position.x) * 1.2
        y += Math.cos(state.tick * 1.5 + unit.position.y) * 1.2
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
        const pulse = Math.sin(state.tick * 0.3) * 0.5 + 0.5
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

      // Troop glyph
      ctx.font = `${glyphSize}px sans-serif`
      ctx.fillStyle = '#fff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(TROOP_GLYPHS[unit.troopType] ?? '', x, y + 0.5)

      // Name
      ctx.font = `${nameSize}px sans-serif`
      ctx.fillStyle = routed ? 'rgba(160,100,100,0.5)' : '#bbb'
      ctx.textBaseline = 'top'
      ctx.fillText(unit.name, x, y + R + 1)

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

    // === VFX: Death marks ===
    for (const dm of vfxManager.deathMarks) {
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

    // === VFX: Hit flashes ===
    for (const hf of vfxManager.hitFlashes) {
      const alpha = 1 - hf.age / hf.maxAge
      ctx.beginPath()
      ctx.arc(hf.x, hf.y, baseR + 4, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.4})`
      ctx.fill()
    }

    // === VFX: Projectiles ===
    for (const p of vfxManager.projectiles) {
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

    // === VFX: Duel highlight ===
    const duel = vfxManager.duelHighlight
    if (duel) {
      const pulse = 0.6 + Math.sin(duel.age * 0.3) * 0.4
      // Dim overlay (drawn in world space)
      // Circle around each duelist
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
      ctx.fillText('⚔', mx, my - 10)
    }

    // === VFX: Floating text (damage numbers, morale text) ===
    for (const ft of vfxManager.floatingTexts) {
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

    } // end of else (non-setup rendering)

    // === Weather visual overlay ===
    const weather = state.weather
    if (weather.type === 'rain') {
      ctx.globalAlpha = weather.intensity * 0.15
      ctx.fillStyle = '#4477aa'
      ctx.fillRect(0, 0, map.width, map.height)
      ctx.globalAlpha = 1
      // Rain streaks
      ctx.strokeStyle = `rgba(120,160,220,${weather.intensity * 0.2})`
      ctx.lineWidth = 0.5
      for (let i = 0; i < 60; i++) {
        const rx = ((state.tick * 3 + i * 37) % (map.width + 40)) - 20
        const ry = ((state.tick * 5 + i * 53) % (map.height + 40)) - 20
        ctx.beginPath()
        ctx.moveTo(rx, ry)
        ctx.lineTo(rx - 3, ry + 12)
        ctx.stroke()
      }
    } else if (weather.type === 'fog') {
      ctx.globalAlpha = weather.intensity * 0.3
      ctx.fillStyle = '#8899aa'
      ctx.fillRect(0, 0, map.width, map.height)
      ctx.globalAlpha = 1
    } else if (weather.type === 'wind') {
      ctx.strokeStyle = `rgba(200,200,180,${weather.intensity * 0.08})`
      ctx.lineWidth = 0.5
      for (let i = 0; i < 30; i++) {
        const wx = ((state.tick * 4 + i * 41) % (map.width + 80)) - 40
        const wy = ((state.tick * 0.5 + i * 61) % map.height)
        ctx.beginPath()
        ctx.moveTo(wx, wy)
        ctx.lineTo(wx + Math.cos(weather.windAngle) * 25, wy + Math.sin(weather.windAngle) * 25)
        ctx.stroke()
      }
    }

    // === Reset transform for HUD (screen-space) ===
    resetTransform(ctx)

    // === HUD ===
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
    const weatherNames: Record<string, string> = { clear: '☀ 晴', rain: '🌧 雨', fog: '🌫 雾', wind: '💨 风' }
    ctx.fillStyle = weather.type === 'clear' ? 'rgba(255,255,255,0.4)' : 'rgba(150,200,255,0.6)'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(weatherNames[weather.type] ?? '', 8, fy + 4)

    // Zoom indicator
    if (viewport.scale !== 1) {
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.font = '10px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`${Math.round(viewport.scale * 100)}% (双击重置)`, 8, map.height - 8)
    }

    // Terrain legend
    ctx.textAlign = 'right'
    const legends: [string, string, string][] = [
      ['平原', TERRAIN_FILL.plain, '可通行'],
      ['树林', TERRAIN_FILL.forest, '减速·加防'],
      ['山地', TERRAIN_FILL.mountain, '不可通行'],
      ['河流', TERRAIN_FILL.river, '不可通行'],
      ['桥梁', TERRAIN_FILL.bridge, '可通行'],
    ]
    legends.forEach(([label, color, hint], i) => {
      ctx.fillStyle = color
      ctx.fillRect(map.width - 85, 8 + i * 13, 8, 8)
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.strokeRect(map.width - 85, 8 + i * 13, 8, 8)
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.font = '8px sans-serif'
      ctx.fillText(`${label} ${hint}`, map.width - 6, 8 + i * 13)
    })
  }, [drawTerrain, viewport])

  useEffect(() => {
    if (battleState) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = requestAnimationFrame(() => draw(battleState))
    }
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [battleState, draw, vfxTick, selectedUnitId, viewport])

  // Click to select unit — with viewport transform
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging.current) { isDragging.current = false; return }
    selectUnitAtScreen(e.clientX, e.clientY)
  }, [battleState, selectUnit, viewport])

  const selectUnitAtScreen = useCallback((clientX: number, clientY: number) => {
    if (!battleState) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const screenX = (clientX - rect.left) * scaleX
    const screenY = (clientY - rect.top) * scaleY
    const world = screenToWorld(screenX, screenY, viewport)

    let nearest: string | null = null
    let minDist = 40 / viewport.scale // bigger click radius (was 25)
    for (const unit of battleState.units) {
      if (unit.state === 'dead') continue
      const dx = unit.position.x - world.x
      const dy = unit.position.y - world.y
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d < minDist) { minDist = d; nearest = unit.id }
    }
    selectUnit(nearest)
  }, [battleState, selectUnit, viewport])

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const sx = (e.clientX - rect.left) * scaleX
    const sy = (e.clientY - rect.top) * scaleY
    setViewport((vp) => zoomAtPoint(vp, sx, sy, e.deltaY))
  }, [])

  // Mouse drag to pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      isDragging.current = false
      lastDrag.current = { x: e.clientX, y: e.clientY }

      // Check if clicking on a spawn zone (setup phase)
      if (battleState?.phase === 'setup' && spawnZones.length > 0) {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const sx = (e.clientX - rect.left) * (canvas.width / rect.width)
        const sy = (e.clientY - rect.top) * (canvas.height / rect.height)
        const world = screenToWorld(sx, sy, viewport)

        for (const zone of spawnZones) {
          const dx = zone.x - world.x
          const dy = zone.y - world.y
          if (Math.sqrt(dx * dx + dy * dy) < 40) {
            setDraggingZone(zone.faction)
            isDragging.current = true
            return
          }
        }
      }
    }
  }, [battleState, spawnZones, viewport, setDraggingZone])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (e.buttons !== 1) return

    // If dragging a spawn zone
    if (draggingZone && battleState?.phase === 'setup') {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const sx = (e.clientX - rect.left) * (canvas.width / rect.width)
      const sy = (e.clientY - rect.top) * (canvas.height / rect.height)
      const world = screenToWorld(sx, sy, viewport)
      moveSpawnZone(draggingZone, world.x, world.y)
      lastDrag.current = { x: e.clientX, y: e.clientY }
      return
    }

    // Normal viewport panning
    const dx = e.clientX - lastDrag.current.x
    const dy = e.clientY - lastDrag.current.y
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) isDragging.current = true
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const ratioX = canvas.width / rect.width
    const ratioY = canvas.height / rect.height
    setViewport((vp) => ({
      ...vp,
      offsetX: vp.offsetX + dx * ratioX,
      offsetY: vp.offsetY + dy * ratioY,
    }))
    lastDrag.current = { x: e.clientX, y: e.clientY }
  }, [])

  // Mouse up: stop dragging spawn zone
  const handleMouseUp = useCallback(() => {
    if (draggingZone) {
      setDraggingZone(null)
    }
  }, [draggingZone, setDraggingZone])

  // Touch support: tap to select, drag to pan, pinch to zoom
  const touchStartPos = useRef({ x: 0, y: 0 })
  const touchMoved = useRef(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      touchStartDist.current = Math.sqrt(dx * dx + dy * dy)
      touchStartScale.current = viewport.scale
      touchMoved.current = true // pinch is not a tap
    } else if (e.touches.length === 1) {
      lastDrag.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      touchMoved.current = false
    }
  }, [viewport.scale])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const newScale = Math.max(0.4, Math.min(3, touchStartScale.current * (dist / touchStartDist.current)))
      setViewport((vp) => ({ ...vp, scale: newScale }))
    } else if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastDrag.current.x
      const dy = e.touches[0].clientY - lastDrag.current.y
      // Check if moved enough to be a drag (not a tap)
      const totalDx = e.touches[0].clientX - touchStartPos.current.x
      const totalDy = e.touches[0].clientY - touchStartPos.current.y
      if (Math.abs(totalDx) > 10 || Math.abs(totalDy) > 10) touchMoved.current = true

      if (touchMoved.current) {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        setViewport((vp) => ({
          ...vp,
          offsetX: vp.offsetX + dx * (canvas.width / rect.width),
          offsetY: vp.offsetY + dy * (canvas.height / rect.height),
        }))
      }
      lastDrag.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }, [])

  // Touch end: if didn't move much, treat as tap to select unit
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchMoved.current && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0]
      selectUnitAtScreen(touch.clientX, touch.clientY)
    }
  }, [selectUnitAtScreen])

  // Double click/tap to reset viewport
  const handleDoubleClick = useCallback(() => {
    setViewport(DEFAULT_VIEWPORT)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
      className="border border-gray-700 rounded-lg bg-[#0f1610] w-full h-full object-contain cursor-grab active:cursor-grabbing touch-none"
      style={{ maxHeight: '100%', aspectRatio: '3/2' }}
    />
  )
}
