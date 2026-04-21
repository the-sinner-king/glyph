/**
 * Generator Component — GLYPH V2
 *
 * Single output per generation. Two modes:
 *   SLOP  — Fast Flash stream, arrives in ~5–8s
 *   CRAFT — Pro architect (buffered, "THINKING...") → Flash refine (streamed), ~15–20s
 *
 * Streaming display uses direct DOM mutation (bypasses React reconciler).
 * One setState at stream end to lock final content.
 *
 * Skill pills augment the system prompt with composable injections.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  CommandInput,
  TerminalPanel,
  AsciiHeader,
  CyberButton,
} from '@/components/ui'
import { TemplateDisplay } from './template-display'
import { createEmptyActiveSkills, getActiveSkillIds, type ActiveSkillsMap } from '@/lib/skills'
import { ApiKeyModal } from './api-key-modal'
import { HistoryPanel } from './history-panel'
import { FavoritesPanel } from './favorites-panel'
import { TitleForge } from './title-forge'
import { TitleForgeBanner } from './title-forge-banner'
import { ShortcutsModal } from './shortcuts-modal'
import { GeneratorOptions } from './generator-options'
import { useKeyboardShortcuts } from '@/hooks'
import {
  geminiService,
  getApiKey,
  saveToHistory,
  getSettings,
  saveSettings,
  applyFigletTitles,
} from '@/lib/services'
import type {
  GeneratedTemplate,
  GenerationResult,
  AppStatus,
  GeneratorOptions as GeneratorOptionsType,
  GenerationMode,
} from '@/types'
import { CONFIG, COLOR_THEMES, FIGLET_FONTS, type ColorThemeId } from '@/lib/constants'

// ============================================================================
// CRAFT PHASE — internal state for CRAFT mode UI feedback
// ============================================================================

type CraftPhase = 'architect' | 'refining' | 'expanding' | null

// ============================================================================
// HISTORY MIGRATION — v1 had templates: [...], v2 has template: {...}
//
// V1 generated two simultaneous templates (A/B comparison). V2 generates one.
// Migration picks the first V1 template and discards the second. This runs
// once on mount — if migration fails it is silently swallowed; malformed
// history is not worth crashing the app over.
// ============================================================================

interface LegacyGenerationResult {
  templates?: GeneratedTemplate[]
  template?: GeneratedTemplate
  prompt: string
  processingTime: number
  mode?: GenerationMode
  activeSkills?: string[]
}

function migrateHistoryItem(item: LegacyGenerationResult): GenerationResult {
  if (item.template) {
    // Already V2 — fill optional fields with defaults if missing
    return {
      id: (item as GenerationResult).id ?? crypto.randomUUID(),
      template: item.template,
      prompt: item.prompt,
      processingTime: item.processingTime,
      mode: item.mode ?? 'slop',
      activeSkills: item.activeSkills ?? [],
    }
  }
  // V1 format: use first template from the pair
  const firstTemplate = item.templates?.[0]
  if (!firstTemplate) {
    // Degenerate — return a placeholder
    return {
      id: crypto.randomUUID(),
      template: { id: `migrated-${Date.now()}`, content: '', style: 'sovereign', font: FIGLET_FONTS[0], width: 0, height: 0, createdAt: Date.now() },
      prompt: item.prompt,
      processingTime: item.processingTime,
      mode: 'slop',
      activeSkills: [],
    }
  }
  return {
    id: crypto.randomUUID(),
    template: firstTemplate,
    prompt: item.prompt,
    processingTime: item.processingTime,
    mode: 'slop',
    activeSkills: [],
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function computeDimensions(content: string): { width: number; height: number } {
  const lines = content.split('\n')
  return { width: lines.reduce((max, l) => Math.max(max, l.length), 0), height: lines.length }
}

// ============================================================================
// MOCK DATA FOR DEMO MODE
// ============================================================================

const MOCK_TEMPLATE: GeneratedTemplate = {
  id: 'mock-1',
  content: `╔══════════════════════════════════════════╗
║ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ║
║ ▓  ★ ═══════════════════════════════ ★  ▓ ║
║ ▓  ║      ⚡ ALERT PROTOCOL ⚡      ║  ▓ ║
║ ▓  ★ ═══════════════════════════════ ★  ▓ ║
╠══════════════════════════════════════════╣
║                                          ║
║  >> THREAT LEVEL: ████████░░ 80%         ║
║  >> STATUS: ACTIVE MONITORING            ║
║  >> SOURCE: UNKNOWN                      ║
║                                          ║
╠══════════════════════════════════════════╣
║  ◆ [ACKNOWLEDGE]     ◆ [DISMISS]         ║
╚══════════════════════════════════════════╝`,
  style: 'sovereign',
  font: FIGLET_FONTS[0],
  width: 44,
  height: 14,
  createdAt: Date.now(),
}

// ============================================================================
// ANIMATION CONFIGURATION
// ============================================================================

const ANIMATION = {
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  fadeUp:     { initial: { opacity: 0, y: 30  }, animate: { opacity: 1, y: 0  }, exit: { opacity: 0, y: -20 } },
  fade:       { initial: { opacity: 0         }, animate: { opacity: 1        }, exit: { opacity: 0         } },
  scaleFade:  { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.96 } },
} as const

// ============================================================================
// GENERATOR COMPONENT
// ============================================================================

export function Generator() {
  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------
  const [status, setStatus]           = useState<AppStatus>('idle')
  const [result, setResult]           = useState<GenerationResult | null>(null)
  const [streamingContent, setStreamingContent] = useState('')
  const [craftPhase, setCraftPhase]   = useState<CraftPhase>(null)
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [error, setError]             = useState<string | null>(null)
  const mode: GenerationMode          = 'slop'
  const [enhanceMode, setEnhanceMode] = useState(() => getSettings().enhanceMode ?? true)
  const [activeSkills, setActiveSkills] = useState<ActiveSkillsMap>(createEmptyActiveSkills)
  const [isStalled, setIsStalled]     = useState(false)
  const [retryMessage, setRetryMessage] = useState<string | null>(null)

  // AC-6v: favoritesVersion counter — lifted state for cross-component sync
  const [favoritesVersion, setFavoritesVersion] = useState(0)

  const [showApiKeyModal, setShowApiKeyModal]       = useState(false)
  const [showHistoryPanel, setShowHistoryPanel]     = useState(false)
  const [showFavoritesPanel, setShowFavoritesPanel] = useState(false)
  const [showTitleForge, setShowTitleForge]         = useState(false)
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)
  const [isInitialized, setIsInitialized]           = useState(false)
  const [showOptions, setShowOptions]               = useState(false)

  const [generatorOptions, setGeneratorOptions] = useState<GeneratorOptionsType>(() => {
    const settings = getSettings()
    return {
      size:   (settings.defaultSize   || 'standard') as GeneratorOptionsType['size'],
      style:  (settings.defaultStyle  || 'minimal')  as GeneratorOptionsType['style'],
      border: (settings.defaultBorder || 'single')   as GeneratorOptionsType['border'],
      theme:  (settings.colorTheme    || 'amber')    as GeneratorOptionsType['theme'],
    }
  })

  // --------------------------------------------------------------------------
  // Refs
  // --------------------------------------------------------------------------
  const abortRef         = useRef<AbortController | null>(null)
  const streamBufferRef  = useRef('')                           // raw buffer — accumulated chunks
  const streamRafRef     = useRef<number | null>(null)          // rAF handle for batched state flush
  const startTimeRef     = useRef(0)
  const lastChunkTimeRef = useRef(0)
  const stallTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isDemoMode = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('demo')

  // --------------------------------------------------------------------------
  // History migration — run once on mount
  // --------------------------------------------------------------------------
  useEffect(() => {
    try {
      const raw = localStorage.getItem('glyph-history')
      if (!raw) return
      const items = JSON.parse(raw) as LegacyGenerationResult[]
      if (!Array.isArray(items) || items.length === 0) return
      // Check if any item is V1 format
      if (items.some(item => 'templates' in item && !('template' in item))) {
        const migrated = items.map(migrateHistoryItem)
        localStorage.setItem('glyph-history', JSON.stringify(migrated))
      }
    } catch {
      // Migration failure is non-fatal
    }
  }, [])

  // --------------------------------------------------------------------------
  // Theme application
  // --------------------------------------------------------------------------
  const applyTheme = useCallback((themeId: ColorThemeId) => {
    const theme = COLOR_THEMES[themeId]
    if (!theme) return
    document.documentElement.style.setProperty('--theme-primary', theme.primary)
    document.documentElement.style.setProperty('--theme-text', theme.text)
    document.documentElement.style.setProperty('--theme-dim', theme.dim)
    document.body.style.background = theme.bg
    saveSettings({ colorTheme: themeId })
  }, [])

  useEffect(() => { applyTheme(generatorOptions.theme) }, [generatorOptions.theme, applyTheme])

  const handleOptionsChange = useCallback((newOptions: GeneratorOptionsType) => {
    setGeneratorOptions(newOptions)
    saveSettings({
      defaultSize: newOptions.size, defaultStyle: newOptions.style,
      defaultBorder: newOptions.border, colorTheme: newOptions.theme,
    })
  }, [])

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (isDemoMode) {
      setIsInitialized(true)
      const timer = setTimeout(() => { handleGenerate('warning box for system alerts') }, 800)
      return () => clearTimeout(timer)
    }
    const storedKey = getApiKey()
    if (storedKey) {
      geminiService.initialize({ apiKey: storedKey, model: getSettings().modelName })
      setIsInitialized(true)
    } else {
      setShowApiKeyModal(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemoMode])

  // --------------------------------------------------------------------------
  // Streaming flush — rAF-batched setState
  //
  // Chunks arrive every ~50-150ms from the Gemini SDK. Calling setState on
  // every chunk triggers React reconciliation at chunk frequency (~10-20/s),
  // which is wasteful and causes visible jank at high token rates.
  //
  // Instead: accumulate chunks into streamBufferRef (a plain mutable ref — no
  // React involvement) and schedule a single rAF-batched setState. At 60fps
  // this caps React renders to 60/s regardless of chunk rate, and cancelAnimationFrame
  // on the previous rAF handle ensures only one flush is ever pending at once.
  // --------------------------------------------------------------------------

  const flushStreamToState = useCallback(() => {
    setStreamingContent(streamBufferRef.current)
  }, [])

  const scheduleFlush = useCallback(() => {
    if (streamRafRef.current) cancelAnimationFrame(streamRafRef.current)
    streamRafRef.current = requestAnimationFrame(flushStreamToState)
  }, [flushStreamToState])

  const clearStream = useCallback(() => {
    streamBufferRef.current = ''
    if (streamRafRef.current) cancelAnimationFrame(streamRafRef.current)
    setStreamingContent('')
  }, [])

  // --------------------------------------------------------------------------
  // Stall detection
  // --------------------------------------------------------------------------
  const scheduleStallCheck = useCallback((signal: AbortSignal) => {
    if (stallTimerRef.current) clearTimeout(stallTimerRef.current)
    const check = () => {
      if (signal.aborted) return
      const elapsed = Date.now() - startTimeRef.current
      const noChunkFor = Date.now() - lastChunkTimeRef.current
      if (elapsed > 30000 && noChunkFor > 20000) {
        setIsStalled(true)
      } else {
        stallTimerRef.current = setTimeout(check, 5000)
      }
    }
    stallTimerRef.current = setTimeout(check, 5000)
    signal.addEventListener('abort', () => {
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current)
      setIsStalled(false)
    })
  }, [])

  // --------------------------------------------------------------------------
  // AC-6v: favoritesChanged handler — increments favoritesVersion counter
  // --------------------------------------------------------------------------
  const handleFavoritesChanged = useCallback(() => {
    setFavoritesVersion(v => v + 1)
  }, [])

  // --------------------------------------------------------------------------
  // Generate
  // --------------------------------------------------------------------------
  const handleEnhanceModeToggle = useCallback(() => {
    setEnhanceMode(prev => {
      const next = !prev
      saveSettings({ enhanceMode: next })
      return next
    })
  }, [])

  const handleAbortGeneration = useCallback(() => {
    abortRef.current?.abort()
    if (stallTimerRef.current) clearTimeout(stallTimerRef.current)
    setIsStalled(false)
    setStatus('idle')
    setCurrentPrompt('')
    setCraftPhase(null)
  }, [])

  const handleGenerate = useCallback(async (prompt: string) => {
    // Demo mode
    if (isDemoMode) {
      abortRef.current?.abort()
      setStatus('generating')
      setCurrentPrompt(prompt)
      setCraftPhase(null)
      await new Promise(resolve => setTimeout(resolve, 2500))
      const timestamp = Date.now()
      const demoResult: GenerationResult = {
        id: crypto.randomUUID(),
        template: { ...MOCK_TEMPLATE, id: `mock-${timestamp}`, createdAt: timestamp },
        prompt,
        processingTime: 2500,
        mode: 'slop',
        activeSkills: [],
      }
      setResult(demoResult)
      setStreamingContent(demoResult.template.content)
      setStatus('success')
      return
    }

    if (!geminiService.isInitialized()) {
      setShowApiKeyModal(true)
      return
    }

    // Cancel any in-flight stream
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal

    // Reset state
    startTimeRef.current = Date.now()
    lastChunkTimeRef.current = Date.now()
    clearStream()
    setResult(null)
    setStatus('generating')
    setError(null)
    setCurrentPrompt(prompt)
    setIsStalled(false)
    setCraftPhase(null)

    scheduleStallCheck(signal)

    // Prompt enhancement — call Flash pre-pass to expand short prompts into
    // visually rich descriptions before sending to the main generation model.
    let effectivePrompt = prompt
    if (enhanceMode && prompt.trim().length < 120) {
      setCraftPhase('expanding')
      effectivePrompt = await geminiService.enhancePrompt(prompt)
      if (signal.aborted) return
      setCraftPhase(null)
      setCurrentPrompt(effectivePrompt)
    }

    try {
      await geminiService.generateTemplate(
        effectivePrompt,
        generatorOptions,
        mode,
        activeSkills,
        {
          onChunk: (chunk) => {
            if (signal.aborted) return
            lastChunkTimeRef.current = Date.now()
            streamBufferRef.current += chunk

            // Clear any retry message when new content starts arriving
            setRetryMessage(null)

            // First chunk: transition to streaming display
            setStatus('success')

            // Batch DOM updates via rAF — no setState on every chunk
            scheduleFlush()
          },

          onCraftPhase: (phase) => {
            if (signal.aborted) return
            // AC-10u: In CRAFT mode, we only track the craftPhase for UI label updates.
            // We do NOT call setStatus('success') here — CRAFT mode stays in 'generating'
            // until onComplete fires. The 'refining' phase no longer triggers a streaming
            // skeleton display since onChunk is suppressed in CRAFT mode (P3 contract).
            setCraftPhase(phase)
          },

          onRetry: (_attempt) => {
            if (signal.aborted) return
            // Quality gate retry — show message for 500ms, then clear buffer
            setRetryMessage('[QUALITY CHECK FAILED — RETRYING...]')
            setTimeout(() => {
              if (signal.aborted) return
              clearStream()
              setRetryMessage(null)
              lastChunkTimeRef.current = Date.now()
            }, 500)
          },

          onComplete: async (content, quality) => {
            if (signal.aborted) return
            if (stallTimerRef.current) clearTimeout(stallTimerRef.current)
            if (streamRafRef.current) cancelAnimationFrame(streamRafRef.current)
            setCraftPhase(null)

            // Post-process: replace [FIGLET: TEXT] markers with rendered ASCII art.
            // applyFigletTitles is near-instant for Standard; ANSI Shadow fetches once
            // then is cached by figlet for the session. Falls back to plain text on error.
            const processedContent = await applyFigletTitles(content)
            if (signal.aborted) return

            const dims = computeDimensions(processedContent)
            const now = Date.now()

            // AC-12p: Capture qualityScore from quality parameter
            // quality may be an object with .score, a number directly, or undefined
            const qualityScore: number | undefined =
              quality != null
                ? typeof quality === 'number'
                  ? quality
                  : typeof (quality as { score?: unknown }).score === 'number'
                    ? (quality as { score: number }).score
                    : undefined
                : undefined

            // AC-5 (P3 contract): id: string required on GenerationResult
            const generationResult: GenerationResult = {
              id: crypto.randomUUID(),
              template: {
                id: `template-${now}`,
                content: processedContent,
                style: generatorOptions.style,
                font: FIGLET_FONTS[0],
                ...dims,
                createdAt: now,
              },
              prompt: effectivePrompt,
              processingTime: now - startTimeRef.current,
              mode,
              activeSkills: getActiveSkillIds(activeSkills),
              qualityScore,
            }

            setResult(generationResult)
            setStreamingContent(processedContent)
            // AC-10u: onComplete fires for both modes — this is the single transition
            // to 'success' for CRAFT mode (first time it leaves 'generating').
            setStatus('success')

            // Save to history (non-blocking)
            try {
              saveToHistory(generationResult)
            } catch {
              // History save failure is non-fatal
            }
          },

          onError: (err) => {
            if (signal.aborted) return
            if (stallTimerRef.current) clearTimeout(stallTimerRef.current)
            setCraftPhase(null)
            setError(err.message)
            setStatus('error')
          },
        },
        signal
      )
    } catch (err) {
      if (signal.aborted) return
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current)
      setCraftPhase(null)
      setError(err instanceof Error ? err.message : 'Generation failed')
      setStatus('error')
    }
  }, [isDemoMode, generatorOptions, mode, enhanceMode, activeSkills, scheduleFlush, clearStream, scheduleStallCheck])

  const handleHistoryLoad = useCallback((histResult: GenerationResult) => {
    setResult(histResult)
    setStreamingContent(histResult.template.content)
    setCurrentPrompt(histResult.prompt)
    setStatus('success')
    setError(null)
  }, [])

  const handleReset = useCallback(() => {
    setStatus('idle')
    setResult(null)
    setCurrentPrompt('')
    setError(null)
    setCraftPhase(null)
    clearStream()
  }, [clearStream])

  // --------------------------------------------------------------------------
  // Keyboard shortcuts
  // --------------------------------------------------------------------------
  const shortcuts = useMemo(() => [
    {
      key: '?', shift: true,
      callback: () => { if (!showApiKeyModal && !showHistoryPanel) setShowShortcutsModal(p => !p) },
      description: 'Toggle keyboard shortcuts help',
    },
    {
      key: 'Escape',
      callback: () => {
        // AC-4: TitleForge and FavoritesPanel escape at TOP of chain (before other modals)
        if (showTitleForge)                  { setShowTitleForge(false); return }
        if (showFavoritesPanel)              { setShowFavoritesPanel(false); return }
        if (showShortcutsModal)              setShowShortcutsModal(false)
        else if (showHistoryPanel)           setShowHistoryPanel(false)
        else if (showApiKeyModal && isInitialized) setShowApiKeyModal(false)
        else if (status === 'success' || status === 'error') handleReset()
      },
      description: 'Close modal or reset to idle',
    },
  ], [showApiKeyModal, showHistoryPanel, showShortcutsModal, showTitleForge, showFavoritesPanel, status, isInitialized, handleReset])

  useKeyboardShortcuts(shortcuts)

  // --------------------------------------------------------------------------
  // Render helpers
  // --------------------------------------------------------------------------

  const renderIdleState = () => (
    <motion.div key="idle" {...ANIMATION.fadeUp} transition={ANIMATION.transition} className="w-full space-y-4">
      <CommandInput onSubmit={handleGenerate} placeholder="DESCRIBE YOUR TEXT-UI TEMPLATE..." autoFocus showExamples enhanceMode={enhanceMode} onEnhanceToggle={handleEnhanceModeToggle} />
      <TitleForgeBanner onOpen={() => setShowTitleForge(true)} />
    </motion.div>
  )

  const renderGeneratingState = () => {
    const isCraftArchitect = craftPhase === 'architect'
    return (
      <motion.div key="generating" {...ANIMATION.scaleFade} transition={ANIMATION.transition} className="w-full py-4">
        <TerminalPanel variant="pulse">
          <div className="py-6 px-4 space-y-4">
            {/* Mode badge */}
            <div className="flex items-center gap-3">
              <span
                className="font-mono text-xs tracking-widest px-2 py-0.5 rounded"
                style={{
                  border: '1px solid color-mix(in srgb, var(--theme-primary) 40%, transparent)',
                  color: 'var(--theme-primary)',
                  background: 'color-mix(in srgb, var(--theme-primary) 8%, transparent)',
                }}
              >
                {mode.toUpperCase()} MODE
              </span>
              {isCraftArchitect && (
                <span className="font-mono text-xs" style={{ color: 'var(--theme-dim)' }}>
                  ARCHITECT PASS — thinking...
                </span>
              )}
            </div>

            {/* ASCII bounce gauge */}
            <BouncingGauge prompt={currentPrompt} phase={craftPhase} />

            {isStalled && (
              <div className="flex justify-center">
                <CyberButton onClick={handleAbortGeneration} className="border-red-500/40 text-red-400">
                  [ABORT]
                </CyberButton>
              </div>
            )}
          </div>
        </TerminalPanel>
      </motion.div>
    )
  }

  const renderSuccessState = () => (
    <motion.div key="success" {...ANIMATION.fadeUp} transition={ANIMATION.transition} className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CommandInput onSubmit={handleGenerate} placeholder="GENERATE ANOTHER..." autoFocus={false} showExamples={false} enhanceMode={enhanceMode} onEnhanceToggle={handleEnhanceModeToggle} />
      </div>

      {/* Prompt reminder */}
      <div className="text-center">
        <span className="font-ui text-xs tracking-wider" style={{ color: 'var(--theme-dim)' }}>
          PROMPT: "{currentPrompt}"
        </span>
        {result && (
          <span className="font-ui text-xs ml-3" style={{ color: 'color-mix(in srgb, var(--theme-dim) 50%, transparent)' }}>
            [{result.mode.toUpperCase()}
            {result.activeSkills.length > 0 ? ` · ${result.activeSkills.join('+').toUpperCase()}` : ''}
            · {result.processingTime}ms]
          </span>
        )}
      </div>

      {/* Main result — full width */}
      {result ? (
        // AC-6v: pass favoritesVersion for cross-component sync
        // AC-12p: pass generationMode and qualityScore for V2 metadata display
        <TemplateDisplay
          template={result.template}
          index={0}
          isSelected={true}
          onSelect={() => {}}
          onRefine={() => {}}
          favoritesVersion={favoritesVersion}
          generationMode={result.mode}
          qualityScore={result.qualityScore}
        />
      ) : (
        /* Streaming display before result is locked */
        <div className="relative">
          <StreamingSkeleton streamingContent={streamingContent} craftPhase={craftPhase} />
          {retryMessage && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, #0a0a0f 85%, transparent)', zIndex: 10 }}
            >
              <span
                className="font-mono text-sm tracking-widest px-4 py-2 rounded"
                style={{
                  color: 'var(--theme-primary)',
                  border: '1px solid color-mix(in srgb, var(--theme-primary) 50%, transparent)',
                  background: 'color-mix(in srgb, var(--theme-primary) 8%, transparent)',
                }}
              >
                {retryMessage}
              </span>
            </div>
          )}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ ...ANIMATION.transition, delay: 0.3 }}
        className="flex justify-center gap-4 pt-2"
      >
        <CyberButton size="md" onClick={() => handleGenerate(currentPrompt)}>[REGENERATE]</CyberButton>
        <CyberButton size="md" onClick={handleReset}>[NEW PROMPT]</CyberButton>
      </motion.div>
    </motion.div>
  )

  const renderErrorState = () => (
    <motion.div key="error" {...ANIMATION.scaleFade} transition={ANIMATION.transition} className="w-full">
      <TerminalPanel variant="default" title="ERROR">
        <div className="space-y-4">
          <p className="font-mono text-red-400">{error}</p>
          <div className="flex gap-3">
            <CyberButton onClick={() => handleGenerate(currentPrompt)}>[RETRY]</CyberButton>
            <CyberButton onClick={handleReset}>[START OVER]</CyberButton>
          </div>
        </div>
      </TerminalPanel>
    </motion.div>
  )

  const renderContent = () => {
    switch (status) {
      case 'idle':       return renderIdleState()
      case 'generating': return renderGeneratingState()
      case 'success':    return renderSuccessState()
      case 'error':      return renderErrorState()
      default:           return renderIdleState()
    }
  }

  // --------------------------------------------------------------------------
  // Main render
  // --------------------------------------------------------------------------
  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto px-4 py-8 relative">
      {isDemoMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-50 text-terminal-dark py-1.5 text-center"
          style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 90%, transparent)' }}
        >
          <span className="font-ui text-xs font-bold tracking-wider">
            DEMO MODE — Using mock templates. Remove ?demo from URL for real AI generation.
          </span>
        </motion.div>
      )}

      {/* Top bar */}
      <div className="fixed right-4 z-40 flex gap-2" style={{ top: isDemoMode ? '2.5rem' : '1rem' }}>
        <CyberButton variant="ghost" onClick={() => setShowShortcutsModal(true)} className="p-2 font-mono" aria-label="Keyboard shortcuts" title="Keyboard Shortcuts (?)">?</CyberButton>
        {status !== 'idle' && (
          <CyberButton variant="ghost" onClick={() => setShowTitleForge(true)} className="p-2 font-mono" aria-label="Title Forge big text mode" title="Title Forge — Big Text (figlet fonts)">⬡</CyberButton>
        )}
        <CyberButton variant="ghost" onClick={() => setShowFavoritesPanel(true)} className="p-2 font-mono" aria-label="Saved templates" title="Saved Templates (★)">★</CyberButton>
        <CyberButton variant="ghost" onClick={() => setShowHistoryPanel(true)} className="p-2 font-mono" aria-label="Generation history" title="Generation History">☰</CyberButton>
        <CyberButton variant="ghost" onClick={() => setShowApiKeyModal(true)} className="p-2 font-mono" aria-label="API key settings" title="API Key Settings">⚙</CyberButton>
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mb-8 text-center"
        style={{ marginTop: isDemoMode ? '1.5rem' : 0 }}
      >
        <AsciiHeader text={CONFIG.appName} animate={false} />
        <p className="font-ui text-sm phosphor-glow-dim tracking-widest uppercase mt-2">{CONFIG.appTagline}</p>
      </motion.header>

      {/* Generator Options */}
      <div className="w-full mb-2">
        <GeneratorOptions
          options={generatorOptions}
          onChange={handleOptionsChange}
          onThemeChange={applyTheme}
          isExpanded={showOptions}
          onToggleExpand={() => setShowOptions(!showOptions)}
          activeSkills={activeSkills}
          onSkillsChange={setActiveSkills}
        />
      </div>

      {/* Main Content */}
      <div className="w-full min-h-[400px]">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>

      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => { if (isInitialized) setShowApiKeyModal(false) }}
        onSuccess={() => setIsInitialized(true)}
      />
      <HistoryPanel
        isOpen={showHistoryPanel}
        onClose={() => setShowHistoryPanel(false)}
        onSelectPrompt={(p) => handleGenerate(p)}
        onLoadResult={handleHistoryLoad}
      />
      {/* AC-6v: pass onFavoritesChanged so FavoritesPanel can notify generator on delete */}
      <FavoritesPanel
        isOpen={showFavoritesPanel}
        onClose={() => setShowFavoritesPanel(false)}
        onFavoritesChanged={handleFavoritesChanged}
      />
      <TitleForge isOpen={showTitleForge} onClose={() => setShowTitleForge(false)} />
      <ShortcutsModal isOpen={showShortcutsModal} onClose={() => setShowShortcutsModal(false)} />
    </div>
  )
}

