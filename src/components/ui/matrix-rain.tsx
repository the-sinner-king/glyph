/**
 * MatrixRain - Animated background effect
 *
 * Inline fork of react-mdr. The original library hardcodes setInterval(30ms)
 * with no speed prop. This version uses requestAnimationFrame + delta-time
 * accumulator so speed can be adjusted without tearing down the canvas loop.
 *
 * Oracle-validated pattern (Session 175):
 * - Empty deps useEffect — loop created once, never recreated
 * - Latest Ref Pattern — speedMultiplier read from ref, not closure
 * - cancelAnimationFrame in cleanup — Strict Mode double-mount safe
 * - Ref callback uses block syntax — React 19 implicit return guard
 *
 * AC-3 fix (v1.0.1): debounced resize listener updates canvas dimensions and
 * resets cols/drops without interrupting the running rAF loop. NEVER cancels
 * and restarts the animation on resize — cols and drops live in a shared state
 * object that the running animate closure reads by reference, so mutations are
 * visible on the very next frame without any loop teardown.
 */

import { useEffect, useRef, useLayoutEffect } from 'react'
import { useReducedMotion } from 'motion/react'

interface MatrixRainProps {
  className?: string
  opacity?: number
  speedMultiplier?: number
}

// Katakana + alphanumeric charset matching original react-mdr
const CHARSET =
  'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

const FONT_SIZE = 16
// Base interval matching original react-mdr at 1× speed (30ms)
const BASE_INTERVAL = 30

export function MatrixRain({
  className = '',
  opacity = 0.15,
  speedMultiplier = 0.7,
}: MatrixRainProps) {
  const shouldReduceMotion = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Latest Ref Pattern — keeps speedMultiplier current inside the rAF loop
  // without needing to tear down and recreate the animation
  const speedRef = useRef(speedMultiplier)
  useLayoutEffect(() => {
    speedRef.current = speedMultiplier
  }, [speedMultiplier])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Size canvas to window
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // cols and drops are held in a mutable object so the resize handler can
    // update them in-place while the already-running animate closure reads
    // the new values on the very next frame — no loop restart needed.
    const state = {
      cols: Math.floor(canvas.width / FONT_SIZE),
      drops: [] as number[],
    }
    state.drops = Array(state.cols).fill(1)

    let animationId: number
    let lastTime = 0
    let timer = 0

    const animate = (timestamp: number) => {
      const delta = timestamp - lastTime
      lastTime = timestamp

      // Accumulate time scaled by speed — changing speedRef.current updates
      // the rate without ever cancelling or restarting the loop
      timer += delta * speedRef.current

      if (timer >= BASE_INTERVAL) {
        timer = 0

        // Fade trail
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Draw characters
        ctx.fillStyle = '#0F0'
        ctx.font = `${FONT_SIZE}px monospace`

        for (let i = 0; i < state.drops.length; i++) {
          const char = CHARSET[Math.floor(Math.random() * CHARSET.length)]
          ctx.fillText(char, i * FONT_SIZE, state.drops[i] * FONT_SIZE)

          // Reset drop when it reaches bottom
          if (state.drops[i] * FONT_SIZE > canvas.height && Math.random() > 0.975) {
            state.drops[i] = 0
          }
          state.drops[i]++
        }
      }

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    // Debounced resize handler — updates canvas dimensions and resets
    // cols/drops without touching the running rAF loop.
    let resizeTimer: ReturnType<typeof setTimeout>
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        state.cols = Math.floor(canvas.width / FONT_SIZE)
        state.drops = Array(state.cols).fill(1)
      }, 150)
    }

    window.addEventListener('resize', handleResize)

    // Strict Mode safe: cancel animation, remove listener, clear pending timer
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimer)
    }
  }, [shouldReduceMotion]) // Re-run when motion preference changes — cleanup cancels rAF, guard exits cleanly if canvas is null

  // WCAG 2.2.2: don't mount animation when reduced motion preferred
  if (shouldReduceMotion) return null

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{
        opacity,
        filter: 'sepia(100%) saturate(300%) hue-rotate(10deg)',
      }}
    >
      <canvas
        ref={node => { canvasRef.current = node }}
        className="w-full h-full"
      />
    </div>
  )
}
