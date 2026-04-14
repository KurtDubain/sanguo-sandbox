interface RadarChartProps {
  values: { label: string; value: number; max: number }[]
  size?: number
  color?: string
}

export function RadarChart({ values, size = 80, color = '#4a7cbf' }: RadarChartProps) {
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38
  const n = values.length
  const angleStep = (Math.PI * 2) / n

  // Background grid circles
  const gridLevels = [0.33, 0.66, 1]
  const gridPaths = gridLevels.map((level) => {
    const points = values.map((_, i) => {
      const a = angleStep * i - Math.PI / 2
      return `${cx + Math.cos(a) * r * level},${cy + Math.sin(a) * r * level}`
    })
    return points.join(' ')
  })

  // Data polygon
  const dataPoints = values.map((v, i) => {
    const a = angleStep * i - Math.PI / 2
    const ratio = v.value / v.max
    return `${cx + Math.cos(a) * r * ratio},${cy + Math.sin(a) * r * ratio}`
  })

  // Axis lines
  const axes = values.map((_, i) => {
    const a = angleStep * i - Math.PI / 2
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }
  })

  // Labels
  const labels = values.map((v, i) => {
    const a = angleStep * i - Math.PI / 2
    const lx = cx + Math.cos(a) * (r + 12)
    const ly = cy + Math.sin(a) * (r + 12)
    return { ...v, x: lx, y: ly }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid */}
      {gridPaths.map((p, i) => (
        <polygon
          key={i}
          points={p}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="0.5"
        />
      ))}

      {/* Axes */}
      {axes.map((a, i) => (
        <line
          key={i}
          x1={cx} y1={cy}
          x2={a.x} y2={a.y}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.5"
        />
      ))}

      {/* Data fill */}
      <polygon
        points={dataPoints.join(' ')}
        fill={color}
        fillOpacity={0.25}
        stroke={color}
        strokeWidth="1.5"
        strokeOpacity={0.8}
      />

      {/* Data dots */}
      {values.map((v, i) => {
        const a = angleStep * i - Math.PI / 2
        const ratio = v.value / v.max
        return (
          <circle
            key={i}
            cx={cx + Math.cos(a) * r * ratio}
            cy={cy + Math.sin(a) * r * ratio}
            r={2}
            fill={color}
          />
        )
      })}

      {/* Labels */}
      {labels.map((l, i) => (
        <text
          key={i}
          x={l.x} y={l.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255,255,255,0.6)"
          fontSize="7"
        >
          {l.label}{l.value}
        </text>
      ))}
    </svg>
  )
}
