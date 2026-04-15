import { useGameStore } from '../../store/gameStore'

export function KillFeed() {
  const killFeed = useGameStore((s) => s.killFeed)
  const dramaticEvent = useGameStore((s) => s.dramaticEvent)
  const slowMoTicks = useGameStore((s) => s.slowMoTicks)

  return (
    <div className="absolute top-0 left-0 right-0 z-10 flex flex-col items-center pointer-events-none">
      {/* Dramatic event banner — big centered announcement */}
      {dramaticEvent && slowMoTicks > 0 && (
        <div
          className="mt-2 px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-bold text-center backdrop-blur-md animate-pulse"
          style={{
            color: dramaticEvent.color,
            backgroundColor: 'rgba(0,0,0,0.8)',
            borderColor: dramaticEvent.color + '44',
            borderWidth: 1,
            textShadow: `0 0 10px ${dramaticEvent.color}66`,
          }}
        >
          {dramaticEvent.message}
        </div>
      )}

      {/* Regular kill feed */}
      {killFeed.length > 0 && (
        <div className="flex flex-col items-center gap-0.5 mt-1">
          {killFeed.map((item, i) => (
            <div
              key={`${item.tick}-${i}`}
              className="px-2 sm:px-3 py-0.5 rounded text-[10px] sm:text-xs backdrop-blur-sm whitespace-nowrap"
              style={{
                color: item.color,
                backgroundColor: 'rgba(0,0,0,0.6)',
                opacity: 1 - i * 0.2,
              }}
            >
              {item.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
