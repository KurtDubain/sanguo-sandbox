// Commander Personality AI: different command styles that affect the whole faction
// When commander dies, faction degrades to a worse style

import { BattleUnit, BattleMode, GameEvent } from '../../types'
import { SeededRandom } from '../utils/random'
import { FACTION_NAMES } from '../../config/factionDisplay'

export type CommandStyle =
  | 'methodical'    // 稳重型：集中兵力，稳步推进，优先打最弱的
  | 'aggressive'    // 激进型：全军压上，不管伤亡
  | 'cautious'      // 谨慎型：等对方先动，反击为主
  | 'flanker'       // 包抄型：骑兵绕后，步兵正面，两面夹击
  | 'sniper'        // 狙杀型：集火敌方将领/指挥官
  | 'guerrilla'     // 游击型：分散骚扰，不正面硬刚
  | 'headless'      // 无头型：指挥官死后，各自为战
  | 'panicked'      // 恐慌型：指挥官死后+士气低，乱跑

const STYLE_NAMES: Record<CommandStyle, string> = {
  methodical: '稳扎稳打',
  aggressive: '全军突击',
  cautious: '以逸待劳',
  flanker: '两面夹击',
  sniper: '斩首行动',
  guerrilla: '化整为零',
  headless: '群龙无首',
  panicked: '兵败如山',
}

// Track each faction's current command style and commander
interface FactionCommand {
  style: CommandStyle
  commanderId: string | null
  styleSetTick: number
}

const factionCommands = new Map<string, FactionCommand>()

export function resetCommandStyles() {
  factionCommands.clear()
}

// Assign initial style based on commander's personality
function pickStyleForCommander(commander: BattleUnit, rng: SeededRandom): CommandStyle {
  // Weighted by commander's personality
  const { aggressiveness, caution, discipline } = commander.personality

  if (commander.strategy >= 85 && discipline >= 70) {
    return rng.chance(0.6) ? 'methodical' : 'sniper'
  }
  if (aggressiveness >= 80) {
    return rng.chance(0.5) ? 'aggressive' : 'flanker'
  }
  if (caution >= 70) {
    return rng.chance(0.6) ? 'cautious' : 'methodical'
  }
  if (commander.strategy >= 75) {
    return rng.chance(0.5) ? 'flanker' : 'guerrilla'
  }

  // Default: random from good styles
  return rng.pick(['methodical', 'aggressive', 'cautious', 'flanker'])
}

// Main system: runs every 50 ticks, manages command styles
export function commandStyleSystem(
  units: BattleUnit[],
  mode: BattleMode,
  tick: number,
  rng: SeededRandom,
): GameEvent[] {
  if (mode === 'free_for_all') return []
  if (tick % 50 !== 0 && tick !== 1) return []

  const events: GameEvent[] = []
  const factions = [...new Set(units.filter((u) => u.state !== 'dead').map((u) => u.faction))]

  for (const faction of factions) {
    const members = units.filter((u) => u.faction === faction && u.state !== 'dead')
    if (members.length === 0) continue

    let cmd = factionCommands.get(faction)

    // Find current commander (highest command stat among alive)
    const aliveCommander = members.reduce((a, b) => a.command > b.command ? a : b)

    // First time: assign style
    if (!cmd) {
      const style = pickStyleForCommander(aliveCommander, rng)
      cmd = { style, commanderId: aliveCommander.id, styleSetTick: tick }
      factionCommands.set(faction, cmd)

      if (tick <= 1) {
        events.push({
          tick, type: 'skill_trigger', sourceId: aliveCommander.id,
          message: `${aliveCommander.name} 下令【${STYLE_NAMES[style]}】战术！`,
        })
      }
      continue
    }

    // Check if commander died
    const prevCommander = units.find((u) => u.id === cmd!.commanderId)
    if (prevCommander && prevCommander.state === 'dead' && cmd.style !== 'headless' && cmd.style !== 'panicked') {
      // Commander died! Degrade to headless or panicked
      const avgMorale = members.reduce((s, u) => s + u.morale, 0) / members.length
      const newStyle: CommandStyle = avgMorale < 30 ? 'panicked' : 'headless'
      cmd.style = newStyle
      cmd.commanderId = aliveCommander.id // new de-facto commander
      cmd.styleSetTick = tick

      events.push({
        tick, type: 'morale_break',
        message: `${FACTION_NAMES[faction] ?? faction}军失去指挥，陷入【${STYLE_NAMES[newStyle]}】！`,
      })

      // Panicked: extra morale hit
      if (newStyle === 'panicked') {
        for (const m of members) m.morale = Math.max(5, m.morale - 8)
      }
      continue
    }

    // If headless, check if a new strong commander emerges (high command + discipline)
    if ((cmd.style === 'headless' || cmd.style === 'panicked') && tick - cmd.styleSetTick > 100) {
      if (aliveCommander.command >= 75 && aliveCommander.personality.discipline >= 60) {
        const newStyle = pickStyleForCommander(aliveCommander, rng)
        cmd.style = newStyle
        cmd.commanderId = aliveCommander.id
        cmd.styleSetTick = tick

        events.push({
          tick, type: 'skill_trigger', sourceId: aliveCommander.id,
          message: `${aliveCommander.name} 接替指挥，下令【${STYLE_NAMES[newStyle]}】！`,
        })

        // Morale recovery for reorganizing
        for (const m of members) m.morale = Math.min(m.maxMorale, m.morale + 5)
      }
    }

    // Apply style-specific effects to units
    applyStyleEffects(cmd.style, members, units, faction, rng)
  }

  return events
}

