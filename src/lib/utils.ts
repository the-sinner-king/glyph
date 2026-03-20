/**
 * GLYPH — Shared utilities
 *
 * General-purpose helpers shared across features. Not service-specific —
 * anything that belongs to a single domain (storage, AI, ASCII) stays in
 * that domain's service file.
 */

/**
 * Format a Unix millisecond timestamp as a human-readable relative string.
 *
 * @param timestamp - Unix time in milliseconds (Date.getTime())
 * @returns "Just now" · "Xm ago" · "Xh ago" · "Mon D" (e.g. "Mar 19")
 *
 * @example
 * formatDate(Date.now() - 30000)   // "Just now"
 * formatDate(Date.now() - 300000)  // "5m ago"
 * formatDate(Date.now() - 7200000) // "2h ago"
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
