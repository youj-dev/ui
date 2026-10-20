import { memo, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { ThemeScope } from '@youj/core'
import { internalPresetById } from '@youj/core/lib/youj/theme'
import { toast } from '@youj/react/components/ui/toast'
import { ToggleGroup, ToggleGroupItem } from '@youj/react/components/ui/toggle-group'
import { mix, tween } from '../../lib/timing'
import { useAction, useEachFrame, useFrame } from '../../sim/simulation'
import { ASSEMBLE_BEATS as A, MOMENTS, THEMES_SCRIPT, type HeroId, type PresetId, type ThemesScript } from '../beats'
import { Camera } from '../camera'
import { Cursor, type Move, type Point } from '../cursor'
import { useFormat } from '../format'
import { tuningOf } from '../palette'
import { HEROES } from '../products'
import { drag, key } from '../user'
import { TITLE_BAR } from '../window'
import { blockOnScreen } from './bench'

/* The payoff: the products, through the five presets.
 *
 * The finished Security block grows into a window, and a product resolves in
 * it: a hero example, exactly as the docs ship it, laid out at a laptop's
 * viewport. Each product does its one thing (Tandem's drag, Folio's triage,
 * the Ledger's drivers), then the picker below the window, a real segmented
 * control, presses the next preset, which opens as a circle out of the
 * pressed key, led by a hairline in its accent. The next product arrives in
 * the preset the last one left, so every preset is seen on a product, and
 * every product in more than one.
 *
 * Every preset is the product mounted in its own ThemeScope, under the one
 * showing, and worked by the same hand at the same frames, so the copies are
 * in the same state when the circle opens. Their toasts would double, so the
 * film's Toaster sits this chapter out. */

/** The products' own viewport: a laptop's, in the wide cut; the square's width, in the square. */
const PRODUCT = { wide: { w: 1280, h: 800 }, square: { w: 810, h: 640 } }
const SCALE = 0.78
/** Frames a cut from one product to the next takes: a quick dissolve inside the window. */
const CUT = 10
/** How long before its cut a product is mounted, hidden, so it has arrived (charts drawn, figures landed) when it is seen. */
const PREROLL: Record<HeroId, number> = { tandem: 0, folio: 50, ledger: 96 }

/** Where the window sits, and how much the product is scaled to fit it. */
function layoutFor(width: number, square: boolean) {
  const product = square ? PRODUCT.square : PRODUCT.wide
  const w = product.w * SCALE + 2
  const h = product.h * SCALE + 2 + TITLE_BAR
  return { window: { x: (width - w) / 2, y: square ? 150 : 44, w, h }, product }
}

type Preset = { id: PresetId; scheme: 'dark' | 'light' }
type Rect = { x: number; y: number; w: number; h: number }
const lerp = (a: Rect, b: Rect, t: number): Rect => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), w: mix(a.w, b.w, t), h: mix(a.h, b.h, t) })

