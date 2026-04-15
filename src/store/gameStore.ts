import { create } from 'zustand'
import { BattleEngine } from '../engine'
import { ALL_GENERALS, GOD_GENERALS, ALL_GENERALS_WITH_GODS } from '../config/generals'
import { VFXManager } from '../engine/utils/vfx'
import { MapTemplate } from '../engine/utils/mapgen'
import { FormationType } from '../config/formationDefs'
import { saveMatchResult } from '../engine/utils/history'
import {
  General,
  BattleState,
  BattleMode,
  GameEvent,
  BatchResult,
} from '../types'

// Singleton VFX manager shared with renderer
export const vfxManager = new VFXManager()

export interface GameSettings {
  weather: boolean
  dangerZone: boolean
  supplyPoints: boolean
  duels: boolean
  formations: boolean   // volley, shield wall, brace
  warCry: boolean
  surrender: boolean
  commanderDeath: boolean
  tacticalAI: boolean
  commanderAI: boolean
  autoSlowMo: boolean
  randomModifiers: boolean
}

export const DEFAULT_SETTINGS: GameSettings = {
  weather: true,
  dangerZone: true,
  supplyPoints: true,
  duels: true,
  formations: true,
  warCry: true,
  surrender: true,
  commanderDeath: true,
  tacticalAI: true,
  commanderAI: true,
  autoSlowMo: true,
  randomModifiers: false,
}

interface GameStore {
  allGenerals: General[]
  selectedGeneralIds: string[]
  battleMode: BattleMode
  mapTemplate: MapTemplate
  formation: FormationType
  alliances: string[][]
  seed: number
  settings: GameSettings

  engine: BattleEngine | null
  battleState: BattleState | null
  recentEvents: GameEvent[]
  vfxTick: number
  dramaticEvent: { message: string; color: string; tick: number } | null
  slowMoTicks: number // ticks remaining of auto slow-mo

  isPanelOpen: boolean
  activeTab: 'config' | 'log' | 'result' | 'batch' | 'settings' | 'history' | 'guide'
  simulationSpeed: number
  selectedUnitId: string | null
  boostedGeneralIds: string[]   // generals with stat boost
  killFeed: { tick: number; message: string; color: string }[]

  batchResult: BatchResult | null
  batchRunning: boolean
  batchProgress: number

  toggleGeneral: (id: string) => void
  selectAllGenerals: () => void
  deselectAllGenerals: () => void
  selectFaction: (faction: string) => void
  setBattleMode: (mode: BattleMode) => void
  setMapTemplate: (t: MapTemplate) => void
  setFormation: (f: FormationType) => void
  setSeed: (seed: number) => void
  randomizeSeed: () => void
  setActiveTab: (tab: 'config' | 'log' | 'result' | 'batch' | 'settings' | 'history' | 'guide') => void
  togglePanel: () => void
  selectUnit: (id: string | null) => void
  toggleBoost: (id: string) => void
  updateSettings: (partial: Partial<GameSettings>) => void
  toggleGodMode: (enabled: boolean) => void

  initBattle: () => void
  startBattle: () => void
  pauseBattle: () => void
  resumeBattle: () => void
  resetBattle: () => void
  setSpeed: (speed: number) => void
  tickBattle: () => void

  runBatch: (count: number) => void
}

