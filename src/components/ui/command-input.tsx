/**
 * CommandInput - Terminal-style text input
 *
 * Features:
 * - Blinking cursor when empty and focused
 * - Character count with limit warning
 * - Optional example prompt suggestions
 * - Clear button
 * - Arrow prompt indicator
 */

import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react'
import { CONFIG, DECORATIVE } from '@/lib/constants'

// Example prompts for user inspiration
const EXAMPLE_PROMPTS = [
  'warning box for system alerts',
  'retro game high score display',
  'hacker terminal login screen',
  'cyberpunk loading bar',
  'ASCII art banner for README',
]

interface CommandInputProps {
  onSubmit: (prompt: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  autoFocus?: boolean
  showExamples?: boolean
}

export function CommandInput({
  onSubmit,
  placeholder = 'ENTER COMMAND...',
  disabled = false,
  className = '',
  autoFocus = true,
  showExamples = true,
}: CommandInputProps) {
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Global Enter key listener - submit if there's text, regardless of focus
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      // Only trigger on Enter, not when modifier keys are held
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const trimmed = value.trim()
        if (trimmed && !disabled) {
          e.preventDefault()
          onSubmit(trimmed)
          setValue('')
        }
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [value, disabled, onSubmit])

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (trimmed && !disabled) {
      onSubmit(trimmed)
      setValue('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    if (newValue.length <= CONFIG.maxPromptLength) {
      setValue(newValue)
    }
  }

  const charCount = value.length
  const isNearLimit = charCount > CONFIG.maxPromptLength * 0.8

  return (
    <div className={`relative ${className}`}>
      {/* Input container with terminal styling */}
      <div
        className={`
          flex items-center gap-3 px-4 py-3
          bg-terminal-dark/80 backdrop-blur-sm
          border rounded-lg transition-all duration-200
          ${isFocused ? 'box-glow' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={{
          borderColor: isFocused
            ? 'var(--theme-primary)'
            : 'color-mix(in srgb, var(--theme-primary) 40%, transparent)',
        }}
      >
        {/* Prompt indicator */}
        <span className="font-mono phosphor-glow select-none" style={{ color: 'var(--theme-primary)' }}>
          {DECORATIVE.arrow.right}
        </span>

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none font-mono text-base tracking-wide disabled:cursor-not-allowed placeholder:text-[color:var(--theme-dim)]"
          style={{ color: 'var(--theme-text)' }}
          aria-label="Command input"
        />

        {/* Blinking cursor when empty and focused */}
        {isFocused && !value && (
          <span className="font-mono cursor-blink select-none" style={{ color: 'var(--theme-primary)' }}>
            _
          </span>
        )}

        {/* Character count */}
        {value && (
          <span
            className={`font-mono text-xs tabular-nums${isNearLimit ? ' text-red-400' : ''}`}
            style={isNearLimit ? undefined : { color: 'var(--theme-dim)' }}
          >
            {charCount}/{CONFIG.maxPromptLength}
          </span>
        )}

        {/* Send button */}
        {value && (
          <button
            onClick={handleSubmit}
            disabled={disabled}
            type="button"
            aria-label="Submit"
            className="font-mono text-sm px-2 py-0.5 rounded border transition-all duration-200 hover:bg-[color:var(--theme-primary)]/20 disabled:opacity-40 disabled:cursor-not-allowed phosphor-glow"
            style={{
              color: 'var(--theme-primary)',
              borderColor: 'color-mix(in srgb, var(--theme-primary) 50%, transparent)',
            }}
          >
            {DECORATIVE.arrow.right}
          </button>
        )}
      </div>

      {/* Helper text */}
      <div className="mt-2 flex justify-between items-center px-1">
        <span className="font-ui text-xs" style={{ color: 'color-mix(in srgb, var(--theme-dim) 70%, transparent)' }}>
          {value ? 'Press ENTER anywhere to generate' : 'Type or select a prompt'}
        </span>
        {value && (
          <button
            onClick={() => setValue('')}
            className="font-ui text-xs hover:text-[color:var(--theme-primary)] transition-colors"
            style={{ color: 'color-mix(in srgb, var(--theme-dim) 70%, transparent)' }}
            type="button"
          >
            [CLEAR]
          </button>
        )}
      </div>

      {/* Example prompts */}
      {showExamples && !value && (
        <div className="mt-4 space-y-2">
          <p className="font-ui text-xs tracking-wider uppercase" style={{ color: 'color-mix(in srgb, var(--theme-dim) 60%, transparent)' }}>
            Try something like:
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setValue(prompt)}
                disabled={disabled}
                className="px-3 py-1.5 font-mono text-xs border rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-[color:var(--theme-primary)]/60 hover:bg-[color:var(--theme-primary)]/5 hover:text-[color:var(--theme-primary)]"
                style={{
                  borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)',
                  color: 'var(--theme-dim)',
                }}
                type="button"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
