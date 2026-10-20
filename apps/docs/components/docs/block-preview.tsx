'use client'

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { useYouj } from '@youj/core'
import { DEFAULT_STYLE } from '@youj/core/lib/youj/theme'
import type { InternalThemeId as ThemeId } from '@youj/core/lib/youj/theme'
import { MaximizeIcon, MinimizeIcon } from '@youj/icons'
import { ActionIsland, ActionIslandTile } from '@youj/react/components/ui/action-island'
import { DEVICE_WIDTH, MotionSizeTile, PreviewIsland, type IslandDevice } from '@/components/showcase/preview-island'
import type { Zoom } from '@/components/showcase/zoom'
import type { CodeInstall } from '@/components/showcase/code-panel'
import { backdropById, backdropForPreset, isBackdropId, type BackdropId } from '@/lib/backdrops'
import { cn } from '@/lib/cn'
import { useFrameSync } from '@/lib/frame-sync'
import { BackdropLayer } from './backdrop-layer'
import { crossfade, sharpen, soften } from './story-switch'
import { DEFAULT_PREVIEW_MOTION, type PreviewMotion, type PreviewSize } from '@/lib/preview'
import { usePreviewSize } from '@/lib/preview-size'
import { SITE_PRESET } from '@/lib/site-mode'
import { useModePreset } from '@/lib/site-theme'
import { setPreviewLook, useShowcaseLook } from '@/lib/showcase-theme'
import type { Framing } from '@/lib/showcase'

/* A block-family page's preview (./block-stories-view): a docs example's
 * panel (the aurora in the site's look, components/docs/preview-live.tsx) with
 * the block's /view page as a screen inset on it, and the same island in the
 * strip under it: the Story, the look (Appearance), the device's width, the
 * zoom, Reload, motion and size, and the install command to copy. Its corner
 * opens the block's full page. The frame follows the island through
 * lib/frame-sync, as the block's own page does.
 *
 * Fit lays a desktop block out at FIT_WIDTH and draws it to the stage's width,
 * wider than a block's own page does (1280), so more of it shows at once. A
 * screen fills the stage (HEIGHT); a section or a card is as tall as it
 * reports, up to that, and scrolls inside it beyond. */

/** Fit's layout width here: a laptop's 1440, so a block shows as a website would (about half size on a docs column). */
const FIT_WIDTH = 1440
/** A desktop screen's window height at that width: a laptop's 1440 × 900. */
const SCREEN_HEIGHT = 900
/** Below this the stage is a phone's: Fit shows the block at 100%, its own small layout. A docs column (about 730px) is above it, so it scales. */
const FIT_MIN = 480
/** The stage's height cap: 720px (about 1400px of a block at Fit), less on a short window; a taller block scrolls inside it. */
const HEIGHT = 'min(720px, max(26rem, calc(100dvh - 11rem)))'
/** A section's or card's stage before its block has said how tall it is. */
const FITTED_START = 520
/** The stage's padding around the screen, each side (px). */
const PAD = 16
/** The tallest a section's or card's stage gets, in px: HEIGHT's own sum, for the scale that fits a tall block in it. */
const room = () => Math.min(720, Math.max(416, window.innerHeight - 176))
/** How long (ms) a next block's reported height holds in its new size before the crossfade starts, so it never resizes in view. */
const SETTLE_MS = 160
/** The smallest a tall block is drawn at to fit the stage's height; one that needs less scrolls in it instead. */
const MIN_SCALE = 0.3

/** One of the preview's frames: its story's page and a key of its own (the same page loaded again is a new frame). */
interface Layer {
  src: string
  key: string
}

export interface BlockPreviewProps {
  src: string
  title: string
  framing: Framing
  size: PreviewSize
  install?: CodeInstall
  /** In the theme's own colour rather than the docs' monochrome ink. */
  accent?: boolean
  /** What the block stands on: the aurora (default); `own`, its own background filling the preview; `glass`, a frosted panel on the aurora; or a backdrop by name (lib/backdrops), with the preset that matches it. */
  backdrop?: 'own' | 'glass' | BackdropId
  story: { value: string; options: { id: string; label: string }[]; onChange: (story: string) => void; pending?: boolean; onIntent?: (story: string) => void }
}

