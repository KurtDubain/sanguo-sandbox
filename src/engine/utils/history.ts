// Match history: save/load from localStorage

import { BattleResult, BattleMode } from '../../types'

export interface MatchRecord {
  id: string
  timestamp: number
  mode: BattleMode
  seed: number
  generalCount: number
  winnerName: string
  totalTicks: number
  mvpName: string
  mvpKills: number
  mvpScore: number
}

const STORAGE_KEY = 'sanguo_match_history'
const MAX_RECORDS = 50

export function saveMatchResult(result: BattleResult, seed: number, generalCount: number): MatchRecord {
  const mvp = result.rankings[0]
  const record: MatchRecord = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: Date.now(),
    mode: result.mode,
    seed,
    generalCount,
    winnerName: result.winnerName,
    totalTicks: result.totalTicks,
    mvpName: mvp?.name ?? '无',
    mvpKills: mvp?.kills ?? 0,
    mvpScore: Math.round(mvp?.mvpScore ?? 0),
  }

  const history = loadHistory()
  history.unshift(record)
  if (history.length > MAX_RECORDS) history.length = MAX_RECORDS

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {}

  return record
}

export function loadHistory(): MatchRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY)
}
