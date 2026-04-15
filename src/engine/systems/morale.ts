import { BattleUnit, GameEvent, WeatherState } from '../../types'
import { BALANCE } from '../../config/balance'
import { distance } from '../utils/math'
import { SeededRandom } from '../utils/random'
import { getWeatherModifiers } from './weather'

export function moraleSystem(
  units: BattleUnit[],
  tick: number,
  rng: SeededRandom,
  weather: WeatherState,
): GameEvent[] {
  const events: GameEvent[] = []
  const newlyRouted: BattleUnit[] = []
  const wm = getWeatherModifiers(weather)

  // Pre-compute faction alive counts
  const factionAlive = new Map<string, number>()
  for (const u of units) {
    if (u.state === 'dead') continue
    factionAlive.set(u.faction, (factionAlive.get(u.faction) ?? 0) + 1)
  }
  const totalAlive = units.filter((u) => u.state !== 'dead').length

  for (const unit of units) {
    if (unit.state === 'dead') continue

    const moraleBefore = unit.morale

    // ========= RECOVERY =========

    // Base regen (always active)
    const politicsRegen = unit.politics * BALANCE.POLITICS_REGEN
    unit.morale += BALANCE.MORALE_REGEN_RATE + politicsRegen * 0.2

    // Commander rally: high-command ally nearby = major morale boost
    const commander = units.find(
      (u) => u.faction === unit.faction && u.state !== 'dead' && u.state !== 'routed' &&
             u.id !== unit.id && u.command >= 80 &&
             distance(u.position, unit.position) < BALANCE.RALLY_RANGE
    )
    if (commander) {
      unit.morale += BALANCE.RALLY_MORALE_REGEN * (commander.command / 100)
    }

    // Second wind: low HP but still fighting
    if (unit.hp > 0 && unit.hp / unit.maxHp < BALANCE.SECOND_WIND_THRESHOLD && unit.state !== 'routed') {
      unit.morale += 0.2
    }

    // Charisma aura (throttled: every 4 ticks, only high charisma)
    if (unit.charisma >= 55 && tick % 4 === 0) {
      for (const ally of units) {
        if (ally.id === unit.id || ally.faction !== unit.faction || ally.state === 'dead') continue
        if (distance(unit.position, ally.position) < BALANCE.MORALE_CHARISMA_AURA_RANGE) {
          ally.morale += unit.charisma * BALANCE.CHARISMA_AURA * 0.2
        }
      }
    }

    // Formation comfort: nearby non-routed allies
    const nearbyAllies = units.filter(
      (u) => u.id !== unit.id && u.faction === unit.faction &&
             u.state !== 'dead' && u.state !== 'routed' &&
             distance(u.position, unit.position) < BALANCE.FORMATION_RANGE
    )
    if (nearbyAllies.length > 0) {
      unit.morale += 0.08 * Math.min(nearbyAllies.length, 4)
    }

    // Steady bonus: if not attacked recently (no damage in last 30 ticks), recover faster
    if (unit.state === 'idle' || unit.state === 'moving') {
      unit.morale += 0.15 // bonus for not being in active combat
    }

    // ========= DRAINS =========

    // Fatigue drain
    if (unit.survivalTicks > BALANCE.FATIGUE_TICK_THRESHOLD) {
      const fatigueDrain = 0.02 * (1 - unit.politics * BALANCE.FATIGUE_POLITICS_RESIST)
      unit.morale -= Math.max(0, fatigueDrain)
    }

    // Discipline-based stability: high discipline = less random swing
    const disciplineFactor = unit.personality.discipline * 0.008
    const fluctuation = rng.float(-0.4, 0.4) * (1 - disciplineFactor)
    unit.morale += fluctuation

    // Weather drain
    unit.morale -= wm.moraleDrain

    // Outnumbered penalty (using pre-computed counts)
    const aliveAllies = (factionAlive.get(unit.faction) ?? 0) - 1
    const aliveEnemies = totalAlive - (factionAlive.get(unit.faction) ?? 0)
    if (aliveEnemies > 0 && aliveAllies === 0) {
      unit.morale -= 0.25  // reduced from 0.4
    } else if (aliveEnemies > aliveAllies * 2) {
      unit.morale -= 0.1   // reduced from 0.15
    }

    // ========= CLAMP with anti-snowball =========
    unit.morale = Math.max(0, Math.min(unit.maxMorale, unit.morale))
    if (moraleBefore - unit.morale > 20) {
      unit.morale = moraleBefore - 20
    }

    // ========= STATE TRANSITIONS =========
    const prevState = unit.state

    if (unit.morale <= BALANCE.MORALE_ROUT_THRESHOLD) {
      if (unit.state !== 'routed') {
        unit.state = 'routed'
        unit.targetId = null
        newlyRouted.push(unit)
        events.push({
          tick, type: 'morale_rout', sourceId: unit.id,
          message: `${unit.name} 士气崩溃，陷入溃败！`,
        })
      }
    } else if (unit.morale <= BALANCE.MORALE_RETREAT_THRESHOLD) {
      // Loyalty + charisma resist retreating
      const resistChance = unit.personality.loyalty * 0.005 + unit.charisma * 0.002
      if (unit.state !== 'retreating' && unit.state !== 'routed') {
        if (!rng.chance(resistChance)) {
          unit.state = 'retreating'
          unit.targetId = null
          events.push({
            tick, type: 'morale_break', sourceId: unit.id,
            message: `${unit.name} 士气低落，开始后撤！`,
          })
        }
      }
    } else if (unit.morale > BALANCE.MORALE_RETREAT_THRESHOLD + 10) {
      // Recover from retreat
      if (prevState === 'retreating') {
        unit.state = 'idle'
        events.push({
          tick, type: 'morale_recover', sourceId: unit.id,
          message: `${unit.name} 士气恢复，重新投入战斗！`,
        })
      }
      // Recover from rout (needs higher morale)
      if (prevState === 'routed' && unit.morale > BALANCE.MORALE_ROUT_RECOVERY) {
        unit.state = 'idle'
        events.push({
          tick, type: 'morale_recover', sourceId: unit.id,
          message: `${unit.name} 从溃败中恢复！`,
        })
      }
    }
  }

  // ========= MORALE CASCADE =========
  for (const routed of newlyRouted) {
    for (const ally of units) {
      if (
        ally.id === routed.id || ally.faction !== routed.faction ||
        ally.state === 'dead' || ally.state === 'routed'
      ) continue

      const dist = distance(ally.position, routed.position)
      if (dist > BALANCE.MORALE_CASCADE_RANGE) continue

      // Discipline + charisma resist cascade
      const cascadeResist = ally.personality.discipline * 0.005 + ally.charisma * 0.002
      const cascadeChance = BALANCE.MORALE_CASCADE_CHANCE * (1 - cascadeResist)

      if (rng.chance(Math.max(0, cascadeChance))) {
        ally.morale -= 8
        if (ally.morale <= BALANCE.MORALE_ROUT_THRESHOLD) {
          ally.state = 'routed'
          ally.targetId = null
          events.push({
            tick, type: 'morale_rout', sourceId: ally.id,
            message: `${ally.name} 受 ${routed.name} 溃败影响，跟着溃逃！`,
          })
        } else if (ally.state !== 'retreating') {
          ally.state = 'retreating'
          ally.targetId = null
          events.push({
            tick, type: 'morale_break', sourceId: ally.id,
            message: `${ally.name} 受 ${routed.name} 溃败影响，士气动摇！`,
          })
        }
      }
    }
  }

  return events
}
