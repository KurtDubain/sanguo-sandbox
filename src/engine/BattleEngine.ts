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
import { FACTION_NAMES as fNames } from '../config/factionDisplay'
import { FormationType, FORMATIONS } from '../config/formationDefs'
import { createBattleUnit, generateSpawnPositions } from './utils/unitFactory'
import { movementSystem } from './systems/movement'
import { targetSystem } from './systems/target'
import { attackSystem, resetAttackCooldowns } from './systems/attack'
import { moraleSystem } from './systems/morale'
import { skillSystem } from './systems/skill'
import { victorySystem } from './systems/victory'
import { weatherSystem, createInitialWeather } from './systems/weather'
import { tacticalAI } from './systems/tacticalAI'
import { commanderAI } from './systems/commanderAI'
import { createSupplyPoints, createDangerZone, supplySystem, dangerZoneSystem } from './systems/battlefield'
import { resetPaths } from './systems/movement'
import {
  updateChargeDistance, duelSystem, resetCombatMechanics,
} from './systems/combatMechanics'
import {
  archerVolleyCheck, shieldWallCheck, spearmanBraceCheck,
  warCryCheck, surrenderCheck,
} from './systems/formations'
import { terrainInteractionSystem, resetTerrainInteraction } from './systems/terrainInteraction'
import { createSiegeState, siegeSystem, checkSiegeVictory } from './systems/siege'

export class BattleEngine {
  private state: BattleState
  private rng: SeededRandom
  private generals: General[]

  private mapTemplate: MapTemplate
  private settings: GameSettings

