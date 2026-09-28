// Web Audio API Sound Synthesizer & Safe Storage Wrapper for Gems Atlas & Rock Tumbler Lab
// Safe under x20web's CSP sandbox (where allow-same-origin is absent and localStorage throws SecurityError)

const memoryStorage = new Map()

export const safeStorage = {
  getItem(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key)
        if (val !== null) return val
      }
    } catch {
      // x20web CSP sandbox without allow-same-origin throws SecurityError on window.localStorage
    }
    return memoryStorage.has(key) ? memoryStorage.get(key) : null
  },

  setItem(key, value) {
    const strVal = String(value)
    memoryStorage.set(key, strVal)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, strVal)
      }
    } catch {
      // Ignore SecurityError in sandboxed origin; memoryStorage keeps state for the session
    }
  },

  removeItem(key) {
    memoryStorage.delete(key)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key)
      }
    } catch {
      // Ignore SecurityError in sandboxed origin
    }
  }
}

class SoundEffects {
  constructor() {
    this.ctx = null
    this.enabled = true
  }

  initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  isMuted() {
    try {
      return safeStorage.getItem('gems-atlas-muted') === 'true'
    } catch {
      return false
    }
  }

  // ✨ Magical Crystal Shimmer Arpeggio ("Sparkle!")
  playCrystalChime() {
    try {
      if (this.isMuted()) return
      this.initContext()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      // High, glistening pentatonic/major9 crystal bells
      const notes = [1046.5, 1318.5, 1567.98, 1975.53, 2093.0, 2637.02] // C6, E6, G6, B6, C7, E7
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle'
        const start = now + idx * 0.055
        osc.frequency.setValueAtTime(freq, start)
        osc.frequency.exponentialRampToValueAtTime(freq * 1.008, start + 0.35)

        gain.gain.setValueAtTime(0.001, start)
        gain.gain.linearRampToValueAtTime(0.11, start + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55)

        osc.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start(start)
        osc.stop(start + 0.55)
      })
    } catch (e) {
      console.warn('Audio playback error:', e)
    }
  }

  // ⛏️ Geologist Pickaxe Strike ("Clink-Clink + Gem Ding!")
  playPickaxe() {
    try {
      if (this.isMuted()) return
      this.initContext()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      // Two metallic rock strikes followed by a warm crystal ring
      this.triggerMetallicStrike(now, 1480)
      this.triggerMetallicStrike(now + 0.22, 1680)

      // Gem discovery resonance
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(1318.5, now + 0.36) // E6
      osc.frequency.exponentialRampToValueAtTime(1760.0, now + 0.75) // A6

      gain.gain.setValueAtTime(0.001, now + 0.36)
      gain.gain.linearRampToValueAtTime(0.14, now + 0.39)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85)

      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now + 0.36)
      osc.stop(now + 0.85)
    } catch (e) {
      console.warn('Audio playback error:', e)
    }
  }

  triggerMetallicStrike(startTime, baseFreq) {
    const ratios = [1, 1.41, 2.76]
    ratios.forEach((ratio) => {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(baseFreq * ratio, startTime)

      gain.gain.setValueAtTime(0.001, startTime)
      gain.gain.linearRampToValueAtTime(0.09 / ratios.length, startTime + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.14)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + 0.14)
    })
  }

  // 🌀 Rock Tumbler Barrel Rumble + Polish Ding!
  playTumblerRumble() {
    try {
      if (this.isMuted()) return
      this.initContext()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      // Simulate tumbling pebbles with rapid low-mid woody/stony taps
      const pebbleFreqs = [220, 290, 195, 340, 250, 310, 210, 380, 275, 420]
      pebbleFreqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        const start = now + idx * 0.055

        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, start)
        osc.frequency.exponentialRampToValueAtTime(freq * 0.65, start + 0.045)

        gain.gain.setValueAtTime(0.001, start)
        gain.gain.linearRampToValueAtTime(0.1, start + 0.008)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.05)

        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(start)
        osc.stop(start + 0.05)
      })

      // Finish with a bright polished sparkle chord
      setTimeout(() => {
        this.playCrystalChime()
      }, 560)
    } catch (e) {
      console.warn('Audio error:', e)
    }
  }

  // 🎉 Happy discovery / celebration chime
  playSuccessChime() {
    try {
      if (this.isMuted()) return
      this.initContext()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + index * 0.08)

        gain.gain.setValueAtTime(0.001, now + index * 0.08)
        gain.gain.linearRampToValueAtTime(0.15, now + index * 0.08 + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 0.35)

        osc.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start(now + index * 0.08)
        osc.stop(now + index * 0.08 + 0.35)
      })
    } catch (e) {
      console.warn('Audio error:', e)
    }
  }

  // 👆 Soft tactile click for buttons
  playClick() {
    try {
      if (this.isMuted()) return
      this.initContext()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, now)
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.04)

      gain.gain.setValueAtTime(0.1, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.04)
    } catch (e) {
      console.warn('Audio error:', e)
    }
  }
}

export const soundFX = new SoundEffects()

// Pre-warm browser TTS voices list on load
let cachedVoices = []
if (typeof window !== 'undefined' && window.speechSynthesis) {
  try {
    cachedVoices = window.speechSynthesis.getVoices() || []
    window.speechSynthesis.onvoiceschanged = () => {
      try {
        cachedVoices = window.speechSynthesis.getVoices() || []
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}

let speechTimer = null

export function cleanTextForSpeech(text) {
  if (!text) return ''
  return String(text)
    .replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, '')
    .replace(/#/g, 'number ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function stopNarration() {
  if (speechTimer) {
    clearTimeout(speechTimer)
    speechTimer = null
  }
  try {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  } catch {
    // ignore
  }
}

export function speakNarration(rawText, options = {}) {
  const {
    rate = 0.9,
    pitch = 1.1,
    forceUnmute = false,
    onStart,
    onEnd,
    onError
  } = options

  stopNarration()

  if (!forceUnmute && safeStorage.getItem('gems-atlas-muted') === 'true') {
    if (onEnd) onEnd()
    return
  }

  const clean = cleanTextForSpeech(rawText)
  if (!clean) {
    if (onEnd) onEnd()
    return
  }

  speechTimer = setTimeout(() => {
    try {
      if (typeof window === 'undefined' || !window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') {
        if (onError) onError()
        return
      }

      // Unstick Chrome/WebKit speechSynthesis queue if paused
      try {
        window.speechSynthesis.resume()
      } catch {
        // ignore
      }

      const utterance = new SpeechSynthesisUtterance(clean)
      // Keep global reference so Chrome V8 GC never collects the active utterance mid-speech
      window.__gemsAtlasUtterance = utterance

      utterance.lang = 'en-US'
      utterance.rate = rate
      utterance.pitch = pitch

      const voices = cachedVoices.length > 0 ? cachedVoices : (window.speechSynthesis.getVoices() || [])
      if (voices.length > 0) {
        const preferredVoice =
          voices.find(v => v.lang === 'en-US' && (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Natural'))) ||
          voices.find(v => v.lang === 'en-US') ||
          voices.find(v => v.lang && v.lang.startsWith('en'))
        if (preferredVoice) {
          utterance.voice = preferredVoice
        }
      }

      utterance.onstart = () => {
        if (onStart) onStart()
      }
      utterance.onend = () => {
        if (onEnd) onEnd()
      }
      utterance.onerror = () => {
        if (onError) onError()
      }

      window.speechSynthesis.speak(utterance)
    } catch {
      if (onError) onError()
    }
  }, 55)
}

