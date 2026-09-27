// Start-up animation, after the one Steam Big Picture plays when it opens: the
// SKEAM mark assembles piece by piece, the crown drops on, the name comes up,
// and the store shows through. Drawn with SVG + CSS (see .intro in global.css),
// so there's no video file to download and it stays sharp at any size.
//
// Plays once per visit (tab session), and again for each new visitor in
// exhibition mode. Any click, key or tap skips it. ?intro in the address
// replays it on purpose.

import { useEffect, useState } from 'react'

const SEEN = 'skeam:intro'
const LENGTH_MS = 3300
const EVENT = 'skeam:intro'

function firstTimeThisVisit() {
  if (new URLSearchParams(location.search).has('intro')) return true
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false
  try {
    if (sessionStorage.getItem(SEEN)) return false
    sessionStorage.setItem(SEEN, '1')
    return true
  } catch {
    return false
  }
}

/** Exhibition mode calls this when it resets for the next visitor. */
export function playIntro() {
  window.dispatchEvent(new Event(EVENT))
}

/**
 * A soft whoosh and a rising chord, timed to the crown landing. Browsers only
 * allow sound after someone has clicked or typed on the page, so on a fresh
 * visit this stays silent instead of blaring out of a classroom laptop.
 */
function chime() {
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return
  const ctx = new AC()
  if (ctx.state !== 'running') {
    ctx.close()
    return
  }
  const out = ctx.createGain()
  out.gain.value = 0.18
  out.connect(ctx.destination)
  const t0 = ctx.currentTime

  // whoosh: noise swept through a band-pass filter
  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const d = noise.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = noise
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.Q.value = 1.2
  bp.frequency.setValueAtTime(300, t0 + 0.2)
  bp.frequency.exponentialRampToValueAtTime(3000, t0 + 1.15)
  const wg = ctx.createGain()
  wg.gain.setValueAtTime(0, t0 + 0.2)
  wg.gain.linearRampToValueAtTime(0.5, t0 + 0.9)
  wg.gain.linearRampToValueAtTime(0, t0 + 1.25)
  src.connect(bp).connect(wg).connect(out)
  src.start(t0 + 0.2)
  src.stop(t0 + 1.3)

  // chord: C major, rolled upward as the crown lands
  ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    const at = t0 + 1.3 + i * 0.07
    const o = ctx.createOscillator()
    o.type = i === 3 ? 'sine' : 'triangle'
    o.frequency.value = f
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(0.35, at + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, at + 1.8)
    o.connect(g).connect(out)
    o.start(at)
    o.stop(at + 1.9)
  })
  setTimeout(() => ctx.close(), 4000)
}

export function Intro() {
  const [run, setRun] = useState(() => (firstTimeThisVisit() ? 1 : 0))
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const again = () => {
      setLeaving(false)
      setRun((n) => n + 1)
    }
    window.addEventListener(EVENT, again)
    return () => window.removeEventListener(EVENT, again)
  }, [])

  useEffect(() => {
    if (!run) return
    chime()
    const t = setTimeout(() => setRun(0), LENGTH_MS)
    const skip = () => setLeaving(true)
    window.addEventListener('keydown', skip)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', skip)
    }
  }, [run])

  useEffect(() => {
    if (!leaving) return
    const t = setTimeout(() => {
      setRun(0)
      setLeaving(false)
    }, 250)
    return () => clearTimeout(t)
  }, [leaving])

  if (!run) return null
  return (
    <div key={run} className={`intro ${leaving ? 'leaving' : ''}`} onPointerDown={() => setLeaving(true)} aria-hidden="true">
      <div className="intro-glow" />
      <div className="intro-stage">
        <svg className="intro-mark" viewBox="-4 -6 72 72">
          <defs>
            <linearGradient id="intro-disc" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#1b2f4a" />
              <stop offset="1" stopColor="#0b1320" />
            </linearGradient>
            <linearGradient id="intro-gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffe082" />
              <stop offset="1" stopColor="#e0a526" />
            </linearGradient>
            <linearGradient id="intro-shine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#fff" stopOpacity="0.85" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <clipPath id="intro-clip">
              <circle cx="32" cy="36" r="26.2" />
              <path d="M17.5 17.5 L15 5.5 L24.5 11.5 L32 1.5 L39.5 11.5 L49 5.5 L46.5 17.5 Z" />
              <rect x="17" y="16" width="30" height="4.6" />
            </clipPath>
          </defs>
          <circle className="i-pulse" cx="32" cy="36" r="25" />
          <circle className="i-disc" cx="32" cy="36" r="25" fill="url(#intro-disc)" />
          <circle className="i-ring" cx="32" cy="36" r="25" />
          <path className="i-rod" d="M22.5 46.5 L37 33.5" />
          <g className="i-big">
            <circle cx="40" cy="31" r="7.6" fill="none" stroke="#fff" strokeWidth="3.4" />
            <circle cx="40" cy="31" r="3.1" fill="#fff" />
          </g>
          <circle className="i-small" cx="21.5" cy="47.5" r="4.6" fill="#0b1320" stroke="#fff" strokeWidth="2.6" />
          <g className="i-crown">
            <path d="M17.5 17.5 L15 5.5 L24.5 11.5 L32 1.5 L39.5 11.5 L49 5.5 L46.5 17.5 Z" fill="url(#intro-gold)" stroke="#7a5310" strokeWidth="1" strokeLinejoin="round" />
            <rect x="17" y="16" width="30" height="4.6" rx="1.2" fill="url(#intro-gold)" stroke="#7a5310" strokeWidth="1" />
            <circle className="i-gem" cx="15" cy="5.5" r="2" fill="#ffe082" />
            <circle className="i-gem" cx="32" cy="1.9" r="2" fill="#ffe082" />
            <circle className="i-gem" cx="49" cy="5.5" r="2" fill="#ffe082" />
            <circle cx="32" cy="18.3" r="1.3" fill="#c0392b" />
          </g>
          <g clipPath="url(#intro-clip)">
            <rect className="i-shine" x="-30" y="-6" width="22" height="72" fill="url(#intro-shine)" transform="skewX(-20)" />
          </g>
        </svg>
        <div className="intro-word">
          {'SKEAM'.split('').map((c, i) => (
            <span key={i} style={{ animationDelay: `${1.75 + i * 0.06}s` }}>
              {c}
            </span>
          ))}
        </div>
        <div className="intro-tag">
          KING
        </div>
      </div>
    </div>
  )
}