export function ThemesScene({
  leaveAt,
  script: S = THEMES_SCRIPT,
  from = 'block',
}: {
  leaveAt: number
  script?: ThemesScript
  /** 'block': the window grows out of the finished Security block. 'fade': it simply arrives. */
  from?: 'block' | 'fade'
}) {
  const frame = useFrame()
  const { width, height, square } = useFormat()
  const { window: WINDOW, product: PRODUCT_BOX } = layoutFor(width, square)
  const CONTENT = { x: WINDOW.x + 1, y: WINDOW.y + 1 + TITLE_BAR }
  const revealAt = (i: number) => S.reveals[i - 1]!

  const grow = from === 'block' ? tween(frame, 0, A.expandLength, 'emphasized') : 1
  const frameRect = from === 'block' ? lerp(blockOnScreen(width, height), WINDOW, grow) : WINDOW
  const product = from === 'block' ? tween(frame, A.expandLength * 0.12, A.expandLength * 0.55, 'standard') : 1
  const chrome = from === 'block' ? tween(frame, A.expandLength * 0.5, A.expandLength * 0.5, 'enter') : 1
  const arrive = from === 'fade' ? tween(frame, 0, 'deliberate', 'enter') : 1
  const leave = tween(frame, leaveAt, 'slow', 'exit')

  // Where each circle opens from: the picker's key for that preset, read as its reveal begins, in the product's own px.
  const picker = useRef<HTMLDivElement>(null)
  const [origins, setOrigins] = useState<Record<number, { x: number; y: number }>>({})
  useEachFrame((f) => {
    for (let i = 1; i < S.presets.length; i++) {
      if (f !== revealAt(i) - 1) continue
      const key = picker.current?.querySelectorAll('[data-slot=toggle-group-item]')[i]
      if (!key) continue
      const r = key.getBoundingClientRect()
      const at = { x: (r.left + r.width / 2 - CONTENT.x) / SCALE, y: (r.top + r.height / 2 - CONTENT.y) / SCALE }
      setOrigins((all) => ({ ...all, [i]: at }))
    }
  })

  const reveal = (i: number) => (tween(frame, revealAt(i), S.reveal, 'emphasized'))
  const current = S.presets.reduce((at, _, i) => (i > 0 && frame >= revealAt(i) ? i : at), 0)
  const radius = (p: number) => p * Math.hypot(PRODUCT_BOX.w, PRODUCT_BOX.h + 140 / SCALE)
  const shot = S.shots.reduce((at, s, i) => (frame >= s.at ? i : at), 0)

  // The products' toasts would come once per copy: the film's Toaster sits this chapter out.
  useLayoutEffect(() => {
    toast.dismiss()
    document.documentElement.style.setProperty('--film-toast-opacity', '0')
    return () => document.documentElement.style.setProperty('--film-toast-opacity', '1')
  }, [])

  // Every copy of a product, so the hand can work them all at once.
  const roots = useRef(new Map<string, HTMLElement>())
  const copiesOf = (hero: HeroId) => [...roots.current].filter(([k]) => k.startsWith(`${hero}:`)).map(([, el]) => el)
  /** The copy on top: the one being seen, whose parts the pointer goes to. */
  const shown = (hero: HeroId) => {
    const s = S.shots.find((x) => x.hero === hero)!
    const top = s.presets.filter((p) => p === s.presets[0] || frame >= revealAt(p)).at(-1)!
    return roots.current.get(`${hero}:${top}`) ?? null
  }

  return (
    <div
      className="absolute inset-0"
      style={{ opacity: arrive * (1 - leave), transform: `translateY(${(1 - arrive) * 14 - leave * 12}px) scale(${1 - leave * 0.02})` }}
    >
      {/* The window: its outline grows out of the block's own, while the block's contents give way to the product.
          Its surface arrives with the product, so the block is never covered by an empty card. */}
      <div
        className="absolute overflow-hidden rounded-[12px] border border-line"
        style={{
          left: frameRect.x,
          top: frameRect.y,
          width: frameRect.w,
          height: frameRect.h,
          background: `color-mix(in oklab, var(--color-canvas) ${product * 100}%, transparent)`,
          boxShadow: `0 0 0 1px color-mix(in oklab, var(--color-canvas) 60%, transparent), 0 2px 6px -2px color-mix(in oklab, var(--color-shadow) ${product * 40}%, transparent), 0 32px 80px -24px color-mix(in oklab, var(--color-shadow) ${product * 75}%, transparent)`,
        }}
      >
        <TitleBar frame={frame} script={S} shot={shot} opacity={chrome} />
        <div
          className="absolute overflow-hidden"
          style={{ left: CONTENT.x - frameRect.x - 1, top: CONTENT.y - frameRect.y - 1, width: PRODUCT_BOX.w * SCALE, height: PRODUCT_BOX.h * SCALE, opacity: product }}
        >
          {/* Laid out at the product's own size, and scaled to the window through the camera, so its layout animations still land. */}
          <Camera shot={{ scale: SCALE, x: 0, y: 0, originX: 0, originY: 0 }}>
            <div
              data-window=""
              className="absolute top-0 left-0 overflow-hidden"
              style={{ width: PRODUCT_BOX.w, height: PRODUCT_BOX.h, '--window-h': `${PRODUCT_BOX.h}px`, '--window-w': `${PRODUCT_BOX.w}px` } as CSSProperties}
            >
              {S.shots.map((s, n) => {
                const next = S.shots[n + 1]
                const mount = n === 0 ? 0 : s.at - PREROLL[s.hero]
                if (frame < mount || (next && frame >= next.at + CUT)) return null
                const seen = n === 0 ? 1 : tween(frame, s.at, CUT, 'standard')
                return (
                  <div key={s.hero} className="absolute inset-0" style={{ opacity: seen, visibility: seen > 0 ? 'visible' : 'hidden' }}>
                    {s.presets.map((i) => {
                      const first = i === s.presets[0]
                      const p = first ? 1 : reveal(i)
                      const origin = origins[i] ?? { x: PRODUCT_BOX.w / 2, y: PRODUCT_BOX.h + 60 }
                      const preset = S.presets[i]!
                      return (
                        <div
                          key={preset.id}
                          aria-hidden={p <= 0 || undefined}
                          // Isolated: the app's own stacking (a sticky header) must not paint over the copy above it.
                          className="absolute inset-0 isolate"
                          style={{ visibility: p > 0 ? 'visible' : 'hidden', clipPath: first || p >= 1 ? undefined : `circle(${radius(p)}px at ${origin.x}px ${origin.y}px)` }}
                        >
                          <Copy
                            hero={s.hero}
                            id={preset.id}
                            scheme={preset.scheme}
                            size={PRODUCT_BOX}
                            register={(el) => (el ? roots.current.set(`${s.hero}:${i}`, el) : roots.current.delete(`${s.hero}:${i}`))}
                          />
                        </div>
                      )
                    })}
                    {s.presets.slice(1).map((i) => (
                      <Edge key={i} id={S.presets[i]!.id} scheme={S.presets[i]!.scheme} p={reveal(i)} origin={origins[i]} r={radius(reveal(i))} />
                    ))}
                  </div>
                )
              })}
            </div>
          </Camera>
        </div>
      </div>

      <Moments script={S} copiesOf={copiesOf} shown={shown} />
      <Caption frame={frame} current={current} script={S} square={square} window={WINDOW} />
      <div ref={picker} className="absolute" style={{ right: width - (WINDOW.x + WINDOW.w), top: WINDOW.y + WINDOW.h + 20, opacity: chrome }}>
        <Picker current={current} presets={S.presets} short={square} />
      </div>
    </div>
  )
}

