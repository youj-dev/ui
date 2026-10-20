'use client'

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type HTMLAttributes,
  type RefObject,
} from 'react'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/lib/youj/use-component-labels'
import { spinnerLabels } from '@youj/core/labels'
import { observeThemeChange } from '@youj/core/lib/youj/theme/observe'
import { cn } from '@youj/core/lib/youj/cn'
import { EXTRA_TONES, bezier, blendParts, canvasPen, litAs, onTick, palette, recordingPen, resolveTone, type EaseToken, type ExtraTone, type Mark, type Scene, type Tone, type View } from './field'
import { labelClock, type LoaderLabelEffect, type LabelPaint } from './label'
import { DEFAULT_TONE_ROLES, TONE_ROLE_COLORS, type LoaderColorPart } from './categories'

/* The shell every Youj loader draws in. It owns the common API, so an
 * loader is only its scene (field.ts):
 *
 * - A status: role="status" and aria-live="polite", named by `label` ("Loading"
 *   by default, from the labels): a visually hidden span that is both what's
 *   announced and the status's name. `label={null}` makes it decorative, for
 *   when the surrounding thing already announces the wait. Several labels
 *   take turns (one every `labelEvery` loops); the status says the first, and
 *   a later one only as it shows, in order, once each and well apart
 *   (useStatus), so a polite region never talks every loop.
 * - `showLabel` draws the label for everyone too: centred under the drawing by
 *   default, or over it, or beside it (`labelPosition`), and moving on the
 *   drawing's own clock (`labelEffect`, label.ts): a light, a lift, a caret, a
 *   decode or a roll, each carrying the change from one label to the next at
 *   the seam. Over or under the drawing it takes the theme's label voice
 *   (--yj-label-case, --yj-label-font, --yj-label-tracking) at a size that
 *   grows with the drawing, or --yj-label-size; beside it, the line's own type. The drawn label is aria-hidden, so assistive technology hears
 *   the plain label, never letters arriving. It's the first label, static, on
 *   the server, through hydration and under reduced motion, and joins the loop
 *   at a moment that looks just like it, so it never jumps.
 * - Server-rendered as a still frame in SVG (so it's never blank before the
 *   script runs), then drawn live on a canvas: one shared ticker, joined only
 *   while it's on screen, in a visible tab and not `paused`. Time comes from
 *   the motion tokens: a loop lasts `beats` × the deliberate duration (scaled
 *   by the time scale, re-valued by the theme's personality) ÷ `speed`, and a
 *   change of speed carries on from the frame it's on.
 * - Reduced motion keeps the still frame: one frame that still reads as busy.
 * - Two colors, both read from the page as computed colors and re-read when
 *   the theme changes: the primary, `color` (the ink, the text color by
 *   default), and the secondary, `accentColor` (the theme's accent by
 *   default): the brand's particle, lit accent faces, and the label's light
 *   and caret. Solid planes sit on `--yj-anim-paper` (the surface by default:
 *   set it to what the loader sits on).
 * - Color: a loader can draw parts in up to four extra tones (`spec.tones`),
 *   each a theme role with `colors="theme"`, or the colors given in
 *   `colors`, and blends between tones for pulses and
 *   gradients. Without `colors` each goes back to the ink or the accent it
 *   stands in for: the two-color look, exactly. They're --yj-anim-c1…c4 on
 *   the root, read like the others. */

/** `sm | default | lg`, the size scale every component shares, or px. */
export type LoaderSize = 'sm' | 'default' | 'lg' | number
export type LoaderLabelPosition = 'bottom' | 'top' | 'start' | 'end'
export type { LoaderLabelEffect } from './label'

