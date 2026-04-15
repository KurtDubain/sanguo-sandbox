// Commander Style AI: different command styles + death degradation + succession

import { BattleUnit, BattleMode, GameEvent } from '../../types'
import { SeededRandom } from '../utils/random'
import { FACTION_NAMES } from '../../config/factionDisplay'

export type CommandStyle =
  | 'methodical' | 'aggressive' | 'cautious' | 'flanker'
  | 'sniper' | 'guerrilla' | 'headless' | 'panicked'

const STYLE_NAMES: Record<CommandStyle, string> = {
  methodical: '稳扎稳打', aggressive: '全军突击', cautious: '以逸待劳',
  flanker: '两面夹击', sniper: '斩首行动', guerrilla: '化整为零',
  headless: '群龙无首', panicked: '兵败如山',
}

interface FactionCommand {
  style: CommandStyle
  commanderId: string
  styleSetTick: number
  announced: boolean // whether the initial style was announced
}

const factionCommands = new Map<string, FactionCommand>()

export function resetCommandStyles() {
  factionCommands.clear()
}

function pickStyleForCommander(commander: BattleUnit, rng: SeededRandom): CommandStyle {
  const { aggressiveness, caution, discipline } = commander.personality
  if (commander.strategy >= 85 && discipline >= 70) return rng.chance(0.6) ? 'methodical' : 'sniper'
  if (aggressiveness >= 80) return rng.chance(0.5) ? 'aggressive' : 'flanker'
  if (caution >= 70) return rng.chance(0.6) ? 'cautious' : 'methodical'
  if (commander.strategy >= 75) return rng.chance(0.5) ? 'flanker' : 'guerrilla'
  return rng.pick(['methodical', 'aggressive', 'cautious', 'flanker'])
}

export function commandStyleSystem(
  units: BattleUnit[],
  mode: BattleMode,
  tick: number,
  rng: SeededRandom,
): GameEvent[] {
  if (mode === 'free_for_all') return []

  const events: GameEvent[] = []
  const factions = [...new Set(units.filter((u) => u.state !== 'dead').map((u) => u.faction))]

  for (const faction of factions) {
    const members = units.filter((u) => u.faction === faction && u.state !== 'dead')
    if (members.length === 0) continue

    const aliveCommander = members.reduce((a, b) => a.command > b.command ? a : b)
    let cmd = factionCommands.get(faction)

    // === Initialize on first encounter ===
    if (!cmd) {
      const style = pickStyleForCommander(aliveCommander, rng)
      cmd = { style, commanderId: aliveCommander.id, styleSetTick: tick, announced: false }
      factionCommands.set(faction, cmd)
    }

    // === Announce initial style (once, on first tick we process) ===
    if (!cmd.announced) {
      cmd.announced = true
      events.push({
        tick, type: 'skill_trigger', sourceId: cmd.commanderId,
        message: `${aliveCommander.name} 下令【${STYLE_NAMES[cmd.style]}】战术！`,
      })
    }

    // === Check commander death (every tick, not just every 50) ===
    const currentCommander = units.find((u) => u.id === cmd!.commanderId)
    if (currentCommander && currentCommander.state === 'dead' &&
        cmd.style !== 'headless' && cmd.style !== 'panicked') {
      const avgMorale = members.reduce((s, u) => s + u.morale, 0) / members.length
      const newStyle: CommandStyle = avgMorale < 30 ? 'panicked' : 'headless'

      cmd.style = newStyle
      cmd.commanderId = aliveCommander.id
      cmd.styleSetTick = tick

      events.push({
        tick, type: 'morale_break',
        message: `${FACTION_NAMES[faction] ?? faction}军失去指挥，陷入【${STYLE_NAMES[newStyle]}】！`,
      })

      if (newStyle === 'panicked') {
        for (const m of members) m.morale = Math.max(5, m.morale - 8)
      }
    }

    // === Succession: headless/panicked can recover if a good leader survives ===
    if ((cmd.style === 'headless' || cmd.style === 'panicked') && tick - cmd.styleSetTick > 80) {
      // Lower threshold: command >= 70 and discipline >= 50
      if (aliveCommander.command >= 70 && aliveCommander.personality.discipline >= 50) {
        const newStyle = pickStyleForCommander(aliveCommander, rng)
        cmd.style = newStyle
        cmd.commanderId = aliveCommander.id
        cmd.styleSetTick = tick

        events.push({
          tick, type: 'skill_trigger', sourceId: aliveCommander.id,
          message: `${aliveCommander.name} 接替指挥，下令【${STYLE_NAMES[newStyle]}】！`,
        })

        for (const m of members) m.morale = Math.min(m.maxMorale, m.morale + 6)
      }
    }

    // === Apply style effects (every 50 ticks) ===
    if (tick % 50 === 0) {
      applyStyleEffects(cmd.style, members, units, faction, rng)
    }
  }

  return events
}

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
      for (const u of members) {
        if (!u.buffs.some((b) => b.sourceId === 'style_aggressive'))
          u.buffs.push({ type: 'buff_atk', value: 8, remainingTicks: 55, sourceId: 'style_aggressive' })
      }
      break
    case 'cautious':
      for (const u of members) {
        if (!u.buffs.some((b) => b.sourceId === 'style_cautious')) {
          u.buffs.push({ type: 'buff_def', value: 10, remainingTicks: 55, sourceId: 'style_cautious' })
          u.buffs.push({ type: 'buff_morale', value: 3, remainingTicks: 55, sourceId: 'style_cautious' })
        }
      }
      break
    case 'sniper': {
      const enemyCmd = enemies.reduce((a, b) => a.command > b.command ? a : b)
      for (const u of members) {
        if (u.troopType === 'cavalry' && rng.chance(0.4)) u.targetId = enemyCmd.id
      }
      break
    }
    case 'flanker':
      for (const u of members) {
        if (u.troopType === 'cavalry' && !u.buffs.some((b) => b.sourceId === 'style_flanker'))
          u.buffs.push({ type: 'buff_speed', value: 12, remainingTicks: 55, sourceId: 'style_flanker' })
      }
      break
    case 'guerrilla':
      for (const u of members) {
        if (!u.buffs.some((b) => b.sourceId === 'style_guerrilla'))
          u.buffs.push({ type: 'buff_speed', value: 8, remainingTicks: 55, sourceId: 'style_guerrilla' })
      }
      break
    case 'methodical':
      for (const u of members) {
        if (!u.buffs.some((b) => b.sourceId === 'style_method')) {
          u.buffs.push({ type: 'buff_def', value: 5, remainingTicks: 55, sourceId: 'style_method' })
          u.buffs.push({ type: 'buff_atk', value: 5, remainingTicks: 55, sourceId: 'style_method' })
        }
      }
      break
    case 'panicked':
      for (const u of members) {
        if (!u.buffs.some((b) => b.sourceId === 'style_panic'))
          u.buffs.push({ type: 'buff_speed', value: -10, remainingTicks: 55, sourceId: 'style_panic' })
        u.morale -= 0.1
      }
      break
    case 'headless':
      break // no buffs
  }
}

export function getFactionStyle(faction: string): CommandStyle | null {
  return factionCommands.get(faction)?.style ?? null
}
