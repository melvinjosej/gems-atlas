import { useState, useMemo } from 'react'
import { TUMBLER_STAGES, MOHS_SCALE_GUIDE, gemsData } from '../data/gemsData'
import { soundFX, speakNarration, stopNarration } from '../utils/soundEffects'

function RockTumblerModal({ isOpen, onClose, onSelectCountry }) {
  const [activeTab, setActiveTab] = useState('simulator') // 'simulator' | 'matcher' | 'mohs'
  const [currentStageIdx, setCurrentStageIdx] = useState(0) // 0..3 corresponding to Stage 1..4
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedBatchIds, setSelectedBatchIds] = useState(['BR-0', 'ZA-0', 'MG-0', 'IN-0'])

  // Flatten all gems for the "Can I Tumble These Together?" batch checker
  const allGems = useMemo(() => {
    const list = []
    gemsData.forEach(country => {
      country.gems.forEach((gem, idx) => {
        list.push({
          id: `${country.id}-${idx}`,
          countryId: country.id,
          countryName: country.countryName,
          flagEmoji: country.flagEmoji,
          gem
        })
      })
    })
    return list
  }, [])

  if (!isOpen) return null

  const speakText = (text) => {
    speakNarration(text, { rate: 0.9, pitch: 1.1, forceUnmute: true })
  }

  const activeStage = TUMBLER_STAGES[currentStageIdx]

  const handleSpinBarrel = () => {
    soundFX.playTumblerRumble()
    setIsSpinning(true)
    speakText(`${activeStage.name}. ${activeStage.grit}, for ${activeStage.days}. ${activeStage.whatHappens}`)
    setTimeout(() => {
      setIsSpinning(false)
      if (currentStageIdx < TUMBLER_STAGES.length - 1) {
        setCurrentStageIdx(prev => prev + 1)
      }
    }, 1500)
  }

  const toggleBatchGem = (id) => {
    soundFX.playClick()
    setSelectedBatchIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id)
      }
      if (prev.length >= 6) return prev
      return [...prev, id]
    })
  }

  // Evaluate selected batch compatibility for the Rock Tumbler
  const selectedBatchObjects = allGems.filter(item => selectedBatchIds.includes(item.id))
  const getBatchVerdict = () => {
    if (selectedBatchObjects.length < 2) {
      return {
        status: 'info',
        title: '👆 Pick at least 2 stones below to test your Tumbler Barrel!',
        desc: 'Tap any stones to see if they can safely tumble together without scratching or ruining the batch!'
      }
    }
    const noTumbleStones = selectedBatchObjects.filter(x => x.gem.tumblerStatus === 'no')
    if (noTumbleStones.length > 0) {
      const names = noTumbleStones.map(x => `${x.gem.name} (Mohs ${x.gem.mohs})`).join(', ')
      return {
        status: 'danger',
        title: `🛑 Wait! Remove ${noTumbleStones[0].gem.name} from the Barrel!`,
        desc: `${names} should NOT go in a rock tumbler! ${noTumbleStones[0].gem.tumblerTip}`
      }
    }

    const mohsValues = selectedBatchObjects.map(x => x.gem.mohs)
    const minMohs = Math.min(...mohsValues)
    const maxMohs = Math.max(...mohsValues)
    const diff = maxMohs - minMohs

    if (diff > 1.0) {
      const hardest = selectedBatchObjects.find(x => x.gem.mohs === maxMohs)
      const softest = selectedBatchObjects.find(x => x.gem.mohs === minMohs)
      return {
        status: 'warn',
        title: `⚠️ Hardness Mismatch! (Mohs ${minMohs} vs Mohs ${maxMohs})`,
        desc: `${hardest.gem.name} (Mohs ${maxMohs}) is much harder than ${softest.gem.name} (Mohs ${minMohs})! In the tumbler barrel, the harder rocks will scratch and bruise the softer ones so they won't get shiny!`
      }
    }

    return {
      status: 'great',
      title: `🎉 Awesome Tumbler Batch! (All around Mohs ${minMohs}–${maxMohs})`,
      desc: `These ${selectedBatchObjects.length} stones have matching hardness! They will tumble smoothly together through all 4 grit stages and come out shining like wet glass! ✨💎`
    }
  }

  const verdict = getBatchVerdict()

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 font-kids select-none">
      <div className="bg-purple-50 w-full max-w-6xl h-[92vh] rounded-3xl shadow-2xl border-8 border-purple-500 flex flex-col overflow-hidden">
        
        {/* 🌀 HEADER */}
        <div className="bg-gradient-to-r from-purple-700 via-fuchsia-600 to-amber-500 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center space-x-3">
            <span className={`text-4xl sm:text-5xl ${isSpinning ? 'animate-tumbler-spin' : ''}`}>🌀</span>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-wide drop-shadow-sm">
                NATGEO ROCK TUMBLER &amp; MOHS HARDNESS LAB!
              </h2>
              <p className="text-xs sm:text-sm text-purple-100 font-bold">
                Learn the 4 Grit Stages, test which rocks can tumble together, and master the Mohs 1–10 Scale! 🪨➡️💎
              </p>
            </div>
          </div>

          <button
            onClick={() => { soundFX.playClick(); stopNarration(); onClose(); }}
            className="bg-rose-600 hover:bg-rose-700 active:scale-90 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold border-2 border-white shadow-md transition cursor-pointer"
            title="Close Lab"
          >
            ✕
          </button>
        </div>

        {/* 🎛️ 3-TAB NAVIGATION BAR */}
        <div className="bg-white px-4 py-3 border-b-4 border-purple-200 flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => { soundFX.playClick(); setActiveTab('simulator'); }}
            className={`px-5 py-2 rounded-2xl font-black text-sm sm:text-base transition cursor-pointer flex items-center space-x-2 border-2 ${
              activeTab === 'simulator'
                ? 'bg-purple-600 text-white border-purple-800 shadow-md scale-105'
                : 'bg-slate-100 text-slate-700 border-transparent hover:bg-purple-100'
            }`}
          >
            <span>🌀</span>
            <span>1. Virtual 4-Stage Tumbler</span>
          </button>

          <button
            onClick={() => { soundFX.playClick(); setActiveTab('matcher'); }}
            className={`px-5 py-2 rounded-2xl font-black text-sm sm:text-base transition cursor-pointer flex items-center space-x-2 border-2 ${
              activeTab === 'matcher'
                ? 'bg-pink-600 text-white border-pink-800 shadow-md scale-105'
                : 'bg-slate-100 text-slate-700 border-transparent hover:bg-pink-100'
            }`}
          >
            <span>🧪</span>
            <span>2. Can I Tumble These Together?</span>
          </button>

          <button
            onClick={() => { soundFX.playClick(); setActiveTab('mohs'); }}
            className={`px-5 py-2 rounded-2xl font-black text-sm sm:text-base transition cursor-pointer flex items-center space-x-2 border-2 ${
              activeTab === 'mohs'
                ? 'bg-amber-500 text-amber-950 border-amber-700 shadow-md scale-105'
                : 'bg-slate-100 text-slate-700 border-transparent hover:bg-amber-100'
            }`}
          >
            <span>📏</span>
            <span>3. Mohs Hardness Scale (1–10)</span>
          </button>
        </div>

        {/* 🧪 TAB BODY */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          
          {/* TAB 1: VIRTUAL 4-STAGE ROCK TUMBLER SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-5">
              {/* Stage Selector Stepper */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {TUMBLER_STAGES.map((st, idx) => {
                  const isCurrent = idx === currentStageIdx
                  const isDone = idx < currentStageIdx
                  return (
                    <button
                      key={st.stage}
                      onClick={() => {
                        soundFX.playClick()
                        setCurrentStageIdx(idx)
                        speakText(`${st.name}. ${st.whatHappens}`)
                      }}
                      className={`p-3.5 rounded-3xl border-4 text-left transition cursor-pointer flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-white border-purple-600 shadow-xl scale-[1.02]'
                          : isDone
                          ? 'bg-emerald-50 border-emerald-400 opacity-95'
                          : 'bg-white/70 border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-3xl">{st.icon}</span>
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900">
                          ⏱️ {st.days}
                        </span>
                      </div>
                      <div className="font-black text-base text-slate-800">{st.name}</div>
                      <div className="text-xs font-bold text-slate-500 mt-0.5">{st.grit}</div>
                    </button>
                  )
                })}
              </div>

              {/* Active Stage Interactive Barrel Display */}
              <div className="bg-white rounded-3xl p-5 shadow-lg border-4 border-purple-200 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                
                {/* Left: Spinning Tumbler Barrel Animation */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-indigo-950 rounded-3xl p-5 text-white relative overflow-hidden border-4 border-amber-400">
                  <div className="text-xs font-black uppercase tracking-widest text-amber-300 mb-2">
                    NATGEO RUBBER TUMBLER BARREL
                  </div>

                  {/* Barrel Circle */}
                  <div
                    className={`w-44 h-44 rounded-full border-8 border-amber-400 bg-slate-800 flex flex-wrap items-center justify-center gap-2 p-4 shadow-inner relative ${
                      isSpinning ? 'animate-tumbler-spin' : ''
                    }`}
                  >
                    {/* Visual stones inside barrel changing shape/shine by stage */}
                    {[
                      { name: 'Amethyst', color: 'bg-purple-500', emoji: '💜' },
                      { name: 'Tiger Eye', color: 'bg-amber-600', emoji: '🐯' },
                      { name: 'Rose Quartz', color: 'bg-pink-400', emoji: '🌸' },
                      { name: 'Red Jasper', color: 'bg-red-600', emoji: '🧱' },
                      { name: 'Aventurine', color: 'bg-emerald-500', emoji: '🍀' },
                      { name: 'Agate', color: 'bg-sky-400', emoji: '🌀' }
                    ].map((stone, i) => (
                      <div
                        key={i}
                        className={`w-12 h-10 ${stone.color} flex items-center justify-center text-lg shadow-md transition-all duration-500 ${
                          currentStageIdx === 0
                            ? 'rounded-sm rotate-6 border-2 border-stone-400 opacity-80'
                            : currentStageIdx === 1
                            ? 'rounded-xl -rotate-3 opacity-90'
                            : currentStageIdx === 2
                            ? 'rounded-2xl opacity-95 ring-1 ring-white/50'
                            : 'rounded-full ring-4 ring-white shadow-lg scale-110'
                        }`}
                        title={stone.name}
                      >
                        <span>{currentStageIdx === 3 ? '✨' : stone.emoji}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 text-center">
                    <div className="text-sm font-black text-amber-300">
                      {activeStage.rockLook}
                    </div>
                  </div>

                  <button
                    onClick={handleSpinBarrel}
                    className="mt-3 w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 active:scale-95 text-amber-950 font-black text-base py-3 px-5 rounded-2xl shadow-lg border-2 border-white cursor-pointer transition flex items-center justify-center space-x-2"
                  >
                    <span>▶️</span>
                    <span>{isSpinning ? 'Tumbling Rocks...' : `Run ${activeStage.name}!`}</span>
                  </button>
                </div>

                {/* Right: Stage Explanation & Pro Kid Rules */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`px-4 py-1 rounded-full text-sm font-black border-2 ${activeStage.badgeBg}`}>
                      {activeStage.grit} • {activeStage.days}
                    </span>
                    <button
                      onClick={() => speakText(`${activeStage.name}. ${activeStage.whatHappens} Pro Tip: ${activeStage.kidRule}`)}
                      className="bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs px-3.5 py-1.5 rounded-full cursor-pointer"
                    >
                      🔊 Read Stage Aloud
                    </button>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-slate-800">
                    {activeStage.icon} {activeStage.name}
                  </h3>

                  <div className="bg-purple-50 border-l-8 border-purple-500 p-4 rounded-2xl text-base sm:text-lg font-bold text-purple-950 leading-relaxed">
                    {activeStage.whatHappens}
                  </div>

                  <div className="bg-amber-50 border-l-8 border-amber-500 p-4 rounded-2xl">
                    <div className="text-xs font-black uppercase tracking-wider text-amber-800 mb-1">
                      ⭐ IMPORTANT ROCKHOUND RULE FOR THIS STAGE:
                    </div>
                    <div className="text-sm sm:text-base font-bold text-amber-950">
                      {activeStage.kidRule}
                    </div>
                  </div>

                  {/* 3 Golden Tumbler Rules Banner */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div className="bg-slate-100 p-3 rounded-2xl text-xs font-bold text-slate-700">
                      <span className="text-base block mb-0.5">📏 Rule #1: Match Hardness</span>
                      Only tumble Mohs 7 stones (Quartz, Jasper, Agate) together!
                    </div>
                    <div className="bg-slate-100 p-3 rounded-2xl text-xs font-bold text-slate-700">
                      <span className="text-base block mb-0.5">🚰 Rule #2: No Sink Drains!</span>
                      Never pour grey rock slurry down indoor sinks—it turns into hard cement!
                    </div>
                    <div className="bg-slate-100 p-3 rounded-2xl text-xs font-bold text-slate-700">
                      <span className="text-base block mb-0.5">🪥 Rule #3: Scrub Clean!</span>
                      Scrub rocks with an old toothbrush between every grit stage!
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: CAN I TUMBLE THESE TOGETHER? BATCH CHECKER */}
          {activeTab === 'matcher' && (
            <div className="space-y-4">
              {/* Verdict Box */}
              <div
                onClick={() => speakText(`${verdict.title}. ${verdict.desc}`)}
                className={`p-4 sm:p-5 rounded-3xl border-4 shadow-lg cursor-pointer transition ${
                  verdict.status === 'great'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                    : verdict.status === 'warn'
                    ? 'bg-amber-50 border-amber-500 text-amber-950'
                    : verdict.status === 'danger'
                    ? 'bg-rose-50 border-rose-500 text-rose-950'
                    : 'bg-white border-purple-300 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xl sm:text-2xl font-black">{verdict.title}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      soundFX.playClick()
                      setSelectedBatchIds([])
                    }}
                    className="bg-white/90 hover:bg-white text-slate-700 font-bold text-xs px-3 py-1.5 rounded-full border border-slate-300 shrink-0 cursor-pointer"
                  >
                    🔄 Clear Barrel ({selectedBatchIds.length})
                  </button>
                </div>
                <p className="text-sm sm:text-base font-bold mt-1.5 leading-relaxed">
                  {verdict.desc}
                </p>
              </div>

              {/* Pick Gems Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {allGems.map((item) => {
                  const isSelected = selectedBatchIds.includes(item.id)
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleBatchGem(item.id)}
                      className={`rounded-2xl p-2.5 border-4 cursor-pointer transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-purple-100 border-purple-600 shadow-md scale-[1.02]'
                          : 'bg-white border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="h-24 rounded-xl overflow-hidden bg-slate-200 relative mb-2">
                        <img
                          src={item.gem.photoUrl}
                          alt={item.gem.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 right-1 bg-black/75 text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                          Mohs {item.gem.mohs}
                        </div>
                        {isSelected && (
                          <div className="absolute top-1 left-1 bg-purple-600 text-white text-[11px] font-black px-2 py-0.5 rounded-full border border-white">
                            IN BARREL ✓
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-800 line-clamp-1">
                          {item.gem.name}
                        </div>
                        <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between mt-0.5">
                          <span
                            onClick={(e) => {
                              e.stopPropagation()
                              soundFX.playCrystalChime()
                              onSelectCountry && onSelectCountry(item.countryId)
                              onClose()
                            }}
                            className="hover:text-purple-700 hover:underline"
                            title="Jump to this country on the map!"
                          >
                            {item.flagEmoji} {item.countryName} 📍
                          </span>
                          <span>
                            {item.gem.tumblerStatus === 'great' ? '🌀' : item.gem.tumblerStatus === 'careful' ? '⚠️' : '🛑'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 3: INTERACTIVE MOHS HARDNESS SCALE (1 TO 10) */}
          {activeTab === 'mohs' && (
            <div className="space-y-3">
              <div className="bg-white p-4 rounded-2xl border-2 border-purple-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-800">
                    📏 Friedrich Mohs&apos; Scratch Test Ladder (1 = Softest, 10 = Hardest!)
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-slate-600">
                    Rule of Geology: Any higher number can scratch any lower number! Tap any level to hear it read aloud! 🔊
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {MOHS_SCALE_GUIDE.map((row) => (
                  <div
                    key={row.level}
                    onClick={() => {
                      soundFX.playCrystalChime()
                      speakText(`Mohs Hardness Level ${row.level}: ${row.mineral}. ${row.everyday}`)
                    }}
                    className={`p-3.5 rounded-2xl border-l-8 border-purple-500 shadow-sm cursor-pointer transition hover:scale-[1.01] flex items-center space-x-3.5 ${row.color}`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/90 shadow flex flex-col items-center justify-center shrink-0 border-2 border-purple-300">
                      <span className="text-[10px] font-black text-slate-400 leading-none">MOHS</span>
                      <span className="text-xl font-black text-purple-900 leading-tight">{row.level}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base sm:text-lg font-black flex items-center space-x-1.5">
                        <span>{row.emoji}</span>
                        <span className="truncate">{row.mineral}</span>
                      </div>
                      <div className="text-xs sm:text-sm font-bold opacity-85 mt-0.5">
                        {row.everyday}
                      </div>
                    </div>
                    <span className="text-lg">🔊</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-2.5 border-t border-purple-200 flex justify-between items-center text-xs font-bold text-slate-500 shrink-0">
          <span>💡 Tip: Look for the &quot;🌀 Great to Tumble!&quot; badge on any gem card!</span>
          <span className="text-purple-700">Mohs 7 (Quartz, Amethyst, Jasper, Agate) = Best Tumbler Batch! 🏆</span>
        </div>

      </div>
    </div>
  )
}

export default RockTumblerModal
