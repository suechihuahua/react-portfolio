import { useEffect, useRef, useState } from 'react'
import { person } from '../content/site.js'
import { useConsoleStore } from '../store/useConsoleStore.js'
import {
  DEFAULT_VARIANT,
  RANGES,
  VARIANTS,
  VARIANT_NAMES,
  clamp,
  hexToRgb,
  resolveConfig,
} from '../lib/crtPresets.js'
import { SCREEN, bootState, paintScreen } from '../lib/bootScreen.js'
import { createCrtRenderer } from '../lib/crtRenderer.js'

const STORE_KEY = 'nf:crt'
const MAX_DPR = 2

const TEXT = {
  title: person.name.toUpperCase(),
  subtitle: `${person.role} · ${person.location}`.toUpperCase(),
  prompt: 'CLICK ANYWHERE TO ENTER',
}

const SLIDERS = [
  { key: 'speed', label: 'CRT speed', step: 0.05 },
  { key: 'motion', label: 'Motion', step: 0.05 },
  { key: 'hue', label: 'Hue', step: 1 },
  { key: 'saturation', label: 'Saturation', step: 0.05 },
  { key: 'brightness', label: 'Brightness', step: 0.05 },
  { key: 'opacity', label: 'Opacity', step: 0.05 },
  { key: 'bootSpeed', label: 'Boot speed', step: 0.05 },
]

function readStored() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeStored(value) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(value))
  } catch {
    /* storage blocked */
  }
}

// The loading page: a Canvas 2D screen composited through a raw WebGL CRT
// shader. Runs on every load -- it is not remembered between refreshes.
// Click anywhere to enter the portfolio.
export default function CrtBoot({ onEnter }) {
  const glCanvasRef = useRef(null)
  const screenCanvasRef = useRef(null)
  const reducedMotion = useConsoleStore((s) => s.prefersReducedMotion)

  const [variant, setVariant] = useState(() => {
    const saved = readStored().variant
    return VARIANTS[saved] ? saved : DEFAULT_VARIANT
  })
  const [overrides, setOverrides] = useState(() => readStored().overrides ?? {})
  const [panelOpen, setPanelOpen] = useState(false)
  const [failed, setFailed] = useState(false)

  const config = resolveConfig(variant, overrides)
  // The render loop reads the live config without re-subscribing to it.
  const configRef = useRef(config)
  useEffect(() => {
    configRef.current = config
  })

  // finishBoot is idempotent, so the click and the key press can both land.
  const enter = onEnter

  useEffect(() => {
    writeStored({ variant, overrides })
  }, [variant, overrides])

  useEffect(() => {
    const glCanvas = glCanvasRef.current
    const screenCanvas = screenCanvasRef.current
    if (!glCanvas || !screenCanvas) return undefined

    screenCanvas.width = SCREEN.width
    screenCanvas.height = SCREEN.height
    const ctx = screenCanvas.getContext('2d')
    const renderer = createCrtRenderer(glCanvas, screenCanvas)
    if (!renderer) {
      setFailed(true)
      if (ctx) paintScreen(ctx, bootState(99), configRef.current, TEXT)
      return undefined
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      renderer.resize(
        Math.max(1, Math.round(window.innerWidth * dpr)),
        Math.max(1, Math.round(window.innerHeight * dpr)),
      )
    }
    resize()
    window.addEventListener('resize', resize)

    let frame = 0
    let start = 0
    const loop = (now) => {
      if (!start) start = now
      const seconds = (now - start) / 1000
      const current = configRef.current
      // Reduced motion: the finished screen, held still.
      const state = reducedMotion ? bootState(99) : bootState(seconds, current.bootSpeed)
      if (ctx) paintScreen(ctx, state, current, TEXT)
      renderer.render(reducedMotion ? 0 : seconds, current, hexToRgb(current.ink))
      frame = window.requestAnimationFrame(loop)
    }
    frame = window.requestAnimationFrame(loop)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      renderer.dispose()
    }
  }, [reducedMotion])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Tab' || e.key === 'Shift') return
      enter()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enter])

  const setOverride = (key, value) =>
    setOverrides((o) => ({ ...o, [key]: clamp(Number(value), RANGES[key]) }))

  return (
    <div className="crt" onClick={enter} role="presentation">
      <canvas className="crt__gl" ref={glCanvasRef} aria-hidden="true" />
      <canvas
        className={`crt__screen${failed ? ' crt__screen--fallback' : ''}`}
        ref={screenCanvasRef}
        aria-hidden="true"
      />

      {/* The panel itself draws the prompt; this is the keyboard-reachable
          equivalent, visible only when focused. */}
      <button type="button" className="crt__enter" onClick={enter}>
        Enter the portfolio
      </button>

      <div className="crt__panel" onClick={(e) => e.stopPropagation()} role="presentation">
        <button
          type="button"
          className="crt__toggle"
          onClick={() => setPanelOpen((open) => !open)}
          aria-expanded={panelOpen}
        >
          {panelOpen ? 'close' : 'CRT'}
        </button>

        {panelOpen && (
          <div className="crt__controls">
            <p className="crt__group">Variant</p>
            <div className="crt__variants">
              {VARIANT_NAMES.map((name) => (
                <button
                  type="button"
                  key={name}
                  className={`crt__variant${name === variant ? ' crt__variant--on' : ''}`}
                  onClick={() => {
                    setVariant(name)
                    setOverrides({})
                  }}
                  title={VARIANTS[name].blurb}
                >
                  {VARIANTS[name].label}
                </button>
              ))}
            </div>

            <p className="crt__group">Live controls</p>
            {SLIDERS.map(({ key, label, step }) => (
              <label className="crt__slider" key={key}>
                <span className="crt__slider-name">{label}</span>
                <input
                  type="range"
                  min={RANGES[key][0]}
                  max={RANGES[key][1]}
                  step={step}
                  value={config[key]}
                  onChange={(e) => setOverride(key, e.target.value)}
                />
                <span className="crt__slider-value">{Number(config[key]).toFixed(2)}</span>
              </label>
            ))}

            <button type="button" className="crt__reset" onClick={() => setOverrides({})}>
              Reset to {VARIANTS[variant].label}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
