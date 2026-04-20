import {
  BattleState,
  BattleMode,
  BattleResult,
  General,
  GameEvent,
} from '../types'
import { SeededRandom } from './utils/random'
import { generateMap, MapTemplate } from './utils/mapgen'
import type { GameSettings } from '../store/gameStore'
import { FormationType, FORMATIONS } from '../config/formationDefs'
import { createBattleUnit, generateSpawnPositions } from './utils/unitFactory'
import { createInitialWeather } from './systems/weather'
import { createSupplyPoints, createDangerZone } from './systems/battlefield'
import { createSiegeState } from './systems/siege'
import { resetAttackCooldowns } from './systems/attack'
import { resetPaths } from './systems/movement'
import { resetCombatMechanics } from './systems/combatMechanics'
import { resetTerrainInteraction } from './systems/terrainInteraction'
import { resetCommandStyles } from './systems/commandStyle'
import { executeTick } from './tickOrchestrator'

export class BattleEngine {
  private state: BattleState
  private rng: SeededRandom
  private generals: General[]
  private mapTemplate: MapTemplate
  private settings: GameSettings

  constructor(generals: General[], mode: BattleMode, seed: number, mapTemplate: MapTemplate = 'random', settings?: GameSettings, formation: FormationType = 'none', boostedIds: string[] = [], alliances: string[][] = []) {
    this.generals = generals
    this.mapTemplate = mapTemplate
    this.settings = settings ?? {
      weather: true, dangerZone: true, supplyPoints: true, duels: true,
      formations: true, warCry: true, surrender: true, commanderDeath: true,
      tacticalAI: true, commanderAI: true, autoSlowMo: true, randomModifiers: false,
    }
    this.rng = new SeededRandom(seed)
    this.resetAllSystems()

    const effectiveTemplate = mode === 'siege' ? 'siege_castle' as const : mapTemplate
    const map = generateMap(this.rng, effectiveTemplate)

    // Siege setup
    let siegeState: import('../types').SiegeState | null = null
    let defendingFaction: string | undefined
    if (mode === 'siege') {
      const factions = [...new Set(generals.map((g) => g.faction))]
      const counts = factions.map((f) => ({ f, n: generals.filter((g) => g.faction === f).length }))
      counts.sort((a, b) => a.n - b.n)
      defendingFaction = counts[0]?.f
      const attackingFactions = factions.filter((f) => f !== defendingFaction) as import('../types').Faction[]
      siegeState = createSiegeState(
        defendingFaction as import('../types').Faction,
        attackingFactions, map.width, map.height,
      )
    }

    const positions = generateSpawnPositions(generals, mode, map, this.rng, defendingFaction)
    const units = generals.map((g, i) => createBattleUnit(g, positions[i]))

    // Apply formation buffs
    const formDef = FORMATIONS[formation]
    if (formDef && formDef.id !== 'none') {
      for (const unit of units) {
        const b = formDef.buffs
        if (b.atkMult) unit.atk = Math.round(unit.atk * b.atkMult)
        if (b.defMult) unit.def = Math.round(unit.def * b.defMult)
        if (b.speedMult) unit.speed = Math.round(unit.speed * b.speedMult)
        if (b.rangeMult) unit.range = Math.round(unit.range * b.rangeMult)
        if (b.moraleMult) {
          unit.morale = Math.min(100, Math.round(unit.morale * b.moraleMult))
          unit.maxMorale = Math.min(100, Math.round(unit.maxMorale * b.moraleMult))
        }
      }
    }

    // Apply individual boosts
    if (boostedIds.length > 0) {
      const boostSet = new Set(boostedIds)
      for (const unit of units) {
        if (boostSet.has(unit.id)) {
          unit.maxHp = Math.round(unit.maxHp * 2.5)
          unit.hp = unit.maxHp
          unit.atk = Math.round(unit.atk * 2)
          unit.def = Math.round(unit.def * 1.8)
          unit.speed = Math.round(unit.speed * 1.3)
          unit.morale = 100
          unit.maxMorale = 100
        }
      }
    }

    this.state = {
      tick: 0,
      phase: 'setup',
      mode,
      seed,
      speed: 1,
      units,
      map,
      weather: createInitialWeather(this.rng),
      supplyPoints: createSupplyPoints(map.width, map.height, this.rng),
      dangerZone: createDangerZone(map.width, map.height),
      siege: siegeState,
      alliances,
      events: [
        {
          tick: 0, type: 'battle_start',
          message: `战斗开始！${generals.length} 名将领参战。模式：${mode === 'faction_battle' ? '阵营对抗' : mode === 'siege' ? '攻城' : '混战'}`,
        },
      ],
      result: null,
    }
  }

  getState(): BattleState { return this.state }
  start(): void { this.state.phase = 'running' }
  pause(): void { if (this.state.phase === 'running') this.state.phase = 'paused' }
  resume(): void { if (this.state.phase === 'paused') this.state.phase = 'running' }
  setSpeed(speed: number): void { this.state.speed = speed }

  tick(): GameEvent[] {
    if (this.state.phase !== 'running') return []
    return executeTick(this.state, this.rng, this.settings)
  }

  runToEnd(): BattleResult {
    this.start()
    while (this.state.phase === 'running') this.tick()
    return this.state.result!
  }

  reset(seed?: number): void {
    const newSeed = seed ?? this.state.seed
    const engine = new BattleEngine(
      this.generals, this.state.mode, newSeed, this.mapTemplate,
      this.settings, 'none', [], this.state.alliances,
    )
    Object.assign(this.state, engine.getState())
    this.rng = new SeededRandom(newSeed)
    this.resetAllSystems()
  }

  private resetAllSystems(): void {
    resetAttackCooldowns()
    resetPaths()
    resetCombatMechanics()
    resetTerrainInteraction()
    resetCommandStyles()
  }
}
