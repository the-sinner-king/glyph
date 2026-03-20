/**
 * Gemini AI Service for GLYPH — V2
 *
 * Two generation modes:
 *   SLOP — single Flash call, streamed live, ~5–8s
 *   CRAFT — Pro architect pass (buffered) → quality gate → Flash refine (buffered)
 *
 * Single output per generation. No dual-stream.
 * Skills inject imperative sentences into the system prompt.
 *
 * AC-10g: CRAFT mode Flash refine phase no longer forwards chunks to callbacks.onChunk.
 * Flash output is buffered internally. onComplete fires once with the winning result.
 * SLOP mode is UNCHANGED — it still streams live via onChunk.
 */

import { GoogleGenAI } from '@google/genai'
import type { GeneratorOptions, GenerationMode, QualityReport } from '@/types'
import { CONFIG, SIZE_PRESETS, BOX_CHARS } from '@/lib/constants'
import { buildSystemPrompt, type ActiveSkillsMap } from '@/lib/skills'

// =============================================================================
// INPUT SANITIZATION
// =============================================================================

function sanitizePrompt(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '')
    .trim()
    .slice(0, CONFIG.maxPromptLength)
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

function isRetryable(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const msg = error.message.toLowerCase()
  // Do NOT retry daily quota exhaustion — retrying burns more quota
  if (msg.includes('429') && (msg.includes('per day') || msg.includes('exhausted') || msg.includes('resource_exhausted'))) {
    return false
  }
  return msg.includes('rate') ||
    msg.includes('503') || msg.includes('429') ||
    msg.includes('overloaded') || msg.includes('unavailable') ||
    msg.includes('network') || msg.includes('fetch') ||
    msg.includes('timeout')
}

/** Parse raw Gemini API error blobs into clean, user-facing messages.
 *  The SDK sometimes returns double-JSON-encoded error objects.
 */
function parseApiError(error: unknown): Error {
  if (!(error instanceof Error)) return new Error('Generation failed. Please try again.')

  let message = error.message

  try {
    const outer = JSON.parse(message) as { error?: { message?: string; code?: number } }
    if (outer?.error?.message) {
      try {
        const inner = JSON.parse(outer.error.message) as { error?: { code?: number; message?: string; status?: string } }
        if (inner?.error?.message) message = inner.error.message
        else message = outer.error.message
      } catch {
        message = outer.error.message
      }
    }
  } catch {
    // Not JSON — use raw message
  }

  const lower = message.toLowerCase()

  if (lower.includes('resource_exhausted') || lower.includes('quota') || lower.includes('per day')) {
    return new Error('Daily API quota reached. Wait ~1 hour or check your usage at aistudio.google.com.')
  }
  if (lower.includes('429') || lower.includes('rate limit') || lower.includes('too many requests')) {
    return new Error('Rate limited. Please wait a moment and try again.')
  }
  if (lower.includes('api key') || lower.includes('api_key') || lower.includes('invalid key') || lower.includes('401')) {
    return new Error('Invalid API key. Check your key in the settings and try again.')
  }
  if (lower.includes('safety') || lower.includes('blocked') || lower.includes('harm')) {
    return new Error('Request blocked by Gemini safety filters. Try a different prompt.')
  }
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch')) {
    return new Error('Network error. Check your connection and try again.')
  }

  if (message.length > 120) message = message.slice(0, 120) + '…'
  return new Error(message)
}

// =============================================================================
// MODELS + GENERATION CONFIG
// =============================================================================

/**
 * Primary generation model for SLOP mode.
 *
 * Gemini 3 Flash (preview) — used for single-pass streaming generation.
 * Also used as the refinement model in CRAFT mode Phase 2.
 *
 * Exported for use in regression tests (`tests/test-model-config.sh` verifies
 * this model ID has not been retired).
 *
 * @see MODEL_PRO for the CRAFT mode architect model.
 */
export const MODEL_FLASH = 'gemini-3-flash-preview'

/**
 * Architect model for CRAFT mode Phase 1.
 *
 * Gemini 3.1 Pro (preview) — used for the buffered architect pass in CRAFT mode.
 * Higher reasoning capability and multimodal quality than Flash; slower and more
 * expensive per token. CRAFT mode uses Pro only for the initial generation, then
 * falls back to Flash for the refinement pass.
 *
 * Exported for use in regression tests (`tests/test-model-config.sh` verifies
 * this model ID has not been retired).
 *
 * @see MODEL_FLASH for the SLOP mode and CRAFT refinement model.
 */
export const MODEL_PRO   = 'gemini-3.1-pro-preview'

const GENERATION_CONFIG = {
  // Gemini 3.x models are thinking-mandatory — thinkingBudget: 0 is invalid and throws.
  // includeThoughts: false keeps thinking internal (server-side only) so thought tokens
  // never appear in response.text or streamed chunks. The model still reasons; we just
  // don't see the scratchpad. thinkingBudget sets the token ceiling for that reasoning.
  SLOP:            { temperature: 0.85, topP: 0.92, maxOutputTokens: 3072, thinkingConfig: { thinkingBudget: 512,  includeThoughts: false } },
  CRAFT_ARCHITECT: { temperature: 0.6,  topP: 0.90, maxOutputTokens: 3072, thinkingConfig: { thinkingBudget: 2048, includeThoughts: false } },
  CRAFT_REFINE:    { temperature: 0.4,  topP: 0.85, maxOutputTokens: 3072, thinkingConfig: { thinkingBudget: 512,  includeThoughts: false } },
} as const

// =============================================================================
// CORE HEADER PROMPT — the static foundation injected into every generation
// =============================================================================

