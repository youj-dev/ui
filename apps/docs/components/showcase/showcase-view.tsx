'use client'

import { lazy, Suspense, useEffect, useState, type ComponentProps, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DEFAULT_LOOK, YoujProvider, ThemeScope } from '@youj/core'
import { styleById } from '@youj/core/lib/youj/theme'
import type { NeutralPage } from '@youj/core/lib/youj/theme'
import { SettledEntrances } from '@youj/motion'
import { TooltipProvider } from '@youj/react/components/ui/tooltip'
import { sitePreset } from '@/lib/preview'
import { useThemeFonts } from '@youj/react/docs/create/load-fonts'
import { showcase } from '@/generated/showcase'
import { readFrameMessage, useFrameState, type FrameState } from '@/lib/frame-sync'
import { applyPreset } from '@/lib/site-preset'
import { useModePreset } from '@/lib/site-theme'
import type { Framing } from '@/lib/showcase'
import { KindStage, useStageHeight } from './kind-stage'
import { renderStory, type StoryModule } from './render-story'
import { entranceFromQuery } from '@/components/site/ui-generation/opt-in'
import { codeUrl } from '@/lib/code-url'

// Only a demo that builds in loads the wrapper (components/site/ui-generation): every other /view page carries none of it.
const Generated = lazy(() => import('@/components/site/ui-generation/generated').then((m) => ({ default: m.Generated })))

/** How long a framed demo waits for the page's theme before it shows with the stored one. */
const THEME_WAIT = 1500

/**
 * A block or example on its own page, with no site chrome: what the docs'
 * frames load in an iframe, so the demo's breakpoints answer to the frame's
 * width. `?story=<Export>` picks one of its stories. In a frame, the page
 * sends the site's mode, the frame's motion and the look to show the demo in
 * (lib/frame-sync), live: the demo waits a moment for the first message, so
 * it never paints in a stale theme, then tells the page it has painted.
 * `themed` says the demo takes a `theme` prop over its own ThemeScope, which
 * is how it's re-themed; anything else follows the document's preset. `page`
 * is the item's light page (lib/showcase): a website's demo is set on a white
 * one, an app's on the preset's gray. Opened on its own (or never answered),
 * the demo takes the site's preset for the mode, as its page would send. The
 * preset's web fonts from the catalog load in the frame's own document.
 * `framing` (lib/showcase) sets the stage: a page fills the viewport, a
 * section or a card sits on a stage as tall as it is (./kind-stage) and
 * tells its frame that height.
 */
export function ShowcaseView(props: ComponentProps<typeof Demo>) {
  // Framed (a list's tile, the viewer, a docs frame, the capture), the demo; opened on its own, the full-page preview around a frame of it.
  const [top, setTop] = useState<boolean | null>(null)
  useEffect(() => setTop(window.parent === window), [])
  if (top === null) return <Centered aria-busy>Loading…</Centered>
  if (top)
    return (
      <Suspense fallback={<Centered aria-busy>Loading…</Centered>}>
        <FullPreview id={props.id} />
      </Suspense>
    )
  return <Demo {...props} />
}

/** The full-page preview (./full-preview): a chunk of its own, so a frame never loads it. */
const FullPreview = lazy(() => import('./full-preview').then((m) => ({ default: m.FullPreview })))

