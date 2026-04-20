import { BattleMap, TerrainType } from '../../../types'
import { BALANCE } from '../../../config/balance'
import { TERRAIN_MODIFIERS } from '../../../config/balance'
import { SeededRandom } from '../random'
import { fbm } from './noise'
import { clearSpawnZones } from './helpers'
import { genValley, genPlains, genRiverDelta, genMountainPass, genSwamp, genTwinLakes, genOasis, genFrozenRiver, genWasteland, genWaterfall } from './natural'
import { genCrossroads, genFortress, genArena, genGreatWall, genStarfort, genSiegeCastle } from './fortified'
import { genLabyrinth, genIslands, genSpiral, genBagua, genVolcano, genDungeon, genChessboard, genAmbushValley } from './special'
import { genChangban, genChibi, genHulao, genJieting, genCanyonBridge, genThreeKingdoms } from './historic'

export type MapTemplate = 'valley' | 'crossroads' | 'fortress' | 'plains' | 'river_delta' | 'mountain_pass' | 'siege_castle' | 'changban' | 'chibi' | 'hulao' | 'jieting' | 'twin_lakes' | 'canyon_bridge' | 'three_kingdoms' | 'swamp' | 'labyrinth' | 'islands' | 'ambush_valley' | 'volcano' | 'great_wall' | 'spiral' | 'oasis' | 'frozen_river' | 'arena' | 'bagua' | 'wasteland' | 'waterfall' | 'starfort' | 'dungeon' | 'chessboard' | 'random'

const MAP_TEMPLATE_NAMES: Record<MapTemplate, string> = {
  valley: '峡谷', crossroads: '十字路口', fortress: '中央要塞',
  plains: '大平原', river_delta: '三叉河口', mountain_pass: '关隘',
  siege_castle: '攻城', changban: '长坂坡', chibi: '赤壁',
  hulao: '虎牢关', jieting: '街亭',
  twin_lakes: '双湖', canyon_bridge: '栈道', three_kingdoms: '三分天下', swamp: '沼泽',
  labyrinth: '迷宫', islands: '群岛', ambush_valley: '伏兵谷', volcano: '火山口', great_wall: '长城',
  spiral: '螺旋', oasis: '绿洲', frozen_river: '冰河', arena: '斗兽场', bagua: '八卦阵',
  wasteland: '荒原', waterfall: '瀑布峡', starfort: '棱堡', dungeon: '地牢', chessboard: '棋盘',
  random: '随机',
}
export { MAP_TEMPLATE_NAMES }

export function generateMap(rng: SeededRandom, template?: MapTemplate): BattleMap {
  const cols = Math.floor(BALANCE.MAP_WIDTH / BALANCE.CELL_SIZE)
  const rows = Math.floor(BALANCE.MAP_HEIGHT / BALANCE.CELL_SIZE)
  const terrain: TerrainType[][] = Array.from({ length: rows }, () => Array(cols).fill('plain'))
  const seed = rng.int(0, 99999)

  let tmpl = template ?? 'random'
  if (tmpl === 'random') {
    tmpl = rng.pick(['valley', 'crossroads', 'fortress', 'plains', 'river_delta', 'mountain_pass', 'changban', 'chibi', 'hulao', 'jieting', 'twin_lakes', 'canyon_bridge', 'three_kingdoms', 'swamp', 'labyrinth', 'islands', 'ambush_valley', 'volcano', 'great_wall', 'spiral', 'oasis', 'frozen_river', 'arena', 'bagua', 'wasteland', 'waterfall', 'starfort', 'dungeon', 'chessboard'])
  }

  switch (tmpl) {
    case 'valley': genValley(terrain, cols, rows, rng, seed); break
    case 'crossroads': genCrossroads(terrain, cols, rows, rng, seed); break
    case 'fortress': genFortress(terrain, cols, rows, rng, seed); break
    case 'plains': genPlains(terrain, cols, rows, rng, seed); break
    case 'river_delta': genRiverDelta(terrain, cols, rows, rng, seed); break
    case 'mountain_pass': genMountainPass(terrain, cols, rows, rng, seed); break
    case 'siege_castle': genSiegeCastle(terrain, cols, rows, rng, seed); break
    case 'changban': genChangban(terrain, cols, rows, rng, seed); break
    case 'chibi': genChibi(terrain, cols, rows, rng, seed); break
    case 'hulao': genHulao(terrain, cols, rows, rng, seed); break
    case 'jieting': genJieting(terrain, cols, rows, rng, seed); break
    case 'twin_lakes': genTwinLakes(terrain, cols, rows, rng, seed); break
    case 'canyon_bridge': genCanyonBridge(terrain, cols, rows, rng, seed); break
    case 'three_kingdoms': genThreeKingdoms(terrain, cols, rows, rng, seed); break
    case 'swamp': genSwamp(terrain, cols, rows, rng, seed); break
    case 'labyrinth': genLabyrinth(terrain, cols, rows, rng, seed); break
    case 'islands': genIslands(terrain, cols, rows, rng, seed); break
    case 'ambush_valley': genAmbushValley(terrain, cols, rows, rng, seed); break
    case 'volcano': genVolcano(terrain, cols, rows, rng, seed); break
    case 'great_wall': genGreatWall(terrain, cols, rows, rng, seed); break
    case 'spiral': genSpiral(terrain, cols, rows, rng, seed); break
    case 'oasis': genOasis(terrain, cols, rows, rng, seed); break
    case 'frozen_river': genFrozenRiver(terrain, cols, rows, rng, seed); break
    case 'arena': genArena(terrain, cols, rows, rng, seed); break
    case 'bagua': genBagua(terrain, cols, rows, rng, seed); break
    case 'wasteland': genWasteland(terrain, cols, rows, rng, seed); break
    case 'waterfall': genWaterfall(terrain, cols, rows, rng, seed); break
    case 'starfort': genStarfort(terrain, cols, rows, rng, seed); break
    case 'dungeon': genDungeon(terrain, cols, rows, rng, seed); break
    case 'chessboard': genChessboard(terrain, cols, rows, rng, seed); break
  }

  // Noise-based forest scatter (only on plain cells)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (terrain[y][x] !== 'plain') continue
      const n = fbm(x, y, seed + 500)
      if (n > 0.6 && n < 0.7) terrain[y][x] = 'forest'
    }
  }

  // LAST STEP: clear spawn zones — 4 corners + edge midpoints, guaranteed safe
  clearSpawnZones(terrain, cols, rows)

  return { width: BALANCE.MAP_WIDTH, height: BALANCE.MAP_HEIGHT, terrain, cellSize: BALANCE.CELL_SIZE }
}

export function getTerrainAt(map: BattleMap, x: number, y: number): TerrainType {
  const col = Math.floor(x / map.cellSize)
  const row = Math.floor(y / map.cellSize)
  if (row < 0 || row >= map.terrain.length || col < 0 || col >= map.terrain[0].length) return 'plain'
  return map.terrain[row][col]
}

export function isPassable(map: BattleMap, x: number, y: number): boolean {
  return TERRAIN_MODIFIERS[getTerrainAt(map, x, y)].passable
}
