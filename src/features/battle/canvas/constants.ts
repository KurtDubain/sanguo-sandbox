import { TerrainType } from '../../../types'

export const TERRAIN_FILL: Record<TerrainType, string> = {
  plain: '#161e16',
  forest: '#1a3218',
  mountain: '#3a3632',
  river: '#1a3050',
  ford: '#2a4560',
  bridge: '#4a4035',
  wall: '#4a4038',
}

export const TERRAIN_PATTERN: Record<TerrainType, (ctx: CanvasRenderingContext2D, x: number, y: number, s: number) => void> = {
  plain: () => {},
  forest: (ctx, x, y, s) => {
    ctx.fillStyle = 'rgba(30,90,25,0.5)'
    ctx.beginPath()
    ctx.arc(x + s * 0.3, y + s * 0.3, s * 0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x + s * 0.7, y + s * 0.6, s * 0.18, 0, Math.PI * 2)
    ctx.fill()
  },
  mountain: (ctx, x, y, s) => {
    ctx.fillStyle = 'rgba(120,110,95,0.5)'
    ctx.beginPath()
    ctx.moveTo(x + s * 0.5, y + s * 0.15)
    ctx.lineTo(x + s * 0.8, y + s * 0.85)
    ctx.lineTo(x + s * 0.2, y + s * 0.85)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = 'rgba(200,200,210,0.3)'
    ctx.beginPath()
    ctx.moveTo(x + s * 0.5, y + s * 0.15)
    ctx.lineTo(x + s * 0.6, y + s * 0.35)
    ctx.lineTo(x + s * 0.4, y + s * 0.35)
    ctx.closePath()
    ctx.fill()
  },
  river: (ctx, x, y, s) => {
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
    ctx.fillStyle = 'rgba(120,100,70,0.5)'
    ctx.beginPath()
    ctx.arc(x + s * 0.3, y + s * 0.5, s * 0.12, 0, Math.PI * 2)
    ctx.arc(x + s * 0.6, y + s * 0.4, s * 0.1, 0, Math.PI * 2)
    ctx.fill()
  },
  bridge: (ctx, x, y, s) => {
    ctx.fillStyle = 'rgba(130,100,60,0.6)'
    ctx.fillRect(x + s * 0.15, y + s * 0.2, s * 0.7, s * 0.15)
    ctx.fillRect(x + s * 0.15, y + s * 0.5, s * 0.7, s * 0.15)
    ctx.fillRect(x + s * 0.15, y + s * 0.72, s * 0.7, s * 0.15)
  },
  wall: (ctx, x, y, s) => {
    ctx.fillStyle = 'rgba(100,80,55,0.6)'
    ctx.fillRect(x + 1, y + 1, s * 0.45, s * 0.4)
    ctx.fillRect(x + s * 0.5, y + 1, s * 0.45, s * 0.4)
    ctx.fillRect(x + s * 0.25, y + s * 0.5, s * 0.45, s * 0.4)
    ctx.strokeStyle = 'rgba(60,50,35,0.5)'
    ctx.lineWidth = 0.5
    ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1)
  },
}

export const TROOP_GLYPHS: Record<string, string> = {
  cavalry: '骑', infantry: '步', archer: '弓', shield: '盾', spearman: '枪',
}
