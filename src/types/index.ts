/**
 * GLYPH — Shared TypeScript types
 *
 * Canonical shape of every entity the app stores, generates, or passes between
 * components. All three generations of the schema coexist here:
 *   V1 legacy (templates: [...]) — still encountered in migrated history
 *   V2 canonical (template: {...}, mode, activeSkills)
 *   V2 extended (id, qualityScore) — added in v1.0.1 bug fix pass
 *
 * NEVER define component-local state shapes here — those live next to their
 * components. This file is the domain model, not the UI model.
 */

import type { FigletFont, TemplateStyle, BoxCharSet, SizePresetId, ColorThemeId, BorderStyleId } from '@/lib/constants'

// ─── Generation options ───────────────────────────────────────────────────────

export interface GeneratorOptions {
  size: SizePresetId
  style: TemplateStyle['id']
  border: BorderStyleId
  theme: ColorThemeId
}

// ─── Core generation types ────────────────────────────────────────────────────

export interface GenerationRequest {
  prompt: string
  style?: TemplateStyle['id']
  font?: FigletFont
  options?: GeneratorOptions
}

export interface GeneratedTemplate {
  id: string
  content: string
  style: TemplateStyle['id']
  font: FigletFont
  width: number
  height: number
  createdAt: number
}

// ─── V2 generation model ──────────────────────────────────────────────────────

// SLOP: single Flash call, streamed live (~5-8s). CRAFT: Pro architect pass
// (buffered) → quality gate → Flash refine (buffered) (~15-20s).
export type GenerationMode = 'slop' | 'craft'

// One active skill per slot at a time — composable prompt augmentation.
// Slot system ensures only one aesthetic/precision/etc. skill can fire at once.
export type SkillSlot = 'aesthetic' | 'precision' | 'domain' | 'constraint'

export interface Skill {
  id: string
  label: string
  slot: SkillSlot
  injection: string  // one imperative sentence appended to system prompt
  icon: string
}

// ─── Quality gate ─────────────────────────────────────────────────────────────

// Structural analysis of generated ASCII output. Score = number of passing checks
// (0-4). Gate passes at ≥3 — allows one check to fail (isBalanced is intentionally
// lenient for creative art styles that push template boundaries).
export interface QualityReport {
  isComplete: boolean    // line count + char density meets threshold
  hasStructure: boolean  // ≥2 distinct border chars detected
  isBalanced: boolean    // L/R margin within 30% of median
  notTruncated: boolean  // last non-empty line ends with a structural char
  score: number          // 0–4, one point per passing check
}

export interface GenerationResult {
  id: string                            // AC-5-prereq: unique ID for history operations
  template: GeneratedTemplate   // V2: singular — was templates: [GeneratedTemplate, GeneratedTemplate]
  prompt: string
  processingTime: number
  mode: GenerationMode
  activeSkills: string[]        // skill IDs active at generation time
  qualityScore?: number         // AC-12t: 0-4 quality gate passes (optional for backward compat)
}

// ─── App state ────────────────────────────────────────────────────────────────

// 'loading' was removed in v1.0.1 — it was a dead state. No code path ever set
// status to 'loading'; the switch in generator.tsx fell to default for it.
export type AppStatus = 'idle' | 'generating' | 'success' | 'error'

// ─── Component prop types ─────────────────────────────────────────────────────
export interface TerminalBoxProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'glow' | 'pulse'
  boxStyle?: BoxCharSet
}

export interface AsciiDisplayProps {
  content: string
  className?: string
  animate?: boolean
}

export interface CommandInputProps {
  onSubmit: (prompt: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}
