/**
 * GLYPH — Share link utilities.
 *
 * Encodes template content into URL-safe base64 hash fragments. NEVER modifies
 * the URL path or query string — only window.location.hash. This means sharing
 * doesn't trigger a navigation or server round-trip in any browser.
 *
 * Encoding: TextEncoder → Uint8Array → chunked String.fromCharCode → btoa →
 * replace +/= with URL-safe chars (-_.). NOT btoa(encodeURIComponent) — that
 * approach bloats the encoded string by ~30% and leaves = padding chars that
 * some URL parsers strip before the hash fragment arrives.
 *
 * The CHUNK_SIZE=8192 limit on String.fromCharCode(...subarray) avoids the V8
 * call-stack limit. Spreading a large Uint8Array as function arguments causes
 * "Maximum call stack size exceeded" for WIDE templates (120×30 + Unicode chars).
 */

/** Encode template content to a URL-safe base64 string */
export function encodeShareContent(content: string): string {
  const bytes = new TextEncoder().encode(content)
  // AC-7: chunked loop avoids V8 arg limit (~65536) for large WIDE templates (120×30 + Unicode)
  const CHUNK_SIZE = 8192
  let bin = ''
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE))
  }
  return btoa(bin)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '.')
}

/** Decode a URL-safe base64 string back to template content */
export function decodeShareContent(encoded: string): string {
  const b64 = encoded
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .replace(/\./g, '=')
  const bin = atob(b64)
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/** Write a share hash to the URL (does not reload the page) */
export function writeShareHash(content: string): void {
  try {
    window.location.hash = encodeShareContent(content)
  } catch (err) {
    console.error('[GLYPH] Failed to write share hash:', err instanceof Error ? err.message : err)
  }
}

/** Read and decode share content from the current URL hash, or null if absent/invalid */
export function readShareHash(): string | null {
  const hash = window.location.hash.slice(1) // strip leading #
  if (!hash) return null
  try {
    return decodeShareContent(hash)
  } catch {
    return null
  }
}

/** Clear the URL hash without triggering a navigation */
export function clearShareHash(): void {
  history.replaceState(null, '', window.location.pathname + window.location.search)
}