export interface LoaderProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color' | 'children'> {
  /** The drawing's height: `sm`, `default` or `lg`, or px. Default `default`. */
  size?: LoaderSize
  /** The primary color: its ink. Any CSS color, token references included (`var(--color-fg-muted)`). Default: the text color. */
  color?: string
  /** The secondary color: the accent, on the one mark that matters (lit accent faces included) and in a shown label's light and caret. Any CSS color or token reference. Default: the theme's accent. */
  accentColor?: string
  /** Turns color on for the loader's colored parts (its extra tones; see its docs for which is which). `'theme'` gives each its theme color, derived from the accent; a list gives them any CSS colors or token references, in part order, an empty or missing entry keeping the theme color. Left out, it draws in its two colors only, the ink (`color`) and the accent (`accentColor`). A loader without colored parts ignores it. */
  colors?: 'theme' | readonly string[]
  /** Playback rate over the theme's tempo: 2 is twice as fast, 0.5 half. It multiplies with the provider's time scale. Default 1. */
  speed?: number
  /** The accessible name, announced politely: one label, or several that take turns (a shown label rotates through them, one every `labelEvery` loops; the status says the first, then a later one only now and then). Default: the `loading` label, "Loading". `null` when something around it already announces the wait. */
  label?: string | readonly string[] | null
  /** With several labels: how many loops each one shows for before the next takes over, at the seam. Default 1. */
  labelEvery?: number
  /** Shows the label with the drawing, not only to assistive technology. Default false. */
  showLabel?: boolean
  /** Where a shown label sits: centred under the drawing (`bottom`) or over it (`top`), or beside it, before (`start`) or after (`end`) it in the reading direction. Default `bottom`. */
  labelPosition?: LoaderLabelPosition
  /** How a shown label moves, in time with the loop, and changes to the next: `pulse` sweeps a soft light through it once a loop; `wave` lifts its letters in a gentle wave; `type` types it behind an accent caret and clears it at the seam; `scramble` resolves it from glyph noise, first letter to last; `slide` rolls the line up at the seam; `none` holds it still. Under reduced motion it's still. Default `pulse`. */
  labelEffect?: LoaderLabelEffect
  /** Holds the current frame. Default false. */
  paused?: boolean
  /** The most frames a second it draws: a cap for ambient use (a loader that plays for a long time beside others), where 30 looks the same at a fraction of the cost. Time still runs at the drawing's tempo. Default: every frame the screen shows. */
  fps?: number
}

export interface LoaderSpec {
  /** Its id: the class `yj-<id>` and its registry item, `loader-<id>`. */
  id: string
  scene: Scene
  /** The named sizes, in px: the drawing's height. */
  sizes: Record<'sm' | 'md' | 'lg', number>
  /** Width over height. */
  aspect: number
  /** Its colored parts, the extra tones its scene draws with, `c1` first (what `colors` colors): its meta's `colors`. */
  tones?: readonly LoaderColorPart[]
}

/** The secondary color: `accentColor`, else an ancestor's `--yj-anim-accent`, else the theme's accent. */
const ACCENT = 'var(--yj-anim-accent, var(--color-accent))'

/** The sizes most loaders share: beside text, in a control or a card, on a panel. */
export const FIELD_SIZES = { sm: 24, md: 40, lg: 64 } as const

/** A tone as CSS, inside the art (whose color is the ink): a blend mixed from its two in Oklab, as the canvas mixes them. */
function paint(tone: Tone): string {
  const pair = blendParts(tone)
  if (pair) return `color-mix(in oklab, ${paint(pair[0])} ${Math.round((1 - pair[2]) * 1000) / 10}%, ${paint(pair[1])})`
  return tone === 'ink' ? 'currentColor' : tone === 'accent' ? ACCENT : `var(--yj-anim-${tone})`
}

interface Tones {
  /** Each extra tone the loader draws with, as CSS: its `colors` entry, its theme role, or (no `colors`) the ink or accent it stands in for. */
  css: Partial<Record<ExtraTone, string>>
  /** Without `colors`: the ink or the accent each one is drawn as. */
  alias?: Partial<Record<ExtraTone, 'ink' | 'accent'>>
}

