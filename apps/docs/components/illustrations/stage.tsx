'use client'

import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { DEFAULT_LOOK, ThemeScope, YoujProvider, useYouj } from '@youj/core'
import type { InternalThemeId as ThemeId } from '@youj/core/lib/youj/theme'
import { sceneViewBox } from '@youj/illustrations'
import type { Scheme } from '@/components/showroom/hooks'
import { cn } from '@/lib/cn'
import { modePreset, sitePreset } from '@/lib/preview'
import type { SceneEntry } from './catalog'
import { contextLabel, type ContextCopy } from './context-copy'
import { usePreviewTheme } from './preview'
import { Stage } from '@/components/site/stage'

/* The hero's stage: the scene on show, live, in the stage's own theme (its light or dark and its preset; the page keeps
 * its own). Raw, it stands alone on the paper, as large as the stage allows but never past twice its natural size: past
 * that a scene only gets emptier, so the room goes to the paper instead. In context it's the picture of a screen it
 * would live in (./context), drawn large there too, at the width the screen gives its picture.
 *
 * There's one scene, laid over the screen rather than in it: the screen keeps a slot of the scene's size, and the scene
 * sits on the slot. Turning context on or off glides it between the slot and the middle of the stage (left, top and
 * width, so it's drawn at its true size every frame and stays crisp) while the screen fades in or out around it; a
 * change of mind mid-way turns it round from where it is. A new scene lands where it goes at once and assembles there.
 * Reduced motion: no glide and no fade, and the scene finished and still. A screen taller than the stage is scaled down
 * to fit (never up). A still copy, finished and in the same theme, is drawn out of sight while a download wants it.
 *
 * The screens are a chunk of their own, fetched as soon as this module runs (the stage draws only in the browser, so
 * they needn't come with the page); in context, the scene waits for its slot rather than showing alone first. */

/** The screens' code: asked for at once, so it's there by the time the stage first draws. */
const loadScreens = () => import('./context')
const SceneContext = lazy(loadScreens)
if (typeof window !== 'undefined') void loadScreens()

/** Every scene frames the same 8 × 8 × 3 volume, padded 10: its natural box at the kit's default 22px a unit. */
const NATURAL = sceneViewBox([8, 8, 3], 22, 10)
const ASPECT = NATURAL.width / NATURAL.height
/** The most a scene is drawn at alone: twice its natural size. */
const MAX_ALONE = NATURAL.width * 2

/** Room kept clear over and under a scene on its own, px: the toolbar's height. */
const CLEAR = 56

interface Rect {
  left: number
  top: number
  width: number
}

const sameRect = (a: Rect | null, b: Rect) => !!a && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.top - b.top) < 0.5 && Math.abs(a.width - b.width) < 0.5

/** Alone: centred, as large as the stage allows up to MAX_ALONE. */
function aloneRect(width: number, height: number): Rect {
  const w = Math.max(80, Math.min(MAX_ALONE, width * 0.84, (height - 2 * CLEAR) * ASPECT))
  return { left: (width - w) / 2, top: (height - w / ASPECT) / 2, width: w }
}

export interface SceneStageProps {
  scene: SceneEntry
  copy: ContextCopy
  context: boolean
  scheme: Scheme
  /** The stage's preset; null is the site's for the scheme. */
  preset: ThemeId | null
  /** The preset's mood backdrop runs behind the plate (ShowroomHero): the stage lets it show. */
  backdrop?: boolean
  /** Held taken apart; otherwise it comes apart while it's hovered. */
  apart: boolean
  /** Colour for every scene on the stage (the scenes' `colors`): 'theme', or hues in place of the theme's, set as custom properties. Off: gray, the accent its only colour. */
  colors?: 'theme' | readonly string[]
  /** The stage's reduced motion (the site's own applies as well). */
  reduced: boolean
  /** Bumped to draw it assembling again. */
  replay: number
  /** Draw the still copy the downloads are made from. */
  still: boolean
  stillRef?: RefObject<SVGSVGElement | null>
  /** The pointer came onto the scene or left it. */
  onHover?: (hovering: boolean) => void
  /** The scene started assembling (true) or is done (false). */
  onAssembling?: (assembling: boolean) => void
}