// ============================================================================
// BOUNCING GAUGE — CRAFT mode waiting indicator
// ============================================================================

function BouncingGauge({ prompt, phase }: { prompt: string; phase: CraftPhase }) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => (t + 1) % 20), 120)
    return () => clearInterval(id)
  }, [])

  const BAR_WIDTH = 20
  const pos = tick < 10 ? tick : 20 - tick
  const bar = Array.from({ length: BAR_WIDTH }, (_, i) => {
    const dist = Math.abs(i - pos)
    if (dist === 0) return '█'
    if (dist === 1) return '▓'
    if (dist === 2) return '▒'
    if (dist === 3) return '░'
    return '·'
  }).join('')

  const label = phase === 'expanding' ? 'EXPANDING PROMPT' : phase === 'architect' ? 'ARCHITECTING' : phase === 'refining' ? 'REFINING' : 'GENERATING'

  return (
    <div className="space-y-2">
      <p className="font-mono text-xs tracking-widest" style={{ color: 'color-mix(in srgb, var(--theme-dim) 70%, transparent)' }}>
        &gt; {prompt.slice(0, 60)}{prompt.length > 60 ? '…' : ''}
      </p>
      <div className="flex items-center gap-3 font-mono text-sm" style={{ color: 'var(--theme-primary)' }}>
        <span style={{ color: 'color-mix(in srgb, var(--theme-primary) 80%, transparent)', letterSpacing: '0.05em' }}>
          [{bar}]
        </span>
        <span className="text-xs tracking-widest" style={{ color: 'color-mix(in srgb, var(--theme-primary) 60%, transparent)' }}>
          ☾ {label}
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// STREAMING SKELETON — shown while stream is in-flight but result not locked
// ============================================================================

function StreamingSkeleton({ streamingContent, craftPhase }: { streamingContent: string; craftPhase: CraftPhase }) {
  const isCraftArchitect = craftPhase === 'architect'

  return (
    <div
      className="w-full rounded-lg overflow-hidden relative"
      style={{
        minHeight: '300px',
        border: '1px solid color-mix(in srgb, var(--theme-primary) 25%, transparent)',
        background: 'color-mix(in srgb, var(--theme-primary) 3%, #0a0a0f)',
      }}
    >
      {isCraftArchitect ? (
        /* CRAFT architect phase — shimmer placeholder while Pro thinks */
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
          <div
            className="w-3/4 h-2 rounded"
            style={{
              background: 'linear-gradient(90deg, color-mix(in srgb, var(--theme-primary) 5%, transparent) 25%, color-mix(in srgb, var(--theme-primary) 15%, transparent) 50%, color-mix(in srgb, var(--theme-primary) 5%, transparent) 75%)',
              backgroundSize: '200% 100%',
              animation: 'skeleton-shimmer 1.5s infinite ease-in-out',
            }}
          />
          {[0.7, 0.9, 0.6, 0.8, 0.75].map((w, i) => (
            <div
              key={i}
              className="h-1.5 rounded"
              style={{
                width: `${w * 75}%`,
                background: 'linear-gradient(90deg, color-mix(in srgb, var(--theme-primary) 4%, transparent) 25%, color-mix(in srgb, var(--theme-primary) 10%, transparent) 50%, color-mix(in srgb, var(--theme-primary) 4%, transparent) 75%)',
                backgroundSize: '200% 100%',
                animation: `skeleton-shimmer 1.5s ${i * 0.1}s infinite ease-in-out`,
              }}
            />
          ))}
        </div>
      ) : (
        /* Flash stream — rAF-batched content */
        <pre
          className="font-mono p-4 leading-tight"
          style={{
            fontSize: '13px',
            color: 'var(--theme-text)',
            whiteSpace: 'pre',
            overflowX: 'auto',
            minHeight: '300px',
          }}
        >{streamingContent}</pre>
      )}
    </div>
  )
}
