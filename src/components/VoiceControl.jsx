import { useState, useEffect, useRef, useCallback } from 'react'
import { gemsData } from '../data/gemsData'
import { soundFX, stopNarration } from '../utils/soundEffects'

// Resilient synonym-to-ISO-code dictionary supporting country names, capitals, gem names, and kid pronunciation quirks!
const GEM_AND_COUNTRY_SYNONYMS = {
  'br': ['brazil', 'brasil', 'brasilia', 'amethyst', 'purple crystal', 'purple quartz', 'watermelon tourmaline', 'tourmaline'],
  'za': ['south africa', 'pretoria', 'johannesburg', 'cape town', 'tiger eye', 'tigers eye', "tiger's eye", 'cat eye'],
  'mg': ['madagascar', 'antananarivo', 'rose quartz', 'pink quartz', 'pink crystal', 'celestite', 'celestine'],
  'in': ['india', 'indya', 'new delhi', 'delhi', 'red jasper', 'jasper', 'aventurine', 'green aventurine', 'green quartz'],
  'us': ['united states', 'america', 'usa', 'washington', 'clear quartz', 'quartz crystal', 'rock crystal', 'snowflake obsidian'],
  'ca': ['canada', 'ottawa', 'sodalite', 'blue sodalite', 'ammolite', 'dinosaur gem', 'dinosaur shell'],
  'mx': ['mexico', 'mexico city', 'dalmatian jasper', 'dalmatian stone', 'puppy stone', 'spotted stone', 'fire agate'],
  'pe': ['peru', 'lima', 'pyrite', 'fools gold', "fool's gold", 'gold cube'],
  'au': ['australia', 'australya', 'canberra', 'opal', 'black opal', 'rainbow opal', 'mookaite'],
  'cn': ['china', 'chyna', 'beijing', 'fluorite', 'rainbow fluorite', 'glow crystal', 'uv crystal'],
  'af': ['afghanistan', 'afganistan', 'kabul', 'lapis', 'lapis lazuli', 'midnight blue'],
  'co': ['colombia', 'colombya', 'bogota', 'emerald', 'green emerald'],
  'mm': ['myanmar', 'burma', 'yangon', 'ruby', 'red ruby', 'pigeon blood', 'jadeite', 'imperial jade'],
  'lk': ['sri lanka', 'srilanka', 'colombo', 'sapphire', 'blue sapphire', 'moonstone', 'rainbow moonstone'],
  'bw': ['botswana', 'gaborone', 'diamond', 'botswana agate', 'banded agate', 'pink agate'],
  'ru': ['russia', 'rusha', 'moscow', 'alexandrite', 'color changing', 'charoite'],
  'eg': ['egypt', 'cairo', 'carnelian', 'orange agate', 'peridot', 'olivine', 'space gem'],
  'ir': ['iran', 'tehran', 'persian', 'turquoise', 'persian turquoise', 'sky stone'],
  'cd': ['congo', 'dr congo', 'kinshasa', 'malachite', 'green rings'],
  'tz': ['tanzania', 'dodoma', 'kilimanjaro', 'zanzibar', 'tanzanite'],
  'ma': ['morocco', 'rabat', 'casablanca', 'geode', 'break open geode', 'moroccan geode'],
  'is': ['iceland', 'reykjavik', 'obsidian', 'volcanic glass', 'lava glass', 'sunstone', 'calcite', 'optical calcite', 'viking sunstone'],
  'fi': ['finland', 'helsinki', 'lapland', 'labradorite', 'spectrolite', 'northern lights'],
  'pl': ['poland', 'warsaw', 'amber', 'baltic amber', 'fossil sap', 'tree sap'],
  'de': ['germany', 'berlin', 'idar oberstein', 'agate', 'german agate'],
  'ch': ['switzerland', 'swiss', 'bern', 'smoky quartz', 'alpine crystal'],
  'cz': ['czechia', 'czech republic', 'prague', 'czech', 'garnet', 'red garnet', 'moldavite', 'meteorite glass'],
  'es': ['spain', 'madrid', 'navajun', 'cube pyrite', 'spanish pyrite'],
  'gb': ['united kingdom', 'uk', 'england', 'scotland', 'london', 'blue john', 'whitby jet', 'jet'],
  'se': ['sweden', 'stockholm', 'hematite', 'mirror stone', 'magnetic stone'],
  'no': ['norway', 'norwey', 'oslo', 'thulite', 'pink stone'],
  'jp': ['japan', 'tokyo', 'pearl', 'akoya pearl', 'oyster pearl'],
  'nz': ['new zealand', 'newzealand', 'wellington', 'pounamu', 'greenstone', 'nephrite', 'jade'],
  'ar': ['argentina', 'buenos aires', 'rhodochrosite', 'inca rose'],
  'cl': ['chile', 'chili', 'santiago', 'atacama', 'chrysocolla'],
  'uy': ['uruguay', 'montevideo', 'artigas', 'uruguay amethyst'],
  'pk': ['pakistan', 'islamabad', 'aquamarine', 'himalayan crystal'],
  'tr': ['turkey', 'turki', 'ankara', 'chalcedony', 'blue chalcedony'],
  'sa': ['saudi arabia', 'saudi', 'riyadh', 'desert rose', 'selenite', 'gypsum'],
  'et': ['ethiopia', 'addis ababa', 'welo opal', 'fire opal', 'honeycomb opal'],
  'gl': ['greenland', 'greeland', 'nuuk', 'tugtupite', 'reindeer stone', 'glowing crystal'],
  'gt': ['guatemala', 'guatemala city', 'mayan jade', 'blue jade'],
  've': ['venezuela', 'venezuala', 'caracas', 'angel falls'],
  'bo': ['bolivia', 'bolivya', 'sucre', 'la paz', 'ametrine', 'anahi'],
  'ec': ['ecuador', 'quito', 'galapagos'],
  'fr': ['france', 'frants', 'paris', 'pink fluorite', 'mont blanc', 'chamonix'],
  'it': ['italy', 'italya', 'rome', 'vesuvius', 'vesuvianite', 'idocrase', 'carrara'],
  'at': ['austria', 'ostria', 'vienna', 'habachtal', 'alpine emerald'],
  'gr': ['greece', 'greek', 'athens', 'prase', 'serifos'],
  'ua': ['ukraine', 'ukrainya', 'kyiv', 'kiev', 'heliodor', 'golden beryl', 'volyn'],
  'ro': ['romania', 'romanya', 'bucharest', 'stibnite', 'maramures'],
  'na': ['namibia', 'windhoek', 'demantoid', 'green garnet', 'pietersite', 'tempest stone'],
  'zm': ['zambia', 'lusaka', 'kagem', 'zambian emerald'],
  'zw': ['zimbabwe', 'harare', 'sandawana', 'shangaan'],
  'ke': ['kenya', 'nairobi', 'tsavorite', 'green grossular'],
  'ng': ['nigeria', 'abuja', 'rubellite', 'spessartine', 'mandarin garnet'],
  'ao': ['angola', 'luanda', 'catoca'],
  'dz': ['algeria', 'algiers', 'sahara', 'tassili'],
  'kz': ['kazakhstan', 'kazakstan', 'astana', 'dioptase', 'emerald copper'],
  'mn': ['mongolia', 'ulaanbaatar', 'gobi', 'gobi agate'],
  'th': ['thailand', 'bangkok', 'chantaburi', 'black spinel', 'spinel', 'siamese ruby'],
  'vn': ['vietnam', 'vietname', 'hanoi', 'luc yen', 'cobalt spinel', 'red spinel'],
  'id': ['indonesia', 'indonesya', 'jakarta', 'bumblebee jasper', 'grape agate', 'purple botryoidal'],
  'ph': ['philippines', 'philipines', 'manila', 'south sea pearl', 'golden pearl'],
  'np': ['nepal', 'kathmandu', 'everest', 'himalayas', 'kyanite', 'blue kyanite']
}

