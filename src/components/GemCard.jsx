import { useState, useEffect, useRef, useCallback } from 'react'
import { soundFX, safeStorage, speakNarration, stopNarration } from '../utils/soundEffects'

function GemCard({ gem, country, index = 0, isOwned, onToggleOwned, onOpenTumblerLab }) {
  const [imgLoading, setImgLoading] = useState(true)
  const [imgError, setImgError] = useState(false)
  const [prevPhotoUrl, setPrevPhotoUrl] = useState(gem?.photoUrl)
  const [activeTab, setActiveTab] = useState('facts') // 'facts' | 'tumbler'
  const [speakingFactIndex, setSpeakingFactIndex] = useState(null)
  const [isSpeakingCard, setIsSpeakingCard] = useState(false)
  const [isMuted, setIsMuted] = useState(() => {
    return safeStorage.getItem('gems-atlas-muted') === 'true'
  })
  const imgRef = useRef(null)

  // Reset states on gem change during render
  if (gem?.photoUrl !== prevPhotoUrl) {
    setPrevPhotoUrl(gem?.photoUrl)
    setImgLoading(true)
    setImgError(false)
    setActiveTab('facts')
    if (speakingFactIndex !== null) {
      setSpeakingFactIndex(null)
    }
  }

  const buildFullScript = useCallback(() => {
    if (!gem) return ''
    const countryIntro = country ? `${country.countryName}, capital ${country.capital}. ` : ''
    const kitNote = gem.inNatGeoKit ? 'This stone is in your National Geographic Gem Kit! ' : ''
    const introText = `${countryIntro}Let's discover ${gem.name}! ${kitNote}`
    const factsText = gem.funFacts ? gem.funFacts.join('. ') : ''
    return `${introText} ${factsText}`
  }, [gem, country])

  // Speak full narrator script on gem change
  useEffect(() => {
    if (isMuted || !gem) {
      stopNarration()
      return
    }

    const rawScriptText = buildFullScript()
    speakNarration(rawScriptText, {
      rate: 0.88,
      pitch: 1.1,
      onStart: () => setIsSpeakingCard(true),
      onEnd: () => {
        setIsSpeakingCard(false)
        setSpeakingFactIndex(null)
      },
      onError: () => {
        setIsSpeakingCard(false)
        setSpeakingFactIndex(null)
      }
    })

    return () => {
      stopNarration()
      setIsSpeakingCard(false)
    }
  }, [gem, country, index, isMuted, buildFullScript])

  if (!gem) return null

  const handleReadCardAloud = () => {
    soundFX.playClick()
    if (isMuted) {
      setIsMuted(false)
      safeStorage.setItem('gems-atlas-muted', 'false')
    }
    const textToSpeak = activeTab === 'tumbler' ? gem.tumblerTip : buildFullScript()
    setIsSpeakingCard(true)
    speakNarration(textToSpeak, {
      rate: 0.88,
      pitch: 1.1,
      forceUnmute: true,
      onStart: () => setIsSpeakingCard(true),
      onEnd: () => {
        setIsSpeakingCard(false)
        setSpeakingFactIndex(null)
      },
      onError: () => {
        setIsSpeakingCard(false)
        setSpeakingFactIndex(null)
      }
    })
  }

  const toggleMute = () => {
    soundFX.playClick()
    const nextMuteState = !isMuted
    setIsMuted(nextMuteState)
    safeStorage.setItem('gems-atlas-muted', String(nextMuteState))
    if (nextMuteState) {
      stopNarration()
      setIsSpeakingCard(false)
      setSpeakingFactIndex(null)
    }
  }

  const handlePlayGemSound = () => {
    if (gem.tumblerStatus === 'great') {
      soundFX.playCrystalChime()
    } else {
      soundFX.playPickaxe()
    }
  }

  // Speak an individual fun fact or tumbler tip when tapped by child
  const handleSpeakFact = (factText, idx) => {
    soundFX.playClick()
    if (isMuted) {
      setIsMuted(false)
      safeStorage.setItem('gems-atlas-muted', 'false')
    }
    setSpeakingFactIndex(idx)
    setIsSpeakingCard(true)
    speakNarration(factText, {
      rate: 0.88,
      pitch: 1.1,
      forceUnmute: true,
      onEnd: () => {
        setSpeakingFactIndex(null)
        setIsSpeakingCard(false)
      },
      onError: () => {
        setSpeakingFactIndex(null)
        setIsSpeakingCard(false)
      }
    })
  }

  // Mohs hardness badge color
  const getMohsBadgeStyle = () => {
    if (gem.mohs >= 8) return 'bg-rose-600 text-white border-rose-200'
    if (gem.mohs >= 6.5) return 'bg-purple-600 text-white border-purple-200'
    return 'bg-amber-500 text-amber-950 border-amber-200'
  }

  const getTumblerBadge = () => {
    if (gem.tumblerStatus === 'great') {
      return { label: '🌀 Great to Tumble!', style: 'bg-emerald-500 text-white border-emerald-200' }
    }
    if (gem.tumblerStatus === 'careful') {
      return { label: '⚠️ Gentle Tumble', style: 'bg-amber-400 text-amber-950 border-white' }
    }
    return { label: '🛑 Do Not Tumble', style: 'bg-rose-500 text-white border-rose-200' }
  }

  const tumblerBadge = getTumblerBadge()

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-3xl shadow-lg border-4 border-purple-100 overflow-hidden font-kids min-h-0">
      
      {/* 📸 GEM PHOTO CONTAINER */}
      <div className="w-full h-[42%] bg-slate-900 relative overflow-hidden group shrink-0 flex items-center justify-center">
        
        {/* ⚙️ Loading Spinner */}
        {imgLoading && !imgError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-200 text-slate-500 z-10">
            <span className="text-4xl animate-spin mb-2">💎</span>
            <div className="font-bold animate-pulse">Polishing Real Gem Photo...</div>
          </div>
        )}

        {/* ⚠️ Error Fallback Screen */}
        {imgError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-purple-50 p-4 text-center z-10 select-none">
            <span className="text-6xl mb-2 animate-bounce">💎</span>
            <div className="font-black text-purple-900 text-xl">{gem.name}</div>
            <div className="text-sm text-purple-600 font-medium mt-1">{gem.type}</div>
          </div>
        )}

        {/* 💯 Real Mineral/Gemstone Image */}
        <img 
          ref={(node) => {
            imgRef.current = node
            if (node && node.complete && node.naturalWidth > 0) {
              setImgLoading(false)
            }
          }}
          src={gem.photoUrl} 
          alt={gem.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setImgLoading(false)}
          onError={() => {
            setImgLoading(false)
            setImgError(true)
          }}
          className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
            imgLoading || imgError ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* ⛏️ NatGeo Kit Badge Overlay (Top Left) */}
        {gem.inNatGeoKit && (
          <div className="absolute top-2.5 left-2.5 bg-amber-400 text-amber-950 font-black text-xs px-3 py-1 rounded-full shadow-md border-2 border-white z-20 flex items-center space-x-1">
            <span>⛏️</span>
            <span>In NatGeo Kit!</span>
          </div>
        )}

        {/* 💎 Mohs Hardness Badge Overlay (Top Right) */}
        <div className={`absolute top-2.5 right-2.5 px-3 py-1 rounded-full font-black text-xs sm:text-sm border-2 shadow-md z-20 flex items-center space-x-1 ${getMohsBadgeStyle()}`}>
          <span>💎</span>
          <span>Mohs {gem.mohs}/10</span>
        </div>

        {/* 🏷️ Gem Type Badge Overlay (Bottom Left) */}
        <div className="absolute bottom-2.5 left-2.5 bg-black/75 backdrop-blur-md text-white font-bold text-xs px-3 py-1 rounded-full shadow-md tracking-wide z-20 max-w-[58%] truncate">
          {gem.type}
        </div>

        {/* 🌀 Tumbler Status Badge Overlay (Bottom Right) */}
        <button
          onClick={() => { soundFX.playClick(); setActiveTab(activeTab === 'tumbler' ? 'facts' : 'tumbler'); }}
          className={`absolute bottom-2.5 right-2.5 px-3 py-1 rounded-full font-black text-xs border-2 shadow-md z-20 cursor-pointer transition active:scale-95 ${tumblerBadge.style}`}
          title="Tap to see Rock Tumbler instructions for this gem!"
        >
          {tumblerBadge.label}
        </button>
      </div>

      {/* 📝 GEM DETAILS & INTERACTIVE TABS */}
      <div className="flex-1 p-3.5 flex flex-col min-h-0 overflow-hidden bg-gradient-to-b from-white to-purple-50/40">
        
        {/* Gem Title + Sound Button + Own Checkmark + Mute Narrator Toggle */}
        <div className="flex items-center justify-between border-b-4 border-purple-200 pb-2 mb-2.5 shrink-0 gap-1.5">
          <h3 className="text-lg sm:text-xl font-black text-slate-800 leading-tight flex-1 truncate" title={gem.name}>
            {gem.name}
          </h3>

          {/* ✅ "I Have This Gem!" Real-Life Kit Check Button */}
          <button
            onClick={() => {
              soundFX.playSuccessChime()
              onToggleOwned()
            }}
            className={`font-black text-xs px-2.5 py-1.5 rounded-full border-2 shadow-sm flex items-center space-x-1 cursor-pointer transition active:scale-90 shrink-0 ${
              isOwned
                ? 'bg-emerald-500 text-white border-emerald-600'
                : 'bg-slate-100 hover:bg-amber-100 text-slate-700 border-slate-300'
            }`}
            title="Check this off if you have this gem in your real-life NatGeo kit or rock collection!"
          >
            <span>{isOwned ? '✅' : '➕'}</span>
            <span className="hidden sm:inline">{isOwned ? 'In My Box!' : 'I Have It!'}</span>
          </button>

          {/* ✨ Sparkle / Dig Sound Button */}
          <button
            onClick={handlePlayGemSound}
            className="bg-amber-400 hover:bg-amber-300 active:scale-90 text-amber-950 font-black text-xs sm:text-sm px-2.5 py-1.5 rounded-full border-2 border-amber-500 shadow-sm flex items-center space-x-1 cursor-pointer transition shrink-0"
            title="Play Crystal Sparkle Sound! ✨"
          >
            <span>✨</span>
            <span className="hidden sm:inline">Sparkle!</span>
          </button>

          {/* 🗣️ Read Aloud Button (Always speaks when tapped!) */}
          <button
            onClick={handleReadCardAloud}
            className={`font-black text-xs sm:text-sm px-2.5 py-1.5 rounded-full border-2 shadow-sm flex items-center space-x-1 cursor-pointer transition active:scale-90 shrink-0 ${
              isSpeakingCard && !isMuted
                ? 'bg-purple-600 text-white border-purple-700 animate-pulse'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 animate-bounce-slow'
            }`}
            title="Read Gem Story Aloud! 🔊"
          >
            <span>🔊</span>
            <span>Read</span>
          </button>

          {/* 🔇 Mute / Unmute Auto-Narrator Toggle */}
          <button 
            onClick={toggleMute}
            className={`text-sm p-1.5 rounded-full cursor-pointer transition active:scale-90 border-2 shadow-sm shrink-0 ${
              isMuted 
                ? 'bg-rose-100 border-rose-300 hover:bg-rose-200 text-rose-700' 
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600'
            }`}
            title={isMuted ? 'Auto-Narrator Muted (Tap to Unmute)' : 'Mute Auto-Narrator'}
          >
            {isMuted ? '🔇' : '🔔'}
          </button>
        </div>

        {/* 🎛️ Mode Switcher: Fun Facts vs Rock Tumbler Tip */}
        <div className="flex space-x-2 mb-2.5 shrink-0">
          <button
            onClick={() => { soundFX.playClick(); setActiveTab('facts'); }}
            className={`flex-1 py-1.5 rounded-xl font-black text-xs sm:text-sm transition cursor-pointer border-2 ${
              activeTab === 'facts'
                ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                : 'bg-slate-100 text-slate-600 border-transparent hover:bg-purple-50'
            }`}
          >
            🌟 Fun Gem Facts ({gem.funFacts?.length || 0})
          </button>
          <button
            onClick={() => { soundFX.playClick(); setActiveTab('tumbler'); }}
            className={`flex-1 py-1.5 rounded-xl font-black text-xs sm:text-sm transition cursor-pointer border-2 ${
              activeTab === 'tumbler'
                ? 'bg-pink-600 text-white border-pink-700 shadow-sm'
                : 'bg-slate-100 text-slate-600 border-transparent hover:bg-pink-50'
            }`}
          >
            🌀 Rock Tumbler Guide
          </button>
        </div>

        {/* TAB 1: Fun Educational Child-Friendly Fact List */}
        {activeTab === 'facts' ? (
          <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar pr-1">
            {gem.funFacts && gem.funFacts.map((fact, idx) => {
              const badgeColors = [
                'bg-purple-100 border-purple-400 text-purple-950 hover:bg-purple-200/70',
                'bg-amber-100 border-amber-400 text-amber-950 hover:bg-amber-200/70',
                'bg-sky-100 border-sky-400 text-sky-950 hover:bg-sky-200/70',
                'bg-emerald-100 border-emerald-400 text-emerald-950 hover:bg-emerald-200/70'
              ]
              const colorClass = badgeColors[idx % badgeColors.length]
              const isSpeakingThis = speakingFactIndex === idx

              return (
                <div 
                  key={idx} 
                  onClick={() => handleSpeakFact(fact, idx)}
                  className={`p-2.5 rounded-2xl border-l-8 shadow-sm font-medium text-sm sm:text-base leading-snug transform transition duration-200 cursor-pointer flex items-start space-x-2 ${colorClass} ${
                    isSpeakingThis ? 'ring-4 ring-purple-500 scale-[1.01]' : ''
                  }`}
                  title="Tap to hear this fun fact read aloud! 🔊"
                >
                  <span className="text-lg shrink-0 mt-0.5">
                    {isSpeakingThis ? '🔊' : '💎'}
                  </span>
                  <span>{fact}</span>
                </div>
              )
            })}
          </div>
        ) : (
          /* TAB 2: Rock Tumbler & Mohs Hardness Card Guide */
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5 pr-1">
            <div
              onClick={() => handleSpeakFact(gem.tumblerTip, 'tumbler')}
              className={`p-3 rounded-2xl border-l-8 shadow-sm cursor-pointer transition ${
                gem.tumblerStatus === 'great'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                  : gem.tumblerStatus === 'careful'
                  ? 'bg-amber-50 border-amber-500 text-amber-950'
                  : 'bg-rose-50 border-rose-500 text-rose-950'
              }`}
              title="Tap to hear this Rock Tumbler Tip read aloud! 🔊"
            >
              <div className="font-black text-sm sm:text-base mb-1 flex items-center justify-between">
                <span>{tumblerBadge.label} • Mohs Hardness {gem.mohs}/10</span>
                <span className="text-xs bg-white/80 px-2 py-0.5 rounded-full">🔊 Tap to Listen</span>
              </div>
              <p className="text-sm sm:text-base font-medium leading-relaxed">
                {gem.tumblerTip}
              </p>
            </div>

            {/* Mohs Hardness Meter Visual Bar */}
            <div className="bg-slate-100 p-3 rounded-2xl border-2 border-slate-200">
              <div className="flex justify-between text-xs font-black text-slate-700 mb-1">
                <span>📏 MOHS SCRATCH HARDNESS SCALE</span>
                <span className="text-purple-700">{gem.mohs} out of 10</span>
              </div>
              <div className="w-full bg-slate-300 h-3.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-gradient-to-r from-amber-400 via-purple-500 to-pink-600 h-full transition-all duration-500"
                  style={{ width: `${(gem.mohs / 10) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-500 mt-1">
                <span>1 (Soft Talc)</span>
                <span>5.5 (Glass)</span>
                <span>7 (Quartz Tumbler Zone)</span>
                <span>10 (Diamond)</span>
              </div>
            </div>

            <button
              onClick={() => { soundFX.playTumblerRumble(); onOpenTumblerLab && onOpenTumblerLab(); }}
              className="w-full bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 active:scale-95 text-white font-black py-2.5 px-4 rounded-2xl shadow-md flex items-center justify-center space-x-2 cursor-pointer transition text-sm"
            >
              <span>🌀</span>
              <span>Open Interactive Rock Tumbler Lab!</span>
            </button>
          </div>
        )}

      </div>

    </div>
  )
}

export default GemCard