/** The extra tones for these `colors`: none unless the loader draws with them; without `colors` each is the ink or accent it stands in for. */
function resolveTones(tones: LoaderSpec['tones'], colors: LoaderProps['colors']): Tones {
  const out: Tones = { css: {}, alias: colors === undefined ? {} : undefined }
  if (!tones) return out
  tones.slice(0, EXTRA_TONES.length).forEach(({ mono, role }, i) => {
    const tone = EXTRA_TONES[i]!
    if (out.alias) {
      out.alias[tone] = mono
      out.css[tone] = mono === 'ink' ? 'var(--yj-anim-ink)' : ACCENT
    } else out.css[tone] = (typeof colors === 'string' ? '' : colors?.[i]?.trim()) || TONE_ROLE_COLORS[role ?? DEFAULT_TONE_ROLES[i]!]
  })
  return out
}

/* The pulse's light: a soft bell of the ink, with a touch of the accent, at
 * --yj-anim-band (0 is a bell's width before the text, 1 a bell's width past
 * it, so both ends leave the text plain), over the muted label. */
const BELL = [0, 0.15, 0.5, 0.85, 1, 0.85, 0.5, 0.15, 0]
const SWEEP = `linear-gradient(90deg, ${BELL.map((ink, i) => {
  const color = ink === 0 ? 'var(--color-fg-muted)' : ink === 1 ? 'var(--yj-anim-glint)' : `color-mix(in oklab, var(--yj-anim-glint) ${ink * 100}%, var(--color-fg-muted))`
  return `${color} calc(var(--yj-anim-band, 1) * (100% + var(--yj-anim-bell) * 2) + var(--yj-anim-bell) * ${i / 4 - 2})`
}).join(', ')})`

