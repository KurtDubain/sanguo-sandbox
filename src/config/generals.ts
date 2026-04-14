import { General } from '../types'
import { SKILLS } from './skills'

const s = SKILLS

const WEI = '#4a7cbf'
const SHU = '#c44e4e'
const WU = '#4eb84e'
const QUN = '#b8a44e'

function g(
  partial: Omit<General, 'skills' | 'tags'> & {
    skills?: string[]
    tags?: string[]
  }
): General {
  return {
    ...partial,
    skills: (partial.skills ?? []).map((id) => s[id]).filter(Boolean),
    tags: partial.tags ?? [],
  }
}

// ===================================================================
// 魏 (Wei) — 20 将
// ===================================================================
export const WEI_GENERALS: General[] = [
  g({
    id: 'caocao', name: '曹操', faction: 'wei', troopType: 'cavalry', rarity: 'legend', color: WEI,
    command: 96, strategy: 92, politics: 92, martial: 72, achievement: 98, charisma: 90,
    hp: 900, atk: 70, def: 65, speed: 55, morale: 95, range: 50, vision: 120,
    personality: { aggressiveness: 75, caution: 60, discipline: 85, greed: 60, loyalty: 70 },
    skills: ['stratagem', 'inspire'],
  }),
  g({
    id: 'simayi', name: '司马懿', faction: 'wei', troopType: 'infantry', rarity: 'legend', color: WEI,
    command: 90, strategy: 97, politics: 88, martial: 55, achievement: 90, charisma: 65,
    hp: 800, atk: 55, def: 70, speed: 45, morale: 80, range: 50, vision: 130,
    personality: { aggressiveness: 35, caution: 95, discipline: 90, greed: 80, loyalty: 40 },
    skills: ['fire_attack', 'fortify'],
  }),
  g({
    id: 'zhangliao', name: '张辽', faction: 'wei', troopType: 'cavalry', rarity: 'elite', color: WEI,
    command: 85, strategy: 72, politics: 55, martial: 88, achievement: 82, charisma: 78,
    hp: 950, atk: 82, def: 60, speed: 65, morale: 90, range: 50, vision: 100,
    personality: { aggressiveness: 80, caution: 45, discipline: 80, greed: 40, loyalty: 90 },
    skills: ['charge', 'roar'],
  }),
  g({
    id: 'xuhuang', name: '徐晃', faction: 'wei', troopType: 'infantry', rarity: 'elite', color: WEI,
    command: 82, strategy: 65, politics: 50, martial: 85, achievement: 75, charisma: 72,
    hp: 1000, atk: 78, def: 72, speed: 48, morale: 85, range: 50, vision: 90,
    personality: { aggressiveness: 60, caution: 55, discipline: 90, greed: 30, loyalty: 90 },
    skills: ['fortify', 'charge'],
  }),
  g({
    id: 'zhanghe', name: '张郃', faction: 'wei', troopType: 'spearman', rarity: 'elite', color: WEI,
    command: 80, strategy: 70, politics: 45, martial: 82, achievement: 72, charisma: 68,
    hp: 920, atk: 75, def: 68, speed: 55, morale: 82, range: 50, vision: 95,
    personality: { aggressiveness: 65, caution: 55, discipline: 75, greed: 45, loyalty: 70 },
    skills: ['ambush'],
  }),
  g({
    id: 'xiahoudun', name: '夏侯惇', faction: 'wei', troopType: 'cavalry', rarity: 'elite', color: WEI,
    command: 78, strategy: 55, politics: 48, martial: 90, achievement: 75, charisma: 80,
    hp: 1050, atk: 85, def: 65, speed: 58, morale: 92, range: 50, vision: 85,
    personality: { aggressiveness: 90, caution: 20, discipline: 75, greed: 50, loyalty: 95 },
    skills: ['charge', 'duel'],
  }),
  g({
    id: 'xiahouyuan', name: '夏侯渊', faction: 'wei', troopType: 'cavalry', rarity: 'elite', color: WEI,
    command: 80, strategy: 60, politics: 40, martial: 86, achievement: 70, charisma: 65,
    hp: 900, atk: 80, def: 55, speed: 70, morale: 80, range: 50, vision: 95,
    personality: { aggressiveness: 88, caution: 15, discipline: 60, greed: 55, loyalty: 85 },
    skills: ['ambush'],
  }),
  g({
    id: 'dengai', name: '邓艾', faction: 'wei', troopType: 'infantry', rarity: 'elite', color: WEI,
    command: 88, strategy: 85, politics: 60, martial: 78, achievement: 80, charisma: 55,
    hp: 880, atk: 72, def: 65, speed: 55, morale: 82, range: 50, vision: 110,
    personality: { aggressiveness: 70, caution: 55, discipline: 85, greed: 65, loyalty: 75 },
    skills: ['ambush', 'stratagem'],
  }),
  g({
    id: 'guojia', name: '郭嘉', faction: 'wei', troopType: 'archer', rarity: 'legend', color: WEI,
    command: 70, strategy: 98, politics: 80, martial: 35, achievement: 78, charisma: 82,
    hp: 650, atk: 50, def: 40, speed: 50, morale: 78, range: 150, vision: 140,
    personality: { aggressiveness: 55, caution: 70, discipline: 70, greed: 30, loyalty: 95 },
    skills: ['fire_attack', 'stratagem'],
  }),
  g({
    id: 'xunyu', name: '荀彧', faction: 'wei', troopType: 'infantry', rarity: 'elite', color: WEI,
    command: 72, strategy: 90, politics: 95, martial: 30, achievement: 80, charisma: 90,
    hp: 650, atk: 40, def: 45, speed: 42, morale: 85, range: 50, vision: 120,
    personality: { aggressiveness: 20, caution: 85, discipline: 95, greed: 10, loyalty: 98 },
    skills: ['rally', 'heal'],
  }),
  // ---- 新增 ----
  g({
    id: 'dianwei', name: '典韦', faction: 'wei', troopType: 'infantry', rarity: 'elite', color: WEI,
    command: 55, strategy: 30, politics: 20, martial: 95, achievement: 62, charisma: 55,
    hp: 1200, atk: 92, def: 70, speed: 50, morale: 88, range: 50, vision: 70,
    personality: { aggressiveness: 95, caution: 5, discipline: 65, greed: 15, loyalty: 100 },
    skills: ['duel', 'roar'],
  }),
  g({
    id: 'xuchu', name: '许褚', faction: 'wei', troopType: 'infantry', rarity: 'elite', color: WEI,
    command: 58, strategy: 28, politics: 18, martial: 94, achievement: 60, charisma: 50,
    hp: 1250, atk: 90, def: 75, speed: 45, morale: 85, range: 50, vision: 70,
    personality: { aggressiveness: 90, caution: 10, discipline: 70, greed: 20, loyalty: 100 },
    skills: ['shield_wall', 'duel'],
  }),
  g({
    id: 'caoren', name: '曹仁', faction: 'wei', troopType: 'shield', rarity: 'elite', color: WEI,
    command: 85, strategy: 65, politics: 55, martial: 80, achievement: 72, charisma: 70,
    hp: 1050, atk: 68, def: 80, speed: 45, morale: 90, range: 50, vision: 90,
    personality: { aggressiveness: 55, caution: 65, discipline: 90, greed: 20, loyalty: 92 },
    skills: ['fortify', 'shield_wall'],
  }),
  g({
    id: 'caohong', name: '曹洪', faction: 'wei', troopType: 'cavalry', rarity: 'normal', color: WEI,
    command: 72, strategy: 50, politics: 42, martial: 78, achievement: 58, charisma: 55,
    hp: 920, atk: 72, def: 58, speed: 60, morale: 80, range: 50, vision: 85,
    personality: { aggressiveness: 70, caution: 35, discipline: 65, greed: 55, loyalty: 85 },
    skills: ['charge'],
  }),
  g({
    id: 'yujin', name: '于禁', faction: 'wei', troopType: 'infantry', rarity: 'elite', color: WEI,
    command: 82, strategy: 62, politics: 55, martial: 72, achievement: 68, charisma: 60,
    hp: 950, atk: 68, def: 72, speed: 48, morale: 75, range: 50, vision: 90,
    personality: { aggressiveness: 50, caution: 65, discipline: 95, greed: 25, loyalty: 55 },
    skills: ['fortify'],
  }),
  g({
    id: 'yuejin', name: '乐进', faction: 'wei', troopType: 'infantry', rarity: 'normal', color: WEI,
    command: 72, strategy: 55, politics: 42, martial: 80, achievement: 60, charisma: 58,
    hp: 900, atk: 75, def: 60, speed: 58, morale: 82, range: 50, vision: 85,
    personality: { aggressiveness: 78, caution: 30, discipline: 75, greed: 35, loyalty: 88 },
    skills: ['charge'],
  }),
  g({
    id: 'lidian', name: '李典', faction: 'wei', troopType: 'archer', rarity: 'normal', color: WEI,
    command: 72, strategy: 68, politics: 55, martial: 72, achievement: 58, charisma: 65,
    hp: 850, atk: 65, def: 55, speed: 52, morale: 80, range: 140, vision: 100,
    personality: { aggressiveness: 45, caution: 65, discipline: 85, greed: 20, loyalty: 90 },
    skills: ['snipe'],
  }),
  g({
    id: 'pangde', name: '庞德', faction: 'wei', troopType: 'cavalry', rarity: 'elite', color: WEI,
    command: 70, strategy: 48, politics: 35, martial: 90, achievement: 60, charisma: 68,
    hp: 1000, atk: 85, def: 58, speed: 62, morale: 90, range: 50, vision: 80,
    personality: { aggressiveness: 88, caution: 12, discipline: 72, greed: 30, loyalty: 92 },
    skills: ['duel', 'charge'],
  }),
  g({
    id: 'zhonghui', name: '钟会', faction: 'wei', troopType: 'infantry', rarity: 'elite', color: WEI,
    command: 82, strategy: 88, politics: 75, martial: 55, achievement: 72, charisma: 48,
    hp: 750, atk: 55, def: 55, speed: 50, morale: 70, range: 50, vision: 115,
    personality: { aggressiveness: 60, caution: 55, discipline: 65, greed: 85, loyalty: 25 },
    skills: ['stratagem', 'fire_attack'],
  }),
  g({
    id: 'jiaxu', name: '贾诩', faction: 'wei', troopType: 'archer', rarity: 'legend', color: WEI,
    command: 68, strategy: 95, politics: 82, martial: 32, achievement: 72, charisma: 45,
    hp: 620, atk: 45, def: 42, speed: 48, morale: 72, range: 140, vision: 135,
    personality: { aggressiveness: 30, caution: 95, discipline: 80, greed: 50, loyalty: 35 },
    skills: ['fire_attack', 'ambush'],
  }),
]

