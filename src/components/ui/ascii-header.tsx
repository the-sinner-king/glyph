/**
 * AsciiHeader - Large ASCII art header
 *
 * Features:
 * - Custom hand-crafted ASCII art for GLYPH logo
 * - Soft pulsing phosphor glow effect
 * - Optional reveal animation on mount
 * - Responsive font sizing
 */

import { useState, useEffect } from 'react'

// Custom ASCII art for GLYPH - hand-crafted for that perfect cyberpunk look
const GLYPH_ASCII = ` ██████╗ ██╗  ██╗   ██╗██████╗ ██╗  ██╗
██╔════╝ ██║  ╚██╗ ██╔╝██╔══██╗██║  ██║
██║  ███╗██║   ╚████╔╝ ██████╔╝███████║
██║   ██║██║    ╚██╔╝  ██╔═══╝ ██╔══██║
╚██████╔╝███████╗██║   ██║     ██║  ██║
 ╚═════╝ ╚══════╝╚═╝   ╚═╝     ╚═╝  ╚═╝`

interface AsciiHeaderProps {
  text: string
  className?: string
  animate?: boolean
}

export function AsciiHeader({
  text,
  className = '',
  animate = true,
}: AsciiHeaderProps) {
  const [isRevealed, setIsRevealed] = useState(!animate)

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setIsRevealed(true), 100)
      return () => clearTimeout(timer)
    }
  }, [animate])

  // Use custom ASCII for GLYPH, fallback to text for anything else
  const isGlyph = text.toUpperCase() === 'GLYPH'

  if (!isGlyph) {
    return (
      <div className={`text-center ${className}`}>
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-wider phosphor-glow-pulse">
          {text}
        </h1>
      </div>
    )
  }

  return (
    <pre
      className={`
        font-mono text-[0.35rem] sm:text-[0.5rem] md:text-xs lg:text-sm
        leading-[1.15] phosphor-glow-pulse whitespace-pre select-none
        text-center overflow-x-auto max-w-full
        ${isRevealed ? 'opacity-100' : 'opacity-0'}
        transition-opacity duration-500
        ${className}
      `}
      aria-label={text}
    >
      {GLYPH_ASCII}
    </pre>
  )
}

// Simpler text-based header for smaller displays
export function TextHeader({
  text,
  className = '',
  subtitle,
  intense = false,
}: {
  text: string
  className?: string
  subtitle?: string
  intense?: boolean
}) {
  return (
    <div className={`text-center ${className}`}>
      <h1 className={`font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-wider ${intense ? 'phosphor-glow-intense' : 'phosphor-glow-pulse'}`}>
        {text}
      </h1>
      {subtitle && (
        <p className="mt-2 font-ui text-sm md:text-base phosphor-glow-dim tracking-widest uppercase">
          {subtitle}
        </p>
      )}
    </div>
  )
}
