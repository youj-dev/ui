'use client'

import { usePathname } from 'next/navigation'
import { Component, lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { MaximizeIcon } from '@youj/icons'
import { YoujProvider, useYouj } from '@youj/core'
import type { Youj } from '@youj/core/lib/youj/provider'
import { DEFAULT_STYLE, styleById } from '@youj/core/lib/youj/theme'
import type { InternalThemeId as ThemeId } from '@youj/core/lib/youj/theme'
import { ActionIsland, ActionIslandTile } from '@youj/react/components/ui/action-island'
import { TooltipProvider } from '@youj/react/components/ui/tooltip'
import { useThemeFonts } from '@youj/react/docs/create/load-fonts'
import { examples } from '@/examples'
import { inertDemoLink } from '@/components/docs/inert-links'
import { SPEED_LABEL } from '@/components/ui/preview-controls'
import { DeviceMenu, MotionSizeTile, PreviewIsland } from '@/components/showcase/preview-island'
import { cn } from '@/lib/cn'
import { codeUrl, loadCode, prefetchCode } from '@/lib/code-load'
import { useDemoToaster } from '@/lib/demo-toasters'
import { setPreviewDevice, useDevicePreview } from '@/lib/device-preview'
import { DEFAULT_PREVIEW_MOTION, ROOMY_SIZE, STAGE_CAP, sitePreset, stageBox, stageCapped, type PreviewMotion } from '@/lib/preview'
import { usePreviewSize } from '@/lib/preview-size'
import { SITE_PRESET } from '@/lib/site-mode'
import { useDevTheme } from '@/lib/dev-theme-signal'
import { useModePreset } from '@/lib/site-theme'
import { setPreviewLook, useShowcaseLook } from '@/lib/showcase-theme'
import type { PreviewFrameProps } from './preview-frame'
import { backdropForPreset } from '@/lib/backdrops'
import { observeScroll } from '@/lib/observe-scroll'
import { crossfade, whenIdle } from './story-switch'
import { Generated } from '@/components/site/ui-generation/generated'
import { GENERATED, useEntranceId, useGenerateOverlays } from '@/components/site/ui-generation/opt-in'

/** A scrollable stage's edge fades: which sides have more to scroll to (the CSS in styles/site.css draws them). */
function useScrollFade() {
  const [node, setNode] = useState<HTMLElement | null>(null)
  useEffect(() => {
    if (!node) return
    const update = () => {
      const max = node.scrollWidth - node.clientWidth
      const at = Math.abs(node.scrollLeft)
      const fade = max > 1 ? `${at > 1 ? 'start ' : ''}${at < max - 1 ? 'end' : ''}`.trim() : ''
      if (fade) node.dataset.fade = fade
      else delete node.dataset.fade
    }
    return observeScroll(node, update, true)
  }, [node])
  return setNode
}

/** Whether a capped stage's scroller has more below its foot (the fade and the keyboard stop follow it) or any overflow at all. */
function useScrollMore(node: HTMLElement | null, on: boolean) {
  const [state, setState] = useState({ more: false, scrolls: false })
  useEffect(() => {
    if (!node || !on) return
    const update = () => {
      const left = node.scrollHeight - node.clientHeight
      const next = { more: left - node.scrollTop > 1, scrolls: left > 1 }
      setState((prev) => (prev.more === next.more && prev.scrolls === next.scrolls ? prev : next))
    }
    return observeScroll(node, update, true)
  }, [node, on])
  return state
}

/** Whether an element paints its own surface (a card, a panel, a table): any background that isn't transparent. */
const paints = (el: Element) => {
  const bg = getComputedStyle(el).backgroundColor
  return bg !== 'transparent' && !/rgba?\([^)]*,\s*0\)$/.test(bg) && !/ \/ 0\)$/.test(bg)
}

/**
 * Every demo sits on a container of its own: a demo whose root already paints a surface (a card, a dialog, a
 * table) shows as it is, and a bare one (a field, a radio group, a range) gets a plate behind it, the theme's card
 * on a hairline, so no control floats on the stage's grid. The plate is drawn behind the demo at its measured box
 * plus a margin, so the demo lays out exactly as it would without one.
 */