// ===================================================================
// 蜀 (Shu) — 20 将
// ===================================================================
export const SHU_GENERALS: General[] = [
  g({
    id: 'liubei', name: '刘备', faction: 'shu', troopType: 'infantry', rarity: 'legend', color: SHU,
    command: 78, strategy: 72, politics: 85, martial: 65, achievement: 92, charisma: 99,
    hp: 850, atk: 60, def: 60, speed: 48, morale: 95, range: 50, vision: 100,
    personality: { aggressiveness: 40, caution: 65, discipline: 80, greed: 20, loyalty: 95 },
    skills: ['rally', 'inspire'],
  }),
  g({
    id: 'zhugeliang', name: '诸葛亮', faction: 'shu', troopType: 'archer', rarity: 'legend', color: SHU,
    command: 92, strategy: 99, politics: 95, martial: 38, achievement: 95, charisma: 92,
    hp: 700, atk: 55, def: 50, speed: 45, morale: 88, range: 160, vision: 150,
    personality: { aggressiveness: 45, caution: 85, discipline: 95, greed: 15, loyalty: 100 },
    skills: ['fire_attack', 'stratagem'],
  }),
  g({
    id: 'guanyu', name: '关羽', faction: 'shu', troopType: 'cavalry', rarity: 'legend', color: SHU,
    command: 88, strategy: 72, politics: 60, martial: 97, achievement: 92, charisma: 95,
    hp: 1100, atk: 90, def: 70, speed: 58, morale: 95, range: 50, vision: 100,
    personality: { aggressiveness: 75, caution: 40, discipline: 70, greed: 50, loyalty: 100 },
    skills: ['duel', 'roar'],
  }),
  g({
    id: 'zhangfei', name: '张飞', faction: 'shu', troopType: 'spearman', rarity: 'legend', color: SHU,
    command: 75, strategy: 45, politics: 30, martial: 95, achievement: 80, charisma: 60,
    hp: 1050, atk: 92, def: 60, speed: 60, morale: 85, range: 50, vision: 80,
    personality: { aggressiveness: 95, caution: 10, discipline: 40, greed: 55, loyalty: 100 },
    skills: ['roar', 'charge'],
  }),
  g({
    id: 'zhaoyun', name: '赵云', faction: 'shu', troopType: 'cavalry', rarity: 'legend', color: SHU,
    command: 82, strategy: 75, politics: 55, martial: 96, achievement: 85, charisma: 90,
    hp: 1000, atk: 88, def: 72, speed: 68, morale: 92, range: 50, vision: 105,
    personality: { aggressiveness: 70, caution: 55, discipline: 90, greed: 15, loyalty: 100 },
    skills: ['charge', 'duel'],
  }),
  g({
    id: 'machao', name: '马超', faction: 'shu', troopType: 'cavalry', rarity: 'elite', color: SHU,
    command: 75, strategy: 50, politics: 35, martial: 95, achievement: 72, charisma: 65,
    hp: 1000, atk: 90, def: 58, speed: 72, morale: 78, range: 50, vision: 90,
    personality: { aggressiveness: 92, caution: 15, discipline: 50, greed: 70, loyalty: 55 },
    skills: ['charge', 'roar'],
  }),
  g({
    id: 'huangzhong', name: '黄忠', faction: 'shu', troopType: 'archer', rarity: 'elite', color: SHU,
    command: 72, strategy: 55, politics: 40, martial: 88, achievement: 68, charisma: 60,
    hp: 850, atk: 82, def: 55, speed: 45, morale: 85, range: 180, vision: 120,
    personality: { aggressiveness: 65, caution: 45, discipline: 80, greed: 40, loyalty: 90 },
    skills: ['snipe'],
  }),
  g({
    id: 'weiyan', name: '魏延', faction: 'shu', troopType: 'infantry', rarity: 'elite', color: SHU,
    command: 80, strategy: 68, politics: 38, martial: 88, achievement: 70, charisma: 45,
    hp: 980, atk: 82, def: 62, speed: 55, morale: 72, range: 50, vision: 90,
    personality: { aggressiveness: 85, caution: 25, discipline: 45, greed: 80, loyalty: 35 },
    skills: ['ambush', 'charge'],
  }),
  g({
    id: 'jiangwei', name: '姜维', faction: 'shu', troopType: 'spearman', rarity: 'elite', color: SHU,
    command: 85, strategy: 82, politics: 60, martial: 82, achievement: 72, charisma: 70,
    hp: 900, atk: 76, def: 65, speed: 58, morale: 82, range: 50, vision: 100,
    personality: { aggressiveness: 72, caution: 50, discipline: 80, greed: 45, loyalty: 90 },
    skills: ['stratagem', 'charge'],
  }),
  g({
    id: 'fazheng', name: '法正', faction: 'shu', troopType: 'infantry', rarity: 'elite', color: SHU,
    command: 65, strategy: 92, politics: 78, martial: 40, achievement: 70, charisma: 55,
    hp: 680, atk: 48, def: 45, speed: 48, morale: 75, range: 50, vision: 125,
    personality: { aggressiveness: 55, caution: 65, discipline: 60, greed: 60, loyalty: 80 },
    skills: ['ambush', 'stratagem'],
  }),
  // ---- 新增 ----
  g({
    id: 'pangtong', name: '庞统', faction: 'shu', troopType: 'archer', rarity: 'legend', color: SHU,
    command: 78, strategy: 95, politics: 80, martial: 35, achievement: 68, charisma: 62,
    hp: 660, atk: 48, def: 42, speed: 48, morale: 76, range: 150, vision: 135,
    personality: { aggressiveness: 60, caution: 55, discipline: 72, greed: 35, loyalty: 88 },
    skills: ['fire_attack', 'stratagem'],
  }),
  g({
    id: 'guanping', name: '关平', faction: 'shu', troopType: 'cavalry', rarity: 'normal', color: SHU,
    command: 68, strategy: 55, politics: 42, martial: 80, achievement: 52, charisma: 65,
    hp: 920, atk: 75, def: 62, speed: 58, morale: 82, range: 50, vision: 85,
    personality: { aggressiveness: 65, caution: 45, discipline: 80, greed: 25, loyalty: 98 },
    skills: ['charge'],
  }),
  g({
    id: 'guanxing', name: '关兴', faction: 'shu', troopType: 'cavalry', rarity: 'normal', color: SHU,
    command: 65, strategy: 52, politics: 38, martial: 78, achievement: 48, charisma: 62,
    hp: 900, atk: 72, def: 58, speed: 60, morale: 80, range: 50, vision: 82,
    personality: { aggressiveness: 72, caution: 40, discipline: 75, greed: 30, loyalty: 95 },
    skills: ['duel'],
  }),
  g({
    id: 'zhangbao', name: '张苞', faction: 'shu', troopType: 'spearman', rarity: 'normal', color: SHU,
    command: 62, strategy: 42, politics: 32, martial: 80, achievement: 45, charisma: 55,
    hp: 920, atk: 75, def: 55, speed: 55, morale: 78, range: 50, vision: 78,
    personality: { aggressiveness: 82, caution: 20, discipline: 50, greed: 40, loyalty: 95 },
    skills: ['roar'],
  }),
  g({
    id: 'liaohua', name: '廖化', faction: 'shu', troopType: 'infantry', rarity: 'normal', color: SHU,
    command: 68, strategy: 55, politics: 48, martial: 72, achievement: 55, charisma: 58,
    hp: 880, atk: 68, def: 62, speed: 50, morale: 80, range: 50, vision: 85,
    personality: { aggressiveness: 55, caution: 55, discipline: 78, greed: 20, loyalty: 92 },
    skills: ['fortify'],
  }),
  g({
    id: 'wangping', name: '王平', faction: 'shu', troopType: 'shield', rarity: 'elite', color: SHU,
    command: 78, strategy: 65, politics: 50, martial: 68, achievement: 58, charisma: 62,
    hp: 950, atk: 62, def: 78, speed: 42, morale: 85, range: 50, vision: 90,
    personality: { aggressiveness: 40, caution: 72, discipline: 92, greed: 12, loyalty: 90 },
    skills: ['shield_wall', 'fortify'],
  }),
  g({
    id: 'madai', name: '马岱', faction: 'shu', troopType: 'cavalry', rarity: 'normal', color: SHU,
    command: 68, strategy: 55, politics: 40, martial: 76, achievement: 52, charisma: 55,
    hp: 880, atk: 72, def: 55, speed: 65, morale: 76, range: 50, vision: 85,
    personality: { aggressiveness: 65, caution: 42, discipline: 68, greed: 35, loyalty: 82 },
    skills: ['ambush'],
  }),
  g({
    id: 'yanyan', name: '严颜', faction: 'shu', troopType: 'shield', rarity: 'normal', color: SHU,
    command: 70, strategy: 52, politics: 48, martial: 75, achievement: 50, charisma: 68,
    hp: 950, atk: 65, def: 72, speed: 40, morale: 85, range: 50, vision: 80,
    personality: { aggressiveness: 45, caution: 60, discipline: 82, greed: 15, loyalty: 90 },
    skills: ['fortify'],
  }),
  g({
    id: 'feiyi', name: '费祎', faction: 'shu', troopType: 'infantry', rarity: 'elite', color: SHU,
    command: 72, strategy: 82, politics: 88, martial: 35, achievement: 65, charisma: 78,
    hp: 680, atk: 42, def: 48, speed: 45, morale: 82, range: 50, vision: 110,
    personality: { aggressiveness: 25, caution: 80, discipline: 88, greed: 10, loyalty: 92 },
    skills: ['rally', 'heal'],
  }),
  g({
    id: 'jiangwan', name: '蒋琬', faction: 'shu', troopType: 'infantry', rarity: 'normal', color: SHU,
    command: 70, strategy: 78, politics: 85, martial: 30, achievement: 60, charisma: 75,
    hp: 650, atk: 38, def: 45, speed: 42, morale: 80, range: 50, vision: 105,
    personality: { aggressiveness: 20, caution: 82, discipline: 90, greed: 8, loyalty: 95 },
    skills: ['heal', 'inspire'],
  }),
]

