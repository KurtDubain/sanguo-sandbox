// Historical battle presets and tournament mode configuration

import { MapTemplate } from '../engine/utils/mapgen'
import { BattleMode } from '../types'

export interface HistoricalBattle {
  id: string
  name: string
  description: string
  year: string
  factions: { faction: string; generalIds: string[] }[]
  alliances?: string[][]  // e.g. [['shu','wu'],['wei']] — allied factions
  mapTemplate: MapTemplate
  mode: BattleMode
  specialRules?: {
    weather?: 'rain' | 'wind' | 'fog'
    noDangerZone?: boolean
    noSupply?: boolean
  }
}

export const HISTORICAL_BATTLES: HistoricalBattle[] = [
  {
    id: 'guandu',
    name: '官渡之战',
    description: '曹操以少胜多击败袁绍，奠定北方统一',
    year: '200年',
    factions: [
      { faction: 'wei', generalIds: ['caocao', 'guojia', 'xunyu', 'xuhuang', 'zhangliao', 'caoren', 'yujin', 'yuejin', 'lidian', 'xuchu'] },
      { faction: 'qun', generalIds: ['yuanshao', 'yanliang', 'wenchou', 'tianfeng', 'jushou', 'gaoshun', 'zhanghe'] },
    ],
    mapTemplate: 'plains',
    mode: 'faction_battle',
  },
  {
    id: 'chibi',
    name: '赤壁之战',
    description: '孙刘联军火攻曹操，奠定三分天下',
    year: '208年',
    alliances: [['wu', 'shu'], ['wei']],
    factions: [
      { faction: 'wei', generalIds: ['caocao', 'simayi', 'zhangliao', 'xuhuang', 'caoren', 'dianwei', 'xuchu', 'caohong', 'yujin', 'pangde'] },
      { faction: 'wu', generalIds: ['zhouyu', 'sunquan', 'lusu', 'huanggai', 'ganning', 'taishici', 'chengpu', 'zhoutai', 'lingtong', 'handang'] },
      { faction: 'shu', generalIds: ['liubei', 'zhugeliang', 'guanyu', 'zhangfei', 'zhaoyun'] },
    ],
    mapTemplate: 'river_delta',
    mode: 'faction_battle',
    specialRules: { weather: 'wind' },
  },
  {
    id: 'yiling',
    name: '夷陵之战',
    description: '陆逊火烧连营击败刘备，蜀汉元气大伤',
    year: '222年',
    factions: [
      { faction: 'shu', generalIds: ['liubei', 'zhangfei', 'zhaoyun', 'machao', 'huangzhong', 'weiyan', 'guanxing', 'zhangbao', 'madai', 'liaohua'] },
      { faction: 'wu', generalIds: ['luxun', 'sunquan', 'lvmeng', 'ganning', 'zhoutai', 'zhuran', 'dingfeng', 'xusheng', 'lingtong', 'lukang'] },
    ],
    mapTemplate: 'valley',
    mode: 'faction_battle',
  },
  {
    id: 'hulao',
    name: '虎牢关之战',
    description: '三英战吕布，十八路诸侯讨董',
    year: '190年',
    alliances: [['shu', 'wei', 'wu'], ['qun']],
    factions: [
      { faction: 'qun', generalIds: ['lvbu', 'dongzhuo', 'huaxiong', 'gaoshun', 'zhangxiu'] },
      { faction: 'shu', generalIds: ['liubei', 'guanyu', 'zhangfei'] },
      { faction: 'wei', generalIds: ['caocao', 'xiahoudun', 'xiahouyuan', 'caoren', 'caohong'] },
      { faction: 'wu', generalIds: ['sunce', 'sunquan', 'huanggai', 'chengpu'] },
    ],
    mapTemplate: 'mountain_pass',
    mode: 'faction_battle',
  },
  {
    id: 'wuzhang',
    name: '五丈原之战',
    description: '诸葛亮最后北伐，与司马懿对峙',
    year: '234年',
    factions: [
      { faction: 'shu', generalIds: ['zhugeliang', 'jiangwei', 'weiyan', 'wangping', 'madai', 'liaohua', 'yanyan', 'feiyi'] },
      { faction: 'wei', generalIds: ['simayi', 'zhanghe', 'dengai', 'zhonghui', 'guojia', 'jiaxu', 'xuhuang', 'yujin'] },
    ],
    mapTemplate: 'fortress',
    mode: 'faction_battle',
    specialRules: { noDangerZone: true },
  },
  // ---- NEW: using new factions ----
  {
    id: 'dongzhuo_luoyang',
    name: '董卓进京',
    description: '董卓挟天子令诸侯，十八路诸侯起兵讨伐',
    year: '190年',
    alliances: [['wei', 'shu', 'wu'], ['dong']],
    factions: [
      { faction: 'dong', generalIds: ['d_dongzhuo', 'd_lvbu', 'd_huaxiong', 'd_gaoshun', 'd_chenggong', 'd_lijue2', 'd_libu', 'd_guosi', 'd_niufu', 'd_zhangji'] },
      { faction: 'wei', generalIds: ['caocao', 'xiahoudun', 'xiahouyuan', 'caoren', 'caohong', 'dianwei'] },
      { faction: 'shu', generalIds: ['liubei', 'guanyu', 'zhangfei'] },
      { faction: 'wu', generalIds: ['sunce', 'huanggai', 'chengpu', 'handang'] },
    ],
    mapTemplate: 'hulao',
    mode: 'faction_battle',
  },
  {
    id: 'machao_xiliang',
    name: '潼关之战',
    description: '马超韩遂联军对曹操西征军',
    year: '211年',
    factions: [
      { faction: 'xiliang', generalIds: ['xl_machao2', 'xl_mateng', 'xl_hansui', 'xl_pangde2', 'xl_madai2', 'xl_yanxing', 'xl_chengyi', 'xl_liangxing'] },
      { faction: 'wei', generalIds: ['caocao', 'xuhuang', 'xuchu', 'dianwei', 'caoren', 'yujin', 'zhangliao', 'xiahouyuan'] },
    ],
    mapTemplate: 'valley',
    mode: 'faction_battle',
  },
  {
    id: 'changban',
    name: '长坂坡之战',
    description: '赵云七进七出，张飞据桥退敌',
    year: '208年',
    factions: [
      { faction: 'shu', generalIds: ['zhaoyun', 'zhangfei', 'liubei'] },
      { faction: 'wei', generalIds: ['caocao', 'xiahoudun', 'xuchu', 'zhangliao', 'xuhuang', 'caohong', 'yuejin', 'lidian'] },
    ],
    mapTemplate: 'changban',
    mode: 'faction_battle',
  },
  {
    id: 'jin_destroy_wu',
    name: '晋灭吴之战',
    description: '西晋大举南征，一统三国',
    year: '280年',
    factions: [
      { faction: 'jin', generalIds: ['j_simayan', 'j_duyu', 'j_wangjun', 'j_yanghu', 'j_wenjyang', 'j_jiachong', 'j_dengai2', 'j_zhonghui2'] },
      { faction: 'wu', generalIds: ['sunquan', 'lukang', 'dingfeng', 'zhoutai', 'zhuran', 'xusheng', 'zhangzhao', 'zhugejin', 'lvfan'] },
    ],
    mapTemplate: 'river_delta',
    mode: 'faction_battle',
  },
  {
    id: 'jieting',
    name: '街亭之战',
    description: '马谡失街亭，诸葛亮挥泪斩马谡',
    year: '228年',
    factions: [
      { faction: 'shu', generalIds: ['zhugeliang', 'jiangwei', 'wangping', 'madai', 'liaohua', 'weiyan'] },
      { faction: 'wei', generalIds: ['simayi', 'zhanghe', 'dengai', 'guojia', 'caoren', 'xuhuang'] },
    ],
    mapTemplate: 'jieting',
    mode: 'faction_battle',
  },
  {
    id: 'liuzhang_yizhou',
    name: '入蜀之战',
    description: '刘备入川夺取益州',
    year: '214年',
    factions: [
      { faction: 'shu', generalIds: ['liubei', 'zhugeliang', 'zhangfei', 'zhaoyun', 'weiyan', 'huangzhong', 'machao'] },
      { faction: 'yizhou', generalIds: ['yz_liuzhang', 'yz_zhangren2', 'yz_yanyan2', 'yz_huangquan', 'yz_wuyi', 'yz_mengda', 'yz_fazheng2', 'yz_leiton'] },
    ],
    mapTemplate: 'fortress',
    mode: 'faction_battle',
  },
  {
    id: 'chibi_fire',
    name: '赤壁火攻',
    description: '周瑜火烧赤壁，借东风大破曹军',
    year: '208年',
    factions: [
      { faction: 'wu', generalIds: ['zhouyu', 'sunquan', 'huanggai', 'lusu', 'ganning', 'taishici', 'chengpu', 'zhoutai', 'lingtong'] },
      { faction: 'wei', generalIds: ['caocao', 'simayi', 'zhangliao', 'caoren', 'xuchu', 'dianwei', 'xuhuang', 'yujin', 'pangde', 'lidian'] },
    ],
    mapTemplate: 'chibi',
    mode: 'faction_battle',
    specialRules: { weather: 'wind' },
  },
  // ---- 新增联盟战役 ----
  {
    id: 'guanduAlliance',
    name: '官渡决战',
    description: '曹操联合刘备对抗袁绍大军',
    year: '200年',
    alliances: [['wei', 'shu'], ['yuan']],
    factions: [
      { faction: 'wei', generalIds: ['caocao', 'guojia', 'xunyu', 'xuhuang', 'zhangliao', 'caoren', 'yujin', 'dianwei', 'xuchu'] },
      { faction: 'shu', generalIds: ['liubei', 'guanyu', 'zhangfei'] },
      { faction: 'yuan', generalIds: ['y_yuanshao', 'y_yanliang', 'y_wenchou', 'y_tianfeng', 'y_jushou', 'y_zhanghe2', 'y_gaolan', 'y_shenpei', 'y_chunyuqiong', 'y_xupei', 'y_yuantan', 'y_yuanshang'] },
    ],
    mapTemplate: 'plains',
    mode: 'faction_battle',
  },
  {
    id: 'hanzhong',
    name: '汉中之战',
    description: '刘备与曹操争夺汉中，黄忠斩夏侯渊',
    year: '219年',
    factions: [
      { faction: 'shu', generalIds: ['liubei', 'zhugeliang', 'zhaoyun', 'zhangfei', 'huangzhong', 'weiyan', 'machao', 'fazheng'] },
      { faction: 'wei', generalIds: ['caocao', 'xiahouyuan', 'xuhuang', 'zhanghe', 'caohong', 'xuchu', 'yujin'] },
    ],
    mapTemplate: 'valley',
    mode: 'faction_battle',
  },
  {
    id: 'fancheng',
    name: '樊城之战',
    description: '关羽水淹七军，威震华夏，后遭吴魏夹击',
    year: '219年',
    alliances: [['wei', 'wu'], ['shu']],
    factions: [
      { faction: 'shu', generalIds: ['guanyu', 'guanping', 'guanxing', 'liaohua'] },
      { faction: 'wei', generalIds: ['caoren', 'xuhuang', 'yujin', 'pangde', 'xuchu'] },
      { faction: 'wu', generalIds: ['lvmeng', 'luxun', 'lingtong', 'dingfeng'] },
    ],
    mapTemplate: 'river_delta',
    mode: 'faction_battle',
  },
  {
    id: 'sanchakou',
    name: '三方混战',
    description: '魏蜀吴三方势均力敌，鹿死谁手',
    year: '220年',
    factions: [
      { faction: 'wei', generalIds: ['caocao', 'simayi', 'zhangliao', 'xiahoudun', 'dianwei', 'xuchu', 'guojia', 'caoren'] },
      { faction: 'shu', generalIds: ['liubei', 'zhugeliang', 'guanyu', 'zhangfei', 'zhaoyun', 'machao', 'huangzhong', 'weiyan'] },
      { faction: 'wu', generalIds: ['sunquan', 'zhouyu', 'luxun', 'sunce', 'ganning', 'taishici', 'zhoutai', 'huanggai'] },
    ],
    mapTemplate: 'three_kingdoms',
    mode: 'faction_battle',
  },
  {
    id: 'wuhu_vs_world',
    name: '五虎上将',
    description: '蜀汉五虎将对抗群雄',
    year: '221年',
    factions: [
      { faction: 'shu', generalIds: ['guanyu', 'zhangfei', 'zhaoyun', 'machao', 'huangzhong'] },
      { faction: 'wei', generalIds: ['zhangliao', 'xiahoudun', 'xuhuang', 'dianwei', 'xuchu', 'zhanghe', 'caoren', 'pangde'] },
    ],
    mapTemplate: 'arena',
    mode: 'faction_battle',
  },
  {
    id: 'xiliang_rebellion',
    name: '西凉叛乱',
    description: '马腾韩遂联合群雄起兵反曹',
    year: '211年',
    alliances: [['xiliang', 'qun'], ['wei']],
    factions: [
      { faction: 'xiliang', generalIds: ['xl_machao2', 'xl_mateng', 'xl_hansui', 'xl_pangde2', 'xl_madai2', 'xl_yanxing', 'xl_jiaxu'] },
      { faction: 'qun', generalIds: ['lvbu', 'gongsunzan', 'zhangxiu', 'mateng'] },
      { faction: 'wei', generalIds: ['caocao', 'simayi', 'xuchu', 'dianwei', 'caoren', 'yujin', 'zhangliao', 'xiahouyuan', 'xuhuang', 'jiaxu'] },
    ],
    mapTemplate: 'mountain_pass',
    mode: 'faction_battle',
  },
]