/** The window's bar: its lights, and the address of the product in it, which changes with the product. */
function TitleBar({ frame, script: S, shot, opacity }: { frame: number; script: ThemesScript; shot: number; opacity: number }) {
  const s = S.shots[shot]!
  const swap = shot === 0 ? 1 : tween(frame, s.at, CUT, 'standard')
  const previous = S.shots[shot - 1]
  return (
    <div className="absolute inset-x-0 top-0 flex items-center border-b border-line bg-surface px-3.5" style={{ height: TITLE_BAR, opacity }}>
      <span aria-hidden className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-[11px] rounded-full bg-line-strong" />
        ))}
      </span>
      <span className="absolute inset-x-0 mx-auto flex h-6 w-[min(26rem,55%)] items-center justify-center rounded-md bg-field text-[11.5px] text-fg-muted">
        {previous && swap < 1 && (
          <span className="absolute" style={{ opacity: 1 - swap }}>
            {HEROES[previous.hero].address}
          </span>
        )}
        <span style={{ opacity: swap }}>{HEROES[s.hero].address}</span>
      </span>
    </div>
  )
}

/** One product in one preset: its own scope and scheme, at its own viewport, scrolled to what moves. Rendered once. */
const Copy = memo(function Copy({
  hero,
  id,
  scheme,
  size,
  register,
}: {
  hero: HeroId
  id: PresetId
  scheme: 'dark' | 'light'
  size: { w: number; h: number }
  register: (el: HTMLElement | null) => void
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const { scroll } = HEROES[hero]
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are chosen by hand
  useLayoutEffect(() => {
    register(scroller.current)
    return () => register(null)
  }, [])
  // The part that moves stays where it was put, in every preset's metrics, whatever the page above it does.
  useEachFrame(() => {
    const el = scroller.current
    const part = scroll && el?.querySelector<HTMLElement>(scroll.to)
    if (!el || !part) return
    let y = 0
    for (let n: HTMLElement | null = part; n && n !== el; n = n.offsetParent as HTMLElement | null) y += n.offsetTop
    const top = Math.max(0, y - scroll.below)
    if (Math.abs(el.scrollTop - top) > 0.5) el.scrollTop = top
  })
  return (
    <div ref={scroller} data-theme={scheme} className="absolute top-0 left-0 overflow-hidden bg-canvas" style={{ width: size.w, height: size.h }}>
      {HEROES[hero].render(internalPresetById(id))}
    </div>
  )
})

/**
 * Each product's one moment, worked on every copy at the same frames, with a
 * pointer drawn over the copy being seen: Tandem's hero illustration dragged
 * two days on (what waits on it glides, the load test crosses the launch
 * line, the verdict turns), Folio's letters filed with E, one after another,
 * and the Ledger turned to three of its drivers in turn.
 */
function Moments({ script: S, copiesOf, shown }: { script: ThemesScript; copiesOf: (hero: HeroId) => HTMLElement[]; shown: (hero: HeroId) => HTMLElement | null }) {
  return (
    <>
      {S.moments.tandem !== undefined && <TandemDrag at={S.moments.tandem} copiesOf={copiesOf} shown={shown} />}
      {S.moments.folio !== undefined && <FolioKeys at={S.moments.folio} />}
      {S.moments.ledger !== undefined && <LedgerDrivers at={S.moments.ledger} copiesOf={copiesOf} shown={shown} />}
    </>
  )
}

const centre = (el: Element | null | undefined, along = 0.5): Point | null => {
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width * along, y: r.top + r.height / 2 }
}

