import { useEffect, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'
import { MAP_TEMPLATE_NAMES, MapTemplate } from '../../engine/utils/mapgen'
import { FORMATION_LIST, FormationType } from '../../config/formationDefs'

const WEATHER_ICONS: Record<string, string> = {
  clear: '☀', rain: '🌧', fog: '🌫', wind: '💨',
}

export function ControlBar() {
  const {
    battleState, simulationSpeed, seed, battleMode, mapTemplate, formation,
    initBattle, startBattle, pauseBattle, resumeBattle, resetBattle,
    setSpeed, tickBattle, setSeed, setBattleMode, setMapTemplate, setFormation,
    randomizeSeed, selectedGeneralIds,
  } = useGameStore()
  const slowMoTicks = useGameStore((s) => s.slowMoTicks)

  const tickIntervalRef = useRef<number | null>(null)
  const phase = battleState?.phase

  useEffect(() => {
    if (phase === 'running') {
      const effectiveSpeed = slowMoTicks > 0 ? Math.min(simulationSpeed, 0.5) : simulationSpeed
      const interval = effectiveSpeed < 1
        ? Math.floor(100 / effectiveSpeed)
        : Math.max(10, Math.floor(100 / effectiveSpeed))
      const ticksPerFrame = effectiveSpeed >= 1 ? Math.max(1, Math.floor(effectiveSpeed)) : 1

      tickIntervalRef.current = window.setInterval(() => {
        for (let i = 0; i < ticksPerFrame; i++) tickBattle()
      }, interval)
    } else {
      if (tickIntervalRef.current) { clearInterval(tickIntervalRef.current); tickIntervalRef.current = null }
    }
    return () => { if (tickIntervalRef.current) clearInterval(tickIntervalRef.current) }
  }, [phase, simulationSpeed, tickBattle, slowMoTicks])

  const handleStartOrResume = () => {
    if (!battleState) { initBattle(); setTimeout(() => startBattle(), 50) }
    else if (phase === 'setup') startBattle()
    else if (phase === 'paused') resumeBattle()
  }

  const weather = battleState?.weather

  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-gray-900/80 border border-gray-700 rounded text-[10px] sm:text-xs">
      {/* Config selectors — hidden on mobile when battle is running */}
      <div className={`flex items-center gap-1 ${phase === 'running' ? 'hidden sm:flex' : 'flex'}`}>
        <select className="bg-gray-800 text-gray-200 px-1 py-0.5 rounded border border-gray-600 text-[10px] sm:text-xs"
          value={battleMode} onChange={(e) => setBattleMode(e.target.value as any)} disabled={phase === 'running'}>
          <option value="faction_battle">阵营</option>
          <option value="free_for_all">混战</option>
          <option value="siege">攻城</option>
        </select>

        <select className="bg-gray-800 text-gray-200 px-1 py-0.5 rounded border border-gray-600 text-[10px] sm:text-xs max-w-[55px] sm:max-w-none"
          value={mapTemplate} onChange={(e) => setMapTemplate(e.target.value as MapTemplate)} disabled={phase === 'running'}>
          {Object.entries(MAP_TEMPLATE_NAMES).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>

        <select className="bg-gray-800 text-gray-200 px-1 py-0.5 rounded border border-gray-600 text-[10px] sm:text-xs max-w-[55px] sm:max-w-none"
          value={formation} onChange={(e) => setFormation(e.target.value as FormationType)} disabled={phase === 'running'} title="阵法">
          {FORMATION_LIST.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}
        </select>

        <div className="hidden sm:flex items-center gap-1">
          <input type="number" className="bg-gray-800 text-gray-200 px-1 py-0.5 rounded border border-gray-600 w-12 sm:w-14 text-[10px] sm:text-xs"
            value={seed} onChange={(e) => setSeed(parseInt(e.target.value) || 0)} disabled={phase === 'running'} />
          <button onClick={randomizeSeed} disabled={phase === 'running'}
            className="px-1 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 disabled:opacity-50">🎲</button>
        </div>
      </div>

      {/* Battle controls — always visible */}
      <div className="flex items-center gap-1">
        {!battleState && (
          <button onClick={() => initBattle()} disabled={selectedGeneralIds.length < 2}
            className="px-2 py-1 min-h-[28px] bg-blue-700 hover:bg-blue-600 text-white rounded disabled:opacity-50">
            布阵</button>
        )}
        {battleState && phase !== 'finished' && (
          phase !== 'running' ? (
            <button onClick={handleStartOrResume}
              className="px-2 py-1 min-h-[28px] bg-green-700 hover:bg-green-600 text-white rounded">
              {phase === 'setup' ? '⚔开战' : '▶继续'}</button>
          ) : (
            <button onClick={pauseBattle}
              className="px-2 py-1 min-h-[28px] bg-yellow-700 hover:bg-yellow-600 text-white rounded">
              ⏸暂停</button>
          )
        )}
        {battleState && (
          <button onClick={resetBattle}
            className="px-1.5 py-1 min-h-[28px] bg-red-800 hover:bg-red-700 text-white rounded">
            ↻</button>
        )}
      </div>

      {/* Speed — compact */}
      <div className="flex items-center gap-0.5">
        {[0.5, 1, 2, 4, 8].map((s) => (
          <button key={s} onClick={() => setSpeed(s)}
            className={`px-1 sm:px-1.5 py-0.5 min-h-[24px] rounded text-[9px] sm:text-[10px] ${
              simulationSpeed === s ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}>
            {s}x</button>
        ))}
      </div>

      {/* Status — minimal */}
      <div className="ml-auto flex items-center gap-1 text-gray-500 text-[9px] sm:text-[10px]">
        {weather && weather.type !== 'clear' && <span className="text-blue-300">{WEATHER_ICONS[weather.type]}</span>}
        {phase === 'running' && <span>T{battleState?.tick}</span>}
        {phase === 'paused' && <span className="text-yellow-400">暂停</span>}
        {phase === 'finished' && <span className="text-green-400">结束</span>}
        {!battleState && <span>{selectedGeneralIds.length}将</span>}
      </div>
    </div>
  )
}