export function BlockPreview({ src: plain, title, framing, size, install, accent = false, backdrop, story }: BlockPreviewProps) {
  const src = plain
  const [run, setRun] = useState(0)
  const replay = () => setRun(run + 1)
  const k = useYouj()
  const stage = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  // A story on a backdrop starts in the backdrop's preset; one the reader picks holds on that ground (any plain
  // story is one ground), so moving between stories never carries a pick onto a backdrop it wasn't made for.
  const home = isBackdropId(backdrop) ? backdropById(backdrop) : null
  const ground = home?.id ?? 'plain'
  const [pick, setPick] = useState<{ on: string; preset: ThemeId | null } | null>(null)
  const picked = pick && pick.on === ground ? pick.preset : (home?.palette ?? null)
  // The ground follows the preset: one with a backdrop brings it (on any story), any other shows its plain canvas, and
  // the site's look (no pick) the aurora.
  const scene = backdropForPreset(picked)
  // A story with a backdrop, read in the site's look (Youj), stands on the aurora as glass, never on its page's own canvas.
  const glass = backdrop === 'glass' || (home !== null && !picked)
  const setPicked = (preset: ThemeId | null) => setPick({ on: ground, preset })
  const modeDefault = useModePreset()
  const style = useShowcaseLook() ?? DEFAULT_STYLE
  const [rtl, setRtl] = useState(false)
  const [device, setDevice] = useState<IslandDevice>('desktop')
  const [zoom, setZoom] = useState<Zoom>('fit')
  const [motion, setMotion] = useState<PreviewMotion>(DEFAULT_PREVIEW_MOTION)
  const [available, setAvailable] = useState(0)
  const [tallest, setTallest] = useState(720)
  // Full screen: the same preview, frame and settings, filling the window over the page (Escape or the corner key brings it back).
  const [full, setFull] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const [held, setHeld] = useState<number | null>(null)
  // Going in or out, the panel glides between its place on the page and the window (measured before, animated after,
  // on the kit's spring) and the scrim fades; while it shrinks back it stays above the page. Reduced motion: at once.
  const from = useRef<DOMRect | null>(null)
  const scrim = useRef<HTMLDivElement>(null)
  const [leaving, setLeaving] = useState(false)
  const goFull = (next: boolean) => {
    if (next === full) return
    from.current = box.current?.getBoundingClientRect() ?? null
    if (next) setHeld(box.current?.offsetHeight ?? null)
    else setLeaving(!k.reduced)
    setFull(next)
  }
  useLayoutEffect(() => {
    const first = from.current
    from.current = null
    const el = box.current
    if (!first || !el || k.reduced || typeof el.animate !== 'function') return setLeaving(false)
    const last = el.getBoundingClientRect()
    if (!last.width || !last.height) return setLeaving(false)
    const timing = { duration: k.ms('slow'), easing: getComputedStyle(el).getPropertyValue('--ease-spring').trim() || `cubic-bezier(${k.ease('enter').join(',')})` }
    const at = `translate(${first.left - last.left}px, ${first.top - last.top}px) scale(${first.width / last.width}, ${first.height / last.height})`
    const grow = el.animate([{ transformOrigin: '0 0', transform: at }, { transformOrigin: '0 0', transform: 'none' }], timing)
    const fade = scrim.current?.animate([{ opacity: full ? 0 : 1 }, { opacity: full ? 1 : 0 }], { duration: k.ms('base'), easing: 'ease-out', fill: 'forwards' })
    if (!full) Promise.all([grow.finished, fade?.finished]).then(() => setLeaving(false), () => setLeaving(false))
  }, [full])
  useEffect(() => {
    if (!full) return
    const html = document.documentElement
    const overflow = html.style.overflow
    html.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && goFull(false)
    window.addEventListener('keydown', onKey)
    // Keys typed in the block's frame don't reach this window: listen there too (same origin).
    const inner = frame.current?.contentWindow
    inner?.addEventListener('keydown', onKey)
    return () => {
      html.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
      inner?.removeEventListener('keydown', onKey)
    }
  }, [full])
  const sized = usePreviewSize(size)
  // Monochrome (ink as the accent in light) until a preset is picked, as a component page's examples are, bar a story in its theme's colour.
  const sync = useFrameSync(frame, { motion, size: sized.size, preset: picked ?? modeDefault, ink: !picked && !accent, latest: true })
  // The frame's styling for a backdrop follows the ground as the reader picks presets, not only as it loads.
  useEffect(() => {
    try {
      const html = frame.current?.contentDocument?.documentElement
      if (!html?.hasAttribute('data-docs-frame')) return
      html.toggleAttribute('data-docs-bare', (glass || scene !== null) && framing === 'screen')
      html.toggleAttribute('data-docs-backdrop', scene !== null)
    } catch {}
  }, [scene, glass, framing, sync.ready])

  // The second document is fetched once the page has loaded and the stage is near the screen.
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    const el = stage.current
    if (!el || typeof IntersectionObserver === 'undefined') return setArmed(true)
    let cancelled = false
    const arm = () => !cancelled && setArmed(true)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()
        if (document.readyState === 'complete') arm()
        else window.addEventListener('load', arm, { once: true })
      },
      { rootMargin: '200px 0px' },
    )
    observer.observe(el)
    return () => {
      cancelled = true
      observer.disconnect()
      window.removeEventListener('load', arm)
    }
  }, [])

  useEffect(() => {
    const el = stage.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      setAvailable(el.clientWidth)
      // Full screen, the stage is as tall as the window leaves it; on the page, HEIGHT's sum.
      setTallest(full ? el.clientHeight : room())
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [full])

  const { reset, remeasure } = sync

  // A story switch (./block-stories-view, ./story-switch) is double-buffered, so the stage is never empty: the block on
  // show (`front`) stays in its frame, softened under the stage's breathing, while the next one loads in a second frame,
  // hidden, laid out at the same size. Once that one has painted, the stage takes its size (easing there) and the two
  // crossfade, the new block coming into focus over the old, whose frame then goes. Each frame loads once: none is
  // reset, hidden or moved while it's on show. Picking the block on show again brings it back into focus.
  const serial = useRef(0)
  const [front, setFront] = useState<Layer>(() => ({ src, key: `${src}#0` }))
  const [arriving, setArriving] = useState<Layer | null>(null)
  const [incoming, setIncoming] = useState<Layer | null>(null)
  const wanted = src !== (arriving ?? front).src ? src : null
  if ((incoming?.src ?? null) !== wanted) setIncoming(wanted ? { src: wanted, key: `${wanted}#${++serial.current}` } : null)
  // The frame the page talks to (its look, motion and size, and what it reports): the newest.
  const target = incoming ?? arriving ?? front
  const targetKey = `${target.key}-${run}`
  // Which frames have painted: a frame is marked once its ready follows a reset, so an old frame's ready never counts.
  const painted = useRef(new Set<string>())
  const armed_ = useRef<string | null>(null)
  if (!sync.ready) armed_.current = targetKey
  else if (armed_.current === targetKey) painted.current.add(targetKey)
  useEffect(() => {
    if (!painted.current.has(targetKey)) reset()
  }, [targetKey, reset])
  const frontKey = `${front.key}-${run}`
  // Which frames have loaded, so their documents wear the docs' styling and have reported the height it gives them.
  const [loaded, setLoaded] = useState<Record<string, true>>({})
  // The next block has painted and loaded: the stage takes its size first (the old block, softened, keeps its drawing),
  // and once the new one's height has held for a moment in that size the crossfade starts, so it never resizes in view.
  const candidate = incoming && !arriving && painted.current.has(`${incoming.key}-${run}`) && loaded[`${incoming.key}-${run}`] ? incoming : null
  const [released, setReleased] = useState<string | null>(null)
  if (candidate && released !== candidate.key) setReleased(candidate.key)
  const settling = incoming !== null && released === incoming.key
  const waiting = incoming !== null
  // While the next block loads, the stage keeps the size of the one on show.
  const shownGeometry = useRef({ framing, height: sync.height })
  if (!waiting || settling) shownGeometry.current = { framing, height: sync.height }
  const geometry = shownGeometry.current

  // The docs' styling on a frame's document: see-through (styles/site.css `data-docs-frame`) unless the block shows on its
  // own background, bare on glass, its preset's own surfaces on a backdrop.
  const dress = (el: HTMLIFrameElement | null) => {
    if (own) return
    try {
      const html = el?.contentDocument?.documentElement
      html?.setAttribute('data-docs-frame', '')
      html?.toggleAttribute('data-docs-bare', (glass || scene !== null) && framing === 'screen')
      html?.toggleAttribute('data-docs-backdrop', scene !== null)
    } catch {}
  }
  // biome-ignore lint/correctness/useExhaustiveDependencies: as the newest frame paints
  useEffect(() => {
    if (sync.ready) dress(frame.current)
  }, [sync.ready, targetKey])
  const content = useRef<HTMLDivElement>(null)
  const layer = (key: string) => content.current?.querySelector<HTMLIFrameElement>(`iframe[data-layer="${CSS.escape(key)}"]`) ?? null
  const softened = useRef(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: follows the layers, not the clock
  useLayoutEffect(() => {
    const el = layer(front.key)
    if (!el || arriving) return
    if (incoming) {
      soften(el, k, { frame: true })
      softened.current = true
    } else if (softened.current) {
      sharpen(el, k, { frame: true })
      softened.current = false
    }
  }, [incoming?.key, front.key])
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once per crossfade
  useLayoutEffect(() => {
    if (!arriving) return
    const next = layer(arriving.key)
    softened.current = false
    let live = true
    const done = () => {
      if (!live) return
      setFront(arriving)
      setArriving(null)
    }
    if (!next) return done()
    crossfade(next, layer(front.key), k, undefined, { frame: true }).then(done)
    return () => {
      live = false
    }
  }, [arriving?.key])

  // Right to left is the frame's document's own direction (same origin), set again whenever it paints.
  useEffect(() => {
    try {
      const html = frame.current?.contentDocument?.documentElement
      if (html) html.dir = rtl ? 'rtl' : 'ltr'
    } catch {}
  }, [rtl, sync.ready])

  // A picked preset's canvas, read from the frame once it wears it: the stage and the strip under it take it, so the
  // block stands on its own theme's page, as a component page's example does. The site's look is the aurora instead,
  // and a backdrop is its own ground whatever the preset.
  const [canvas, setCanvas] = useState<string | null>(null)
  useEffect(() => {
    const doc = frame.current?.contentDocument
    if (!picked || scene || !sync.ready || !doc?.body) return setCanvas(null)
    let raf = 0
    let tries = 0
    // The frame takes the pick from a message, maybe mid-sweep: wait (a few seconds at most) until its root wears the preset.
    const read = () => {
      if (doc.documentElement.getAttribute('data-yj-theme') !== picked) return void (++tries < 240 && (raf = requestAnimationFrame(read)))
      const probe = doc.createElement('div')
      probe.style.background = 'var(--color-canvas)'
      doc.body.append(probe)
      setCanvas(getComputedStyle(probe).backgroundColor)
      probe.remove()
    }
    raf = requestAnimationFrame(read)
    return () => cancelAnimationFrame(raf)
  }, [picked, scene, sync.ready, modeDefault])
  useEffect(() => {
    const el = panel.current?.querySelector('[data-preview-stage]')
    if (el) panel.current!.style.setProperty('--strip-bg', scene ? 'transparent' : getComputedStyle(el).backgroundColor)
  }, [picked, scene, modeDefault, canvas])

  // A device's width is drawn at the fixed zoom (at Fit, 100%); a desktop block is laid out wider and drawn to fit.
  const width = DEVICE_WIDTH[device]
  const inset = width !== null
  // A section or card on its own background fills the preview edge to edge; a whole screen on its own background (a
  // template) is inset on the stage like anything else, so the preview reads as the frame around it.
  const own = backdrop === 'own'
  const inset_ = own && geometry.framing === 'screen'
  const pad = own && !inset_ ? 0 : PAD
  const inner = available - pad * 2
  const fit = inner >= FIT_MIN ? Math.min(1, inner / FIT_WIDTH) : 1
  const fixed = zoom === 'fit' ? 1 : Number(zoom) / 100
  const base = inset ? fixed : zoom === 'fit' ? fit : fixed
  // The width the block lays out at, which only the device and zoom change.
  const layout = inset ? Math.min(width, inner / fixed) : inner / base
  // A new layout width, or going in or out of full screen, wraps the block anew: its next height replaces the last.
  useEffect(remeasure, [layout, full, remeasure])
  const fitted = geometry.framing !== 'screen'
  // At Fit a section or card taller than the stage is drawn smaller, at the same layout, so it shows whole rather than
  // scrolling; only one that would need less than MIN_SCALE scrolls.
  const reported = geometry.height ?? FITTED_START
  const scale = fitted && zoom === 'fit' ? Math.min(base, Math.max((tallest - pad * 2) / reported, MIN_SCALE)) : base
  const shownWidth = layout * scale
  const screenHeight = Math.ceil(reported * scale)
  // A section or card drawn whole holds still: its frame doesn't scroll (a card's measured box leaves out the empty
  // padding of a page a story wraps it in, which would otherwise scroll a little). One at MIN_SCALE scrolls.
  const whole = fitted && geometry.height !== null && reported * scale <= tallest - pad * 2 + 1
  // biome-ignore lint/correctness/useExhaustiveDependencies: restarts as the next block's height or fit moves
  useEffect(() => {
    if (!candidate || !settling) return
    const timer = setTimeout(() => {
      setArriving(candidate)
      setIncoming(null)
    }, SETTLE_MS)
    return () => clearTimeout(timer)
  }, [candidate?.key, settling, sync.height, whole, scale])
  useEffect(() => {
    try {
      frame.current?.contentDocument?.documentElement.toggleAttribute('data-docs-whole', whole)
    } catch {}
  }, [whole, sync.ready])
  // A screen on a desktop is a laptop's window, FIT_WIDTH × SCREEN_HEIGHT, drawn at the scale (taller ones scroll in it, as in a browser); on a device's width it takes the stage's height.
  const stageHeight = fitted ? `min(${screenHeight + pad * 2}px, ${HEIGHT})` : inset ? HEIGHT : `min(${Math.round(SCREEN_HEIGHT * scale) + pad * 2}px, ${HEIGHT})`
  const copyText = install?.command ?? ''
  // Laid out at the screen's size over the scale, then drawn at the scale from the top left. The block leaving in a
  // crossfade keeps the drawing it had, whatever the stage does around it.
  // Its width is the layout's in px, not a share of the box: the box eases to a new size, and a frame sized from it
  // would lay its block out at the passing widths (another breakpoint, then a jump back).
  const frameStyle: CSSProperties | undefined =
    layout > 0
      ? { width: `${layout}px`, height: fitted ? `${reported}px` : `${100 / scale}%`, ...(scale !== 1 && { transform: `scale(${scale})`, transformOrigin: '0 0' }) }
      : scale === 1
        ? undefined
        : { width: `${100 / scale}%`, height: `${100 / scale}%`, transform: `scale(${scale})`, transformOrigin: '0 0' }
  const frontStyle = useRef(frameStyle)
  const frontBox = useRef<{ w: number; h: number } | null>(null)
  useLayoutEffect(() => {
    if (arriving || settling) return
    const el = layer(front.key)
    if (el) frontBox.current = { w: el.offsetWidth, h: el.offsetHeight }
  })
  if (!arriving && !settling) frontStyle.current = { ...frameStyle, ...(frontBox.current && { width: frontBox.current.w, height: frontBox.current.h }) }
  const frontPainted = painted.current.has(frontKey)
  const layers = [front, arriving, incoming].filter((l): l is Layer => l !== null)

  return (
    // Full screen, the page keeps the preview's place, so nothing below it moves.
    <div className="not-prose my-7" style={full && held ? { height: held } : undefined}>
      {(full || leaving) && <div ref={scrim} aria-hidden className="fixed inset-0 z-50 bg-scrim backdrop-blur-sm" onClick={() => goFull(false)} />}
      {/* No hairline in light: the aurora runs straight into the page. */}
      <div
        ref={box}
        data-preview-box=""
        role={full ? 'dialog' : undefined}
        aria-modal={full || undefined}
        aria-label={full ? `${title}, full screen` : undefined}
        className={cn('preview-box site-card rounded-xl light:border-transparent', full && 'fixed! inset-3 z-50 flex flex-col shadow-2xl', leaving && 'z-50')}
      >
        <div
          ref={panel}
          data-preview-panel=""
          data-site-look={(!picked && (!own || inset_) && !scene) || undefined}
          data-backdrop={scene?.id}
          className={cn('relative', scene && 'isolate', full && 'flex min-h-0 flex-1 flex-col')}
        >
          {/* A backdrop runs behind the stage and the strip under it, as the aurora does; its scene starts with the frame. */}
          {scene && <BackdropLayer id={scene.id} live={armed} className="-z-10" />}
          <div
            ref={stage}
            data-preview-stage=""
            data-site-look={(!picked && (!own || inset_) && !scene) || undefined}
            data-framing={geometry.framing}
            // A block on its own background is the whole preview: no docs stage's least height around it.
            className={cn('relative flex items-center justify-center overflow-hidden', (own || full) && 'min-h-0!', full && 'flex-1', !full && !k.reduced && 'transition-[height] duration-(--yj-duration-slow) ease-spring')}
            style={{ height: full ? undefined : stageHeight, padding: pad, ...(canvas && { backgroundColor: canvas }), ...(scene && { background: 'transparent' }) }}
          >
            <div
              ref={content}
              data-story-content=""
              inert={waiting || undefined}
              className={cn(
                // No screen of its own: the block stands straight on the panel (its document is see-through, styles/site.css `data-docs-frame`).
                'relative max-h-full overflow-hidden',
                // A frosted panel on the aurora (styles/site.css `.block-glass`); a block on its own background runs to the preview's edges.
                // A screen on a mood's backdrop too: its see-through page needs the pane, or it floats raw on the scene.
                (glass || (scene !== null && geometry.framing === 'screen')) && 'block-glass',
                device === 'mobile' ? 'rounded-[22px]' : own && !inset_ ? 'rounded-none' : 'rounded-lg',
                !k.reduced && 'transition-[width,height] duration-(--yj-duration-slow) ease-spring',
              )}
              // A section or card is as tall as it reports (the stage keeps a docs stage's least height around it); a screen fills the stage.
              style={{ width: shownWidth || '100%', height: fitted ? screenHeight : '100%' }}
            >
              {armed &&
                layers.map((l) => {
                  const key = `${l.key}-${run}`
                  const isFront = l === front
                  return (
                    <iframe
                      ref={l === target ? frame : undefined}
                      key={key}
                      data-layer={l.key}
                      src={l.src}
                      loading="lazy"
                      title={`${title} preview`}
                      aria-hidden={l !== target || undefined}
                      tabIndex={l !== target ? -1 : undefined}
                      // See-through (styles/site.css `data-docs-frame`), unless the block shows on its own background.
                      onLoad={(event) => {
                        dress(event.currentTarget)
                        // The docs' styling can change the block's height (trimmed padding), so its next height replaces the last.
                        if (l === target) remeasure()
                        setLoaded((was) => ({ ...was, [key]: true }))
                      }}
                      style={isFront && (arriving || settling) ? frontStyle.current : frameStyle}
                      className={cn(
                        'absolute top-0 left-0 size-full',
                        // The first block (and a reload) fades in once painted; a next one stays unseen until its crossfade.
                        isFront ? cn('transition-opacity duration-(--yj-duration-slow) ease-enter', frontPainted ? 'opacity-100' : 'opacity-0') : l === arriving ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  )
                })}
              {!frontPainted && !arriving && !incoming && (
                <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
                  <span className="type-small text-fg-subtle">Loading {title}…</span>
                </div>
              )}
            </div>
            {/* A story on its way: the stage breathes over the softened block until it's here (styles/site.css; none under reduced motion). */}
            <div aria-hidden className="story-breath" data-on={(waiting && !k.reduced) || undefined} />
          </div>
          <ActionIsland aria-label={`${title}: stage controls`} data-stage-corner="" className="stage-corner absolute end-3 top-3 z-10 border-0 bg-transparent p-0 shadow-none">
            <ActionIslandTile label={full ? 'Exit full screen' : 'Full screen'} side="bottom" aria-pressed={full} onClick={() => goFull(!full)}>
              {full ? <MinimizeIcon size={16} strokeWidth={1.75} /> : <MaximizeIcon size={16} strokeWidth={1.75} />}
            </ActionIslandTile>
          </ActionIsland>
          <div className="island-dock">
            <PreviewIsland
              label={`${title}: preview controls`}
              bare
              story={{ ...story, named: true, pending: waiting }}
              appearance={{
                preset: picked ?? modeDefault ?? SITE_PRESET.dark,
                onPreset: setPicked,
                site: { active: !picked, onSelect: () => setPicked(null) },
                style,
                onLook: setPreviewLook,
                dark: modeDefault !== SITE_PRESET.light,
                dir: rtl ? 'rtl' : 'ltr',
                onDir: (dir) => setRtl(dir === 'rtl'),
              }}
              device={{ value: device, onChange: setDevice }}
              zoom={{ value: zoom, onChange: setZoom, fit: Math.round((inset ? 1 : fit) * 100) }}
              reload={{ label: 'Reload', onClick: replay }}
              extra={(live) => <MotionSizeTile size={sized.fallback} motion={motion} onMotion={setMotion} changed={sized.changed || motion.speed !== 1 || motion.reduced} disabled={!live} />}
              copy={{ label: 'Copy the install command', text: copyText, done: 'Command copied', disabled: !copyText }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
