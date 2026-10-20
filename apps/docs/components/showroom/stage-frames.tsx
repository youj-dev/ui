'use client'

import { useCallback, useEffect, useState, type Ref } from 'react'
import { useYouj } from '@youj/core'
import { cn } from '@/lib/cn'
import type { Scheme } from './hooks'

/** One load of an item on the stage: its frame's key, address and name, and whether it has loaded. */
export interface StageFrame {
  key: string
  src: string
  title: string
  loaded: boolean
}

/**
 * The frames on the stage, bottom first. A new load goes on top, hidden, and the frames under it stay until it has
 * loaded and faded in (its fade's end; at once without one, and after twice its length at the latest, should the end
 * never come), so a change of item never shows an empty stage, and one made while the last is still fading in
 * carries on from what's on show. A frame that never loaded goes as soon as a newer one comes, and a run of changes
 * (an arrow held down) keeps at most three: the one at the bottom, the newest one fading in over it, and the next.
 * `ready` is true once the frame for `next` has loaded; `shown` once any has.
 */
export function useStageFrames(next: Omit<StageFrame, 'loaded'> | null) {
  const k = useYouj()
  const [frames, setFrames] = useState<StageFrame[]>([])
  if (next && frames.at(-1)?.key !== next.key) {
    const loaded = frames.filter((f) => f.loaded)
    setFrames([...(loaded.length > 2 ? [loaded[0]!, loaded.at(-1)!] : loaded), { ...next, loaded: false }])
  }
  const load = useCallback((key: string) => setFrames((fs) => fs.map((f) => (f.key === key ? { ...f, loaded: true } : f))), [])
  // Whatever is under a frame that has faded in is hidden by it.
  const settle = useCallback(
    (key: string) =>
      setFrames((fs) => {
        const at = fs.findIndex((f) => f.key === key)
        return at > 0 ? fs.slice(at) : fs
      }),
    [],
  )
  const newest = frames.filter((f) => f.loaded).at(-1)?.key
  useEffect(() => {
    if (!newest) return
    const timer = window.setTimeout(() => settle(newest), k.reduced ? 0 : k.ms('base') * 2)
    return () => window.clearTimeout(timer)
  }, [newest, settle, k])
  const top = frames.at(-1)
  return { frames, ready: Boolean(next && top?.key === next.key && top.loaded), shown: Boolean(newest), load, settle }
}

/**
 * The stage's frames from `useStageFrames`, filling the plate: each fades in over the last, only the top one takes the
 * pointer, focus and assistive tech, and `frameRef` is always the top one. A spinner holds the stage until the first loads.
 */
export function StageFrames({ stack, frameRef, scheme }: { stack: ReturnType<typeof useStageFrames>; frameRef: Ref<HTMLIFrameElement>; scheme: Scheme }) {
  const { frames, shown, load, settle } = stack
  return (
    <>
      {frames.map((f, i) => {
        const top = i === frames.length - 1
        return (
          <iframe
            key={f.key}
            ref={top ? frameRef : undefined}
            src={f.src}
            title={f.title}
            aria-hidden={!top || undefined}
            tabIndex={top ? undefined : -1}
            onLoad={() => load(f.key)}
            onTransitionEnd={(e) => e.propertyName === 'opacity' && f.loaded && settle(f.key)}
            style={{ colorScheme: scheme }}
            className={cn(
              'absolute inset-0 size-full border-0 transition-opacity duration-[calc(var(--yj-duration-base)*var(--yj-motion,1))] ease-standard motion-reduce:transition-none',
              !f.loaded && 'opacity-0',
              !(top && f.loaded) && 'pointer-events-none',
            )}
          />
        )
      })}
      {!shown && (
        <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="viewer-spinner size-5 rounded-full border-2 border-line-strong border-t-fg-muted" />
        </div>
      )}
    </>
  )
}
