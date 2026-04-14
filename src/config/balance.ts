import { TerrainModifier, TerrainType } from '../types'

export const TERRAIN_MODIFIERS: Record<TerrainType, TerrainModifier> = {
  plain: {
    speedMult: 1.0,
    defBonus: 0,
    atkBonus: 0,
    visionMult: 1.0,
    rangedAtkMult: 1.0,
    passable: true,
  },
  forest: {
    speedMult: 0.55,
    defBonus: 15,
    atkBonus: 0,
    visionMult: 0.5,
    rangedAtkMult: 0.6,
    passable: true,
  },
  mountain: {
    speedMult: 0,
    defBonus: 30,
    atkBonus: 0,
    visionMult: 1.5,
    rangedAtkMult: 0,
    passable: false, // impassable wall
  },
  river: {
    speedMult: 0,
    defBonus: -15,
    atkBonus: -10,
    visionMult: 1.0,
    rangedAtkMult: 0.9,
    passable: false, // impassable, only fords
  },
  ford: {
    speedMult: 0.5,
    defBonus: -10,
    atkBonus: -5,
    visionMult: 1.0,
    rangedAtkMult: 0.9,
    passable: true,  // crossable river point
  },
  bridge: {
    speedMult: 0.8,
    defBonus: 5,
    atkBonus: 0,
    visionMult: 1.0,
    rangedAtkMult: 1.0,
    passable: true,
  },
  wall: {
    speedMult: 0,
    defBonus: 40,
    atkBonus: 0,
    visionMult: 1.5,
    rangedAtkMult: 0,
    passable: false,   // impassable like mountain, but looks like a city wall
  },
}

// Troop type effectiveness: [attacker][defender] = damage multiplier
export const TROOP_EFFECTIVENESS: Record<string, Record<string, number>> = {
  cavalry:   { cavalry: 1.0, infantry: 1.2, archer: 1.4, shield: 0.7, spearman: 0.7 },
  infantry:  { cavalry: 0.9, infantry: 1.0, archer: 1.1, shield: 0.9, spearman: 1.0 },
  archer:    { cavalry: 0.8, infantry: 1.0, archer: 1.0, shield: 0.6, spearman: 1.2 },
  shield:    { cavalry: 1.1, infantry: 1.0, archer: 1.3, shield: 1.0, spearman: 0.9 },
  spearman:  { cavalry: 1.35, infantry: 1.0, archer: 0.8, shield: 1.0, spearman: 1.0 },
}

// Battle balance constants
export const BALANCE = {
  BASE_TICK_MS: 100,
  MAP_WIDTH: 1200,
  MAP_HEIGHT: 800,
  CELL_SIZE: 16,           // smaller cells → finer terrain detail

  // Stat mapping multipliers
  COMMAND_EFFICIENCY: 0.003,
  STRATEGY_TARGET_BONUS: 0.005,
  STRATEGY_FLANK_CHANCE: 0.003,
  POLITICS_REGEN: 0.002,
  MARTIAL_MELEE_BONUS: 0.005,   // martial → melee damage (buffed from 0.004)
  ACHIEVEMENT_PRESTIGE: 0.003,
  CHARISMA_AURA: 0.003,

  // Martial warrior mechanics
  CLEAVE_MARTIAL_THRESHOLD: 80,    // martial 80+ can hit multiple targets
  CLEAVE_MAX_TARGETS: 3,
  CLEAVE_DAMAGE_FALLOFF: 0.55,     // secondary targets take 55% damage
  CLEAVE_RANGE: 45,

  DODGE_SPEED_FACTOR: 0.0015,      // speed → dodge chance
  DODGE_MARTIAL_FACTOR: 0.001,     // martial → dodge chance
  DODGE_MAX: 0.25,                 // max 25% dodge

  COUNTER_MARTIAL_THRESHOLD: 85,   // auto-counter melee attacks
  COUNTER_DAMAGE_RATIO: 0.35,
  COUNTER_CHANCE: 0.3,

  INTIMIDATION_MARTIAL_THRESHOLD: 85,
  INTIMIDATION_RANGE: 65,
  INTIMIDATION_ATK_PENALTY: 0.12,  // -12% ATK for nearby enemies

  FORMATION_BREAK_FACTOR: 0.003,   // high martial reduces enemy formation def

  // Combat
  DAMAGE_VARIANCE: 0.15,
  CRIT_BASE_CHANCE: 0.05,
  CRIT_MULTIPLIER: 1.5,
  ATTACK_COOLDOWN: 22,          // slower attacks, more readable

  // Flanking
  FLANK_ANGLE_THRESHOLD: Math.PI * 0.6,
  FLANK_DAMAGE_BONUS: 0.35,
  FLANK_MORALE_PENALTY: 3,

  // Formation
  FORMATION_RANGE: 100,          // wider formation range (was 80)
  FORMATION_DEF_BONUS: 0.08,
  FORMATION_MAX_ALLIES: 3,

  // Fatigue
  FATIGUE_TICK_THRESHOLD: 600,
  FATIGUE_ATK_PENALTY: 0.0004,   // halved (was 0.0008) — winners stay effective longer
  FATIGUE_SPEED_PENALTY: 0.0003, // halved (was 0.0005)
  FATIGUE_POLITICS_RESIST: 0.005,

  // Pursuit
  PURSUIT_SPEED_BONUS: 1.2,
  PURSUIT_MARTIAL_BONUS: 0.003,

  // Morale
  MORALE_DECAY_ON_HIT: 0.35,          // reduced (was 0.5) — less morale lost per hit
  MORALE_BOOST_ON_KILL: 10,           // buffed (was 8)
  MORALE_REGEN_RATE: 0.3,             // 3x faster (was 0.1) — units can actually recover
  MORALE_RETREAT_THRESHOLD: 25,       // lowered (was 30) — more fight before retreat
  MORALE_ROUT_THRESHOLD: 8,           // lowered (was 10) — rout is harder to trigger
  MORALE_NEARBY_DEATH_PENALTY: 4,     // reduced (was 5)
  MORALE_CASCADE_RANGE: 80,           // tighter (was 100)
  MORALE_CASCADE_CHANCE: 0.06,        // massively reduced (was 0.15) — no more instant army rout
  MORALE_CHARISMA_AURA_RANGE: 140,    // wider (was 120)

  // Rally & Comeback
  RALLY_RANGE: 150,                   // commander rally point radius
  RALLY_MORALE_REGEN: 0.5,            // morale recovery per tick in rally zone
  SECOND_WIND_THRESHOLD: 0.25,        // HP% to trigger second wind
  SECOND_WIND_ATK_BONUS: 0.4,         // +40% ATK during second wind
  SECOND_WIND_DEF_BONUS: 0.25,        // +25% DEF during second wind

  // Movement
  BASE_SPEED: 2.5,               // slower, more cinematic
  RETREAT_SPEED_MULT: 1.3,
  ROUT_SPEED_MULT: 0.8,
  SEARCH_SPEED_MULT: 0.7,
  COLLISION_RADIUS: 14,

  // Engagement
  ENGAGE_RANGE: 50,
  DISENGAGE_RANGE: 400,

  // Skill
  STRATEGY_SKILL_BONUS: 0.005,

  // Last-stand
  LAST_STAND_HP_THRESHOLD: 0.3,
  LAST_STAND_MARTIAL_BONUS: 0.006,   // doubled from 0.003 — martial 100 = +60% at low HP

  // Death burst
  DEATH_BURST_MARTIAL_THRESHOLD: 75,
  DEATH_BURST_RANGE: 50,
  DEATH_BURST_DAMAGE_RATIO: 0.3,
} as const