function Demo({
  id,
  themed,
  page,
  framing = 'screen',
  stories = [],
  demos = false,
  build = false,
  code,
}: {
  id: string
  themed: boolean
  page: NeutralPage
  framing?: Framing
  stories?: string[]
  /** A component's view: its stories are its docs page's examples (`button/sizes`), each a module of its own, the first its main demo. */
  demos?: boolean
  /** It builds in each time it opens (components/site/ui-generation/built-blocks.ts). */
  build?: boolean
  /** Where a block's or example's main file is published (lib/code-url.ts), for the Code entrance; a component's is its story's. */
  code?: string
}) {
  const params = useSearchParams()
  // Blocks never play an entrance on the site (settled below); only a component's demo takes `?generate=`.
  const entranceAsked = demos ? entranceFromQuery(params) : null
  const generate = entranceAsked === 'generate'
  // `?generate=1`: its dialogs and popovers build in as they open too
  useEffect(() => {
    if (!generate) return
    let stop: (() => void) | undefined
    let gone = false
    void import('@/components/site/ui-generation/overlays').then((m) => {
      if (!gone) stop = m.watchOverlays()
    })
    return () => {
      gone = true
      stop?.()
    }
  }, [generate])
  // An unknown or missing story is the file's first, the one the gallery shows and the copied default matches (a module's keys come sorted, not in file order).
  const asked = params.get('story') ?? undefined
  const story = asked && stories.includes(asked) ? asked : (stories[0] ?? asked)
  // The frame's Illustration picker: a scene id for the demo's `illustration` slot.
  const illustration = params.get('illustration') ?? undefined
  // The module on show, and which load it came from (a component's other example is a module of its own).
  const [loaded, setLoaded] = useState<{ key: string; mod: StoryModule }>()
  const mod = loaded?.mod
  const [failed, setFailed] = useState(false)
  const frame = useFrameState(page)
  const [gaveUp, setGaveUp] = useState(false)
  const modePreset = useModePreset()
  const shown = Boolean(mod && (!frame.framed || frame.state || gaveUp))
  useStageHeight(framing, shown && frame.framed ? frame.size : null)
  useThemeFonts(frame.state ? sitePreset(frame.state.preset, 'gray', false, false, frame.state.style).fonts : undefined)

  // On its own, or in a frame whose page never answered: the mode's preset on the item's page, as its page would send.
  useEffect(() => {
    if (frame.state || !modePreset || (window.parent !== window && !gaveUp)) return
    applyPreset(document.documentElement, modePreset, page)
  }, [frame.state, gaveUp, modePreset, page])

  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are chosen by hand
  useEffect(() => {
    let live = true
    if (window.self !== window.top) keepFocusInFrame()
    // A component's other examples are a generated file of their own, fetched only when one is asked for.
    const other = demos && story && story !== stories[0] ? story : undefined
    const load = other ? () => import('@/generated/demos').then((m) => m.demos[other]!()) : showcase[id]
    if (!load) return setFailed(true)
    load().then(
      (m) => live && setLoaded({ key: `${id}|${other ?? ''}`, mod: m as StoryModule }),
      () => live && setFailed(true),
    )
    return () => {
      live = false
    }
    // `stories` is the page's own, fixed for its id.
  }, [id, demos, story])

  // The item viewer keeps one frame and moves it between items and stories in place, so the runtime loads once (components/showcase/viewer-frame).
  const router = useRouter()
  useEffect(() => {
    if (window.parent === window) return
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return
      const message = readFrameMessage(event.data)
      if (message?.kind === 'go') router.replace(message.href, { scroll: false })
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [router])

  // A page that never answers (an old tab, a blocked message) doesn't hold the demo back for long.
  useEffect(() => {
    if (!frame.framed || frame.state) return
    const timer = setTimeout(() => setGaveUp(true), THEME_WAIT)
    return () => clearTimeout(timer)
  }, [frame.framed, frame.state])

  if (failed) return <Centered>This demo couldn’t load.</Centered>
  if (!mod || (frame.framed && !frame.state && !gaveUp)) return <Centered aria-busy>Loading…</Centered>
  const demo = (
    <FrameMotion state={frame.state} page={page} settled={!demos}>
      {/* A new story paints anew, so it says so: a block's at once, a component's example once its module is here. */}
      <Story key={demos ? loaded!.key : `${loaded!.key}|${story}`} mod={mod} story={demos ? undefined : story} theme={themed ? (frame.state?.preset ?? null) : null} styleId={frame.state?.style ?? null} ink={frame.state?.ink ?? false} page={page} illustration={illustration} onPaint={frame.ready} />
    </FrameMotion>
  )
  // A block opted in (components/site/ui-generation), or any with `?generate=1` (passed on by the docs page's frame), builds in.
  const shown$ = entranceAsked || (build && demos) ? (
    <Suspense fallback={null}>
      <Generated name={id} code={demos && story ? codeUrl.example(story) : code} entrance={entranceAsked ?? 'generate'} className={framing === 'screen' ? 'flex flex-1 flex-col' : undefined}>
        {demo}
      </Generated>
    </Suspense>
  ) : (
    demo
  )
  if (framing !== 'screen') return <KindStage framing={framing}>{shown$}</KindStage>
  return <div className="flex min-h-dvh flex-1 flex-col">{shown$}</div>
}

/**
 * The page's palette and style for the demo (the style brings its look), and the frame's speed
 * and reduced motion. The
 * style is always written: this document's root is the site's, which is
 * Classic, so a demo opened on its own (or whose page never answers) is set
 * in the kit's default, Classic, as the gallery's captures are. A block is at
 * the standard size, the provider's own, until the frame's Size control sends
 * another.
 */
function FrameMotion({ state, page, settled, children }: { state: FrameState | null; page: NeutralPage; settled: boolean; children: ReactNode }) {
  if (settled) children = <SettledEntrances>{children}</SettledEntrances>
  const size = state?.size
  // The demo's tooltips group as they would under an app's provider (the site has none at its root).
  if (!state)
    return (
      <ThemeScope look={DEFAULT_LOOK} {...size}>
        <TooltipProvider>{children}</TooltipProvider>
      </ThemeScope>
    )
  return (
    <YoujProvider theme={sitePreset(state.preset, page, false, state.ink, state.style)} timeScale={1 / state.speed} reducedMotion={state.reduced ? 'always' : 'user'} look={styleById(state.style).look} {...size}>
      <TooltipProvider>{children}</TooltipProvider>
    </YoujProvider>
  )
}

/**
 * Its own component: a story's `render` may call hooks, which then belong
 * here, not to the loader above. `theme` re-themes the demo (its `theme`
 * prop, on the item's `page`: that palette in `styleId`, which reaches a scope the item nests) and `illustration` fills its illustration slot;
 * `onPaint` runs once its first frame is on screen.
 */
function Story({
  mod,
  story,
  theme,
  styleId,
  ink,
  page,
  illustration,
  onPaint,
}: {
  mod: StoryModule
  story: string | undefined
  theme: string | null
  styleId: string | null
  /** The docs' monochrome look on that theme. */
  ink: boolean
  page: NeutralPage
  illustration: string | undefined
  onPaint: () => void
}) {
  useEffect(() => {
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(onPaint)
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [onPaint])
  return renderStory(mod, story, { ...(theme ? { theme: sitePreset(theme, page, false, ink, styleId) } : null), ...(illustration ? { illustration } : null) })
}

/**
 * Focus inside an iframe scrolls the page around it to the frame. A demo that
 * focuses a field on mount shouldn't move the docs page, so until the reader
 * first touches the demo, focus defaults to `preventScroll`. After that, focus
 * behaves normally (a form can still scroll to its first error).
 */
function keepFocusInFrame() {
  const proto = HTMLElement.prototype
  const focus = proto.focus
  if ((focus as { framed?: boolean }).framed) return
  const quiet = Object.assign(
    function (this: HTMLElement, options?: FocusOptions) {
      focus.call(this, { preventScroll: true, ...options })
    },
    { framed: true },
  )
  proto.focus = quiet
  const restore = () => {
    if (proto.focus === quiet) proto.focus = focus
  }
  window.addEventListener('pointerdown', restore, { once: true, capture: true })
  window.addEventListener('keydown', restore, { once: true, capture: true })
}

function Centered({ children, ...props }: { children: ReactNode; 'aria-busy'?: boolean }) {
  return (
    <div {...props} className="grid min-h-dvh flex-1 place-items-center text-ui text-fg-muted">
      {children}
    </div>
  )
}
