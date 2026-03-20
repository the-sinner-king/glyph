/**
 * CyberButton — Theme-aware bracketed button for GLYPH.
 * Hover state is pure CSS via Tailwind + CSS vars. NEVER uses onMouseEnter/
 * onMouseLeave for hover — those require JS and a state round-trip per interaction.
 *
 * ⚠ Tailwind v4 arbitrary color-mix(): the `color:` type prefix is REQUIRED.
 *   Correct:   hover:bg-[color:color-mix(in_srgb,var(--theme-primary)_10%,transparent)]
 *   Broken:    hover:bg-[color-mix(in_srgb,...)]   ← silently ignored by Tailwind v4
 * Without the prefix, Tailwind v4 treats the value as a bare CSS color string and
 * generates no background rule. This is a breaking behavior change from v3.
 *
 * Variants:
 *   default  — primary theme color border + text
 *   danger   — red border + text (destructive actions, static Tailwind classes)
 *   active   — filled background (selected/copied states)
 *   ghost    — dim color, less visual weight
 */

import type { ButtonHTMLAttributes } from 'react'

interface CyberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'danger' | 'active' | 'ghost'
  size?: 'sm' | 'md'
}

export function CyberButton({
  variant = 'default',
  size = 'sm',
  className = '',
  children,
  ...props
}: CyberButtonProps) {
  const sizeClass = size === 'sm'
    ? 'px-2 py-1 text-xs'
    : 'px-6 py-3 text-sm'

  const variantStyle: React.CSSProperties = (() => {
    switch (variant) {
      case 'danger':
        return {}  // handled by static Tailwind classes below
      case 'active':
        return {
          borderColor: 'var(--theme-primary)',
          backgroundColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)',
          color: 'var(--theme-text)',
        }
      case 'ghost':
        return {
          borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)',
          color: 'var(--theme-dim)',
        }
      default:
        return {
          borderColor: 'color-mix(in srgb, var(--theme-primary) 50%, transparent)',
          color: 'var(--theme-primary)',
        }
    }
  })()

  const variantClass = variant === 'danger'
    ? 'border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500'
    : 'hover:bg-[color:color-mix(in_srgb,var(--theme-primary)_10%,transparent)] hover:border-[var(--theme-primary)]'

  return (
    <button
      {...props}
      style={variantStyle}
      className={`
        font-ui tracking-wider border rounded transition-all duration-200
        disabled:opacity-40 disabled:cursor-default
        ${sizeClass}
        ${variantClass}
        ${className}
      `}
    >
      {children}
    </button>
  )
}
