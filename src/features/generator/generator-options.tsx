/**
 * Generator Options Component
 *
 * Provides controls for customizing template generation:
 * - Size presets (Compact, Standard, Wide, Banner)
 * - Style selector (Minimal, Hacker, Retro, Cyberpunk, Terminal)
 * - Border picker (Single, Double, Heavy, Rounded)
 * - Color theme switcher
 * - Surprise Me button for random combinations
 */

import { motion, AnimatePresence } from 'motion/react'
import { useState, useCallback } from 'react'
import {
  SIZE_PRESETS,
  TEMPLATE_STYLES,
  BORDER_STYLES,
  BOX_CHARS,
  COLOR_THEMES,
  type SizePresetId,
  type ColorThemeId,
  type BorderStyleId,
} from '@/lib/constants'
import { SkillPills } from './skill-pills'
import { type ActiveSkillsMap } from '@/lib/skills'
import type { GeneratorOptions as GeneratorOptionsType } from '@/types'

interface GeneratorOptionsProps {
  options: GeneratorOptionsType
  onChange: (options: GeneratorOptionsType) => void
  onThemeChange: (theme: ColorThemeId) => void
  isExpanded: boolean
  onToggleExpand: () => void
  activeSkills: ActiveSkillsMap
  onSkillsChange: (skills: ActiveSkillsMap) => void
}

// Animation config
const ANIMATION = {
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const },
  collapse: {
    initial: { height: 0, opacity: 0 },
    animate: { height: 'auto', opacity: 1 },
    exit: { height: 0, opacity: 0 },
  },
}

