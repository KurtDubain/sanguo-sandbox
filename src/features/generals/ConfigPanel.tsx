import { useGameStore } from '../../store/gameStore'
import { GOD_GENERALS } from '../../config/generals'
import { HISTORICAL_BATTLES } from '../../config/campaigns'

const FACTION_INFO: Record<string, { name: string; color: string }> = {
  wei: { name: '魏', color: '#4a7cbf' },
  shu: { name: '蜀', color: '#c44e4e' },
  wu: { name: '吴', color: '#4eb84e' },
  qun: { name: '群雄', color: '#b8a44e' },
  dong: { name: '董卓', color: '#8b3a3a' },
  yuan: { name: '袁绍', color: '#7a6abf' },
  xiliang: { name: '西凉', color: '#bf8a3a' },
  jingzhou: { name: '荆州', color: '#5a8a6a' },
  yizhou: { name: '益州', color: '#6a7a3a' },
  jin: { name: '晋', color: '#8a8abf' },
}

const TROOP_NAMES: Record<string, string> = {
  cavalry: '骑兵', infantry: '步兵', archer: '弓兵', shield: '盾兵', spearman: '枪兵',
}

const RARITY_BADGES: Record<string, { text: string; cls: string }> = {
  legend: { text: '传说', cls: 'bg-yellow-600/30 text-yellow-300 border-yellow-600/50' },
  elite: { text: '精英', cls: 'bg-blue-600/30 text-blue-300 border-blue-600/50' },
  normal: { text: '普通', cls: 'bg-gray-600/30 text-gray-300 border-gray-600/50' },
  god: { text: '神', cls: 'bg-red-600/30 text-red-300 border-red-500/60 animate-pulse' },
}

// Quick presets for faction combinations
const PRESETS: { label: string; factions: string[] }[] = [
  { label: '全部', factions: ['wei', 'shu', 'wu', 'qun', 'dong', 'yuan', 'xiliang', 'jingzhou', 'yizhou', 'jin'] },
  { label: '魏蜀吴', factions: ['wei', 'shu', 'wu'] },
  { label: '魏vs蜀', factions: ['wei', 'shu'] },
  { label: '魏vs吴', factions: ['wei', 'wu'] },
  { label: '蜀vs吴', factions: ['shu', 'wu'] },
  { label: '讨董联盟', factions: ['wei', 'shu', 'wu', 'dong'] },
  { label: '官渡', factions: ['wei', 'yuan'] },
  { label: '西凉vs魏', factions: ['xiliang', 'wei'] },
  { label: '入蜀', factions: ['shu', 'yizhou'] },
  { label: '荆州争夺', factions: ['shu', 'wu', 'jingzhou'] },
  { label: '晋灭吴', factions: ['jin', 'wu'] },
  { label: '群雄逐鹿', factions: ['dong', 'yuan', 'xiliang', 'qun'] },
  { label: '十方混战', factions: ['wei', 'shu', 'wu', 'qun', 'dong', 'yuan', 'xiliang', 'jingzhou', 'yizhou', 'jin'] },
]

