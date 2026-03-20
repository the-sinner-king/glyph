// ASCII Art Generation Service for GLYPH
// Handles local ASCII generation with figlet and box-drawing utilities

import figlet from 'figlet'
// @ts-expect-error - figlet fonts don't have type declarations
import standard from 'figlet/importable-fonts/Standard'
// @ts-expect-error - figlet fonts don't have type declarations
import slant from 'figlet/importable-fonts/Slant'
// @ts-expect-error - figlet fonts don't have type declarations
import banner from 'figlet/importable-fonts/Banner'

import { BOX_CHARS, BLOCK_CHARS, type BoxCharSet } from '@/lib/constants'

// Register pre-bundled fonts (zero load time)
figlet.parseFont('Standard', standard)
figlet.parseFont('Slant', slant)
figlet.parseFont('Banner', banner)

// Configure lazy font loading for Title Forge.
// import.meta.env.BASE_URL is replaced at build time by Vite with the correct base path
// (e.g. '/glyph/' on GitHub Pages, '/' in dev). This fixes the subdirectory path bug.
figlet.defaults({
  fontPath: `${import.meta.env.BASE_URL}assets/fonts`.replace(/\/\//g, '/'),
  fetchFontIfMissing: true,
})

type RegisteredFont = 'Standard' | 'Slant' | 'Banner'

/**
 * Renders a string as large ASCII text using figlet.
 *
 * Three fonts are pre-registered at module load time with zero network cost:
 * - `'Standard'` — classic figlet block letters (default)
 * - `'Slant'`    — italic-style slanted letters
 * - `'Banner'`   — wide, horizontally-expanded banner letters
 *
 * Additional fonts beyond these three will trigger a network fetch via figlet's
 * lazy loading, using the Vite `BASE_URL`-prefixed font path configured at
 * module initialization. Do not pass font names outside `RegisteredFont` unless
 * you have added them to `FIGLET_FONTS` in `constants.ts` and registered them
 * with `figlet.parseFont()` in this file.
 *
 * @param text - The string to render as ASCII art.
 * @param font - The figlet font to use. Defaults to `'Standard'`.
 *   Must be one of the three pre-registered fonts to avoid a network fetch.
 * @returns A `Promise` that resolves to the rendered ASCII art string, or an
 *   empty string if figlet returns a falsy result.
 * @throws The figlet callback error if rendering fails (e.g., font not found,
 *   invalid font data).
 *
 * @example
 * const art = await generateAsciiText('GLYPH', 'Slant')
 * // Returns multi-line slanted ASCII art for "GLYPH"
 */
export function generateAsciiText(
  text: string,
  font: RegisteredFont = 'Standard'
): Promise<string> {
  return new Promise((resolve, reject) => {
    figlet.text(
      text,
      {
        font,
        horizontalLayout: 'default',
        verticalLayout: 'default',
      },
      (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result || '')
        }
      }
    )
  })
}

/**
 * Wraps a multi-line content string in a box drawn with the specified border style.
 *
 * The box width is determined by the longest line in `content` plus `padding`
 * spaces on each side. All lines are padded to the same width with trailing
 * spaces before the right border is applied.
 *
 * Border character sets are defined in `BOX_CHARS` in `constants.ts`:
 * - `'single'`  — thin single-line box (`┌─┐ │ └─┘`)
 * - `'double'`  — double-line box (`╔═╗ ║ ╚═╝`)
 * - `'heavy'`   — heavy single-line box (`┏━┓ ┃ ┗━┛`)
 * - `'rounded'` — rounded corners with single lines (`╭─╮ │ ╰─╯`)
 *
 * @param content - The string to enclose. May contain newlines; each line
 *   becomes a separate row in the box.
 * @param style - The border character set to use. Defaults to `'single'`.
 * @param padding - Number of spaces to add between content and the left/right
 *   borders. Defaults to `1`.
 * @returns The complete box as a single string with newline-separated rows.
 *
 * @example
 * createBox('hello\nworld', 'double', 2)
 * // ╔════════╗
 * // ║  hello ║
 * // ║  world ║
 * // ╚════════╝
 */
export function createBox(
  content: string,
  style: BoxCharSet = 'single',
  padding: number = 1
): string {
  const chars = BOX_CHARS[style]
  const lines = content.split('\n')
  const maxWidth = Math.max(...lines.map(l => l.length))
  const paddedWidth = maxWidth + padding * 2

  const horizontalBorder = chars.horizontal.repeat(paddedWidth)
  const paddingStr = ' '.repeat(padding)

  const boxedLines = [
    `${chars.topLeft}${horizontalBorder}${chars.topRight}`,
    ...lines.map(line => {
      const paddedLine = line.padEnd(maxWidth)
      return `${chars.vertical}${paddingStr}${paddedLine}${paddingStr}${chars.vertical}`
    }),
    `${chars.bottomLeft}${horizontalBorder}${chars.bottomRight}`,
  ]

  return boxedLines.join('\n')
}

