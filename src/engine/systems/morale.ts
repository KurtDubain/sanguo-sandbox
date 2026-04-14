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

  for (const unit of units) {
    if (unit.state === 'dead') continue

    // === Morale Recovery ===
    const politicsRegen = unit.politics * BALANCE.POLITICS_REGEN
    unit.morale += BALANCE.MORALE_REGEN_RATE + politicsRegen * 0.15

    // === Rally Point: commander nearby boosts morale recovery ===
    const commander = units.find(
      (u) => u.faction === unit.faction && u.state !== 'dead' && u.state !== 'routed' &&
             u.id !== unit.id && u.command >= 80 &&
             distance(u.position, unit.position) < BALANCE.RALLY_RANGE
    )
    if (commander) {
      unit.morale += BALANCE.RALLY_MORALE_REGEN * (commander.command / 100)
    }

    // === Second Wind: low HP units get a fighting spirit boost ===
    const hpPct = unit.hp / unit.maxHp
    if (hpPct > 0 && hpPct < BALANCE.SECOND_WIND_THRESHOLD && unit.state !== 'routed') {
      // Morale stabilization — refuse to collapse while fighting
      unit.morale += 0.15
      // Attack/Defense buff applied via the attack system check
    }

    // === Charisma Aura ===
    for (const ally of units) {
      if (ally.id === unit.id || ally.faction !== unit.faction || ally.state === 'dead') continue
      const dist = distance(unit.position, ally.position)
      if (dist < BALANCE.MORALE_CHARISMA_AURA_RANGE) {
        ally.morale += unit.charisma * BALANCE.CHARISMA_AURA * 0.05
      }
    }

    // === Formation morale ===
    // Being near allies provides comfort
    const nearbyAllies = units.filter(
      (u) =>
        u.id !== unit.id &&
        u.faction === unit.faction &&
        u.state !== 'dead' &&
        u.state !== 'routed' &&
        distance(u.position, unit.position) < BALANCE.FORMATION_RANGE
    )
    if (nearbyAllies.length > 0) {
      unit.morale += 0.05 * Math.min(nearbyAllies.length, 3)
    }

    // === Fatigue morale drain ===
    if (unit.survivalTicks > BALANCE.FATIGUE_TICK_THRESHOLD) {
      const fatigueDrain = 0.03 * (1 - unit.politics * BALANCE.FATIGUE_POLITICS_RESIST)
      unit.morale -= Math.max(0, fatigueDrain)
    }

    // === Discipline-based stability ===
    const disciplineFactor = unit.personality.discipline * 0.008
    const fluctuation = rng.float(-0.5, 0.5) * (1 - disciplineFactor)
    unit.morale += fluctuation

    // === Weather morale drain ===
    unit.morale -= wm.moraleDrain

    // === Outnumbered penalty ===
    const aliveAllies = units.filter(
      (u) => u.faction === unit.faction && u.state !== 'dead' && u.id !== unit.id
    ).length
    const aliveEnemies = units.filter(
      (u) => u.faction !== unit.faction && u.state !== 'dead'
    ).length
    if (aliveEnemies > 0 && aliveAllies === 0) {
      unit.morale -= 0.4 // alone against enemies
    } else if (aliveEnemies > aliveAllies * 2) {
      unit.morale -= 0.15 // heavily outnumbered
    }

    // === Clamp morale ===
    unit.morale = Math.max(0, Math.min(unit.maxMorale, unit.morale))

    // === State transitions ===
    const prevState = unit.state

    if (unit.morale <= BALANCE.MORALE_ROUT_THRESHOLD) {
      if (unit.state !== 'routed') {
        unit.state = 'routed'
        unit.targetId = null
        newlyRouted.push(unit)
        events.push({
          tick,
          type: 'morale_rout',
          sourceId: unit.id,
          message: `${unit.name} 士气崩溃，陷入溃败！`,
        })
      }
    } else if (unit.morale <= BALANCE.MORALE_RETREAT_THRESHOLD) {
      const resistChance = unit.personality.loyalty * 0.005 + unit.charisma * 0.002
      if (unit.state !== 'retreating' && unit.state !== 'routed') {
        if (!rng.chance(resistChance)) {
          unit.state = 'retreating'
          unit.targetId = null
          events.push({
            tick,
            type: 'morale_break',
            sourceId: unit.id,
            message: `${unit.name} 士气低落，开始后撤！`,
          })
        }
      }
    } else if (unit.morale > BALANCE.MORALE_RETREAT_THRESHOLD + 10) {
      if (prevState === 'retreating') {
        unit.state = 'idle'
        events.push({
          tick,
          type: 'morale_recover',
          sourceId: unit.id,
          message: `${unit.name} 士气恢复，重新投入战斗！`,
        })
      }
      if (prevState === 'routed' && unit.morale > BALANCE.MORALE_RETREAT_THRESHOLD + 25) {
        unit.state = 'idle'
        events.push({
          tick,
          type: 'morale_recover',
          sourceId: unit.id,
          message: `${unit.name} 从溃败中恢复！`,
        })
      }
    }
  }

  // === Morale Cascade ===
  // Nearby allies seeing a rout may also break
  for (const routed of newlyRouted) {
    for (const ally of units) {
      if (
        ally.id === routed.id ||
        ally.faction !== routed.faction ||
        ally.state === 'dead' ||
        ally.state === 'routed'
      ) continue

      const dist = distance(ally.position, routed.position)
      if (dist > BALANCE.MORALE_CASCADE_RANGE) continue

      // Cascade chance, resisted by discipline and charisma
      const cascadeResist = ally.personality.discipline * 0.004 + ally.charisma * 0.002
      const cascadeChance = BALANCE.MORALE_CASCADE_CHANCE * (1 - cascadeResist)

      if (rng.chance(Math.max(0, cascadeChance))) {
        ally.morale -= 15
        if (ally.morale <= BALANCE.MORALE_ROUT_THRESHOLD) {
          ally.state = 'routed'
          ally.targetId = null
          events.push({
            tick,
            type: 'morale_rout',
            sourceId: ally.id,
            message: `${ally.name} 受 ${routed.name} 溃败影响，跟着溃逃！`,
          })
        } else if (ally.state !== 'retreating') {
          ally.state = 'retreating'
          ally.targetId = null
          events.push({
            tick,
            type: 'morale_break',
            sourceId: ally.id,
            message: `${ally.name} 受 ${routed.name} 溃败影响，士气动摇！`,
          })
        }
      }
    }
  }

  return events
}
