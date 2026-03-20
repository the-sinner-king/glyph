/**
 * Terminal Box Components
 *
 * TerminalBox - ASCII-bordered container with customizable box characters
 * TerminalPanel - Simpler CSS-bordered container for general content
 *
 * Both are theme-aware via --theme-primary/--theme-text/--theme-dim CSS vars.
 */

import { type ReactNode } from 'react'
import { BOX_CHARS, type BoxCharSet } from '@/lib/constants'

interface TerminalBoxProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'glow' | 'pulse'
  boxStyle?: BoxCharSet
  title?: string
}

export function TerminalBox({
  children,
  className = '',
  variant = 'default',
  boxStyle = 'single',
  title,
}: TerminalBoxProps) {
  const chars = BOX_CHARS[boxStyle]

  const variantClasses = {
    default: 'crt-border',
    glow: 'crt-border box-glow',
    pulse: 'crt-border-pulse',
  }

  return (
    <div className={`relative font-mono ${className}`}>
      {/* Top border with optional title */}
      <div className="flex items-center phosphor-glow" style={{ color: 'var(--theme-primary)' }}>
        <span>{chars.topLeft}</span>
        {title && (
          <>
            <span>{chars.horizontal}</span>
            <span className="px-2 text-sm font-ui tracking-wider">{title}</span>
          </>
        )}
        <span className="flex-1 overflow-hidden">
          {chars.horizontal.repeat(100)}
        </span>
        <span>{chars.topRight}</span>
      </div>

      {/* Content area */}
      <div className="flex">
        <span className="phosphor-glow" style={{ color: 'var(--theme-primary)' }}>{chars.vertical}</span>
        <div className={`flex-1 px-4 py-3 ${variantClasses[variant]}`}>
          {children}
        </div>
        <span className="phosphor-glow" style={{ color: 'var(--theme-primary)' }}>{chars.vertical}</span>
      </div>

      {/* Bottom border */}
      <div className="flex items-center phosphor-glow" style={{ color: 'var(--theme-primary)' }}>
        <span>{chars.bottomLeft}</span>
        <span className="flex-1 overflow-hidden">
          {chars.horizontal.repeat(100)}
        </span>
        <span>{chars.bottomRight}</span>
      </div>
    </div>
  )
}

// Simple variant without ASCII borders - uses CSS styling
export function TerminalPanel({
  children,
  className = '',
  variant = 'default',
  title,
}: Omit<TerminalBoxProps, 'boxStyle'>) {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: { border: '1px solid color-mix(in srgb, var(--theme-primary) 50%, transparent)' },
    glow: { border: '1px solid var(--theme-primary)' },
    pulse: { border: '1px solid var(--theme-primary)' },
  }

  const variantClasses: Record<string, string> = {
    default: '',
    glow: 'box-glow',
    pulse: 'crt-border-pulse',
  }

  return (
    <div
      className={`
        bg-terminal-dark/70 backdrop-blur-sm rounded-lg
        ${variantClasses[variant]}
        ${className}
      `}
      style={variantStyles[variant]}
    >
      {title && (
        <div
          className="px-4 py-2 border-b"
          style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)' }}
        >
          <span className="font-ui text-sm tracking-wider phosphor-glow-dim uppercase">
            {title}
          </span>
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}