// Tournament bracket generation
export interface TournamentMatch {
  id: number
  round: number
  teamA: string[] // general IDs
  teamB: string[] // general IDs
  winner: 'A' | 'B' | null
  factionA?: string
  factionB?: string
}

export interface TournamentState {
  matches: TournamentMatch[]
  currentMatch: number
  totalRounds: number
  champion: string | null  // faction or general name
  completed: boolean
}

export function createTournament(
  factions: { name: string; generalIds: string[] }[],
): TournamentState {
  // Simple single-elimination bracket
  // Pad to power of 2
  const n = factions.length
  let roundSize = 1
  while (roundSize < n) roundSize *= 2

  const paddedFactions = [...factions]
  while (paddedFactions.length < roundSize) {
    paddedFactions.push({ name: 'BYE', generalIds: [] })
  }

  const matches: TournamentMatch[] = []
  let matchId = 0
  let round = 1

  // First round
  for (let i = 0; i < paddedFactions.length; i += 2) {
    const isBye = paddedFactions[i + 1].name === 'BYE'
    matches.push({
      id: matchId++,
      round,
      teamA: paddedFactions[i].generalIds,
      teamB: paddedFactions[i + 1].generalIds,
      winner: isBye ? 'A' : null,
      factionA: paddedFactions[i].name,
      factionB: paddedFactions[i + 1].name,
    })
  }

  // Subsequent rounds (empty, filled as results come in)
  let prevRoundMatches = matches.length
  while (prevRoundMatches > 1) {
    round++
    const nextRoundSize = Math.floor(prevRoundMatches / 2)
    for (let i = 0; i < nextRoundSize; i++) {
      matches.push({
        id: matchId++,
        round,
        teamA: [],
        teamB: [],
        winner: null,
      })
    }
    prevRoundMatches = nextRoundSize
  }

  return {
    matches,
    currentMatch: 0,
    totalRounds: round,
    champion: null,
    completed: false,
  }
}
