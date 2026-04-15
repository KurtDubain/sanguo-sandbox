import { BattleUnit, BattleMode, BattleResult, GameEvent } from '../../types'
import { FACTION_NAMES } from '../../config/factionDisplay'
import { areAllied } from '../utils/alliance'

export function victorySystem(
  units: BattleUnit[],
  mode: BattleMode,
  tick: number,
  alliances: string[][] = [],
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
    const aliveFactionList = [...new Set(alive.map((u) => u.faction))]
    // All surviving factions must be in the same alliance group
    const allAllied = aliveFactionList.length === 1 ||
      aliveFactionList.every((f) => areAllied(f, aliveFactionList[0], alliances))
    if (allAllied) {
      const winNames = aliveFactionList.map((f) => FACTION_NAMES[f] ?? f).join('+')
      return {
        result: buildResult(units, winNames, aliveFactionList[0], mode, tick),
        events: [{
          tick,
          type: 'battle_end',
          message: aliveFactionList.length > 1 ? `${winNames}联军获得胜利！` : `${winNames}阵营获得胜利！`,
        }],
      }
    }
  } else if (mode === 'free_for_all') {
    // Free-for-all: last person standing
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

    // If only 2-3 units remain and they haven't fought for a while, end it
    if (alive.length <= 3 && tick > 500) {
      const anyFighting = alive.some((u) => u.state === 'attacking')
      if (!anyFighting) {
        // Pick the one with most kills as winner
        const best = alive.reduce((a, b) => a.kills > b.kills ? a : b)
        return {
          result: buildResult(units, best.name, best.id, mode, tick),
          events: [{
            tick,
            type: 'battle_end',
            message: `${alive.map((u) => u.name).join('、')} 存活到了最后！${best.name} 获胜！`,
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
