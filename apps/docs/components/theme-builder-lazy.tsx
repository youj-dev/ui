'use client'

import { useEffect, useRef, useState, type ComponentType } from 'react'
import { Button } from '@youj/react'

/* The theme builder sits at the foot of the theming page and is the heaviest
 * thing on it (every control, preview and export, in HTML and RSC), so the
 * page doesn't send its markup: the server sends a box of the builder's
 * height, and its code is fetched once the box nears the screen, or a key or a
 * pointer lands in it. As the Sound builder does (sound/sound-builder-lazy). */

const load = () => import('./theming').then((m) => m.ThemeBuilder)

export function ThemeBuilder() {
  const box = useRef<HTMLDivElement>(null)
  const [Builder, setBuilder] = useState<ComponentType | null>(null)
  const [asked, setAsked] = useState(false)

  useEffect(() => {
    if (asked) return
    const el = box.current
    if (!el || typeof IntersectionObserver === 'undefined') return setAsked(true)
    const observer = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setAsked(true), { rootMargin: '600px 0px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [asked])

  useEffect(() => {
    if (!asked) return
    let live = true
    void load().then((component) => live && setBuilder(() => component))
    return () => void (live = false)
  }, [asked])

  if (Builder) return <Builder />
  return (
    <div ref={box} aria-busy={asked || undefined} className="not-prose my-8 grid min-h-[1813px] place-items-start rounded-xl border border-dashed border-line-strong p-6 max-sm:min-h-[2737px]">
      <Button variant="outline" size="sm" sound={false} disabled={asked} onClick={() => setAsked(true)}>
        {asked ? 'Loading the builder…' : 'Load the builder'}
      </Button>
    </div>
  )
}
