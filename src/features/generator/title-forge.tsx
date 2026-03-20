/**
 * TitleForge — Big Text Mode
 *
 * TAAG-style ASCII font browser. Type text, see it rendered in all 25 curated
 * cyberpunk fonts simultaneously. Lazy-loads .flf files from public/assets/fonts/.
 * No AI calls — pure client-side figlet.js.
 *
 * Performance: content-visibility:auto skips off-screen renders.
 * useDeferredValue decouples typing from the heavy font render list.
 */

import { useState, useEffect, useDeferredValue, useCallback } from 'react'
import figlet from 'figlet'
import { motion, AnimatePresence } from 'motion/react'
import { TerminalPanel, CyberButton } from '@/components/ui'

// ─── Curated font list ────────────────────────────────────────────────────────
// 25 best cyberpunk/terminal fonts from figlet's 329.
// Files served from public/assets/fonts/ via fetchFontIfMissing: true.
const TITLE_FORGE_FONTS = [
  'ANSI Shadow',
  'Doom',
  'Big',
  'Graffiti',
  'Slant',
  'Electronic',
  'Cyberlarge',
  'Block',
  'Star Wars',
  'Delta Corps Priest 1',
  '3D-ASCII',
  'Larry 3D',
  'Isometric1',
  'Epic',
  'Ghost',
  'Fire Font-k',
  'Banner3',
  'Big Money-nw',
  'Bloody',
  'Double',
  'Lean',
  'Speed',
  'Chunky',
  'Broadway',
  'Standard',
] as const

type TitleFont = typeof TITLE_FORGE_FONTS[number]

interface FontResult {
  font: TitleFont
  output: string | null   // null = loading, '' = error/empty
  loading: boolean
  error: boolean
}

const TRANSITION = {
  duration: 0.4,
  ease: [0.25, 0.1, 0.25, 1] as const,
}

interface TitleForgeProps {
  isOpen: boolean
  onClose: () => void
}

// Render text in one font — returns promise
async function renderFont(text: string, font: TitleFont): Promise<string> {
  return new Promise((resolve, reject) => {
    figlet.text(text, { font: font as Parameters<typeof figlet.text>[1] extends { font?: infer F } ? F : string }, (err: Error | null, result?: string) => {
      if (err) reject(err)
      else resolve(result ?? '')
    })
  })
}

