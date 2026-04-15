// Advanced AI: faction doctrines, situation awareness, coordination, terrain tactics
// This is a higher-level AI layer that runs every 40 ticks and overrides lower-level decisions

import { BattleUnit, BattleMode, BattleMap, GameEvent } from '../../types'
import { getTerrainAt } from '../utils/mapgen'
import { SeededRandom } from '../utils/random'
import { FACTION_NAMES } from '../../config/factionDisplay'

// =================== Faction Doctrines ===================
// Each faction has a preferred fighting style that influences AI decisions

export type Doctrine = 'aggressive' | 'defensive' | 'guerrilla' | 'balanced' | 'cavalry_charge' | 'fire_support'

const FACTION_DOCTRINES: Record<string, Doctrine> = {
  wei: 'balanced',        // 魏: 稳扎稳打，综合战术
  shu: 'cavalry_charge',  // 蜀: 五虎将冲锋，骑兵突击
  wu: 'fire_support',     // 吴: 火攻+水战，利用地形
  qun: 'aggressive',      // 群雄: 各自为战，全力进攻
  dong: 'aggressive',     // 董卓: 暴力碾压
  yuan: 'defensive',      // 袁绍: 兵多粮广，消耗战
  xiliang: 'cavalry_charge', // 西凉: 铁骑冲锋
  jingzhou: 'defensive',  // 荆州: 守城防御
  yizhou: 'guerrilla',    // 益州: 地形游击
  jin: 'balanced',        // 晋: 综合实力
}

// =================== Situation Assessment ===================
// Evaluate the battlefield state every 40 ticks

export interface SituationReport {
  faction: string
  doctrine: Doctrine
  phase: 'opening' | 'advantage' | 'disadvantage' | 'endgame' | 'desperate'
  aliveRatio: number          // our alive / total alive
  strengthRatio: number       // our total HP / enemy total HP
  moraleDiff: number          // our avg morale - enemy avg morale
  hasBridgeControl: boolean   // do we control bridge choke points
  hasForestControl: boolean   // do we have units in forests
  hasHeightAdvantage: boolean // do we have units near mountains
}

export function assessSituation(
  faction: string,
  units: BattleUnit[],
  map: BattleMap,
): SituationReport {
  const ours = units.filter((u) => u.faction === faction && u.state !== 'dead')
  const enemies = units.filter((u) => u.faction !== faction && u.state !== 'dead')
  const totalAlive = ours.length + enemies.length

  const ourHp = ours.reduce((s, u) => s + u.hp, 0)
  const enemyHp = enemies.reduce((s, u) => s + u.hp, 0)
  const ourMorale = ours.length > 0 ? ours.reduce((s, u) => s + u.morale, 0) / ours.length : 0
  const enemyMorale = enemies.length > 0 ? enemies.reduce((s, u) => s + u.morale, 0) / enemies.length : 0

  const aliveRatio = totalAlive > 0 ? ours.length / totalAlive : 0
  const strengthRatio = enemyHp > 0 ? ourHp / enemyHp : 999

  // Check terrain control
  const hasBridgeControl = ours.some((u) => getTerrainAt(map, u.position.x, u.position.y) === 'bridge')
  const hasForestControl = ours.some((u) => u.currentTerrain === 'forest')
  const hasHeightAdvantage = ours.some((u) => {
    const col = Math.floor(u.position.x / map.cellSize)
    const row = Math.floor(u.position.y / map.cellSize)
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nc = col + dx, nr = row + dy
      if (nr >= 0 && nr < map.terrain.length && nc >= 0 && nc < map.terrain[0].length) {
        if (map.terrain[nr][nc] === 'mountain') return true
      }
    }
    return false
  })

  // Determine phase
  let phase: SituationReport['phase'] = 'opening'
  if (strengthRatio > 1.5) phase = 'advantage'
  else if (strengthRatio < 0.6) phase = 'desperate'
  else if (strengthRatio < 0.85) phase = 'disadvantage'
  else if (ours.length <= 5 && enemies.length <= 5) phase = 'endgame'

  return {
    faction,
    doctrine: FACTION_DOCTRINES[faction] ?? 'balanced',
    phase, aliveRatio, strengthRatio, moraleDiff: ourMorale - enemyMorale,
    hasBridgeControl, hasForestControl, hasHeightAdvantage,
  }
}

