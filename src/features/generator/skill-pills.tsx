/**
 * SkillPills — Composable prompt augmentation selector.
 *
 * One skill per slot can be active at a time. Clicking an active skill deactivates it.
 * Clicking a different skill in the same slot deactivates the current one.
 * Slots are visually separated by a divider.
 */

import { motion } from 'motion/react'
import { SKILL_SLOT_ORDER, SKILLS_BY_SLOT, toggleSkill, type ActiveSkillsMap } from '@/lib/skills'
import type { SkillSlot } from '@/types'

interface SkillPillsProps {
  activeSkills: ActiveSkillsMap
  onChange: (next: ActiveSkillsMap) => void
  disabled?: boolean
}

const SLOT_LABELS: Record<SkillSlot, string> = {
  aesthetic: 'LOOK',
  precision: 'FORM',
  domain:    'USE',
  constraint:'SIZE',
}

export function SkillPills({ activeSkills, onChange, disabled }: SkillPillsProps) {
  const handleToggle = (skillId: string) => {
    if (disabled) return
    onChange(toggleSkill(activeSkills, skillId))
  }

  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5"
      role="group"
      aria-label="Generation skills"
    >
      {SKILL_SLOT_ORDER.map((slot, slotIdx) => {
        const slotSkills = SKILLS_BY_SLOT.get(slot) ?? []
        return (
          <div key={slot} className="flex items-center gap-1.5">
            {/* Slot separator */}
            {slotIdx > 0 && (
              <span
                className="font-mono text-xs select-none"
                style={{ color: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}
              >
                │
              </span>
            )}

            {/* Slot label */}
            <span
              className="font-mono text-[9px] tracking-widest uppercase select-none"
              style={{ color: 'color-mix(in srgb, var(--theme-dim) 60%, transparent)' }}
              title={`Slot: ${slot}`}
            >
              {SLOT_LABELS[slot]}
            </span>

            {/* Skills in this slot */}
            {slotSkills.map(skill => {
              const isActive = activeSkills.get(slot) === skill.id
              return (
                <motion.button
                  key={skill.id}
                  onClick={() => handleToggle(skill.id)}
                  disabled={disabled}
                  whileHover={!disabled ? { scale: 1.05 } : {}}
                  whileTap={!disabled ? { scale: 0.95 } : {}}
                  transition={{ duration: 0.1 }}
                  title={skill.injection}
                  aria-pressed={isActive}
                  className="flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] tracking-widest uppercase rounded transition-all duration-150"
                  style={{
                    border: `1px solid ${isActive
                      ? 'var(--theme-primary)'
                      : 'color-mix(in srgb, var(--theme-primary) 20%, transparent)'}`,
                    background: isActive
                      ? 'color-mix(in srgb, var(--theme-primary) 12%, transparent)'
                      : 'transparent',
                    color: isActive ? 'var(--theme-primary)' : 'color-mix(in srgb, var(--theme-dim) 70%, transparent)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.4 : 1,
                  }}
                >
                  <span style={{ fontSize: '9px' }}>{skill.icon}</span>
                  {skill.label}
                </motion.button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

