// Tick orchestrator: executes one simulation step across all systems

import { BattleState, GameEvent } from '../types'
import { SeededRandom } from './utils/random'
import type { GameSettings } from '../store/gameStore'

import { weatherSystem } from './systems/weather'
import { updateChargeDistance, duelSystem, tickChargeMoraleShields } from './systems/combatMechanics'
import { skillSystem } from './systems/skill'
import { commandStyleSystem } from './systems/commandStyle'
import { advancedAISystem } from './systems/advancedAI'
import { commanderAI } from './systems/commanderAI'
import { tacticalAI } from './systems/tacticalAI'
import { targetSystem } from './systems/target'
import { movementSystem } from './systems/movement'
import { attackSystem } from './systems/attack'
import { moraleSystem } from './systems/morale'
import { archerVolleyCheck, shieldWallCheck, spearmanBraceCheck, warCryCheck, surrenderCheck } from './systems/formations'
import { terrainInteractionSystem } from './systems/terrainInteraction'
import { supplySystem, dangerZoneSystem } from './systems/battlefield'
import { siegeSystem, checkSiegeVictory } from './systems/siege'
import { victorySystem } from './systems/victory'
import { FACTION_NAMES } from '../config/factionDisplay'

export function executeTick(
  state: BattleState,
  rng: SeededRandom,
  settings: GameSettings,
): GameEvent[] {
  state.tick++
  const newEvents: GameEvent[] = []
  const alliances = state.alliances

  // Update survival ticks
  for (const unit of state.units) {
    if (unit.state !== 'dead') unit.survivalTicks = state.tick
  }

  // === Phase 1: Environment ===
  if (settings.weather) {
    const { weather: newWeather, events: weatherEvents } = weatherSystem(state.weather, state.tick, rng)
    state.weather = newWeather
    newEvents.push(...weatherEvents)
  }

  // === Phase 2: Pre-combat (charge, skills, duels) ===
  updateChargeDistance(state.units)
  tickChargeMoraleShields()

  const skillEvents = skillSystem(state.units, state.tick, rng, state.map)
  newEvents.push(...skillEvents)

  if (settings.duels) {
    newEvents.push(...duelSystem(state.units, state.tick, rng))
  }

  // === Phase 3: AI decisions ===
  const styleEvents = commandStyleSystem(state.units, state.mode, state.tick, rng)
  newEvents.push(...styleEvents)

  const advEvents = advancedAISystem(state.units, state.mode, state.map, state.tick, rng)
  newEvents.push(...advEvents)

  const emptyOrders = new Map() as Map<string, any>
  let cmdOrders = emptyOrders
  if (settings.commanderAI) {
    const { orders, events: cmdEvents } = commanderAI(state.units, state.mode, state.tick, rng, state.siege)
    cmdOrders = orders
    newEvents.push(...cmdEvents)
  }

  let tactOrders = emptyOrders
  if (settings.tacticalAI) {
    tactOrders = tacticalAI(state.units, state.mode, rng, alliances)
  }

  // === Phase 4: Target + Movement + Attack ===
  targetSystem(state.units, state.mode, rng, tactOrders, cmdOrders, state.map, alliances)
  movementSystem(state.units, state.map, rng, state.weather, tactOrders, state.mode, alliances)
  const attackEvents = attackSystem(state.units, state.tick, rng, state.weather, state.map, alliances)
  newEvents.push(...attackEvents)

  // === Phase 5: Morale + Formations ===
  const moraleEvents = moraleSystem(state.units, state.tick, rng, state.weather, alliances)
  newEvents.push(...moraleEvents)

  if (settings.formations) {
    newEvents.push(...archerVolleyCheck(state.units, state.tick))
    newEvents.push(...shieldWallCheck(state.units, state.tick))
    spearmanBraceCheck(state.units, state.tick, alliances)
  }
  if (settings.warCry) {
    newEvents.push(...warCryCheck(state.units, state.tick, rng, alliances))
  }
  if (settings.surrender) {
    newEvents.push(...surrenderCheck(state.units, state.tick, rng, alliances))
  }

  // === Phase 6: Terrain + Supply ===
  const terrainEvents = terrainInteractionSystem(state.units, state.map, state.weather, state.tick, rng)
  newEvents.push(...terrainEvents)

  // Supply line penalty
  if (state.tick % 30 === 0) {
    for (const unit of state.units) {
      if (unit.state === 'dead') continue
      const spawnX = unit.faction === 'wei' || unit.faction === 'wu'
        ? state.map.width * 0.15 : state.map.width * 0.85
      const spawnY = unit.faction === 'wei' || unit.faction === 'shu'
        ? state.map.height * 0.15 : state.map.height * 0.85
      const distFromSpawn = Math.sqrt((unit.position.x - spawnX) ** 2 + (unit.position.y - spawnY) ** 2)
      const maxDist = Math.sqrt(state.map.width ** 2 + state.map.height ** 2)
      const supplyPenalty = Math.max(0, (distFromSpawn / maxDist - 0.4) * 0.3)
      if (supplyPenalty > 0) {
        unit.morale -= supplyPenalty * 0.5
        unit.morale += unit.politics * 0.005 * 0.2
      }
    }
  }

  if (settings.supplyPoints) {
    newEvents.push(...supplySystem(state.units, state.supplyPoints, state.tick))
  }
  if (settings.dangerZone) {
    newEvents.push(...dangerZoneSystem(state.units, state.dangerZone, state.tick))
  }

  // === Phase 7: Siege ===
  if (state.siege) {
    newEvents.push(...siegeSystem(state.units, state.siege, state.tick, rng))
    const sv = checkSiegeVictory(state.units, state.siege, state.tick)
    if (sv.winner) {
      const winFaction = sv.winner === 'defender'
        ? state.siege.defendingFaction
        : state.siege.attackingFactions[0] ?? 'unknown'
      newEvents.push({ tick: state.tick, type: 'battle_end', message: sv.message })
      state.result = {
        winner: winFaction,
        winnerName: `${FACTION_NAMES[winFaction] ?? winFaction} (${sv.winner === 'defender' ? '守方' : '攻方'})`,
        mode: 'siege',
        totalTicks: state.tick,
        survivors: state.units.filter((u) => u.state !== 'dead').map((u) => ({
          id: u.id, name: u.name, faction: u.faction,
          hpPercent: Math.round(u.hp / u.maxHp * 100),
          kills: u.kills, damageDealt: u.damageDealt, damageTaken: u.damageTaken,
        })),
        rankings: state.units.map((u) => ({
          id: u.id, name: u.name, faction: u.faction,
          kills: u.kills, damageDealt: u.damageDealt, damageTaken: u.damageTaken,
          survivalTicks: u.state === 'dead' ? u.survivalTicks : state.tick,
          mvpScore: u.kills * 100 + u.damageDealt * 0.5 + (u.state !== 'dead' ? 150 : 0),
        })).sort((a, b) => b.mvpScore - a.mvpScore),
      }
      state.phase = 'finished'
    }
  }

  // === Phase 8: Victory ===
  if (!state.result) {
    const { result, events: victoryEvents } = victorySystem(state.units, state.mode, state.tick, alliances)
    newEvents.push(...victoryEvents)
    if (result) {
      state.result = result
      state.phase = 'finished'
    }
  }

  // Event buffer management
  state.events.push(...newEvents)
  if (state.events.length > 600) {
    state.events = state.events.slice(-400)
  }

  return newEvents
}