function TandemDrag({ at, copiesOf, shown }: { at: number; copiesOf: (hero: HeroId) => HTMLElement[]; shown: (hero: HeroId) => HTMLElement | null }) {
  const M = MOMENTS.tandem
  const bar = (root: HTMLElement | null) => root?.querySelector<HTMLElement>('[data-task="hero"]') ?? null
  /** Two days, in the runway's own px: the bar is three days long. */
  const twoDays = (el: HTMLElement) => (el.offsetWidth / 3) * 2
  const grab = useRef<Point | null>(null)
  const drags = useRef<ReturnType<typeof drag>[]>([])
  useAction(at + M.press, () => {
    drags.current = copiesOf('tandem').flatMap((root) => {
      const el = bar(root)
      return el ? [drag(el, centre(el, 0.3)!)] : []
    })
  })
  useEachFrame((f) => {
    const t = f - at - M.drag
    if (t < 0 || t > M.dragFrames) return
    const along = tween(t, 0, M.dragFrames, 'standard')
    for (const d of drags.current) d.move(twoDays(d.el) * along)
  })
  useAction(at + M.up, () => {
    for (const d of drags.current) d.release()
    drags.current = []
  })
  const moves: Move[] = [
    {
      at: at + M.reach,
      frames: M.frames,
      press: 'down',
      after: M.press - M.reach - M.frames,
      to: () => {
        grab.current = centre(bar(shown('tandem')), 0.3)
        return grab.current
      },
    },
    {
      at: at + M.drag,
      frames: M.dragFrames,
      sweep: true,
      press: 'up',
      after: M.up - M.drag - M.dragFrames,
      to: () => {
        const el = bar(shown('tandem'))
        if (!el || !grab.current) return null
        const r = el.getBoundingClientRect()
        return { x: grab.current.x + (r.width / 3) * 2, y: grab.current.y }
      },
    },
  ]
  return <Cursor start={{ x: 1040, y: 720 }} moves={moves} events={false} show={[at - 6, at + M.up + 40]} />
}

function FolioKeys({ at }: { at: number }) {
  const M = MOMENTS.folio
  return (
    <>
      {M.keys.map((k) => (
        <Press key={k} at={at + k} name="e" />
      ))}
    </>
  )
}

function Press({ at, name }: { at: number; name: string }) {
  useAction(at, () => key(name, document.body))
  return null
}

