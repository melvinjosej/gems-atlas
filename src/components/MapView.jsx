import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import worldMapRaw from '../assets/world_map.svg?raw'
import { REGION_PRESETS, gemsData } from '../data/gemsData'
import { soundFX } from '../utils/soundEffects'

function MapView({ selectedCountryId, onSelectCountry }) {
  const [svgRaw] = useState(() => worldMapRaw || '')
  const svgHtml = useMemo(() => ({ __html: svgRaw }), [svgRaw])
  const [loading] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [activeRegion, setActiveRegion] = useState('world')
  const [mapFilter, setMapFilter] = useState('all') // 'all' | 'natgeo' | 'tumbler'
  const [isDragging, setIsDragging] = useState(false)
  const [unmappedToast, setUnmappedToast] = useState(null)
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0, hasMoved: false })

  const containerRef = useRef(null)
  const svgWrapperRef = useRef(null)

  // Compute country code lists for dynamic map highlighting filters
  const filterSelectors = useMemo(() => {
    const natgeoCodes = gemsData
      .filter(c => c.gems.some(g => g.inNatGeoKit))
      .map(c => c.id.toLowerCase())
    const tumblerCodes = gemsData
      .filter(c => c.gems.some(g => g.tumblerStatus === 'great'))
      .map(c => c.id.toLowerCase())
    const allCodes = gemsData.map(c => c.id.toLowerCase())
    return { allCodes, natgeoCodes, tumblerCodes }
  }, [])

  // Highlight selected country and auto-focus (zoom & pan) smoothly to it
  useEffect(() => {
    if (!containerRef.current || !svgRaw) return

    const activePaths = containerRef.current.querySelectorAll('.country-selected')
    activePaths.forEach(el => el.classList.remove('country-selected'))

    const rafId = requestAnimationFrame(() => {
      if (!containerRef.current) return

      if (selectedCountryId) {
        const codeLower = selectedCountryId.toLowerCase()
        const targetElements = containerRef.current.querySelectorAll(`.${codeLower}, #${codeLower}`)

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

        if (targetElements.length > 0) {
          targetElements.forEach(el => {
            el.classList.add('country-selected')
            if (el.tagName.toLowerCase() === 'g') {
              const childPaths = el.querySelectorAll('path')
              childPaths.forEach(path => path.classList.add('country-selected'))
            }

            try {
              const bbox = el.getBBox()
              if (bbox && bbox.width > 0 && bbox.height > 0) {
                minX = Math.min(minX, bbox.x)
                minY = Math.min(minY, bbox.y)
                maxX = Math.max(maxX, bbox.x + bbox.width)
                maxY = Math.max(maxY, bbox.y + bbox.height)
              }
            } catch {
              // Ignore getBBox errors on hidden/empty nodes
            }
          })
        }

        if (minX < Infinity && maxX > -Infinity) {
          const W = 2752.766
          const H = 1537.631
          const cx = (minX + maxX) / 2
          const cy = (minY + maxY) / 2
          const boxW = Math.max(maxX - minX, 30)
          const boxH = Math.max(maxY - minY, 30)

          const idealZoom = Math.min(W / (boxW * 2.8), H / (boxH * 2.8))
          const targetZoom = Math.min(Math.max(idealZoom, 1.8), 5.5)

          const normX = ((W / 2 - cx) / W) * 100
          const normY = ((H / 2 - cy) / H) * 100

          setZoom(targetZoom)
          setPan({ x: normX, y: normY })
          setActiveRegion('custom')
        }
      } else {
        setZoom(1)
        setPan({ x: 0, y: 0 })
        setActiveRegion('world')
      }
    })

    return () => cancelAnimationFrame(rafId)
  }, [selectedCountryId, svgRaw])

  // Region quick-jump handler
  const handleSelectRegion = useCallback((regionPreset) => {
    soundFX.playClick()
    setActiveRegion(regionPreset.id)
    setZoom(regionPreset.zoom)
    setPan({ x: regionPreset.x, y: regionPreset.y })
    if (regionPreset.id === 'world' && selectedCountryId) {
      onSelectCountry(null)
    }
  }, [selectedCountryId, onSelectCountry])

  // Zoom button controls
  const handleZoomIn = () => {
    soundFX.playClick()
    setZoom(prev => Math.min(prev * 1.4, 7))
    setActiveRegion('custom')
  }

  const handleZoomOut = () => {
    soundFX.playClick()
    setZoom(prev => {
      const next = Math.max(prev / 1.4, 1)
      if (next === 1) setPan({ x: 0, y: 0 })
      return next
    })
    setActiveRegion('custom')
  }

  const handleResetView = useCallback(() => {
    soundFX.playClick()
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setActiveRegion('world')
    if (selectedCountryId) {
      onSelectCountry(null)
    }
  }, [selectedCountryId, onSelectCountry])

  // Press Escape to reset map zoom/pan and exit country view back to full map
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && (selectedCountryId || zoom > 1 || activeRegion !== 'world')) {
        handleResetView()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedCountryId, zoom, activeRegion, handleResetView])

  // Mouse / Touch Drag to Pan when zoomed in
  const handlePointerDown = (e) => {
    if (zoom <= 1) return
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
      hasMoved: false
    }
  }

  const handlePointerMove = (e) => {
    if (!isDragging || zoom <= 1) return
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      dragStartRef.current.hasMoved = true
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const deltaXPercent = (dx / rect.width) * 100 / zoom
      const deltaYPercent = (dy / rect.height) * 100 / zoom

      const maxPan = 45
      setPan({
        x: Math.min(Math.max(dragStartRef.current.panX + deltaXPercent, -maxPan), maxPan),
        y: Math.min(Math.max(dragStartRef.current.panY + deltaYPercent, -maxPan), maxPan)
      })
    }
  }

  const handlePointerUp = () => {
    setIsDragging(false)
  }

  // Fast touch-friendly event delegation handler for country selection
  const handleMapClick = (e) => {
    if (dragStartRef.current.hasMoved) {
      dragStartRef.current.hasMoved = false
      return
    }

    // Walk up the DOM tree from e.target to svg to collect all class and id tokens
    const tokens = []
    let node = e.target
    while (node && node !== e.currentTarget && node.tagName?.toLowerCase() !== 'svg') {
      if (node.getAttribute) {
        const cls = node.getAttribute('class') || ''
        const id = (node.getAttribute('id') || '').replace(/[-.]+$/, '')
        if (cls) tokens.push(...cls.toLowerCase().split(/\s+/))
        if (id) tokens.push(...id.toLowerCase().split(/\s+/))
      }
      node = node.parentElement
    }

    const ignoredTokens = new Set(['land', 'circle', 'coast', 'ocean', 'lake', 'sub', 'xx'])
    const countryCode = tokens.find(token =>
      !ignoredTokens.has(token) &&
      /^[a-z]{2}$/.test(token)
    )

    if (countryCode) {
      const upperCode = countryCode.toUpperCase()
      const hasGems = gemsData.some(c => c.id === upperCode)
      if (hasGems) {
        setUnmappedToast(null)
        soundFX.playPickaxe()
        onSelectCountry(upperCode)
      } else {
        soundFX.playClick()
        setUnmappedToast(upperCode)
      }
    } else if (tokens.includes('ocean') || tokens.includes('lake')) {
      setUnmappedToast(null)
      onSelectCountry(null)
    }
  }

  // Build dynamic CSS for map filter modes ('all', 'natgeo', or 'tumbler')
  const dynamicFilterCss = useMemo(() => {
    const allSel = filterSelectors.allCodes
      .flatMap(c => [`svg#svg1926 .${c}`, `svg#svg1926 #${c}`, `svg#svg1926 #${c} path`])
      .join(', ')

    let css = `
      ${allSel} {
        fill: #fde047 !important;
        stroke: #d97706 !important;
        stroke-width: 1.0px !important;
      }
    `
    if (mapFilter === 'natgeo') {
      const nonNatGeo = filterSelectors.allCodes.filter(c => !filterSelectors.natgeoCodes.includes(c))
      const dimSel = nonNatGeo.flatMap(c => [`svg#svg1926 .${c}`, `svg#svg1926 #${c}`, `svg#svg1926 #${c} path`]).join(', ')
      const activeSel = filterSelectors.natgeoCodes.flatMap(c => [`svg#svg1926 .${c}`, `svg#svg1926 #${c}`, `svg#svg1926 #${c} path`]).join(', ')
      css += `
        ${dimSel} { fill: #fef9c3 !important; stroke: #cbd5e1 !important; opacity: 0.65; }
        ${activeSel} { fill: #f59e0b !important; stroke: #b45309 !important; stroke-width: 1.2px !important; }
      `
    } else if (mapFilter === 'tumbler') {
      const nonTumbler = filterSelectors.allCodes.filter(c => !filterSelectors.tumblerCodes.includes(c))
      const dimSel = nonTumbler.flatMap(c => [`svg#svg1926 .${c}`, `svg#svg1926 #${c}`, `svg#svg1926 #${c} path`]).join(', ')
      const activeSel = filterSelectors.tumblerCodes.flatMap(c => [`svg#svg1926 .${c}`, `svg#svg1926 #${c}`, `svg#svg1926 #${c} path`]).join(', ')
      css += `
        ${dimSel} { fill: #fef9c3 !important; stroke: #cbd5e1 !important; opacity: 0.65; }
        ${activeSel} { fill: #ec4899 !important; stroke: #9d174d !important; stroke-width: 1.2px !important; }
      `
    }

    if (selectedCountryId) {
      const code = selectedCountryId.toLowerCase()
      css += `
        svg#svg1926 .${code},
        svg#svg1926 #${code},
        svg#svg1926 .${code} path,
        svg#svg1926 #${code} path {
          fill: #a855f7 !important;
          stroke: #581c87 !important;
          stroke-width: 1.8px !important;
          opacity: 1 !important;
        }
      `
    }
    return css
  }, [mapFilter, selectedCountryId, filterSelectors])

  if (loading) {
    return (
      <div className="w-full h-full bg-sky-100 flex flex-col items-center justify-center">
        <div className="text-6xl mb-4 animate-bounce">💎</div>
        <div className="text-2xl font-bold text-purple-700 font-kids animate-pulse">
          Unfolding the World Treasure Map of Gems... ⛏️✨
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleMapClick}
      className={`w-full h-full overflow-hidden relative bg-[#e0f2fe] flex items-center justify-center select-none ${
        zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-pointer'
      }`}
    >
      {dynamicFilterCss && <style>{dynamicFilterCss}</style>}

      {/* ⛏️ Toast Banner when clicking a small country without a mapped gem mine */}
      {unmappedToast && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-16 left-1/2 -translate-x-1/2 bg-purple-900/95 text-white px-4 py-2 rounded-full shadow-xl border-2 border-amber-300 z-30 flex items-center space-x-2 text-xs sm:text-sm font-extrabold"
        >
          <span>⛏️ Tap any <span className="text-amber-300">Golden Country</span> to mine gems!</span>
          <button
            onClick={() => {
              soundFX.playPickaxe()
              setUnmappedToast(null)
              const randomCountry = gemsData[Math.floor(Math.random() * gemsData.length)]
              onSelectCountry(randomCountry.id)
            }}
            className="bg-amber-400 hover:bg-amber-300 text-amber-950 px-3 py-1 rounded-full font-black cursor-pointer"
          >
            🎲 Dig Random Mine!
          </button>
          <button
            onClick={() => setUnmappedToast(null)}
            className="text-purple-200 hover:text-white px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 🗺️ Transformable SVG Wrapper */}
      <div
        ref={svgWrapperRef}
        className="w-full h-full flex items-center justify-center origin-center"
        style={{
          transform: `scale(${zoom}) translate(${pan.x}%, ${pan.y}%)`,
          transition: isDragging ? 'none' : 'transform 650ms cubic-bezier(0.22, 1, 0.36, 1)'
        }}
        dangerouslySetInnerHTML={svgHtml}
      />

      {/* 🔍 FLOATING TOP-LEFT ZOOM CONTROLS */}
      <div className="absolute top-4 left-4 flex flex-col space-y-2 z-20">
        <button
          id="map-zoom-in-btn"
          onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
          className="w-11 h-11 bg-white/90 hover:bg-white active:scale-90 text-slate-800 rounded-2xl shadow-lg border-2 border-purple-400 flex items-center justify-center text-2xl font-black cursor-pointer transition"
          title="Zoom In ➕"
        >
          ➕
        </button>
        <button
          id="map-zoom-out-btn"
          onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
          disabled={zoom <= 1}
          className={`w-11 h-11 rounded-2xl shadow-lg border-2 flex items-center justify-center text-2xl font-black transition ${
            zoom <= 1
              ? 'bg-slate-100/70 border-slate-300 text-slate-300 cursor-not-allowed'
              : 'bg-white/90 hover:bg-white active:scale-90 text-slate-800 border-purple-400 cursor-pointer'
          }`}
          title="Zoom Out ➖"
        >
          ➖
        </button>
        {zoom > 1 && (
          <button
            id="map-reset-zoom-btn"
            onClick={(e) => { e.stopPropagation(); handleResetView(); }}
            className="w-11 h-11 bg-amber-400 hover:bg-amber-300 active:scale-90 text-amber-950 rounded-2xl shadow-lg border-2 border-white flex items-center justify-center text-xl font-black cursor-pointer transition animate-bounce-slow"
            title="Reset Whole World Map 🌍"
          >
            🌍
          </button>
        )}
      </div>

      {/* ⛏️ FLOATING TOP-RIGHT MAP FILTER PILLS (All Gems vs NatGeo Kit vs Tumbler Gems) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-3 right-3 bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-lg border-2 border-purple-300 flex items-center space-x-1 z-20"
      >
        <button
          id="filter-map-all-btn"
          onClick={() => { soundFX.playClick(); setMapFilter('all'); }}
          className={`px-3 py-1 rounded-full text-xs font-extrabold transition cursor-pointer ${
            mapFilter === 'all'
              ? 'bg-amber-400 text-amber-950 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          🌍 All ({filterSelectors.allCodes.length})
        </button>
        <button
          id="filter-map-natgeo-btn"
          onClick={() => { soundFX.playClick(); setMapFilter('natgeo'); }}
          className={`px-3 py-1 rounded-full text-xs font-extrabold transition cursor-pointer ${
            mapFilter === 'natgeo'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Highlight countries with stones in the National Geographic Gem Kit!"
        >
          ⛏️ NatGeo Kit ({filterSelectors.natgeoCodes.length})
        </button>
        <button
          id="filter-map-tumbler-btn"
          onClick={() => { soundFX.playClick(); setMapFilter('tumbler'); }}
          className={`px-3 py-1 rounded-full text-xs font-extrabold transition cursor-pointer ${
            mapFilter === 'tumbler'
              ? 'bg-pink-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Highlight countries with Mohs 7 stones that polish great in the Rock Tumbler!"
        >
          🌀 Tumbler Best ({filterSelectors.tumblerCodes.length})
        </button>
      </div>

      {/* 🧭 FLOATING BOTTOM REGION QUICK-JUMP BAR */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-xl border-2 border-purple-300 flex items-center space-x-1.5 z-20 max-w-[95%] overflow-x-auto no-scrollbar"
      >
        <span className="text-xs font-extrabold text-purple-900 px-2 hidden sm:inline uppercase tracking-wider">
          Jump To:
        </span>
        {REGION_PRESETS.map((preset) => {
          const isActive = activeRegion === preset.id
          return (
            <button
              key={preset.id}
              onClick={() => handleSelectRegion(preset)}
              className={`px-3 py-1 rounded-full text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-purple-600 text-white shadow-sm scale-105'
                  : 'bg-slate-100 hover:bg-purple-50 text-slate-700'
              }`}
            >
              {preset.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MapView
