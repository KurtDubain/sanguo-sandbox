import { Position } from '../../types'

export function distance(a: Position, b: Position): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function angle(from: Position, to: Position): number {
  return Math.atan2(to.y - from.y, to.x - from.x)
}

export function moveToward(
  from: Position,
  to: Position,
  speed: number
): Position {
  const dist = distance(from, to)
  if (dist <= speed) return { ...to }
  const ratio = speed / dist
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
  }
}

export function clampPosition(
  pos: Position,
  width: number,
  height: number,
  margin = 10
): Position {
  return {
    x: Math.max(margin, Math.min(width - margin, pos.x)),
    y: Math.max(margin, Math.min(height - margin, pos.y)),
  }
}