function Plate({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const resize = new ResizeObserver(() => measure())
    const measure = () => {
      // An entrance's wrapper (<Generated>, data-generated) is no demo of its own: the demo inside it is. While its build
      // (or its Code run) is under way the demo's paint sits on the entrance's layer, and while a Generate,
      // a Blueprint, an Inspector, Layers or Render passes runs it is clipped or held, so the answer waits for their layers to go.
      const hosts = Array.from(el.querySelectorAll(':scope > [data-generated]'))
      if (hosts.some((h) => h.querySelector(':scope > .t-code-under, :scope > [data-yj-generate], :scope > [data-yj-inspector], :scope > [data-yj-layers], :scope > [data-yj-passes]'))) return
      const kids = Array.from(el.children).flatMap((k) =>
        k.hasAttribute('data-plate') ? [] : k.hasAttribute('data-generated') ? Array.from(k.children).filter((c) => !c.matches('.t-code-under, [data-yj-generate], [data-yj-blueprint], .yj-en')) : [k],
      ) as HTMLElement[]
      if (!kids.length || (kids.length === 1 && paints(kids[0]!))) return setRect(null)
      // The content's extent, not the root's box: a full-width root (w-full) holding a narrow field gets a plate
      // the field's size. A single root is measured by its children; several roots by themselves. A lone control
      // (a trigger button) is its own extent: its children are only its icon.
      const lone = kids.length === 1 && !kids[0]!.matches('button, a, input, select, textarea')
      const parts = lone && kids[0]!.children.length ? Array.from(kids[0]!.children) : kids
      const base = el.getBoundingClientRect()
      // Skip what isn't laid out with the demo: a form control's hidden input (Base UI pins one `fixed` at the
      // viewport's corner) and visually hidden text, which would stretch the plate off the stage.
      const rects = parts
        .filter((k) => getComputedStyle(k).position !== 'fixed')
        .map((k) => k.getBoundingClientRect())
        .filter((r) => r.width > 1 && r.height > 1)
      if (!rects.length) return setRect(null)
      const left = Math.min(...rects.map((r) => r.left)) - base.left
      const top = Math.min(...rects.map((r) => r.top)) - base.top
      const right = Math.max(...rects.map((r) => r.right)) - base.left
      const bottom = Math.max(...rects.map((r) => r.bottom)) - base.top
      setRect({ x: left, y: top, w: right - left, h: bottom - top })
      kids.forEach((k) => resize.observe(k))
    }
    measure()
    resize.observe(el)
    const mutation = new MutationObserver(measure)
    mutation.observe(el, { childList: true })
    for (const host of el.querySelectorAll(':scope > [data-generated]')) mutation.observe(host, { childList: true })
    return () => {
      mutation.disconnect()
      resize.disconnect()
    }
  }, [])
  return (
    <div ref={box} className="preview-plate">
      {rect && (
        <div
          aria-hidden
          data-plate=""
          className="preview-plate-card"
          style={{ left: rect.x - 24, top: rect.y - 24, width: rect.w + 48, height: rect.h + 48 }}
        />
      )}
      {children}
    </div>
  )
}

/**
 * A story switch's crossfade (./story-switch): just before the new story's demo replaces the old one in the stage, a
 * snapshot of the old one (as softened as it stands) is laid over the stage, so there's never a frame without a demo;
 * once the new one has painted it comes into focus while the snapshot fades away above it.
 */