const KIT_CSS = `
.yj-anim { display: inline-flex; align-items: center; gap: calc(4px + var(--yj-anim-size) * 0.08); vertical-align: middle; max-width: 100%; }
.yj-anim[data-label-position='bottom'] { flex-direction: column; }
.yj-anim[data-label-position='top'] { flex-direction: column-reverse; }
.yj-anim[data-label-position='start'] { flex-direction: row-reverse; }
.yj-anim__art { position: relative; display: block; flex: none; height: var(--yj-anim-size); aspect-ratio: var(--yj-anim-aspect); color: var(--yj-anim-ink); }
.yj-anim__art > :is(svg, canvas) { position: absolute; inset: 0; display: block; width: 100%; height: 100%; overflow: visible; }
.yj-anim__art .yj-anim__accent { fill: ${ACCENT}; }
.yj-anim__art :is(line, path[fill='none']).yj-anim__accent { fill: none; stroke: ${ACCENT}; }
.yj-anim__probe { position: absolute; width: 0; height: 0; overflow: hidden; color: ${ACCENT}; background-color: var(--yj-anim-paper, var(--color-surface)); opacity: var(--yj-dark, 1); }
${EXTRA_TONES.map((tone) => `.yj-anim__art .yj-anim__${tone} { fill: var(--yj-anim-${tone}); }\n.yj-anim__art :is(line, path[fill='none']).yj-anim__${tone} { fill: none; stroke: var(--yj-anim-${tone}); }`).join('\n')}
/* The extra tones, read for the canvas from its four border colors; its own color is the ink. */
.yj-anim__tones { position: absolute; width: 0; height: 0; overflow: hidden; border-color: ${EXTRA_TONES.map((tone) => `var(--yj-anim-${tone}, currentColor)`).join(' ')}; }
/* One cell for every label, so the label is as wide as the widest and nothing around it moves as they turn; the first shows until they do. */
.yj-anim__label { position: relative; display: grid; grid-template-columns: minmax(0, 1fr); min-width: 0; max-width: 100%; line-height: 1.3; white-space: nowrap; user-select: none; }
.yj-anim:is([data-label-position='bottom'], [data-label-position='top']) > .yj-anim__label {
  font-family: var(--yj-label-font, inherit);
  font-size: var(--yj-label-size, clamp(11px, calc(var(--yj-anim-size) * 0.075), 13px));
  font-weight: 500;
  letter-spacing: var(--yj-label-tracking, 0.08em);
  text-transform: var(--yj-label-case, none);
}
.yj-anim__text { grid-area: 1 / 1; display: block; overflow: hidden; text-overflow: ellipsis; padding-block: 0.2em; margin-block: -0.2em; color: var(--color-fg-muted); }
.yj-anim__text ~ .yj-anim__text { visibility: hidden; }
.yj-anim:is([data-label-position='bottom'], [data-label-position='top']) .yj-anim__text { text-align: center; }
.yj-anim[data-label-position='start'] .yj-anim__text { text-align: end; }
/* Only where the light can be painted into the letters; elsewhere (and in forced colors) the label simply holds still. Wave's light is for a script whose letters can't move on their own. */
@supports ((background-clip: text) or (-webkit-background-clip: text)) and (color: color-mix(in oklab, currentColor, currentColor)) {
  @media (forced-colors: none) {
    .yj-anim__label:is([data-effect='pulse'], [data-effect='wave']) > .yj-anim__text {
      --yj-anim-glint: color-mix(in oklab, currentColor 82%, ${ACCENT});
      --yj-anim-bell: 1.75em;
      color: var(--yj-anim-ink);
      background-image: ${SWEEP};
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }
}
/* Letters drawn one by one (scramble's noise, wave's lift), each where it sits in the text: placed in physical px. */
.yj-anim__glyphs { position: absolute; inset: 0; color: var(--color-fg-muted); pointer-events: none; }
.yj-anim__glyphs > span { position: absolute; top: 0; text-align: center; white-space: pre; }
.yj-anim__label[data-effect='scramble'] .yj-anim__glyphs > span { opacity: 0.6; }
.yj-anim__label:is([data-effect='scramble'], [data-effect='wave']) { font-variant-ligatures: none; }
/* slide rolls the line through a window its own height, the edges soft: they fade in the padding, so a still label is never touched. */
.yj-anim__label[data-effect='slide'] { padding-block: 0.3em; margin-block: -0.3em; -webkit-mask-image: linear-gradient(transparent, black 0.3em, black calc(100% - 0.3em), transparent); mask-image: linear-gradient(transparent, black 0.3em, black calc(100% - 0.3em), transparent); }
/* Placed by the type effect from the text's own measure (physical px), so left, not inset-inline-start. */
.yj-anim__caret { position: absolute; left: 0; top: 50%; width: max(1.5px, 0.14em); height: 1.15em; margin-top: -0.575em; background: ${ACCENT}; pointer-events: none; }
@media (forced-colors: active) { .yj-anim__caret { forced-color-adjust: none; background: CanvasText; } }
.yj-anim__sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
`

const noSubscribe = () => () => {}
/** False on the server and through hydration, true after: the first client render matches the server's HTML. */
const useHydrated = () =>
  useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  )

const EASES: EaseToken[] = ['standard', 'enter', 'exit', 'emphasized']

