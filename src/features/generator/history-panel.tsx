/**
 * HistoryPanel — View and manage generation history.
 *
 * NEVER calls the API — all operations are localStorage reads and deletes.
 * [LOAD] is free: restores a cached GenerationResult directly to Generator state
 * without touching Gemini. [REGENERATE] sends the original prompt back through
 * the full generation pipeline.
 *
 * Deletion uses item.id (string), not array index. Index-based deletion is
 * unstable after mutations — a delete that triggers a re-render while another
 * delete is in-flight can corrupt indices. ID-based filter() is atomic.
 *
 * The `revision` counter forces useMemo to re-read localStorage after mutations.
 * React has no knowledge of localStorage changes; this is the minimal signal.
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { TerminalPanel, CyberButton } from '@/components/ui'
import { getHistory, clearHistory, removeFromHistory } from '@/lib/services'
import { formatDate } from '@/lib/utils'
import type { GenerationResult } from '@/types'

const TRANSITION = {
  duration: 0.4,
  ease: [0.25, 0.1, 0.25, 1] as const,
}

interface HistoryPanelProps {
  isOpen: boolean
  onClose: () => void
  onSelectPrompt: (prompt: string) => void
  onLoadResult: (result: GenerationResult) => void
}

export function HistoryPanel({ isOpen, onClose, onSelectPrompt, onLoadResult }: HistoryPanelProps) {
  const [revision, setRevision] = useState(0)
  // AC-5: Track expanded item by ID instead of array index — prevents drift after deletion
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const history = useMemo<GenerationResult[]>(() => {
    if (!isOpen) return []
    void revision
    return getHistory()
  }, [isOpen, revision])

  const handleClearHistory = () => {
    clearHistory()
    setRevision(r => r + 1)
    setExpandedId(null)
  }

  // AC-5: Pass item.id (string) to removeFromHistory instead of array index
  const handleRemoveItem = (id: string) => {
    removeFromHistory(id)
    setRevision(r => r + 1)
    if (expandedId === id) setExpandedId(null)
  }

  const handleRegenerate = (prompt: string) => {
    onSelectPrompt(prompt)
    onClose()
  }

  const handleLoad = (result: GenerationResult) => {
    onLoadResult(result)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={TRANSITION}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-terminal-dark/90 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: -10 }}
            transition={TRANSITION}
            className="w-full max-w-2xl max-h-[85vh] flex flex-col"
          >
            <TerminalPanel variant="glow" title="GENERATION HISTORY">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm" style={{ color: 'var(--theme-dim)' }}>
                    {history.length} {history.length === 1 ? 'entry' : 'entries'}
                  </span>
                  {history.length > 0 && (
                    <CyberButton
                      onClick={handleClearHistory}
                      className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500"
                    >
                      [CLEAR ALL]
                    </CyberButton>
                  )}
                </div>

                {/* History list */}
                <div
                  className="overflow-y-auto max-h-[60vh] space-y-2 pr-2 scrollbar-thin scrollbar-track-transparent"
                  style={{ scrollbarColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent) transparent' }}
                >
                  {history.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="font-mono text-sm" style={{ color: 'color-mix(in srgb, var(--theme-dim) 50%, transparent)' }}>
                        No generation history yet.
                      </p>
                      <p className="font-ui text-xs mt-2" style={{ color: 'color-mix(in srgb, var(--theme-dim) 50%, transparent)' }}>
                        Your past generations will appear here.
                      </p>
                    </div>
                  ) : (
                    history.map((item, index) => {
                      // AC-5: Expanded check uses item.id, not array index
                      const isExpanded = expandedId === item.id
                      const preview = item.template?.content ?? ''
                      const previewLines = preview.split('\n').slice(0, 10).join('\n')

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="bg-terminal-dark/50 rounded-lg border overflow-hidden"
                          style={{ borderColor: isExpanded ? 'var(--theme-primary)' : 'color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}
                        >
                          {/* Header row — click to expand */}
                          <div
                            className="group relative p-3 cursor-pointer hover:bg-[color:var(--theme-primary)]/5 transition-colors"
                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          >
                            <p className="font-mono text-sm pr-8 line-clamp-2" style={{ color: 'var(--theme-text)' }}>
                              "{item.prompt}"
                            </p>
                            <div className="mt-2 flex items-center gap-3 text-xs">
                              <span className="font-ui" style={{ color: 'var(--theme-dim)' }}>
                                {formatDate(item.template?.createdAt || 0)}
                              </span>
                              <span style={{ color: 'var(--theme-dim)' }}>•</span>
                              <span className="font-mono" style={{ color: 'var(--theme-dim)' }}>
                                {item.processingTime}ms
                              </span>
                              <span className="ml-auto font-ui text-xs" style={{ color: 'var(--theme-dim)' }}>
                                {isExpanded ? '▲ collapse' : '▼ preview'}
                              </span>
                            </div>

                            {/* Delete — passes item.id, not index */}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.id) }}
                              className="absolute top-2 right-2 p-1.5 hover:text-red-400 hover:bg-red-500/10 rounded opacity-0 group-hover:opacity-100 transition-all"
                              style={{ color: 'var(--theme-dim)' }}
                              aria-label="Remove from history"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Expanded preview + actions */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                {/* ASCII preview */}
                                <div
                                  className="px-3 pb-2 border-t overflow-x-auto"
                                  style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}
                                >
                                  <pre
                                    className="font-mono text-xs mt-2 leading-tight"
                                    style={{ color: 'var(--theme-dim)', whiteSpace: 'pre' }}
                                  >{previewLines}{preview.split('\n').length > 6 ? '\n…' : ''}</pre>
                                </div>

                                {/* Actions */}
                                <div
                                  className="flex items-center gap-2 px-3 py-2 border-t"
                                  style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}
                                >
                                  <span className="font-ui text-xs mr-auto" style={{ color: 'var(--theme-dim)' }}>
                                    {item.template?.width}×{item.template?.height} chars
                                  </span>
                                  <CyberButton
                                    onClick={(e) => { e.stopPropagation(); handleRegenerate(item.prompt) }}
                                    title="Re-run this prompt (uses API)"
                                  >
                                    [REGENERATE]
                                  </CyberButton>
                                  <CyberButton
                                    onClick={(e) => { e.stopPropagation(); handleLoad(item) }}
                                    variant="active"
                                    title="Restore cached result (no API call)"
                                  >
                                    [LOAD]
                                  </CyberButton>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )
                    })
                  )}
                </div>

                {/* Close */}
                <div className="flex justify-end pt-2 border-t" style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}>
                  <CyberButton onClick={onClose} size="md">
                    [CLOSE]
                  </CyberButton>
                </div>
              </div>
            </TerminalPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
