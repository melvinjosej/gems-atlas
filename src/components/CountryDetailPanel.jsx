import { useState } from 'react'
import GemCard from './GemCard'
import { soundFX } from '../utils/soundEffects'

function CountryDetailPanel({ country, onClose, ownedGems, onToggleOwnedGem, onOpenTumblerLab }) {
  const [activeGemIndex, setActiveGemIndex] = useState(0)
  const [prevCountryId, setPrevCountryId] = useState(country?.id)

  // Reset gem carousel index back to 0 whenever a new country is selected
  if (country?.id !== prevCountryId) {
    setPrevCountryId(country?.id)
    setActiveGemIndex(0)
  }

  const gems = country.gems || []
  const totalGems = gems.length

  const handlePrev = () => {
    soundFX.playClick()
    setActiveGemIndex((prev) => (prev === 0 ? totalGems - 1 : prev - 1))
  }

  const handleNext = () => {
    soundFX.playClick()
    setActiveGemIndex((prev) => (prev === totalGems - 1 ? 0 : prev + 1))
  }

  const currentGem = gems[activeGemIndex]
  const gemKey = `${country.id}-${activeGemIndex}`
  const isOwned = ownedGems?.includes(gemKey)

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 relative font-kids">
      
      {/* 🟣 TOP BANNER CARD: Country Name, Flag and Capital */}
      <div className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 text-white p-4 shadow-md select-none shrink-0 relative">
        {/* Massive Close Button specifically styled for small fingers */}
        <button 
          id="close-country-panel-btn"
          onClick={() => { soundFX.playClick(); onClose(); }}
          className="absolute right-3 top-3 bg-rose-500 hover:bg-rose-600 active:scale-90 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl shadow-md font-bold border-2 border-white transition cursor-pointer"
          title="Close"
        >
          ✕
        </button>

        <div className="pr-14">
          <div className="text-3xl sm:text-4xl font-extrabold tracking-wide flex items-center space-x-2">
            <span>{country.flagEmoji}</span>
            <span className="truncate">{country.countryName}</span>
          </div>
          <div className="text-lg sm:text-xl text-purple-100 mt-1 font-medium flex items-center justify-between">
            <div>
              ⭐ Capital: <span className="font-bold text-white underline decoration-amber-400 decoration-4">{country.capital}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🎠 CENTRAL WORKSPACE CAROUSEL AREA */}
      <div className="flex-1 flex flex-col p-3.5 overflow-hidden relative justify-center">
        
        {totalGems === 0 ? (
          <div className="text-center text-slate-400 text-xl py-12">
            No gems cataloged for this country yet! 🧐
          </div>
        ) : (
          <div className="w-full flex-1 flex flex-col min-h-0">
            
            {/* 💎 Sub-Component Card Rendering */}
            <div className="flex-1 min-h-0">
              <GemCard
                gem={currentGem}
                country={country}
                index={activeGemIndex}
                isOwned={isOwned}
                onToggleOwned={() => onToggleOwnedGem(gemKey)}
                onOpenTumblerLab={onOpenTumblerLab}
              />
            </div>

            {/* 🎮 CAROUSEL BUTTON CONTROLS (Show only if country has more than 1 gem) */}
            {totalGems > 1 && (
              <div className="flex items-center justify-between mt-3 shrink-0 px-2">
                <button
                  onClick={handlePrev}
                  className="bg-purple-500 hover:bg-purple-600 active:scale-90 text-white font-black text-lg px-5 py-2.5 rounded-2xl shadow-md border-b-4 border-purple-700 transition select-none cursor-pointer"
                >
                  ◀ PREV GEM
                </button>

                {/* Dots */}
                <div className="flex space-x-2 select-none">
                  {gems.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full transition-all duration-300 ${
                        idx === activeGemIndex ? 'bg-amber-400 scale-125 ring-2 ring-purple-600' : 'bg-slate-300'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  className="bg-purple-500 hover:bg-purple-600 active:scale-90 text-white font-black text-lg px-5 py-2.5 rounded-2xl shadow-md border-b-4 border-purple-700 transition select-none cursor-pointer"
                >
                  NEXT GEM ▶
                </button>
              </div>
            )}

          </div>
        )}

      </div>

      {/* 🏷️ Count Indicator Header overlay */}
      {totalGems > 1 && (
        <div className="absolute top-[86px] left-5 bg-amber-400 text-amber-950 font-black rounded-full px-3.5 py-0.5 text-xs shadow-md border border-white z-20">
          Gem {activeGemIndex + 1} of {totalGems} 💎
        </div>
      )}

    </div>
  )
}

export default CountryDetailPanel