/** Renders a loader from the common props and its spec. */
export function LoaderRoot({ spec, props }: { spec: LoaderSpec; props: LoaderProps }) {
  const {
    size = 'default',
    color,
    accentColor,
    speed = 1,
    label,
    labelEvery = 1,
    showLabel = false,
    labelPosition = 'bottom',
    labelEffect = 'pulse',
    paused = false,
    fps,
    colors,
    className,
    style,
    ...rest
  } = props
  const k = useYouj()
  const labels = useComponentLabels(spinnerLabels)
  const hydrated = useHydrated()
  const art = useRef<HTMLSpanElement>(null)
  const frame = useRef<LabelPaint | null>(null)
  const labelId = useId()
  const texts = useTexts(label, labels.loading)
  const status = useStatus(texts)
  const px = typeof size === 'number' ? size : spec.sizes[size === 'default' ? 'md' : size]
  // The canvas runs only once hydrated (the first client render matches the server's still) and with motion.
  const running = hydrated && !k.reduced

  const ease = useMemo(() => Object.fromEntries(EASES.map((e) => [e, bezier(k.ease(e))])) as View['ease'], [k])
  const view = useMemo<View>(() => ({ w: 100 * spec.aspect, h: 100, px: px / 100, size: px, ease }), [spec.aspect, px, ease])

  // Several labels and none shown: the status still takes them in turn, on the drawing's clock.
  const turning = running && !showLabel && texts !== null && texts.length > 1
  useLayoutEffect(() => {
    if (!turning || !texts) return
    const clock = labelClock(null, 'none', ease, texts.length, labelEvery, status.show)
    frame.current = clock.paint
    return () => {
      if (frame.current === clock.paint) frame.current = null
    }
  }, [turning, texts, ease, labelEvery, status.show])

  const tones = resolveTones(spec.tones, colors)
  const vars = {
    '--yj-anim-size': `${px}px`,
    '--yj-anim-aspect': spec.aspect,
    '--yj-anim-ink': color ?? 'currentColor',
    ...(accentColor ? { '--yj-anim-accent': accentColor } : null),
    ...Object.fromEntries(Object.entries(tones.css).map(([tone, css]) => [`--yj-anim-${tone}`, css])),
  } as CSSProperties

  return (
    <span
      {...rest}
      role={texts === null ? undefined : 'status'}
      aria-live={texts === null ? undefined : 'polite'}
      aria-labelledby={texts === null ? undefined : labelId}
      aria-hidden={texts === null ? true : undefined}
      data-yj-loader={spec.id}
      data-label-position={showLabel && texts !== null ? labelPosition : undefined}
      data-reduced={k.reduced ? '' : undefined}
      data-paused={paused ? '' : undefined}
      className={cn('yj-anim', `yj-${spec.id}`, className)}
      style={{ ...vars, ...style }}
    >
      <style href="youj-loader-kit" precedence="youj">
        {KIT_CSS}
      </style>
      <span ref={art} aria-hidden className="yj-anim__art">
        {running ? (
          <Live
            scene={spec.scene}
            view={view}
            art={art}
            speed={speed}
            paused={paused}
            fps={fps}
            beatMs={k.ms('deliberate')}
            colors={`${color}|${accentColor}|${JSON.stringify(tones)}`}
            alias={tones.alias}
            frame={frame}
          />
        ) : (
          <Still scene={spec.scene} view={view} alias={tones.alias} />
        )}
        <span className="yj-anim__probe" />
        {spec.tones && colors !== undefined && <span className="yj-anim__tones" />}
      </span>
      {/* What's announced and the status's name: always a plain label. */}
      {status.text !== null && (
        <span id={labelId} className="yj-anim__sr">
          {status.text}
        </span>
      )}
      {showLabel && texts !== null && <Label texts={texts} effect={labelEffect} live={running} every={labelEvery} ease={ease} frame={frame} onShow={status.show} />}
    </span>
  )
}

/* ── The labels and what the status says ───────────────────────────────── */

/** The labels as a list (null: none, decorative): one string, or several (blank ones dropped; none left is the default). The same list while its words stay the same. */
function useTexts(label: LoaderProps['label'], fallback: string): readonly string[] | null {
  const list = label === null ? null : label === undefined ? [fallback] : typeof label === 'string' ? [label] : label.filter((text) => text.trim())
  const texts = list && !list.length ? [fallback] : list
  // The words are the identity: a new array of the same labels (a literal in the caller's render) changes nothing.
  const key = texts === null ? null : texts.join('\u0000')
  return useMemo(() => texts, [key])
}

/**
 * A pause between two things a status says, in real time (not the motion's):
 * live regions are for changes that matter, and a polite one that changed
 * every loop would keep talking over everything else a screen reader says.
 */
const ANNOUNCE_GAP = 10_000

