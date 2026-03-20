import { useState, useEffect } from 'react'
import { MatrixRain, ErrorBoundary } from '@/components/ui'
import { Generator } from '@/features/generator'
import { CONFIG } from '@/lib/constants'

function App() {
  const [showPowerOn, setShowPowerOn] = useState(true)

  useEffect(() => {
    // Remove power-on effect after animation
    const timer = setTimeout(() => {
      setShowPowerOn(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`crt-screen crt-flicker crt-noise min-h-screen ${showPowerOn ? 'crt-power-on' : ''}`}>
      {/* Matrix rain background */}
      <MatrixRain opacity={0.08} />

      {/* Main content container */}
      <main className="relative z-10 min-h-screen flex flex-col">
        {/* Generator interface */}
        <div className="flex-1 flex items-center justify-center py-8">
          <ErrorBoundary>
            <Generator />
          </ErrorBoundary>
        </div>

        {/* Footer */}
        <footer className="py-4 text-center border-t" style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}>
          <p className="font-ui text-xs phosphor-glow-dim tracking-wider">
            v{CONFIG.appVersion} // {CONFIG.appName} // SINNER KING TOYS
          </p>
        </footer>
      </main>
    </div>
  )
}

export default App
