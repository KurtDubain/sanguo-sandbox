// Visual effects: floating text, flashes, projectiles, trails, duel highlight, death particles

export interface FloatingText {
  x: number; y: number; text: string; color: string; age: number; maxAge: number
}

export interface HitFlash {
  x: number; y: number; age: number; maxAge: number; color: string
}

export interface SkillBurst {
  x: number; y: number; radius: number; age: number; maxAge: number; color: string; name: string
}

export interface DeathMark {
  x: number; y: number; name: string; age: number; maxAge: number; color: string
}

export interface Projectile {
  fromX: number; fromY: number; toX: number; toY: number
  age: number; maxAge: number; color: string; type: 'arrow' | 'slash'
}

export interface Trail {
  points: { x: number; y: number }[]; color: string; maxPoints: number
}

export interface DuelHighlight {
  x1: number; y1: number; x2: number; y2: number
  age: number; maxAge: number; nameA: string; nameB: string
}

export class VFXManager {
  floatingTexts: FloatingText[] = []
  hitFlashes: HitFlash[] = []
  skillBursts: SkillBurst[] = []
  deathMarks: DeathMark[] = []
  projectiles: Projectile[] = []
  trails: Map<string, Trail> = new Map()
  duelHighlight: DuelHighlight | null = null

  addDamageNumber(x: number, y: number, damage: number, isCrit: boolean) {
    this.floatingTexts.push({
      x: x + (Math.random() - 0.5) * 16, y: y - 15,
      text: isCrit ? `${damage}!` : `${damage}`,
      color: isCrit ? '#ff4444' : '#ffcc44',
      age: 0, maxAge: 35,
    })
  }

  addHealNumber(x: number, y: number, _amount: number) {
    this.floatingTexts.push({
      x: x + (Math.random() - 0.5) * 10, y: y - 12,
      text: `+`, color: '#44ff66', age: 0, maxAge: 30,
    })
  }

  addMoraleText(x: number, y: number, text: string) {
    this.floatingTexts.push({ x, y: y - 20, text, color: '#ff8844', age: 0, maxAge: 40 })
  }

  addHitFlash(x: number, y: number) {
    this.hitFlashes.push({ x, y, age: 0, maxAge: 6, color: '#fff' })
  }

  addSkillBurst(x: number, y: number, radius: number, name: string, color: string) {
    this.skillBursts.push({ x, y, radius, age: 0, maxAge: 20, color, name })
  }

  addDeath(x: number, y: number, name: string, color: string) {
    this.deathMarks.push({ x, y, name, age: 0, maxAge: 80, color })
  }

  addProjectile(fromX: number, fromY: number, toX: number, toY: number, type: 'arrow' | 'slash', color: string) {
    this.projectiles.push({
      fromX, fromY, toX, toY, age: 0,
      maxAge: type === 'arrow' ? 12 : 6,
      color, type,
    })
  }

  updateTrail(unitId: string, x: number, y: number, color: string) {
    let trail = this.trails.get(unitId)
    if (!trail) {
      trail = { points: [], color, maxPoints: 12 }
      this.trails.set(unitId, trail)
    }
    trail.color = color
    const last = trail.points[trail.points.length - 1]
    // Only add if moved enough
    if (!last || Math.abs(last.x - x) > 3 || Math.abs(last.y - y) > 3) {
      trail.points.push({ x, y })
      if (trail.points.length > trail.maxPoints) trail.points.shift()
    }
  }

  removeTrail(unitId: string) {
    this.trails.delete(unitId)
  }

  setDuel(x1: number, y1: number, x2: number, y2: number, nameA: string, nameB: string) {
    this.duelHighlight = { x1, y1, x2, y2, age: 0, maxAge: 999, nameA, nameB }
  }

  clearDuel() {
    this.duelHighlight = null
  }

  tick() {
    for (const ft of this.floatingTexts) ft.age++
    for (const hf of this.hitFlashes) hf.age++
    for (const sb of this.skillBursts) sb.age++
    for (const dm of this.deathMarks) dm.age++
    for (const p of this.projectiles) p.age++
    if (this.duelHighlight) this.duelHighlight.age++

    this.floatingTexts = this.floatingTexts.filter((f) => f.age < f.maxAge)
    this.hitFlashes = this.hitFlashes.filter((f) => f.age < f.maxAge)
    this.skillBursts = this.skillBursts.filter((f) => f.age < f.maxAge)
    this.deathMarks = this.deathMarks.filter((f) => f.age < f.maxAge)
    this.projectiles = this.projectiles.filter((f) => f.age < f.maxAge)
  }

  clear() {
    this.floatingTexts = []
    this.hitFlashes = []
    this.skillBursts = []
    this.deathMarks = []
    this.projectiles = []
    this.trails.clear()
    this.duelHighlight = null
  }
}
