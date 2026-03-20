/**
 * ApiKeyModal — Gemini API key configuration modal.
 *
 * Saves the key to localStorage and initializes GeminiService. NEVER validates
 * the key against the Google API — it only stores config. Any key format errors
 * surface on the first generation attempt, not here.
 *
 * Road not taken: preflight API call on save. Rejected because (a) CORS blocks
 * it in some environments, (b) burns quota on a key that may never be used again
 * in the session, (c) false negatives on transient rate limits would block valid
 * keys. The error path on first generation is a better signal.
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { TerminalPanel } from '@/components/ui'
import { setApiKey, getApiKey, clearApiKey, getSettings, saveSettings } from '@/lib/services'
import { geminiService } from '@/lib/services'

// Consistent transition timing across the app
const TRANSITION = {
  duration: 0.4,
  ease: [0.25, 0.1, 0.25, 1] as const,
}

interface ApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ApiKeyModal({ isOpen, onClose, onSuccess }: ApiKeyModalProps) {
  const [key, setKey] = useState('')
  const [modelName, setModelName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [hasExistingKey, setHasExistingKey] = useState(false)
  const [helperOpen, setHelperOpen] = useState(false)
  const helperRef = useRef<HTMLDivElement>(null)

  // Check for existing key when modal opens
  useEffect(() => {
    if (isOpen) {
      const existingKey = getApiKey()
      setHasExistingKey(!!existingKey)
      setKey(existingKey || '')
      setModelName(getSettings().modelName || 'gemini-3-flash-preview')
      setError(null)
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!key.trim()) {
      setError('API key is required')
      return
    }

    setError(null)
    setIsValidating(true)

    try {
      const model = modelName.trim() || 'gemini-3-flash-preview'

      // Initialize the service with key + model
      geminiService.initialize({ apiKey: key.trim(), model })

      // Save to localStorage
      setApiKey(key.trim())
      saveSettings({ modelName: model })

      onSuccess()
      onClose()
    } catch {
      setError('Failed to save API key')
    } finally {
      setIsValidating(false)
    }
  }

  const handleClearKey = () => {
    clearApiKey()
    setKey('')
    setHasExistingKey(false)
    setError(null)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={TRANSITION}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-terminal-dark/90 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: -10 }}
            transition={TRANSITION}
            className="w-full max-w-lg"
          >
            <TerminalPanel variant="glow" title="⚙ API SETTINGS">
              <div className="space-y-6">
                {/* Status indicator */}
                <div className="flex items-center gap-3 p-3 bg-terminal-dark/50 rounded-lg border" style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}>
                  <span className={`w-3 h-3 rounded-full ${hasExistingKey ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="font-mono text-sm">
                    {hasExistingKey ? (
                      <span className="text-green-400">API KEY CONFIGURED</span>
                    ) : (
                      <span className="text-red-400">NO API KEY SET</span>
                    )}
                  </span>
                </div>

                {/* Header */}
                <div className="space-y-2">
                  <p className="font-mono text-sm phosphor-glow">
                    {hasExistingKey
                      ? 'Update or clear your Gemini API key below.'
                      : 'Enter your Google Gemini API key to enable AI generation.'}
                  </p>
                  <p className="font-ui text-xs" style={{ color: 'var(--theme-dim)' }}>
                    Get your free API key at{' '}
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-[color:var(--theme-primary)] transition-colors"
                    >
                      aistudio.google.com/apikey
                    </a>
                  </p>
                </div>

                {/* Input */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="block font-ui text-xs tracking-wider uppercase" style={{ color: 'var(--theme-primary)' }}>
                      API Key
                    </label>
                    <button
                      onClick={() => setHelperOpen(o => !o)}
                      type="button"
                      className="font-mono text-xs px-1.5 py-0.5 rounded border transition-all duration-200 hover:bg-[color:var(--theme-primary)]/10"
                      style={{
                        color: 'var(--theme-dim)',
                        borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)',
                      }}
                      aria-expanded={helperOpen}
                    >
                      {helperOpen ? '[−]' : '[?]'}
                    </button>
                  </div>

                  {/* Expandable helper */}
                  <div
                    ref={helperRef}
                    className="overflow-hidden transition-all duration-300"
                    style={{ maxHeight: helperOpen ? `${helperRef.current?.scrollHeight ?? 200}px` : '0px', opacity: helperOpen ? 1 : 0 }}
                  >
                    <div className="p-3 rounded-lg border text-xs font-ui space-y-1.5" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 5%, transparent)', borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)', color: 'var(--theme-dim)' }}>
                      <p><span className="font-bold" style={{ color: 'var(--theme-primary)' }}>What is a Gemini API key?</span></p>
                      <p>It's a password that lets GLYPH talk to Google's AI. Google gives you one for free — no credit card required for the free tier.</p>
                      <p><span className="font-bold">Steps:</span> Go to <span className="font-mono" style={{ color: 'var(--theme-primary)' }}>aistudio.google.com/apikey</span> → click "Create API key" → copy it → paste it here.</p>
                      <p>Your key stays in your browser. GLYPH never sends it anywhere except Google's API.</p>
                    </div>
                  </div>
                  <input
                    type="password"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSubmit()
                    }}
                    placeholder="AIza..."
                    disabled={isValidating}
                    className={`
                      w-full px-4 py-3 font-mono text-base
                      bg-terminal-dark/80 border rounded-lg
                      placeholder:text-[color:var(--theme-dim)]
                      outline-none transition-all duration-200
                      ${error ? 'border-red-500' : 'focus:box-glow'}
                      disabled:opacity-50
                    `}
                    style={{
                      color: 'var(--theme-text)',
                      borderColor: error
                        ? undefined
                        : 'color-mix(in srgb, var(--theme-primary) 40%, transparent)',
                    }}
                  />
                  {error && (
                    <p className="font-mono text-xs text-red-400">{error}</p>
                  )}
                </div>

                {/* Model name input */}
                <div className="space-y-2">
                  <label className="block font-ui text-xs tracking-wider uppercase" style={{ color: 'var(--theme-primary)' }}>
                    Model
                  </label>
                  <input
                    type="text"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                    placeholder="gemini-3-flash-preview"
                    disabled={isValidating}
                    className="w-full px-4 py-3 font-mono text-sm bg-terminal-dark/80 border rounded-lg placeholder:text-[color:var(--theme-dim)] outline-none transition-all duration-200 focus:box-glow disabled:opacity-50"
                    style={{
                      color: 'var(--theme-text)',
                      borderColor: 'color-mix(in srgb, var(--theme-primary) 40%, transparent)',
                    }}
                  />
                  <p className="font-ui text-xs" style={{ color: 'var(--theme-dim)' }}>
                    Any Gemini model ID. Leave blank to use{' '}
                    <span className="font-mono" style={{ color: 'var(--theme-primary)' }}>gemini-3-flash-preview</span>.
                  </p>
                </div>

                {/* Security note */}
                <div className="p-3 rounded-lg border" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)' }}>
                  <p className="font-ui text-xs" style={{ color: 'var(--theme-dim)' }}>
                    <span className="font-bold">SECURITY:</span> Your API key is stored locally
                    in your browser and persists between sessions. It is never sent anywhere
                    except Google's API.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {hasExistingKey && (
                    <button
                      onClick={handleClearKey}
                      disabled={isValidating}
                      className="px-4 py-3 font-ui text-sm tracking-wider border border-red-500/40 rounded-lg text-red-400 hover:bg-red-500/10 transition-all duration-200 disabled:opacity-50"
                    >
                      [CLEAR]
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    disabled={isValidating}
                    className="flex-1 px-4 py-3 font-ui text-sm tracking-wider border rounded-lg hover:bg-[color:var(--theme-primary)]/10 transition-all duration-200 disabled:opacity-50"
                    style={{
                      borderColor: 'color-mix(in srgb, var(--theme-primary) 40%, transparent)',
                      color: 'var(--theme-primary)',
                    }}
                  >
                    [CANCEL]
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isValidating || !key.trim()}
                    className="flex-1 px-4 py-3 font-ui text-sm tracking-wider border rounded-lg hover:bg-[color:var(--theme-primary)]/30 hover:text-[color:var(--theme-primary)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed box-glow"
                    style={{
                      borderColor: 'var(--theme-primary)',
                      backgroundColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)',
                      color: 'var(--theme-text)',
                    }}
                  >
                    {isValidating ? '[SAVING...]' : hasExistingKey ? '[UPDATE]' : '[ACTIVATE]'}
                  </button>
                </div>
              </div>
            </TerminalPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