export function TitleForge({ isOpen, onClose }: TitleForgeProps) {
  const [inputText, setInputText] = useState('GLYPH')
  const [selectedFont, setSelectedFont] = useState<TitleFont | null>(null)
  const [copiedFont, setCopiedFont] = useState<TitleFont | null>(null)
  const [results, setResults] = useState<Record<TitleFont, FontResult>>(() =>
    Object.fromEntries(
      TITLE_FORGE_FONTS.map(f => [f, { font: f, output: null, loading: false, error: false }])
    ) as Record<TitleFont, FontResult>
  )

  // useDeferredValue: typing stays snappy, font renders catch up
  const deferredText = useDeferredValue(inputText)

  // Render all fonts when deferred text changes.
  // No synchronous setState — loading is derived from output === null (initial/reset value).
  // Each font promise resolves independently and updates its own slice of state.
  useEffect(() => {
    if (!isOpen || !deferredText.trim()) return

    // Render each font independently — results paint as they arrive
    TITLE_FORGE_FONTS.forEach(font => {
      renderFont(deferredText, font)
        .then(output => {
          setResults(prev => ({
            ...prev,
            [font]: { font, output, loading: false, error: false },
          }))
        })
        .catch(() => {
          setResults(prev => ({
            ...prev,
            [font]: { font, output: '', loading: false, error: true },
          }))
        })
    })
  }, [deferredText, isOpen])

  const handleCopy = useCallback(async (font: TitleFont) => {
    const output = results[font]?.output
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = output
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopiedFont(font)
    setTimeout(() => setCopiedFont(null), 2000)
  }, [results])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={TRANSITION}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-terminal-dark/90 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: -10 }}
            transition={TRANSITION}
            className="w-full max-w-4xl max-h-[90vh] flex flex-col"
          >
            <TerminalPanel variant="glow" title="⬡ TITLE FORGE — BIG TEXT MODE">
              <div className="space-y-4">
                {/* Input */}
                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value.slice(0, 24))}
                    placeholder="Enter text..."
                    className="flex-1 bg-transparent border rounded px-3 py-2 font-mono text-sm outline-none focus:ring-1"
                    style={{
                      borderColor: 'color-mix(in srgb, var(--theme-primary) 40%, transparent)',
                      color: 'var(--theme-text)',
                      caretColor: 'var(--theme-primary)',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--theme-primary)'}
                    onBlur={e => e.target.style.borderColor = 'color-mix(in srgb, var(--theme-primary) 40%, transparent)'}
                    autoFocus
                    maxLength={24}
                  />
                  <span className="font-mono text-xs" style={{ color: 'var(--theme-dim)' }}>
                    {inputText.length}/24
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-ui" style={{ color: 'var(--theme-dim)' }}>
                  <span>{TITLE_FORGE_FONTS.length} fonts</span>
                  <span>•</span>
                  <span>Lazy-loaded via figlet.js</span>
                  {inputText !== deferredText && (
                    <>
                      <span>•</span>
                      <span style={{ color: 'var(--theme-primary)' }}>rendering…</span>
                    </>
                  )}
                </div>

                {/* Font gallery — content-visibility:auto skips off-screen renders */}
                <div
                  className="overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-track-transparent"
                  style={{
                    maxHeight: '60vh',
                    scrollbarColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent) transparent',
                  }}
                >
                  {TITLE_FORGE_FONTS.map(font => {
                    const result = results[font]
                    const isSelected = selectedFont === font
                    const output = result?.output

                    return (
                      <div
                        key={font}
                        className="rounded-lg border overflow-hidden cursor-pointer transition-colors"
                        style={{
                          borderColor: isSelected
                            ? 'var(--theme-primary)'
                            : 'color-mix(in srgb, var(--theme-primary) 20%, transparent)',
                          // content-visibility:auto — browser skips layout for off-screen cards
                          contentVisibility: 'auto',
                          containIntrinsicSize: 'auto 120px',
                        } as React.CSSProperties}
                        onClick={() => setSelectedFont(isSelected ? null : font)}
                      >
                        {/* Font name header */}
                        <div
                          className="flex items-center justify-between px-3 py-1.5 border-b"
                          style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}
                        >
                          <span
                            className="font-ui text-xs tracking-wider uppercase"
                            style={{ color: isSelected ? 'var(--theme-primary)' : 'var(--theme-dim)' }}
                          >
                            {font}
                          </span>
                          {isSelected && (
                            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                              <CyberButton
                                onClick={() => void handleCopy(font)}
                                variant={copiedFont === font ? 'active' : 'default'}
                              >
                                {copiedFont === font ? '[COPIED]' : '[COPY]'}
                              </CyberButton>
                            </div>
                          )}
                        </div>

                        {/* Rendered output — loading derived from output===null (not yet computed) */}
                        <div className="px-3 py-2 overflow-x-auto">
                          {output === null ? (
                            <span className="font-mono text-xs" style={{ color: 'var(--theme-dim)' }}>
                              loading…
                            </span>
                          ) : result?.error || output === '' ? (
                            <span className="font-mono text-xs" style={{ color: 'var(--theme-dim)' }}>
                              — font unavailable —
                            </span>
                          ) : output ? (
                            <pre
                              className="font-mono text-xs leading-tight"
                              style={{
                                color: isSelected ? 'var(--theme-text)' : 'var(--theme-dim)',
                                whiteSpace: 'pre',
                                // Phosphor glow on selected font
                                ...(isSelected ? { filter: 'drop-shadow(0 0 4px var(--theme-primary))' } : {}),
                              }}
                            >{output}</pre>
                          ) : (
                            <span className="font-mono text-xs" style={{ color: 'var(--theme-dim)' }}>
                              —
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Close */}
                <div className="flex justify-end pt-2 border-t" style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}>
                  <CyberButton onClick={onClose} size="md">
                    [CLOSE]
                  </CyberButton>
                </div>
              </div>
            </TerminalPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