/**
 * Static system prompt header injected at the start of every generation request,
 * regardless of style or mode.
 *
 * Establishes GLYPH's identity as an ASCII/Unicode template architect and defines
 * four standing mandates:
 * - Character arsenal: the full set of box-drawing, block, decorative, arrow, and
 *   tech characters the model is authorized to use.
 * - Scale Law: the generated template must fill its size bounds. Cramped output fails.
 * - Completion Law: the final line must be a closing structural character. Open
 *   frames are rejected.
 * - Output Contract: raw ASCII/Unicode only — no markdown fences, no commentary,
 *   no explanations.
 *
 * The full system prompt is assembled as:
 *   `CORE_HEADER_PROMPT + '\n' + getStyleDoc(style)` → then passed to
 *   `buildSystemPrompt()` which appends active skill injections.
 *
 * @see getStyleDoc for per-style design mandates appended after this header.
 * @see buildSystemPrompt for the final assembly step that adds skill injections.
 */
const CORE_HEADER_PROMPT = `You are GLYPH — an expert ASCII/Unicode template architect.

YOUR MANDATE:
Generate visually powerful, structurally complete text-based UI templates.
Every output must look like it belongs on a real terminal, in a real tool, operated by real people.
No placeholder filler. No generic boxes. Make it something specific and visually commanding.

CHARACTER ARSENAL:
Box-drawing  ┌ ┐ └ ┘ ─ │ ├ ┤ ┬ ┴ ┼ ╔ ╗ ╚ ╝ ═ ║ ╠ ╣ ╦ ╩ ╬ ╭ ╮ ╯ ╰ ┏ ┓ ┗ ┛ ━ ┃ ┣ ┫ ┳ ┻ ╋
Block chars  █ ▓ ▒ ░ ▀ ▄ ▌ ▐ ▆ ▇ ▅ ▃
Decorative   • ◆ ◇ ○ ● ◐ ◑ ★ ☆ ✓ ✗ ⚙ ⚡ ⬡ ⬢ ◈ ◉ ♦ ◎ ▸ ◂
Arrows       → ← ↑ ↓ ↗ ↘ ↙ ↖ ▶ ◀ ▲ ▼ » «
Tech         ⌘ ⌥ ⇧ ⏎ ⎔ ⎊ ☰ ⋮ ⋯ ≡

SCALE LAW:
Build to the full size constraint. A template that fills its bounds commands attention.
A cramped output is a failed output. Use the width. Use the height.
Every design needs visual hierarchy: header → body → footer. Never a flat list.

COMPLETION LAW:
The final line MUST be a closing structural character (border corner, rule, fill bar).
An open frame is a broken output. Close everything you open.

OUTPUT CONTRACT:
Return ONLY the raw ASCII/Unicode art.
NO explanations. NO markdown. NO code fences. NO commentary before or after.
The template is the entire output. Nothing else.`

// =============================================================================
// STYLE DOCUMENTS — per-style design briefs injected into the system prompt.
// Each style gets its own full document. Not a one-liner — a design mandate.
// The model receives: CORE_HEADER + STYLE_DOC + skill injections = system prompt.
// =============================================================================

/**
 * Returns the per-style design document for the given style ID.
 *
 * Each style document is a full design mandate — not a one-liner — that describes
 * visual doctrine, character rules, structural conventions, and a template example
 * for that style. The document is appended to `CORE_HEADER_PROMPT` to form the
 * base system prompt before skill injections are added.
 *
 * Recognized style IDs and their design doctrines:
 * - `'sovereign'` — Industrial brutalism. Double-line perimeter frames, dense data
 *   columns, ALL CAPS section headers, progress bars mandatory for metrics.
 * - `'wraith'`    — Negative space as structure. Hairline single-line borders,
 *   deliberate blank lines, maximum 5 decorative glyphs, no block fills.
 * - `'relic'`     — Pre-Unicode archaeology. ASCII-only structural characters
 *   (`+`, `-`, `=`, `|`), avoids Unicode box-drawing, typewriter warmth.
 * - `'feral'`     — The loved machine. Mixed-register borders (block elements +
 *   line characters), gel meters with gradient fills, ornament as communication.
 * - `'siege'`     — Decision-speed data. Military ops display with `▐█▌` column
 *   anchors, ALL CAPS labels, heavy horizontal separators, zero decoration
 *   without data signal.
 *
 * Falls back to `'sovereign'` if the style ID is not recognized.
 *
 * @param style - A style ID string. Expected values: `'sovereign'`, `'wraith'`,
 *   `'relic'`, `'feral'`, `'siege'`. Unrecognized values fall back to sovereign.
 * @returns The full design document string for that style.
 *
 * @example
 * const doc = getStyleDoc('wraith')
 * // Returns the WRAITH doctrine string (negative space, hairline borders, etc.)
 *
 * @example
 * const doc = getStyleDoc('unknown-style')
 * // Falls back to sovereign doctrine
 */
