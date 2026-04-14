import { useGameStore } from '../../store/gameStore'
import { RadarChart } from '../../components/RadarChart'
import { FACTION_NAMES, FACTION_COLORS } from '../../config/factionDisplay'

export function ResultPanel() {
  const battleState = useGameStore((s) => s.battleState)
  const allGenerals = useGameStore((s) => s.allGenerals)
  const result = battleState?.result

  if (!result) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        战斗结束后查看结果
      </div>
    )
  }

  const mvp = result.rankings[0]
  const mvpGeneral = allGenerals.find((g) => g.id === mvp?.id)
  const winColor = FACTION_COLORS[result.winner ?? ''] ?? '#ffcc44'

  return (
    <div className="flex flex-col gap-2 p-3 overflow-y-auto h-full">
      {/* Victory banner */}
      <div
        className="text-center p-3 rounded-lg border"
        style={{
          borderColor: winColor + '44',
          background: `linear-gradient(135deg, ${winColor}15, transparent)`,
        }}
      >
        <div className="text-xs text-gray-400 mb-1">
          {result.mode === 'faction_battle' ? '阵营胜利' : '最终幸存'}
        </div>
        <div className="text-xl font-bold" style={{ color: winColor }}>
          {result.winnerName}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          用时 {result.totalTicks} Tick · 存活 {result.survivors.length} 人
        </div>
      </div>

      {/* MVP with radar */}
      {mvp && mvpGeneral && (
        <div className="flex items-center gap-2 p-2 bg-purple-900/15 border border-purple-800/30 rounded">
          <RadarChart
            size={72}
            color="#a855f7"
            values={[
              { label: '统', value: mvpGeneral.command, max: 100 },
              { label: '谋', value: mvpGeneral.strategy, max: 100 },
              { label: '政', value: mvpGeneral.politics, max: 100 },
              { label: '勇', value: mvpGeneral.martial, max: 100 },
              { label: '功', value: mvpGeneral.achievement, max: 100 },
              { label: '德', value: mvpGeneral.charisma, max: 100 },
            ]}
          />
          <div>
            <div className="text-xs text-purple-400 mb-0.5">MVP</div>
            <div className="text-sm font-bold text-purple-200">{mvp.name}</div>
            <div className="text-[10px] text-gray-400">
              {FACTION_NAMES[mvp.faction]} · 击杀{mvp.kills} · 输出{mvp.damageDealt}
            </div>
            <div className="text-[10px] text-gray-500">
              评分 {Math.round(mvp.mvpScore)}
            </div>
          </div>
        </div>
      )}

      {/* Faction summary */}
      {result.mode === 'faction_battle' && (
        <div className="space-y-1">
          <div className="text-xs text-gray-400">阵营表现</div>
          {Object.keys(FACTION_NAMES).map((f) => {
            const survivors = result.survivors.filter((s) => s.faction === f)
            const all = result.rankings.filter((r) => r.faction === f)
            if (all.length === 0) return null
            const totalKills = all.reduce((s, r) => s + r.kills, 0)
            const totalDmg = all.reduce((s, r) => s + r.damageDealt, 0)
            return (
              <div key={f} className="flex items-center gap-2 text-xs p-1 rounded bg-gray-800/30">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: FACTION_COLORS[f] }} />
                <span style={{ color: FACTION_COLORS[f] }}>{FACTION_NAMES[f]}</span>
                <span className="text-gray-500">
                  存活{survivors.length}/{all.length}
                </span>
                <span className="ml-auto text-gray-400">
                  杀{totalKills} 伤{totalDmg}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Survivors */}
      {result.survivors.length > 0 && (
        <div>
          <div className="text-xs text-gray-400 mb-1">存活将领</div>
          <div className="space-y-0.5">
            {result.survivors.map((s) => (
              <div key={s.id} className="flex items-center gap-1.5 text-[11px] p-1 bg-gray-800/30 rounded">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: FACTION_COLORS[s.faction] }} />
                <span className="text-gray-200">{s.name}</span>
                <span className="ml-auto text-green-400">HP {s.hpPercent}%</span>
                <span className="text-gray-500">杀{s.kills}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full rankings */}
      <div>
        <div className="text-xs text-gray-400 mb-1">全体排名</div>
        <div className="space-y-0.5">
          {result.rankings.map((r, i) => {
            const alive = result.survivors.some((s) => s.id === r.id)
            return (
              <div
                key={r.id}
                className={`flex items-center gap-1 text-[10px] p-1 rounded ${
                  alive ? 'bg-gray-800/30 text-gray-300' : 'text-gray-600'
                }`}
              >
                <span className="w-4 text-right text-gray-500">{i + 1}</span>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: FACTION_COLORS[r.faction] }} />
                <span className="flex-1 truncate">{r.name}</span>
                <span className="text-red-400/70">{r.kills}杀</span>
                <span className="text-orange-400/70">{r.damageDealt}伤</span>
                <span className="text-yellow-400/60">{r.damageTaken}承</span>
                <span className="w-10 text-right text-gray-500">{Math.round(r.mvpScore)}分</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
