import { useState, useEffect } from 'react'
import { loadHistory, clearHistory, MatchRecord } from '../../engine/utils/history'

export function HistoryPanel() {
  const [records, setRecords] = useState<MatchRecord[]>([])

  useEffect(() => {
    setRecords(loadHistory())
  }, [])

  const handleClear = () => {
    clearHistory()
    setRecords([])
  }

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        暂无对局记录
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-3 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-200">对局历史</h3>
        <button onClick={handleClear}
          className="text-[10px] px-1.5 py-0.5 bg-red-900/30 hover:bg-red-800/40 rounded text-red-400 border border-red-800/30">
          清空
        </button>
      </div>
      <div className="text-[10px] text-gray-500">共 {records.length} 场</div>

      <div className="space-y-1">
        {records.map((r) => (
          <div key={r.id} className="p-1.5 rounded bg-gray-800/30 border border-gray-800 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-amber-300 font-medium">{r.winnerName}</span>
              <span className="text-gray-500">{new Date(r.timestamp).toLocaleDateString()}</span>
            </div>
            <div className="flex gap-2 text-gray-500 mt-0.5">
              <span>{r.mode === 'faction_battle' ? '阵营' : '混战'}</span>
              <span>{r.generalCount}将</span>
              <span>{r.totalTicks}tick</span>
              <span>Seed:{r.seed}</span>
            </div>
            <div className="text-gray-400 mt-0.5">
              MVP: {r.mvpName} (杀{r.mvpKills} / {r.mvpScore}分)
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
