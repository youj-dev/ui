'use client'

import { useEffect, useState } from 'react'
import { LOADERS, type LoaderComponent } from '@/generated/loaders'

/* Each loader is a chunk of its own (generated/loaders.ts): the page fetches the one on its stage, the ones either side
 * of it, and each thumbnail's as it comes near, never the whole set. A loader then draws only while it's on screen
 * (the kit's own rule), on one shared ticker. */

export type { LoaderComponent }

const loaded = new Map<string, LoaderComponent>()
const pending = new Map<string, Promise<LoaderComponent>>()

/** The loader's component, fetched once (a failed fetch is forgotten, so the next ask tries again). */
export function loadLoader(id: string): Promise<LoaderComponent> {
  const done = loaded.get(id)
  if (done) return Promise.resolve(done)
  let load = pending.get(id)
  if (!load) {
    const chunk = LOADERS[id]
    load = chunk ? chunk() : Promise.reject(new Error(`No loader named ${id}`))
    load.then(
      (Component) => loaded.set(id, Component),
      () => pending.delete(id),
    )
    pending.set(id, load)
  }
  return load
}

/** Starts fetching a loader nobody draws yet (the stage's neighbours), so a step to it shows it at once. */
export const prefetchLoader = (id: string) => void loadLoader(id).catch(() => {})

/** The loader's component once its chunk is in (at once when it already is); null until then, and `failed` if it didn't come. */
export function useLoader(id: string | null) {
  const [state, setState] = useState<{ id: string | null; Component: LoaderComponent | null; failed: boolean }>(() => ({
    id,
    Component: id ? (loaded.get(id) ?? null) : null,
    failed: false,
  }))
  const current = state.id === id ? state : { id, Component: id ? (loaded.get(id) ?? null) : null, failed: false }
  if (current !== state) setState(current)
  useEffect(() => {
    if (!id || loaded.has(id)) return
    let live = true
    loadLoader(id).then(
      (Component) => live && setState({ id, Component, failed: false }),
      () => live && setState({ id, Component: null, failed: true }),
    )
    return () => {
      live = false
    }
  }, [id])
  return current
}
