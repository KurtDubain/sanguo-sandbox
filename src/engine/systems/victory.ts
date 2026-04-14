import { BattleUnit, BattleMode, BattleResult, GameEvent } from '../../types'
import { FACTION_NAMES } from '../../config/factionDisplay'

export function victorySystem(
  units: BattleUnit[],
  mode: BattleMode,
  tick: number,
): { result: BattleResult | null; events: GameEvent[] } {
  const alive = units.filter((u) => u.state !== 'dead')

  if (alive.length === 0) {
    return {
      result: buildResult(units, '无人生还', 'draw', mode, tick),
      events: [{
        tick,
        type: 'battle_end',
        message: '所有将领全部阵亡，平局！',
      }],
    }
  }

  if (mode === 'faction_battle') {
    const aliveFactions = new Set(alive.map((u) => u.faction))
    if (aliveFactions.size === 1) {
      const winFaction = alive[0].faction
      const factionName = FACTION_NAMES[winFaction] ?? winFaction
      return {
        result: buildResult(units, factionName, winFaction, mode, tick),
        events: [{
          tick,
          type: 'battle_end',
          message: `${factionName}阵营获得胜利！`,
        }],
      }
    }
  } else {
    // Free-for-all
    if (alive.length === 1) {
      return {
        result: buildResult(units, alive[0].name, alive[0].id, mode, tick),
        events: [{
          tick,
          type: 'battle_end',
          message: `${alive[0].name} 成为最后的幸存者！`,
        }],
      }
    }

    // Also check if all alive units are from same faction (accidental team-up in FFA)
    const allSameFaction = alive.every((u) => u.faction === alive[0].faction)
    if (allSameFaction && alive.length <= 3) {
      // End if remaining are all allies and have stopped fighting
      const anyFighting = alive.some((u) => u.state === 'attacking')
      if (!anyFighting) {
        return {
          result: buildResult(units, alive[0].faction, alive[0].faction, mode, tick),
          events: [{
            tick,
            type: 'battle_end',
            message: `${alive.map((u) => u.name).join('、')} 存活到了最后！`,
          }],
        }
      }
    }
  }

  // Timeout check (prevent infinite battles)
  if (tick > 12000) {
    return {
      result: buildResult(units, '超时', 'timeout', mode, tick),
      events: [{
        tick,
        type: 'battle_end',
        message: '战斗超时，按存活数判定胜负！',
      }],
    }
  }

  return { result: null, events: [] }
}

function buildResult(
  units: BattleUnit[],
  winnerName: string,
  winnerId: string,
  mode: BattleMode,
  totalTicks: number,
): BattleResult {
  const rankings = units
    .map((u) => ({
      id: u.id,
      name: u.name,
      faction: u.faction,
      kills: u.kills,
      damageDealt: u.damageDealt,
      damageTaken: u.damageTaken,
      survivalTicks: u.state === 'dead' ? u.survivalTicks : totalTicks,
      mvpScore: calculateMvpScore(u, totalTicks),
    }))
    .sort((a, b) => b.mvpScore - a.mvpScore)

  const survivors = units
    .filter((u) => u.state !== 'dead')
    .map((u) => ({
      id: u.id,
      name: u.name,
      faction: u.faction,
      hpPercent: Math.round((u.hp / u.maxHp) * 100),
      kills: u.kills,
      damageDealt: u.damageDealt,
      damageTaken: u.damageTaken,
    }))

  return {
    winner: winnerId,
    winnerName,
    mode,
    totalTicks,
    survivors,
    rankings,
  }
}

function calculateMvpScore(unit: BattleUnit, totalTicks: number): number {
  const survivalRatio = (unit.state === 'dead' ? unit.survivalTicks : totalTicks) / totalTicks
  return (
    unit.kills * 100 +
    unit.damageDealt * 0.5 +
    survivalRatio * 200 +
    (unit.state !== 'dead' ? 150 : 0) +
    (unit.hp / unit.maxHp) * 100
  )
}