  constructor(generals: General[], mode: BattleMode, seed: number, mapTemplate: MapTemplate = 'random', settings?: GameSettings, formation: FormationType = 'none') {
    this.generals = generals
    this.mapTemplate = mapTemplate
    this.settings = settings ?? {
      weather: true, dangerZone: true, supplyPoints: true, duels: true,
      formations: true, warCry: true, surrender: true, commanderDeath: true,
      tacticalAI: true, commanderAI: true,
    }
    this.rng = new SeededRandom(seed)
    resetAttackCooldowns()
    resetPaths()
    resetCombatMechanics()
    resetTerrainInteraction()

    // Siege mode forces siege_castle map
    const effectiveTemplate = mode === 'siege' ? 'siege_castle' as const : mapTemplate
    const map = generateMap(this.rng, effectiveTemplate)

    // Determine defending faction for siege mode (first faction alphabetically, or faction with fewest generals)
    let siegeState: import('../types').SiegeState | null = null
    let defendingFaction: string | undefined
    if (mode === 'siege') {
      const factions = [...new Set(generals.map((g) => g.faction))]
      // Smallest faction defends
      const counts = factions.map((f) => ({ f, n: generals.filter((g) => g.faction === f).length }))
      counts.sort((a, b) => a.n - b.n)
      defendingFaction = counts[0]?.f
      const attackingFactions = factions.filter((f) => f !== defendingFaction) as import('../types').Faction[]
      siegeState = createSiegeState(
        defendingFaction as import('../types').Faction,
        attackingFactions,
        map.width, map.height,
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
      events: [{
        tick: 0,
        type: 'battle_start',
        message: `战斗开始！${generals.length} 名将领参战。模式：${mode === 'faction_battle' ? '阵营对抗' : '混战'}`,
      }],
      result: null,
    }
  }

  getState(): BattleState {
    return this.state
  }

  start(): void {
    this.state.phase = 'running'
  }

  pause(): void {
    if (this.state.phase === 'running') {
      this.state.phase = 'paused'
    }
  }

  resume(): void {
    if (this.state.phase === 'paused') {
      this.state.phase = 'running'
    }
  }

  setSpeed(speed: number): void {
    this.state.speed = speed
  }

  tick(): GameEvent[] {
    if (this.state.phase !== 'running') return []

    this.state.tick++
    const newEvents: GameEvent[] = []

    for (const unit of this.state.units) {
      if (unit.state !== 'dead') {
        unit.survivalTicks = this.state.tick
      }
    }

    // 0. Weather
    if (this.settings.weather) {
      const { weather: newWeather, events: weatherEvents } = weatherSystem(
        this.state.weather, this.state.tick, this.rng
      )
      this.state.weather = newWeather
      newEvents.push(...weatherEvents)
    }

    // 1. Charge tracking
    updateChargeDistance(this.state.units)

    // 2. Skill
    const skillEvents = skillSystem(this.state.units, this.state.tick, this.rng, this.state.map)
    newEvents.push(...skillEvents)

    // 3. Duels
    if (this.settings.duels) {
      const duelEvents = duelSystem(this.state.units, this.state.tick, this.rng)
      newEvents.push(...duelEvents)
    }

    // 4. Commander AI
    const emptyOrders = new Map() as Map<string, any>
    let cmdOrders = emptyOrders
    if (this.settings.commanderAI) {
      const { orders, events: cmdEvents } = commanderAI(
        this.state.units, this.state.mode, this.state.tick, this.rng
      )
      cmdOrders = orders
      newEvents.push(...cmdEvents)
    }

    // 5. Tactical AI
    let tactOrders = emptyOrders
    if (this.settings.tacticalAI) {
      tactOrders = tacticalAI(this.state.units, this.state.mode, this.rng)
    }

    // 6. Target selection
    targetSystem(this.state.units, this.state.mode, this.rng, tactOrders, cmdOrders, this.state.map)

    // 7. Movement
    movementSystem(this.state.units, this.state.map, this.rng, this.state.weather, tactOrders, this.state.mode)

    // 8. Attack
    const attackEvents = attackSystem(this.state.units, this.state.tick, this.rng, this.state.weather, this.state.map)
    newEvents.push(...attackEvents)

    // 9. Morale
    const moraleEvents = moraleSystem(this.state.units, this.state.tick, this.rng, this.state.weather)
    newEvents.push(...moraleEvents)

    // 10. Formation mechanics
    if (this.settings.formations) {
      newEvents.push(...archerVolleyCheck(this.state.units, this.state.tick))
      newEvents.push(...shieldWallCheck(this.state.units, this.state.tick))
      spearmanBraceCheck(this.state.units, this.state.tick)
    }
    if (this.settings.warCry) {
      newEvents.push(...warCryCheck(this.state.units, this.state.tick, this.rng))
    }
    if (this.settings.surrender) {
      newEvents.push(...surrenderCheck(this.state.units, this.state.tick, this.rng))
    }

    // 11. Terrain interaction (fire spread, flooding, mountain advantage)
    const terrainEvents = terrainInteractionSystem(
      this.state.units, this.state.map, this.state.weather, this.state.tick, this.rng
    )
    newEvents.push(...terrainEvents)

    // 12. Supply lines: units far from spawn lose effectiveness
    if (this.state.tick % 30 === 0) {
      for (const unit of this.state.units) {
        if (unit.state === 'dead') continue
        // Find spawn position (approximate: faction quadrant center)
        const spawnX = unit.faction === 'wei' || unit.faction === 'wu'
          ? this.state.map.width * 0.15 : this.state.map.width * 0.85
        const spawnY = unit.faction === 'wei' || unit.faction === 'shu'
          ? this.state.map.height * 0.15 : this.state.map.height * 0.85
        const distFromSpawn = Math.sqrt(
          (unit.position.x - spawnX) ** 2 + (unit.position.y - spawnY) ** 2
        )
        const maxDist = Math.sqrt(this.state.map.width ** 2 + this.state.map.height ** 2)
        const supplyPenalty = Math.max(0, (distFromSpawn / maxDist - 0.4) * 0.3)
        if (supplyPenalty > 0) {
          // Slight morale drain and regen reduction
          unit.morale -= supplyPenalty * 0.5
          // Politics resists supply line issues
          const resist = unit.politics * 0.005
          unit.morale += resist * 0.2
        }
      }
    }

    // 13. Supply points
    if (this.settings.supplyPoints) {
      const supplyEvents = supplySystem(this.state.units, this.state.supplyPoints, this.state.tick)
      newEvents.push(...supplyEvents)
    }

    // 12. Danger zone
    if (this.settings.dangerZone) {
      const dzEvents = dangerZoneSystem(this.state.units, this.state.dangerZone, this.state.tick)
      newEvents.push(...dzEvents)
    }

    // 13. Siege system (towers + capture)
    if (this.state.siege) {
      const siegeEvents = siegeSystem(this.state.units, this.state.siege, this.state.tick, this.rng)
      newEvents.push(...siegeEvents)

      // Siege victory check (overrides normal victory)
      const sv = checkSiegeVictory(this.state.units, this.state.siege, this.state.tick)
      if (sv.winner) {
        const winFaction = sv.winner === 'defender'
          ? this.state.siege.defendingFaction
          : this.state.siege.attackingFactions[0] ?? 'unknown'
        newEvents.push({ tick: this.state.tick, type: 'battle_end', message: sv.message })
        this.state.result = {
          winner: winFaction,
          winnerName: `${fNames[winFaction] ?? winFaction} (${sv.winner === 'defender' ? '守方' : '攻方'})`,
          mode: 'siege',
          totalTicks: this.state.tick,
          survivors: this.state.units.filter((u) => u.state !== 'dead').map((u) => ({
            id: u.id, name: u.name, faction: u.faction,
            hpPercent: Math.round(u.hp / u.maxHp * 100),
            kills: u.kills, damageDealt: u.damageDealt, damageTaken: u.damageTaken,
          })),
          rankings: this.state.units.map((u) => ({
            id: u.id, name: u.name, faction: u.faction,
            kills: u.kills, damageDealt: u.damageDealt, damageTaken: u.damageTaken,
            survivalTicks: u.state === 'dead' ? u.survivalTicks : this.state.tick,
            mvpScore: u.kills * 100 + u.damageDealt * 0.5 + (u.state !== 'dead' ? 150 : 0),
          })).sort((a, b) => b.mvpScore - a.mvpScore),
        }
        this.state.phase = 'finished'
      }
    }

    // 14. Normal victory (skip if siege handled it)
    if (!this.state.result) {
      const { result, events: victoryEvents } = victorySystem(
        this.state.units, this.state.mode, this.state.tick,
      )
      newEvents.push(...victoryEvents)
      if (result) {
        this.state.result = result
        this.state.phase = 'finished'
      }
    }

    this.state.events.push(...newEvents)
    if (this.state.events.length > 600) {
      // Trim less frequently, larger chunks (avoids creating new array every tick)
      this.state.events = this.state.events.slice(-400)
    }

    return newEvents
  }

  runToEnd(): BattleResult {
    this.start()
    while (this.state.phase === 'running') {
      this.tick()
    }
    return this.state.result!
  }

  reset(seed?: number): void {
    const newSeed = seed ?? this.state.seed
    const engine = new BattleEngine(this.generals, this.state.mode, newSeed, this.mapTemplate, this.settings)
    Object.assign(this.state, engine.getState())
    this.rng = new SeededRandom(newSeed)
    resetAttackCooldowns()
  }
}
