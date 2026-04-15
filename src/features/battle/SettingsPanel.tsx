import { useGameStore, GameSettings } from '../../store/gameStore'

const SETTING_GROUPS: {
  title: string
  items: { key: keyof GameSettings; label: string; desc: string }[]
}[] = [
  {
    title: '战场环境',
    items: [
      { key: 'weather', label: '天气系统', desc: '雨/雾/风动态切换，影响战斗属性' },
      { key: 'dangerZone', label: '毒圈缩圈', desc: '800 tick 后安全区缩小，逼迫决战' },
      { key: 'supplyPoints', label: '补给点', desc: '地图上回血回士气的补给区域' },
    ],
  },
  {
    title: 'AI 系统',
    items: [
      { key: 'tacticalAI', label: '兵种战术 AI', desc: '弓兵风筝/骑兵绕后/盾兵护卫' },
      { key: 'commanderAI', label: '指挥官 AI', desc: '阵营集火/撤退/保护指令' },
    ],
  },
  {
    title: '战斗机制',
    items: [
      { key: 'duels', label: '武将单挑', desc: '武力 80+ 将领近距离互攻时触发' },
      { key: 'formations', label: '阵型加成', desc: '弓兵齐射/盾墙/枪兵架枪' },
      { key: 'warCry', label: '战吼鼓舞', desc: '德 80+ 将领定期鼓舞友军' },
      { key: 'surrender', label: '投降机制', desc: '孤立无援的低血低士气单位投降' },
      { key: 'commanderDeath', label: '斩将夺旗', desc: '击杀指挥官全阵营士气崩溃' },
    ],
  },
]

export function SettingsPanel() {
  const { settings, updateSettings } = useGameStore()

  const enableAll = () => {
    const all: Partial<GameSettings> = {}
    for (const g of SETTING_GROUPS) for (const i of g.items) all[i.key] = true
    updateSettings(all)
  }

  const disableAll = () => {
    const all: Partial<GameSettings> = {}
    for (const g of SETTING_GROUPS) for (const i of g.items) all[i.key] = false
    updateSettings(all)
  }

  const enabledCount = Object.values(settings).filter(Boolean).length
  const totalCount = Object.keys(settings).length

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-200">游戏设置</h3>
        <div className="flex gap-1">
          <button onClick={enableAll}
            className="text-[10px] px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300">
            全开
          </button>
          <button onClick={disableAll}
            className="text-[10px] px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300">
            全关
          </button>
        </div>
      </div>

      <div className="text-[10px] text-gray-500">
        {enabledCount}/{totalCount} 项已启用 · 重开生效
      </div>

      {SETTING_GROUPS.map((group) => (
        <div key={group.title}>
          <div className="text-[10px] text-gray-400 font-medium mb-1">{group.title}</div>
          <div className="space-y-1">
            {group.items.map((item) => (
              <label
                key={item.key}
                className="flex items-start gap-2 p-1.5 rounded cursor-pointer hover:bg-gray-800/30 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={settings[item.key]}
                  onChange={(e) => updateSettings({ [item.key]: e.target.checked })}
                  className="w-3 h-3 accent-amber-500 mt-0.5 shrink-0"
                />
                <div>
                  <div className="text-xs text-gray-200">{item.label}</div>
                  <div className="text-[10px] text-gray-500 leading-tight">{item.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
