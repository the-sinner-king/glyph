/**
 * GLYPH — Cyberpunk ASCII Template Generator
 *
 * Built by Claude (The Forge) for Brandon McCormick // The Sinner King
 * Zero backend. Gemini AI. Five style identities: SOVEREIGN · WRAITH · RELIC · FERAL · SIEGE
 *
 * v1.0.3 — https://github.com/the-sinner-king/glyph
 */

// GLYPH - Shared Constants and Configuration

// Size presets for template generation
export const SIZE_PRESETS = {
  compact: { id: 'compact', label: 'COMPACT', width: 40, height: 20, description: 'Discord-friendly' },
  standard: { id: 'standard', label: 'STANDARD', width: 80, height: 24, description: 'Terminal classic' },
  wide: { id: 'wide', label: 'WIDE', width: 120, height: 30, description: 'Splash screens' },
  banner: { id: 'banner', label: 'BANNER', width: 80, height: 8, description: 'Thin headers' },
} as const

export type SizePresetId = keyof typeof SIZE_PRESETS

// Color themes for the UI — multi-tone system: primary + secondary + accent per theme
export const COLOR_THEMES = {
  amber: {
    id: 'amber',
    label: 'AMBER',
    primary: '#f59e0b',
    secondary: '#06b6d4',
    accent: '#ef4444',
    text: '#fcd34d',
    dim: '#78350f',
    glow: 'rgba(245, 158, 11, 0.32)',
    glow2: 'rgba(6, 182, 212, 0.22)',
    border: '#3a2800',
    inputBg: '#0d0900',
    bg: 'radial-gradient(ellipse at 40% 60%, #1a1000 0%, #0d0800 50%, #050505 100%)',
  },
  green: {
    id: 'green',
    label: 'GREEN',
    primary: '#22c55e',
    secondary: '#a855f7',
    accent: '#f59e0b',
    text: '#86efac',
    dim: '#14532d',
    glow: 'rgba(34, 197, 94, 0.30)',
    glow2: 'rgba(168, 85, 247, 0.22)',
    border: '#002200',
    inputBg: '#001200',
    bg: 'radial-gradient(ellipse at 40% 60%, #001800 0%, #0a0a0a 70%, #050505 100%)',
  },
  blue: {
    id: 'blue',
    label: 'BLUE',
    primary: '#06b6d4',
    secondary: '#f59e0b',
    accent: '#8b5cf6',
    text: '#67e8f9',
    dim: '#164e63',
    glow: 'rgba(6, 182, 212, 0.30)',
    glow2: 'rgba(245, 158, 11, 0.22)',
    border: '#001a2e',
    inputBg: '#00101a',
    bg: 'radial-gradient(ellipse at 40% 60%, #001a20 0%, #0a0a0a 70%, #050505 100%)',
  },
  pink: {
    id: 'pink',
    label: 'PINK',
    primary: '#ec4899',
    secondary: '#00d4aa',
    accent: '#ffd700',
    text: '#f9a8d4',
    dim: '#831843',
    glow: 'rgba(236, 72, 153, 0.30)',
    glow2: 'rgba(0, 212, 170, 0.22)',
    border: '#3a0050',
    inputBg: '#0d0010',
    bg: 'radial-gradient(ellipse at 40% 60%, #1a0018 0%, #0d0008 50%, #050505 100%)',
  },
  white: {
    id: 'white',
    label: 'WHITE',
    primary: '#e5e5e5',
    secondary: '#06b6d4',
    accent: '#f59e0b',
    text: '#ffffff',
    dim: '#525252',
    glow: 'rgba(229, 229, 229, 0.18)',
    glow2: 'rgba(6, 182, 212, 0.15)',
    border: '#2a2a2a',
    inputBg: '#111111',
    bg: 'radial-gradient(ellipse at 40% 60%, #1a1a1a 0%, #0a0a0a 70%, #050505 100%)',
  },
} as const

export type ColorThemeId = keyof typeof COLOR_THEMES

