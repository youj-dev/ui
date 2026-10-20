/* The rings that carry the sound. Speaking sends pulses out from the orb, one
 * on each rise in the level and a steady one through a held sound; listening
 * draws them in from the edge to the orb, on a slower beat. Every length here
 * is in canvas units (0 the center, 1 the edge); every time in seconds, from
 * the motion tokens. */

import type { OrbRing } from './voice-orb-render'

interface Pulse {
  age: number
  life: number
  strength: number
  inward: boolean
}

export interface RingTiming {
  /** Shortest gap between two pulses: the fast token. */
  gap: number
  /** A pulse's life: twice the deliberate token. */
  life: number
}

/** Edge of the rings' room: just inside the canvas. */
const OUTER = 0.97
const MAX = 4

export function createRings() {
  const pulses: Pulse[] = []
  let since = Infinity
  let slow = 0

  return {
    /** Ages the pulses and spawns new ones. `direction` is 1 out (speaking), -1 in (listening), 0 none. */
    step(dt: number, level: number, weight: number, direction: number, timing: RingTiming) {
      since += dt
      for (const p of pulses) p.age += dt
      while (pulses.length && pulses[0]!.age >= pulses[0]!.life) pulses.shift()
      const rise = level - slow
      slow += (level - slow) * (1 - Math.exp(-dt / Math.max(timing.life, 1e-3)))
      if (!direction || weight < 0.05 || level < 0.06) return
      const inward = direction < 0
      const onset = !inward && rise > 0.08 && since > timing.gap
      const beat = since > (inward ? timing.life * 0.8 : timing.life * 0.55)
      if (!onset && !beat) return
      since = 0
      pulses.push({ age: 0, life: inward ? timing.life * 0.85 : timing.life, strength: Math.min(1, level * 1.4) * weight, inward })
      if (pulses.length > MAX) pulses.shift()
    },
    /** The rings to draw around an orb of radius `radius`. */
    rings(radius: number, low: number): OrbRing[] {
      return pulses.map(({ age, life, strength, inward }) => {
        const t = Math.min(1, age / life)
        if (inward) {
          const e = t * t * (3 - 2 * t)
          return { radius: OUTER - (OUTER - radius) * e, alpha: strength * Math.sin(Math.PI * t) * 0.8, width: 0.02 + 0.015 * (1 - t) }
        }
        const e = 1 - (1 - t) ** 3
        return { radius: radius + (OUTER - radius) * e, alpha: strength * (1 - t) ** 1.6 * Math.min(1, t / 0.06), width: 0.012 + 0.04 * t * (0.5 + low) }
      })
    },
    clear() {
      pulses.length = 0
      since = Infinity
    },
  }
}