/**
 * What the status says, of several labels: the first, then a later one only
 * as it shows, in their order, each once, and at least ANNOUNCE_GAP after
 * the one before; once each has been said it stays quiet, however long the
 * wait and however often the shown label goes round. New labels (a change
 * of the prop: a real change of state) are said at once.
 */
function useStatus(texts: readonly string[] | null) {
  const [said, setSaid] = useState<{ texts: readonly string[] | null; index: number }>({ texts, index: 0 })
  const heard = useRef({ texts, upTo: 0, at: 0 })
  useEffect(() => {
    heard.current = { texts, upTo: 0, at: performance.now() }
  }, [texts])
  const show = useCallback((index: number) => {
    const h = heard.current
    if (index !== h.upTo + 1) return
    const now = performance.now()
    if (now - h.at < ANNOUNCE_GAP) return
    h.upTo = index
    h.at = now
    setSaid({ texts: h.texts, index })
  }, [])
  return { text: texts === null ? null : (texts[said.texts === texts ? said.index : 0] ?? null), show }
}

/* ── The shown label ─────────────────────────────────────────────────── */

interface LabelProps {
  texts: readonly string[]
  effect: LoaderLabelEffect
  /** False on the server, through hydration and under reduced motion: the first label, still. */
  live: boolean
  every: number
  ease: View['ease']
  /** Where the live drawing finds the label's paint, to call it each frame with the loop's progress. */
  frame: RefObject<LabelPaint | null>
  /** Hears each change of label. */
  onShow: (index: number) => void
}

/** The label as drawn: aria-hidden, since the status already says it. One run per label, stacked; static until its effect joins the loop. */
function Label({ texts, effect, live, every, ease, frame, onShow }: LabelProps) {
  const root = useRef<HTMLSpanElement>(null)
  const caret = useRef<HTMLSpanElement>(null)
  const glyphs = useRef<HTMLSpanElement>(null)
  const drawn = live ? effect : 'none'
  const moving = live && (effect !== 'none' || texts.length > 1)

  useLayoutEffect(() => {
    const el = root.current
    if (!el || !moving) return
    const runs = [...el.children].filter((child): child is HTMLElement => child instanceof HTMLElement && child.classList.contains('yj-anim__text'))
    const clock = labelClock({ runs, caret: caret.current, glyphs: glyphs.current }, effect, ease, texts.length, every, onShow)
    clock.paint(null)
    frame.current = clock.paint
    return () => {
      if (frame.current === clock.paint) frame.current = null
      clock.dispose()
    }
  }, [moving, texts, effect, every, ease, frame, onShow])

  return (
    <span ref={root} aria-hidden className="yj-anim__label" data-effect={drawn === 'none' ? undefined : drawn}>
      {texts.map((text, i) => (
        <span key={i} className="yj-anim__text">
          {text}
        </span>
      ))}
      {(drawn === 'scramble' || drawn === 'wave') && <span ref={glyphs} className="yj-anim__glyphs" />}
      {drawn === 'type' && <span ref={caret} className="yj-anim__caret" />}
    </span>
  )
}

