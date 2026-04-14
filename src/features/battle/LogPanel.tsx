import { useRef, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { GameEvent } from '../../types'

const EVENT_COLORS: Record<string, string> = {
  battle_start: 'text-blue-300',
  battle_end: 'text-yellow-300',
  attack: 'text-gray-400',
  kill: 'text-red-400',
  skill_trigger: 'text-purple-400',
  morale_break: 'text-orange-400',
  morale_rout: 'text-red-500',
  morale_recover: 'text-green-400',
  retreat: 'text-orange-300',
  state_change: 'text-gray-500',
  weather_change: 'text-sky-300',
  duel: 'text-amber-400',
  charge: 'text-orange-300',
  supply: 'text-green-300',
  danger_zone: 'text-red-400',
}

const EVENT_ICONS: Record<string, string> = {
  battle_start: '[ 开战 ]',
  battle_end: '[ 终局 ]',
  attack: '[ 攻击 ]',
  kill: '[ 击杀 ]',
  skill_trigger: '[ 技能 ]',
  morale_break: '[ 动摇 ]',
  morale_rout: '[ 溃败 ]',
  morale_recover: '[ 恢复 ]',
  weather_change: '[ 天气 ]',
  retreat: '[ 指令 ]',
  duel: '[ 单挑 ]',
  danger_zone: '[ 缩圈 ]',
}

export function LogPanel() {
  const battleState = useGameStore((s) => s.battleState)
  const containerRef = useRef<HTMLDivElement>(null)

  const events = battleState?.events ?? []

  // Only show important events (filter out regular attacks to reduce noise)
  const filteredEvents = events.filter((e) => {
    if (e.type === 'attack') {
      // Show attacks with special tags or early ones
      return e.message.includes('[') || events.indexOf(e) < 3
    }
    return true
  })

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [filteredEvents.length])

  if (!battleState) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        选择将领并开战后查看日志
      </div>
    )
  }

  // Unit status summary
  const units = battleState.units
  const alive = units.filter((u) => u.state !== 'dead')
  const dead = units.filter((u) => u.state === 'dead')

  return (
    <div className="flex flex-col h-full gap-2 p-3">
      {/* Status summary */}
      <div className="flex flex-wrap gap-2 text-xs border-b border-gray-700 pb-2">
        <span className="text-gray-400">
          存活 <span className="text-green-400">{alive.length}</span> / 阵亡{' '}
          <span className="text-red-400">{dead.length}</span>
        </span>
        {battleState.phase === 'running' && (
          <span className="text-blue-400">Tick {battleState.tick}</span>
        )}
      </div>

      {/* Live unit status */}
      <div className="grid grid-cols-2 gap-1 text-[10px] border-b border-gray-700 pb-2 max-h-32 overflow-y-auto">
        {alive
          .sort((a, b) => b.hp / b.maxHp - a.hp / a.maxHp)
          .map((u) => (
            <div key={u.id} className="flex items-center gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: u.color }}
              />
              <span className="text-gray-300 truncate">{u.name}</span>
              <span className="ml-auto text-gray-500">
                {Math.round((u.hp / u.maxHp) * 100)}%
              </span>
            </div>
          ))}
      </div>

      {/* Event log */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-0.5 text-xs font-mono"
      >
        {filteredEvents.slice(-100).map((event, i) => (
          <LogEntry key={i} event={event} />
        ))}
      </div>
    </div>
  )
}

function LogEntry({ event }: { event: GameEvent }) {
  const colorClass = EVENT_COLORS[event.type] ?? 'text-gray-400'
  const icon = EVENT_ICONS[event.type] ?? ''

  return (
    <div className={`${colorClass} leading-tight py-0.5`}>
      <span className="text-gray-600 mr-1">{String(event.tick).padStart(4, '0')}</span>
      {icon && <span className="mr-1">{icon}</span>}
      {event.message}
    </div>
  )
}