// ===================================================================
// 吴 (Wu) — 20 将
// ===================================================================
export const WU_GENERALS: General[] = [
  g({
    id: 'sunquan', name: '孙权', faction: 'wu', troopType: 'infantry', rarity: 'legend', color: WU,
    command: 80, strategy: 78, politics: 88, martial: 60, achievement: 88, charisma: 85,
    hp: 850, atk: 58, def: 62, speed: 48, morale: 90, range: 50, vision: 110,
    personality: { aggressiveness: 45, caution: 70, discipline: 85, greed: 35, loyalty: 80 },
    skills: ['rally', 'inspire'],
  }),
  g({
    id: 'zhouyu', name: '周瑜', faction: 'wu', troopType: 'archer', rarity: 'legend', color: WU,
    command: 88, strategy: 95, politics: 82, martial: 68, achievement: 88, charisma: 88,
    hp: 780, atk: 65, def: 55, speed: 55, morale: 88, range: 150, vision: 130,
    personality: { aggressiveness: 65, caution: 60, discipline: 85, greed: 40, loyalty: 90 },
    skills: ['fire_attack', 'stratagem'],
  }),
  g({
    id: 'luxun', name: '陆逊', faction: 'wu', troopType: 'infantry', rarity: 'legend', color: WU,
    command: 85, strategy: 92, politics: 82, martial: 55, achievement: 82, charisma: 78,
    hp: 750, atk: 55, def: 58, speed: 52, morale: 85, range: 50, vision: 130,
    personality: { aggressiveness: 40, caution: 80, discipline: 90, greed: 25, loyalty: 85 },
    skills: ['fire_attack', 'fortify'],
  }),
  g({
    id: 'lvmeng', name: '吕蒙', faction: 'wu', troopType: 'infantry', rarity: 'elite', color: WU,
    command: 82, strategy: 85, politics: 72, martial: 78, achievement: 78, charisma: 68,
    hp: 880, atk: 72, def: 65, speed: 55, morale: 82, range: 50, vision: 115,
    personality: { aggressiveness: 60, caution: 65, discipline: 80, greed: 50, loyalty: 85 },
    skills: ['ambush', 'stratagem'],
  }),
  g({
    id: 'lusu', name: '鲁肃', faction: 'wu', troopType: 'shield', rarity: 'elite', color: WU,
    command: 72, strategy: 85, politics: 90, martial: 45, achievement: 72, charisma: 88,
    hp: 780, atk: 45, def: 65, speed: 42, morale: 88, range: 50, vision: 110,
    personality: { aggressiveness: 25, caution: 85, discipline: 90, greed: 10, loyalty: 95 },
    skills: ['rally', 'heal'],
  }),
  g({
    id: 'taishici', name: '太史慈', faction: 'wu', troopType: 'archer', rarity: 'elite', color: WU,
    command: 72, strategy: 55, politics: 40, martial: 90, achievement: 68, charisma: 72,
    hp: 920, atk: 80, def: 58, speed: 62, morale: 82, range: 170, vision: 110,
    personality: { aggressiveness: 78, caution: 35, discipline: 70, greed: 45, loyalty: 90 },
    skills: ['snipe', 'charge'],
  }),
  g({
    id: 'ganning', name: '甘宁', faction: 'wu', troopType: 'cavalry', rarity: 'elite', color: WU,
    command: 72, strategy: 55, politics: 35, martial: 88, achievement: 70, charisma: 60,
    hp: 950, atk: 82, def: 55, speed: 65, morale: 78, range: 50, vision: 90,
    personality: { aggressiveness: 90, caution: 15, discipline: 45, greed: 65, loyalty: 70 },
    skills: ['ambush', 'roar'],
  }),
  g({
    id: 'dingfeng', name: '丁奉', faction: 'wu', troopType: 'infantry', rarity: 'normal', color: WU,
    command: 72, strategy: 62, politics: 50, martial: 78, achievement: 65, charisma: 60,
    hp: 900, atk: 72, def: 62, speed: 55, morale: 78, range: 50, vision: 90,
    personality: { aggressiveness: 70, caution: 45, discipline: 75, greed: 40, loyalty: 85 },
    skills: ['fortify'],
  }),
  g({
    id: 'sunce', name: '孙策', faction: 'wu', troopType: 'cavalry', rarity: 'legend', color: WU,
    command: 82, strategy: 68, politics: 60, martial: 92, achievement: 80, charisma: 88,
    hp: 1000, atk: 85, def: 58, speed: 68, morale: 92, range: 50, vision: 100,
    personality: { aggressiveness: 88, caution: 20, discipline: 65, greed: 55, loyalty: 85 },
    skills: ['charge', 'duel'],
  }),
  g({
    id: 'lukang', name: '陆抗', faction: 'wu', troopType: 'shield', rarity: 'elite', color: WU,
    command: 85, strategy: 82, politics: 78, martial: 65, achievement: 70, charisma: 75,
    hp: 880, atk: 60, def: 75, speed: 45, morale: 85, range: 50, vision: 105,
    personality: { aggressiveness: 40, caution: 75, discipline: 90, greed: 20, loyalty: 90 },
    skills: ['fortify', 'rally'],
  }),
  // ---- 新增 ----
  g({
    id: 'huanggai', name: '黄盖', faction: 'wu', troopType: 'infantry', rarity: 'elite', color: WU,
    command: 72, strategy: 62, politics: 50, martial: 78, achievement: 65, charisma: 70,
    hp: 950, atk: 72, def: 65, speed: 48, morale: 88, range: 50, vision: 85,
    personality: { aggressiveness: 72, caution: 40, discipline: 85, greed: 15, loyalty: 98 },
    skills: ['fire_attack'],
  }),
  g({
    id: 'chengpu', name: '程普', faction: 'wu', troopType: 'spearman', rarity: 'normal', color: WU,
    command: 75, strategy: 58, politics: 52, martial: 76, achievement: 62, charisma: 68,
    hp: 920, atk: 70, def: 65, speed: 48, morale: 82, range: 50, vision: 88,
    personality: { aggressiveness: 55, caution: 55, discipline: 82, greed: 20, loyalty: 90 },
    skills: ['fortify'],
  }),
  g({
    id: 'handang', name: '韩当', faction: 'wu', troopType: 'infantry', rarity: 'normal', color: WU,
    command: 70, strategy: 52, politics: 45, martial: 75, achievement: 58, charisma: 62,
    hp: 900, atk: 70, def: 62, speed: 50, morale: 80, range: 50, vision: 85,
    personality: { aggressiveness: 60, caution: 50, discipline: 78, greed: 25, loyalty: 88 },
    skills: ['charge'],
  }),
  g({
    id: 'zhoutai', name: '周泰', faction: 'wu', troopType: 'shield', rarity: 'elite', color: WU,
    command: 65, strategy: 42, politics: 35, martial: 88, achievement: 62, charisma: 72,
    hp: 1150, atk: 78, def: 80, speed: 45, morale: 90, range: 50, vision: 78,
    personality: { aggressiveness: 65, caution: 35, discipline: 82, greed: 10, loyalty: 100 },
    skills: ['shield_wall', 'fortify'],
  }),
  g({
    id: 'lingtong', name: '凌统', faction: 'wu', troopType: 'cavalry', rarity: 'normal', color: WU,
    command: 68, strategy: 52, politics: 40, martial: 82, achievement: 55, charisma: 62,
    hp: 920, atk: 78, def: 55, speed: 62, morale: 78, range: 50, vision: 85,
    personality: { aggressiveness: 80, caution: 25, discipline: 60, greed: 45, loyalty: 80 },
    skills: ['charge', 'duel'],
  }),
  g({
    id: 'xusheng', name: '徐盛', faction: 'wu', troopType: 'archer', rarity: 'normal', color: WU,
    command: 70, strategy: 65, politics: 48, martial: 72, achievement: 55, charisma: 58,
    hp: 840, atk: 68, def: 55, speed: 52, morale: 78, range: 150, vision: 100,
    personality: { aggressiveness: 55, caution: 58, discipline: 75, greed: 30, loyalty: 85 },
    skills: ['snipe'],
  }),
  g({
    id: 'zhuran', name: '朱然', faction: 'wu', troopType: 'infantry', rarity: 'elite', color: WU,
    command: 78, strategy: 68, politics: 55, martial: 75, achievement: 65, charisma: 65,
    hp: 920, atk: 70, def: 68, speed: 50, morale: 85, range: 50, vision: 92,
    personality: { aggressiveness: 55, caution: 60, discipline: 85, greed: 22, loyalty: 88 },
    skills: ['fortify', 'inspire'],
  }),
  g({
    id: 'zhangzhao', name: '张昭', faction: 'wu', troopType: 'infantry', rarity: 'normal', color: WU,
    command: 55, strategy: 78, politics: 90, martial: 25, achievement: 62, charisma: 75,
    hp: 600, atk: 35, def: 40, speed: 38, morale: 80, range: 50, vision: 100,
    personality: { aggressiveness: 15, caution: 90, discipline: 92, greed: 8, loyalty: 88 },
    skills: ['rally', 'heal'],
  }),
  g({
    id: 'zhugejin', name: '诸葛瑾', faction: 'wu', troopType: 'infantry', rarity: 'elite', color: WU,
    command: 65, strategy: 80, politics: 85, martial: 32, achievement: 60, charisma: 82,
    hp: 650, atk: 40, def: 45, speed: 42, morale: 82, range: 50, vision: 110,
    personality: { aggressiveness: 20, caution: 82, discipline: 88, greed: 8, loyalty: 92 },
    skills: ['inspire', 'heal'],
  }),
  g({
    id: 'lvfan', name: '吕范', faction: 'wu', troopType: 'spearman', rarity: 'normal', color: WU,
    command: 72, strategy: 65, politics: 68, martial: 62, achievement: 55, charisma: 60,
    hp: 850, atk: 60, def: 62, speed: 48, morale: 78, range: 50, vision: 90,
    personality: { aggressiveness: 42, caution: 65, discipline: 82, greed: 18, loyalty: 85 },
    skills: ['fortify'],
  }),
]

