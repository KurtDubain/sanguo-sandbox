import { useRef, useEffect, useCallback } from 'react'
import { useGameStore } from '../../store/gameStore'
import { FACTION_COLORS } from '../../config/factionDisplay'
const TERRAIN_MINI: Record<string, string> = {
  plain: '#1a2a1a', forest: '#1d3518', mountain: '#3a3632',
  river: '#1a3050', ford: '#2a4560', bridge: '#4a4035',
}

export function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const battleState = useGameStore((s) => s.battleState)
  const showMinimap = useGameStore((s) => s.display.showMinimap)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !battleState) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { map, units, dangerZone } = battleState
    const W = 160
    const H = Math.round(W * map.height / map.width)
    canvas.width = W
    canvas.height = H
    const sx = W / map.width
    const sy = H / map.height

    // Background
    ctx.fillStyle = '#0a0e0a'
    ctx.fillRect(0, 0, W, H)

    // Terrain (simplified — draw cells as single pixels)
    const cw = Math.max(1, Math.ceil(map.cellSize * sx))
    const ch = Math.max(1, Math.ceil(map.cellSize * sy))
    for (let row = 0; row < map.terrain.length; row++) {
      for (let col = 0; col < map.terrain[0].length; col++) {
        const type = map.terrain[row][col]
        if (type === 'plain') continue
        ctx.fillStyle = TERRAIN_MINI[type] ?? '#222'
        ctx.fillRect(col * map.cellSize * sx, row * map.cellSize * sy, cw, ch)
      }
    }

    // Danger zone
    if (dangerZone.active) {
      ctx.beginPath()
      ctx.rect(0, 0, W, H)
      ctx.arc(dangerZone.centerX * sx, dangerZone.centerY * sy, dangerZone.currentRadius * sx, 0, Math.PI * 2, true)
      ctx.fillStyle = 'rgba(180,30,30,0.2)'
      ctx.fill()
    }

    // Units as dots
    for (const unit of units) {
      if (unit.state === 'dead') continue
      const x = unit.position.x * sx
      const y = unit.position.y * sy
      ctx.fillStyle = unit.state === 'routed' ? '#555' : (FACTION_COLORS[unit.faction] ?? '#888')
      ctx.fillRect(x - 1, y - 1, 3, 3)
    }
  }, [battleState])

  useEffect(() => {
    draw()
  }, [draw])

  if (!battleState || !showMinimap) return null

  return (
    <canvas
      ref={canvasRef}
      className="absolute bottom-2 right-2 border border-gray-700 rounded opacity-80 hover:opacity-100 transition-opacity"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
