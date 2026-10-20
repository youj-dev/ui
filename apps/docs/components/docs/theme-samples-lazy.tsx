'use client'

import { useEffect, useRef, useState, type ComponentType } from 'react'

/* The theming page's live samples (theme-samples.tsx, and the character
 * comparison from components/theming) are a theme scope per preset, heavy in
 * the page's HTML and RSC, so the server sends a box of their height and their
 * code is fetched once the box nears the screen. */

/** What either sample takes: the two-tone example's overlays (the sampler takes nothing). */
interface SampleProps {
  overlays?: 'content' | 'chrome'
}

function lazySample(get: () => Promise<ComponentType<SampleProps>>, height: string) {
  return function Sample(props: SampleProps) {
    const box = useRef<HTMLDivElement>(null)
    const [Component, setComponent] = useState<ComponentType<SampleProps> | null>(null)

    useEffect(() => {
      const el = box.current
      let live = true
      const load = () => void get().then((C) => live && setComponent(() => C))
      if (!el || typeof IntersectionObserver === 'undefined') {
        load()
        return () => void (live = false)
      }
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        observer.disconnect()
        load()
      }, { rootMargin: '600px 0px' })
      observer.observe(el)
      return () => {
        live = false
        observer.disconnect()
      }
    }, [])

    if (Component) return <Component {...props} />
    return <div ref={box} aria-hidden className="not-prose my-6 rounded-xl border border-dashed border-line" style={{ minHeight: height }} />
  }
}

export const RoleSampler = lazySample(() => import('./theme-samples').then((m) => m.RoleSampler), '42rem')
export const TwoToneExample = lazySample(() => import('./theme-samples').then((m) => m.TwoToneExample), '17rem')
export const ThemeCharacter = lazySample(() => import('@/components/theming').then((m) => m.ThemeCharacter), '30.4rem')
