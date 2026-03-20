/**
 * ASCII Display Component
 *
 * AsciiDisplay - Renders ASCII art content with optional typewriter animation
 *
 * Features:
 * - Typewriter effect with blinking cursor
 * - Copy-to-clipboard functionality
 * - Responsive text sizing
 */

import { useState, useEffect, useRef } from 'react'
import { CONFIG } from '@/lib/constants'

interface AsciiDisplayProps {
  content: string
  className?: string
  animate?: boolean
  onAnimationComplete?: () => void
  showCopyOverlay?: boolean
  preStyle?: React.CSSProperties
}

export function AsciiDisplay({
  content,
  className = '',
  animate = true,
  onAnimationComplete,
  showCopyOverlay = true,
  preStyle,
}: AsciiDisplayProps) {
  const [displayedContent, setDisplayedContent] = useState(animate ? '' : content)
  const [isComplete, setIsComplete] = useState(!animate)
  const containerRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (!animate) {
      setDisplayedContent(content)
      setIsComplete(true)
      return
    }

    // Reset state when content changes
    setDisplayedContent('')
    setIsComplete(false)

    // Typewriter effect
    let currentIndex = 0
    const lines = content.split('\n')
    let currentLine = 0
    let displayed = ''

    const interval = setInterval(() => {
      if (currentLine >= lines.length) {
        clearInterval(interval)
        setIsComplete(true)
        onAnimationComplete?.()
        return
      }

      const line = lines[currentLine]
      if (currentIndex < line.length) {
        displayed += line[currentIndex]
        setDisplayedContent(displayed)
        currentIndex++
      } else {
        displayed += '\n'
        setDisplayedContent(displayed)
        currentLine++
        currentIndex = 0
      }
    }, CONFIG.animation.typingSpeed)

    return () => clearInterval(interval)
  }, [content, animate, onAnimationComplete])

  return (
    <div className={`relative ${className}`}>
      <pre
        ref={containerRef}
        style={preStyle}
        className={`
          font-mono text-xs sm:text-sm leading-tight
          whitespace-pre overflow-x-auto
          phosphor-glow select-all
          ${!isComplete ? 'after:content-["_"] after:cursor-blink' : ''}
        `}
      >
        {displayedContent}
      </pre>

      {/* Copy hint when complete — disabled when parent already provides a copy button */}
      {isComplete && showCopyOverlay && (
        <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
          <CopyButton content={content} />
        </div>
      )}
    </div>
  )
}

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="px-2 py-1 text-xs font-ui border rounded transition-all duration-200"
      style={{
        borderColor: 'color-mix(in srgb, var(--theme-primary) 50%, transparent)',
        backgroundColor: copied
          ? 'color-mix(in srgb, var(--theme-primary) 20%, transparent)'
          : 'rgb(0 0 0 / 0.8)',
        color: copied ? 'var(--theme-text)' : 'var(--theme-primary)',
      }}
      type="button"
    >
      {copied ? '[COPIED]' : '[COPY]'}
    </button>
  )
}

