'use client'
// Hook pour générer un "pop" subtil au clic via Web Audio API (pas de fichier audio externe).
// Lazy-init au premier clic (user gesture requis pour démarrer AudioContext).
// Respecte prefers-reduced-motion.
// LocalStorage flag pour désactiver si l'user veut.

import { useCallback, useRef } from 'react'

let audioContextRef = null
let userPrefersSilence = false

if (typeof window !== 'undefined') {
  // Check global preference
  try {
    userPrefersSilence = localStorage.getItem('quantara_silent') === 'true'
  } catch {}
}

export function useClickSound({ frequency = 700, duration = 0.06, volume = 0.08 } = {}) {
  const lastPlay = useRef(0)

  const play = useCallback(() => {
    if (typeof window === 'undefined') return
    // Skip si reduced-motion ou silent flag
    if (userPrefersSilence) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Throttle : pas plus de 1 son toutes les 50ms
    const now = Date.now()
    if (now - lastPlay.current < 50) return
    lastPlay.current = now

    try {
      // Lazy init AudioContext (user gesture requis)
      if (!audioContextRef) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        if (!AudioCtx) return
        audioContextRef = new AudioCtx()
      }
      const ctx = audioContextRef
      // Resume si suspended (Chrome autoplay policy)
      if (ctx.state === 'suspended') ctx.resume()

      // Oscillator + gain envelope = "pop" subtle
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.setValueAtTime(frequency, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(frequency * 0.4, ctx.currentTime + duration)

      gain.gain.setValueAtTime(volume, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + duration)
    } catch {
      // Si erreur (browser pas compatible, autoplay policy strict, etc.) → silence
    }
  }, [frequency, duration, volume])

  return play
}
