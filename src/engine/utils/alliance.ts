// Alliance utilities: check if two factions are allied

export function areAllied(factionA: string, factionB: string, alliances: string[][]): boolean {
  if (factionA === factionB) return true
  for (const group of alliances) {
    if (group.includes(factionA) && group.includes(factionB)) return true
  }
  return false
}

export function isEnemy(factionA: string, factionB: string, alliances: string[][]): boolean {
  return !areAllied(factionA, factionB, alliances)
}
