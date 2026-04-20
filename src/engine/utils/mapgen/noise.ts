// Smooth noise for organic terrain
export function noise2d(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 43758.5453) * 43758.5453
  return n - Math.floor(n)
}

export function smoothNoise(x: number, y: number, scale: number, seed: number): number {
  const sx = x / scale, sy = y / scale
  const ix = Math.floor(sx), iy = Math.floor(sy)
  const fx = sx - ix, fy = sy - iy
  // Hermite interpolation for smoother transitions
  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)
  const a = noise2d(ix, iy, seed)
  const b = noise2d(ix + 1, iy, seed)
  const c = noise2d(ix, iy + 1, seed)
  const d = noise2d(ix + 1, iy + 1, seed)
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy
}

export function fbm(x: number, y: number, seed: number): number {
  return smoothNoise(x, y, 10, seed) * 0.5 +
         smoothNoise(x, y, 5, seed + 100) * 0.3 +
         smoothNoise(x, y, 2.5, seed + 200) * 0.2
}
