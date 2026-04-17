import { useGameStore } from '../../store/gameStore'
import { RadarChart } from '../../components/RadarChart'
import { FACTION_NAMES, FACTION_COLORS } from '../../config/factionDisplay'

const TROOP_NAMES: Record<string, string> = {
  cavalry: '骑兵', infantry: '步兵', archer: '弓兵', shield: '盾兵', spearman: '枪兵',
}
const STATE_NAMES: Record<string, string> = {
  idle: '待命', moving: '移动', attacking: '交战', retreating: '撤退', routed: '溃败', dead: '阵亡',
}

export function UnitDetailOverlay() {
  const selectedUnitId = useGameStore((s) => s.selectedUnitId)
  const battleState = useGameStore((s) => s.battleState)
  const selectUnit = useGameStore((s) => s.selectUnit)

  if (!selectedUnitId || !battleState) return null

  const unit = battleState.units.find((u) => u.id === selectedUnitId)
  if (!unit) return null

  const fc = FACTION_COLORS[unit.faction] ?? '#888'

  return (
    <div
      className="absolute bottom-0 left-0 right-0 sm:bottom-2 sm:left-auto sm:right-2 sm:w-72
        bg-gray-900/95 border-t sm:border border-gray-700 sm:rounded-lg p-2 backdrop-blur-sm z-10
        max-h-[40vh] overflow-y-auto"
    >
      <button
        onClick={() => selectUnit(null)}
        className="absolute top-1 right-2 text-gray-500 hover:text-white text-sm"
      >
        ✕
      </button>

      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: fc }} />
        <span className="font-bold text-sm" style={{ color: fc }}>{unit.name}</span>
        <span className="text-xs text-gray-500">
          {FACTION_NAMES[unit.faction]} · {TROOP_NAMES[unit.troopType]}
        </span>
      </div>

      <div className="flex gap-2 sm:gap-3">
        {/* Radar chart — smaller on mobile */}
        <div className="shrink-0">
        <RadarChart
          size={70}
          color={fc}
          values={[
            { label: '统', value: unit.command, max: 100 },
            { label: '谋', value: unit.strategy, max: 100 },
            { label: '政', value: unit.politics, max: 100 },
            { label: '勇', value: unit.martial, max: 100 },
            { label: '功', value: unit.achievement, max: 100 },
            { label: '德', value: unit.charisma, max: 100 },
          ]}
        />
        </div>

        {/* Stats */}
        <div className="flex-1 text-[11px] sm:text-xs space-y-0.5 sm:space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-400">状态</span>
            <span className={unit.state === 'dead' ? 'text-red-400' : 'text-green-400'}>
              {STATE_NAMES[unit.state]}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">血量</span>
            <span>{unit.hp}/{unit.maxHp} ({Math.round(unit.hp/unit.maxHp*100)}%)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">士气</span>
            <span>{Math.round(unit.morale)}/{Math.round(unit.maxMorale)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">攻/防</span>
            <span>{unit.atk}/{unit.def}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">速度</span>
            <span>{unit.speed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">射程</span>
            <span>{unit.range}</span>
          </div>
          <hr className="border-gray-800" />
          <div className="flex justify-between">
            <span className="text-gray-400">击杀</span>
            <span className="text-red-300">{unit.kills}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">输出</span>
            <span className="text-orange-300">{unit.damageDealt}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">承伤</span>
            <span className="text-yellow-300">{unit.damageTaken}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