function getStyleDoc(style: string): string {
  const docs: Record<string, string> = {

    sovereign: `
═══════════════════════════════════════════════════════════════════
ACTIVE STYLE: SOVEREIGN ║ DOCTRINE: INDUSTRIAL BRUTALISM
═══════════════════════════════════════════════════════════════════

You are building a fortress. The double-line perimeter frame is the first
structural decision — it commands the space before any content exists inside
it. Design the container before the content. The frame IS the authority.

FRAME LAW
The outer perimeter uses double-line box-drawing only: ╔═══╗ / ╚═══╝ / ║ / ═
Interior sub-panels nest single-line borders: ┌─┐ / └─┘ / │ / ─
Every structural joint must land — no broken corners, no misaligned columns.
Structural integrity is not preference. It is law.

DATA ARCHITECTURE
Information lives in columns. Section headers are ALL CAPS, underlined by
full-width ════ separator bars that run the complete panel interior width.
Leave no dead whitespace — every cell is load-bearing. Columns align.
Values right-justify in their cells where format allows.

GLYPH REGISTER
◆  leads every list item and data field — the anchor glyph
→  separates label from value in status rows (LABEL → VALUE)
║  separates data columns inside panels (double vertical only)
[ ]  wraps all state labels: [ACTIVE] [LOCKED] [ERROR] [WARN] [OK]
▓▒░  build progress bars and density gradients from left

PROGRESS BARS — mandatory for any measurable metric:
  ████████░░ 80%   (fill chars left, empty right, percentage at end)
  ▓▓▓▓▓▒▒░░ 65%   (gradient fill variant)

HIERARCHY TEMPLATE (adapt content to the request):
  ╔══════════════════════════════════════╗
  ║  PANEL TITLE              [STATUS]  ║
  ╠══════════════════════════════════════╣
  ║ ◆ FIELD ONE      →  VALUE           ║
  ║ ◆ FIELD TWO      →  VALUE           ║
  ╠══════════════════════════════════════╣
  ║  SECTION HEADER                     ║
  ║  ──────────────────────────────     ║
  ║  ████████████░░░░  60%  METRIC      ║
  ╚══════════════════════════════════════╝

VOICE: Iron. Data. Authority. No warmth, no decoration that does not carry signal.
Every glyph earns its position or is removed. The frame is the philosophy.`,

    wraith: `
═══════════════════════════════════════════════════════════════════
ACTIVE STYLE: WRAITH ║ DOCTRINE: NEGATIVE SPACE AS STRUCTURE
═══════════════════════════════════════════════════════════════════

What you remove is the art. Whitespace is a first-class structural element —
not the absence of design, but the design itself. The template should feel
like a whisper, not a shout. Presence through restraint. The eye should
rest, not scan frantically.

FRAME LAW
Hairline borders only: ╭─╮ / ╰─╯ (rounded corners preferred) or ┌─┐ / └─┘
Single-line throughout. Never double-line. Never heavy. One frame depth only —
no nested boxes. The border is a suggestion, not a wall.

NEGATIVE SPACE RULES
Let content breathe. Maintain 2–3 space margins inside every border.
Place blank lines between sections deliberately — they are structural.
Do not fill space just to fill it. The void is doing work.

SECTION SEPARATORS — subtle, never loud:
  ·  ·  ·  ·  ·  ·  ·  ·         (spaced dots)
  ─────────────────                (partial rule, not full-width)
  NOT: ════════════════════════   (double-line is SOVEREIGN territory)

DENSITY LIMIT
Maximum 5 decorative glyphs in the entire design. Fewer is better.
Choose glyphs that carry meaning: ◆ for key items, · for separation.
No progress bars. No fill gradients. Absolutely no ▓▒░ block fills
except a single ░ for a soft depth cue if genuinely necessary.

TYPOGRAPHIC PRINCIPLES
Center key content where it has visual weight. Use indentation to create
margin. Align related items to the same column position.
Hierarchy comes from positioning and spacing — not from decoration.

WRAITH TEMPLATE (adapt content to the request):
  ╭──────────────────────────────╮
  │                              │
  │    TITLE                     │
  │                              │
  │    Item One                  │
  │    Item Two                  │
  │    Item Three                │
  │                              │
  │    ·  ·  ·  ·  ·             │
  │                              │
  │    footer note               │
  │                              │
  ╰──────────────────────────────╯

VOICE: Quiet. Deliberate. Everything present was chosen.
Everything absent was also chosen. The design holds space, not weight.`,

    relic: `
═══════════════════════════════════════════════════════════════════
ACTIVE STYLE: RELIC ║ DOCTRINE: PRE-UNICODE ARCHAEOLOGY
═══════════════════════════════════════════════════════════════════

You are printing on a machine that has never seen Unicode box-drawing.
The constraint is the aesthetic — the ghost of terminals that built borders
with + and - and = and | because that was the entire vocabulary. Work within
this constraint deliberately, not reluctantly. This is not poverty. It is
authority earned through limitation. The machine outlived its era.

CHARACTER DOCTRINE
Reach first for ASCII-compatible structural characters:
  +---+    box corners and frames (+ for every joint)
  |        vertical borders
  =====    horizontal rules and separators (strongly preferred over -----)
  *****    emphasis bars and strong section dividers
  [ ]      all labels, status indicators, and buttons
  ::  :    field separators in data rows
  >>       directional markers and list bullets
  >>>      stronger directional emphasis or sub-indentation

AVOIDANCE LIST: ╔ ╗ ╚ ╝ ║ ═ ╠ ╣ ╦ ╩ ╬ ╭ ╰ ┌ ┐ └ ┘ │ ─ — these are post-IBM
box-drawing Unicode. Use them only if their complete absence would make
the template structurally incomprehensible. The constraint is the art.

WARMTH AND IMPERFECTION
ASCII art from this era has warmth in its imperfection. Slight asymmetry
is permitted. The machine typed this — the operator didn't always align
everything exactly. That texture is part of the aesthetic.

STRUCTURAL CONVENTIONS
Section headers get === rules above and below:
  ===[ SECTION TITLE ]===
Data fields use >> or : separators:
  >> STATUS   : ACTIVE
  >> PRIORITY : HIGH
Buttons in square brackets with spaces:
  [ OK ]   [ CANCEL ]   [ HELP ]   [ EXIT ]

RELIC TEMPLATE (adapt content to the request):
  +====================================+
  |                                    |
  |   ===[ SYSTEM TITLE ]===           |
  |   BUILD: 1.0.2   MODE: ACTIVE      |
  |                                    |
  +====================================+
  |   >> STATUS    : NOMINAL           |
  |   >> UPTIME    : 14h 22m           |
  |   >> OPERATOR  : ALPHA             |
  |   >> PRIORITY  : HIGH              |
  +====================================+
  |   [ EXECUTE ]    [ ABORT ]         |
  +====================================+

VOICE: Typewriter. System printout. Not nostalgic — archaeological.
A thing that still works. The warmth of the machine that refused to die.`,

    feral: `
═══════════════════════════════════════════════════════════════════
ACTIVE STYLE: FERAL ║ DOCTRINE: THE LOVED MACHINE
═══════════════════════════════════════════════════════════════════

Someone built this interface and then kept decorating it because they
could not stop. The operator loved the machine too much to leave it plain.
Ornament is not superficial here — ornament IS communication. Every
decoration is a data point about the relationship between operator and system.
The tool got beautiful because someone lived inside it.

BORDER DOCTRINE: MIXED REGISTER
The borders are where you show this machine has been lived-in.
Mix heavy block elements with structural line characters:
  ▓▓▓╔═══════════════════════╗▓▓▓    heavy shoulder + double-line panel
  ░░░║   content zone        ║░░░    light fade at sides
  ▓▓▓╚═══════════════════════╝▓▓▓    matching heavy close
  ▌ section anchor ▌              vertical accent column markers

SIGNAL STRIPS
At the left or right edges of content sections: a column of ▌ or ▐ marks.
These signal: new section, this is the margin, eyes anchor here.
They are structural decoration — carrying position information visually.

GEL METERS AND FILL BARS — everything measurable gets personality:
  STATUS  ████████▒▒░░  NOMINAL   (full gradient fill)
  POWER   ▓▓▓▓▓▓▒▒░░░   72%       (heavy-to-light gradient)
  HEAT    ███▒░░░░░░░    30%       (partial fill showing headroom)
Use ▓ ▒ ░ █ in sequence for graduated fill — never flat single-char bars.

ORNAMENT VOCABULARY
◈  primary signal glyph — important data, section markers, named indicators
◆  secondary bullet and list anchor
★  highlight / featured item / active mode indicator
●  on/active status     ○  off/inactive status
♦  decorative border jewel inside panel header strips

FACEPLATE LOGIC
Design the panel like a physical faceplate. Three zones:
  1. NAMEPLATE at top — what is this machine called? Give it identity.
  2. PRIMARY DISPLAY in the middle — the main data and readings.
  3. STATUS ROW at bottom — is it running? What is its condition?
This arrangement gives the whole design an implied face. A robot that looks back.

FERAL TEMPLATE (adapt content to the request):
  ▓▓▓╔══════════════════════════════╗▓▓▓
  ▓▓▓║  ◈ SYSTEM NAME      [●LIVE]  ║▓▓▓
  ▓▓▓╠══════════════════════════════╣▓▓▓
  ░░░║ ▌ ◆ PRIMARY VALUE            ║░░░
  ░░░║ ▌   ████████▒▒░░  72%        ║░░░
  ░░░║ ▌ ◆ SECONDARY VALUE          ║░░░
  ░░░║ ▌   ████▒▒░░░░░░  38%        ║░░░
  ▓▓▓╠══════════════════════════════╣▓▓▓
  ▓▓▓║  ● ONLINE  ○ STANDBY  ★      ║▓▓▓
  ▓▓▓╚══════════════════════════════╝▓▓▓

VOICE: Industrial but loving. Dense but not cold. The machine was built
to work and then decorated to be beautiful. Both things are true.
The operator put the ★ there for a reason.`,

    siege: `
═══════════════════════════════════════════════════════════════════
ACTIVE STYLE: SIEGE ║ DOCTRINE: DECISION-SPEED DATA
═══════════════════════════════════════════════════════════════════

This display is read under operational pressure. Information must be
extracted in under 500 milliseconds by someone making live decisions.
Every character either serves that extraction or is removed. No decoration
without data signal. No blank space without structural purpose. Every line
is a briefing point.

COLUMN ANCHORS — mandatory for every section start:
  ▐█▌ SECTION NAME
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The ▐█▌ anchor tells the eye: section boundary, anchor here.

SEPARATOR DOCTRINE
Between sections: heavy horizontal rule ━━━━━━━━━━━━━━━━━━━━━━━━━━━
Within sections: single thin rule ─────────────── to sub-divide
Never a blank line where a rule would serve better. Whitespace is waste.

TYPOGRAPHY LAW
ALL CAPS for all labels, headers, field names, and section titles.
Lowercase permitted only in data values (user-provided content or live readings).
Field alignment — columns align at the colon:
  FIELDNAME  : VALUE
  ANOTHER    : VALUE

DATA VOCABULARY — use these field patterns:
  PRIORITY   : CRITICAL / HIGH / MEDIUM / LOW
  STATUS     : ACTIVE / STANDBY / OFFLINE / ERROR
  OPERATOR   : CALLSIGN or ID
  ETA        : HH:MM:SS or 00:00:00
  TARGET     : (value, ID, or coordinates)

ACTION BUTTONS — always [ ] brackets, ALLCAPS, space-padded:
  [ EXECUTE ]   [ ABORT ]   [ CONFIRM ]   [ OVERRIDE ]   [ REPORT ]
Buttons live at the bottom, after a ━━━━━ separator.

PROGRESS DISPLAY — flat, fast, readable:
  PROGRESS  ████████░░░░  67%    (fill then empty, value right)
  UPTIME    ████████████  100%

SIEGE TEMPLATE (adapt content to the request):
  ▐█▌ OPERATION NAME
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    STATUS     : ACTIVE
    PRIORITY   : HIGH
    OPERATOR   : ALPHA-7
    ETA        : 00:04:22
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ▐█▌ METRICS
    PROGRESS   ████████░░░░  67%
    UPTIME     ████████████  100%
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    [ EXECUTE ]      [ ABORT ]      [ REPORT ]
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VOICE: No warmth. No decoration. Data serves the mission.
Every glyph is a weapon against decision latency. This display saves lives.`,
  }

  return docs[style] ?? docs.sovereign
}

