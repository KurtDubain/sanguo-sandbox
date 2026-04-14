// Formation combat bonuses: group-based mechanics that reward positioning

import { BattleUnit, GameEvent } from '../../types'
import { distance } from '../utils/math'
import { SeededRandom } from '../utils/random'
import { FACTION_NAMES } from '../../config/factionDisplay'

const FORMATION_CHECK_INTERVAL = 12 // check every 12 ticks

// =================== Archer Volley ===================
// When 3+ archers of the same faction are within 80px and attacking,
// they get a damage bonus (coordinated fire).

export function archerVolleyCheck(units: BattleUnit[], tick: number): GameEvent[] {
  if (tick % FORMATION_CHECK_INTERVAL !== 0) return []
  const events: GameEvent[] = []

  const factions = new Set(units.map((u) => u.faction))
  for (const faction of factions) {
    const archers = units.filter(
      (u) => u.faction === faction && u.troopType === 'archer' &&
             u.state === 'attacking'
    )
    if (archers.length < 3) continue

    // Find clusters
    const processed = new Set<string>()
    for (const archer of archers) {
      if (processed.has(archer.id)) continue
      const cluster = archers.filter(
        (a) => !processed.has(a.id) && distance(archer.position, a.position) < 80
      )
      if (cluster.length >= 3) {
        // Grant volley buff
        for (const a of cluster) {
          processed.add(a.id)
          // Add temporary attack buff
          if (!a.buffs.some((b) => b.sourceId === 'volley')) {
            a.buffs.push({
              type: 'buff_atk',
              value: 20 + cluster.length * 5, // +20-45% based on cluster size
              remainingTicks: FORMATION_CHECK_INTERVAL + 2,
              sourceId: 'volley',
            })
          }
        }
        events.push({
          tick, type: 'skill_trigger',
          sourceId: cluster[0].id,
          message: `${FACTION_NAMES[faction] ?? faction}军 ${cluster.length} 名弓兵齐射！`,
        })
      }
    }
  }

  return events
}

// =================== Shield Wall ===================
// When 2+ shield units are adjacent and facing the same direction,
// they get a big defense bonus.

export function shieldWallCheck(units: BattleUnit[], tick: number): GameEvent[] {
  if (tick % FORMATION_CHECK_INTERVAL !== 0) return []
  const events: GameEvent[] = []

  const shields = units.filter(
    (u) => u.troopType === 'shield' && u.state !== 'dead' && u.state !== 'routed'
  )

  const processed = new Set<string>()
  for (const shield of shields) {
    if (processed.has(shield.id)) continue
    const nearby = shields.filter(
      (s) => s.id !== shield.id && !processed.has(s.id) &&
             s.faction === shield.faction &&
             distance(shield.position, s.position) < 50
    )
    if (nearby.length >= 1) {
      const wall = [shield, ...nearby]
      for (const s of wall) {
        processed.add(s.id)
        if (!s.buffs.some((b) => b.sourceId === 'shield_wall_formation')) {
          s.buffs.push({
            type: 'buff_def',
            value: 30 + wall.length * 10,
            remainingTicks: FORMATION_CHECK_INTERVAL + 2,
            sourceId: 'shield_wall_formation',
          })
          s.buffs.push({
            type: 'buff_morale',
            value: 5,
            remainingTicks: FORMATION_CHECK_INTERVAL + 2,
            sourceId: 'shield_wall_formation',
          })
        }
      }
      if (wall.length >= 3) {
        events.push({
          tick, type: 'skill_trigger',
          sourceId: wall[0].id,
          message: `${wall.length} 名盾兵组成盾墙！`,
        })
      }
    }
  }

  return events
}

// =================== Spearman Brace ===================
// Spearmen that are idle/holding position get a bonus against charging cavalry.
// Applied as a defense buff when not moving.

