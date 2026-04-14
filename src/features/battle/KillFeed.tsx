import { useGameStore } from '../../store/gameStore'

export function KillFeed() {
  const killFeed = useGameStore((s) => s.killFeed)

  if (killFeed.length === 0) return null

  return (
    <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-0.5 pointer-events-none">
      {killFeed.map((item, i) => (
        <div
          key={`${item.tick}-${i}`}
          className="px-3 py-0.5 rounded text-xs font-medium backdrop-blur-sm whitespace-nowrap"
          style={{
            color: item.color,
            backgroundColor: 'rgba(0,0,0,0.7)',
            opacity: 1 - i * 0.2,
            fontSize: i === 0 ? '12px' : '10px',
          }}
        >
          {item.message}
        </div>
      ))}
    </div>
  )
}
