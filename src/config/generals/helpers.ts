import { General } from '../../types'
import { SKILLS } from '../skills'

const s = SKILLS

export function g(
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
