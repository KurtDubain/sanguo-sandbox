import { Position } from '../types'

export interface CachedPath {
  waypoints: Position[]
  waypointIdx: number
  goalPos: Position
  computedTick: number
}

export interface ActiveDuel {
  unitA: string
  unitB: string
  startTick: number
  duration: number
  resolved: boolean
}

export interface ActiveFire {
  col: number
  row: number
  age: number
  maxAge: number
}

export type CommandStyle =
  | 'methodical' | 'aggressive' | 'cautious' | 'flanker'
  | 'sniper' | 'guerrilla' | 'headless' | 'panicked'

export interface FactionCommand {
  style: CommandStyle
  commanderId: string
  styleSetTick: number
  announced: boolean
}

export interface SystemState {
  attackCooldowns: Map<string, number>
  pathCache: Map<string, CachedPath>
  stuckTracker: Map<string, { x: number; y: number; stuckTicks: number }>
  chargeDistances: Map<string, number>
  lastPositions: Map<string, { x: number; y: number }>
  chargeMoraleShield: Map<string, number>
  activeDuels: ActiveDuel[]
  activeFires: ActiveFire[]
  factionCommands: Map<string, FactionCommand>
}

export function createSystemState(): SystemState {
  return {
    attackCooldowns: new Map(),
    pathCache: new Map(),
    stuckTracker: new Map(),
    chargeDistances: new Map(),
    lastPositions: new Map(),
    chargeMoraleShield: new Map(),
    activeDuels: [],
    activeFires: [],
    factionCommands: new Map(),
  }
}