// Apply combat behavior modifications based on current style
function applyStyleEffects(
  style: CommandStyle,
  members: BattleUnit[],
  allUnits: BattleUnit[],
  faction: string,
  rng: SeededRandom,
) {
  const enemies = allUnits.filter((u) => u.faction !== faction && u.state !== 'dead')
  if (enemies.length === 0) return

  switch (style) {
    case 'aggressive':
      // Everyone targets the nearest enemy, attack buff
      for (const u of members) {
        if (!u.buffs.some((b) => b.sourceId === 'style_aggressive')) {
          u.buffs.push({ type: 'buff_atk', value: 8, remainingTicks: 55, sourceId: 'style_aggressive' })
        }
      }
      break

    case 'cautious':
      // Defense buff, don't chase too far
      for (const u of members) {
        if (!u.buffs.some((b) => b.sourceId === 'style_cautious')) {
          u.buffs.push({ type: 'buff_def', value: 10, remainingTicks: 55, sourceId: 'style_cautious' })
          u.buffs.push({ type: 'buff_morale', value: 3, remainingTicks: 55, sourceId: 'style_cautious' })
        }
      }
      break

    case 'sniper':
      // Find enemy commander and make everyone focus them
      const enemyCommander = enemies.reduce((a, b) => a.command > b.command ? a : b)
      const cavs = members.filter((u) => u.troopType === 'cavalry')
      for (const cav of cavs) {
        if (rng.chance(0.4)) cav.targetId = enemyCommander.id
      }
      break

    case 'flanker':
      // Cavalry get speed buff for flanking
      for (const u of members) {
        if (u.troopType === 'cavalry' && !u.buffs.some((b) => b.sourceId === 'style_flanker')) {
          u.buffs.push({ type: 'buff_speed', value: 12, remainingTicks: 55, sourceId: 'style_flanker' })
        }
      }
      break

    case 'guerrilla':
      // Speed buff for everyone, slight attack buff
      for (const u of members) {
        if (!u.buffs.some((b) => b.sourceId === 'style_guerrilla')) {
          u.buffs.push({ type: 'buff_speed', value: 8, remainingTicks: 55, sourceId: 'style_guerrilla' })
        }
      }
      break

    case 'methodical':
      // Small balanced buff
      for (const u of members) {
        if (!u.buffs.some((b) => b.sourceId === 'style_method')) {
          u.buffs.push({ type: 'buff_def', value: 5, remainingTicks: 55, sourceId: 'style_method' })
          u.buffs.push({ type: 'buff_atk', value: 5, remainingTicks: 55, sourceId: 'style_method' })
        }
      }
      break

    case 'headless':
      // No buffs, slightly worse morale regen (applied passively)
      break

    case 'panicked':
      // Speed penalty, morale drain
      for (const u of members) {
        if (!u.buffs.some((b) => b.sourceId === 'style_panic')) {
          u.buffs.push({ type: 'buff_speed', value: -10, remainingTicks: 55, sourceId: 'style_panic' })
        }
        u.morale -= 0.1 // slow drain
      }
      break
  }
}

export function getFactionStyle(faction: string): CommandStyle | null {
  return factionCommands.get(faction)?.style ?? null
}
