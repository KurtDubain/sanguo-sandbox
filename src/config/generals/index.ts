import { General } from '../../types'
import { WEI_GENERALS } from './wei'
import { SHU_GENERALS } from './shu'
import { WU_GENERALS } from './wu'
import { QUN_GENERALS } from './qun'
import { GOD_GENERALS } from './gods'
import { DONG_GENERALS } from './dong'
import { YUAN_GENERALS } from './yuan'
import { XILIANG_GENERALS } from './xiliang'
import { JINGZHOU_GENERALS } from './jingzhou'
import { YIZHOU_GENERALS } from './yizhou'
import { JIN_GENERALS } from './jin'

export {
  WEI_GENERALS, SHU_GENERALS, WU_GENERALS, QUN_GENERALS, GOD_GENERALS,
  DONG_GENERALS, YUAN_GENERALS, XILIANG_GENERALS, JINGZHOU_GENERALS,
  YIZHOU_GENERALS, JIN_GENERALS,
}

export const ALL_GENERALS: General[] = [
  ...WEI_GENERALS,
  ...SHU_GENERALS,
  ...WU_GENERALS,
  ...QUN_GENERALS,
  ...DONG_GENERALS,
  ...YUAN_GENERALS,
  ...XILIANG_GENERALS,
  ...JINGZHOU_GENERALS,
  ...YIZHOU_GENERALS,
  ...JIN_GENERALS,
]

export const ALL_GENERALS_WITH_GODS: General[] = [
  ...ALL_GENERALS,
  ...GOD_GENERALS,
]