// ===================================================================
// 群 (Qun) — 20 将
// ===================================================================
export const QUN_GENERALS: General[] = [
  g({
    id: 'lvbu', name: '吕布', faction: 'qun', troopType: 'cavalry', rarity: 'legend', color: QUN,
    command: 70, strategy: 40, politics: 20, martial: 100, achievement: 72, charisma: 45,
    hp: 1200, atk: 98, def: 65, speed: 75, morale: 65, range: 50, vision: 85,
    personality: { aggressiveness: 98, caution: 5, discipline: 20, greed: 90, loyalty: 10 },
    skills: ['duel', 'charge'],
  }),
  g({
    id: 'yuanshao', name: '袁绍', faction: 'qun', troopType: 'infantry', rarity: 'elite', color: QUN,
    command: 72, strategy: 60, politics: 70, martial: 55, achievement: 75, charisma: 72,
    hp: 850, atk: 55, def: 58, speed: 45, morale: 78, range: 50, vision: 100,
    personality: { aggressiveness: 55, caution: 60, discipline: 60, greed: 70, loyalty: 50 },
    skills: ['inspire'],
  }),
  g({
    id: 'huangfusong', name: '皇甫嵩', faction: 'qun', troopType: 'infantry', rarity: 'elite', color: QUN,
    command: 88, strategy: 78, politics: 72, martial: 75, achievement: 78, charisma: 80,
    hp: 920, atk: 72, def: 68, speed: 50, morale: 88, range: 50, vision: 105,
    personality: { aggressiveness: 55, caution: 65, discipline: 92, greed: 15, loyalty: 95 },
    skills: ['fortify', 'rally'],
  }),
  g({
    id: 'gongsunzan', name: '公孙瓒', faction: 'qun', troopType: 'cavalry', rarity: 'normal', color: QUN,
    command: 75, strategy: 50, politics: 48, martial: 82, achievement: 62, charisma: 60,
    hp: 920, atk: 78, def: 55, speed: 68, morale: 75, range: 50, vision: 90,
    personality: { aggressiveness: 78, caution: 30, discipline: 55, greed: 55, loyalty: 60 },
    skills: ['charge'],
  }),
  g({
    id: 'chengong', name: '陈宫', faction: 'qun', troopType: 'infantry', rarity: 'elite', color: QUN,
    command: 70, strategy: 90, politics: 72, martial: 35, achievement: 60, charisma: 72,
    hp: 650, atk: 42, def: 45, speed: 48, morale: 80, range: 50, vision: 125,
    personality: { aggressiveness: 45, caution: 70, discipline: 78, greed: 20, loyalty: 90 },
    skills: ['stratagem', 'fire_attack'],
  }),
  g({
    id: 'tianfeng', name: '田丰', faction: 'qun', troopType: 'infantry', rarity: 'elite', color: QUN,
    command: 68, strategy: 88, politics: 80, martial: 30, achievement: 58, charisma: 70,
    hp: 640, atk: 40, def: 48, speed: 42, morale: 82, range: 50, vision: 120,
    personality: { aggressiveness: 30, caution: 90, discipline: 88, greed: 10, loyalty: 95 },
    skills: ['stratagem', 'heal'],
  }),
  g({
    id: 'jushou', name: '沮授', faction: 'qun', troopType: 'shield', rarity: 'elite', color: QUN,
    command: 78, strategy: 85, politics: 78, martial: 38, achievement: 60, charisma: 75,
    hp: 700, atk: 42, def: 55, speed: 42, morale: 85, range: 50, vision: 115,
    personality: { aggressiveness: 30, caution: 82, discipline: 85, greed: 12, loyalty: 92 },
    skills: ['fortify', 'rally'],
  }),
  g({
    id: 'dongzhuo', name: '董卓', faction: 'qun', troopType: 'cavalry', rarity: 'elite', color: QUN,
    command: 75, strategy: 55, politics: 50, martial: 78, achievement: 72, charisma: 30,
    hp: 950, atk: 75, def: 60, speed: 50, morale: 65, range: 50, vision: 85,
    personality: { aggressiveness: 80, caution: 30, discipline: 40, greed: 95, loyalty: 15 },
    skills: ['roar'],
  }),
  g({
    id: 'zhangxiu', name: '张绣', faction: 'qun', troopType: 'cavalry', rarity: 'normal', color: QUN,
    command: 70, strategy: 58, politics: 42, martial: 80, achievement: 55, charisma: 50,
    hp: 900, atk: 75, def: 55, speed: 62, morale: 70, range: 50, vision: 88,
    personality: { aggressiveness: 72, caution: 40, discipline: 55, greed: 60, loyalty: 45 },
    skills: ['ambush'],
  }),
  g({
    id: 'mateng', name: '马腾', faction: 'qun', troopType: 'cavalry', rarity: 'normal', color: QUN,
    command: 78, strategy: 55, politics: 55, martial: 82, achievement: 62, charisma: 72,
    hp: 950, atk: 78, def: 58, speed: 62, morale: 80, range: 50, vision: 92,
    personality: { aggressiveness: 68, caution: 40, discipline: 65, greed: 40, loyalty: 82 },
    skills: ['charge', 'inspire'],
  }),
  // ---- 新增 ----
  g({
    id: 'yanliang', name: '颜良', faction: 'qun', troopType: 'cavalry', rarity: 'elite', color: QUN,
    command: 68, strategy: 38, politics: 25, martial: 92, achievement: 55, charisma: 48,
    hp: 1050, atk: 88, def: 58, speed: 65, morale: 75, range: 50, vision: 78,
    personality: { aggressiveness: 92, caution: 10, discipline: 55, greed: 50, loyalty: 72 },
    skills: ['charge', 'duel'],
  }),
  g({
    id: 'wenchou', name: '文丑', faction: 'qun', troopType: 'cavalry', rarity: 'elite', color: QUN,
    command: 65, strategy: 35, politics: 22, martial: 90, achievement: 52, charisma: 45,
    hp: 1020, atk: 86, def: 55, speed: 62, morale: 72, range: 50, vision: 75,
    personality: { aggressiveness: 90, caution: 12, discipline: 50, greed: 55, loyalty: 70 },
    skills: ['duel', 'roar'],
  }),
  g({
    id: 'gaoshun', name: '高顺', faction: 'qun', troopType: 'spearman', rarity: 'elite', color: QUN,
    command: 82, strategy: 58, politics: 42, martial: 82, achievement: 60, charisma: 65,
    hp: 980, atk: 78, def: 72, speed: 48, morale: 88, range: 50, vision: 88,
    personality: { aggressiveness: 65, caution: 45, discipline: 95, greed: 10, loyalty: 95 },
    skills: ['fortify', 'charge'],
  }),
  g({
    id: 'huaxiong', name: '华雄', faction: 'qun', troopType: 'cavalry', rarity: 'normal', color: QUN,
    command: 60, strategy: 35, politics: 22, martial: 85, achievement: 42, charisma: 38,
    hp: 980, atk: 82, def: 55, speed: 60, morale: 68, range: 50, vision: 75,
    personality: { aggressiveness: 92, caution: 8, discipline: 40, greed: 65, loyalty: 55 },
    skills: ['duel'],
  }),
  g({
    id: 'zhangjiao', name: '张角', faction: 'qun', troopType: 'archer', rarity: 'elite', color: QUN,
    command: 72, strategy: 78, politics: 68, martial: 42, achievement: 70, charisma: 88,
    hp: 720, atk: 48, def: 42, speed: 45, morale: 85, range: 140, vision: 110,
    personality: { aggressiveness: 55, caution: 55, discipline: 62, greed: 42, loyalty: 68 },
    skills: ['fire_attack', 'inspire'],
  }),
  g({
    id: 'menghuo', name: '孟获', faction: 'qun', troopType: 'infantry', rarity: 'elite', color: QUN,
    command: 62, strategy: 28, politics: 22, martial: 85, achievement: 48, charisma: 65,
    hp: 1100, atk: 80, def: 68, speed: 48, morale: 82, range: 50, vision: 75,
    personality: { aggressiveness: 88, caution: 8, discipline: 30, greed: 55, loyalty: 78 },
    skills: ['roar', 'charge'],
  }),
  g({
    id: 'zhurong', name: '祝融', faction: 'qun', troopType: 'archer', rarity: 'elite', color: QUN,
    command: 55, strategy: 42, politics: 28, martial: 82, achievement: 42, charisma: 62,
    hp: 880, atk: 75, def: 50, speed: 58, morale: 78, range: 140, vision: 95,
    personality: { aggressiveness: 82, caution: 15, discipline: 45, greed: 40, loyalty: 85 },
    skills: ['fire_attack', 'snipe'],
  }),
  g({
    id: 'zhangren', name: '张任', faction: 'qun', troopType: 'archer', rarity: 'normal', color: QUN,
    command: 72, strategy: 65, politics: 48, martial: 78, achievement: 48, charisma: 62,
    hp: 860, atk: 72, def: 58, speed: 50, morale: 82, range: 150, vision: 100,
    personality: { aggressiveness: 58, caution: 55, discipline: 78, greed: 18, loyalty: 90 },
    skills: ['snipe', 'ambush'],
  }),
  g({
    id: 'liubiao', name: '刘表', faction: 'qun', troopType: 'infantry', rarity: 'normal', color: QUN,
    command: 60, strategy: 62, politics: 78, martial: 35, achievement: 58, charisma: 68,
    hp: 720, atk: 42, def: 50, speed: 40, morale: 75, range: 50, vision: 95,
    personality: { aggressiveness: 20, caution: 85, discipline: 72, greed: 35, loyalty: 55 },
    skills: ['rally'],
  }),
  g({
    id: 'yanliangwenchou_gongsun', name: '公孙续', faction: 'qun', troopType: 'cavalry', rarity: 'normal', color: QUN,
    command: 58, strategy: 40, politics: 35, martial: 72, achievement: 38, charisma: 48,
    hp: 860, atk: 68, def: 50, speed: 65, morale: 70, range: 50, vision: 82,
    personality: { aggressiveness: 72, caution: 30, discipline: 50, greed: 45, loyalty: 65 },
    skills: ['charge'],
  }),
]