// =============================================================================
// QUALITY GATE
// =============================================================================

/**
 * Evaluates a generated template against four structural quality checks.
 *
 * Used internally after every generation pass (SLOP and CRAFT) to determine
 * whether output meets the minimum bar for delivery. The gate threshold is
 * 3 of 4 checks passing (`QUALITY_GATE_THRESHOLD`).
 *
 * Checks:
 * - `isComplete`: The content has at least `floor(height * 0.4)` non-empty lines
 *   AND at least `floor(width * height * 0.05)` non-whitespace characters.
 * - `hasStructure`: At least 2 distinct border/block character types are present
 *   in the content (from the set `╔╗╚╝║═╠╣╦╩╬┌┐└┘│─├┤┬┴┼▓▒░█`).
 * - `isBalanced`: Every line's left-indent is within 30% of the template width
 *   from the median indent across all lines.
 * - `notTruncated`: The last non-empty line ends with a structural or border
 *   character, indicating the output was not cut mid-frame.
 *
 * Note: `isBalanced` flags many structurally correct templates that use
 * non-centered layouts. Requiring 4/4 causes excessive retries on valid output,
 * which is why the gate threshold is 3/4 rather than 4/4.
 *
 * @param content - The raw generated template string to evaluate.
 * @param sizePreset - The active size preset, used to derive minimum line and
 *   character thresholds.
 * @returns A `QualityReport` with boolean results for each check and a
 *   `score` from 0 to 4.
 */
