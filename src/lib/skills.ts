/**
 * GLYPH Skill System
 *
 * Skills are composable prompt augmentation slots.
 * One skill per slot can be active at a time.
 * Active skills inject one imperative sentence each into the system prompt.
 */

import type { Skill, SkillSlot } from '@/types'

// =============================================================================
// SKILL DEFINITIONS — 8 starter skills across 4 slots
// =============================================================================

export const SKILLS: Skill[] = [
  // AESTHETIC — how it looks
  {
    id: 'brutal',
    label: 'BRUTAL',
    slot: 'aesthetic',
    injection: 'Use heavy double-line borders (║═╬╔╗╚╝), thick block mass (█▓▒░), and maximum structural density — no decorative flourishes, only weight.',
    icon: '▓',
  },
  {
    id: 'ghost',
    label: 'GHOST',
    slot: 'aesthetic',
    injection: 'Use thin single-line borders (│─┼┌┐└┘), generous whitespace, and elegant restraint — let the content breathe and speak for itself.',
    icon: '░',
  },

  // PRECISION — how structurally correct it is
  {
    id: 'strict_box',
    label: 'STRICT',
    slot: 'precision',
    injection: 'Every box must close perfectly: every corner character must be consistent, every line must start and end at the same column, no broken joints.',
    icon: '╬',
  },
  {
    id: 'adaptive',
    label: 'ADAPTIVE',
    slot: 'precision',
    injection: 'Prioritize visual impact over pixel-perfect structure — flowing, organic, asymmetric forms are encouraged if they serve the design.',
    icon: '◈',
  },

  // DOMAIN — what it is for
  {
    id: 'terminal_ui',
    label: 'TERMINAL',
    slot: 'domain',
    injection: 'Design this as a real TUI element for an 80-column terminal: include functional zones (header, body, footer) and design for actual xterm rendering.',
    icon: '⌘',
  },
  {
    id: 'readme_hero',
    label: 'README',
    slot: 'domain',
    injection: 'Design this as a GitHub README header: wide, impressive, welcoming — the first thing someone sees when they land on the repository.',
    icon: '★',
  },

  // CONSTRAINT — technical limits
  {
    id: 'compact',
    label: 'COMPACT',
    slot: 'constraint',
    injection: 'Maximum 30 lines total — every character must earn its place, ruthlessly cut anything that does not contribute to the design.',
    icon: '▲',
  },
  {
    id: 'wide',
    label: 'WIDE',
    slot: 'constraint',
    injection: 'Width up to 120 columns is acceptable — go wide if the design benefits from the horizontal space.',
    icon: '◀▶',
  },
]

// Lookup map for O(1) access
export const SKILLS_BY_ID = new Map<string, Skill>(SKILLS.map(s => [s.id, s]))
export const SKILLS_BY_SLOT = new Map<SkillSlot, Skill[]>()
for (const skill of SKILLS) {
  const bucket = SKILLS_BY_SLOT.get(skill.slot) ?? []
  bucket.push(skill)
  SKILLS_BY_SLOT.set(skill.slot, bucket)
}

// Slot order for display
export const SKILL_SLOT_ORDER: SkillSlot[] = ['aesthetic', 'precision', 'domain', 'constraint']

// =============================================================================
// ACTIVE SKILLS STATE — Map<slot, skillId | null>
// =============================================================================

export type ActiveSkillsMap = Map<SkillSlot, string | null>

export function createEmptyActiveSkills(): ActiveSkillsMap {
  return new Map([
    ['aesthetic', null],
    ['precision', null],
    ['domain', null],
    ['constraint', null],
  ])
}

/** Toggle a skill: activates it (deactivating any other in the same slot),
 *  or deactivates it if it was already active.
 */
export function toggleSkill(current: ActiveSkillsMap, skillId: string): ActiveSkillsMap {
  const skill = SKILLS_BY_ID.get(skillId)
  if (!skill) return current

  const next = new Map(current)
  const currentInSlot = next.get(skill.slot)
  // Toggle: if already active → deactivate; otherwise → activate
  next.set(skill.slot, currentInSlot === skillId ? null : skillId)
  return next
}

/** Returns the active skill IDs as a flat array (nulls excluded). */
export function getActiveSkillIds(activeSkills: ActiveSkillsMap): string[] {
  return Array.from(activeSkills.values()).filter((id): id is string => id !== null)
}

// =============================================================================
// PROMPT AUGMENTATION
// =============================================================================

/** Builds the system prompt by appending active skill injections.
 *  Each injection is one imperative sentence. Total overhead: ~30–60 tokens max.
 */
export function buildSystemPrompt(basePrompt: string, activeSkills: ActiveSkillsMap): string {
  const injections: string[] = []
  for (const skillId of getActiveSkillIds(activeSkills)) {
    const skill = SKILLS_BY_ID.get(skillId)
    if (skill) injections.push(skill.injection)
  }

  if (injections.length === 0) return basePrompt
  return `${basePrompt}\n\nADDITIONAL CONSTRAINTS:\n${injections.map(i => `- ${i}`).join('\n')}`
}
