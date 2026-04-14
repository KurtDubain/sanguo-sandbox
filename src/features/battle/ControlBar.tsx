import { useEffect, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'
import { MAP_TEMPLATE_NAMES, MapTemplate } from '../../engine/utils/mapgen'

const WEATHER_ICONS: Record<string, string> = {
  clear: '☀', rain: '🌧', fog: '🌫', wind: '💨',
}

export function ControlBar() {
  const {
    battleState,
    simulationSpeed,
    seed,
    battleMode,
    mapTemplate,
    initBattle,
    startBattle,
    pauseBattle,
    resumeBattle,
    resetBattle,
    setSpeed,
    tickBattle,
    setSeed,
    setBattleMode,
    setMapTemplate,
    randomizeSeed,
    selectedGeneralIds,
  } = useGameStore()

  const tickIntervalRef = useRef<number | null>(null)
  const phase = battleState?.phase

  useEffect(() => {
    if (phase === 'running') {
      // For speeds < 1, we increase interval; for > 1, we tick multiple times
      const interval = simulationSpeed < 1
        ? Math.floor(100 / simulationSpeed) // 0.5x → 200ms
        : Math.max(10, Math.floor(100 / simulationSpeed))
      const ticksPerFrame = simulationSpeed >= 1 ? Math.max(1, Math.floor(simulationSpeed)) : 1

      tickIntervalRef.current = window.setInterval(() => {
        for (let i = 0; i < ticksPerFrame; i++) {
          tickBattle()
        }
      }, interval)
    } else {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current)
        tickIntervalRef.current = null
      }
    }
    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current)
    }
  }, [phase, simulationSpeed, tickBattle])

  const handleStartOrResume = () => {
    if (!battleState) {
      initBattle()
      setTimeout(() => startBattle(), 50)
    } else if (phase === 'setup') {
      startBattle()
    } else if (phase === 'paused') {
      resumeBattle()
    }
  }

  const weather = battleState?.weather

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-900/80 border border-gray-700 rounded-lg text-xs">
      {/* Mode */}
      <select
        className="bg-gray-800 text-gray-200 px-1.5 py-1 rounded border border-gray-600 text-xs"
        value={battleMode}
        onChange={(e) => setBattleMode(e.target.value as any)}
        disabled={phase === 'running'}
      >
        <option value="faction_battle">阵营对抗</option>
        <option value="free_for_all">混战</option>
        <option value="siege">攻城</option>
      </select>

      {/* Map template */}
      <select
        className="bg-gray-800 text-gray-200 px-1.5 py-1 rounded border border-gray-600 text-xs"
        value={mapTemplate}
        onChange={(e) => setMapTemplate(e.target.value as MapTemplate)}
        disabled={phase === 'running'}
      >
        {Object.entries(MAP_TEMPLATE_NAMES).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>

      {/* Seed */}
      <div className="flex items-center gap-1">
        <span className="text-gray-500 hidden sm:inline">Seed</span>
        <input
          type="number"
          className="bg-gray-800 text-gray-200 px-1.5 py-1 rounded border border-gray-600 w-16 text-xs"
          value={seed}
          onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
          disabled={phase === 'running'}
        />
        <button
          onClick={randomizeSeed}
          disabled={phase === 'running'}
          className="px-1.5 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 disabled:opacity-50"
        >
          🎲
        </button>
      </div>

      <div className="h-5 w-px bg-gray-700 hidden sm:block" />

      {/* Battle controls */}
      {!battleState && (
        <button
          onClick={() => initBattle()}
          disabled={selectedGeneralIds.length < 2}
          className="px-2.5 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded disabled:opacity-50"
        >
          布阵
        </button>
      )}
      {battleState && phase !== 'finished' && (
        <>
          {phase !== 'running' ? (
            <button
              onClick={handleStartOrResume}
              className="px-2.5 py-1 bg-green-700 hover:bg-green-600 text-white rounded"
            >
              {phase === 'setup' ? '⚔ 开战' : '▶ 继续'}
            </button>
          ) : (
            <button
              onClick={pauseBattle}
              className="px-2.5 py-1 bg-yellow-700 hover:bg-yellow-600 text-white rounded"
            >
              ⏸ 暂停
            </button>
          )}
        </>
      )}
      {battleState && (
        <button
          onClick={resetBattle}
          className="px-2.5 py-1 bg-red-800 hover:bg-red-700 text-white rounded"
        >
          ↻ 重开
        </button>
      )}

      <div className="h-5 w-px bg-gray-700 hidden sm:block" />

      {/* Speed */}
      <div className="flex items-center gap-1">
        {[0.5, 1, 2, 4, 8].map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-1.5 py-0.5 rounded ${
              simulationSpeed === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Status / Weather */}
      <div className="ml-auto flex items-center gap-2 text-gray-400">
        {weather && weather.type !== 'clear' && (
          <span className="text-blue-300">
            {WEATHER_ICONS[weather.type]}
          </span>
        )}
        {phase === 'running' && <span>Tick {battleState?.tick}</span>}
        {phase === 'paused' && <span className="text-yellow-400">暂停</span>}
        {phase === 'finished' && <span className="text-green-400">结束</span>}
        {!battleState && <span>已选 {selectedGeneralIds.length} 将</span>}
      </div>
    </div>
  )
}
