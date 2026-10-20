'use client'

import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import type { SceneEntry } from './catalog'

/* A scene's finished frame, still (no drop, no bob), for the viewfinder's and
 * the search's thumbnails. Drawing a scene is a few hundred SVG elements and a
 * dozen motion values, so each is paid for once and never all at once: a
 * first drawing waits its turn in a queue that draws a couple of scenes a
 * frame, and once drawn at rest its markup is kept (the colors are the theme's
 * custom properties, so it's right in any preset and scheme) and shown from
 * then on, with no React or motion under it (stillMarkup). */

/** Scene id → its drawing at rest, as markup. */
const drawn = new Map<string, string>()

/** A scene's drawing at rest, as markup, once it's been drawn. */
export const stillMarkup = (id: string) => drawn.get(id) ?? null

/** Scenes a frame's budget allows: two keeps a frame well inside 16 ms on a mid-range laptop. */
const PER_FRAME = 2
const queue: (() => void)[] = []
let pending = 0

function pump() {
  pending = 0
  for (const run of queue.splice(0, PER_FRAME)) run()
  if (queue.length) pending = requestAnimationFrame(pump)
}

/** Draws `run` when its turn comes; the returned function takes it out of the queue. */
function enqueue(run: () => void) {
  queue.push(run)
  if (!pending) pending = requestAnimationFrame(pump)
  return () => {
    const at = queue.indexOf(run)
    if (at >= 0) queue.splice(at, 1)
  }
}

/**
 * A scene's finished frame and nothing live: for a thumbnail, many to a row. The first time a scene is asked for, it's
 * drawn live in its turn in the queue, kept as markup before that frame paints, and the live drawing goes again; after
 * that, anywhere, it's the kept markup, with no React or motion under it.
 */
export const SceneStill = memo(function SceneStill({ scene, className }: { scene: SceneEntry; className?: string }) {
  const [markup, setMarkup] = useState(() => drawn.get(scene.id) ?? null)
  const [turn, setTurn] = useState(false)
  const box = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (markup) return
    const kept = drawn.get(scene.id)
    if (kept) return setMarkup(kept)
    return enqueue(() => setTurn(true))
  }, [markup, scene.id])

  useLayoutEffect(() => {
    if (!turn || markup) return
    const svg = box.current?.querySelector('svg')
    if (!svg) return
    if (!drawn.has(scene.id)) drawn.set(scene.id, svg.outerHTML)
    setMarkup(drawn.get(scene.id)!)
  }, [turn, markup, scene.id])

  // biome-ignore lint/security/noDangerouslySetInnerHtml: markup is the outerHTML of a scene we just rendered
  if (markup) return <span className={cn('block', className)} dangerouslySetInnerHTML={{ __html: markup }} />
  if (!turn) return <span className={cn('block aspect-[1.24]', className)} />
  const { Component } = scene
  return (
    <span ref={box} className={cn('block', className)}>
      <Component assemble={false} float={false} explode={0} unit={16} grow />
    </span>
  )
})
