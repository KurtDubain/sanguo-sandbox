// Commander AI: faction-level strategic coordination
// The general with the highest command stat in each faction acts as commander.
// Every N ticks, the commander issues orders: focus target, retreat, regroup.

import { BattleUnit, BattleMode, GameEvent } from '../../types'
import { distance } from '../utils/math'
import { SeededRandom } from '../utils/random'

export interface CommanderOrder {
  focusTargetId: string | null   // whole faction attacks this target
  retreatOrder: boolean           // faction pulls back to regroup
  protectId: string | null        // protect this high-value unit
}

const COMMANDER_TICK_INTERVAL = 30 // re-evaluate every 30 ticks

export function commanderAI(
  units: BattleUnit[],
  mode: BattleMode,
  tick: number,
  rng: SeededRandom,
): { orders: Map<string, CommanderOrder>; events: GameEvent[] } {
  const orders = new Map<string, CommanderOrder>()
  const events: GameEvent[] = []

  if (tick % COMMANDER_TICK_INTERVAL !== 0) return { orders, events }
  if (mode === 'free_for_all') return { orders, events } // no commander in FFA

  // Group by faction
  const factions = new Map<string, BattleUnit[]>()
  for (const u of units) {
    if (u.state === 'dead') continue
    const list = factions.get(u.faction) ?? []
    list.push(u)
    factions.set(u.faction, list)
  }

  for (const [faction, members] of factions) {
    if (members.length === 0) continue

    // Find commander (highest command stat)
    const commander = members.reduce((a, b) => (a.command > b.command ? a : b))

    // Get all enemies
    const enemies = units.filter(
      (u) => u.faction !== faction && u.state !== 'dead'
    )
    if (enemies.length === 0) continue

    // === Commander Strategy ===
    const strategyLevel = commander.strategy + commander.command * 0.5

    // 1. Focus fire: pick the best target for the whole faction
    let focusTarget: BattleUnit | null = null

    // High strategy commanders pick wounded or high-value targets
    if (strategyLevel > 120) {
      // Smart: find enemy with lowest HP% that multiple allies can reach
      const scored = enemies.map((e) => {
        const hpPct = e.hp / e.maxHp
        const nearbyAllies = members.filter(
          (m) => distance(m.position, e.position) < 250
        ).length
        // Score = how killable × how many can reach
        return {
          unit: e,
          score: (1 - hpPct) * 50 + nearbyAllies * 30 + (e.troopType === 'archer' ? 20 : 0),
        }
      })
      scored.sort((a, b) => b.score - a.score)
      focusTarget = scored[0]?.unit ?? null
    } else if (strategyLevel > 80) {
      // Medium: focus the nearest enemy to the group center
      const cx = members.reduce((s, m) => s + m.position.x, 0) / members.length
      const cy = members.reduce((s, m) => s + m.position.y, 0) / members.length
      focusTarget = enemies.reduce((a, b) => {
        const da = distance({ x: cx, y: cy }, a.position)
        const db = distance({ x: cx, y: cy }, b.position)
        return da < db ? a : b
      })
    }
    // Low strategy: no focus fire, everyone picks their own target

    // 2. Check if faction should retreat to regroup
    const avgMorale = members.reduce((s, m) => s + m.morale, 0) / members.length
    const aliveRatio = members.length / units.filter((u) => u.faction === faction).length
    const shouldRetreat = avgMorale < 35 && aliveRatio < 0.4 && commander.personality.caution > 60

    // 3. Identify key unit to protect (highest achievement/charisma)
    const keyUnit = members.reduce((a, b) =>
      a.achievement + a.charisma > b.achievement + b.charisma ? a : b
    )
    const protectId = keyUnit.hp / keyUnit.maxHp < 0.4 ? keyUnit.id : null

    const order: CommanderOrder = {
      focusTargetId: focusTarget?.id ?? null,
      retreatOrder: shouldRetreat,
      protectId,
    }

    // Apply order to all faction members
    for (const member of members) {
      orders.set(member.id, order)
    }

    // Log significant commander decisions
    if (focusTarget && rng.chance(0.15)) {
      events.push({
        tick,
        type: 'skill_trigger',
        sourceId: commander.id,
        targetId: focusTarget.id,
        message: `${commander.name} 下令全军集火 ${focusTarget.name}！`,
      })
    }
    if (shouldRetreat) {
      events.push({
        tick,
        type: 'retreat',
        sourceId: commander.id,
        message: `${commander.name} 下令阵营暂时后撤重整！`,
      })
    }
  }

  return { orders, events }
}

// Apply commander orders to the target system
export function applyCommanderOrders(
  unit: BattleUnit,
  order: CommanderOrder | undefined,
  currentTargetId: string | null,
  rng: SeededRandom,
): string | null {
  if (!order) return currentTargetId

  // Retreat order overrides everything
  if (order.retreatOrder) return null

  // Focus fire: high discipline units obey, low discipline might ignore
  if (order.focusTargetId) {
    const obeyChance = 0.4 + unit.personality.discipline * 0.006
    if (rng.chance(obeyChance)) {
      return order.focusTargetId
    }
  }

  return currentTargetId
}
