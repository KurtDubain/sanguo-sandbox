// ===== Faction & Troop =====
export type Faction = 'wei' | 'shu' | 'wu' | 'qun' | 'dong' | 'yuan' | 'xiliang' | 'jingzhou' | 'yizhou' | 'jin'
export type TroopType = 'cavalry' | 'infantry' | 'archer' | 'shield' | 'spearman'
export type Rarity = 'normal' | 'elite' | 'legend'

// ===== Skill =====
export type SkillTargetType = 'self' | 'enemy' | 'ally' | 'area'
export type SkillEffectType =
  | 'damage'
  | 'buff_atk'
  | 'buff_def'
  | 'buff_speed'
  | 'buff_morale'
  | 'debuff_morale'
  | 'heal'

export interface SkillEffect {
  type: SkillEffectType
  value: number
  duration: number // ticks
  radius?: number  // for area effects
}

export interface Skill {
  id: string
  name: string
  description: string
  cooldown: number       // ticks between uses
  triggerChance: number  // 0~1, modified by strategy
  targetType: SkillTargetType
  range: number
  effects: SkillEffect[]
}

// ===== Personality =====
export interface Personality {
  aggressiveness: number  // 0~100 激进度
  caution: number         // 0~100 谨慎度
  discipline: number      // 0~100 纪律性
  greed: number           // 0~100 贪功倾向
  loyalty: number         // 0~100 忠诚/稳定
}

// ===== General (config) =====
export interface General {
  id: string
  name: string
  faction: Faction
  troopType: TroopType
  rarity: Rarity
  color: string

  // Six dimensions
  command: number      // 统
  strategy: number     // 谋
  politics: number     // 政
  martial: number      // 勇
  achievement: number  // 功
  charisma: number     // 德

  // Combat stats
  hp: number
  atk: number
  def: number
  speed: number
  morale: number
  range: number
  vision: number

  personality: Personality
  skills: Skill[]
  tags: string[]
}

// ===== Terrain =====
export type TerrainType = 'plain' | 'forest' | 'mountain' | 'river' | 'ford' | 'bridge' | 'wall'

export interface TerrainCell {
  type: TerrainType
  x: number
  y: number
}

export interface TerrainModifier {
  speedMult: number
  defBonus: number
  atkBonus: number
  visionMult: number
  rangedAtkMult: number
  passable: boolean
}

// ===== Battle Unit (runtime instance) =====
export interface Position {
  x: number
  y: number
}

export interface ActiveSkillState {
  skillId: string
  cooldownRemaining: number
}

export interface ActiveBuff {
  type: SkillEffectType
  value: number
  remainingTicks: number
  sourceId: string
}

export interface BattleUnit {
  id: string
  generalId: string
  name: string
  faction: Faction
  troopType: TroopType
  color: string

  // Six dimensions (for runtime formulas)
  command: number
  strategy: number
  politics: number
  martial: number
  achievement: number
  charisma: number

  // Runtime combat stats
  maxHp: number
  hp: number
  atk: number
  def: number
  speed: number
  morale: number
  maxMorale: number
  range: number
  vision: number

  position: Position
  targetId: string | null
  state: UnitState
  facing: number // angle in radians

  personality: Personality
  skills: ActiveSkillState[]
  buffs: ActiveBuff[]

  // Stats tracking
  damageDealt: number
  damageTaken: number
  kills: number
  survivalTicks: number

  // Terrain under this unit
  currentTerrain: TerrainType
}

export type UnitState = 'idle' | 'moving' | 'attacking' | 'retreating' | 'routed' | 'dead'

// ===== Supply Point =====
export interface SupplyPoint {
  x: number
  y: number
  radius: number
  healPerTick: number
  moralePerTick: number
  active: boolean
}

// ===== Danger Zone (shrinking circle) =====
export interface DangerZone {
  centerX: number
  centerY: number
  currentRadius: number
  targetRadius: number
  shrinkRate: number
  damagePerTick: number
  active: boolean
}

// ===== Battle Map =====
export interface BattleMap {
  width: number
  height: number
  terrain: TerrainType[][] // [row][col], cell size = 1 unit
  cellSize: number         // pixels per cell for rendering
}

// ===== Game Events / Log =====
export type GameEventType =
  | 'battle_start'
  | 'battle_end'
  | 'attack'
  | 'kill'
  | 'skill_trigger'
  | 'morale_break'
  | 'morale_rout'
  | 'morale_recover'
  | 'retreat'
  | 'state_change'
  | 'weather_change'
  | 'supply'
  | 'danger_zone'
  | 'duel'
  | 'charge'

export interface GameEvent {
  tick: number
  type: GameEventType
  sourceId?: string
  targetId?: string
  value?: number
  message: string
}

// ===== Weather =====
export type WeatherType = 'clear' | 'rain' | 'fog' | 'wind'

export interface WeatherState {
  type: WeatherType
  intensity: number // 0-1
  windAngle: number // radians, only for wind
  ticksRemaining: number
}

// ===== Siege Mode =====
export interface Tower {
  id: string
  x: number
  y: number
  hp: number
  maxHp: number
  range: number
  damage: number
  cooldown: number
  lastFireTick: number
  faction: Faction   // defending faction
  destroyed: boolean
}

export interface SiegeState {
  defendingFaction: Faction
  attackingFactions: Faction[]
  towers: Tower[]
  controlPoint: { x: number; y: number; radius: number }
  controlTicks: number           // how long attackers have held the point
  controlTicksNeeded: number     // ticks needed to capture (200)
  defenseTimeLimit: number       // ticks defenders need to survive (4000)
}

// ===== Battle State =====
export type BattleMode = 'free_for_all' | 'faction_battle' | 'siege'
export type BattlePhase = 'setup' | 'running' | 'paused' | 'finished'

export interface BattleResult {
  winner: string | null // faction or unit id
  winnerName: string
  mode: BattleMode
  totalTicks: number
  survivors: {
    id: string
    name: string
    faction: Faction
    hpPercent: number
    kills: number
    damageDealt: number
    damageTaken: number
  }[]
  rankings: {
    id: string
    name: string
    faction: Faction
    kills: number
    damageDealt: number
    damageTaken: number
    survivalTicks: number
    mvpScore: number
  }[]
}

export interface BattleState {
  tick: number
  phase: BattlePhase
  mode: BattleMode
  seed: number
  speed: number // 1, 2, 4
  units: BattleUnit[]
  map: BattleMap
  weather: WeatherState
  supplyPoints: SupplyPoint[]
  dangerZone: DangerZone
  siege: SiegeState | null
  alliances: string[][]   // e.g. [['shu','wu'],['wei']] — allied factions don't attack each other
  events: GameEvent[]
  result: BattleResult | null
}

// ===== Batch Simulation =====
export interface BatchResult {
  totalRuns: number
  factionWins: Record<string, number>
  generalStats: Record<string, {
    name: string
    faction: Faction
    wins: number
    avgSurvivalTicks: number
    avgKills: number
    avgDamageDealt: number
    avgDamageTaken: number
    avgMvpScore: number
  }>
}
