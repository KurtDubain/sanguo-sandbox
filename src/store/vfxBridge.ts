// VFX bridge: processes game events and generates visual effects

import { VFXManager } from '../engine/utils/vfx'
import { GameEvent, BattleState } from '../types'

export const vfxManager = new VFXManager()

export function processEventsForVFX(events: GameEvent[], units: BattleState['units']) {
  for (const ev of events) {
    const source = ev.sourceId ? units.find((u) => u.id === ev.sourceId) : null
    const target = ev.targetId ? units.find((u) => u.id === ev.targetId) : null

    switch (ev.type) {
      case 'attack':
        if (target && source) {
          const isCrit = ev.message.includes('暴击')
          vfxManager.addDamageNumber(target.position.x, target.position.y, ev.value ?? 0, isCrit)
          vfxManager.addHitFlash(target.position.x, target.position.y)
          const isMelee = source.range <= 60
          vfxManager.addProjectile(
            source.position.x, source.position.y,
            target.position.x, target.position.y,
            isMelee ? 'slash' : 'arrow',
            source.color,
          )
        }
        break
      case 'kill':
        if (target) {
          vfxManager.addDeath(target.position.x, target.position.y, target.name, target.color)
          vfxManager.removeTrail(target.id)
        }
        break
      case 'duel':
        if (source && target && ev.message.includes('开始')) {
          vfxManager.setDuel(
            source.position.x, source.position.y,
            target.position.x, target.position.y,
            source.name, target.name,
          )
        } else if (ev.message.includes('胜') || ev.message.includes('斩杀')) {
          vfxManager.clearDuel()
        }
        break
      case 'skill_trigger':
        if (source) {
          vfxManager.addSkillBurst(
            source.position.x, source.position.y,
            60, ev.message, source.color
          )
        }
        break
      case 'morale_rout':
        if (source) {
          vfxManager.addMoraleText(source.position.x, source.position.y, '溃败!')
        }
        break
      case 'morale_break':
        if (source) {
          vfxManager.addMoraleText(source.position.x, source.position.y, '动摇!')
        }
        break
      case 'morale_recover':
        if (source) {
          vfxManager.addHealNumber(source.position.x, source.position.y, 0)
          vfxManager.addMoraleText(source.position.x, source.position.y, '恢复!')
        }
        break
    }
  }
}

export function updateTrails(units: BattleState['units']) {
  for (const u of units) {
    if (u.state === 'dead') continue
    if (u.state === 'moving' || u.state === 'attacking') {
      vfxManager.updateTrail(u.id, u.position.x, u.position.y, u.color)
    }
  }
}

export function updateDuelHighlight(units: BattleState['units']) {
  const dh = vfxManager.duelHighlight
  if (!dh) return
  const a = units.find((u) => u.name === dh.nameA)
  const b = units.find((u) => u.name === dh.nameB)
  if (a && b && a.state !== 'dead' && b.state !== 'dead') {
    dh.x1 = a.position.x; dh.y1 = a.position.y
    dh.x2 = b.position.x; dh.y2 = b.position.y
  } else {
    vfxManager.clearDuel()
  }
}