function VoiceControl({ onSelectCountry }) {
  const [listening, setListening] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [recognition, setRecognition] = useState(null)
  const [sandboxBlocked, setSandboxBlocked] = useState(false)
  const [quickQuery, setQuickQuery] = useState('')

  // 🔧 MediaRecorder & Hardware Selection States
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [recordingDiagnostic, setRecordingDiagnostic] = useState(false)
  const [diagnosticStatus, setDiagnosticStatus] = useState('')
  const [showDiagnostics, setShowDiagnostics] = useState(false)

  // 🎙️ Live Microphone Inputs List
  const [micDevices, setMicDevices] = useState([])
  const [selectedMicId, setSelectedMicId] = useState('')

  const selectCountryRef = useRef(onSelectCountry)
  useEffect(() => {
    selectCountryRef.current = onSelectCountry
  }, [onSelectCountry])

  const matchSpokenPhrase = useCallback((rawTranscript) => {
    const transcript = (rawTranscript || '').toLowerCase().trim()
    if (!transcript) return null

    // 1. Word-boundary regex match against curated synonym dictionary
    for (const [code, synonyms] of Object.entries(GEM_AND_COUNTRY_SYNONYMS)) {
      for (const synonym of synonyms) {
        const escaped = synonym.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
        const regex = new RegExp(`\\b${escaped}\\b`, 'i')
        if (regex.test(transcript)) {
          return { code: code.toUpperCase(), label: synonym }
        }
      }
    }

    // 2. Substring match against all 65 countries and their gems in gemsData
    for (const country of gemsData) {
      const cName = country.countryName.toLowerCase()
      const cap = country.capital.toLowerCase()
      if (transcript.includes(cName) || cName.includes(transcript)) {
        return { code: country.id, label: country.countryName }
      }
      if (cap.length >= 4 && transcript.includes(cap)) {
        return { code: country.id, label: country.capital }
      }
      for (const gem of country.gems || []) {
        const gName = gem.name.toLowerCase()
        if (transcript.includes(gName) || gName.includes(transcript)) {
          return { code: country.id, label: gem.name }
        }
      }
    }

    // 3. Fallback substring match on synonyms
    for (const [code, synonyms] of Object.entries(GEM_AND_COUNTRY_SYNONYMS)) {
      for (const synonym of synonyms) {
        if (transcript.includes(synonym)) {
          return { code: code.toUpperCase(), label: synonym }
        }
      }
    }

    return null
  }, [])

  // 🎙️ Scan connected hardware microphone devices
  const scanMicrophones = useCallback(async (requestStream = false) => {
    try {
      if (!navigator.mediaDevices) return false
      if (requestStream && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(t => t.stop())
      }
      if (navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const audioInputs = devices.filter(device => device.kind === 'audioinput')
        setMicDevices(audioInputs)
        if (audioInputs.length > 0 && !selectedMicId) {
          setSelectedMicId(audioInputs[0].deviceId)
        }
      }
      return true
    } catch (err) {
      console.warn('Mic hardware enumeration blocked or failed:', err)
      return false
    }
  }, [selectedMicId])

  useEffect(() => {
    scanMicrophones(false)
  }, [scanMicrophones])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser.')
      return
    }

    try {
      const rec = new SpeechRecognition()
      rec.continuous = false
      rec.interimResults = false
      rec.maxAlternatives = 4
      rec.lang = 'en-US'

      rec.onstart = () => {
        setListening(true)
        setSandboxBlocked(false)
        setErrorMessage('Speak a gem or country now! 🎙️')
      }

      rec.onend = () => {
        setListening(false)
      }

      rec.onerror = (event) => {
        console.warn('Speech recognition error:', event.error)
        setListening(false)
        const isOpaqueOrigin = typeof window !== 'undefined' && (window.origin === 'null' || window.location?.origin === 'null')
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          if (isOpaqueOrigin) {
            setSandboxBlocked(true)
            setErrorMessage('x20 sandbox blocks mic — use Quick Search or GitHub Pages! 👇')
          } else {
            setErrorMessage('Please allow microphone access in your browser! 🎙️')
          }
        } else if (event.error === 'no-speech') {
          setErrorMessage("Didn't hear anything — tap & say 'Amethyst' or 'Brazil'! 🧐")
        } else {
          setErrorMessage('Mic glitch — tap to try again! 🎙️')
        }
      }

      rec.onresult = (event) => {
        let matched = null
        let firstTranscript = ''

        for (let i = 0; i < event.results[0].length; i++) {
          const candidate = event.results[0][i].transcript.toLowerCase().trim()
          if (i === 0) firstTranscript = candidate
          const hit = matchSpokenPhrase(candidate)
          if (hit) {
            matched = hit
            break
          }
        }

        if (matched) {
          soundFX.playCrystalChime()
          selectCountryRef.current(matched.code)
          setErrorMessage(`Found "${firstTranscript}"! 💎✨`)
          try { rec.stop() } catch { /* ignore */ }
        } else {
          soundFX.playClick()
          setErrorMessage(`Heard "${firstTranscript}" — try "Amethyst" or "Brazil"! 🧐`)
        }
      }

      setRecognition(rec)

      return () => {
        try { rec.abort() } catch { /* ignore */ }
      }
    } catch (e) {
      console.warn('SpeechRecognition init failed:', e)
    }
  }, [matchSpokenPhrase])

  const toggleListen = useCallback(async () => {
    soundFX.playClick()
    stopNarration()

    const isOpaqueOrigin = typeof window !== 'undefined' && (window.origin === 'null' || window.location?.origin === 'null')
    if (isOpaqueOrigin) {
      setSandboxBlocked(prev => !prev)
      setErrorMessage('x20 sandbox blocks mic — use Quick Search or GitHub Pages! 👇')
      return
    }

    if (!recognition) {
      setSandboxBlocked(prev => !prev)
      setErrorMessage('Voice recognition not supported here — use Quick Search! 👇')
      return
    }

    if (listening) {
      try { recognition.stop() } catch { /* ignore */ }
      setListening(false)
    } else {
      try {
        recognition.start()
      } catch {
        // If already started or permission needed, request mic stream and retry
        const ok = await scanMicrophones(true)
        if (ok) {
          try {
            recognition.start()
          } catch {
            setListening(false)
          }
        } else {
          setErrorMessage('Please allow microphone access! 🎙️')
        }
      }
    }
  }, [recognition, listening, scanMicrophones])

  // ⌨️ Spacebar keyboard shortcut listener (matches trains-atlas)
  const toggleListenRef = useRef(toggleListen)
  useEffect(() => {
    toggleListenRef.current = toggleListen
  }, [toggleListen])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        toggleListenRef.current()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 🛠️ MediaRecorder Hardware-Level Diagnostic Methods
  const startDiagnosticRecord = async () => {
    try {
      setDiagnosticStatus('Connecting to selected microphone...')
      const constraints = {
        audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      await scanMicrophones(false)
      setDiagnosticStatus('Mic connected! Speak into your active mic... 🎙️')

      const recorder = new MediaRecorder(stream)
      const chunks = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' })
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        setDiagnosticStatus('Voice captured successfully! Tap Play below 🎧')
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setRecordingDiagnostic(true)
    } catch (err) {
      console.error('Mic diagnostic hardware error:', err)
      const isOpaqueOrigin = typeof window !== 'undefined' && (window.origin === 'null' || window.location?.origin === 'null')
      if (isOpaqueOrigin) {
        setDiagnosticStatus('Blocked by x20web CSP sandbox! Open GitHub Pages link for full mic access.')
      } else {
        setDiagnosticStatus(`Hardware error: ${err.name}. Please allow mic permission! 🧐`)
      }
    }
  }

  const stopDiagnosticRecord = () => {
    if (mediaRecorder && recordingDiagnostic) {
      mediaRecorder.stop()
      setRecordingDiagnostic(false)
    }
  }

  const playDiagnosticPlayback = () => {
    if (!audioUrl) return
    const audio = new Audio(audioUrl)
    audio.play()
    setDiagnosticStatus('Playing back captured sound waves... 🎧')
  }

  const handleQuickJumpSubmit = (e) => {
    e.preventDefault()
    if (!quickQuery.trim()) return
    const matched = matchSpokenPhrase(quickQuery)
    if (matched) {
      soundFX.playCrystalChime()
      selectCountryRef.current(matched.code)
      setErrorMessage(`Found "${quickQuery}"! 💎✨`)
      setQuickQuery('')
      setSandboxBlocked(false)
    } else {
      soundFX.playClick()
      setErrorMessage(`No match for "${quickQuery}" — try "Amethyst" or "Brazil"!`)
    }
  }

  return (
    <div className="flex flex-col items-center relative">
      {/* 🎙️ MAIN mic interaction bar */}
      <div className="flex items-center space-x-2.5 select-none z-10 bg-white/95 px-3 py-1 rounded-full shadow-md border-2 border-purple-300">
        <button
          id="voice-search-btn"
          onClick={toggleListen}
          className={`relative w-11 h-11 rounded-full flex items-center justify-center text-xl shadow-md transition-all duration-300 border-2 cursor-pointer select-none shrink-0 ${
            listening
              ? 'bg-red-500 border-red-200 text-white scale-110 animate-pulse'
              : 'bg-amber-400 border-amber-200 text-amber-950 hover:bg-amber-300 hover:scale-105'
          }`}
          title={listening ? 'Listening... Speak now! (Or press Spacebar)' : 'Tap to speak a gem or country! (Or press Spacebar)'}
        >
          {listening ? '🎙️' : '🗣️'}
          {listening && (
            <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-75"></span>
          )}
        </button>

        <div
          onClick={toggleListen}
          className="flex flex-col justify-center max-w-[180px] sm:max-w-[250px] text-left cursor-pointer"
        >
          <div className="text-xs sm:text-sm font-black text-purple-950 font-kids tracking-wide leading-tight flex items-center space-x-1.5">
            <span>{listening ? '🔴 Listening...' : 'Speak Gem / Country!'}</span>
            <span className="hidden md:inline bg-purple-100 border border-purple-300 text-purple-800 font-bold text-[9px] px-1.5 py-0.5 rounded-full">
              SPACEBAR
            </span>
          </div>
          <div
            className={`text-[11px] font-bold font-kids truncate ${
              errorMessage.includes('Found') ? 'text-emerald-600' : 'text-amber-700'
            }`}
          >
            {errorMessage || 'Say "Amethyst", "Brazil" or "Diamond"!'}
          </div>
        </div>

        <button
          onClick={() => {
            soundFX.playClick()
            setShowDiagnostics(!showDiagnostics)
            setSandboxBlocked(false)
          }}
          className="text-sm bg-purple-100 hover:bg-purple-200 p-1.5 rounded-full cursor-pointer transition shrink-0"
          title="🔧 Microphone Hardware Settings & Diagnostics"
        >
          🔧
        </button>
      </div>

      {/* 💡 SANDBOX / QUICK VOICE FALLBACK POPOVER (when x20web CSP sandbox blocks microphone) */}
      {sandboxBlocked && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-14 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl text-white w-[310px] sm:w-[370px] text-left border-2 border-amber-400 z-50 font-kids"
        >
          <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-2.5">
            <span className="font-black text-amber-300 text-sm">🎙️ Voice &amp; Quick Gem Finder</span>
            <button
              onClick={() => setSandboxBlocked(false)}
              className="text-slate-400 hover:text-white text-base font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleQuickJumpSubmit} className="flex space-x-2 mb-3">
            <input
              type="text"
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              placeholder="Type or dictate: Amethyst, Brazil..."
              autoFocus
              className="flex-1 bg-slate-800 border-2 border-purple-400 rounded-xl px-3 py-1.5 text-white text-sm font-bold focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-black px-3.5 py-1.5 rounded-xl text-sm cursor-pointer"
            >
              Go! 💎
            </button>
          </form>

          <div className="bg-purple-950/90 border border-purple-700 rounded-xl p-2.5 text-xs text-purple-100 leading-relaxed">
            <div className="font-black text-amber-300 mb-1">
              💡 Why did the microphone block on x20web?
            </div>
            <p className="mb-2">
              Google&apos;s <code className="text-amber-200">x20web</code> server adds a security sandbox header that blocks browser microphone access. For full live microphone voice control (just like Trains Atlas!), open the GitHub Pages app:
            </p>
            <a
              href="https://melvinjosej.github.io/gems-atlas/"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black py-1.5 px-3 rounded-xl shadow transition"
            >
              🚀 Open Live GitHub Pages App (Full Mic Support)
            </a>
          </div>
        </div>
      )}

      {/* 🔧 HARDWARE DIAGNOSTIC DRAWER MODAL WITH MIC SELECTOR */}
      {showDiagnostics && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-14 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md p-5 rounded-2xl shadow-xl text-white w-[320px] md:w-[380px] text-left border-2 border-slate-700 z-50 font-mono text-xs leading-relaxed"
        >
          <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-3">
            <span className="font-bold text-rose-400 text-sm">🎙️ HARDWARE AUDIO INPUTS</span>
            <button
              onClick={() => setShowDiagnostics(false)}
              className="text-slate-400 hover:text-white text-base font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-slate-400 mb-1 font-bold text-[10px] uppercase tracking-wider">
              Active Recording Device:
            </label>
            {micDevices.length > 0 ? (
              <select
                value={selectedMicId}
                onChange={(e) => {
                  setSelectedMicId(e.target.value)
                  setDiagnosticStatus('Switched input to selected device 🎙️')
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs font-mono focus:outline-none focus:border-rose-500 cursor-pointer truncate"
              >
                {micDevices.map((device, idx) => (
                  <option key={device.deviceId || idx} value={device.deviceId}>
                    {device.label || `Microphone Channel ${idx + 1}`}
                  </option>
                ))}
              </select>
            ) : (
              <div className="bg-slate-950 text-rose-400 p-2 rounded border border-slate-800 text-center font-semibold">
                ⚠️ No hardware microphones enumerated yet — click Start Record to request permission!
              </div>
            )}
          </div>

          <div className="bg-slate-950 p-3 rounded-lg mb-3 text-amber-400 font-semibold border border-slate-800 min-h-[40px] flex items-center leading-snug">
            {diagnosticStatus || 'Ready. Press Start Record and speak to test!'}
          </div>

          <div className="flex space-x-2">
            {recordingDiagnostic ? (
              <button
                onClick={stopDiagnosticRecord}
                className="flex-1 bg-red-600 hover:bg-red-700 font-bold py-2.5 rounded-lg text-center cursor-pointer border border-red-500"
              >
                ⏹️ Stop Record
              </button>
            ) : (
              <button
                onClick={startDiagnosticRecord}
                className="flex-1 bg-slate-700 hover:bg-slate-600 font-bold py-2.5 rounded-lg text-center cursor-pointer border border-slate-600"
              >
                ⏺️ Start Record
              </button>
            )}

            <button
              onClick={playDiagnosticPlayback}
              disabled={!audioUrl}
              className={`flex-1 font-bold py-2.5 rounded-lg text-center cursor-pointer border ${
                audioUrl
                  ? 'bg-emerald-600 border-emerald-500 hover:bg-emerald-700 text-white'
                  : 'bg-slate-800 border-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              ▶️ Play Test Voice
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default VoiceControl