/** The scene's still frame as SVG: the server's HTML, the frame before the canvas takes over, and reduced motion's. */
function Still({ scene, view, alias }: { scene: Scene; view: View; alias: Tones['alias'] }) {
  const marks = useMemo(() => {
    const out: Mark[] = []
    scene.draw(recordingPen(out), scene.still, view)
    return out
  }, [scene, view])
  return (
    <svg viewBox={`0 0 ${view.w} ${view.h}`} fill="currentColor" stroke="none">
      {marks.map((m, i) => {
        const tone = resolveTone(('tone' in m ? m.tone : m.stroke.tone) ?? 'ink', alias)
        // A blend is mixed in place (the canvas mixes the same two in sRGB); a tone on its own takes its class.
        const mixed = blendParts(tone) ? paint(tone) : undefined
        const className = mixed || tone === 'ink' ? undefined : `yj-anim__${tone}`
        const fill = mixed ? { fill: mixed } : undefined
        const stroke = mixed ? { stroke: mixed } : undefined
        // A lit face takes the light as the accent does (a color), or as the ink.
        const accent = litAs(tone) === 'accent'
        if (m.kind === 'square') return <rect key={i} x={m.v[0]} y={m.v[1]} width={m.v[2]} height={m.v[2]} opacity={m.alpha} className={className} style={fill} />
        if (m.kind === 'dot') return <circle key={i} cx={m.v[0]} cy={m.v[1]} r={m.v[2]} opacity={m.alpha} className={className} style={fill} />
        if (m.kind === 'line')
          return <line key={i} x1={m.v[0]} y1={m.v[1]} x2={m.v[2]} y2={m.v[3]} stroke="currentColor" strokeWidth={m.v[4]} opacity={m.alpha} className={className} style={stroke} />
        if (m.kind === 'path') {
          const s = m.stroke
          return (
            <path
              key={i}
              d={m.d}
              fill="none"
              stroke="currentColor"
              strokeWidth={s.width}
              strokeDasharray={s.dash?.join(' ')}
              strokeDashoffset={s.offset}
              strokeLinecap={s.cap ?? 'butt'}
              strokeLinejoin={s.join ?? 'miter'}
              opacity={s.alpha}
              className={className}
              style={stroke}
            />
          )
        }
        // A lit face: faceInk (field.ts) in CSS, its scheme read from --yj-dark, mixed with the paper in sRGB as the canvas mixes it.
        if (m.kind === 'face') {
          // A blend's face eases between how its two tones take the light, as the canvas's does.
          const pair = blendParts(tone)
          const ink = pair
            ? `calc((${faceShare(litAs(pair[0]) === 'accent', m.light)}) * ${1 - pair[2]} + (${faceShare(litAs(pair[1]) === 'accent', m.light)}) * ${pair[2]})`
            : `calc(${faceShare(accent, m.light)})`
          return <path key={i} d={m.d} style={{ fill: `color-mix(in srgb, ${paint(tone)} ${ink}, var(--yj-anim-paper, var(--color-surface)))` }} />
        }
        // A solid plane can't cut out what's beneath in SVG, so it mixes its ink with the paper instead.
        if (m.solid) {
          return <path key={i} d={m.d} style={{ fill: `color-mix(in srgb, ${paint(tone)} ${Math.round(m.alpha * 100)}%, var(--yj-anim-paper, var(--color-surface)))` }} />
        }
        return <path key={i} d={m.d} opacity={m.alpha} className={className} style={fill} />
      })}
    </svg>
  )
}

/** How much of its tone a lit face takes, as CSS: faceInk (field.ts), its scheme read from --yj-dark. */
const faceShare = (accent: boolean, light: number) =>
  accent ? `${50 + 45 * light}%` : `(var(--yj-dark, 1) * ${(0.1 + 0.8 * light).toFixed(3)} + (1 - var(--yj-dark, 1)) * ${(0.72 - 0.66 * light).toFixed(3)}) * 100%`

interface LiveProps {
  scene: Scene
  view: View
  art: RefObject<HTMLSpanElement | null>
  speed: number
  paused: boolean
  fps?: number
  beatMs: number
  /** The colors as set (`color`, `accentColor` and the extra tones): a change repaints at once. */
  colors: string
  alias: Tones['alias']
  /** The shown label's paint, if there's one to keep in time: called after every frame drawn. */
  frame: RefObject<LabelPaint | null>
}