/**
 * Wraps a multi-line content string in a box with a title embedded in the top border.
 *
 * The title appears in the top border, preceded by two horizontal border characters
 * and surrounded by a single space on each side (e.g. `╔══ My Title ═══╗`).
 * The box width is determined by the wider of: the longest content line or
 * `titleDisplay.length + 4` (title with border padding).
 *
 * Each content line is padded to `maxWidth - 2` characters with a leading and
 * trailing space inside the vertical borders.
 *
 * @param title - The title string to embed in the top border. Will be surrounded
 *   by single spaces: ` ${title} `.
 * @param content - The body content. May contain newlines.
 * @param style - The border character set to use. Defaults to `'double'`.
 * @returns The complete titled box as a single newline-separated string.
 *
 * @example
 * createTitledBox('STATUS', 'All systems nominal\nUptime: 99.9%', 'double')
 * // ╔══ STATUS ══════════════╗
 * // ║ All systems nominal    ║
 * // ║ Uptime: 99.9%          ║
 * // ╚════════════════════════╝
 */
export function createTitledBox(
  title: string,
  content: string,
  style: BoxCharSet = 'double'
): string {
  const chars = BOX_CHARS[style]
  const lines = content.split('\n')
  const titleDisplay = ` ${title} `
  const maxWidth = Math.max(
    ...lines.map(l => l.length),
    titleDisplay.length + 4
  )

  const topBorder = chars.horizontal.repeat(2) +
    titleDisplay +
    chars.horizontal.repeat(maxWidth - titleDisplay.length - 2)

  const bottomBorder = chars.horizontal.repeat(maxWidth)

  const boxedLines = [
    `${chars.topLeft}${topBorder}${chars.topRight}`,
    ...lines.map(line => {
      const paddedLine = ` ${line.padEnd(maxWidth - 2)} `
      return `${chars.vertical}${paddedLine}${chars.vertical}`
    }),
    `${chars.bottomLeft}${bottomBorder}${chars.bottomRight}`,
  ]

  return boxedLines.join('\n')
}

/**
 * Generates a text-based progress bar.
 *
 * The bar is enclosed in square brackets. Filled positions use `filled`
 * (defaults to `BLOCK_CHARS.full` = `█`) and empty positions use `empty`
 * (defaults to `BLOCK_CHARS.light` = `░`). The number of filled characters
 * is calculated by rounding `(progress / 100) * width`.
 *
 * @param progress - Completion percentage from 0 to 100.
 * @param width - Total number of fill characters inside the brackets.
 *   Defaults to `20`.
 * @param filled - Character used for completed portion. Defaults to `█`
 *   (`BLOCK_CHARS.full`).
 * @param empty - Character used for remaining portion. Defaults to `░`
 *   (`BLOCK_CHARS.light`).
 * @returns A string in the format `[████░░░░░░]`.
 *
 * @example
 * createProgressBar(75, 10)
 * // '[████████░░]'
 *
 * @example
 * createProgressBar(50, 8, '▓', '·')
 * // '[▓▓▓▓····]'
 */
export function createProgressBar(
  progress: number,
  width: number = 20,
  filled: string = BLOCK_CHARS.full,
  empty: string = BLOCK_CHARS.light
): string {
  const filledCount = Math.round((progress / 100) * width)
  const emptyCount = width - filledCount
  return `[${filled.repeat(filledCount)}${empty.repeat(emptyCount)}]`
}

/**
 * Generates a horizontal divider line of the specified width and style.
 *
 * Available styles and their characters:
 * - `'single'` — `─` (thin single-line, matches single-line box borders)
 * - `'double'` — `═` (double-line, matches double-line box borders)
 * - `'dotted'` — `·` (spaced dot, used in WRAITH style for subtle separation)
 * - `'dashed'` — `┄` (dashed single-line)
 *
 * @param width - Total number of characters in the divider. Defaults to `40`.
 * @param style - Divider character style. Defaults to `'single'`.
 * @returns A string of `width` repeated divider characters.
 *
 * @example
 * createDivider(20, 'double')
 * // '════════════════════'
 *
 * @example
 * createDivider(10, 'dotted')
 * // '··········'
 */
export function createDivider(
  width: number = 40,
  style: 'single' | 'double' | 'dotted' | 'dashed' = 'single'
): string {
  const chars = {
    single: '─',
    double: '═',
    dotted: '·',
    dashed: '┄',
  }
  return chars[style].repeat(width)
}

/**
 * Returns a single Braille-based spinner frame for the given frame index.
 *
 * Uses a 10-frame Braille dot animation sequence:
 * `['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']`
 *
 * The `frame` argument wraps via modulo, so callers can pass an incrementing
 * counter without bounds-checking.
 *
 * @param frame - The current frame index. Wraps modulo 10, so any non-negative
 *   integer is valid.
 * @returns A single spinner character string.
 *
 * @example
 * // Animate a spinner by incrementing frame on each tick
 * let frame = 0
 * const interval = setInterval(() => {
 *   process.stdout.write(`\r${createSpinnerFrame(frame++)} Loading...`)
 * }, 80)
 */
export function createSpinnerFrame(frame: number): string {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  return frames[frame % frames.length]
}