export function spearmanBraceCheck(units: BattleUnit[], tick: number): GameEvent[] {
  if (tick % FORMATION_CHECK_INTERVAL !== 0) return []

  const spearmen = units.filter(
    (u) => u.troopType === 'spearman' && u.state !== 'dead' &&
           (u.state === 'attacking' || u.state === 'idle')
  )

  for (const sp of spearmen) {
    // Check if any enemy cavalry is approaching
    const approachingCav = units.some(
      (u) => u.troopType === 'cavalry' && u.faction !== sp.faction &&
             u.state === 'moving' && u.targetId === sp.id &&
             distance(u.position, sp.position) < 120
    )
    if (approachingCav) {
      if (!sp.buffs.some((b) => b.sourceId === 'brace')) {
        sp.buffs.push({
          type: 'buff_def',
          value: 40,
          remainingTicks: FORMATION_CHECK_INTERVAL + 5,
          sourceId: 'brace',
        })
        sp.buffs.push({
          type: 'buff_atk',
          value: 25, // counter-charge damage
          remainingTicks: FORMATION_CHECK_INTERVAL + 5,
          sourceId: 'brace',
        })
      }
    }
  }

  return []
}

// =================== War Cry ===================
// High charisma generals (80+) periodically boost nearby allies' morale and attack.

export function warCryCheck(
  units: BattleUnit[],
  tick: number,
  rng: SeededRandom,
): GameEvent[] {
  if (tick % 45 !== 0) return [] // every 45 ticks (was 60)
  const events: GameEvent[] = []

  for (const unit of units) {
    if (unit.state === 'dead' || unit.charisma < 80) continue
    if (!rng.chance(0.45)) continue // 45% chance per check (was 30%)

    const allies = units.filter(
      (u) => u.id !== unit.id && u.faction === unit.faction &&
             u.state !== 'dead' && distance(u.position, unit.position) < 120
    )

    if (allies.length < 2) continue

    for (const ally of allies) {
      ally.morale = Math.min(ally.maxMorale, ally.morale + 15) // was 8
      ally.buffs.push({
        type: 'buff_atk',
        value: 12,
        remainingTicks: 40,
        sourceId: 'war_cry',
      })
    }

    events.push({
      tick, type: 'skill_trigger',
      sourceId: unit.id,
      message: `${unit.name} 鼓舞士气，${allies.length} 名友军战意高涨！`,
    })
  }

  return events
}

// =================== Surrender ===================
// A unit that is completely alone (no allies within 200px), low HP, low morale,
// and surrounded by enemies will surrender (removed from battle).

export function surrenderCheck(
  units: BattleUnit[],
  tick: number,
  rng: SeededRandom,
): GameEvent[] {
  if (tick % 30 !== 0) return []
  const events: GameEvent[] = []

  for (const unit of units) {
    if (unit.state === 'dead' || unit.state === 'routed') continue

    const hpPct = unit.hp / unit.maxHp
    if (hpPct > 0.15 || unit.morale > 15) continue // HP 15% + morale 15 (was 30%/20)

    // Check if alone
    const nearbyAllies = units.filter(
      (u) => u.id !== unit.id && u.faction === unit.faction &&
             u.state !== 'dead' && distance(u.position, unit.position) < 300  // wider check (was 200)
    ).length

    const nearbyEnemies = units.filter(
      (u) => u.faction !== unit.faction && u.state !== 'dead' &&
             distance(u.position, unit.position) < 150
    ).length

    if (nearbyAllies === 0 && nearbyEnemies >= 2) {
      // Loyalty resists surrender
      const surrenderChance = 0.15 * (1 - unit.personality.loyalty * 0.008)
      if (rng.chance(Math.max(0.02, surrenderChance))) {
        unit.state = 'dead'
        unit.hp = 0
        events.push({
          tick, type: 'morale_rout',
          sourceId: unit.id,
          message: `${unit.name} 孤立无援，缴械投降！`,
        })
      }
    }
  }

  return events
}
