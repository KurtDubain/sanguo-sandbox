// Formation (阵法) system: pre-battle formation buffs

export type FormationType = 'none' | 'heyi' | 'zhuixing' | 'fangyuan' | 'yulin' | 'yanxing' | 'changshezhen'

export interface FormationDef {
  id: FormationType
  name: string
  description: string
  buffs: {
    atkMult?: number
    defMult?: number
    speedMult?: number
    rangeMult?: number
    moraleMult?: number
    chargeMult?: number  // cavalry charge bonus
  }
  // Which troop types benefit most
  bestFor: string[]
}

export const FORMATIONS: Record<FormationType, FormationDef> = {
  none: {
    id: 'none', name: '无阵', description: '自由作战，无额外加成',
    buffs: {}, bestFor: [],
  },
  heyi: {
    id: 'heyi', name: '鹤翼阵', description: '展开如鹤翼，弓兵射程和攻击力提升',
    buffs: { rangeMult: 1.15, atkMult: 1.12 },
    bestFor: ['archer'],
  },
  zhuixing: {
    id: 'zhuixing', name: '锥形阵', description: '锐利突击阵型，骑兵冲锋加成大幅提升',
    buffs: { speedMult: 1.1, chargeMult: 1.35, atkMult: 1.08 },
    bestFor: ['cavalry'],
  },
  fangyuan: {
    id: 'fangyuan', name: '方圆阵', description: '龟甲防御，全军防御和士气大幅提升',
    buffs: { defMult: 1.25, moraleMult: 1.1, speedMult: 0.9 },
    bestFor: ['shield', 'infantry'],
  },
  yulin: {
    id: 'yulin', name: '鱼鳞阵', description: '紧密鳞甲阵，近战攻击和防御均衡提升',
    buffs: { atkMult: 1.15, defMult: 1.1 },
    bestFor: ['infantry', 'spearman'],
  },
  yanxing: {
    id: 'yanxing', name: '雁行阵', description: '斜线排列如飞雁，侧击加成提升',
    buffs: { speedMult: 1.08, atkMult: 1.1 },
    bestFor: ['cavalry', 'infantry'],
  },
  changshezhen: {
    id: 'changshezhen', name: '长蛇阵', description: '首尾呼应，移速快但防御略降',
    buffs: { speedMult: 1.2, defMult: 0.92, moraleMult: 1.05 },
    bestFor: ['cavalry', 'spearman'],
  },
}

export const FORMATION_LIST = Object.values(FORMATIONS)
