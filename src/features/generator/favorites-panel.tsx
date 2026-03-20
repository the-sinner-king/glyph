/**
 * FavoritesPanel — View and manage saved templates.
 *
 * NEVER saves templates — that's TemplateDisplay's job via the [SAVE] button.
 * This panel only reads and removes from the favorites store.
 *
 * After every removal, `onFavoritesChanged()` notifies Generator to increment
 * its `favoritesVersion` counter. That counter flows down to TemplateDisplay as
 * a prop, triggering its useMemo to re-derive `isFav` from storage. Without this
 * callback chain, a template that was just deleted from Favorites would still
 * show [SAVED] in the main result card until the next full re-render.
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { TerminalPanel, CyberButton } from '@/components/ui'
import { getFavorites, removeFromFavorites } from '@/lib/services'
import { formatDate } from '@/lib/utils'
import type { GeneratedTemplate } from '@/types'

const TRANSITION = {
  duration: 0.4,
  ease: [0.25, 0.1, 0.25, 1] as const,
}

interface FavoritesPanelProps {
  isOpen: boolean
  onClose: () => void
  // AC-6c: callback so parent (generator.tsx) can increment favoritesVersion
  onFavoritesChanged: () => void
}

export function FavoritesPanel({ isOpen, onClose, onFavoritesChanged }: FavoritesPanelProps) {
  const [revision, setRevision] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const favorites = useMemo<GeneratedTemplate[]>(() => {
    if (!isOpen) return []
    void revision
    return getFavorites()
  }, [isOpen, revision])

  const handleRemove = (templateId: string) => {
    removeFromFavorites(templateId)
    setRevision(r => r + 1)
    if (expandedId === templateId) setExpandedId(null)
    // AC-6c: notify parent so favoritesVersion increments, TemplateDisplay re-derives isFav
    onFavoritesChanged()
  }

  const handleCopy = async (template: GeneratedTemplate) => {
    try {
      await navigator.clipboard.writeText(template.content)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = template.content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopiedId(template.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDownload = (template: GeneratedTemplate) => {
    const blob = new Blob([template.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `glyph-favorite-${template.id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
            <TerminalPanel variant="glow" title="★ SAVED TEMPLATES">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm" style={{ color: 'var(--theme-dim)' }}>
                    {favorites.length} {favorites.length === 1 ? 'template saved' : 'templates saved'}
                  </span>
                </div>

                {/* Favorites list */}
                <div
                  className="overflow-y-auto max-h-[60vh] space-y-2 pr-2 scrollbar-thin scrollbar-track-transparent"
                  style={{ scrollbarColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent) transparent' }}
                >
                  {favorites.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="font-mono text-sm" style={{ color: 'color-mix(in srgb, var(--theme-dim) 50%, transparent)' }}>
                        No saved templates yet.
                      </p>
                      <p className="font-ui text-xs mt-2" style={{ color: 'color-mix(in srgb, var(--theme-dim) 50%, transparent)' }}>
                        Hit [SAVE] on any template to keep it here.
                      </p>
                    </div>
                  ) : (
                    favorites.map((template, index) => {
                      const isExpanded = expandedId === template.id
                      const previewLines = template.content.split('\n').slice(0, 6).join('\n')
                      const hasMore = template.content.split('\n').length > 6

                      return (
                        <motion.div
                          key={template.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="bg-terminal-dark/50 rounded-lg border overflow-hidden"
                          style={{ borderColor: isExpanded ? 'var(--theme-primary)' : 'color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}
                        >
                          {/* Header row */}
                          <div
                            className="group relative p-3 cursor-pointer hover:bg-[color:var(--theme-primary)]/5 transition-colors"
                            onClick={() => setExpandedId(isExpanded ? null : template.id)}
                          >
                            <div className="flex items-center gap-2 pr-8">
                              <span className="font-ui text-xs tracking-wider uppercase" style={{ color: 'var(--theme-primary)' }}>
                                {template.style}
                              </span>
                              <span style={{ color: 'var(--theme-dim)' }}>•</span>
                              <span className="font-mono text-xs" style={{ color: 'var(--theme-dim)' }}>
                                {template.width}×{template.height}
                              </span>
                              <span style={{ color: 'var(--theme-dim)' }}>•</span>
                              <span className="font-ui text-xs" style={{ color: 'var(--theme-dim)' }}>
                                {formatDate(template.createdAt)}
                              </span>
                              <span className="ml-auto font-ui text-xs" style={{ color: 'var(--theme-dim)' }}>
                                {isExpanded ? '▲ collapse' : '▼ preview'}
                              </span>
                            </div>

                            {/* Delete */}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemove(template.id) }}
                              className="absolute top-2 right-2 p-1.5 hover:text-red-400 hover:bg-red-500/10 rounded opacity-0 group-hover:opacity-100 transition-all"
                              style={{ color: 'var(--theme-dim)' }}
                              aria-label="Remove from favorites"
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
                                <div
                                  className="px-3 pb-2 border-t overflow-x-auto"
                                  style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}
                                >
                                  <pre
                                    className="font-mono text-xs mt-2 leading-tight"
                                    style={{ color: 'var(--theme-text)', whiteSpace: 'pre' }}
                                  >{previewLines}{hasMore ? '\n…' : ''}</pre>
                                </div>

                                <div
                                  className="flex items-center justify-end gap-2 px-3 py-2 border-t"
                                  style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}
                                >
                                  <CyberButton onClick={(e) => { e.stopPropagation(); handleDownload(template) }}>
                                    [DOWNLOAD]
                                  </CyberButton>
                                  <CyberButton
                                    onClick={(e) => { e.stopPropagation(); void handleCopy(template) }}
                                    variant={copiedId === template.id ? 'active' : 'default'}
                                  >
                                    {copiedId === template.id ? '[COPIED]' : '[COPY]'}
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