// =================== Strategic Orders ===================
// Based on situation + doctrine, generate high-level orders

export interface StrategicOrder {
  mode: 'all_attack' | 'hold_position' | 'fall_back' | 'flank_left' | 'flank_right' | 'focus_archers' | 'protect_center'
  urgency: number // 0-1, how strongly to enforce
}

export function generateStrategy(sit: SituationReport, _rng: SeededRandom): StrategicOrder {
  const { doctrine, phase } = sit

  // Phase-based defaults
  if (phase === 'desperate') {
    return { mode: 'all_attack', urgency: 0.9 } // nothing to lose
  }

  switch (doctrine) {
    case 'aggressive':
      return phase === 'advantage'
        ? { mode: 'all_attack', urgency: 0.8 }
        : { mode: 'all_attack', urgency: 0.6 }

    case 'defensive':
      if (phase === 'advantage') return { mode: 'all_attack', urgency: 0.5 } // push carefully
      if (phase === 'disadvantage') return { mode: 'hold_position', urgency: 0.7 }
      return { mode: 'protect_center', urgency: 0.6 }

    case 'guerrilla':
      if (phase === 'disadvantage') return { mode: 'fall_back', urgency: 0.6 }
      if (sit.hasForestControl) return { mode: 'hold_position', urgency: 0.5 } // ambush from forest
      return { mode: 'flank_left', urgency: 0.5 }

    case 'cavalry_charge':
      if (phase === 'opening') return { mode: 'all_attack', urgency: 0.7 } // charge early
      if (phase === 'advantage') return { mode: 'all_attack', urgency: 0.9 }
      return { mode: 'focus_archers', urgency: 0.6 } // kill their ranged

    case 'fire_support':
      if (sit.hasForestControl) return { mode: 'hold_position', urgency: 0.6 } // let fire spread
      return { mode: 'protect_center', urgency: 0.5 }

    default: // balanced
      if (phase === 'advantage') return { mode: 'all_attack', urgency: 0.6 }
      if (phase === 'disadvantage') return { mode: 'hold_position', urgency: 0.5 }
      return { mode: 'protect_center', urgency: 0.4 }
  }
}

// =================== Advanced AI System ===================
// Runs every 40 ticks, applies strategic modifiers to units

const ADVANCED_AI_INTERVAL = 40

