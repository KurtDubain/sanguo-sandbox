// Canvas viewport: zoom, pan, coordinate transforms

export interface Viewport {
  offsetX: number
  offsetY: number
  scale: number
}

export const DEFAULT_VIEWPORT: Viewport = { offsetX: 0, offsetY: 0, scale: 1 }

export function screenToWorld(sx: number, sy: number, vp: Viewport): { x: number; y: number } {
  return {
    x: (sx - vp.offsetX) / vp.scale,
    y: (sy - vp.offsetY) / vp.scale,
  }
}

export function worldToScreen(wx: number, wy: number, vp: Viewport): { x: number; y: number } {
  return {
    x: wx * vp.scale + vp.offsetX,
    y: wy * vp.scale + vp.offsetY,
  }
}

export function applyViewport(ctx: CanvasRenderingContext2D, vp: Viewport) {
  ctx.setTransform(vp.scale, 0, 0, vp.scale, vp.offsetX, vp.offsetY)
}

export function resetTransform(ctx: CanvasRenderingContext2D) {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

export function clampScale(scale: number): number {
  return Math.max(0.4, Math.min(3, scale))
}

export function zoomAtPoint(
  vp: Viewport,
  screenX: number,
  screenY: number,
  delta: number,
): Viewport {
  const factor = delta > 0 ? 0.9 : 1.1
  const newScale = clampScale(vp.scale * factor)
  const ratio = newScale / vp.scale
  return {
    scale: newScale,
    offsetX: screenX - (screenX - vp.offsetX) * ratio,
    offsetY: screenY - (screenY - vp.offsetY) * ratio,
  }
}