// App configuration
export const CONFIG = {
  appName: 'GLYPH',
  appVersion: '1.0.5',
  appTagline: 'CYBERPUNK TEXT-UI GENERATOR',

  // Generation settings
  maxPromptLength: 500,

  // ASCII art constraints
  ascii: {
    maxWidth: 80,
    maxHeight: 40,
    defaultWidth: 60,
  },

  // Animation timings (ms)
  animation: {
    typingSpeed: 30,
    cursorBlink: 530,
    transitionDuration: 300,
    staggerDelay: 100,
  },

  // Sound settings
  sound: {
    enabled: false, // No sounds ship with the repo — enable once audio files are added
    volume: 0.3,
  },
} as const

// Keyboard shortcuts
export const SHORTCUTS = {
  generate: 'Enter',
  regenerate: 'ctrl+Enter',
  copy: 'ctrl+c',
  toggleTemplate: 'Tab',
  clear: 'Escape',
} as const

// Figlet fonts — only include fonts registered in src/lib/services/ascii.ts
// To add more: register with figlet.parseFont() in ascii.ts first
export const FIGLET_FONTS = [
  'Standard',
  'Slant',
  'Banner',
] as const

// Template style options
export const TEMPLATE_STYLES = [
  { id: 'sovereign', label: 'SOVEREIGN', description: 'Industrial brutalism — fortress architecture, data density, double-line authority' },
  { id: 'wraith',    label: 'WRAITH',    description: 'Negative space principle — hairline borders, content that breathes, presence through restraint' },
  { id: 'relic',     label: 'RELIC',     description: 'Pre-Unicode archaeology — ASCII-only structures, typewriter warmth, the terminal that outlived its era' },
  { id: 'feral',     label: 'FERAL',     description: 'The loved machine — mixed-register borders, gel meters, ornament as communication' },
  { id: 'siege',     label: 'SIEGE',     description: 'Decision-speed data — military ops display, ALLCAPS, column anchors, zero decoration without signal' },
] as const

// Box drawing characters for templates
export const BOX_CHARS = {
  // Single line
  single: {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    horizontal: '─',
    vertical: '│',
    teeLeft: '├',
    teeRight: '┤',
    teeTop: '┬',
    teeBottom: '┴',
    cross: '┼',
  },
  // Double line
  double: {
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    horizontal: '═',
    vertical: '║',
    teeLeft: '╠',
    teeRight: '╣',
    teeTop: '╦',
    teeBottom: '╩',
    cross: '╬',
  },
  // Heavy
  heavy: {
    topLeft: '┏',
    topRight: '┓',
    bottomLeft: '┗',
    bottomRight: '┛',
    horizontal: '━',
    vertical: '┃',
    teeLeft: '┣',
    teeRight: '┫',
    teeTop: '┳',
    teeBottom: '┻',
    cross: '╋',
  },
  // Rounded
  rounded: {
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
    horizontal: '─',
    vertical: '│',
    teeLeft: '├',
    teeRight: '┤',
    teeTop: '┬',
    teeBottom: '┴',
    cross: '┼',
  },
} as const

// Block characters for visual elements
export const BLOCK_CHARS = {
  full: '█',
  dark: '▓',
  medium: '▒',
  light: '░',
  upperHalf: '▀',
  lowerHalf: '▄',
  leftHalf: '▌',
  rightHalf: '▐',
} as const

// Decorative elements
export const DECORATIVE = {
  bullet: '•',
  diamond: '◆',
  arrow: {
    right: '→',
    left: '←',
    up: '↑',
    down: '↓',
    double: {
      right: '»',
      left: '«',
    },
  },
  star: '★',
  check: '✓',
  cross: '✗',
  gear: '⚙',
  lightning: '⚡',
  skull: '☠',
  radioactive: '☢',
  biohazard: '☣',
} as const

// Loading spinner frames
export const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] as const
export const SPINNER_ALT_FRAMES = ['|', '/', '-', '\\'] as const

// Border style labels for UI
export const BORDER_STYLES = [
  { id: 'single', label: 'SINGLE', preview: '┌─┐' },
  { id: 'double', label: 'DOUBLE', preview: '╔═╗' },
  { id: 'heavy', label: 'HEAVY', preview: '┏━┓' },
  { id: 'rounded', label: 'ROUNDED', preview: '╭─╮' },
] as const

export type BorderStyleId = keyof typeof BOX_CHARS

// Type exports
export type FigletFont = typeof FIGLET_FONTS[number]
export type TemplateStyle = typeof TEMPLATE_STYLES[number]
export type BoxCharSet = keyof typeof BOX_CHARS
