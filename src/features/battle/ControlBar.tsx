import { useEffect, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'
import { MAP_TEMPLATE_NAMES, MapTemplate } from '../../engine/utils/mapgen'
import { FORMATION_LIST, FormationType } from '../../config/formationDefs'

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
    formation,
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
    setFormation,
    randomizeSeed,
    selectedGeneralIds,
  } = useGameStore()

  const tickIntervalRef = useRef<number | null>(null)
  const phase = battleState?.phase

  const autoSlowMo = useGameStore((s) => s.autoSlowMo)

  useEffect(() => {
    if (phase === 'running') {
      // Auto slow-mo reduces effective speed
      const effectiveSpeed = autoSlowMo > 0 ? Math.min(simulationSpeed, 0.5) : simulationSpeed
      const interval = effectiveSpeed < 1
        ? Math.floor(100 / effectiveSpeed)
        : Math.max(10, Math.floor(100 / effectiveSpeed))
      const ticksPerFrame = effectiveSpeed >= 1 ? Math.max(1, Math.floor(effectiveSpeed)) : 1

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
  }, [phase, simulationSpeed, tickBattle, autoSlowMo])

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
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-gray-900/80 border border-gray-700 rounded-lg text-[10px] sm:text-xs">
      {/* Mode */}
      <select
        className="bg-gray-800 text-gray-200 px-1 sm:px-1.5 py-0.5 sm:py-1 rounded border border-gray-600 text-[10px] sm:text-xs max-w-[70px] sm:max-w-none"
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
        className="bg-gray-800 text-gray-200 px-1 sm:px-1.5 py-0.5 sm:py-1 rounded border border-gray-600 text-[10px] sm:text-xs max-w-[60px] sm:max-w-none"
        value={mapTemplate}
        onChange={(e) => setMapTemplate(e.target.value as MapTemplate)}
        disabled={phase === 'running'}
      >
        {Object.entries(MAP_TEMPLATE_NAMES).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>

      {/* Formation */}
      <select
        className="bg-gray-800 text-gray-200 px-1 sm:px-1.5 py-0.5 sm:py-1 rounded border border-gray-600 text-[10px] sm:text-xs max-w-[65px] sm:max-w-none"
        value={formation}
        onChange={(e) => setFormation(e.target.value as FormationType)}
        disabled={phase === 'running'}
        title="阵法"
      >
        {FORMATION_LIST.map((f) => (
          <option key={f.id} value={f.id}>{f.name}</option>
        ))}
      </select>

      {/* Seed */}
      <div className="flex items-center gap-1">
        <span className="text-gray-500 hidden sm:inline">Seed</span>
        <input
          type="number"
          className="bg-gray-800 text-gray-200 px-1 sm:px-1.5 py-0.5 sm:py-1 rounded border border-gray-600 w-12 sm:w-16 text-[10px] sm:text-xs"
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
          className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-blue-700 hover:bg-blue-600 text-white rounded disabled:opacity-50"
        >
          布阵
        </button>
      )}
      {battleState && phase !== 'finished' && (
        <>
          {phase !== 'running' ? (
            <button
              onClick={handleStartOrResume}
              className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-green-700 hover:bg-green-600 text-white rounded"
            >
              {phase === 'setup' ? '⚔ 开战' : '▶ 继续'}
            </button>
          ) : (
            <button
              onClick={pauseBattle}
              className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-yellow-700 hover:bg-yellow-600 text-white rounded"
            >
              ⏸ 暂停
            </button>
          )}
        </>
      )}
      {battleState && (
        <button
          onClick={resetBattle}
          className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-red-800 hover:bg-red-700 text-white rounded"
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
