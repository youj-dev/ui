/* The motion budget: whether this device gets the full treatment ('high') or
 * the light one ('low'). YoujProvider's `quality` prop forces a tier;
 * 'auto' (the default) resolves it here, once per page:
 *
 *   1. Hints. Data Saver (navigator.connection.saveData, the client side of
 *      the Save-Data header), prefers-reduced-data, <= 2 logical cores or
 *      <= 2 GB of device memory mean 'low' straight away.
 *   2. Otherwise a short probe, once the page is idle: a fixed slice of
 *      animation-like JS timed over a few frames. Its median, and the median
 *      frame interval around it, decide. A device whose main thread is over
 *      PROBE_LOW_MS for the slice (about 2.5x an M2-class core), or that can't
 *      keep frames under FRAME_LOW_MS while nearly idle, is 'low'.
 *
 * The result is cached for the session so later pages start on the right
 * tier. The server and the hydration render always see 'high'; hydrated
 * components re-render with the real tier straight after, the same way
 * useYouj treats the OS reduced-motion setting. Capable hardware stays on
 * 'high', so nothing about it changes. */

export type QualitySetting = 'auto' | 'high' | 'low'
export type QualityTier = 'high' | 'low'

export interface DeviceHints {
  cores?: number
  memoryGb?: number
  saveData?: boolean
  reducedData?: boolean
}

export interface ProbeResult {
  /** Median ms for one workload slice. */
  work: number
  /** Median ms between the probe's frames. */
  frame: number
}

/** Workload median above this is 'low'. Measured on an M2 Max: ~2 ms, ~3.7 ms at 2x CPU throttling, ~7.5 ms at 4x. */
export const PROBE_LOW_MS = 5
/** Median frame interval above this while nearly idle is 'low' (under ~30 fps). */
export const FRAME_LOW_MS = 34
const SAMPLES = 7
const CACHE_KEY = 'youj:quality'

/** 'low' when the hints alone are decisive, otherwise null (the probe decides). */
export function tierFromHints({ cores, memoryGb, saveData, reducedData }: DeviceHints): QualityTier | null {
  if (saveData || reducedData) return 'low'
  if ((cores !== undefined && cores <= 2) || (memoryGb !== undefined && memoryGb <= 2)) return 'low'
  return null
}

export function tierFromProbe({ work, frame }: ProbeResult): QualityTier {
  return work > PROBE_LOW_MS || frame > FRAME_LOW_MS ? 'low' : 'high'
}

/** The longest stagger, in steps, the low tier plays out. Longer sequences are compressed to it. */
export const LOW_STAGGER_STEPS = 6

/**
 * Multiplier for each step of a stagger `steps` long. On every tier, given the
 * `step` and a `cap` for the whole spread (same unit; the motion components
 * cap at the deliberate token), the step shrinks to `cap / steps` once the
 * spread would run past it, so a long list or headline never trickles in while
 * a short one keeps its rhythm. On 'low' the sequence also fits into
 * LOW_STAGGER_STEPS, so a 40-letter headline lands together in a few steps.
 */
export function staggerScale(steps: number, tier: QualityTier, step = 0, cap = Infinity): number {
  const low = tier === 'low' && steps > LOW_STAGGER_STEPS ? LOW_STAGGER_STEPS / steps : 1
  const capped = steps > 0 && step > 0 ? Math.min(1, cap / (steps * step)) : 1
  return Math.min(low, capped)
}

export function readDeviceHints(): DeviceHints {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  return {
    cores: nav.hardwareConcurrency || undefined,
    memoryGb: nav.deviceMemory,
    saveData: nav.connection?.saveData === true,
    reducedData: window.matchMedia?.('(prefers-reduced-data: reduce)').matches ?? false,
  }
}

// Trig, typed-array writes and a little allocation: the shape of a rAF loop.
const scratch = new Float32Array(256)
function workload(): number {
  let acc = 0
  for (let i = 0; i < 120_000; i++) {
    const v = Math.sin(i * 0.001) * Math.cos(i * 0.0007) + Math.sqrt(i)
    scratch[i & 255] = v
    acc += scratch[(i * 7) & 255]!
  }
  return acc + [acc].length
}

const median = (values: number[]) => [...values].sort((a, b) => a - b)[values.length >> 1] ?? 0

/** Times the workload once per frame for a few frames. Resolves with the medians. */
export function runProbe(samples = SAMPLES): Promise<ProbeResult> {
  return new Promise((resolve) => {
    const work: number[] = []
    const frames: number[] = []
    let last = 0
    workload() // warm the JIT so the first sample isn't the interpreter
    const frame = (now: number) => {
      if (last) frames.push(now - last)
      last = now
      const t0 = performance.now()
      workload()
      work.push(performance.now() - t0)
      if (work.length < samples) requestAnimationFrame(frame)
      else resolve({ work: median(work), frame: median(frames) })
    }
    requestAnimationFrame(frame)
  })
}

// ---------------------------------------------------------------------------
// The page-wide 'auto' tier, as an external store.

let tier: QualityTier | null = null
let decided = false
let probing = false
const listeners = new Set<() => void>()

function readCache(): QualityTier | null {
  try {
    const v = sessionStorage.getItem(CACHE_KEY)
    return v === 'high' || v === 'low' ? v : null
  } catch {
    return null
  }
}

function writeCache(value: QualityTier) {
  try {
    sessionStorage.setItem(CACHE_KEY, value)
  } catch {
    // Storage can be unavailable (private mode, sandboxed frames): the probe just runs again next page.
  }
}

function set(next: QualityTier) {
  decided = true
  if (next === tier) return
  tier = next
  listeners.forEach((listener) => listener())
}

function probe() {
  if (probing || decided) return
  probing = true
  const start = () =>
    runProbe().then((result) => {
      probing = false
      const next = tierFromProbe(result)
      writeCache(next)
      set(next)
    })
  // After load and a quiet moment, so the probe times the device rather than the page's own start-up.
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 2000 }) : setTimeout(start, 200))
  if (document.readyState === 'complete') idle()
  else window.addEventListener('load', idle, { once: true })
}

export function getAutoTier(): QualityTier {
  if (tier === null) {
    const hinted = tierFromHints(readDeviceHints())
    const cached = readCache()
    tier = hinted ?? cached ?? 'high'
    decided = hinted !== null || cached !== null
  }
  return tier
}

export const getServerTier = (): QualityTier => 'high'

export function subscribeAutoTier(listener: () => void): () => void {
  listeners.add(listener)
  getAutoTier()
  probe()
  return () => {
    listeners.delete(listener)
  }
}

/** Test seam: forget the resolved tier so the next read re-detects. */
export function resetAutoTier() {
  tier = null
  decided = false
  probing = false
}