// ===================================================================
// 神将 (God-tier) — 超强化版本，以一当十
// ===================================================================
export const GOD_GENERALS: General[] = [
  g({
    id: 'god_lvbu', name: '神·吕布', faction: 'qun', troopType: 'cavalry', rarity: 'legend', color: '#ff4444',
    command: 85, strategy: 60, politics: 30, martial: 100, achievement: 95, charisma: 70,
    hp: 4000, atk: 220, def: 150, speed: 85, morale: 100, range: 60, vision: 120,
    personality: { aggressiveness: 100, caution: 0, discipline: 30, greed: 90, loyalty: 10 },
    skills: ['duel', 'charge', 'roar'],
    tags: ['god'],
  }),
  g({
    id: 'god_guanyu', name: '神·关羽', faction: 'shu', troopType: 'cavalry', rarity: 'legend', color: '#ff6666',
    command: 92, strategy: 80, politics: 70, martial: 100, achievement: 98, charisma: 100,
    hp: 3500, atk: 200, def: 160, speed: 75, morale: 100, range: 60, vision: 130,
    personality: { aggressiveness: 80, caution: 30, discipline: 85, greed: 30, loyalty: 100 },
    skills: ['duel', 'roar', 'inspire'],
    tags: ['god'],
  }),
  g({
    id: 'god_zhugeliang', name: '神·诸葛亮', faction: 'shu', troopType: 'archer', rarity: 'legend', color: '#ff8888',
    command: 100, strategy: 100, politics: 100, martial: 50, achievement: 100, charisma: 100,
    hp: 2500, atk: 140, def: 100, speed: 60, morale: 100, range: 250, vision: 250,
    personality: { aggressiveness: 40, caution: 90, discipline: 100, greed: 5, loyalty: 100 },
    skills: ['fire_attack', 'stratagem', 'rally', 'heal'],
    tags: ['god'],
  }),
  g({
    id: 'god_caocao', name: '神·曹操', faction: 'wei', troopType: 'cavalry', rarity: 'legend', color: '#6699ff',
    command: 100, strategy: 98, politics: 100, martial: 80, achievement: 100, charisma: 95,
    hp: 3000, atk: 170, def: 140, speed: 70, morale: 100, range: 60, vision: 180,
    personality: { aggressiveness: 75, caution: 60, discipline: 95, greed: 60, loyalty: 70 },
    skills: ['stratagem', 'inspire', 'rally'],
    tags: ['god'],
  }),
  g({
    id: 'god_zhouyu', name: '神·周瑜', faction: 'wu', troopType: 'archer', rarity: 'legend', color: '#66ff88',
    command: 95, strategy: 100, politics: 90, martial: 75, achievement: 95, charisma: 95,
    hp: 2800, atk: 160, def: 120, speed: 68, morale: 100, range: 230, vision: 200,
    personality: { aggressiveness: 65, caution: 55, discipline: 90, greed: 40, loyalty: 90 },
    skills: ['fire_attack', 'stratagem', 'snipe'],
    tags: ['god'],
  }),
  g({
    id: 'god_zhaoyun', name: '神·赵云', faction: 'shu', troopType: 'cavalry', rarity: 'legend', color: '#ff9999',
    command: 88, strategy: 82, politics: 65, martial: 100, achievement: 92, charisma: 98,
    hp: 3800, atk: 210, def: 170, speed: 90, morale: 100, range: 60, vision: 140,
    personality: { aggressiveness: 75, caution: 50, discipline: 100, greed: 5, loyalty: 100 },
    skills: ['charge', 'duel', 'fortify'],
    tags: ['god'],
  }),
  g({
    id: 'god_simayi', name: '神·司马懿', faction: 'wei', troopType: 'infantry', rarity: 'legend', color: '#8888ff',
    command: 95, strategy: 100, politics: 95, martial: 65, achievement: 95, charisma: 75,
    hp: 2800, atk: 140, def: 160, speed: 55, morale: 100, range: 60, vision: 200,
    personality: { aggressiveness: 30, caution: 100, discipline: 100, greed: 85, loyalty: 40 },
    skills: ['fire_attack', 'fortify', 'ambush', 'stratagem'],
    tags: ['god'],
  }),
  g({
    id: 'god_sunce', name: '神·孙策', faction: 'wu', troopType: 'cavalry', rarity: 'legend', color: '#88ff88',
    command: 90, strategy: 75, politics: 70, martial: 98, achievement: 88, charisma: 98,
    hp: 3500, atk: 195, def: 140, speed: 82, morale: 100, range: 60, vision: 130,
    personality: { aggressiveness: 92, caution: 15, discipline: 72, greed: 50, loyalty: 85 },
    skills: ['charge', 'duel', 'roar', 'inspire'],
    tags: ['god'],
  }),
  // ---- 边缘势力神将 ----
  g({
    id: 'god_dongzhuo', name: '神·董卓', faction: 'dong', troopType: 'cavalry', rarity: 'legend', color: '#ff5555',
    command: 85, strategy: 70, politics: 75, martial: 88, achievement: 90, charisma: 40,
    hp: 3200, atk: 180, def: 150, speed: 65, morale: 100, range: 60, vision: 130,
    personality: { aggressiveness: 85, caution: 40, discipline: 50, greed: 100, loyalty: 15 },
    skills: ['roar', 'inspire', 'charge'],
    tags: ['god'],
  }),
  g({
    id: 'god_yuanshao', name: '神·袁绍', faction: 'yuan', troopType: 'cavalry', rarity: 'legend', color: '#aa88ff',
    command: 90, strategy: 78, politics: 88, martial: 70, achievement: 92, charisma: 88,
    hp: 2800, atk: 150, def: 140, speed: 60, morale: 100, range: 60, vision: 150,
    personality: { aggressiveness: 55, caution: 55, discipline: 75, greed: 65, loyalty: 55 },
    skills: ['inspire', 'rally', 'stratagem'],
    tags: ['god'],
  }),
  g({
    id: 'god_machao', name: '神·马超', faction: 'xiliang', troopType: 'cavalry', rarity: 'legend', color: '#ffcc55',
    command: 82, strategy: 60, politics: 42, martial: 100, achievement: 82, charisma: 78,
    hp: 3600, atk: 210, def: 130, speed: 92, morale: 100, range: 60, vision: 120,
    personality: { aggressiveness: 98, caution: 5, discipline: 55, greed: 65, loyalty: 60 },
    skills: ['charge', 'duel', 'roar'],
    tags: ['god'],
  }),
  g({
    id: 'god_wenpin', name: '神·文聘', faction: 'jingzhou', troopType: 'shield', rarity: 'legend', color: '#77ccaa',
    command: 92, strategy: 75, politics: 72, martial: 85, achievement: 78, charisma: 88,
    hp: 3500, atk: 160, def: 200, speed: 55, morale: 100, range: 60, vision: 120,
    personality: { aggressiveness: 42, caution: 72, discipline: 98, greed: 8, loyalty: 100 },
    skills: ['shield_wall', 'fortify', 'rally', 'inspire'],
    tags: ['god'],
  }),
  g({
    id: 'god_zhangren', name: '神·张任', faction: 'yizhou', troopType: 'archer', rarity: 'legend', color: '#aacc55',
    command: 85, strategy: 82, politics: 62, martial: 90, achievement: 72, charisma: 78,
    hp: 3000, atk: 175, def: 140, speed: 60, morale: 100, range: 220, vision: 180,
    personality: { aggressiveness: 62, caution: 58, discipline: 90, greed: 10, loyalty: 100 },
    skills: ['snipe', 'ambush', 'fortify'],
    tags: ['god'],
  }),
  g({
    id: 'god_simayan', name: '神·司马炎', faction: 'jin', troopType: 'cavalry', rarity: 'legend', color: '#aaaaff',
    command: 95, strategy: 88, politics: 95, martial: 65, achievement: 98, charisma: 85,
    hp: 2800, atk: 150, def: 145, speed: 62, morale: 100, range: 60, vision: 160,
    personality: { aggressiveness: 52, caution: 62, discipline: 85, greed: 60, loyalty: 72 },
    skills: ['stratagem', 'inspire', 'rally', 'heal'],
    tags: ['god'],
  }),
]

import { ALL_NEW_GENERALS } from './factions'

// ===== All generals =====
export const ALL_GENERALS: General[] = [
  ...WEI_GENERALS,
  ...SHU_GENERALS,
  ...WU_GENERALS,
  ...QUN_GENERALS,
  ...ALL_NEW_GENERALS,
]

// All including gods
export const ALL_GENERALS_WITH_GODS: General[] = [
  ...ALL_GENERALS,
  ...GOD_GENERALS,
]