/**
 * Formats a label-value pair as a fixed-width status line with dot-fill padding.
 *
 * The label and value are separated by dot characters (`'.'`) that fill the
 * space between them. The total line length is `width` characters. If the
 * combined length of label and value plus two separator spaces exceeds `width`,
 * `Math.max(0, ...)` prevents negative repeat counts — the dots section simply
 * collapses to zero characters.
 *
 * @param label - The left-side label string.
 * @param value - The right-side value string.
 * @param width - Target total line width in characters. Defaults to `40`.
 * @returns A string with format `"LABEL......VALUE"` padded to approximately
 *   `width` characters.
 *
 * @example
 * createStatusLine('STATUS', 'ACTIVE', 30)
 * // 'STATUS..................ACTIVE'
 *
 * @example
 * createStatusLine('CPU', '94%', 20)
 * // 'CPU...............94%'
 */
export function createStatusLine(
  label: string,
  value: string,
  width: number = 40
): string {
  const dots = '.'.repeat(Math.max(0, width - label.length - value.length - 2))
  return `${label}${dots}${value}`
}

/**
 * Formats a single menu item with a selection indicator and index prefix.
 *
 * Selected items use `▶` as the bullet and `[index]` as the index prefix.
 * Unselected items use `○` as the bullet and ` index ` (space-padded) as the
 * index prefix.
 *
 * @param index - The item's position number in the menu (displayed as-is, not
 *   zero-indexed internally).
 * @param label - The display text for the menu item.
 * @param isSelected - Whether this item is currently selected. Defaults to
 *   `false`.
 * @returns A formatted menu item string, e.g. `"▶ [1] Dashboard"` or
 *   `"○  2  Reports"`.
 *
 * @example
 * createMenuItem(1, 'Dashboard', true)
 * // '▶ [1] Dashboard'
 *
 * @example
 * createMenuItem(2, 'Reports', false)
 * // '○  2  Reports'
 */
export function createMenuItem(
  index: number,
  label: string,
  isSelected: boolean = false
): string {
  const bullet = isSelected ? '▶' : '○'
  const prefix = isSelected ? `[${index}]` : ` ${index} `
  return `${bullet} ${prefix} ${label}`
}

/**
 * Creates a simple single-line banner box containing the provided text.
 *
 * The banner is always three lines tall: a top border, the text row, and a
 * bottom border. The text is surrounded by a single space on each side inside
 * the border. The total interior width is `text.length + 4` characters
 * (`' ' + text + ' '` plus one additional space on each side from the
 * `paddedText` construction).
 *
 * For multi-line content or a title embedded in the border, use
 * `createTitledBox` instead.
 *
 * @param text - The banner text to display.
 * @param style - The border character set to use. Defaults to `'double'`.
 * @returns A three-line banner string.
 *
 * @example
 * createBanner('GLYPH v1.0', 'double')
 * // ╔══════════════╗
 * // ║  GLYPH v1.0  ║
 * // ╚══════════════╝
 */
export function createBanner(
  text: string,
  style: BoxCharSet = 'double'
): string {
  const chars = BOX_CHARS[style]
  const paddedText = ` ${text} `
  const width = paddedText.length + 2

  return [
    `${chars.topLeft}${chars.horizontal.repeat(width)}${chars.topRight}`,
    `${chars.vertical} ${paddedText} ${chars.vertical}`,
    `${chars.bottomLeft}${chars.horizontal.repeat(width)}${chars.bottomRight}`,
  ].join('\n')
}

/**
 * Pre-built template factory functions for common alert/status box types.
 *
 * Each preset is a function that accepts a `message` string and returns a
 * complete titled box string using `createTitledBox`. The title and border
 * style are fixed per preset:
 *
 * - `alertBox`   — title `'⚠ ALERT'`,   border `'double'`
 * - `successBox` — title `'✓ SUCCESS'`,  border `'rounded'`
 * - `errorBox`   — title `'✗ ERROR'`,    border `'heavy'`
 * - `infoBox`    — title `'ℹ INFO'`,     border `'single'`
 *
 * @example
 * TEMPLATE_PRESETS.alertBox('Disk usage exceeds 90%')
 * // ╔══ ⚠ ALERT ══════════════════════╗
 * // ║ Disk usage exceeds 90%          ║
 * // ╚═════════════════════════════════╝
 *
 * @example
 * TEMPLATE_PRESETS.errorBox('Connection refused\nCheck your API key')
 * // ┏══ ✗ ERROR ══════════════════════┓
 * // ┃ Connection refused              ┃
 * // ┃ Check your API key              ┃
 * // ┗═════════════════════════════════┛
 */
export const TEMPLATE_PRESETS = {
  alertBox: (message: string) => createTitledBox('⚠ ALERT', message, 'double'),
  successBox: (message: string) => createTitledBox('✓ SUCCESS', message, 'rounded'),
  errorBox: (message: string) => createTitledBox('✗ ERROR', message, 'heavy'),
  infoBox: (message: string) => createTitledBox('ℹ INFO', message, 'single'),
}
