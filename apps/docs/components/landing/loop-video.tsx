'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'motion/react'
import { useYouj } from '@youj/core'
import { PauseButton } from '@/components/graphics/stack/controls'
import type { LoopClip, PromoSource } from '@/components/landing/promo-video'
import { cn } from '@/lib/cn'
import { useSiteTheme } from '@/lib/site-theme'

/** True once the page has loaded and the browser is idle: the loop's download waits for everything the first paint needs. */
export function useIdleAfterLoad() {
  const [idle, setIdle] = useState(false)
  useEffect(() => {
    let cancel = () => {}
    const schedule = () => {
      if (typeof window.requestIdleCallback === 'function') {
        const id = window.requestIdleCallback(() => setIdle(true), {
          timeout: 2000,
        })
        cancel = () => window.cancelIdleCallback(id)
      } else {
        const id = setTimeout(() => setIdle(true), 200)
        cancel = () => clearTimeout(id)
      }
    }
    if (document.readyState === 'complete') schedule()
    else window.addEventListener('load', schedule, { once: true })
    return () => {
      window.removeEventListener('load', schedule)
      cancel()
    }
  }, [])
  return idle
}

/** The visitor asked to save data: no video they didn't ask for. */
export function useSaveData() {
  const [save, setSave] = useState(false)
  useEffect(() => {
    setSave(Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData))
  }, [])
  return save
}

/** The sources this screen should play: those without a media query, or whose query it matches (browsers ignore `media` on a video's sources). */
function sourcesFor(sources: PromoSource[]) {
  return sources.filter((source) => !source.media || (typeof window.matchMedia === 'function' && window.matchMedia(source.media).matches))
}

/** A clip's poster, filling its box: AVIF or WebP where the browser reads them, at the size the slot needs; else the JPG. */
function Poster({ clip, sizes, className }: { clip: LoopClip; sizes: string; className?: string }) {
  const set = clip.posterSet
  return (
    <picture className={cn('absolute inset-0', className)}>
      {set?.avif && <source type="image/avif" srcSet={set.avif} sizes={sizes} />}
      {set?.webp && <source type="image/webp" srcSet={set.webp} sizes={sizes} />}
      {/* A plain img: pre-sized in apps/promo, so there's nothing for the optimizer to do */}
      <img src={clip.poster} srcSet={set?.jpg} sizes={set?.jpg ? sizes : undefined} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
    </picture>
  )
}

/**
 * A topic loop from apps/promo, filling its box. The poster (the loop's first
 * frame) is there from the first paint; the loop itself loads once the page
 * is idle and the box is near the screen, fades in over the poster when it
 * starts, and plays only while at least a quarter of it is on screen in a
 * visible tab. Under reduced motion (the site's control or the OS) or
 * Save-Data it never loads, and the poster stays. With a `light` cut, poster
 * and loop follow the page's scheme: a switch mid-play picks the other cut
 * up where this one was, over the new scheme's poster, so nothing flashes
 * and the loop doesn't start over. The whole is one image to assistive
 * technology, named by `title`; `controls` adds a pause button (WCAG 2.2.2).
 */
export function LoopVideo({
  title,
  dark,
  light,
  sizes,
  controls = false,
  className,
}: {
  title: string
  dark: LoopClip
  light?: LoopClip
  sizes: string
  controls?: boolean
  className?: string
}) {
  const k = useYouj()
  const box = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const inView = useInView(box, { amount: 0.25 })
  const near = useInView(box, { once: true, margin: '300px 0px' })
  const idle = useIdleAfterLoad()
  const saveData = useSaveData()
  const scheme = useSiteTheme()
  const [paused, setPaused] = useState(false)
  const [awake, setAwake] = useState<string | null>(null)
  // Where the loop is, so the other scheme's cut can pick it up there.
  const at = useRef(0)
  const clip = light && scheme.mounted && !scheme.dark ? light : dark
  const live = !k.reduced && !saveData && idle && near
  const sources = live ? sourcesFor(clip.sources) : []
  const src = sources[0]?.src ?? ''

  // Plays only while it can be seen and hasn't been paused.
  useEffect(() => {
    const el = video.current
    if (!el) return
    el.muted = true
    const sync = () => {
      if (inView && !paused && !document.hidden) void el.play().catch(() => {})
      else el.pause()
    }
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [inView, paused, live, src])

  return (
    <div ref={box} data-promo-loop="" className={cn('relative size-full overflow-hidden', className)}>
      <div role="img" aria-label={title} className="absolute inset-0">
        {light ? (
          <>
            <Poster clip={dark} sizes={sizes} className="hidden dark:block" />
            <Poster clip={light} sizes={sizes} className="dark:hidden" />
          </>
        ) : (
          <Poster clip={dark} sizes={sizes} />
        )}
        {/* No `poster` attribute: the <picture> under the video is the poster, and the attribute would fetch it a second time. */}
        {live && (
          <video
            key={src}
            ref={video}
            aria-hidden
            muted
            loop
            playsInline
            preload="none"
            onLoadedMetadata={(event) => {
              const el = event.currentTarget
              if (at.current > 0 && el.duration > 0) el.currentTime = at.current % el.duration
            }}
            onTimeUpdate={(event) => {
              at.current = event.currentTarget.currentTime
            }}
            onPlaying={() => setAwake(src)}
            className={cn('absolute inset-0 size-full object-cover transition-opacity yj-duration-slow ease-standard', awake === src ? 'opacity-100' : 'opacity-0')}
          >
            {sources.map((source) => (
              <source key={source.src} src={source.src} type={source.type} />
            ))}
          </video>
        )}
      </div>
      {controls && live && (
        <div className="absolute end-3 bottom-3 rounded-full border border-line bg-surface/85 youj-allow-glass shadow-lg backdrop-blur-md sm:end-4 sm:bottom-4">
          <PauseButton paused={paused} onChange={setPaused} />
        </div>
      )}
    </div>
  )
}
