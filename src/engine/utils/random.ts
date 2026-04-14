// Mulberry32 seeded PRNG — deterministic, fast, good distribution
export class SeededRandom {
  private state: number

  constructor(seed: number) {
    this.state = seed | 0
  }

  // Returns a float in [0, 1)
  next(): number {
    this.state |= 0
    this.state = (this.state + 0x6d2b79f5) | 0
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  // Integer in [min, max] inclusive
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  // Float in [min, max)
  float(min: number, max: number): number {
    return this.next() * (max - min) + min
  }

  // Returns true with given probability
  chance(probability: number): boolean {
    return this.next() < probability
  }

  // Pick random element from array
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)]
  }

  // Shuffle array in place (Fisher-Yates)
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }
}