export function advancedAISystem(
  units: BattleUnit[],
  mode: BattleMode,
  map: BattleMap,
  tick: number,
  rng: SeededRandom,
): GameEvent[] {
  if (tick % ADVANCED_AI_INTERVAL !== 0) return []
  if (mode === 'free_for_all') return []

  const events: GameEvent[] = []
  const factions = [...new Set(units.filter((u) => u.state !== 'dead').map((u) => u.faction))]

  for (const faction of factions) {
    const sit = assessSituation(faction, units, map)
    const strategy = generateStrategy(sit, rng)
    const members = units.filter((u) => u.faction === faction && u.state !== 'dead' && u.state !== 'routed')

    if (members.length === 0) continue

    // === Apply coordination buffs based on doctrine ===

    // Cavalry charge doctrine: cavalry gets speed+morale boost during opening
    if (sit.doctrine === 'cavalry_charge' && sit.phase === 'opening') {
      for (const unit of members) {
        if (unit.troopType === 'cavalry') {
          if (!unit.buffs.some((b) => b.sourceId === 'doctrine_charge')) {
            unit.buffs.push({ type: 'buff_speed', value: 15, remainingTicks: ADVANCED_AI_INTERVAL + 5, sourceId: 'doctrine_charge' })
            unit.buffs.push({ type: 'buff_atk', value: 10, remainingTicks: ADVANCED_AI_INTERVAL + 5, sourceId: 'doctrine_charge' })
          }
        }
      }
    }

    // Defensive doctrine: shield/spearmen get defense boost when holding
    if (sit.doctrine === 'defensive' && (strategy.mode === 'hold_position' || strategy.mode === 'protect_center')) {
      for (const unit of members) {
        if (unit.troopType === 'shield' || unit.troopType === 'spearman') {
          if (!unit.buffs.some((b) => b.sourceId === 'doctrine_defense')) {
            unit.buffs.push({ type: 'buff_def', value: 15, remainingTicks: ADVANCED_AI_INTERVAL + 5, sourceId: 'doctrine_defense' })
            unit.buffs.push({ type: 'buff_morale', value: 5, remainingTicks: ADVANCED_AI_INTERVAL + 5, sourceId: 'doctrine_defense' })
          }
        }
      }
    }

    // Guerrilla doctrine: units in forest get attack boost
    if (sit.doctrine === 'guerrilla') {
      for (const unit of members) {
        if (unit.currentTerrain === 'forest' && !unit.buffs.some((b) => b.sourceId === 'doctrine_guerrilla')) {
          unit.buffs.push({ type: 'buff_atk', value: 18, remainingTicks: ADVANCED_AI_INTERVAL + 5, sourceId: 'doctrine_guerrilla' })
        }
      }
    }

    // Fire support doctrine: archers get range+atk boost near forests
    if (sit.doctrine === 'fire_support') {
      for (const unit of members) {
        if (unit.troopType === 'archer' && !unit.buffs.some((b) => b.sourceId === 'doctrine_fire')) {
          unit.buffs.push({ type: 'buff_atk', value: 12, remainingTicks: ADVANCED_AI_INTERVAL + 5, sourceId: 'doctrine_fire' })
        }
      }
    }

    // === Coordination: focus fire on archers when doctrine says so ===
    if (strategy.mode === 'focus_archers') {
      const enemyArchers = units.filter(
        (u) => u.faction !== faction && u.state !== 'dead' && u.troopType === 'archer'
      )
      if (enemyArchers.length > 0 && rng.chance(strategy.urgency * 0.5)) {
        const target = enemyArchers.reduce((a, b) => a.hp < b.hp ? a : b)
        const cavs = members.filter((u) => u.troopType === 'cavalry')
        for (const cav of cavs) {
          if (rng.chance(0.6)) cav.targetId = target.id
        }
      }
    }

    // === Terrain tactics: bridge holding ===
    if (sit.hasBridgeControl && strategy.mode === 'hold_position') {
      // Units on bridges get defense buff
      for (const unit of members) {
        if (getTerrainAt(map, unit.position.x, unit.position.y) === 'bridge') {
          if (!unit.buffs.some((b) => b.sourceId === 'terrain_bridge_hold')) {
            unit.buffs.push({ type: 'buff_def', value: 20, remainingTicks: ADVANCED_AI_INTERVAL + 5, sourceId: 'terrain_bridge_hold' })
          }
        }
      }
    }

    // === Terrain tactics: mountain edge holding ===
    if (sit.hasHeightAdvantage && strategy.mode !== 'all_attack') {
      for (const unit of members) {
        if (unit.troopType === 'archer') {
          // Archers near mountains get vision + range buff
          const col = Math.floor(unit.position.x / map.cellSize)
          const row = Math.floor(unit.position.y / map.cellSize)
          let nearMtn = false
          for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const nc = col + dx, nr = row + dy
            if (nr >= 0 && nr < map.terrain.length && nc >= 0 && nc < map.terrain[0].length) {
              if (map.terrain[nr][nc] === 'mountain') nearMtn = true
            }
          }
          if (nearMtn && !unit.buffs.some((b) => b.sourceId === 'terrain_height')) {
            unit.buffs.push({ type: 'buff_atk', value: 15, remainingTicks: ADVANCED_AI_INTERVAL + 5, sourceId: 'terrain_height' })
          }
        }
      }
    }

    // === Phase transition announcements ===
    if (sit.phase === 'desperate' && rng.chance(0.1)) {
      const name = FACTION_NAMES[faction] ?? faction
      events.push({
        tick, type: 'morale_break',
        message: `${name}军陷入绝境，背水一战！`,
      })
      // Desperate buff: all units get last-stand attack boost
      for (const unit of members) {
        if (!unit.buffs.some((b) => b.sourceId === 'desperate_fury')) {
          unit.buffs.push({ type: 'buff_atk', value: 25, remainingTicks: ADVANCED_AI_INTERVAL * 3, sourceId: 'desperate_fury' })
        }
      }
    }
  }

  return events
}
