// Random battlefield modifiers: pre-battle events that change rules each match

import { BattleUnit, GameEvent } from '../../types'
import { SeededRandom } from '../utils/random'

export interface BattleModifier {
  id: string
  name: string
  description: string
  apply: (units: BattleUnit[], rng: SeededRandom) => void
  type: 'buff' | 'debuff' | 'neutral'
}

const ALL_MODIFIERS: BattleModifier[] = [
  {
    id: 'thick_fog', name: '大雾弥漫', description: '全员视野-40%',
    type: 'neutral',
    apply: (units) => { for (const u of units) u.vision = Math.round(u.vision * 0.6) },
  },
  {
    id: 'drought', name: '粮草短缺', description: '全员HP-15%',
    type: 'debuff',
    apply: (units) => {
      for (const u of units) {
        u.maxHp = Math.round(u.maxHp * 0.85)
        u.hp = Math.min(u.hp, u.maxHp)
      }
    },
  },
  {
    id: 'abundance', name: '粮草充足', description: '全员HP+15%',
    type: 'buff',
    apply: (units) => {
      for (const u of units) {
        u.maxHp = Math.round(u.maxHp * 1.15)
        u.hp = u.maxHp
      }
    },
  },
  {
    id: 'war_drums', name: '战鼓擂动', description: '全员初始士气+10, 攻击+8%',
    type: 'buff',
    apply: (units) => {
      for (const u of units) {
        u.morale = Math.min(u.maxMorale, u.morale + 10)
        u.buffs.push({ type: 'buff_atk', value: 8, remainingTicks: 99999, sourceId: 'war_drums' })
      }
    },
  },
  {
    id: 'low_morale', name: '军心不稳', description: '全员初始士气-15',
    type: 'debuff',
    apply: (units) => { for (const u of units) u.morale = Math.max(10, u.morale - 15) },
  },
  {
    id: 'ironsmith', name: '铁匠赶工', description: '全员防御+20%',
    type: 'buff',
    apply: (units) => { for (const u of units) u.def = Math.round(u.def * 1.2) },
  },
  {
    id: 'blunt_weapons', name: '兵器老旧', description: '全员攻击-10%',
    type: 'debuff',
    apply: (units) => { for (const u of units) u.atk = Math.round(u.atk * 0.9) },
  },
  {
    id: 'sharp_weapons', name: '精锐兵器', description: '全员攻击+10%',
    type: 'buff',
    apply: (units) => { for (const u of units) u.atk = Math.round(u.atk * 1.1) },
  },
  {
    id: 'cavalry_advantage', name: '草原驰骋', description: '骑兵速度+25%, 攻击+10%',
    type: 'neutral',
    apply: (units) => {
      for (const u of units) {
        if (u.troopType === 'cavalry') {
          u.speed = Math.round(u.speed * 1.25)
          u.buffs.push({ type: 'buff_atk', value: 10, remainingTicks: 99999, sourceId: 'cavalry_adv' })
        }
      }
    },
  },
  {
    id: 'archer_advantage', name: '连弩供应', description: '弓兵射程+20%, 攻击+12%',
    type: 'neutral',
    apply: (units) => {
      for (const u of units) {
        if (u.troopType === 'archer') {
          u.range = Math.round(u.range * 1.2)
          u.buffs.push({ type: 'buff_atk', value: 12, remainingTicks: 99999, sourceId: 'archer_adv' })
        }
      }
    },
  },
  {
    id: 'shield_advantage', name: '坚盾铸造', description: '盾兵防御+30%, HP+20%',
    type: 'neutral',
    apply: (units) => {
      for (const u of units) {
        if (u.troopType === 'shield') {
          u.def = Math.round(u.def * 1.3)
          u.maxHp = Math.round(u.maxHp * 1.2)
          u.hp = u.maxHp
        }
      }
    },
  },
  {
    id: 'duel_pact', name: '名将之约', description: '单挑伤害翻倍, 触发概率+50%',
    type: 'neutral',
    apply: (_units) => { /* handled via buff tag check in combat */ },
  },
  {
    id: 'speed_boost', name: '急行军', description: '全员速度+20%',
    type: 'buff',
    apply: (units) => { for (const u of units) u.speed = Math.round(u.speed * 1.2) },
  },
  {
    id: 'fatigue_start', name: '长途跋涉', description: '全员速度-15%, 初始疲劳',
    type: 'debuff',
    apply: (units) => {
      for (const u of units) {
        u.speed = Math.round(u.speed * 0.85)
        u.morale = Math.max(10, u.morale - 5)
      }
    },
  },
  {
    id: 'berserker', name: '血战到底', description: '全员攻击+15%, 但防御-10%',
    type: 'neutral',
    apply: (units) => {
      for (const u of units) {
        u.atk = Math.round(u.atk * 1.15)
        u.def = Math.round(u.def * 0.9)
      }
    },
  },
  {
    id: 'fortified', name: '深沟高垒', description: '全员防御+15%, 但速度-10%',
    type: 'neutral',
    apply: (units) => {
      for (const u of units) {
        u.def = Math.round(u.def * 1.15)
        u.speed = Math.round(u.speed * 0.9)
      }
    },
  },
]

// Pick 1-2 random modifiers for a battle
export function rollModifiers(rng: SeededRandom, count: number = 2): BattleModifier[] {
  const shuffled = [...ALL_MODIFIERS]
  rng.shuffle(shuffled)
  return shuffled.slice(0, count)
}

// Apply modifiers to units and generate announcement events
export function applyModifiers(
  modifiers: BattleModifier[],
  units: BattleUnit[],
  rng: SeededRandom,
): GameEvent[] {
  const events: GameEvent[] = []
  for (const mod of modifiers) {
    mod.apply(units, rng)
    events.push({
      tick: 0,
      type: 'weather_change',
      message: `⚡ ${mod.name} — ${mod.description}`,
    })
  }
  return events
}

export { ALL_MODIFIERS }