function LedgerDrivers({ at, copiesOf, shown }: { at: number; copiesOf: (hero: HeroId) => HTMLElement[]; shown: (hero: HeroId) => HTMLElement | null }) {
  const M = MOMENTS.ledger
  const row = (root: HTMLElement | null, i: number) => root?.querySelectorAll<HTMLElement>('[aria-label="What moved revenue"] [data-slot=toggle-group-item]')[i] ?? null
  const moves: Move[] = M.clicks.map((click, i) => ({
    at: at + (i === 0 ? M.reach : click - M.between),
    frames: i === 0 ? M.frames : M.between - 4,
    press: 'click',
    after: i === 0 ? click - M.reach - M.frames : 4,
    to: () => centre(row(shown('ledger'), i), 0.22),
  }))
  return (
    <>
      {M.clicks.map((click, i) => (
        <Click key={i} at={at + click} run={() => copiesOf('ledger').forEach((root) => row(root, i)?.click())} />
      ))}
      <Cursor start={{ x: 1100, y: 700 }} moves={moves} events={false} show={[at - 6, at + M.clicks.at(-1)! + 50]} />
    </>
  )
}

function Click({ at, run }: { at: number; run: () => void }) {
  useAction(at, run)
  return null
}

/** A circle's leading edge: a hairline in the incoming preset's accent. */
function Edge({ id, scheme, p, origin, r }: { id: PresetId; scheme: 'dark' | 'light'; p: number; origin?: { x: number; y: number }; r: number }) {
  if (p <= 0 || p >= 1 || !origin) return null
  return (
    <ThemeScope theme={internalPresetById(id)}>
      <div
        data-theme={scheme}
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{
          left: origin.x - r,
          top: origin.y - r,
          width: r * 2,
          height: r * 2,
          boxShadow: '0 0 0 1.5px var(--color-accent), 0 0 28px 2px color-mix(in oklab, var(--color-accent) 55%, transparent)',
          opacity: Math.min(1, (1 - p) * 5, p * 14),
        }}
      />
    </ThemeScope>
  )
}

/** The picker: every preset as a key with its own accent; the pressed key glides to each new one. */
const Picker = memo(function Picker({ current, presets, short }: { current: number; presets: Preset[]; short: boolean }) {
  const value = presets[current]!.id
  return (
    <ToggleGroup variant="segmented" value={[value]} aria-label="Theme">
      {presets.map((preset) => (
        <ToggleGroupItem key={preset.id} value={preset.id} tabIndex={-1} className={short ? 'gap-2 px-2.5' : 'gap-2 px-3'}>
          <span aria-hidden className="size-2.5 rounded-full" style={{ background: accent(preset.id, preset.scheme) }} />
          {internalPresetById(preset.id).name}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
})

const accent = (id: PresetId, scheme: 'dark' | 'light') => {
  const [l, c, h] = tuningOf(id, scheme).palette.accent
  return `oklch(${l} ${c} ${h})`
}

/** Under the window (above it, on the square), start side: the preset's name in its own face, and its contract in a line. */
function Caption({ frame, current, script: S, square, window }: { frame: number; current: number; script: ThemesScript; square: boolean; window: Rect }) {
  const revealAt = (i: number) => S.reveals[i - 1]!
  return (
    <div className="absolute" style={{ left: window.x, top: square ? window.y - 64 : window.y + window.h + 18, width: 520, height: 60 }}>
      {S.presets.map((preset, i) => {
        const theme = internalPresetById(preset.id)
        const inn = i === 0 ? tween(frame, A.expandLength * 0.7, 'slow', 'enter') : tween(frame, revealAt(i) + S.reveal * 0.45, 'slow', 'enter')
        const out = i === S.presets.length - 1 ? 0 : tween(frame, revealAt(i + 1), 'fast', 'exit')
        const shown = inn * (1 - out)
        if (shown <= 0 || Math.abs(i - current) > 1) return null
        return (
          <div key={preset.id} className="absolute inset-0 flex items-baseline gap-4" style={{ opacity: shown, transform: `translateY(${(1 - inn) * 8 - out * 6}px)` }}>
            <span className="text-[26px] leading-none font-semibold tracking-[-0.02em] text-fg" style={{ fontFamily: theme.fonts.sans }}>
              {theme.name}
            </span>
            <span className="font-mono text-[12.5px] leading-none tracking-[0.04em] text-fg-muted">
              {theme.motionPersonality} · radius {theme.radius} · {theme.controlSize}
            </span>
          </div>
        )
      })}
    </div>
  )
}