/** The running loader: a canvas on the shared ticker while it's visible and not paused. */
function Live({ scene, view, art, speed, paused, fps, beatMs, colors, alias, frame }: LiveProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const state = useRef({ phase: scene.still, colors: palette({ ink: 'currentColor', accent: 'currentColor', paper: 'transparent' }, 1), read: '', sinceRead: 0 })
  const live = useRef({ scene, view, speed, paused, fps, beatMs, alias })
  live.current = { scene, view, speed: Math.max(speed, 0.05), paused, fps, beatMs, alias }

  const readColors = () => {
    // The canvas's own parent is the art: on the first mount the art's ref isn't attached yet when this
    // layout effect runs (a parent's ref comes after its children's effects), and the first frame would go
    // out in the canvas's default ink, black, until the next read.
    const el = canvas.current?.parentElement ?? art.current
    const probe = el?.querySelector<HTMLElement>('.yj-anim__probe')
    if (!el || !probe) return
    const look = getComputedStyle(probe)
    const css = { ink: getComputedStyle(el).color, accent: look.color, paper: look.backgroundColor }
    // The extra tones, if it draws with any: the tones probe's border colors, top, right, bottom, left.
    const tones = el.querySelector<HTMLElement>('.yj-anim__tones')
    const sides = tones && getComputedStyle(tones)
    const extra = sides ? { c1: sides.borderTopColor, c2: sides.borderRightColor, c3: sides.borderBottomColor, c4: sides.borderLeftColor } : null
    // The scheme, for lit faces: the probe's opacity is --yj-dark (1 dark, 0 light).
    const dark = parseFloat(look.opacity) || 0
    // A new palette (and its mixes) only when something changed.
    const { alias } = live.current
    const read = `${css.ink}|${css.accent}|${css.paper}|${dark}${extra ? `|${Object.values(extra).join('|')}` : ''}${alias ? `|${JSON.stringify(alias)}` : ''}`
    if (read === state.current.read) return
    state.current.read = read
    state.current.colors = palette({ ...css, ...extra }, dark, alias)
  }

  const draw = () => {
    const c = canvas.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    const { view: v, scene: s } = live.current
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, c.width, c.height)
    const scale = c.width / v.w
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    s.draw(canvasPen(ctx, state.current.colors), state.current.phase, v)
  }

  // Size the backing store for the screen's density, and paint the current frame before the browser shows it.
  useLayoutEffect(() => {
    const c = canvas.current
    if (!c) return
    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    c.width = Math.max(1, Math.round(view.w * view.px * dpr))
    c.height = Math.max(1, Math.round(view.h * view.px * dpr))
    readColors()
    draw()
    frame.current?.(state.current.phase)
  }, [view, colors])

  useEffect(() => {
    const el = art.current
    if (!el) return
    let visible = true
    let stop: (() => void) | null = null
    const sync = () => {
      const run = visible && !document.hidden && !live.current.paused
      if (run && !stop) {
        // Time not yet drawn: under a frame cap, the frames between draws add up here and the next draw takes them all.
        let owed = 0
        stop = onTick((tick) => {
          const { scene: s, speed: rate, fps: cap, beatMs: beat } = live.current
          owed += tick
          // A little short of the cap's interval still draws, so a 60 Hz screen at 30 draws every other frame, not every third.
          if (cap && owed < 1000 / cap - 4) return
          const dt = owed
          owed = 0
          state.current.phase = (state.current.phase + (dt * rate) / (s.beats * beat)) % 1
          // The ink can follow an inherited color (a button's hover): re-read it now and then.
          state.current.sinceRead += dt
          if (state.current.sinceRead > 400) {
            state.current.sinceRead = 0
            readColors()
          }
          draw()
          // The label keeps the drawing's time: the same phase, on the same tick.
          frame.current?.(state.current.phase)
        })
      } else if (!run && stop) {
        stop()
        stop = null
      }
    }
    const io = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true
      sync()
    })
    io?.observe(el)
    document.addEventListener('visibilitychange', sync)
    const unobserve = observeThemeChange(el, () => {
      readColors()
      draw()
    })
    sync()
    return () => {
      stop?.()
      io?.disconnect()
      document.removeEventListener('visibilitychange', sync)
      unobserve()
    }
  }, [paused])

  return <canvas ref={canvas} />
}
