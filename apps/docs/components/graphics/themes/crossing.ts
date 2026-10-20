/* Where the card is on its way down through the preset planes. The card sits
 * one gap above the top plane at pass 0 and half a gap below the bottom one
 * at pass 1, so it meets the planes in order, top first. It crosses a plane
 * over a band either side of it: through that band its new theme wipes over
 * the old, and past it the new theme is the card's. */

/** Half the depth of a plane's crossing band, in gaps. */
export const BAND = 0.3

/** The card's offset from its resting place at the top, in gaps (negative is down). */
export function liftAt(pass: number, planes: number): number {
  return -pass * (planes + 0.5)
}

/** The pass that leaves the card halfway past plane `k` (0 is the first it meets), or at the top for -1. */
export function passFor(k: number, planes: number): number {
  return k < 0 ? 0 : Math.min(1, (k + 1.5) / (planes + 0.5))
}

export interface Crossing {
  /** How many planes the card is fully through. */
  passed: number
  /** How far it is through the next one, 0 to 1 (0 while it hasn't reached its band). */
  wipe: number
}

export function crossingAt(pass: number, planes: number): Crossing {
  const lift = liftAt(pass, planes)
  let passed = 0
  while (passed < planes && lift <= -(passed + 1) - BAND) passed++
  if (passed === planes) return { passed, wipe: 0 }
  const at = -(passed + 1)
  const wipe = Math.min(1, Math.max(0, (at + BAND - lift) / (2 * BAND)))
  return { passed, wipe }
}
