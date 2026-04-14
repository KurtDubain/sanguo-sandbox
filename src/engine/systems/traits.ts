// Passive traits: permanent abilities that modify combat behavior
// Each general can have 0-2 traits based on their stats

import { General, BattleUnit } from '../../types'

export interface Trait {
  id: string
  name: string
  description: string
  condition: (g: General) => boolean  // auto-assign if true
  apply: (unit: BattleUnit, context: TraitContext) => void
}

export interface TraitContext {
  nearbyEnemies: number
  nearbyAllies: number
  hpPercent: number
  inForest: boolean
  inMountainEdge: boolean
}

export const TRAITS: Trait[] = [
  {
    id: 'wanrendiren', name: '万人敌', description: '周围敌人越多攻击力越高',
    condition: (g) => g.martial >= 90,
    apply: (unit, ctx) => {
      if (ctx.nearbyEnemies >= 2) {
        unit.atk *= 1 + ctx.nearbyEnemies * 0.08 // +8% per nearby enemy
      }
    },
  },
  {
    id: 'shenshe', name: '神射', description: '暴击率大幅提升',
    condition: (g) => g.troopType === 'archer' && g.martial >= 80,
    apply: (unit) => {
      // Handled in attack system via buff
      if (!unit.buffs.some((b) => b.sourceId === 'trait_shenshe')) {
        unit.buffs.push({
          type: 'buff_atk', value: 0, remainingTicks: 9999, sourceId: 'trait_shenshe',
        })
      }
    },
  },
  {
    id: 'tiebi', name: '铁壁', description: '受到伤害降低 15%',
    condition: (g) => g.def >= 70 && (g.troopType === 'shield' || g.troopType === 'infantry'),
    apply: (unit) => {
      if (!unit.buffs.some((b) => b.sourceId === 'trait_tiebi')) {
        unit.buffs.push({
          type: 'buff_def', value: 15, remainingTicks: 9999, sourceId: 'trait_tiebi',
        })
      }
    },
  },
  {
    id: 'fengchi', name: '风驰', description: '移速提高 20%',
    condition: (g) => g.speed >= 65 && g.troopType === 'cavalry',
    apply: (unit) => {
      if (!unit.buffs.some((b) => b.sourceId === 'trait_fengchi')) {
        unit.buffs.push({
          type: 'buff_speed', value: 20, remainingTicks: 9999, sourceId: 'trait_fengchi',
        })
      }
    },
  },
  {
    id: 'buwang', name: '不屈', description: 'HP 低于 30% 时攻击力翻倍',
    condition: (g) => g.martial >= 85 && g.personality.aggressiveness >= 80,
    apply: (unit, ctx) => {
      if (ctx.hpPercent < 0.3) {
        unit.atk *= 2
      }
    },
  },
  {
    id: 'zhijun', name: '治军', description: '附近友军防御 +10%',
    condition: (g) => g.command >= 85,
    apply: (_unit, _ctx) => {
      // Applied through formation system, just a marker
    },
  },
  {
    id: 'miaoce', name: '妙策', description: '技能触发概率 +30%',
    condition: (g) => g.strategy >= 90,
    apply: (_unit) => {
      // Handled in skill system via strategy bonus
    },
  },
  {
    id: 'linwei', name: '林卫', description: '在森林中攻防各 +25%',
    condition: (g) => g.strategy >= 70 && g.personality.caution >= 60,
    apply: (unit, ctx) => {
      if (ctx.inForest) {
        unit.atk *= 1.25
        unit.def *= 1.25
      }
    },
  },
]

// Assign traits to a general based on their stats
export function assignTraits(general: General): string[] {
  const matched = TRAITS.filter((t) => t.condition(general))
  // Max 2 traits
  return matched.slice(0, 2).map((t) => t.id)
}

// Get trait objects by IDs
export function getTraits(traitIds: string[]): Trait[] {
  return traitIds.map((id) => TRAITS.find((t) => t.id === id)).filter(Boolean) as Trait[]
}
