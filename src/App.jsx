import { useState, useEffect, useCallback } from 'react'
import { gemsData, getCountryById } from './data/gemsData'
import MapView from './components/MapView'
import CountryDetailPanel from './components/CountryDetailPanel'
import VoiceControl from './components/VoiceControl'
import GemExplorerModal from './components/GemExplorerModal'
import PassportModal from './components/PassportModal'
import RockTumblerModal from './components/RockTumblerModal'
import QuizBanner from './components/QuizBanner'
import { soundFX, safeStorage } from './utils/soundEffects'
import './App.css'

function App() {
  const [selectedCountryId, setSelectedCountryId] = useState(null)
  const [isExplorerOpen, setIsExplorerOpen] = useState(false)
  const [isPassportOpen, setIsPassportOpen] = useState(false)
  const [isTumblerOpen, setIsTumblerOpen] = useState(false)
  const [isQuizActive, setIsQuizActive] = useState(false)

  // Passport visited countries state persisted via safeStorage
  const [visitedCountryIds, setVisitedCountryIds] = useState(() => {
    try {
      const saved = safeStorage.getItem('gems-atlas-passport')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Real-life owned gems box persisted via safeStorage (e.g. from his NatGeo kit & tumbler!)
  const [ownedGems, setOwnedGems] = useState(() => {
    try {
      const saved = safeStorage.getItem('gems-atlas-owned-box')
      return saved ? JSON.parse(saved) : ['BR-0', 'ZA-0', 'MG-0', 'IN-0', 'US-0']
    } catch {
      return ['BR-0', 'ZA-0', 'MG-0', 'IN-0', 'US-0']
    }
  })

  // Fast O(1) lookup of current country
  const currentCountry = getCountryById(selectedCountryId)

  const handleSelectCountry = useCallback((countryId) => {
    if (!countryId) {
      setSelectedCountryId(null)
      return
    }
    const country = getCountryById(countryId)
    if (country) {
      setSelectedCountryId(country.id)
      // Record in passport if not visited yet
      setVisitedCountryIds(prev => {
        if (!prev.includes(country.id)) {
          const next = [...prev, country.id]
          safeStorage.setItem('gems-atlas-passport', JSON.stringify(next))
          return next
        }
        return prev
      })
    } else {
      setSelectedCountryId(null)
    }
  }, [])

  const handleToggleOwnedGem = useCallback((gemKey) => {
    setOwnedGems(prev => {
      const next = prev.includes(gemKey)
        ? prev.filter(k => k !== gemKey)
        : [...prev, gemKey]
      safeStorage.setItem('gems-atlas-owned-box', JSON.stringify(next))
      return next
    })
  }, [])

  // ⌨️ Press Escape to exit the selected country or close open modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isTumblerOpen) {
          setIsTumblerOpen(false)
          soundFX.playClick()
        } else if (isExplorerOpen) {
          setIsExplorerOpen(false)
          soundFX.playClick()
        } else if (isPassportOpen) {
          setIsPassportOpen(false)
          soundFX.playClick()
        } else if (selectedCountryId) {
          soundFX.playClick()
          try { window.speechSynthesis?.cancel() } catch { /* ignore */ }
          handleSelectCountry(null)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedCountryId, isExplorerOpen, isPassportOpen, isTumblerOpen, handleSelectCountry])

  // 🎲 Surprise Me! Random Gem Mine Adventure handler
  const handleSurpriseMe = () => {
    soundFX.playPickaxe()
    const unvisited = gemsData.filter(c => !visitedCountryIds.includes(c.id))
    const pool = unvisited.length > 0 ? unvisited : gemsData
    const randomCountry = pool[Math.floor(Math.random() * pool.length)]
    handleSelectCountry(randomCountry.id)
  }

  const handleResetPassport = () => {
    setVisitedCountryIds([])
    safeStorage.removeItem('gems-atlas-passport')
  }

  return (
    <div className="relative w-full h-full bg-[#fdf4ff] select-none flex flex-col">
      
      {/* 💎 Application Header */}
      <header className="bg-gradient-to-r from-purple-700 via-fuchsia-600 to-indigo-600 px-4 py-2.5 shadow-md flex items-center justify-between shrink-0 gap-2 z-20">
        
        {/* Left: App Brand Title */}
        <div 
          onClick={() => { soundFX.playClick(); handleSelectCountry(null); }}
          className="flex items-center space-x-2.5 cursor-pointer group shrink-0"
          title="Return to World Gem Map"
        >
          <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform">💎</span>
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-white tracking-wide drop-shadow-sm font-kids">
            MY ATLAS OF GEMS! 🌍
          </h1>
        </div>

        {/* Center: Child Microphone voice control button (single mounted instance!) */}
        <div className="flex flex-1 justify-center max-w-md mx-2">
          <VoiceControl onSelectCountry={handleSelectCountry} />
        </div>
        
        {/* Right: Feature Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          
          {/* 🌀 Rock Tumbler Lab Button */}
          <button
            id="open-tumbler-lab-btn"
            onClick={() => { soundFX.playTumblerRumble(); setIsTumblerOpen(true); }}
            className="bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 active:scale-95 text-amber-950 font-black text-xs sm:text-sm px-3.5 py-2 rounded-full shadow-md border-2 border-white flex items-center space-x-1.5 cursor-pointer transition"
            title="Open the Interactive NatGeo Rock Tumbler & Mohs Scale Lab!"
          >
            <span>🌀</span>
            <span className="hidden md:inline">Rock Tumbler Lab</span>
          </button>

          {/* 🔍 Explore All Gems Button */}
          <button
            id="open-gem-explorer-btn"
            onClick={() => { soundFX.playClick(); setIsExplorerOpen(true); }}
            className="bg-white/95 hover:bg-white active:scale-95 text-purple-950 font-extrabold text-xs sm:text-sm px-3.5 py-2 rounded-full shadow-md border-2 border-purple-300 flex items-center space-x-1.5 cursor-pointer transition"
            title="Search & Filter All Gems, NatGeo Kit Stones, and Mohs Hardness!"
          >
            <span>🔍</span>
            <span className="hidden sm:inline">All Gems</span>
          </button>

          {/* 🧰 My Gem Passport & Collector Box Button */}
          <button
            id="open-passport-btn"
            onClick={() => { soundFX.playClick(); setIsPassportOpen(true); }}
            className="bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-emerald-950 font-extrabold text-xs sm:text-sm px-3.5 py-2 rounded-full shadow-md border-2 border-white flex items-center space-x-1.5 cursor-pointer transition"
            title="View Collected Country Stamps & Your Real-Life Gem Box!"
          >
            <span>🧰</span>
            <span className="hidden md:inline">My Box:</span>
            <span className="bg-white/85 text-emerald-950 px-2 py-0.5 rounded-full text-xs font-black">
              {visitedCountryIds.length}/{gemsData.length} ⭐
            </span>
          </button>

          {/* 🎲 Surprise Me! Random Gem Mine Button */}
          <button
            id="surprise-me-btn"
            onClick={handleSurpriseMe}
            className="bg-pink-500 hover:bg-pink-600 active:scale-95 text-white font-extrabold text-xs sm:text-sm px-3.5 py-2 rounded-full shadow-md border-2 border-pink-300 flex items-center space-x-1.5 cursor-pointer transition"
            title="Dig in a Random Country!"
          >
            <span>⛏️</span>
            <span className="hidden lg:inline">Dig Random!</span>
          </button>

          {/* 🎮 Gem Quiz Toggle Button */}
          <button
            id="toggle-quiz-btn"
            onClick={() => {
              soundFX.playClick()
              setIsQuizActive(!isQuizActive)
            }}
            className={`font-extrabold text-xs sm:text-sm px-3.5 py-2 rounded-full shadow-md border-2 flex items-center space-x-1.5 cursor-pointer transition active:scale-95 ${
              isQuizActive
                ? 'bg-amber-400 border-white text-amber-950 animate-pulse'
                : 'bg-indigo-500 hover:bg-indigo-600 border-indigo-300 text-white'
            }`}
            title="Play Where in the World Gem Hunt!"
          >
            <span>🎮</span>
            <span className="hidden lg:inline">{isQuizActive ? 'Quiz On' : 'Gem Quiz'}</span>
          </button>

          {/* 🌍 Show Whole Map / Close Panel Button */}
          {selectedCountryId && (
            <button 
              id="show-whole-map-btn"
              onClick={() => { soundFX.playClick(); handleSelectCountry(null); }}
              className="bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-xs sm:text-sm font-black px-3.5 py-2 rounded-full shadow-lg border-2 border-white transition cursor-pointer"
            >
              🌍 Whole Map
            </button>
          )}
        </div>
      </header>

      {/* 🎮 Quiz Mode Interactive Banner HUD */}
      <QuizBanner
        isActive={isQuizActive}
        onClose={() => setIsQuizActive(false)}
        selectedCountryId={selectedCountryId}
        onSelectCountry={handleSelectCountry}
      />

      {/* 🌍 Main Split Workspace Layout */}
      <main className="flex-1 relative flex overflow-hidden">
        
        {/* Map Container - Smoothly adjusts width when country detail panel opens */}
        <div className={`h-full transition-all duration-500 ease-in-out ${currentCountry ? 'w-[58%]' : 'w-full'}`}>
          <MapView 
            selectedCountryId={selectedCountryId} 
            onSelectCountry={handleSelectCountry} 
          />
        </div>

        {/* 📑 Right Slide-Over Gem Browser Panel */}
        <div 
          className={`h-full absolute right-0 top-0 bottom-0 bg-white shadow-2xl transition-all duration-500 ease-in-out overflow-hidden border-l-8 border-purple-500 z-10 flex ${
            currentCountry ? 'w-[42%] opacity-100 translate-x-0 pointer-events-auto' : 'w-0 opacity-0 translate-x-full pointer-events-none'
          }`}
        >
          {currentCountry && (
            <CountryDetailPanel 
              key={currentCountry.id}
              country={currentCountry} 
              onClose={() => handleSelectCountry(null)}
              ownedGems={ownedGems}
              onToggleOwnedGem={handleToggleOwnedGem}
              onOpenTumblerLab={() => setIsTumblerOpen(true)}
            />
          )}
        </div>

      </main>

      {/* 🎵 Soft Footer Attribution */}
      <footer className="bg-slate-100 px-4 py-1.5 text-center text-slate-600 text-xs sm:text-sm font-kids shrink-0 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span>Touch any golden country or press Spacebar to speak a gem or country! ⛏️🎙️</span>
        </div>
        <div className="font-bold text-purple-700 hidden sm:block">
          NatGeo Gem Kit • 4-Stage Rock Tumbler Lab • Mohs Scale 💎🌀
        </div>
      </footer>

      {/* 🌀 Interactive Rock Tumbler & Mohs Hardness Lab Modal */}
      <RockTumblerModal
        isOpen={isTumblerOpen}
        onClose={() => setIsTumblerOpen(false)}
        onSelectCountry={handleSelectCountry}
      />

      {/* 🔍 Gem Encyclopedia Explorer Modal */}
      <GemExplorerModal
        isOpen={isExplorerOpen}
        onClose={() => setIsExplorerOpen(false)}
        onSelectCountry={handleSelectCountry}
        ownedGems={ownedGems}
      />

      {/* 🧰 Gem Passport & Collector Box Modal */}
      <PassportModal
        isOpen={isPassportOpen}
        onClose={() => setIsPassportOpen(false)}
        visitedIds={visitedCountryIds}
        ownedGems={ownedGems}
        onSelectCountry={handleSelectCountry}
        onResetPassport={handleResetPassport}
      />

    </div>
  )
}

export default App