// Option button component
function OptionButton({
  selected,
  onClick,
  children,
  title,
  className = '',
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  title?: string
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        px-3 py-1.5 font-mono text-xs tracking-wider border rounded transition-all duration-200
        ${selected
          ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/20 text-[var(--theme-text)]'
          : 'border-[var(--theme-primary)]/30 text-[var(--theme-dim)] hover:border-[var(--theme-primary)]/60 hover:text-[var(--theme-text)]'
        }
        ${className}
      `}
    >
      {children}
    </button>
  )
}

// Section header
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-ui text-[10px] tracking-widest text-[var(--theme-dim)] uppercase">
      {children}
    </span>
  )
}

// Static ASCII preview — shows border + style combo without calling the AI
const STYLE_SAMPLE: Record<string, string> = {
  sovereign: '╔═ DATA ═╗',
  wraith:    '╭─ calm ─╮',
  relic:     '+=RELIC=+',
  feral:     '▓◈ FERAL ▓',
  siege:     '▐█▌ SIEGE',
}

function SettingsPreview({ options }: { options: GeneratorOptionsType }) {
  const chars = BOX_CHARS[options.border as keyof typeof BOX_CHARS] ?? BOX_CHARS.single
  const size = SIZE_PRESETS[options.size]
  const sample = STYLE_SAMPLE[options.style] ?? 'GLYPH'
  const inner = 22
  const pad = (s: string) => s.slice(0, inner).padEnd(inner)

  const top = `${chars.topLeft}${chars.horizontal.repeat(inner + 2)}${chars.topRight}`
  const row1 = `${chars.vertical} ${pad(sample)} ${chars.vertical}`
  const row2 = `${chars.vertical} ${pad(`${options.style.toUpperCase()} / ${options.border.toUpperCase()}`)} ${chars.vertical}`
  const row3 = `${chars.vertical} ${pad(`W:${size.width} H:${size.height}`)} ${chars.vertical}`
  const bot = `${chars.bottomLeft}${chars.horizontal.repeat(inner + 2)}${chars.bottomRight}`

  return (
    <pre className="font-mono text-xs leading-tight phosphor-glow select-all" style={{ color: 'var(--theme-primary)' }}>
      {[top, row1, row2, row3, bot].join('\n')}
    </pre>
  )
}

export function GeneratorOptions({
  options,
  onChange,
  onThemeChange,
  isExpanded,
  onToggleExpand,
  activeSkills,
  onSkillsChange,
}: GeneratorOptionsProps) {
  const [showSurpriseFlash, setShowSurpriseFlash] = useState(false)

  // Handle individual option changes
  const handleSizeChange = useCallback((size: SizePresetId) => {
    onChange({ ...options, size })
  }, [options, onChange])

  const handleStyleChange = useCallback((style: typeof TEMPLATE_STYLES[number]['id']) => {
    onChange({ ...options, style })
  }, [options, onChange])

  const handleBorderChange = useCallback((border: BorderStyleId) => {
    onChange({ ...options, border })
  }, [options, onChange])

  const handleThemeChange = useCallback((theme: ColorThemeId) => {
    onChange({ ...options, theme })
    onThemeChange(theme)
  }, [options, onChange, onThemeChange])

  // Surprise Me - random combination
  const handleSurpriseMe = useCallback(() => {
    const sizeKeys = Object.keys(SIZE_PRESETS) as SizePresetId[]
    const styleKeys = TEMPLATE_STYLES.map(s => s.id)
    const borderKeys = BORDER_STYLES.map(b => b.id) as BorderStyleId[]

    const randomSize = sizeKeys[Math.floor(Math.random() * sizeKeys.length)]
    const randomStyle = styleKeys[Math.floor(Math.random() * styleKeys.length)]
    const randomBorder = borderKeys[Math.floor(Math.random() * borderKeys.length)]

    onChange({
      ...options,
      size: randomSize,
      style: randomStyle,
      border: randomBorder,
    })

    // Flash effect
    setShowSurpriseFlash(true)
    setTimeout(() => setShowSurpriseFlash(false), 300)
  }, [options, onChange])

  return (
    <div className="w-full">
      {/* Toggle button */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-center gap-2 py-2 font-ui text-xs tracking-wider text-[var(--theme-dim)] hover:text-[var(--theme-text)] transition-colors duration-200"
      >
        <span>{isExpanded ? '▼' : '▶'}</span>
        <span>OPTIONS</span>
        <span className="text-[var(--theme-primary)]/50">
          [{SIZE_PRESETS[options.size].label} / {options.style.toUpperCase()} / {options.border.toUpperCase()}]
        </span>
      </button>

      {/* Collapsible options panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            {...ANIMATION.collapse}
            transition={ANIMATION.transition}
            className="overflow-hidden"
          >
            <div className={`
              mt-2 p-4 border border-[var(--theme-primary)]/30 rounded-lg
              bg-terminal-dark/50 backdrop-blur-sm space-y-4
              ${showSurpriseFlash ? 'animate-pulse' : ''}
            `}>
              {/* Size Presets */}
              <div className="space-y-2">
                <SectionLabel>Size</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {Object.values(SIZE_PRESETS).map((preset) => (
                    <OptionButton
                      key={preset.id}
                      selected={options.size === preset.id}
                      onClick={() => handleSizeChange(preset.id as SizePresetId)}
                      title={`${preset.width}x${preset.height} - ${preset.description}`}
                    >
                      {preset.label}
                      <span className="ml-1 opacity-50 text-[10px]">
                        {preset.width}x{preset.height}
                      </span>
                    </OptionButton>
                  ))}
                </div>
              </div>

              {/* Style Selector */}
              <div className="space-y-2">
                <SectionLabel>Style</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATE_STYLES.map((style) => (
                    <OptionButton
                      key={style.id}
                      selected={options.style === style.id}
                      onClick={() => handleStyleChange(style.id)}
                      title={style.description}
                    >
                      {style.label}
                    </OptionButton>
                  ))}
                </div>
              </div>

              {/* Border Picker */}
              <div className="space-y-2">
                <SectionLabel>Border</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {BORDER_STYLES.map((border) => (
                    <OptionButton
                      key={border.id}
                      selected={options.border === border.id}
                      onClick={() => handleBorderChange(border.id as BorderStyleId)}
                      className="font-mono"
                    >
                      <span className="mr-1 opacity-70">{border.preview}</span>
                      {border.label}
                    </OptionButton>
                  ))}
                </div>
              </div>

              {/* Color Theme */}
              <div className="space-y-2">
                <SectionLabel>Theme</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {Object.values(COLOR_THEMES).map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeChange(theme.id as ColorThemeId)}
                      title={theme.label}
                      className={`
                        w-8 h-8 rounded border-2 transition-all duration-200
                        ${options.theme === theme.id
                          ? 'border-white scale-110'
                          : 'border-transparent hover:scale-105'
                        }
                      `}
                      style={{ backgroundColor: theme.primary }}
                    />
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <SectionLabel>Skills</SectionLabel>
                <SkillPills activeSkills={activeSkills} onChange={onSkillsChange} />
              </div>

              {/* Surprise Me Button */}
              <div className="pt-2 border-t border-[var(--theme-primary)]/20">
                <button
                  onClick={handleSurpriseMe}
                  className="w-full py-2 px-4 font-ui text-sm tracking-wider border border-dashed border-[var(--theme-primary)]/50 rounded-lg text-[var(--theme-text)] hover:bg-[var(--theme-primary)]/10 hover:border-[var(--theme-primary)] transition-all duration-200"
                >
                  ★ SURPRISE ME ★
                </button>
              </div>

              {/* Live preview */}
              <div className="pt-2 border-t border-[var(--theme-primary)]/20 space-y-1">
                <span className="font-ui text-[10px] tracking-widest text-[var(--theme-dim)] uppercase">Preview</span>
                <SettingsPreview options={options} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
