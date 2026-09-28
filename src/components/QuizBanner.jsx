import { useState, useEffect, useCallback } from 'react'
import { gemsData } from '../data/gemsData'
import { soundFX, speakNarration, stopNarration } from '../utils/soundEffects'

function QuizBanner({ isActive, onClose, selectedCountryId, onSelectCountry }) {
  const [targetCountry, setTargetCountry] = useState(null)
  const [streak, setStreak] = useState(0)
  const [status, setStatus] = useState('asking') // 'asking' | 'correct' | 'wrong'
  const [feedbackMsg, setFeedbackMsg] = useState('')

  const speakText = useCallback((text) => {
    speakNarration(text, { rate: 0.9, pitch: 1.15 })
  }, [])

  const pickNewQuestion = useCallback(() => {
    const randomIdx = Math.floor(Math.random() * gemsData.length)
    const picked = gemsData[randomIdx]
    setTargetCountry(picked)
    setStatus('asking')
    setFeedbackMsg('')
    onSelectCountry(null)

    const gemName = picked.gems?.[0]?.name || 'sparkling gemstone'
    const promptText = `Where in the world is ${picked.countryName}? Home to ${gemName}, and capital ${picked.capital}! Tap it on the map!`
    speakText(promptText)
  }, [onSelectCountry, speakText])

  // Start quiz when activated
  useEffect(() => {
    if (!isActive) {
      stopNarration()
      return
    }
    const timer = setTimeout(() => {
      if (!targetCountry) {
        pickNewQuestion()
      }
    }, 50)
    return () => clearTimeout(timer)
  }, [isActive, targetCountry, pickNewQuestion])

  // Check answer when user taps a country on the map
  useEffect(() => {
    if (!isActive || !targetCountry || !selectedCountryId || status === 'correct') return

    const tapped = gemsData.find(c => c.id === selectedCountryId)
    if (!tapped) return

    const timer = setTimeout(() => {
      if (tapped.id === targetCountry.id) {
        soundFX.playCrystalChime()
        setStatus('correct')
        setStreak(s => s + 1)
        const msg = `🎉 Hooray! You mined the treasure in ${targetCountry.countryName}!`
        setFeedbackMsg(msg)
        speakText(`Hooray! You found ${targetCountry.countryName}! Awesome gem hunting!`)
      } else {
        soundFX.playClick()
        setStatus('wrong')
        const msg = `🧐 That's ${tapped.countryName}! Keep searching for ${targetCountry.countryName} (${targetCountry.flagEmoji})!`
        setFeedbackMsg(msg)
        speakText(`Oops, that is ${tapped.countryName}. Try finding ${targetCountry.countryName}!`)
      }
    }, 20)

    return () => clearTimeout(timer)
  }, [selectedCountryId, isActive, targetCountry, status, speakText])

  if (!isActive || !targetCountry) return null

  const handleGiveHint = () => {
    soundFX.playPickaxe()
    onSelectCountry(targetCountry.id)
  }

  return (
    <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 text-white px-4 py-3 shadow-xl border-b-4 border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-3 z-30 font-kids select-none">
      
      {/* Left: Question Prompt */}
      <div className="flex items-center space-x-3">
        <div className="bg-amber-400 text-amber-950 font-black px-3 py-1.5 rounded-2xl text-sm flex items-center space-x-1 shadow-sm shrink-0">
          <span>⛏️ GEM QUIZ</span>
          <span>• 💎 {streak}</span>
        </div>

        <div className="text-sm sm:text-lg font-extrabold leading-snug">
          {status === 'correct' ? (
            <span className="text-amber-300">{feedbackMsg}</span>
          ) : (
            <div>
              <span>Find </span>
              <span className="underline decoration-amber-400 decoration-4 font-black text-amber-200">
                {targetCountry.flagEmoji} {targetCountry.countryName}
              </span>
              <span className="hidden md:inline">
                {' '}(Gem: 💎 {targetCountry.gems?.[0]?.name} • Capital: {targetCountry.capital})
              </span>
              {feedbackMsg && (
                <div className="text-xs sm:text-sm text-rose-200 font-bold mt-0.5">
                  {feedbackMsg}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center space-x-2 shrink-0">
        {status === 'correct' ? (
          <button
            onClick={() => { soundFX.playClick(); pickNewQuestion(); }}
            className="bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-emerald-950 font-black px-5 py-1.5 rounded-full shadow-md border-2 border-white cursor-pointer transition animate-bounce"
          >
            Next Gem Hunt ➔
          </button>
        ) : (
          <button
            onClick={handleGiveHint}
            className="bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 font-bold text-xs sm:text-sm px-4 py-1.5 rounded-full shadow-md cursor-pointer transition"
            title="Show me where it is on the map!"
          >
            💡 Show Me!
          </button>
        )}

        <button
          onClick={() => { soundFX.playClick(); pickNewQuestion(); }}
          className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm px-3 py-1.5 rounded-full cursor-pointer transition"
          title="Skip to another question"
        >
          🔄 Skip
        </button>

        <button
          onClick={() => { soundFX.playClick(); onClose(); }}
          className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm px-3 py-1.5 rounded-full cursor-pointer transition"
          title="Exit Quiz Mode"
        >
          ✕ Exit Quiz
        </button>
      </div>

    </div>
  )
}

export default QuizBanner