// Process events to generate VFX
function processEventsForVFX(events: GameEvent[], units: BattleState['units']) {
  for (const ev of events) {
    const source = ev.sourceId ? units.find((u) => u.id === ev.sourceId) : null
    const target = ev.targetId ? units.find((u) => u.id === ev.targetId) : null

    switch (ev.type) {
      case 'attack':
        if (target && source) {
          const isCrit = ev.message.includes('暴击')
          vfxManager.addDamageNumber(target.position.x, target.position.y, ev.value ?? 0, isCrit)
          vfxManager.addHitFlash(target.position.x, target.position.y)
          // Projectile
          const isMelee = source.range <= 60
          vfxManager.addProjectile(
            source.position.x, source.position.y,
            target.position.x, target.position.y,
            isMelee ? 'slash' : 'arrow',
            source.color,
          )
        }
        break
      case 'kill':
        if (target) {
          vfxManager.addDeath(target.position.x, target.position.y, target.name, target.color)
          vfxManager.removeTrail(target.id)
        }
        break
      case 'duel':
        if (source && target && ev.message.includes('开始')) {
          vfxManager.setDuel(
            source.position.x, source.position.y,
            target.position.x, target.position.y,
            source.name, target.name,
          )
        } else if (ev.message.includes('胜') || ev.message.includes('斩杀')) {
          vfxManager.clearDuel()
        }
        break
      case 'skill_trigger':
        if (source) {
          vfxManager.addSkillBurst(
            source.position.x, source.position.y,
            60, ev.message, source.color
          )
        }
        break
      case 'morale_rout':
        if (source) {
          vfxManager.addMoraleText(source.position.x, source.position.y, '溃败!')
        }
        break
      case 'morale_break':
        if (source) {
          vfxManager.addMoraleText(source.position.x, source.position.y, '动摇!')
        }
        break
      case 'morale_recover':
        if (source) {
          vfxManager.addHealNumber(source.position.x, source.position.y, 0)
          vfxManager.addMoraleText(source.position.x, source.position.y, '恢复!')
        }
        break
    }
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  allGenerals: ALL_GENERALS,
  selectedGeneralIds: ALL_GENERALS.map((g) => g.id),
  battleMode: 'faction_battle',
  mapTemplate: 'random' as MapTemplate,
  formation: 'none' as FormationType,
  alliances: [] as string[][],
  seed: Math.floor(Math.random() * 100000),
  settings: { ...DEFAULT_SETTINGS },

  engine: null,
  battleState: null,
  recentEvents: [],
  vfxTick: 0,
  dramaticEvent: null,
  slowMoTicks: 0,

  isPanelOpen: true,
  activeTab: 'config',
  simulationSpeed: 1,
  selectedUnitId: null,
  boostedGeneralIds: [],
  killFeed: [],

  batchResult: null,
  batchRunning: false,
  batchProgress: 0,

  toggleGeneral: (id) => set((s) => ({
    selectedGeneralIds: s.selectedGeneralIds.includes(id)
      ? s.selectedGeneralIds.filter((gid) => gid !== id)
      : [...s.selectedGeneralIds, id],
  })),

  selectAllGenerals: () => set((s) => ({ selectedGeneralIds: s.allGenerals.map((g) => g.id) })),
  deselectAllGenerals: () => set({ selectedGeneralIds: [] }),
  selectFaction: (faction) => set({
    selectedGeneralIds: ALL_GENERALS.filter((g) => g.faction === faction).map((g) => g.id),
  }),

  setBattleMode: (mode) => set({ battleMode: mode }),
  setMapTemplate: (t) => set({ mapTemplate: t }),
  setFormation: (f) => set({ formation: f }),
  setSeed: (seed) => set({ seed }),
  randomizeSeed: () => set({ seed: Math.floor(Math.random() * 100000) }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  togglePanel: () => set((s) => ({ isPanelOpen: !s.isPanelOpen })),
  selectUnit: (id) => set({ selectedUnitId: id }),
  toggleBoost: (id) => set((s) => ({
    boostedGeneralIds: s.boostedGeneralIds.includes(id)
      ? s.boostedGeneralIds.filter((gid) => gid !== id)
      : [...s.boostedGeneralIds, id],
  })),
  updateSettings: (partial) => set((s) => ({ settings: { ...s.settings, ...partial } })),
  toggleGodMode: (enabled) => {
    if (enabled) {
      const currentIds = get().selectedGeneralIds
      const godIds = GOD_GENERALS.map((g) => g.id)
      set({
        allGenerals: ALL_GENERALS_WITH_GODS,
        selectedGeneralIds: [...new Set([...currentIds, ...godIds])],
      })
    } else {
      const godIds = new Set(GOD_GENERALS.map((g) => g.id))
      set({
        allGenerals: ALL_GENERALS,
        selectedGeneralIds: get().selectedGeneralIds.filter((id) => !godIds.has(id)),
      })
    }
  },

  initBattle: () => {
    const { selectedGeneralIds, allGenerals, battleMode, seed, mapTemplate } = get()
    const generals = allGenerals.filter((g) => selectedGeneralIds.includes(g.id))
    if (generals.length < 2) return

    vfxManager.clear()
    const engine = new BattleEngine(generals, battleMode, seed, mapTemplate, get().settings, get().formation, get().boostedGeneralIds, get().alliances ?? [])
    set({
      engine,
      battleState: engine.getState(),
      recentEvents: [],
      activeTab: 'log',
    })
  },

  startBattle: () => {
    const { engine } = get()
    if (!engine) return
    engine.start()
    set({ battleState: { ...engine.getState() } })
  },

  pauseBattle: () => {
    const { engine } = get()
    if (!engine) return
    engine.pause()
    set({ battleState: { ...engine.getState() } })
  },

  resumeBattle: () => {
    const { engine } = get()
    if (!engine) return
    engine.resume()
    set({ battleState: { ...engine.getState() } })
  },

  resetBattle: () => {
    vfxManager.clear()
    get().randomizeSeed()
    get().initBattle()
  },

  setSpeed: (speed) => {
    const { engine } = get()
    if (engine) engine.setSpeed(speed)
    set({ simulationSpeed: speed })
  },

  tickBattle: () => {
    const { engine } = get()
    if (!engine) return
    if (engine.getState().phase !== 'running') return

    const newEvents = engine.tick()
    const state = engine.getState()

    // Feed events to VFX
    processEventsForVFX(newEvents, state.units)

    // Update unit trails
    for (const u of state.units) {
      if (u.state === 'dead') continue
      if (u.state === 'moving' || u.state === 'attacking') {
        vfxManager.updateTrail(u.id, u.position.x, u.position.y, u.color)
      }
    }

    // Update duel highlight positions
    if (vfxManager.duelHighlight) {
      const dh = vfxManager.duelHighlight
      // Find the duel participants and update positions
      const a = state.units.find((u) => u.name === dh.nameA)
      const b = state.units.find((u) => u.name === dh.nameB)
      if (a && b && a.state !== 'dead' && b.state !== 'dead') {
        dh.x1 = a.position.x; dh.y1 = a.position.y
        dh.x2 = b.position.x; dh.y2 = b.position.y
      } else {
        vfxManager.clearDuel()
      }
    }

    vfxManager.tick()

    // Dramatic events: detect key moments for slow-mo + announcement
    let dramatic: { message: string; color: string; tick: number } | null = null
    let slowMoTicks = get().slowMoTicks > 0 ? get().slowMoTicks - 1 : 0

    // Only apply slow-mo if setting is enabled
    if (!get().settings.autoSlowMo) {
      slowMoTicks = 0
    }

    for (const ev of newEvents) {
      // Commander killed
      if (ev.type === 'morale_rout' && ev.message.includes('主帅')) {
        dramatic = { message: ev.message, color: '#ff4444', tick: state.tick }
        slowMoTicks = 30
      }
      // Duel started
      if (ev.type === 'duel' && ev.message.includes('开始')) {
        dramatic = { message: ev.message, color: '#ffaa22', tick: state.tick }
        slowMoTicks = 20
      }
      // Duel kill
      if (ev.type === 'kill' && ev.message.includes('单挑斩杀')) {
        dramatic = { message: ev.message, color: '#ff2222', tick: state.tick }
        slowMoTicks = 25
      }
      // Last survivor
      const alive = state.units.filter((u) => u.state !== 'dead')
      if (alive.length <= 3 && alive.length > 0 && !dramatic) {
        dramatic = { message: `仅剩 ${alive.length} 人存活！`, color: '#ffcc44', tick: state.tick }
        slowMoTicks = Math.max(slowMoTicks, 15)
      }
      // Battle end
      if (ev.type === 'battle_end') {
        dramatic = { message: ev.message, color: '#ffdd44', tick: state.tick }
        slowMoTicks = 40
      }
    }

    // Update kill feed
    const killEvents = newEvents.filter((e) =>
      e.type === 'kill' || e.type === 'weather_change' || e.type === 'battle_end' ||
      e.type === 'duel' || e.type === 'danger_zone'
    )
    const currentFeed = get().killFeed
    const newFeed = [
      ...killEvents.map((e) => ({
        tick: state.tick,
        message: e.message,
        color: e.type === 'kill' ? '#ff4444' :
               e.type === 'duel' ? '#ffaa22' :
               e.type === 'weather_change' ? '#66aaff' :
               e.type === 'danger_zone' ? '#ff6644' : '#ffcc44',
      })),
      ...currentFeed,
    ].slice(0, 5) // keep last 5

    set({
      battleState: { ...state },
      recentEvents: newEvents,
      vfxTick: get().vfxTick + 1,
      killFeed: newFeed,
      dramaticEvent: dramatic ?? (get().dramaticEvent && state.tick - get().dramaticEvent!.tick < 60 ? get().dramaticEvent : null),
      slowMoTicks: slowMoTicks,
    })

    if (state.phase === 'finished' && state.result) {
      set({ activeTab: 'result' })
      // Auto-save to match history
      saveMatchResult(state.result, state.seed, state.units.length)
    }
  },

  runBatch: (count) => {
    const { selectedGeneralIds, allGenerals, battleMode } = get()
    const generals = allGenerals.filter((g) => selectedGeneralIds.includes(g.id))
    if (generals.length < 2) return

    set({ batchRunning: true, batchProgress: 0 })

    const factionWins: Record<string, number> = {}
    const generalAccum: Record<string, {
      name: string; faction: string; wins: number
      totalSurvival: number; totalKills: number
      totalDamageDealt: number; totalDamageTaken: number; totalMvp: number
    }> = {}

    for (const g of generals) {
      generalAccum[g.id] = {
        name: g.name, faction: g.faction, wins: 0,
        totalSurvival: 0, totalKills: 0, totalDamageDealt: 0, totalDamageTaken: 0, totalMvp: 0,
      }
    }

    let completed = 0
    const runNext = () => {
      if (completed >= count) {
        const result: BatchResult = { totalRuns: count, factionWins, generalStats: {} }
        for (const [id, acc] of Object.entries(generalAccum)) {
          result.generalStats[id] = {
            name: acc.name, faction: acc.faction as any, wins: acc.wins,
            avgSurvivalTicks: Math.round(acc.totalSurvival / count),
            avgKills: +(acc.totalKills / count).toFixed(2),
            avgDamageDealt: Math.round(acc.totalDamageDealt / count),
            avgDamageTaken: Math.round(acc.totalDamageTaken / count),
            avgMvpScore: Math.round(acc.totalMvp / count),
          }
        }
        set({ batchResult: result, batchRunning: false, batchProgress: 100 })
        return
      }

      const seed = Date.now() + completed * 7919
      const engine = new BattleEngine(generals, battleMode, seed)
      const battleResult = engine.runToEnd()

      if (battleResult.winner) {
        factionWins[battleResult.winner] = (factionWins[battleResult.winner] ?? 0) + 1
      }

      for (const r of battleResult.rankings) {
        const acc = generalAccum[r.id]
        if (!acc) continue
        acc.totalSurvival += r.survivalTicks
        acc.totalKills += r.kills
        acc.totalDamageDealt += r.damageDealt
        acc.totalDamageTaken += r.damageTaken
        acc.totalMvp += r.mvpScore
        if (battleResult.survivors.some((s) => s.id === r.id)) acc.wins++
      }

      completed++
      set({ batchProgress: Math.round((completed / count) * 100) })
      setTimeout(runNext, 0)
    }

    setTimeout(runNext, 0)
  },
}))
