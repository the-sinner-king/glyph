// Sound Effects Hook for GLYPH
// Placeholder system - Brandon will add actual sound files

import { useCallback, useMemo } from 'react'
import { getSettings } from '@/lib/services'

// Sound file paths - to be added by Brandon
const SOUND_PATHS = {
  keypress: '/sounds/keypress.mp3',
  submit: '/sounds/submit.mp3',
  success: '/sounds/success.mp3',
  error: '/sounds/error.mp3',
  hover: '/sounds/hover.mp3',
  click: '/sounds/click.mp3',
  powerOn: '/sounds/power-on.mp3',
  copy: '/sounds/copy.mp3',
} as const

type SoundName = keyof typeof SOUND_PATHS

// Audio cache to prevent reloading
const audioCache = new Map<SoundName, HTMLAudioElement>()

function getAudio(name: SoundName): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null

  if (audioCache.has(name)) {
    return audioCache.get(name)!
  }

  try {
    const audio = new Audio(SOUND_PATHS[name])
    audio.preload = 'auto'
    audioCache.set(name, audio)
    return audio
  } catch {
    console.warn(`Failed to load sound: ${name}`)
    return null
  }
}

export function useSoundEffects() {
  const settings = useMemo(() => getSettings(), [])

  const play = useCallback((name: SoundName) => {
    if (!settings.soundEnabled) return

    const audio = getAudio(name)
    if (!audio) return

    audio.volume = settings.soundVolume
    audio.currentTime = 0
    audio.play().catch(() => {
      // Autoplay might be blocked - that's okay
    })
  }, [settings.soundEnabled, settings.soundVolume])

  const playKeypress = useCallback(() => play('keypress'), [play])
  const playSubmit = useCallback(() => play('submit'), [play])
  const playSuccess = useCallback(() => play('success'), [play])
  const playError = useCallback(() => play('error'), [play])
  const playHover = useCallback(() => play('hover'), [play])
  const playClick = useCallback(() => play('click'), [play])
  const playPowerOn = useCallback(() => play('powerOn'), [play])
  const playCopy = useCallback(() => play('copy'), [play])

  return {
    play,
    playKeypress,
    playSubmit,
    playSuccess,
    playError,
    playHover,
    playClick,
    playPowerOn,
    playCopy,
    isEnabled: settings.soundEnabled,
  }
}

