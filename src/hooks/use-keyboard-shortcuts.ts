// Keyboard Shortcuts Hook for GLYPH

import { useEffect } from 'react'

interface ShortcutConfig {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  callback: () => void
  description?: string
}

export function useKeyboardShortcut(config: ShortcutConfig) {
  const { key, ctrl = false, shift = false, alt = false, callback } = config

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Check modifiers
      if (ctrl !== e.ctrlKey) return
      if (shift !== e.shiftKey) return
      if (alt !== e.altKey) return

      // Check key
      if (e.key.toLowerCase() !== key.toLowerCase()) return

      // Don't trigger when typing in inputs
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape to work even in inputs
        if (key.toLowerCase() !== 'escape') return
      }

      e.preventDefault()
      callback()
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [key, ctrl, shift, alt, callback])
}

// Hook for registering multiple shortcuts
export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const { key, ctrl = false, shift = false, alt = false, callback } = shortcut

        // Check modifiers
        if (ctrl !== e.ctrlKey) continue
        if (shift !== e.shiftKey) continue
        if (alt !== e.altKey) continue

        // Check key
        if (e.key.toLowerCase() !== key.toLowerCase()) continue

        // Don't trigger when typing in inputs
        const target = e.target as HTMLElement
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          if (key.toLowerCase() !== 'escape') continue
        }

        e.preventDefault()
        callback()
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [shortcuts])
}

// Utility to format shortcut for display
export function formatShortcut(config: Pick<ShortcutConfig, 'key' | 'ctrl' | 'shift' | 'alt'>): string {
  const parts: string[] = []
  if (config.ctrl) parts.push('Ctrl')
  if (config.shift) parts.push('Shift')
  if (config.alt) parts.push('Alt')
  parts.push(config.key.toUpperCase())
  return parts.join('+')
}