export function SceneStage({ scene, copy, context, scheme, preset, backdrop, apart, colors, reduced: stageReduced, replay, still, stillRef, onHover, onAssembling }: SceneStageProps) {
  const site = useYouj()
  const reduced = stageReduced || site.reduced
  const theme = usePreviewTheme({ preset, mode: scheme, apart, reduced: stageReduced })
  const open = !theme.themed || Boolean(backdrop)
  // Youj is scoped to the site's own preset, so the stage takes Youj's accent (Graphite's blue in light, Basalt's amber in dark).
  const youj = theme.preset === modePreset(theme.mode === 'dark')
  const stage = useRef<HTMLDivElement>(null)
  const room = useRef<HTMLDivElement>(null)
  const screen = useRef<HTMLDivElement>(null)
  // The slot is state, not a ref: it arrives with the screens' chunk, and the scene is placed once it's there.
  const [slot, setSlot] = useState<HTMLDivElement | null>(null)
  const [box, setBox] = useState<Rect | null>(null)
  // The scene glides only for a change of context; anything else (a new scene, a resize) puts it there at once.
  const [glide, setGlide] = useState(false)
  const fit = useRef(1)

  const measure = useCallback(() => {
    const el = stage.current
    if (!el) return
    const s = el.getBoundingClientRect()
    if (!s.width || !s.height) return
    // A screen taller than the room left for it is scaled down to fit; the slot is read after, where it now is.
    const shown = screen.current
    const space = room.current?.clientHeight
    if (shown && space) {
      const next = Math.min(1, space / Math.max(1, shown.offsetHeight))
      if (Math.abs(next - fit.current) > 0.001) {
        fit.current = next
        shown.style.scale = next < 1 ? String(next) : ''
      }
    }
    const hole = slot?.getBoundingClientRect()
    // In context, before the screen has come there's nowhere to put the scene yet.
    if (context && !hole?.width) return
    const next = context && hole ? { left: hole.left - s.left, top: hole.top - s.top, width: hole.width } : aloneRect(s.width, s.height)
    setBox((was) => (sameRect(was, next) ? was : next))
  }, [context, slot])

  // Placed before the first paint, and again whenever the stage, the screen or the slot changes size.
  useLayoutEffect(() => {
    measure()
    const observer = new ResizeObserver(() => measure())
    for (const el of [stage.current, room.current, screen.current, slot]) if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [measure, copy])

  // A change of context glides; the glide ends with the move. A new scene lands at once, even mid-glide.
  const last = useRef({ context, id: scene.id })
  useLayoutEffect(() => {
    const was = last.current
    last.current = { context, id: scene.id }
    if (was.id !== scene.id) setGlide(false)
    else if (was.context !== context) setGlide(!reduced)
  }, [context, scene.id, reduced])

  const key = `${scene.id}:${replay}`
  const sceneBox = useRef<HTMLDivElement>(null)
  useAssembling(sceneBox, `${key}:${box !== null}`, !reduced, onAssembling)

  const { Component } = scene
  const label = contextLabel(scene.name, copy)

  return (
    <YoujProvider timeScale={site.timeScale} reducedMotion={reduced ? 'always' : 'user'} look={DEFAULT_LOOK}>
      <ThemeScope theme={theme.themed || youj ? sitePreset(theme.preset) : undefined}>
        <Stage
          ref={stage}
          theme={theme.themed || youj ? theme.preset : undefined}
          mode={theme.mode}
          data-slot="illustration-stage"
          // Colour is the kit's CSS: data-yj-colors and the hue properties reach every scene inside, the still copy too.
          data-yj-colors={colors ? '' : undefined}
          // The plate's aurora (the site's own look) or a mood's backdrop shows through; only a theme without one keeps its page.
          style={{ ...hueStyle(colors), ...(open && { background: 'transparent' }) }}
          className="absolute inset-0 overflow-hidden"
        >
          {/* The scene on a dotted plate, in Raw and In context alike, clear under the middle (the aurora and a backdrop need none). */}
          {!open && <div aria-hidden className="dot-grid dots-edge pointer-events-none absolute inset-0" />}
          {/* The screen around it: always laid out, so the slot is known before it's shown; faded in and out. Clear of the
              toolbar above it; centred, even when it's taller than the room (then it's scaled down about its middle). */}
          <div
            ref={room}
            className={cn(
              'absolute inset-x-0 top-[3.25rem] bottom-4 flex items-center justify-center px-3.5 sm:top-14 sm:bottom-10 sm:px-[clamp(1.25rem,6%,4rem)]',
              'transition-[opacity,visibility] duration-(--yj-duration-slow) ease-standard',
              !context && 'invisible opacity-0',
              reduced && 'transition-none',
            )}
          >
            <div ref={screen} className="w-full shrink-0 origin-center">
              <Suspense fallback={null}>
                <SceneContext copy={copy} scene={<div ref={setSlot} style={{ aspectRatio: `${ASPECT}` }} className="w-full" />} />
              </Suspense>
            </div>
          </div>

          {box && (
            <div
              ref={sceneBox}
              data-slot="hero-scene"
              onPointerEnter={(e) => e.pointerType === 'mouse' && onHover?.(true)}
              onPointerLeave={() => onHover?.(false)}
              className={cn('absolute', glide && 'transition-[left,top,width] duration-(--yj-duration-slow) ease-emphasized')}
              onTransitionEnd={(e) => e.target === e.currentTarget && setGlide(false)}
              style={{ left: box.left, top: box.top, width: box.width }}
            >
              <Component
                key={key}
                assemble
                float
                explode={apart ? 1 : 'hover'}
                unit={22}
                grow
                title={context ? undefined : scene.name}
                description={context ? undefined : scene.description || undefined}
              />
            </div>
          )}
          {context && <p className="sr-only">{label}</p>}

          {/* The frame the downloads are made from: finished, still, apart when it's held apart, in this theme. */}
          {still && (
            <div aria-hidden inert data-slot="illustration-still" className="pointer-events-none fixed -start-[200vw] top-0 w-[400px] bg-canvas">
              <YoujProvider reducedMotion="always">
                <StillScene scene={scene} apart={apart} svgRef={stillRef} />
              </YoujProvider>
            </div>
          )}
        </Stage>
      </ThemeScope>
    </YoujProvider>
  )
}

/** The scenes' hues as custom properties: --kg-c1 for the first, and so on; an empty one keeps the theme's. */
export const hueStyle = (colors?: 'theme' | readonly string[]) =>
  typeof colors !== 'string' && colors?.some(Boolean) ? (Object.fromEntries(colors.flatMap((c, i) => (c ? [[`--kg-c${i + 1}`, c]] : []))) as CSSProperties) : undefined

function StillScene({ scene, apart, svgRef }: { scene: SceneEntry; apart: boolean; svgRef?: RefObject<SVGSVGElement | null> }) {
  const holder = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (!svgRef) return
    svgRef.current = holder.current?.querySelector('svg') ?? null
    return () => {
      svgRef.current = null
    }
  })
  const { Component } = scene
  return (
    <div ref={holder}>
      <Component key={scene.id} assemble={false} float={false} explode={apart ? 1 : 0} unit={22} />
    </div>
  )
}

/**
 * Tells while a scene is assembling: from its mount for about as long as its parts take to drop in (one stagger step a
 * part, then the settle), read off the drawing once it's there.
 */
function useAssembling(box: RefObject<HTMLDivElement | null>, key: string, assembles: boolean, onAssembling?: (assembling: boolean) => void) {
  const k = useYouj()
  const report = useRef(onAssembling)
  report.current = onAssembling
  useEffect(() => {
    if (!assembles) {
      report.current?.(false)
      return
    }
    const parts = box.current?.querySelectorAll('svg > g').length ?? 0
    if (!parts) return
    report.current?.(true)
    const timer = window.setTimeout(() => report.current?.(false), parts * k.stagger('loose') * 1000 + k.ms('deliberate'))
    return () => window.clearTimeout(timer)
  }, [box, key, assembles, k])
}
