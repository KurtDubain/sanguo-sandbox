import { useGameStore, GameSettings, DisplaySettings } from '../../store/gameStore'

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
      { key: 'autoSlowMo', label: '关键慢动作', desc: '斩将/单挑/结局等时刻自动减速' },
    ],
  },
]

const DISPLAY_ITEMS: { key: keyof DisplaySettings; label: string; desc: string }[] = [
  { key: 'showNames', label: '将领名称', desc: '单位下方显示名字' },
  { key: 'showHpBars', label: '血量/士气条', desc: '单位上方的HP和士气条' },
  { key: 'showTrails', label: '移动尾迹', desc: '单位移动时的轨迹线' },
  { key: 'showDamageNumbers', label: '伤害数字', desc: '攻击时弹出的浮动数字' },
  { key: 'showMinimap', label: '小地图', desc: '右下角的全局视野小地图' },
  { key: 'showTargetLines', label: '目标连线', desc: '单位和攻击目标之间的线' },
  { key: 'showWeatherEffects', label: '天气特效', desc: '雨线/雾幕/风痕视觉效果' },
]

export function SettingsPanel() {
  const { settings, display, updateSettings, updateDisplay } = useGameStore()

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

  return (
    <div className="flex flex-col gap-2 h-full overflow-y-auto p-2 sm:p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-200">游戏设置</h3>
        <div className="flex gap-1">
          <button onClick={enableAll}
            className="text-[10px] px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300">全开</button>
          <button onClick={disableAll}
            className="text-[10px] px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300">全关</button>
        </div>
      </div>

      <div className="text-[10px] text-gray-500">战斗设置重开生效 · 显示设置立即生效</div>

      {SETTING_GROUPS.map((group) => (
        <div key={group.title}>
          <div className="text-[10px] text-gray-400 font-medium mb-0.5">{group.title}</div>
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <label key={item.key}
                className="flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-gray-800/30">
                <input type="checkbox" checked={settings[item.key]}
                  onChange={(e) => updateSettings({ [item.key]: e.target.checked })}
                  className="w-3.5 h-3.5 accent-amber-500 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[11px] text-gray-200">{item.label}</span>
                  <span className="text-[10px] text-gray-500 ml-1 hidden sm:inline">{item.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}

      {/* Display settings */}
      <div>
        <div className="text-[10px] text-gray-400 font-medium mb-0.5">显示设置</div>
        <div className="space-y-0.5">
          {DISPLAY_ITEMS.map((item) => (
            <label key={item.key}
              className="flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-gray-800/30">
              <input type="checkbox" checked={display[item.key]}
                onChange={(e) => updateDisplay({ [item.key]: e.target.checked })}
                className="w-3.5 h-3.5 accent-sky-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] text-gray-200">{item.label}</span>
                <span className="text-[10px] text-gray-500 ml-1 hidden sm:inline">{item.desc}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
