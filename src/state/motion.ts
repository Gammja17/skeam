// "애니메이션 끄기" in the account menu: turns off the start-up animation and
// every transition (page changes, game launch/exit, overlay, pop-ups) on this
// device. Kept apart from skeam:v1 so exhibition-mode resets and logging out
// leave it alone. CSS reads the `no-motion` class on <html>; people whose
// system asks for reduced motion get the same through a media query.

import { useSyncExternalStore } from 'react'

const KEY = 'skeam:motion'
const listeners = new Set<() => void>()

function read() {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

let on = read()
document.documentElement.classList.toggle('no-motion', !on)

/** Animations are on for this device (setting on, and the system doesn't ask for less motion). */
export function motionOn() {
  return on && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

export function setMotion(v: boolean) {
  on = v
  try {
    if (v) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, 'off')
  } catch {
    /* ignore */
  }
  document.documentElement.classList.toggle('no-motion', !v)
  listeners.forEach((l) => l())
}

/** The menu setting itself (not the system preference). */
export function useMotionSetting() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => void listeners.delete(l)
    },
    () => on,
  )
}