export function qualityCheck(
  content: string,
  sizePreset: typeof SIZE_PRESETS[keyof typeof SIZE_PRESETS]
): QualityReport {
  const { width, height } = sizePreset
  const lines = content.split('\n').filter(l => l.trim().length > 0)

  // isComplete: minimum line count AND minimum char density
  const minLines = Math.max(3, Math.floor(height * 0.4))
  const minChars = Math.max(50, Math.floor(width * height * 0.05))
  const isComplete = lines.length >= minLines && content.replace(/\s/g, '').length >= minChars

  // hasStructure: ≥2 distinct border character types present
  const borderChars = new Set(
    content.split('').filter(c => '╔╗╚╝║═╠╣╦╩╬┌┐└┘│─├┤┬┴┼▓▒░█'.includes(c))
  )
  const hasStructure = borderChars.size >= 2

  // isBalanced: most lines have similar left indent (within 30% of template width)
  const indents = lines.map(l => l.length - l.trimStart().length)
  const sorted = [...indents].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0
  const isBalanced = indents.every(i => Math.abs(i - median) < width * 0.3)

  // notTruncated: last non-empty line ends with a structural/border char
  const lastLine = lines[lines.length - 1] ?? ''
  const lastChar = lastLine.trimEnd().slice(-1)
  const notTruncated = /[╔╗╚╝║═┌┐└┘│─▓▒░█\-=+*/\\|]/.test(lastChar)

  const checks = [isComplete, hasStructure, isBalanced, notTruncated]
  return {
    isComplete,
    hasStructure,
    isBalanced,
    notTruncated,
    score: checks.filter(Boolean).length,
  }
}

// Gate passes at ≥3 of 4 checks. Score 4/4 is uncommon in practice — isBalanced
// flags many structurally correct templates that use non-centered layouts.
// Requiring 4/4 would cause excessive retries on valid creative output.
const QUALITY_GATE_THRESHOLD = 3

// =============================================================================
// POISON DETECTION — catches reasoning text leaking into model output
//
// Gemini 3.x models with includeThoughts: false can still emit chain-of-thought
// as regular text for some prompt/size/style combos. These patterns are
// unambiguous reasoning signals — the model is narrating its process, not
// generating ASCII art. Conservative by design to avoid false positives.
// =============================================================================

/**
 * Detects whether a generated template contains leaked model reasoning text.
 *
 * Gemini 3.x models use `includeThoughts: false` to suppress chain-of-thought,
 * but certain prompt/size/style combinations cause reasoning text to appear in
 * the output as plain text rather than structured thought parts. This function
 * identifies those leaks before output is delivered to the user.
 *
 * Detection patterns (conservative — designed to avoid false positives):
 * - Bullet-prefixed reasoning steps: lines matching `* Let me`, `* Wait`,
 *   `* Ensure`, `* Return`, `* Remember`, `* Think`, `* First,`, `* Now,`,
 *   `* Next,`
 * - Conversational reasoning at line start: `Wait, `, `Let me `, `Let's `,
 *   `I need to ` (case-insensitive)
 * - Exact system prompt echo fragments that only appear if the model is
 *   parroting back its own instructions rather than generating output.
 *
 * @param content - The cleaned template string to inspect.
 * @returns `true` if reasoning text is detected; `false` if the content
 *   appears to be clean ASCII/Unicode output.
 */
