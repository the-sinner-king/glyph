/**
 * GLYPH — Storage service.
 *
 * Wraps localStorage for all persistence: generation history, favorites,
 * settings, and API key. NEVER writes to sessionStorage except to clean up
 * legacy session-scoped keys migrated during the v1.1 upgrade path.
 *
 * All read functions return safe defaults on parse failure — a corrupt
 * localStorage key should never crash the app. Write functions do not
 * currently throw on storage-full errors (tracked as v1.0.2 item).
 */

import type { GenerationResult, GeneratedTemplate } from '@/types'

const STORAGE_KEYS = {
  history: 'glyph-history',
  favorites: 'glyph-favorites',
  settings: 'glyph-settings',
  apiKey: 'glyph-gemini-api-key',
} as const

interface StorageSettings {
  soundEnabled: boolean
  soundVolume: number
  animationsEnabled: boolean
  autoSaveHistory: boolean
  maxHistoryItems: number
  colorTheme: string
  defaultSize: string
  defaultStyle: string
  defaultBorder: string
  modelName: string     // Gemini model ID — user-configurable, defaults to Flash 3
  enhanceMode: boolean  // Auto-expand short prompts before generation
}

const DEFAULT_SETTINGS: StorageSettings = {
  soundEnabled: false, // No sounds ship with the repo — enable once audio files are added
  soundVolume: 0.3,
  animationsEnabled: true,
  autoSaveHistory: true,
  maxHistoryItems: 50,
  colorTheme: 'amber',
  defaultSize: 'standard',
  defaultStyle: 'sovereign',
  defaultBorder: 'single',
  modelName: 'gemini-3-flash-preview',
  enhanceMode: true,    // ON by default — better output for short prompts
}

// ─── History ──────────────────────────────────────────────────────────────────

export function getHistory(): GenerationResult[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.history)
    if (!stored) return []
    return JSON.parse(stored) as GenerationResult[]
  } catch {
    console.warn('Failed to parse history from localStorage')
    return []
  }
}

export function saveToHistory(result: GenerationResult): void {
  try {
    const settings = getSettings()
    if (!settings.autoSaveHistory) return

    const history = getHistory()
    history.unshift(result) // Add to beginning

    // Trim to max items
    const trimmed = history.slice(0, settings.maxHistoryItems)
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(trimmed))
  } catch (error) {
    console.error('Failed to save to history:', error)
  }
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEYS.history)
}

// ID-based deletion — avoids stale-index race condition
export function removeFromHistory(id: string): void {
  const history = getHistory()
  const filtered = history.filter(item => item.id !== id)
  try {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(filtered))
  } catch (error) {
    console.error('Failed to remove from history (storage full or private browsing):', error)
  }
}

// ─── Favorites ────────────────────────────────────────────────────────────────

export function getFavorites(): GeneratedTemplate[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.favorites)
    if (!stored) return []
    return JSON.parse(stored) as GeneratedTemplate[]
  } catch {
    console.warn('Failed to parse favorites from localStorage')
    return []
  }
}

export function addToFavorites(template: GeneratedTemplate): void {
  try {
    const favorites = getFavorites()
    // Check if already exists
    if (favorites.some(f => f.id === template.id)) return
    favorites.unshift(template)
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites))
  } catch (error) {
    console.error('Failed to add to favorites:', error)
  }
}

export function removeFromFavorites(templateId: string): void {
  const favorites = getFavorites()
  const filtered = favorites.filter(f => f.id !== templateId)
  try {
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(filtered))
  } catch (error) {
    console.error('Failed to remove from favorites (storage full or private browsing):', error)
  }
}

export function isFavorite(templateId: string): boolean {
  const favorites = getFavorites()
  return favorites.some(f => f.id === templateId)
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function getSettings(): StorageSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.settings)
    if (!stored) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Partial<StorageSettings>): void {
  const current = getSettings()
  const updated = { ...current, ...settings }
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(updated))
}

export function resetSettings(): void {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(DEFAULT_SETTINGS))
}

// ─── API Key ──────────────────────────────────────────────────────────────────
// Keys persist in localStorage — users shouldn't have to re-enter on every visit.
// The key is sent exclusively to Google's Gemini API. NEVER forwarded to any
// other server or logged anywhere in the application.

export function getApiKey(): string | null {
  const key = localStorage.getItem(STORAGE_KEYS.apiKey)
  if (key) return key

  // Migration: check sessionStorage for keys stored before v1.1
  const sessionKey = sessionStorage.getItem(STORAGE_KEYS.apiKey)
  if (sessionKey) {
    localStorage.setItem(STORAGE_KEYS.apiKey, sessionKey)
    sessionStorage.removeItem(STORAGE_KEYS.apiKey)
    return sessionKey
  }

  return null
}

export function setApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEYS.apiKey, key)
  sessionStorage.removeItem(STORAGE_KEYS.apiKey) // clean up any legacy session key
}

export function clearApiKey(): void {
  localStorage.removeItem(STORAGE_KEYS.apiKey)
  sessionStorage.removeItem(STORAGE_KEYS.apiKey)
}

export function hasApiKey(): boolean {
  const key = getApiKey()
  return !!key && key.trim().length > 0
}

// ─── Import / Export ──────────────────────────────────────────────────────────

export function exportAllData(): string {
  const data = {
    history: getHistory(),
    favorites: getFavorites(),
    settings: getSettings(),
    exportedAt: new Date().toISOString(),
  }
  return JSON.stringify(data, null, 2)
}

export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString)
    if (data.history) {
      localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(data.history))
    }
    if (data.favorites) {
      localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(data.favorites))
    }
    if (data.settings) {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(data.settings))
    }
    return true
  } catch {
    console.error('Failed to import data')
    return false
  }
}

// ─── Nuclear option ───────────────────────────────────────────────────────────

export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
  // Also clear legacy sessionStorage key from pre-v1.1 migration
  sessionStorage.removeItem(STORAGE_KEYS.apiKey)
}
