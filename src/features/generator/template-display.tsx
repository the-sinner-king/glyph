/**
 * TemplateDisplay — Individual template card with action buttons.
 *
 * NEVER manages its own favorites state — isFav is derived from localStorage on
 * every render via useMemo. The favoritesVersion prop (a counter from Generator)
 * is the cache-invalidation signal: when it increments, useMemo re-derives.
 * This pattern avoids the stale-state race condition where [SAVE] in one component
 * would not reflect in another until a full remount.
 *
 * NEVER wraps itself in a motion component — Generator's AnimatePresence owns
 * the enter/exit animation for result cards. A motion wrapper here causes
 * double-animation (scale + fade applied twice in the same frame).
 */

import { useState, useMemo } from 'react'
import { AsciiDisplay, CyberButton } from '@/components/ui'
import { addToFavorites, isFavorite } from '@/lib/services'
import { writeShareHash } from '@/lib/share'
import type { GeneratedTemplate, GenerationMode } from '@/types'

interface TemplateDisplayProps {
  template: GeneratedTemplate
  index: number
  isSelected: boolean
  onSelect: () => void
  onRefine: () => void
  // AC-6c: version counter from parent — triggers isFav re-derivation when favorites change
  favoritesVersion: number
  // AC-12d: V2 metadata props for result header display
  generationMode?: GenerationMode
  qualityScore?: number
}

export function TemplateDisplay({
  template,
  index: _index,
  isSelected,
  onSelect,
  onRefine,
  favoritesVersion,
  generationMode,
  qualityScore,
}: TemplateDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)
  const [fitMode, setFitMode] = useState(false)

  // AC-6c: isFav is derived from storage, not stored in state.
  // favoritesVersion as dep ensures re-derivation when FavoritesPanel deletes a favorite.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- favoritesVersion is an intentional cache-buster, not a direct dep
  const isFav = useMemo(() => isFavorite(template.id), [template.id, favoritesVersion])

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(template.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = template.content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isFav) {
      addToFavorites(template)
      // No setIsFav call needed — useMemo re-derives on next render via favoritesVersion
    }
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    writeShareHash(template.content)
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    const blob = new Blob([template.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `glyph-template-${template.id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // AC-12d: Build header label from V2 metadata props instead of hardcoded A/B labels.
  // Handle undefined gracefully — show [GENERATING] when props not yet available.
  const headerLabel = (() => {
    if (!generationMode) return '[GENERATING]'
    const modeBadge = generationMode === 'craft' ? '[CRAFT]' : '[SLOP]'
    const qualityTag = qualityScore !== undefined ? ` Q:${qualityScore}/4` : ''
    return `${modeBadge}${qualityTag}`
  })()

  return (
    <div
      onClick={onSelect}
      className={`
        relative cursor-pointer
        border rounded-lg bg-terminal-dark/50 backdrop-blur-sm
        overflow-hidden
        transition-colors duration-200
        ${isSelected ? 'box-glow' : ''}
      `}
      style={{
        borderColor: isSelected
          ? 'var(--theme-primary)'
          : 'color-mix(in srgb, var(--theme-primary) 30%, transparent)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)' }}
      >
        <div className="flex items-center gap-3">
          {/* AC-12d: Mode badge + quality score replaces hardcoded A-MINIMAL / B-DECORATIVE */}
          <span
            className="font-ui text-xs tracking-wider uppercase phosphor-glow"
            style={{ color: 'var(--theme-primary)' }}
          >
            {headerLabel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* FIT toggle — CSS container query scales content to card width */}
          <button
            onClick={(e) => { e.stopPropagation(); setFitMode(f => !f) }}
            type="button"
            className="font-mono text-xs px-1.5 py-0.5 rounded border transition-all duration-200 hover:bg-[color:var(--theme-primary)]/10"
            style={{
              color: fitMode ? 'var(--theme-primary)' : 'var(--theme-dim)',
              borderColor: fitMode
                ? 'var(--theme-primary)'
                : 'color-mix(in srgb, var(--theme-primary) 30%, transparent)',
            }}
            title="Toggle FIT: scale content to card width"
          >
            [FIT]
          </button>

          {/* Selection indicator */}
          {isSelected && (
            <span className="font-mono text-xs phosphor-glow" style={{ color: 'var(--theme-primary)' }}>
              [SELECTED]
            </span>
          )}
        </div>
      </div>

      {/* Content — FIT mode uses CSS container query to scale font to card width */}
      <div
        className={`p-4 ${fitMode ? 'overflow-hidden' : 'overflow-x-auto'}`}
        style={fitMode ? { containerType: 'inline-size' } : undefined}
      >
        <AsciiDisplay
          content={template.content}
          animate={false}
          showCopyOverlay={false}
          className="min-h-[200px]"
          preStyle={fitMode && template.width > 0
            ? { fontSize: `calc(100cqi / ${template.width})`, lineHeight: 1.2 }
            : undefined}
        />
      </div>

      {/* Footer actions */}
      <div
        className="flex items-center justify-between px-4 py-2 border-t"
        style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)' }}
      >
        <div className="flex items-center gap-2 text-xs font-mono" style={{ color: 'var(--theme-dim)' }}>
          <span>{template.width}x{template.height}</span>
        </div>

        <div className="flex items-center gap-2">
          <CyberButton
            onClick={(e) => { e.stopPropagation(); onRefine(); }}
            title="Ask AI to perfect this template"
            style={{
              borderColor: 'color-mix(in srgb, var(--theme-primary) 50%, transparent)',
              color: 'var(--theme-primary)',
            }}
          >
            [REFINE]
          </CyberButton>
          <CyberButton
            onClick={handleShare}
            variant={shared ? 'active' : 'default'}
            title="Write template to URL hash — copy the URL to share"
          >
            {shared ? '[LINK READY]' : '[SHARE]'}
          </CyberButton>
          <CyberButton onClick={handleDownload}>
            [DOWNLOAD]
          </CyberButton>
          <CyberButton
            onClick={handleFavorite}
            disabled={isFav}
            variant={isFav ? 'ghost' : 'default'}
          >
            {isFav ? '[SAVED]' : '[SAVE]'}
          </CyberButton>
          <CyberButton
            onClick={handleCopy}
            variant={copied ? 'active' : 'default'}
          >
            {copied ? '[COPIED]' : '[COPY]'}
          </CyberButton>
        </div>
      </div>
    </div>
  )
}
