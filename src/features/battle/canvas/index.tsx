import { useEffect, useRef, useCallback } from 'react'
import { useGameStore, vfxManager } from '../../../store/gameStore'
import { BattleState } from '../../../types'
import { applyViewport, resetTransform } from '../../../engine/utils/viewport'
import { useCanvasInput } from './useCanvasInput'
import { createTerrainCanvas } from './renderers/terrain'
import { drawWorld } from './renderers/world'
import { drawUnits } from './renderers/units'
import { drawVfxBehind, drawVfxFront } from './renderers/vfx'
import { drawWeather } from './renderers/weather'
import { drawHud } from './renderers/hud'

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
  const display = useGameStore((s) => s.display)
  const animFrameRef = useRef<number>(0)
  const terrainCacheRef = useRef<ImageBitmap | null>(null)
  const terrainSeedRef = useRef<number>(-1)

  const { viewport, handlers } = useCanvasInput(
    canvasRef, battleState, selectUnit,
    spawnZones, moveSpawnZone, draggingZone, setDraggingZone,
  )

  const draw = useCallback((state: BattleState) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { map } = state

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
      const terrainCanvas = createTerrainCanvas(map)
      ctx.drawImage(terrainCanvas, 0, 0)
      // Cache as ImageBitmap for future frames
      createImageBitmap(terrainCanvas).then((bmp) => {
        terrainCacheRef.current = bmp
      })
    } else {
      ctx.drawImage(terrainCacheRef.current, 0, 0)
    }

    // === Spawn zones (setup phase only — inline, ~30 lines) ===
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
          wei: '\u9b4f', shu: '\u8700', wu: '\u5434', qun: '\u7fa4', dong: '\u8463',
          yuan: '\u8881', xiliang: '\u51c9', jingzhou: '\u8346', yizhou: '\u76ca', jin: '\u664b',
        }
        ctx.fillText(fNames[zone.faction] ?? zone.faction, zone.x, zone.y)

        // Drag hint
        ctx.font = '8px sans-serif'
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.fillText('\u62d6\u62fd', zone.x, zone.y + zoneR + 10)
      }
    } else {
      // Compute baseR once — shared by units and vfx hit flashes
      const unitCount = state.units.filter((u) => u.state !== 'dead').length
      const baseR = unitCount > 60 ? 7 : unitCount > 40 ? 8 : 10

      drawWorld(ctx, state, state.tick)
      drawVfxBehind(ctx, vfxManager, display)
      drawUnits(ctx, state.units, display, selectedUnitId, state.tick, baseR)
      drawVfxFront(ctx, vfxManager, display, baseR)
    }

    // === Weather overlay (both phases) ===
    if (display.showWeatherEffects) {
      drawWeather(ctx, state.weather, map.width, map.height, state.tick)
    }

    // === HUD (screen-space, after resetTransform) ===
    resetTransform(ctx)
    drawHud(ctx, state, viewport, canvas.width, canvas.height)
  }, [viewport, display, selectedUnitId, spawnZones, draggingZone])

  useEffect(() => {
    if (battleState) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = requestAnimationFrame(() => draw(battleState))
    }
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [battleState, draw, vfxTick, selectedUnitId, viewport])

  return (
    <canvas
      ref={canvasRef}
      {...handlers}
      className="border border-gray-700/50 rounded bg-[#0f1610] w-full h-full cursor-grab active:cursor-grabbing touch-none"
      style={{ objectFit: 'contain' }}
    />
  )
}