function isPoisoned(content: string): boolean {
  const lines = content.split('\n')

  // Bullet reasoning steps: "* Let me...", "* Wait...", "* Ensure..."
  const bulletReasoning = /^\s*\*\s+(Let|Wait|Ensure|Return|Remember|Think|First,|Now,|Next,)/
  if (lines.some(l => bulletReasoning.test(l))) return true

  // Conversational reasoning at line start
  const reasoningLine = /^\s*(Wait,\s|Let me\s|Let's\s|I need to\s)/i
  if (lines.some(l => reasoningLine.test(l))) return true

  // Exact system prompt echo fragments — only appear if model is parroting its rules
  if (content.includes('is not to be used, just') ||
      content.includes('NO markdown blocks') ||
      content.includes('No markdown blocks')) return true

  return false
}

// Format a QualityReport into a user-readable error message with specific failure context.
function formatQualityError(quality: QualityReport): string {
  const failing = [
    !quality.isComplete    && 'incomplete',
    !quality.hasStructure  && 'no structure',
    !quality.isBalanced    && 'unbalanced',
    !quality.notTruncated  && 'truncated',
  ].filter(Boolean).join(', ')
  return `Quality gate failed (Q:${quality.score}/4${failing ? ` · ${failing}` : ''}). Try again or use a larger size.`
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Builds the user-turn prompt for a generation request.
 *
 * The user prompt contains three sections:
 * - `SIZE`: target width in characters and height in lines, with an instruction
 *   to fill the space.
 * - `BORDER STYLE`: the active border style name and its specific corner and line
 *   characters drawn from `BOX_CHARS`. Falls back to `BOX_CHARS.single` if the
 *   border style ID is not recognized.
 * - `REQUEST`: the sanitized user prompt string, truncated to `CONFIG.maxPromptLength`.
 *
 * The style design document is injected into the system prompt, not here. This
 * function intentionally excludes any style context — the user prompt contains
 * only technical dimensions and the request text.
 *
 * @param prompt - The raw user input string. Will be sanitized before embedding.
 * @param sizePreset - The active size preset, supplying `width` and `height`.
 * @param borderStyle - A border style ID key from `BOX_CHARS`
 *   (e.g. `'single'`, `'double'`, `'heavy'`, `'rounded'`).
 * @returns A formatted user prompt string ready to pass as `contents` to the
 *   Gemini API.
 */
function buildUserPrompt(
  prompt: string,
  sizePreset: typeof SIZE_PRESETS[keyof typeof SIZE_PRESETS],
  borderStyle: string
): string {
  const borderChars = BOX_CHARS[borderStyle as keyof typeof BOX_CHARS] || BOX_CHARS.single

  return `SIZE: ${sizePreset.width} chars wide × ${sizePreset.height} lines tall. Fill the space.

BORDER STYLE: ${borderStyle.toUpperCase()}
  Corners  ${borderChars.topLeft} ${borderChars.topRight} ${borderChars.bottomLeft} ${borderChars.bottomRight}   Lines  ${borderChars.horizontal} (horiz)  ${borderChars.vertical} (vert)

REQUEST: "${sanitizePrompt(prompt)}"

Generate a complete ASCII/Unicode template. Fill the size. Close every frame.`
}

function cleanResponse(text: string, maxWidth?: number, maxHeight?: number): string {
  let cleaned = text.trim()
  cleaned = cleaned.replace(/^```[\w]*\n?/gm, '')
  cleaned = cleaned.replace(/\n?```$/gm, '')
  cleaned = cleaned.trim()

  const width  = maxWidth  || CONFIG.ascii.maxWidth
  const height = maxHeight || CONFIG.ascii.maxHeight
  return cleaned.split('\n')
    .slice(0, height)
    .map(line => line.slice(0, width))
    .join('\n')
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

interface GeminiConfig {
  apiKey: string
  model?: string
}

class GeminiService {
  private client: GoogleGenAI | null = null
  private configuredModel: string = MODEL_FLASH

  initialize(config: GeminiConfig): void {
    this.client = new GoogleGenAI({ apiKey: config.apiKey })
    if (config.model?.trim()) this.configuredModel = config.model.trim()
  }

  isInitialized(): boolean {
    return this.client !== null
  }

  // ---------------------------------------------------------------------------
  // V2 PUBLIC ENTRY POINT — single output, mode-aware
  // ---------------------------------------------------------------------------

  /**
   * Generates a single ASCII/Unicode template using the Gemini API.
   *
   * Dispatches to SLOP mode or CRAFT mode based on `mode`. Both modes call
   * the same set of callbacks, but their behavior differs significantly:
   *
   * **SLOP mode** (`mode === 'slop'`):
   * - Makes a single streaming call to `MODEL_FLASH`.
   * - Calls `callbacks.onChunk` for each streamed text delta as it arrives.
   * - Runs `qualityCheck` on the raw buffer. If the score is below
   *   `QUALITY_GATE_THRESHOLD` and no retries have been used, calls
   *   `callbacks.onRetry` and repeats the generation once.
   * - Calls `callbacks.onComplete` with the final cleaned content and its
   *   `QualityReport` once streaming finishes and quality passes.
   *
   * **CRAFT mode** (`mode === 'craft'`):
   * - Phase 1 (Architect): Makes a buffered (non-streaming) call to `MODEL_PRO`.
   *   Calls `callbacks.onCraftPhase('architect')` before the call.
   * - Runs `qualityCheck` and `isPoisoned` on the Pro result. Calls
   *   `callbacks.onError` if either check fails — CRAFT mode does not retry.
   * - Phase 2 (Refine): Makes a streaming call to `MODEL_FLASH` to refine the
   *   Pro output, but buffers all chunks internally. `callbacks.onChunk` is
   *   NEVER called during CRAFT mode. Calls `callbacks.onCraftPhase('refining')`
   *   before this phase.
   * - Compares Flash and Pro quality scores. Calls `callbacks.onComplete` with
   *   whichever result scores higher. If Flash refinement throws, falls back to
   *   the Pro result silently.
   *
   * If the service has not been initialized via `initialize()`, calls
   * `callbacks.onError` immediately and returns.
   *
   * Respects the `signal` parameter — aborts at each async boundary if
   * `signal.aborted` is true.
   *
   * @param prompt - The user's raw template request text.
   * @param options - Generation options. If `undefined`, defaults apply:
   *   `size = 'standard'`, `style = 'sovereign'`, `border = 'single'`.
   * @param mode - `'slop'` for single-pass streaming, `'craft'` for two-pass
   *   architect + refine.
   * @param activeSkills - Map of currently active skill IDs to their injection
   *   text. Passed to `buildSystemPrompt` for skill sentence injection.
   * @param callbacks.onChunk - Called for each streamed text delta. Only fires
   *   in SLOP mode.
   * @param callbacks.onCraftPhase - Called when CRAFT mode transitions between
   *   phases. Receives `'architect'` before Phase 1 and `'refining'` before
   *   Phase 2. Optional.
   * @param callbacks.onRetry - Called when a quality gate retry is triggered in
   *   SLOP mode. Receives the retry attempt number (1-based). Optional.
   * @param callbacks.onComplete - Called once when generation succeeds. Receives
   *   the cleaned template string and the final `QualityReport`.
   * @param callbacks.onError - Called if generation fails at any point. Receives
   *   a user-facing `Error` with a descriptive message.
   * @param signal - `AbortSignal` used to cancel in-flight generation. The
   *   function checks `signal.aborted` at each async boundary and exits silently
   *   if aborted.
   * @returns A `Promise<void>` that resolves when generation completes or errors.
   *
   * @example
   * // SLOP mode — stream chunks to the UI as they arrive
   * await geminiService.generateTemplate(
   *   'a hacker terminal dashboard',
   *   { size: 'standard', style: 'sovereign', border: 'double' },
   *   'slop',
   *   activeSkills,
   *   {
   *     onChunk: (chunk) => appendToDisplay(chunk),
   *     onComplete: (content, quality) => finalizeDisplay(content, quality),
   *     onError: (err) => showError(err.message),
   *   },
   *   abortController.signal
   * )
   *
   * @example
   * // CRAFT mode — show phase labels, no streaming chunks
   * await geminiService.generateTemplate(
   *   'a mission control panel',
   *   { size: 'wide', style: 'siege', border: 'heavy' },
   *   'craft',
   *   activeSkills,
   *   {
   *     onChunk: () => {},  // never called in CRAFT mode
   *     onCraftPhase: (phase) => updateStatusLabel(phase),
   *     onComplete: (content, quality) => finalizeDisplay(content, quality),
   *     onError: (err) => showError(err.message),
   *   },
   *   abortController.signal
   * )
   */
  async generateTemplate(
    prompt: string,
    options: GeneratorOptions | undefined,
    mode: GenerationMode,
    activeSkills: ActiveSkillsMap,
    callbacks: {
      onChunk: (chunk: string) => void
      onCraftPhase?: (phase: 'architect' | 'refining') => void
      onRetry?: (attempt: number) => void
      onComplete: (content: string, quality: QualityReport) => void
      onError: (error: Error) => void
    },
    signal: AbortSignal
  ): Promise<void> {
    if (!this.client) {
      callbacks.onError(new Error('Gemini service not initialized. Please set your API key.'))
      return
    }

    const sizePreset    = options?.size   ? SIZE_PRESETS[options.size]  : SIZE_PRESETS.standard
    const selectedStyle = options?.style  ?? 'sovereign'
    const borderStyle   = options?.border ?? 'single'
    // Style doc injected into system prompt — model receives design mandate before the request
    const styleDoc     = getStyleDoc(selectedStyle)
    const systemPrompt = buildSystemPrompt(CORE_HEADER_PROMPT + '\n' + styleDoc, activeSkills)
    const userPrompt   = buildUserPrompt(prompt, sizePreset, borderStyle)

    if (mode === 'slop') {
      await this.runSlopMode(systemPrompt, userPrompt, sizePreset, callbacks, signal)
    } else {
      await this.runCraftMode(systemPrompt, userPrompt, sizePreset, callbacks, signal)
    }
  }

  // ---------------------------------------------------------------------------
  // SLOP MODE — single Flash call, streamed
  // ---------------------------------------------------------------------------

  private async runSlopMode(
    systemPrompt: string,
    userPrompt: string,
    sizePreset: typeof SIZE_PRESETS[keyof typeof SIZE_PRESETS],
    callbacks: {
      onChunk: (chunk: string) => void
      onRetry?: (attempt: number) => void
      onComplete: (content: string, quality: QualityReport) => void
      onError: (error: Error) => void
    },
    signal: AbortSignal,
    attempt = 0
  ): Promise<void> {
    const MAX_RETRIES = 1
    const config = GENERATION_CONFIG.SLOP

    try {
      let buffer = ''
      const response = await this.client!.models.generateContentStream({
        model: this.configuredModel,
        config: {
          systemInstruction: systemPrompt,
          temperature: config.temperature,
          topP: config.topP,
          maxOutputTokens: config.maxOutputTokens,
          thinkingConfig: config.thinkingConfig,
        },
        contents: userPrompt,
      })

      for await (const chunk of response) {
        if (signal.aborted) return
        const text = chunk.text ?? ''
        if (text) {
          buffer += text
          callbacks.onChunk(text)
        }
      }

      if (signal.aborted) return

      // Quality check on raw buffer before cleaning
      const quality = qualityCheck(buffer, sizePreset)
      if (quality.score < QUALITY_GATE_THRESHOLD && attempt < MAX_RETRIES) {
        callbacks.onRetry?.(attempt + 1)
        return this.runSlopMode(systemPrompt, userPrompt, sizePreset, callbacks, signal, attempt + 1)
      }

      const cleaned = cleanResponse(buffer, sizePreset.width, sizePreset.height)
      const finalQuality = qualityCheck(cleaned, sizePreset)

      if (isPoisoned(cleaned)) {
        callbacks.onError(new Error(
          'Thinking text detected in output — model leaked its reasoning. Retrying usually fixes this.'
        ))
        return
      }

      callbacks.onComplete(cleaned, finalQuality)
    } catch (error) {
      if (signal.aborted) return
      if (attempt < MAX_RETRIES && isRetryable(error)) {
        const delay = 1000 + Math.random() * 500
        await new Promise(resolve => setTimeout(resolve, delay))
        if (!signal.aborted) {
          callbacks.onRetry?.(attempt + 1)
          return this.runSlopMode(systemPrompt, userPrompt, sizePreset, callbacks, signal, attempt + 1)
        }
      }
      callbacks.onError(parseApiError(error))
    }
  }

  // ---------------------------------------------------------------------------
  // CRAFT MODE — Pro architect (buffered) → quality gate → Flash refine (buffered)
  //
  // AC-10g: Flash refine phase collects chunks into flashBuffer internally.
  // onChunk is NEVER called during CRAFT mode. Only onComplete fires with the winner.
  // This prevents the bait-and-switch visual where Flash content appears then snaps to Pro.
  // ---------------------------------------------------------------------------

  private async runCraftMode(
    systemPrompt: string,
    userPrompt: string,
    sizePreset: typeof SIZE_PRESETS[keyof typeof SIZE_PRESETS],
    callbacks: {
      onChunk: (chunk: string) => void
      onCraftPhase?: (phase: 'architect' | 'refining') => void
      onComplete: (content: string, quality: QualityReport) => void
      onError: (error: Error) => void
    },
    signal: AbortSignal
  ): Promise<void> {
    // ── Phase 1: Architect pass (Pro, buffered) ──────────────────────────────
    callbacks.onCraftPhase?.('architect')

    let proResult = ''
    try {
      const architectConfig = GENERATION_CONFIG.CRAFT_ARCHITECT
      const response = await this.client!.models.generateContent({
        model: MODEL_PRO,
        config: {
          systemInstruction: systemPrompt,
          temperature: architectConfig.temperature,
          topP: architectConfig.topP,
          maxOutputTokens: architectConfig.maxOutputTokens,
          thinkingConfig: architectConfig.thinkingConfig,
        },
        contents: userPrompt,
      })
      if (signal.aborted) return
      proResult = cleanResponse(response.text ?? '', sizePreset.width, sizePreset.height)
    } catch (error) {
      if (signal.aborted) return
      callbacks.onError(parseApiError(error))
      return
    }

    if (signal.aborted) return

    // ── Poison check on Pro result ────────────────────────────────────────────
    // includeThoughts: false suppresses structured thought parts but can still
    // leak reasoning text for some prompt/size combos. Catch it here before
    // the quality gate can be fooled by █ chars in reasoning text.
    if (isPoisoned(proResult)) {
      callbacks.onError(new Error(
        'Thinking text detected in output — model leaked its reasoning. Retrying usually fixes this.'
      ))
      return
    }

    // ── Quality gate on Pro result ────────────────────────────────────────────
    const proQuality = qualityCheck(proResult, sizePreset)
    if (proQuality.score < QUALITY_GATE_THRESHOLD) {
      // Pro result failed — report as error so user can retry via [RETRY]
      callbacks.onError(new Error(formatQualityError(proQuality)))
      return
    }

    // ── Phase 2: Refine pass (Flash, buffered internally) ────────────────────
    // AC-10g: onChunk is NOT called here. Flash chunks are buffered.
    // Winner (Flash or Pro) is sent via onComplete once refinement is complete.
    callbacks.onCraftPhase?.('refining')

    const refinePrompt = `Below is a complete ASCII template. Refine it:
- Tighten any inconsistent spacing
- Ensure all borders are consistent
- Improve visual balance if needed
- Keep ALL content — do not remove sections

Return the COMPLETE refined template. No explanation. No markdown fences.

${proResult}`

    let flashBuffer = ''
    try {
      const refineConfig = GENERATION_CONFIG.CRAFT_REFINE
      const response = await this.client!.models.generateContentStream({
        model: MODEL_FLASH,
        config: {
          systemInstruction: 'You are GLYPH, an expert ASCII art refinement specialist. Output only raw ASCII/Unicode art, nothing else.',
          temperature: refineConfig.temperature,
          topP: refineConfig.topP,
          maxOutputTokens: refineConfig.maxOutputTokens,
          thinkingConfig: refineConfig.thinkingConfig,
        },
        contents: refinePrompt,
      })

      for await (const chunk of response) {
        if (signal.aborted) return
        const text = chunk.text ?? ''
        if (text) {
          // Collect into internal buffer — do NOT forward to callbacks.onChunk
          flashBuffer += text
        }
      }
    } catch {
      if (signal.aborted) return
      // Flash refine failed — fall back to Pro result silently
      callbacks.onComplete(proResult, proQuality)
      return
    }

    if (signal.aborted) return

    // Use Flash result only if it passes quality gate; otherwise keep Pro
    const flashCleaned = cleanResponse(flashBuffer, sizePreset.width, sizePreset.height)
    const flashQuality = qualityCheck(flashCleaned, sizePreset)

    if (flashQuality.score >= proQuality.score) {
      callbacks.onComplete(flashCleaned, flashQuality)
    } else {
      callbacks.onComplete(proResult, proQuality)
    }
  }

}

// =============================================================================
// EXPORTS
// =============================================================================

export const geminiService = new GeminiService()
