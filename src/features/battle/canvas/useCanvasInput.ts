import { useCallback, useRef, useState } from 'react'
import { BattleState } from '../../../types'
import { Viewport, DEFAULT_VIEWPORT, zoomAtPoint, screenToWorld } from '../../../engine/utils/viewport'

/**
 * Custom hook: 9 event handlers + viewport state for BattleCanvas.
 * Handles click-to-select, wheel zoom, mouse/touch drag-to-pan, pinch-to-zoom,
 * spawn-zone dragging, and double-click reset.
 */
export function useCanvasInput(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  battleState: BattleState | null,
  selectUnit: (id: string | null) => void,
  spawnZones: { faction: string; x: number; y: number; color: string }[],
  moveSpawnZone: (faction: string, x: number, y: number) => void,
  draggingZone: string | null,
  setDraggingZone: (faction: string | null) => void,
) {
  const [viewport, setViewport] = useState<Viewport>(DEFAULT_VIEWPORT)
  const isDragging = useRef(false)
  const lastDrag = useRef({ x: 0, y: 0 })
  const touchStartDist = useRef(0)
  const touchStartScale = useRef(1)
  const touchStartPos = useRef({ x: 0, y: 0 })
  const touchMoved = useRef(false)

  // Shared helper: find nearest unit under screen coords
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
    let minDist = 40 / viewport.scale
    for (const unit of battleState.units) {
      if (unit.state === 'dead') continue
      const dx = unit.position.x - world.x
      const dy = unit.position.y - world.y
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d < minDist) { minDist = d; nearest = unit.id }
    }
    selectUnit(nearest)
  }, [battleState, selectUnit, viewport, canvasRef])

  // Click to select unit
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging.current) { isDragging.current = false; return }
    selectUnitAtScreen(e.clientX, e.clientY)
  }, [selectUnitAtScreen])

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
  }, [canvasRef])

  // Mouse drag to pan (or drag spawn zone during setup)
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
  }, [battleState, spawnZones, viewport, setDraggingZone, canvasRef])

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
  }, [draggingZone, battleState, moveSpawnZone, viewport, canvasRef])

  // Mouse up: stop dragging spawn zone
  const handleMouseUp = useCallback(() => {
    if (draggingZone) {
      setDraggingZone(null)
    }
  }, [draggingZone, setDraggingZone])

  // Touch support: tap to select, drag to pan, pinch to zoom
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
  }, [canvasRef])

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

  return {
    viewport,
    handlers: {
      onClick: handleClick,
      onWheel: handleWheel,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onDoubleClick: handleDoubleClick,
    },
  }
}