export function ConfigPanel() {
  const {
    allGenerals,
    selectedGeneralIds,
    toggleGeneral,
    selectAllGenerals,
    deselectAllGenerals,
    toggleGodMode,
  } = useGameStore()

  const factions = [...new Set(allGenerals.map((g) => g.faction))] as const
  const hasGods = allGenerals.some((g) => g.tags?.includes('god'))
  const godIds = GOD_GENERALS.map((g) => g.id)

  // God vs normals preset
  const applyGodVsNormals = () => {
    if (!hasGods) toggleGodMode(true)
    // Select all gods + all normals
    setTimeout(() => {
      const store = useGameStore.getState()
      useGameStore.setState({
        selectedGeneralIds: store.allGenerals.map((g) => g.id),
      })
    }, 0)
  }

  const applyGodsOnly = () => {
    if (!hasGods) toggleGodMode(true)
    setTimeout(() => {
      useGameStore.setState({ selectedGeneralIds: [...godIds] })
    }, 0)
  }

  // Toggle entire faction
  const toggleFaction = (faction: string) => {
    const factionIds = allGenerals.filter((g) => g.faction === faction).map((g) => g.id)
    const allSelected = factionIds.every((id) => selectedGeneralIds.includes(id))

    if (allSelected) {
      // Deselect all from this faction
      const newIds = selectedGeneralIds.filter((id) => !factionIds.includes(id))
      useGameStore.setState({ selectedGeneralIds: newIds })
    } else {
      // Select all from this faction
      const newIds = [...new Set([...selectedGeneralIds, ...factionIds])]
      useGameStore.setState({ selectedGeneralIds: newIds })
    }
  }

  // Apply preset
  const applyPreset = (factionList: string[]) => {
    const ids = allGenerals.filter((g) => factionList.includes(g.faction)).map((g) => g.id)
    useGameStore.setState({ selectedGeneralIds: ids })
  }

  // Count selected factions
  const activeFactions = factions.filter((f) =>
    allGenerals.some((g) => g.faction === f && selectedGeneralIds.includes(g.id))
  )

  return (
    <div className="flex flex-col gap-2 h-full overflow-y-auto p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-200">将领配置</h3>
        <div className="flex gap-1">
          <button onClick={selectAllGenerals}
            className="text-xs px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300">全选</button>
          <button onClick={deselectAllGenerals}
            className="text-xs px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300">清空</button>
        </div>
      </div>

      {/* Quick presets */}
      <div>
        <div className="text-[10px] text-gray-500 mb-1">快速选阵</div>
        <div className="flex flex-wrap gap-1">
          {PRESETS.map((p) => {
            const isActive = p.factions.length === activeFactions.length &&
              p.factions.every((f) => activeFactions.includes(f as any))
            return (
              <button
                key={p.label}
                onClick={() => applyPreset(p.factions)}
                className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                  isActive
                    ? 'bg-amber-700/30 border-amber-600/50 text-amber-300'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Historical battles */}
      <div>
        <div className="text-[10px] text-gray-500 mb-1">历史战役</div>
        <div className="flex flex-wrap gap-1">
          {HISTORICAL_BATTLES.map((battle) => (
            <button
              key={battle.id}
              onClick={() => {
                // Select the specific generals from this battle
                const ids = battle.factions.flatMap((f) => f.generalIds)
                useGameStore.setState({
                  selectedGeneralIds: ids,
                  mapTemplate: battle.mapTemplate,
                  battleMode: battle.mode,
                })
              }}
              className="text-[10px] px-1.5 py-0.5 rounded border bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
              title={`${battle.year} ${battle.description}`}
            >
              {battle.name}
            </button>
          ))}
        </div>
      </div>

      {/* God mode */}
      <div className="p-1.5 rounded border border-amber-800/30 bg-amber-900/10">
        <div className="flex items-center gap-2 mb-1">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={hasGods}
              onChange={(e) => toggleGodMode(e.target.checked)}
              className="w-3 h-3 accent-amber-500"
            />
            <span className="text-[11px] text-amber-300 font-medium">神将模式</span>
          </label>
          {hasGods && (
            <div className="flex gap-1 ml-auto">
              <button onClick={applyGodsOnly}
                className="text-[9px] px-1 py-0.5 bg-amber-800/30 border border-amber-700/40 rounded text-amber-300 hover:bg-amber-700/40">
                神将乱斗
              </button>
              <button onClick={applyGodVsNormals}
                className="text-[9px] px-1 py-0.5 bg-amber-800/30 border border-amber-700/40 rounded text-amber-300 hover:bg-amber-700/40">
                神vs凡
              </button>
            </div>
          )}
        </div>
        {hasGods && (
          <div className="text-[9px] text-gray-500">
            8 名神将：血量/攻防/技能大幅强化，以一当十
          </div>
        )}
      </div>

      <div className="text-xs text-gray-400">
        已选 {selectedGeneralIds.length} 将 · {activeFactions.length} 阵营
      </div>

      {/* Faction groups */}
      {factions.map((faction) => {
        const info = FACTION_INFO[faction]
        const factionGenerals = allGenerals.filter((g) => g.faction === faction)
        const selectedCount = factionGenerals.filter((g) =>
          selectedGeneralIds.includes(g.id)
        ).length
        const allFactionSelected = selectedCount === factionGenerals.length
        const noneFactionSelected = selectedCount === 0

        return (
          <div key={faction} className="space-y-0.5">
            {/* Faction header — clickable to toggle entire faction */}
            <div
              onClick={() => toggleFaction(faction)}
              className="flex items-center gap-2 text-xs font-medium cursor-pointer hover:opacity-80 py-0.5"
              style={{ color: info.color }}
            >
              <input
                type="checkbox"
                checked={allFactionSelected}
                ref={(el) => { if (el) el.indeterminate = !allFactionSelected && !noneFactionSelected }}
                readOnly
                className="w-3 h-3 accent-blue-500 pointer-events-none"
              />
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: info.color }} />
              {info.name} ({selectedCount}/{factionGenerals.length})
            </div>

            {/* General list — collapse if none selected */}
            {selectedCount > 0 || !noneFactionSelected ? (
              <div className="grid grid-cols-1 gap-0.5 ml-2">
                {factionGenerals.map((g) => {
                  const isSelected = selectedGeneralIds.includes(g.id)
                  const isGod = g.tags?.includes('god')
                  const rarity = isGod ? RARITY_BADGES.god : RARITY_BADGES[g.rarity]
                  return (
                    <div
                      key={g.id}
                      onClick={() => toggleGeneral(g.id)}
                      className={`flex items-center gap-1.5 p-1 rounded cursor-pointer text-[11px] transition-colors ${
                        isSelected
                          ? 'bg-gray-700/50 border border-gray-600/50'
                          : 'bg-gray-800/30 border border-transparent hover:bg-gray-700/20 opacity-50'
                      }`}
                    >
                      <input type="checkbox" checked={isSelected} readOnly className="w-2.5 h-2.5 accent-blue-500 pointer-events-none" />
                      <span className="font-medium text-gray-200 w-10">{g.name}</span>
                      <span className={`px-1 py-0 text-[9px] rounded border ${rarity.cls}`}>{rarity.text}</span>
                      <span className="text-gray-500 text-[10px]">{TROOP_NAMES[g.troopType]}</span>
                      <div className="ml-auto flex gap-0.5 text-[9px] text-gray-500">
                        <span>统{g.command}</span>
                        <span>谋{g.strategy}</span>
                        <span>勇{g.martial}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-[10px] text-gray-600 ml-5 py-0.5">
                点击上方启用该阵营
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
