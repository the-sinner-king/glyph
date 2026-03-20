/**
 * ModeToggle — SLOP / CRAFT generation mode selector.
 *
 * This IS the model picker. Mode determines which Gemini model runs:
 *   SLOP:  single Flash 2.5 call, streamed live, ~5–8s
 *   CRAFT: Pro 2.5 architect pass (buffered) → Flash 2.5 refine, ~15–20s
 *
 * Model names are shown as subtitles so users always know what they're getting.
 * NEVER use a separate "model dropdown" — the SLOP/CRAFT framing communicates
 * the experience (speed vs quality), not just the model name.
 */

import { motion } from 'motion/react'
import type { GenerationMode } from '@/types'

interface ModeToggleProps {
  mode: GenerationMode
  onChange: (mode: GenerationMode) => void
  disabled?: boolean
}

const MODES: { id: GenerationMode; label: string; model: string; desc: string }[] = [
  { id: 'slop',  label: 'SLOP',  model: 'Flash 3',   desc: '~5s · fast stream' },
  { id: 'craft', label: 'CRAFT', model: 'Pro 3.1',   desc: '~20s · quality-gated' },
]

export function ModeToggle({ mode, onChange, disabled }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Generation mode">
      {MODES.map(m => {
        const isActive = mode === m.id
        return (
          <motion.button
            key={m.id}
            onClick={() => !disabled && onChange(m.id)}
            disabled={disabled}
            whileHover={!disabled ? { scale: 1.03 } : {}}
            whileTap={!disabled ? { scale: 0.97 } : {}}
            transition={{ duration: 0.12 }}
            title={`${m.model} · ${m.desc}`}
            aria-pressed={isActive}
            className="relative px-3 py-1 font-mono tracking-widest uppercase transition-all duration-150 rounded flex flex-col items-center gap-0"
            style={{
              border: `1px solid ${isActive
                ? 'var(--theme-primary)'
                : 'color-mix(in srgb, var(--theme-primary) 25%, transparent)'}`,
              background: isActive
                ? 'color-mix(in srgb, var(--theme-primary) 15%, transparent)'
                : 'transparent',
              color: isActive ? 'var(--theme-primary)' : 'var(--theme-dim)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {isActive && (
              <motion.span
                layoutId="mode-indicator"
                className="absolute inset-0 rounded"
                style={{ background: 'color-mix(in srgb, var(--theme-primary) 8%, transparent)' }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              />
            )}
            <span className="relative z-10 text-xs">{m.label}</span>
            <span
              className="relative z-10 normal-case tracking-normal"
              style={{ fontSize: '9px', opacity: 0.65 }}
            >
              {m.model}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
