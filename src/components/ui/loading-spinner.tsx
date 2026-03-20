/**
 * Loading Indicators
 *
 * LoadingSpinner - Animated ASCII spinner with customizable text
 *
 * Uses setInterval for frame updates, no motion library.
 */

import { useState, useEffect } from 'react'
import { SPINNER_FRAMES, SPINNER_ALT_FRAMES } from '@/lib/constants'

interface LoadingSpinnerProps {
  className?: string
  text?: string
  variant?: 'dots' | 'bar' | 'braille'
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingSpinner({
  className = '',
  text = 'PROCESSING',
  variant = 'braille',
  size = 'md',
}: LoadingSpinnerProps) {
  const [frame, setFrame] = useState(0)
  const [dots, setDots] = useState('')

  const frames = variant === 'braille' ? SPINNER_FRAMES : SPINNER_ALT_FRAMES

  useEffect(() => {
    const spinnerInterval = setInterval(() => {
      setFrame((prev) => (prev + 1) % frames.length)
    }, 80)

    const dotsInterval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return ''
        return prev + '.'
      })
    }, 400)

    return () => {
      clearInterval(spinnerInterval)
      clearInterval(dotsInterval)
    }
  }, [frames.length])

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  }

  return (
    <div className={`flex items-center gap-3 font-mono ${className}`}>
      <span className={`phosphor-glow ${sizeClasses[size]}`}>
        {frames[frame]}
      </span>
      <span className="phosphor-glow-dim tracking-wider">
        {text}
        <span className="inline-block w-8 text-left">{dots}</span>
      </span>
    </div>
  )
}

