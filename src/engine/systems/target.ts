import { BattleUnit, BattleMode, BattleMap } from '../../types'
import { BALANCE } from '../../config/balance'
import { distance } from '../utils/math'
import { SeededRandom } from '../utils/random'
import { TacticalOrder } from './tacticalAI'
import { CommanderOrder, applyCommanderOrders } from './commanderAI'
import { hasLineOfSight } from '../utils/pathfinding'
import { isEnemy } from '../utils/alliance'

// Target selection — integrates tactical AI, commander orders, and alliances
export function targetSystem(
  units: BattleUnit[],
  mode: BattleMode,
  rng: SeededRandom,
  tacticalOrders: Map<string, TacticalOrder>,
  commanderOrders: Map<string, CommanderOrder>,
  map?: BattleMap,
  alliances: string[][] = [],
): void {
  for (const unit of units) {
    if (unit.state === 'dead' || unit.state === 'routed') {
      unit.targetId = null
      continue
    }

    // Commander retreat order
    const cmdOrder = commanderOrders.get(unit.id)
    if (cmdOrder?.retreatOrder && unit.state !== 'retreating') {
      // High loyalty/discipline obey retreat orders
      const obeyChance = 0.3 + unit.personality.discipline * 0.005 + unit.personality.loyalty * 0.003
      if (rng.chance(obeyChance)) {
        unit.state = 'retreating'
        unit.targetId = null
        continue
      }
    }

    if (unit.state === 'retreating') {
      unit.targetId = null
      continue
    }

    // 1. Check tactical AI order first
    const tactOrder = tacticalOrders.get(unit.id)
    if (tactOrder?.targetId) {
      const tactTarget = units.find((u) => u.id === tactOrder.targetId && u.state !== 'dead')
      if (tactTarget) {
        unit.targetId = tactOrder.targetId
        // Apply commander override (focus fire)
        unit.targetId = applyCommanderOrders(unit, cmdOrder, unit.targetId, rng) ?? unit.targetId
        continue
      }
    }

    // 2. Check if current target is still valid
    if (unit.targetId) {
      const current = units.find((u) => u.id === unit.targetId)
      if (current && current.state !== 'dead') {
        const dist = distance(unit.position, current.position)
        if (dist < BALANCE.DISENGAGE_RANGE) {
          // Apply commander focus fire override
          unit.targetId = applyCommanderOrders(unit, cmdOrder, unit.targetId, rng) ?? unit.targetId

          // Occasionally re-evaluate
          if (!rng.chance(0.02 + unit.strategy * BALANCE.STRATEGY_TARGET_BONUS * 0.5)) {
            continue
          }
        }
      }
    }

    // 3. Fallback: score-based target selection
    const enemies = units.filter((u) => {
      if (u.id === unit.id || u.state === 'dead') return false
      if (mode === 'free_for_all') return true
      // faction_battle / siege: check alliances
      return isEnemy(unit.faction, u.faction, alliances)
    })

    if (enemies.length === 0) {
      unit.targetId = null
      continue
    }

    const scored = enemies.map((enemy) => {
      const dist = distance(unit.position, enemy.position)
      let score = -dist * 0.8

      if (dist <= unit.vision) score += 200
      if (dist <= unit.range) score += 150

      // LOS check: penalize targets behind obstacles
      if (map && dist <= unit.range * 1.5) {
        const losMode = unit.range <= 60 ? 'melee' as const : 'ranged' as const
        if (!hasLineOfSight(map, unit.position, enemy.position, losMode)) {
          score -= 300 // heavy penalty but not impossible (unit will pathfind around)
        }
      }

      const sf = unit.strategy * BALANCE.STRATEGY_TARGET_BONUS
      score += (1 - enemy.hp / enemy.maxHp) * 80 * sf * 20
      if (enemy.morale < BALANCE.MORALE_RETREAT_THRESHOLD) score += 40 * sf * 20
      if (unit.personality.aggressiveness > 70) score += enemy.atk * 0.3
      if (unit.personality.greed > 60) score += enemy.achievement * 0.3
      if (unit.personality.caution > 70) score -= (enemy.atk * 0.3 + enemy.def * 0.2)

      // Troop-specific preferences
      if (unit.troopType === 'spearman' && enemy.troopType === 'cavalry') score += 100
      if (unit.troopType === 'cavalry' && enemy.troopType === 'archer') score += 80

      if (unit.strategy > 75) {
        const et = units.find((u) => u.id === enemy.targetId)
        if (et && et.id !== unit.id) score += 40 * sf * 10
      }

      score += rng.float(-20, 20) * (1 - unit.personality.discipline * 0.008)
      return { enemy, score }
    })

    scored.sort((a, b) => b.score - a.score)
    if (scored.length > 0) {
      unit.targetId = scored[0].enemy.id
      // Commander override
      unit.targetId = applyCommanderOrders(unit, cmdOrder, unit.targetId, rng) ?? unit.targetId
    }
  }
}