class StoryCrossfade extends Component<{ name: string; stage: RefObject<HTMLDivElement | null>; k: Youj; children: ReactNode }> {
  getSnapshotBeforeUpdate(prev: { name: string }) {
    const stage = this.props.stage.current
    const content = prev.name !== this.props.name ? stage?.querySelector<HTMLElement>(':scope > .stage-scroll, :scope > [data-phone]') : null
    if (!stage || !content || typeof content.animate !== 'function') return null
    const style = getComputedStyle(content)
    const snapshot = content.cloneNode(true) as HTMLElement
    Object.assign(snapshot.style, {
      position: 'absolute',
      left: `${content.offsetLeft}px`,
      top: `${content.offsetTop}px`,
      width: `${content.offsetWidth}px`,
      height: `${content.offsetHeight}px`,
      margin: '0',
      flex: 'none',
      pointerEvents: 'none',
      opacity: style.opacity,
      filter: style.filter,
      transform: style.transform,
    })
    snapshot.setAttribute('aria-hidden', 'true')
    snapshot.inert = true
    snapshot.removeAttribute('id')
    snapshot.dataset.storyLeaving = ''
    return { snapshot, scrollLeft: content.scrollLeft, scrollTop: content.scrollTop }
  }
  componentDidUpdate(_: unknown, __: unknown, taken: { snapshot: HTMLElement; scrollLeft: number; scrollTop: number } | null) {
    const stage = this.props.stage.current
    if (!taken || !stage) return
    const { snapshot } = taken
    // A snapshot a quicker switch left behind goes now; this one shows where the old demo stood.
    for (const old of stage.querySelectorAll(':scope > [data-story-leaving]')) old.remove()
    stage.append(snapshot)
    snapshot.scrollLeft = taken.scrollLeft
    snapshot.scrollTop = taken.scrollTop
    const content = stage.querySelector<HTMLElement>(':scope > .stage-scroll, :scope > [data-phone]')
    if (content) crossfade(content, snapshot, this.props.k, () => snapshot.remove())
    else snapshot.remove()
  }
  render() {
    return this.props.children
  }
}

export interface PreviewLiveProps extends Pick<PreviewFrameProps, 'name' | 'file' | 'full' | 'height' | 'reserve' | 'view' | 'story'> {
  /** The frame's id base. */
  id: string
}

/** A preset's backdrop (WebGL or a photo): a chunk of its own, loaded only when a reader picks a preset that has one. */
const BackdropLayer = lazy(() => import('./backdrop-layer').then((m) => ({ default: m.BackdropLayer })))

/** The code modal: a chunk of its own, loaded the first time Code is pressed. */
const CodeDialog = lazy(() => import('./example-code-dialog'))

/**
 * The live half of a docs example: the stage with its demo, and the island of
 * controls the site's previews share (components/showcase/preview-island),
 * which preview-frame.tsx loads as a chunk of its own when a reader nears the
 * example, so a page's JavaScript and hydration carry only the examples being
 * read. It takes the place of the frame's static stage. Every example has its
 * own island, in a strip of its own under the stage, on the stage's colour
 * (styles/site.css, .island-dock): the aurora runs behind both in the site's
 * look, and the strip takes the stage's plain canvas otherwise.
 *
 * The stage runs inside its own YoujProvider, so the island changes it and
 * nothing else: the preset it wears (the site's for the mode, Graphite in
 * light and Basalt in dark, until one is picked; the stage's canvas wears it
 * too), the component style it's built in (Clean, the kit's default, or
 * any other), its direction (right to left as an Arabic or Hebrew app would:
 * sides, arrow keys, overlays and directional motion mirror), its device
 * (Desktop is a pointer; Mobile is touch, drawn as a 393 × 852 phone on a pointer
 * screen), and, under Motion and size, its size (a layout density and UI
 * scale, the reader's pick shared by every preview, roomy at 100% until then;
 * lib/preview-size) and its motion: a speed that scales every duration,
 * spring and loop in the demo, or the designed reduced-motion state, which the
 * OS's setting also brings. Light or dark is the site's. Changing the motion
 * (or Replay) remounts the demo so its entrance plays again under it; a new
 * preset or style re-renders it in place.
 */
