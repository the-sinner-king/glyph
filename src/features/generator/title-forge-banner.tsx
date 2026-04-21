/**
 * TitleForgeBanner — Feature spotlight for the ASCII big-text generator.
 *
 * Demo mode (no input): cycles through DEMO_ITEMS (word + font pairs) every 2.8s.
 * Preview mode (user typing): renders their text and keeps cycling through
 * PREVIEW_FONTS on the same interval — so it keeps spinning styles as they watch.
 * "OPEN TITLE FORGE" launches the full 25-font modal.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import figlet from 'figlet'

// ─── Demo sequence ────────────────────────────────────────────────────────────

const DEMO_ITEMS = [
  { word: 'GLYPH',  font: 'ANSI Shadow' },
  { word: 'FORGE',  font: 'Doom'        },
  { word: 'VOID',   font: 'Big'         },
  { word: 'NEON',   font: 'Epic'        },
] as const

// Fonts cycled when user is previewing their own text — same proven set.
const PREVIEW_FONTS = ['ANSI Shadow', 'Doom', 'Big', 'Epic'] as const

const CYCLE_MS = 2800

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderAsync(text: string, font: string): Promise<string> {
  return new Promise((resolve, reject) => {
    figlet.text(
      text,
      {
        font: font as Parameters<typeof figlet.text>[1] extends { font?: infer F } ? F : string,
        fetchFontIfMissing: true,
      } as Parameters<typeof figlet.text>[1],
      (err: Error | null, result?: string) => {
        if (err) reject(err)
        else resolve(result?.trimEnd() || text)
      }
    )
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TitleForgeBannerProps {
  onOpen: () => void
}

export function TitleForgeBanner({ onOpen }: TitleForgeBannerProps) {
  const [demoIndex,       setDemoIndex]       = useState(0)
  const [demoArt,         setDemoArt]         = useState<string | null>(null)
  const [inputText,       setInputText]       = useState('')
  const [previewFontIndex, setPreviewFontIndex] = useState(0)
  const [previewArt,      setPreviewArt]      = useState<string | null>(null)
  const [previewPending,  setPreviewPending]  = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cycleRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef    = useRef<HTMLInputElement>(null)

  // ── Demo loading ─────────────────────────────────────────────────────────
  useEffect(() => {
    const item = DEMO_ITEMS[demoIndex]
    setDemoArt(null)
    renderAsync(item.word, item.font)
      .then(setDemoArt)
      .catch(() => setDemoArt(item.word))
  }, [demoIndex])

  // ── Auto-cycle ────────────────────────────────────────────────────────────
  // When idle: rotate demo words. When user has typed: rotate preview fonts.
  useEffect(() => {
    cycleRef.current = setInterval(() => {
      if (inputText) {
        setPreviewFontIndex(i => (i + 1) % PREVIEW_FONTS.length)
      } else {
        setDemoIndex(i => (i + 1) % DEMO_ITEMS.length)
      }
    }, CYCLE_MS)
    return () => { if (cycleRef.current) clearInterval(cycleRef.current) }
  }, [inputText])

  // ── Live preview (debounced) ───────────────────────────────────────────────
  // Re-runs on both inputText change (typing) and previewFontIndex change (cycle).
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!inputText.trim()) { setPreviewArt(null); setPreviewPending(false); return }
    setPreviewPending(true)
    debounceRef.current = setTimeout(() => {
      renderAsync(
        inputText.trim().toUpperCase().slice(0, 10),
        PREVIEW_FONTS[previewFontIndex],
      )
        .then(art => { setPreviewArt(art); setPreviewPending(false) })
        .catch(() => { setPreviewPending(false) })
    }, 150)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [inputText, previewFontIndex])

  const handleClear = useCallback(() => {
    setInputText('')
    setPreviewArt(null)
    setPreviewFontIndex(0)
    inputRef.current?.focus()
  }, [])

  // ── Derived display state ─────────────────────────────────────────────────
  const showPreview = inputText.length > 0
  const activeArt   = showPreview ? previewArt : demoArt
  const activeFont  = showPreview
    ? PREVIEW_FONTS[previewFontIndex].toUpperCase()
    : DEMO_ITEMS[demoIndex].font.toUpperCase()
  const isTransient = !activeArt || previewPending

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1], delay: 0.05 }}
      className="w-full"
    >
      {/* ── Outer shell ──────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-lg"
        style={{
          border: '1px solid color-mix(in srgb, var(--theme-primary) 28%, transparent)',
          background: 'color-mix(in srgb, var(--theme-primary) 3%, #0a0a0f)',
        }}
      >

        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{ borderBottom: '1px solid color-mix(in srgb, var(--theme-primary) 18%, transparent)' }}
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs" style={{ color: 'var(--theme-primary)' }}>⬡</span>
            <span className="font-mono text-xs tracking-widest" style={{ color: 'var(--theme-primary)' }}>
              TITLE FORGE
            </span>
            <span className="font-mono text-xs" style={{ color: 'color-mix(in srgb, var(--theme-dim) 60%, transparent)' }}>
              — ASCII BIG TEXT — 25 FONTS
            </span>
          </div>

          <button
            onClick={onOpen}
            className="font-mono text-xs px-2.5 py-1 rounded border transition-all duration-200 hover:bg-[color:var(--theme-primary)]/10 whitespace-nowrap"
            style={{
              color: 'var(--theme-primary)',
              borderColor: 'color-mix(in srgb, var(--theme-primary) 45%, transparent)',
            }}
            type="button"
          >
            OPEN →
          </button>
        </div>

        {/* ── Art preview area ─────────────────────────────────────────────── */}
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{ minHeight: '108px', padding: '12px 16px' }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 60% 70% at 50% 50%, color-mix(in srgb, var(--theme-primary) 6%, transparent), transparent)',
            }}
          />

          <AnimatePresence mode="wait">
            {isTransient ? (
              <motion.div
                key="dots"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="font-mono text-xs tracking-widest select-none"
                style={{ color: 'color-mix(in srgb, var(--theme-dim) 35%, transparent)' }}
              >
                ···
              </motion.div>
            ) : (
              <motion.pre
                key={showPreview ? `preview-${previewFontIndex}` : `demo-${demoIndex}`}
                initial={{ opacity: 0, y: 6,  scale: 0.985 }}
                animate={{ opacity: 1, y: 0,  scale: 1     }}
                exit={   { opacity: 0, y: -6, scale: 0.985 }}
                transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
                className="font-mono leading-snug text-center overflow-hidden select-none"
                style={{
                  fontSize: '9px',
                  lineHeight: '1.18',
                  color: showPreview
                    ? 'var(--theme-primary)'
                    : 'color-mix(in srgb, var(--theme-primary) 75%, transparent)',
                  textShadow: showPreview
                    ? '0 0 12px color-mix(in srgb, var(--theme-primary) 50%, transparent)'
                    : '0 0 8px color-mix(in srgb, var(--theme-primary) 30%, transparent)',
                  maxWidth: '100%',
                  whiteSpace: 'pre',
                }}
              >
                {activeArt}
              </motion.pre>
            )}
          </AnimatePresence>
        </div>

        {/* ── Bottom bar ───────────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 px-3 py-2"
          style={{ borderTop: '1px solid color-mix(in srgb, var(--theme-primary) 15%, transparent)' }}
        >
          {/* Active font chip */}
          <AnimatePresence mode="wait">
            <motion.span
              key={activeFont}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={   { opacity: 0, y: -3 }}
              transition={{ duration: 0.2 }}
              className="font-mono text-xs shrink-0 select-none"
              style={{ color: 'color-mix(in srgb, var(--theme-dim) 55%, transparent)' }}
            >
              {activeFont}
            </motion.span>
          </AnimatePresence>

          <span
            className="font-mono text-xs shrink-0 select-none"
            style={{ color: 'color-mix(in srgb, var(--theme-dim) 30%, transparent)' }}
          >
            ·
          </span>

          {/* Inline preview input */}
          <div className="flex-1 flex items-center gap-1.5 min-w-0">
            <span
              className="font-mono text-xs shrink-0 select-none"
              style={{ color: 'color-mix(in srgb, var(--theme-primary) 45%, transparent)' }}
            >
              {'>'}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              maxLength={10}
              placeholder="TYPE TO PREVIEW..."
              className="bg-transparent outline-none font-mono text-xs tracking-wide w-full min-w-0 placeholder-[color:var(--theme-dim)] opacity-60 focus:opacity-100 transition-opacity"
              style={{ color: 'var(--theme-text)' }}
              onClick={e => e.stopPropagation()}
            />
            {inputText && (
              <button
                onClick={handleClear}
                type="button"
                className="font-mono text-xs shrink-0 transition-colors hover:text-[color:var(--theme-primary)]"
                style={{ color: 'color-mix(in srgb, var(--theme-dim) 50%, transparent)' }}
              >
                ×
              </button>
            )}
          </div>

          {/* Full forge button */}
          <button
            onClick={onOpen}
            className="font-mono text-xs px-3 py-1.5 rounded border shrink-0 transition-all duration-200 hover:bg-[color:var(--theme-primary)]/12 hover:border-[color:var(--theme-primary)]/60"
            style={{
              color: 'var(--theme-primary)',
              borderColor: 'color-mix(in srgb, var(--theme-primary) 38%, transparent)',
            }}
            type="button"
          >
            OPEN TITLE FORGE
          </button>
        </div>
      </div>
    </motion.section>
  )
}
