import { useGameStore } from '../../store/gameStore'
import { FACTION_NAMES } from '../../config/factionDisplay'

export function BatchPanel() {
  const { batchResult, batchRunning, batchProgress, runBatch, selectedGeneralIds } = useGameStore()

  const canRun = selectedGeneralIds.length >= 2 && !batchRunning

  return (
    <div className="flex flex-col gap-3 p-3 overflow-y-auto h-full">
      <h3 className="text-sm font-semibold text-gray-200">批量模拟</h3>

      <div className="flex gap-2">
        {[20, 50, 100].map((n) => (
          <button
            key={n}
            onClick={() => runBatch(n)}
            disabled={!canRun}
            className="px-3 py-1 bg-blue-800 hover:bg-blue-700 text-white text-xs rounded disabled:opacity-50"
          >
            跑 {n} 次
          </button>
        ))}
      </div>

      {batchRunning && (
        <div className="space-y-1">
          <div className="text-xs text-gray-400">模拟中... {batchProgress}%</div>
          <div className="w-full h-2 bg-gray-800 rounded overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${batchProgress}%` }}
            />
          </div>
        </div>
      )}

      {batchResult && !batchRunning && (
        <>
          <div className="text-xs text-gray-400">
            共 {batchResult.totalRuns} 次模拟
          </div>

          {/* Faction wins */}
          <div>
            <div className="text-xs text-gray-400 mb-1">阵营胜率</div>
            <div className="space-y-1">
              {Object.entries(batchResult.factionWins)
                .sort((a, b) => b[1] - a[1])
                .map(([faction, wins]) => {
                  const pct = ((wins / batchResult.totalRuns) * 100).toFixed(1)
                  return (
                    <div key={faction} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-300 w-10">
                        {FACTION_NAMES[faction] ?? faction}
                      </span>
                      <div className="flex-1 h-3 bg-gray-800 rounded overflow-hidden">
                        <div
                          className="h-full bg-blue-600/60 rounded"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-gray-400 w-14 text-right">
                        {wins}胜 ({pct}%)
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* General stats */}
          <div>
            <div className="text-xs text-gray-400 mb-1">将领统计</div>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-gray-500 border-b border-gray-700">
                  <th className="text-left py-1 font-normal">将领</th>
                  <th className="text-right py-1 font-normal">胜率</th>
                  <th className="text-right py-1 font-normal">均杀</th>
                  <th className="text-right py-1 font-normal">均输出</th>
                  <th className="text-right py-1 font-normal">均承伤</th>
                  <th className="text-right py-1 font-normal">均存活</th>
                  <th className="text-right py-1 font-normal">MVP分</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(batchResult.generalStats)
                  .sort((a, b) => b[1].avgMvpScore - a[1].avgMvpScore)
                  .map(([id, stats]) => {
                    const winRate = ((stats.wins / batchResult.totalRuns) * 100).toFixed(1)
                    return (
                      <tr key={id} className="text-gray-300 border-b border-gray-800">
                        <td className="py-1">
                          {stats.name}
                          <span className="text-gray-600 ml-1">
                            {FACTION_NAMES[stats.faction]}
                          </span>
                        </td>
                        <td className="text-right py-1">{winRate}%</td>
                        <td className="text-right py-1">{stats.avgKills}</td>
                        <td className="text-right py-1">{stats.avgDamageDealt}</td>
                        <td className="text-right py-1">{stats.avgDamageTaken}</td>
                        <td className="text-right py-1">{stats.avgSurvivalTicks}</td>
                        <td className="text-right py-1">{stats.avgMvpScore}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
