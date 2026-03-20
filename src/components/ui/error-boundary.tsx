/**
 * Error Boundary - Catches React rendering errors
 *
 * Provides a cyberpunk-themed fallback UI when components crash,
 * preventing the entire app from breaking.
 */

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })
    // Log to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default cyberpunk error UI
      return (
        <div className="min-h-[300px] flex items-center justify-center p-8">
          <div className="max-w-lg w-full border border-red-500/50 rounded-lg bg-terminal-dark/90 p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-red-500/30">
              <span className="text-red-500 text-2xl">⚠</span>
              <h2 className="font-ui text-lg tracking-wider text-red-400">
                SYSTEM MALFUNCTION
              </h2>
            </div>

            {/* Error content */}
            <div className="space-y-4">
              <div className="font-mono text-sm">
                <p className="mb-2" style={{ color: 'var(--theme-primary)' }}>ERROR DETECTED:</p>
                <pre className="text-red-400/80 text-xs bg-black/50 p-3 rounded overflow-x-auto">
                  {this.state.error?.message || 'Unknown error'}
                </pre>
              </div>

              {/* Stack trace (collapsed by default in production) */}
              {this.state.errorInfo && (
                <details className="text-xs">
                  <summary className="cursor-pointer hover:text-[color:var(--theme-primary)]" style={{ color: 'var(--theme-dim)' }}>
                    [EXPAND STACK TRACE]
                  </summary>
                  <pre className="mt-2 bg-black/30 p-2 rounded overflow-x-auto max-h-32" style={{ color: 'color-mix(in srgb, var(--theme-dim) 70%, transparent)' }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              {/* Recovery actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={this.handleReset}
                  className="px-4 py-2 font-ui text-sm tracking-wider border rounded transition-all hover:bg-[color:var(--theme-primary)]/10 hover:border-[color:var(--theme-primary)]"
                  style={{
                    borderColor: 'color-mix(in srgb, var(--theme-primary) 50%, transparent)',
                    color: 'var(--theme-primary)',
                  }}
                >
                  [RETRY]
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 font-ui text-sm tracking-wider border border-red-500/50 rounded text-red-400 hover:bg-red-500/10 hover:border-red-500 transition-all"
                >
                  [REBOOT SYSTEM]
                </button>
              </div>
            </div>

            {/* Decorative footer */}
            <div className="mt-6 pt-3 border-t border-red-500/20 text-center">
              <span className="font-mono text-xs text-red-500/50">
                ERR_COMPONENT_CRASH // GLYPH_RECOVERY_MODE
              </span>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
