import { WeatherState } from '../../../../types'

/** Rain, fog, wind overlays. */
export function drawWeather(
  ctx: CanvasRenderingContext2D,
  weather: WeatherState,
  w: number,
  h: number,
  tick: number,
): void {
  if (weather.type === 'rain') {
    ctx.globalAlpha = weather.intensity * 0.15
    ctx.fillStyle = '#4477aa'
    ctx.fillRect(0, 0, w, h)
    ctx.globalAlpha = 1
    // Rain streaks
    ctx.strokeStyle = `rgba(120,160,220,${weather.intensity * 0.2})`
    ctx.lineWidth = 0.5
    for (let i = 0; i < 60; i++) {
      const rx = ((tick * 3 + i * 37) % (w + 40)) - 20
      const ry = ((tick * 5 + i * 53) % (h + 40)) - 20
      ctx.beginPath()
      ctx.moveTo(rx, ry)
      ctx.lineTo(rx - 3, ry + 12)
      ctx.stroke()
    }
  } else if (weather.type === 'fog') {
    ctx.globalAlpha = weather.intensity * 0.3
    ctx.fillStyle = '#8899aa'
    ctx.fillRect(0, 0, w, h)
    ctx.globalAlpha = 1
  } else if (weather.type === 'wind') {
    ctx.strokeStyle = `rgba(200,200,180,${weather.intensity * 0.08})`
    ctx.lineWidth = 0.5
    for (let i = 0; i < 30; i++) {
      const wx = ((tick * 4 + i * 41) % (w + 80)) - 40
      const wy = ((tick * 0.5 + i * 61) % h)
      ctx.beginPath()
      ctx.moveTo(wx, wy)
      ctx.lineTo(wx + Math.cos(weather.windAngle) * 25, wy + Math.sin(weather.windAngle) * 25)
      ctx.stroke()
    }
  }
}
