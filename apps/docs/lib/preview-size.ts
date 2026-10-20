'use client'

import { useMemo, useSyncExternalStore } from 'react'
import { isDensity, isScaling, sameSize } from '@youj/react/docs/create/size-url'
import type { PreviewSize } from '@/lib/preview'
import { createStoreSignal, onStorageKey } from '@/lib/store-signal'

/* The size previews render at: a layout density (roomy, the standard, or compact) and a UI
 * scale (75% to 120%), what a root YoujProvider sets. Each item
 * starts at the standard size (lib/preview's defaultSize: roomy at 100%). A reader's pick is per axis and shared,
 * like the component style: every preview on every page, remembered across
 * visits in localStorage, so a density picked on one page holds on the next
 * while the scale still follows each item's default until it's picked too.
 * Reset forgets both, and each item returns to its own. Nothing is written
 * until a pick. */

export const PREVIEW_SIZE_KEY = 'youj-preview-size'

/** The reader's pick: either axis, or neither (each item's default). */
export type SizeOverride = Partial<PreviewSize>

/** A stored pick, checked: anything malformed or unknown drops out. */
export function readSizeOverride(raw: string | null): SizeOverride {
  if (!raw) return {}
  try {
    const value: unknown = JSON.parse(raw)
    if (typeof value !== 'object' || value === null) return {}
    const { density, scaling } = value as Record<string, unknown>
    return { ...(isDensity(density) ? { density } : {}), ...(isScaling(scaling) ? { scaling } : {}) }
  } catch {
    return {}
  }
}

/** Storage blocked: the pick holds for this page's lifetime only. */
let memory: string | null = null

function stored(): string | null {
  try {
    return localStorage.getItem(PREVIEW_SIZE_KEY)
  } catch {
    return memory
  }
}

function store(value: string | null) {
  memory = value
  try {
    if (value === null) localStorage.removeItem(PREVIEW_SIZE_KEY)
    else localStorage.setItem(PREVIEW_SIZE_KEY, value)
  } catch {
    // Storage blocked: `memory` carries it.
  }
}

const { subscribe, notify } = createStoreSignal(onStorageKey(PREVIEW_SIZE_KEY))

/** Picks a density, a scale or both, for every preview, now and on later visits. */
export function setPreviewSize(patch: SizeOverride) {
  store(JSON.stringify({ ...readSizeOverride(stored()), ...patch }))
  notify()
}

/** Forgets the pick: every preview returns to its own default. */
export function resetPreviewSize() {
  store(null)
  notify()
}

/** The reader's pick, as stored: null on the server and in the hydration render, so nothing claims a size the server couldn't know. */
function useStored(): string | null {
  return useSyncExternalStore(subscribe, stored, () => null)
}

/** The pick alone, without an item's default: `{}` until there's one (and before hydration). */
export function useSizeOverride(): SizeOverride {
  const raw = useStored()
  return useMemo(() => readSizeOverride(raw), [raw])
}

export interface PreviewSizeState {
  /** What the preview renders at: the pick over the item's default. */
  size: PreviewSize
  /** The item's own size. */
  fallback: PreviewSize
  /** It differs from the item's default (the gallery's screenshots can't show it). */
  changed: boolean
  /** The reader has picked something, here or elsewhere, which Reset forgets. */
  picked: boolean
}

/** The size an item with `fallback` as its default renders at. */
export function usePreviewSize(fallback: PreviewSize): PreviewSizeState {
  const override = useSizeOverride()
  const picked = override.density !== undefined || override.scaling !== undefined
  // By value: callers may pass a fresh fallback each render, and the size is a dependency of their effects.
  const [density, scaling] = [override.density ?? fallback.density, override.scaling ?? fallback.scaling]
  const [baseDensity, baseScaling] = [fallback.density, fallback.scaling]
  return useMemo(() => {
    const size = { density, scaling }
    const base = { density: baseDensity, scaling: baseScaling }
    return { size, fallback: base, changed: !sameSize(size, base), picked }
  }, [density, scaling, baseDensity, baseScaling, picked])
}
