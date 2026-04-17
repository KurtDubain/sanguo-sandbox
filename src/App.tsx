import { useGameStore } from './store/gameStore'
import { BattleCanvas } from './features/battle/BattleCanvas'
import { ControlBar } from './features/battle/ControlBar'
import { KillFeed } from './features/battle/KillFeed'
import { UnitDetailOverlay } from './features/battle/UnitDetailOverlay'
import { Minimap } from './features/battle/Minimap'
import { StatsBar } from './features/battle/StatsBar'
import { ConfigPanel } from './features/generals/ConfigPanel'
import { LogPanel } from './features/battle/LogPanel'
import { ResultPanel } from './features/stats/ResultPanel'
import { BatchPanel } from './features/stats/BatchPanel'
import { SettingsPanel } from './features/battle/SettingsPanel'
import { HistoryPanel } from './features/stats/HistoryPanel'
import { GuidePanel } from './features/battle/GuidePanel'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

const TABS = [
  { key: 'config' as const, label: '将领' },
  { key: 'log' as const, label: '日志' },
  { key: 'result' as const, label: '结果' },
  { key: 'batch' as const, label: '批量' },
  { key: 'history' as const, label: '战史' },
  { key: 'settings' as const, label: '设置' },
  { key: 'guide' as const, label: '说明' },
]

export default function App() {
  const { activeTab, setActiveTab, isPanelOpen, togglePanel } = useGameStore()
  useKeyboardShortcuts()

  return (
    <div className="h-[100dvh] flex flex-col bg-[#0a0e17] text-[#d4c9a8] overflow-hidden">
      {/* Header — minimal on mobile */}
      <header className="flex items-center justify-between px-2 py-1 bg-gray-900/60 border-b border-gray-800 shrink-0">
        <h1 className="text-xs sm:text-sm font-bold text-amber-200/80 truncate flex items-center gap-1">
          <img src="/favicon.svg" alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">三国演弈</span>
          <span className="sm:hidden">演弈</span>
        </h1>
        <div className="flex items-center gap-1 shrink-0">
          <span className="hidden md:inline text-xs text-gray-500">空格=暂停 R=重开</span>
          <button
            onClick={togglePanel}
            className="text-gray-400 hover:text-gray-200 text-[10px] sm:text-xs px-1.5 py-1 border border-gray-700 rounded min-h-[28px]"
          >
            {isPanelOpen ? '收起' : '面板'}
          </button>
        </div>
      </header>

      {/* Control bar */}
      <div className="px-1 sm:px-2 md:px-4 py-0.5 sm:py-1 shrink-0">
        <ControlBar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 px-1 sm:px-2 md:px-4 pb-1 gap-1">

        {/* Side panel — bottom sheet on mobile */}
        {isPanelOpen && (
          <div className="lg:w-72 xl:w-80 flex flex-col bg-gray-900/40 border border-gray-800 rounded-lg overflow-hidden shrink-0
            max-h-[28vh] lg:max-h-none order-2 lg:order-1">
            {/* Tab bar — horizontally scrollable */}
            <div className="flex border-b border-gray-800 shrink-0 overflow-x-auto no-scrollbar">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`shrink-0 text-[10px] sm:text-xs px-2 sm:px-3 py-2 min-h-[32px] transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'text-amber-300 border-b-2 border-amber-400 bg-gray-800/30'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-hidden">
              {activeTab === 'config' && <ConfigPanel />}
              {activeTab === 'log' && <LogPanel />}
              {activeTab === 'result' && <ResultPanel />}
              {activeTab === 'batch' && <BatchPanel />}
              {activeTab === 'settings' && <SettingsPanel />}
              {activeTab === 'history' && <HistoryPanel />}
              {activeTab === 'guide' && <GuidePanel />}
            </div>
          </div>
        )}

        {/* Battlefield */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 order-1 lg:order-2 overflow-hidden">
          <div className="flex-1 flex items-center justify-center relative min-h-0">
            <BattleCanvas />
            <KillFeed />
            <UnitDetailOverlay />
            <Minimap />
          </div>
        </div>
      </div>

      {/* Bottom stats bar — compact on mobile */}
      <StatsBar />
    </div>
  )
}
