'use client'

import { useEffect, useRef, useState, type ComponentType } from 'react'
import { Button } from '@youj/react'

/* The Sound builder is client-only and heavy (every cue's candidates, the export), so the page doesn't send its
 * markup: the server sends a box of the builder's height, and the builder's code is fetched once the box nears the
 * screen, or a link carries picks (`?cue=…`), or a key or a pointer lands in it. The "Load the builder" button is the
 * way in for a browser that can't observe the box. */

const load = () => import('./sound-builder').then((m) => m.SoundBuilder)

export function SoundBuilder() {
  const box = useRef<HTMLDivElement>(null)
  const [Builder, setBuilder] = useState<ComponentType | null>(null)
  const [asked, setAsked] = useState(false)

  useEffect(() => {
    if (asked) return
    const el = box.current
    if (window.location.search.length > 1 || !el || typeof IntersectionObserver === 'undefined') return setAsked(true)
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
    <div ref={box} aria-busy={asked || undefined} className="not-prose grid min-h-[1200px] place-items-start rounded-xl border border-dashed border-line-strong p-6 max-sm:min-h-[1700px]">
      <Button variant="outline" size="sm" sound={false} disabled={asked} onClick={() => setAsked(true)}>
        {asked ? 'Loading the builder…' : 'Load the builder'}
      </Button>
    </div>
  )
}
