/**
 * ShortcutsModal - Keyboard shortcuts help panel
 *
 * Shows available keyboard shortcuts in a cyberpunk-themed modal.
 * Triggered by pressing '?' or clicking the help button.
 */

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { TerminalPanel } from '@/components/ui'
import { SHORTCUTS } from '@/lib/constants'

const TRANSITION = {
  duration: 0.4,
  ease: [0.25, 0.1, 0.25, 1] as const,
}

// Readable descriptions for shortcuts
const SHORTCUT_DESCRIPTIONS: Record<keyof typeof SHORTCUTS, string> = {
  generate: 'Generate templates from prompt',
  regenerate: 'Regenerate with same prompt',
  copy: 'Copy selected template',
  toggleTemplate: 'Switch between templates',
  clear: 'Clear and start over',
}

// Format key for display
const formatKey = (key: string): string => {
  return key
    .replace('ctrl+', 'Ctrl + ')
    .replace('shift+', 'Shift + ')
    .replace('alt+', 'Alt + ')
}

interface ShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

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
            className="w-full max-w-md"
          >
            <TerminalPanel variant="glow" title="⌨ KEYBOARD SHORTCUTS">
              <div className="space-y-4">
                {/* Shortcuts list */}
                <div className="space-y-2">
                  {(Object.entries(SHORTCUTS) as [keyof typeof SHORTCUTS, string][]).map(
                    ([action, key]) => (
                      <div
                        key={action}
                        className="flex items-center justify-between p-2 bg-terminal-dark/50 rounded border"
                        style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)' }}
                      >
                        <span className="font-mono text-sm" style={{ color: 'var(--theme-text)' }}>
                          {SHORTCUT_DESCRIPTIONS[action]}
                        </span>
                        <kbd
                          className="px-2 py-1 font-mono text-xs rounded border"
                          style={{
                            backgroundColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)',
                            color: 'var(--theme-primary)',
                            borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)',
                          }}
                        >
                          {formatKey(key)}
                        </kbd>
                      </div>
                    )
                  )}
                </div>

                {/* Additional help */}
                <div className="pt-3 border-t" style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}>
                  <p className="font-ui text-xs text-center" style={{ color: 'var(--theme-dim)' }}>
                    Press <kbd className="px-1 rounded" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}>?</kbd> anytime to show this help
                  </p>
                </div>

                {/* Close button */}
                <div className="flex justify-center pt-2">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 font-ui text-sm tracking-wider border rounded-lg hover:bg-[color:var(--theme-primary)]/10 transition-all"
                    style={{
                      borderColor: 'color-mix(in srgb, var(--theme-primary) 40%, transparent)',
                      color: 'var(--theme-primary)',
                    }}
                  >
                    [CLOSE]
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
