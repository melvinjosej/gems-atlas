import { useState, useMemo } from 'react'
import { gemsData } from '../data/gemsData'
import { soundFX } from '../utils/soundEffects'

function GemExplorerModal({ isOpen, onClose, onSelectCountry, ownedGems = [] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('country') // 'country' | 'mohs-desc' | 'mohs-asc' | 'name'

  // Flatten all gems with their country info
  const allGemItems = useMemo(() => {
    const items = []
    gemsData.forEach(country => {
      (country.gems || []).forEach((gem, idx) => {
        items.push({
          id: `${country.id}-${idx}`,
          countryId: country.id,
          countryName: country.countryName,
          capital: country.capital,
          flagEmoji: country.flagEmoji,
          gem
        })
      })
    })
    return items
  }, [])

  // Filter and sort gems
  const filteredGems = useMemo(() => {
    return allGemItems
      .filter(item => {
        if (selectedCategory === 'natgeo' && !item.gem.inNatGeoKit) return false
        if (selectedCategory === 'tumbler' && item.gem.tumblerStatus !== 'great') return false
        if (selectedCategory === 'precious' && item.gem.mohs < 7.5) return false
        if (selectedCategory === 'owned' && !ownedGems.includes(item.id)) return false

        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase().trim()
          const matchCountry = item.countryName.toLowerCase().includes(q)
          const matchCapital = item.capital.toLowerCase().includes(q)
          const matchName = item.gem.name.toLowerCase().includes(q)
          const matchType = item.gem.type.toLowerCase().includes(q)
          const matchColor = (item.gem.colorBadge || '').toLowerCase().includes(q)
          return matchCountry || matchCapital || matchName || matchType || matchColor
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'mohs-desc') return b.gem.mohs - a.gem.mohs
        if (sortBy === 'mohs-asc') return a.gem.mohs - b.gem.mohs
        if (sortBy === 'name') return a.gem.name.localeCompare(b.gem.name)
        return a.countryName.localeCompare(b.countryName)
      })
  }, [allGemItems, selectedCategory, searchQuery, sortBy, ownedGems])

  if (!isOpen) return null

  const natGeoCount = allGemItems.filter(i => i.gem.inNatGeoKit).length
  const tumblerCount = allGemItems.filter(i => i.gem.tumblerStatus === 'great').length
  const preciousCount = allGemItems.filter(i => i.gem.mohs >= 7.5).length

  const categories = [
    { id: 'all', label: '🌟 All Gems', count: allGemItems.length },
    { id: 'natgeo', label: '⛏️ In NatGeo Kit', count: natGeoCount },
    { id: 'tumbler', label: '🌀 Best for Rock Tumbler', count: tumblerCount },
    { id: 'precious', label: '👑 Super Hard (Mohs 7.5–10)', count: preciousCount },
    { id: 'owned', label: '✅ In My Real-Life Box', count: ownedGems.length }
  ]

  const handleSelectItem = (countryId) => {
    soundFX.playCrystalChime()
    onSelectCountry(countryId)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 font-kids select-none">
      <div className="bg-slate-50 w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl border-4 border-purple-400 flex flex-col overflow-hidden">
        
        {/* 💎 MODAL HEADER */}
        <div className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center space-x-3">
            <span className="text-4xl">🔍</span>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-wide drop-shadow-sm">
                World Gem &amp; Crystal Encyclopedia
              </h2>
              <p className="text-xs sm:text-sm text-purple-100 font-medium">
                Explore {allGemItems.length} real gems &amp; crystals across {gemsData.length} countries! 🌍💎
              </p>
            </div>
          </div>

          <button
            onClick={() => { soundFX.playClick(); onClose(); }}
            className="bg-rose-500 hover:bg-rose-600 active:scale-90 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold border-2 border-white shadow-md transition cursor-pointer"
            title="Close Explorer"
          >
            ✕
          </button>
        </div>

        {/* 🎛️ SEARCH & FILTER CONTROLS BAR */}
        <div className="p-4 bg-white border-b-2 border-slate-200 flex flex-col gap-3 shrink-0">
          
          {/* Search Input + Sort Selector */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl">🔎</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search gem (e.g. Amethyst, Tiger's Eye, Pyrite, Diamond) or country..."
                className="w-full pl-11 pr-10 py-2.5 bg-slate-100 border-2 border-slate-300 focus:border-purple-500 focus:bg-white rounded-2xl text-slate-800 font-bold text-base focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-sm font-bold text-slate-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => { soundFX.playClick(); setSortBy(e.target.value); }}
                className="bg-slate-100 border-2 border-slate-300 rounded-2xl px-3.5 py-2.5 font-bold text-slate-700 text-sm cursor-pointer focus:outline-none focus:border-purple-500"
              >
                <option value="country">🌍 Country Name</option>
                <option value="mohs-desc">💎 Hardest First (Mohs 10 ➔ 2)</option>
                <option value="mohs-asc">🪶 Softest First (Mohs 2 ➔ 10)</option>
                <option value="name">🔤 Gem Name (A–Z)</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => {
              const active = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => { soundFX.playClick(); setSelectedCategory(cat.id); }}
                  className={`px-4 py-1.5 rounded-full font-bold text-sm whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 ${
                    active
                      ? 'bg-amber-400 text-amber-950 shadow-sm border-2 border-amber-500 scale-105'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-2 border-transparent'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className="bg-white/80 text-amber-900 text-xs px-2 py-0.5 rounded-full font-black">
                    {cat.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 💎 GEM CARDS GRID */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-100/70">
          {filteredGems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <span className="text-6xl mb-3">🧐</span>
              <h3 className="text-2xl font-bold text-slate-700">No gems matched your filter!</h3>
              <p className="text-slate-500 mt-1">Try typing another gem name or selecting &quot;All Gems&quot;.</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="mt-4 bg-purple-600 text-white font-bold px-6 py-2.5 rounded-full shadow-md hover:bg-purple-700 cursor-pointer"
              >
                Show All Gems
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredGems.map((item) => {
                const isOwned = ownedGems.includes(item.id)
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item.countryId)}
                    className="bg-white rounded-3xl shadow-md hover:shadow-xl border-4 border-white hover:border-purple-400 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer group hover:-translate-y-1"
                  >
                    {/* Thumbnail image */}
                    <div className="h-44 bg-slate-900 relative overflow-hidden">
                      <img
                        src={item.gem.photoUrl}
                        alt={item.gem.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-black text-slate-800 shadow flex items-center space-x-1.5">
                        <span>{item.flagEmoji}</span>
                        <span>{item.countryName}</span>
                      </div>

                      <div className="absolute top-2.5 right-2.5 bg-purple-600 text-white px-2.5 py-0.5 rounded-full text-xs font-black shadow flex items-center space-x-1 border border-white">
                        <span>💎</span>
                        <span>Mohs {item.gem.mohs}</span>
                      </div>

                      {item.gem.inNatGeoKit && (
                        <div className="absolute bottom-2.5 left-2.5 bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full text-xs font-black shadow border border-white">
                          ⛏️ NatGeo Kit
                        </div>
                      )}

                      {isOwned && (
                        <div className="absolute bottom-2.5 right-2.5 bg-emerald-500 text-white px-2.5 py-0.5 rounded-full text-xs font-black shadow border border-white">
                          ✅ In My Box
                        </div>
                      )}
                    </div>

                    {/* Card content */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
                          <span>⭐ Capital: {item.capital}</span>
                          <span>{item.gem.colorBadge}</span>
                        </div>
                        <h4 className="text-lg font-black text-slate-800 leading-snug line-clamp-1">
                          {item.gem.name}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-1">
                          {item.gem.type}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm font-bold text-purple-600 group-hover:text-purple-800">
                        <span>
                          {item.gem.tumblerStatus === 'great' ? '🌀 Great for Tumbling!' : '📍 Fly to Country on Map'}
                        </span>
                        <span className="group-hover:translate-x-1 transition-transform">➔</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default GemExplorerModal