export function PreviewLive({ name, file, full = false, height = 320, reserve, view, story, id }: PreviewLiveProps) {
  // One of the few very tall demos (STAGE_CAP_FROM) shows at STAGE_CAP and scrolls inside it, with an Expand to its full page.
  const capped = !!view && stageCapped(reserve)
  // The shell's box, so the stage keeps the size it had before the demo arrived.
  const stage = stageBox(height, reserve, capped)
  const [picked, setPicked] = useState<ThemeId | null>(null)
  // The style is the reader's, remembered across previews, pages and visits (lib/showcase-theme); this mounts after hydration, so it never flashes the default first.
  const style = useShowcaseLook() ?? DEFAULT_STYLE
  const [motion, setMotion] = useState<PreviewMotion>(DEFAULT_PREVIEW_MOTION)
  const [run, setRun] = useState(0)
  // The run (and demo) the reader asked to see arrive with their Entrance pick: a pick or a Replay plays it once; a
  // page, a story or a scroll past a preview just shows the demo.
  const [armed, setArmed] = useState<{ run: number; name: string } | null>(null)
  const [rtl, setRtl] = useState(false)
  // The site's clock: reduced motion from the OS.
  const site = useYouj()
  const { speed } = motion
  const still = motion.reduced || site.reduced
  // Until one is picked the stage follows the site's mode. Its theme is set once the mode is known (before that, the server's render, it inherits <html>'s stylesheet), so a light visit never flashes Basalt.
  const modeDefault = useModePreset()
  const preset = picked ?? modeDefault
  // The dev colour panel's look, while it's open and nothing was picked here: the example wears what the page does.
  const devTheme = useDevTheme()
  // In the docs an example the reader hasn't re-themed is monochrome in light (black buttons, switches, tabs).
  const pathname = usePathname()
  const ink = !picked && (pathname?.startsWith('/docs') ?? false)
  const theme = !picked && devTheme ? devTheme : preset ? sitePreset(preset, 'gray', !picked, ink, style) : undefined
  // The reader's Size pick, shared by every preview; a component's demo is roomy at 100% until then.
  const { size, changed: resized } = usePreviewSize(ROOMY_SIZE)
  useThemeFonts(theme?.fonts)
  // A demo with its own Toaster sends the site's away while it's here (lib/demo-toasters.ts).
  useDemoToaster(name)
  const entranceId = useEntranceId()
  useGenerateOverlays(entranceId === 'generate')
  const Example = examples[name]
  if (!Example) throw new Error(`No example registered as "${name}" in examples/index.tsx`)
  // A few examples arrive with an entrance of their own (components/site/ui-generation); the reader's pick plays on any
  // other only when asked for (a pick in the Entrance menu, or Replay).
  const asked = armed?.run === run && armed.name === name
  const generation = GENERATED.get(name) ?? (asked && entranceId !== 'none' ? entranceId : undefined)
  const demo = generation ? (
    <Generated name={name} entrance={generation} still={still} speed={speed}>
      <Example />
    </Generated>
  ) : (
    <Example />
  )
  // Pointer or touch: the reader's pick, else the hardware's. Touch on a screen with a mouse is drawn as a phone.
  const preview = useDevicePreview()
  // An example with a full page (a large one, ComponentPreview's ROOMY: a data table, a grid, a board) shows on the reader's own
  // device and offers Expand instead, since a phone can't show how it works; every other example offers the phone.
  const { device, hardware, phone: asPhone } = view ? { ...preview, device: preview.hardware, phone: false } : preview
  // The phone's screen is held in state so the provider can portal the demo's sheets, menus and dialogs into it.
  const [screen, setScreen] = useState<HTMLElement | null>(null)
  const fade = useScrollFade()
  const [region, setRegion] = useState<HTMLElement | null>(null)
  const scroller = useCallback(
    (node: HTMLElement | null) => {
      fade(node)
      setRegion(node)
    },
    [fade],
  )
  const { more, scrolls } = useScrollMore(region, capped)
  // Replay plays the demo again, with the reader's Entrance pick if there is one.
  const replay = useCallback(() => {
    setArmed({ run: run + 1, name })
    setRun(run + 1)
  }, [run, name])
  const copyText = useCallback(async () => (await loadCode(codeUrl.example(name))).code, [name])
  // Code opens the site's code modal; focus comes back to the island's Code tile.
  const [codeOpen, setCodeOpen] = useState(false)
  // Mounted from its first open on, so closing it plays its exit rather than removing it at once.
  const [codeMounted, setCodeMounted] = useState(false)
  if (codeOpen && !codeMounted) setCodeMounted(true)
  const codeTile = useRef<HTMLButtonElement>(null)

  // A preset with a backdrop (lib/backdrops) brings it: the stage and the strip stand on its ground, as a block's do.
  const scene = backdropForPreset(picked)
  // The strip under the stage wears the stage's canvas (the preset's, once one is picked); the aurora is the panel's, behind both.
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const stageEl = panel.current?.querySelector('[data-preview-stage]')
    if (stageEl) panel.current!.style.setProperty('--strip-bg', scene ? 'transparent' : getComputedStyle(stageEl).backgroundColor)
  }, [theme, modeDefault, picked, scene])
  const tuned = resized || speed !== 1 || motion.reduced

  // A Device switch moves rather than cuts: the stage eases to its new height while the new layout (the phone, or the
  // stage's own width) settles in on the kit's spring. The demo remounts into it, so the frame scales and fades in
  // rather than morphing. A new story (the page's Story menu) eases the height the same way while it crossfades with
  // the old one (StoryCrossfade). Reduced motion (the site's): at once, a story with a plain crossfade.
  const stageRef = useRef<HTMLDivElement>(null)
  const shown = useRef(asPhone ? 'phone' : device)
  const shownName = useRef(name)
  // The stage's settled height (while it eases, the one it's easing to), as of the last render.
  const settled = useRef<{ height: number; easing?: Animation }>({ height: 0 })
  useLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return
    const easing = settled.current.easing?.playState === 'running' ? settled.current.easing : undefined
    const now = asPhone ? 'phone' : device
    if (shown.current === now && shownName.current === name) {
      if (!easing) settled.current.height = el.offsetHeight
      return
    }
    const storyOnly = shown.current === now
    shown.current = now
    shownName.current = name
    // From where it stands (mid-ease, when a switch interrupts one) to its new height.
    const from = easing ? el.offsetHeight : settled.current.height
    easing?.cancel()
    const to = el.offsetHeight
    settled.current.height = to
    const content = el.querySelector<HTMLElement>(asPhone ? '[data-phone]' : '.stage-scroll')
    if (site.reduced || !content || typeof el.animate !== 'function') return
    const options = {
      duration: site.ms('slow'),
      easing: getComputedStyle(el).getPropertyValue('--ease-spring') || `cubic-bezier(${site.ease('enter').join(',')})`,
    }
    if (from && from !== to) settled.current.easing = el.animate([{ height: `${from}px` }, { height: `${to}px` }], options)
    if (storyOnly) return
    content.animate(
      asPhone ? [{ transform: 'translateY(1.5rem) scale(0.92)' }, { transform: 'none' }] : [{ transform: 'scale(0.97)' }, { transform: 'none' }],
      options,
    )
    content.animate(
      [
        { opacity: 0, filter: 'blur(6px)' },
        { opacity: 1, filter: 'none' },
      ],
      { duration: site.ms('base'), easing: `cubic-bezier(${site.ease('enter').join(',')})` },
    )
  })

  // Once live, what the reader is likely to pick next loads at idle (a story page's neighbours).
  const onIdle = story?.onIdle
  // biome-ignore lint/correctness/useExhaustiveDependencies: once per story on show, not per render's new callback
  useEffect(() => (onIdle ? whenIdle(onIdle) : undefined), [name])

  const island = (
    <div className="island-dock">
      <PreviewIsland
        label={`${file}: preview controls`}
        bare
        // A story page shows its code in its own Code tab, so its island has no Code key.
        code={story ? undefined : { onOpen: () => setCodeOpen(true), tileRef: codeTile, onIntent: () => prefetchCode(codeUrl.example(name)) }}
        story={story}
        appearance={{
          preset: preset ?? SITE_PRESET.dark,
          onPreset: setPicked,
          site: { active: !picked, onSelect: () => setPicked(null) },
          style,
          onLook: setPreviewLook,
          dark: modeDefault !== SITE_PRESET.light,
          dir: rtl ? 'rtl' : 'ltr',
          onDir: (dir) => setRtl(dir === 'rtl'),
        }}
        entrance={{ onPick: replay }}
        reload={{ label: 'Replay', onClick: replay }}
        extra={(live) => <MotionSizeTile size={ROOMY_SIZE} motion={motion} onMotion={setMotion} changed={tuned} disabled={!live} />}
        copy={{ label: 'Copy the code', text: copyText, done: 'Code copied', icon: 'copy' }}
      />
    </div>
  )

  // The stage's frame, in its top corner: a large example's way to its full page, any other's device (desktop or phone).
  // Their tooltips open downward.
  const corner = (
    <ActionIsland
      aria-label={`${file}: stage controls`}
      data-stage-corner=""
      className="stage-corner absolute end-3 top-3 z-10 border-0 bg-transparent p-0 shadow-none"
    >
      {view ? (
        <ActionIslandTile label="Open as a full page" side="bottom" render={<a href={view} />}>
          <MaximizeIcon size={16} strokeWidth={1.75} />
        </ActionIslandTile>
      ) : (
        <DeviceMenu
          device={{ value: device === 'touch' ? 'mobile' : 'desktop', onChange: (d) => setPreviewDevice(d === 'mobile' ? 'touch' : 'pointer') }}
          devices={['desktop', 'mobile']}
          disabled={false}
          side="bottom"
        />
      )}
    </ActionIsland>
  )

  return (
    <>
      {codeMounted && (
        <Suspense fallback={null}>
          <CodeDialog name={name} file={file} open={codeOpen} onOpenChange={setCodeOpen} finalFocus={codeTile} />
        </Suspense>
      )}
      <div
        ref={panel}
        id={`${id}-panel-preview`}
        data-preview-panel=""
        data-site-look={!picked || undefined}
        data-backdrop={scene?.id}
        className={cn('relative', scene && 'isolate')}
      >
        {scene && (
          <Suspense fallback={null}>
            <BackdropLayer id={scene.id} className="-z-10" />
          </Suspense>
        )}
        {/* The preset reaches the stage's canvas and type too, so the demo reads as it would in an app themed with it. The device is the reader's: forced where it differs from the hardware, and a phone's screen is where touch-mode overlays portal to. */}
        <YoujProvider
          theme={theme}
          timeScale={site.timeScale / speed}
          reducedMotion={still ? 'always' : 'user'}
          look={styleById(style).look}
          density={size.density}
          scaling={size.scaling}
          device={device === hardware ? 'auto' : device}
          portalContainer={asPhone ? screen : undefined}
          dir={rtl ? 'rtl' : 'ltr'}
        >
          {/* The demo's tooltips group as they would under an app's provider (the site has none at its root). */}
          <TooltipProvider>
            <div
              ref={stageRef}
              data-preview-stage=""
              // The site's own look (monochrome on the aurora) until a preset is picked; a picked one shows plain, so its changes read.
              data-site-look={!picked || undefined}
              data-live=""
              data-device={asPhone ? 'phone' : device}
              onClickCapture={inertDemoLink}
              className={cn(
                'relative isolate flex items-center justify-center overflow-hidden font-sans text-fg',
                asPhone && 'pt-14 pb-20 sm:pt-10 sm:pb-24',
                stage.className,
              )}
              style={scene ? { ...stage.style, background: 'transparent' } : stage.style}
            >
              <StoryCrossfade name={name} stage={stageRef} k={site}>
                {asPhone ? (
                  <div
                    data-phone=""
                    inert={story?.pending || undefined}
                    className="relative w-[calc(var(--phone-width)+12px)] max-w-full rounded-[3.65rem] bg-[color-mix(in_oklab,var(--color-fg)_72%,var(--color-canvas))] p-1.5 dark:bg-[color-mix(in_oklab,var(--color-fg)_42%,var(--color-canvas))] shadow-2xl ring-1 ring-line-strong"
                  >
                    {/* The screen: the demo's viewport, 393 × 852, a modern iPhone. The transform makes it the containing block for `fixed`, so a sheet rises from its bottom edge. */}
                    <div
                      ref={setScreen}
                      data-phone-screen=""
                      className="relative flex h-(--phone-height) w-(--phone-width) max-w-full flex-col overflow-clip rounded-[calc(3.65rem-6px)] bg-canvas text-fg"
                    >
                      <div
                        aria-hidden
                        className="pointer-events-none absolute start-1/2 top-[11px] z-10 h-[37px] w-[126px] -translate-x-1/2 rounded-full bg-[color-mix(in_oklab,var(--color-fg)_85%,var(--color-canvas))] dark:bg-[color-mix(in_oklab,var(--color-fg)_8%,var(--color-canvas))] rtl:translate-x-1/2"
                      />
                      <div ref={fade} className="phone-scroll yj-scrollbar relative flex min-h-0 flex-1 overflow-auto px-4 pt-16 pb-10">
                        {/* Keyed on the motion (the OS preference applies just after hydration), so each change starts the demo over under it. */}
                        <div key={`${run}-${speed}-${still}-${rtl}-phone`} className="m-auto flex w-full min-w-fit justify-center">
                          {/* Its own boundary: a demo that suspends inside the phone must not hide the phone's screen, whose ref
                            the demo waits on (hiding it would detach the ref, unmount the demo, and loop). */}
                          {screen && <Suspense fallback={null}>{demo}</Suspense>}
                        </div>
                      </div>
                      <div
                        aria-hidden
                        className="pointer-events-none absolute start-1/2 bottom-2 z-10 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-fg/80 youj-allow-tint rtl:translate-x-1/2"
                      />
                    </div>
                  </div>
                ) : (
                  // A demo wider than the stage scrolls (with a fade at the edge that has more) instead of being clipped; one that fits stays centred.
                  // A capped stage scrolls down too, and is a keyboard stop (labelled) while it has more to show, so focus in the demo never sits out of sight below the cut.
                  <div
                    ref={scroller}
                    // The leaving demo, hidden while the next loads, takes no clicks or focus.
                    inert={story?.pending || undefined}
                    tabIndex={capped && scrolls ? 0 : undefined}
                    role={capped && scrolls ? 'region' : undefined}
                    aria-label={capped && scrolls ? `${file}: example, scrolls` : undefined}
                    style={capped ? { maxHeight: STAGE_CAP } : undefined}
                    className={cn(
                      'stage-scroll yj-scrollbar relative flex min-w-0 flex-1 overflow-x-auto',
                      capped
                        ? 'overflow-y-auto outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent'
                        : 'overflow-y-hidden',
                      !full && cn('px-5 pb-20 sm:px-10', view ? 'pt-18' : 'pt-10'),
                    )}
                  >
                    <div key={`${run}-${speed}-${still}-${device}-${rtl}`} className="m-auto flex w-full min-w-fit items-center justify-center">
                      {full ? demo : <Plate>{demo}</Plate>}
                    </div>
                  </div>
                )}
              </StoryCrossfade>
              {/* A story on its way: the stage breathes over the softened old one until it's here (styles/site.css; none under reduced motion). */}
              {story && <div aria-hidden className="story-breath" data-on={(story.pending && !site.reduced) || undefined} />}
              {capped && !asPhone && (
                <>
                  {/* Decorative: the soft cut, gone once the foot is reached. */}
                  <div
                    aria-hidden
                    className={cn(
                      'pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-canvas to-transparent transition-opacity yj-duration-base ease-standard',
                      more ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <a
                    href={view}
                    data-expand=""
                    aria-label={`Expand ${file} to a full page`}
                    className="absolute inset-x-0 bottom-4 mx-auto inline-flex h-8 w-fit items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-ui-sm font-medium text-fg shadow-sm transition-colors yj-duration-fast ease-standard hover:border-line-strong hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent touch:h-11"
                  >
                    <MaximizeIcon size={14} aria-hidden />
                    Expand
                  </a>
                </>
              )}
              {(speed !== 1 || still) && (
                <div className="pointer-events-none absolute start-3 bottom-3 flex gap-1.5">
                  {still ? <span className="stage-chip">reduced motion</span> : <span className="stage-chip">{SPEED_LABEL[speed].short} speed</span>}
                </div>
              )}
            </div>
          </TooltipProvider>
        </YoujProvider>
        {/* After the stage in the DOM (keyboard order: the demo, the stage's corner keys, then the strip), outside its provider, so the keys keep the site's look, not the preset or direction picked for the demo. */}
        {corner}
        {island}
      </div>
    </>
  )
}
