import { useGameStore } from '../../store/gameStore'
import { FACTION_NAMES, FACTION_COLORS } from '../../config/factionDisplay'

export function StatsBar() {
  const battleState = useGameStore((s) => s.battleState)
  if (!battleState || battleState.phase === 'setup') return null

  const { units } = battleState
  const factions = new Map<string, { alive: number; total: number; kills: number; damage: number }>()

  for (const u of units) {
    const f = factions.get(u.faction) ?? { alive: 0, total: 0, kills: 0, damage: 0 }
    f.total++
    if (u.state !== 'dead') f.alive++
    f.kills += u.kills
    f.damage += u.damageDealt
    factions.set(u.faction, f)
  }

  const totalAlive = units.filter((u) => u.state !== 'dead').length
  const entries = [...factions.entries()].sort((a, b) => b[1].alive - a[1].alive)

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-gray-900/80 border-t border-gray-800 text-[10px] shrink-0 overflow-x-auto">
      {entries.map(([faction, stats]) => {
        const pct = totalAlive > 0 ? Math.round(stats.alive / totalAlive * 100) : 0
        return (
          <div key={faction} className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: FACTION_COLORS[faction] }} />
            <span style={{ color: FACTION_COLORS[faction] }} className="font-medium">
              {FACTION_NAMES[faction]}
            </span>
            <span className="text-gray-400">
              {stats.alive}/{stats.total}
            </span>
            {/* Health bar */}
            <div className="w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: FACTION_COLORS[faction] }} />
            </div>
            <span className="text-gray-500">杀{stats.kills}</span>
            <div className="w-px h-3 bg-gray-800 mx-0.5" />
          </div>
        )
      })}

      {/* Weather + tick compact display */}
      <div className="ml-auto text-gray-500 whitespace-nowrap">
        {battleState.weather.type !== 'clear' && (
          <span className="mr-2 text-sky-400">
            {battleState.weather.type === 'rain' ? '🌧' : battleState.weather.type === 'fog' ? '🌫' : '💨'}
          </span>
        )}
        {battleState.dangerZone.active && (
          <span className="mr-2 text-red-400">⚠ 缩圈中</span>
        )}
      </div>
    </div>
  )
}
