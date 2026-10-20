/* Low-power rule for EVERY entrance effect (./entrances.ts wraps each `run` with it, so no engine is fetched either)
 * and for the homepage intro (components/landing/hero-build.ts): on a device that can't hold 60 fps the demo just
 * shows, plainly. An effect is skipped when any of these holds:
 *   - the reader asked to save data (`navigator.connection.saveData`);
 *   - the connection is `slow-2g` or `2g`;
 *   - it reports few cores AND little memory: `hardwareConcurrency <= 4` and `deviceMemory <= 4` (both must be reported,
 *     so Safari and Firefox, which hide the memory, are never judged by their cores alone);
 *   - the page itself measures slow: 10 animation frames, taken once the page is idle, average over 24 ms.
 * The first three are synchronous, so they never delay the demo; the frame probe runs once a page. HERO_POWER_SCRIPT is
 * the same synchronous rule, as text, for the inline script that decides the intro before first paint. */

export interface PowerSignals {
  connection?: { saveData?: boolean; effectiveType?: string }
  hardwareConcurrency?: number
  deviceMemory?: number
}

/** The synchronous half of the rule, on `nav` (the real navigator by default). */
export function lowPower(nav: PowerSignals = navigator as PowerSignals): boolean {
  const { connection, hardwareConcurrency, deviceMemory } = nav
  if (connection?.saveData) return true
  if (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') return true
  return hardwareConcurrency !== undefined && deviceMemory !== undefined && hardwareConcurrency <= 4 && deviceMemory <= 4
}

/** The same rule as an expression for an inline script (HERO_BUILD_SCRIPT): true when this device is low-power. */
export const LOW_POWER_EXPR =
  "(function(n,c){return !!(c&&(c.saveData||c.effectiveType==='slow-2g'||c.effectiveType==='2g'))||(n.hardwareConcurrency<=4&&n.deviceMemory<=4)})(navigator,navigator.connection)"

const SETTLE = 2
const SAMPLE = 10
export const SLOW_FRAME_MS = 24

let probe: Promise<boolean> | undefined

/** Whether the page's frames are slow (average over SLOW_FRAME_MS). Measured once, once the page is idle (so a
 *  hydrating page isn't judged on its own load); a hidden tab or a frame that stalls over 250 ms (a tab switch) says
 *  nothing, so it answers false. <Generated> calls it on mount, so the answer is usually in before the demo is seen. */
export function slowFrames(): Promise<boolean> {
  return (probe ??= new Promise<boolean>((resolve) => {
    if (typeof requestAnimationFrame !== 'function' || document.hidden) return resolve(false)
    sampleWhenIdle(resolve)
  }))
}

function sampleWhenIdle(resolve: (slow: boolean) => void) {
  const sample = () => {
    const gaps: number[] = []
    let last = 0
    let n = 0
    const tick = (now: number) => {
      if (document.hidden) return resolve(false)
      if (last) {
        const gap = now - last
        if (gap > 250) return resolve(false)
        if (++n > SETTLE) gaps.push(gap)
      }
      last = now
      if (gaps.length < SAMPLE) requestAnimationFrame(tick)
      else resolve(gaps.reduce((a, b) => a + b, 0) / gaps.length > SLOW_FRAME_MS)
    }
    requestAnimationFrame(tick)
  }
  if (typeof requestIdleCallback === 'function') requestIdleCallback(sample, { timeout: 600 })
  else setTimeout(sample, 100)
}

/** Whether an effect is skipped on this page: the synchronous rule first, then the frame probe. */
export async function skipsEffects(nav?: PowerSignals): Promise<boolean> {
  return lowPower(nav) || (await slowFrames())
}

/** For tests: forget the probe. */
export function resetProbe() {
  probe = undefined
}
