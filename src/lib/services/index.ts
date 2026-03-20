// Service exports
export { geminiService } from './gemini'

export {
  generateAsciiText,
  createBox,
  createTitledBox,
  createProgressBar,
  createDivider,
  createSpinnerFrame,
  createStatusLine,
  createMenuItem,
  createBanner,
  TEMPLATE_PRESETS,
} from './ascii'

export {
  getHistory,
  saveToHistory,
  clearHistory,
  removeFromHistory,
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  isFavorite,
  getSettings,
  saveSettings,
  resetSettings,
  getApiKey,
  setApiKey,
  clearApiKey,
  hasApiKey,
  exportAllData,
  importData,
  clearAllData,
} from './storage'
