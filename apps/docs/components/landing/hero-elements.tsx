'use client'

import { useEffect, useId, useRef, useState, type ComponentType, type CSSProperties, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { easings, ThemeScope, useYouj } from '@youj/core'
import { paletteById, styleById } from '@youj/core/lib/youj/theme'
import type { LoaderProps } from '@youj/loaders'
import { IllustrationServerRack } from '@youj/illustrations'
import { ApertureIcon, CheckCircleIcon, HeartIcon, RocketIcon, ThemeIcon, type YoujIconComponent } from '@youj/icons'
import { Badge, Button, Switch, ToggleGroup, ToggleGroupItem } from '@youj/react'
import { idle } from '@/components/graphics/stack/scene'
import { useLoop, usePlaying } from '@/components/landing/use-loop'
import { cn } from '@/lib/cn'
import type { MenuWave, PillarId } from '@/lib/nav'

/* The home hero's one set of elements (their sizes, their places in the card and its frame are hero-card.tsx's): a release going out ("Checkout v2.4 → production"), each piece of it one of the
 * parts Youj is made of. The same element is the hero card's piece at rest and its part's tile once the card has come
 * apart (components/landing/hero-stage.tsx). UI is the release's alerts panel, Motion its rollout curve, Loaders
 * Banyan (the set's flagship), Icons the card's toolbar, Illustrations the server rack it ships to, Sound the
 * notification it sounds (drawn, never played), Themes the appearance switcher and the surface it re-themes, and Blocks
 * the card's frame: the page's layout. Every one plays all the time it's on screen in a visible tab, as lightly as it
 * allows (the curve, the waveform and the switcher on the compositor; Banyan's canvas only while seen); reduced motion
 * shows its resting state. They're pictures, not
 * controls: whoever renders them hides them from assistive technology. */

/* ── UI: the release's alerts, moving through their states ──────────────── */

const DIGEST = ['instant', 'hourly', 'daily'] as const

function AlertsPanel() {
  const id = useId()
  const k = useYouj()
  const root = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)
  // A step every three beats: each step runs its components' springs on the page's script, so fewer of them cost less.
  useLoop(root, k.ms('deliberate') * 3, () => setStep((s) => (s + 1) % 6))
  const saving = step === 4
  const saved = step === 5

  return (
    <div ref={root} className="w-[15.5rem] rounded-xl border border-line bg-surface text-start shadow-md">
      <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
        <span className="text-ui font-semibold text-fg">Build alerts</span>
        <Badge variant={saved ? 'success' : 'secondary'}>{saved ? 'Saved' : 'Live'}</Badge>
      </div>
      <div className="flex flex-col gap-3 px-3.5 py-3">
        <div className="flex items-center justify-between gap-3">
          <span id={`${id}-email`} className="text-ui-sm text-fg">
            Email on failure
          </span>
          <Switch aria-labelledby={`${id}-email`} checked={step % 3 !== 1} size="sm" />
        </div>
        <ToggleGroup variant="segmented" size="sm" aria-label="Digest" value={[DIGEST[Math.floor(step / 2) % 3]!]} className="w-full">
          <ToggleGroupItem value="instant">Instant</ToggleGroupItem>
          <ToggleGroupItem value="hourly">Hourly</ToggleGroupItem>
          <ToggleGroupItem value="daily">Daily</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="flex justify-end border-t border-line px-3.5 py-2">
        <Button size="sm" loading={saving}>
          Save
        </Button>
      </div>
    </div>
  )
}

/* ── Motion: the rollout's curve, and what it does to a point ──────────── */

const PLOT = { x: 18, y: 16, w: 176, h: 104 }
const RAIL = PLOT.x + PLOT.w + 22

/**
 * The curve, and what it does to a point: the point runs along it (across at a constant rate, up on the curve's own
 * ease), a trail behind it, and the value it carries rises on the rail beside it. The curve is drawn once; what moves
 * are a few small boxes, each on one CSS animation of its translate or scale (ho-run-* in styles/site.css), so the
 * compositor runs the loop and no frame touches the page's script or its SVG.
 */
function RolloutCurve() {
  const k = useYouj()
  const root = useRef<HTMLDivElement>(null)
  const playing = usePlaying(root)
  const [x1, y1, x2, y2] = easings.enter
  const p = (u: number, v: number) => `${PLOT.x + PLOT.w * u} ${PLOT.y + PLOT.h * (1 - v)}`
  const curve = `M ${p(0, 0)} C ${p(x1, y1)} ${p(x2, y2)} ${p(1, 1)}`
  const run = k.ms('deliberate') * 3
  const style = {
    '--run': `${run}ms`,
    '--run-ease': `cubic-bezier(${x1},${y1},${x2},${y2})`,
    // Under reduced motion, the point at its end.
    ...(k.reduced ? { '--run-at': `${(-run * 2) / 3}ms` } : {}),
  } as CSSProperties
  const point = (lag: number, className: string, size: number) => (
    <span key={lag} className="ho-run-x absolute" style={{ left: PLOT.x, top: PLOT.y + PLOT.h, animationDelay: lag ? `${lag * run}ms` : undefined }}>
      <span className="ho-run-y absolute block" style={{ animationDelay: lag ? `${lag * run}ms` : undefined }}>
        <span className={cn('absolute block rounded-full', className)} style={{ width: size, height: size, left: -size / 2, top: -size / 2 }} />
      </span>
    </span>
  )
  return (
    <div ref={root} data-still={playing ? undefined : ''} className="ho-run relative h-[136px] w-[240px]" style={style}>
      <svg viewBox="0 0 240 136" className="absolute inset-0 size-full overflow-visible" fill="none">
        <path d={`M ${PLOT.x} ${PLOT.y + PLOT.h} H ${PLOT.x + PLOT.w}`} className="stroke-line-strong" strokeWidth={1} />
        <path d={`M ${PLOT.x} ${PLOT.y} V ${PLOT.y + PLOT.h}`} className="stroke-line-strong" strokeWidth={1} />
        <path d={`M ${RAIL} ${PLOT.y} V ${PLOT.y + PLOT.h}`} className="stroke-line" strokeWidth={4} strokeLinecap="round" />
        <path d={curve} className="stroke-fg-muted" strokeWidth={1.5} />
      </svg>
      {/* The guide from the point to the rail: it rises with the point and shortens as the point nears the rail. */}
      <span className="ho-run-y absolute" style={{ left: PLOT.x, top: PLOT.y + PLOT.h, width: RAIL - PLOT.x }}>
        <span className="ho-run-w absolute block w-full origin-right border-t border-dashed border-accent-line" />
      </span>
      {[0.12, 0.08, 0.04].map((lag) => point(lag, 'bg-accent-line', 5))}
      {point(0, 'bg-accent', 8)}
      <span className="ho-run-y absolute" style={{ left: RAIL - 5, top: PLOT.y + PLOT.h - 5 }}>
        <span className="block size-2.5 rounded-[2px] bg-accent" />
      </span>
    </div>
  )
}

/* ── Icons: the card's toolbar, a wave crossing it ──────────────────────── */

const TOOLBAR: YoujIconComponent[] = [ThemeIcon, ApertureIcon, RocketIcon, HeartIcon]

function WaveIcon({ Icon, phase, delay }: { Icon: YoujIconComponent; phase: number; delay: number }) {
  const k = useYouj()
  const stateful = Boolean(Icon.meta.states)
  const [active, setActive] = useState<boolean | undefined>(stateful ? false : undefined)
  useEffect(() => {
    if (phase === 0) return
    const timers = [
      setTimeout(() => setActive(stateful ? phase % 2 === 1 : true), delay * 1000),
      // One-shot icons hand back to rest after their choreography.
      ...(stateful ? [] : [setTimeout(() => setActive(undefined), delay * 1000 + k.ms('deliberate') * 1.6)]),
    ]
    return () => timers.forEach(clearTimeout)
  }, [phase, delay, stateful, k])
  return (
    <span className="grid size-8 place-items-center rounded-md text-fg">
      <Icon size={17} strokeWidth={1.75} active={active} trigger="none" />
    </span>
  )
}

function IconToolbar() {
  const k = useYouj()
  const root = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState(0)
  // A wave every six beats: each icon's choreography runs on the page's script, so the toolbar rests between waves.
  useLoop(root, k.ms('deliberate') * 6, () => setPhase((p) => p + 1))
  return (
    <div ref={root} className="hc-toolbar flex h-9 w-full items-center justify-around rounded-lg border border-line bg-chrome-float px-1">
      {TOOLBAR.map((Icon, i) => (
        <WaveIcon key={i} Icon={Icon} phase={phase} delay={i * k.stagger('base')} />
      ))}
    </div>
  )
}

/* ── Themes: the appearance switcher, and the surface it re-themes ──────── */

/** The looks it moves through: a palette (the colour) and a style (the form), both changing, so each step shows a theme
 *  is the two layers. */
const LOOKS = [
  { palette: 'youj', style: 'clean' },
  { palette: 'sandstone', style: 'bezel' },
  { palette: 'cinnabar', style: 'brutal' },
  { palette: 'seaglass', style: 'terminal' },
] as const
/* The styles' own typefaces are the page's heaviest fonts: the preview keeps the site's face, so the page never fetches them. */
const SITE_FACE = { fontFamily: 'var(--font-sans)' } as CSSProperties

function AppearancePanel() {
  const k = useYouj()
  const root = useRef<HTMLDivElement>(null)
  const [at, setAt] = useState(0)
  useLoop(root, k.ms('deliberate') * 3, () => setAt((i) => (i + 1) % LOOKS.length))
  const active = LOOKS[at]!
  return (
    <div ref={root} className="flex size-full flex-col gap-2 rounded-xl border border-line bg-overlay p-2" style={SITE_FACE}>
      <div className="flex h-7 items-center gap-1 rounded-lg bg-band p-0.5">
        {LOOKS.map((look) => (
          <ThemeScope key={look.palette} palette={paletteById(look.palette)}>
            <span
              data-on={look === active ? '' : undefined}
              className="flex h-full flex-1 items-center justify-center gap-1.5 rounded-md text-[11px] font-medium text-fg-muted transition-[flex-grow,background-color] yj-duration-base ease-standard data-on:flex-[2] data-on:bg-surface data-on:text-fg data-on:shadow-sm"
            >
              <span className="size-2.5 shrink-0 rounded-full bg-accent" />
              {look === active && (
<span className="truncate">{paletteById(look.palette).name}</span>
              )}
            </span>
          </ThemeScope>
        ))}
      </div>
      <ThemeScope palette={paletteById(active.palette)} style={styleById(active.style)}>
        <div className="flex flex-1 items-center gap-3 rounded-lg border border-line bg-surface px-3 text-fg" style={SITE_FACE}>
          <span className="text-[22px] leading-none font-semibold">Aa</span>
          <span className="flex flex-1 flex-col gap-1.5">
            <span className="h-1 w-full rounded-full bg-line" />
            <span className="h-1 w-2/3 rounded-full bg-line" />
          </span>
          <span className="inline-flex h-6 items-center rounded-md bg-accent px-2 text-[10.5px] font-medium text-on-accent">Deploy</span>
        </div>
      </ThemeScope>
    </div>
  )
}

/* ── Illustrations: the rack the release ships to ───────────────────────── */

/** The server rack, coming apart and back together. Its blade's ambient bob is left off: it ran on the page's script every
 *  frame, and the rack's own coming apart keeps it moving. */
function RackScene() {
  const k = useYouj()
  const root = useRef<HTMLDivElement>(null)
  const [apart, setApart] = useState(false)
  useLoop(root, k.ms('deliberate') * 4, () => setApart((a) => !a))
  return (
    <div ref={root} className="grid size-full place-items-center [&_svg]:h-full [&_svg]:w-auto">
      <IllustrationServerRack unit={16} explode={apart ? 1 : 0} float={false} />
    </div>
  )
}

/* ── Sound: the release's notification and the cue it sounds ───────────── */

/**
 * The notification, with its cue drawn: it moves through the pack's cues, each bar settling to the next one's shape (a
 * transition of its scale) and each cue played through by a sweep of the accent (a reveal on translate, then a fade).
 * All compositor work: the page's script only changes which cue it is, every few beats.
 */
function Notification({ waves }: { waves: MenuWave[] }) {
  const k = useYouj()
  const root = useRef<HTMLDivElement>(null)
  const playing = usePlaying(root)
  const first = Math.max(0, waves.findIndex((w) => w.label === 'Success'))
  const [index, setIndex] = useState(first)
  useLoop(root, k.ms('deliberate') * 3, () => setIndex((i) => (i + 1) % Math.max(waves.length, 1)))
  const wave = waves[index]
  if (!wave) return null
  // On a root scale, as the ear hears a decay, so a quiet tail still has a shape.
  const bars = (className: string) =>
    wave.peaks.map((peak, i) => (
      <span
        key={i}
        className={cn('h-full w-1 rounded-full transition-[scale] ease-standard', className)}
        style={{ scale: `1 ${Math.max(0.1, Math.sqrt(peak / 100))}`, transitionDuration: k.reduced ? '0ms' : `${k.ms('slow')}ms`, transitionDelay: k.reduced ? '0ms' : `${i * k.stagger('tight')}ms` }}
      />
    ))
  return (
    <div ref={root} className="flex size-full flex-col justify-center gap-2.5 rounded-xl border border-line bg-overlay px-3 py-2.5 shadow-lg">
      <div className="flex items-center gap-2.5">
        <CheckCircleIcon size={16} strokeWidth={2} className="shrink-0 text-success" />
        <span className="min-w-0 flex-1 truncate text-ui font-medium text-fg">v2.4 is live</span>
        <span className="type-label flex items-center gap-1.5 leading-none text-fg-subtle">
          <span className="particle size-1" />
          {wave.label} · {wave.ms} ms
        </span>
      </div>
      {/* Time runs left to right in either direction, as the builder draws it. */}
      <div dir="ltr" className="relative h-9 overflow-hidden px-1">
        <div className="absolute inset-x-1 inset-y-0 flex items-center justify-between">{bars('bg-line-strong')}</div>
        {playing && (
          <div
            key={index}
            className="ho-sweep absolute inset-x-1 inset-y-0 overflow-hidden"
            style={{ '--sweep': `${k.ms('deliberate')}ms`, '--sweep-wait': `${k.ms('slow')}ms` } as CSSProperties}
          >
            <div className="ho-sweep-in absolute inset-0 flex items-center justify-between">{bars('bg-accent')}</div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Loaders: Banyan, the set's flagship ─────────────────────────────── */

/** Banyan's module: a chunk of its own, fetched once the page is idle, so the page's load carries none of it. */
const loadBanyan = () => import('@youj/loaders/banyan').then((m) => m.LoaderBanyan)

/** The tree grows, breathes, carries its sap and lets go, drawing only while it's on screen in a visible tab. */
function BanyanTree() {
  const k = useYouj()
  const root = useRef<HTMLDivElement>(null)
  const playing = usePlaying(root)
  const [Banyan, setBanyan] = useState<ComponentType<LoaderProps> | null>(null)
  useEffect(() => {
    let alive = true
    const cancel = idle(
      () =>
        loadBanyan().then(
          (component) => alive && setBanyan(() => component),
          () => {},
        ),
      3000,
    )
    return () => {
      alive = false
      cancel()
    }
  }, [])
  return (
    <div ref={root} className="grid size-full place-items-center text-fg [--yj-anim-paper:var(--color-surface)]">
      {Banyan && (
        <motion.div initial={k.reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={k.tween('slow', 'enter')}>
          {/* On a light page its fine ink would be the card's faintest mark: there it's drawn in the accent's ink. */}
          <Banyan size={236} label={null} paused={!playing} fps={30} color="var(--ho-banyan-ink, var(--color-fg))" accentColor="var(--color-accent)" />
        </motion.div>
      )}
    </div>
  )
}

/** One element, at its natural size. */
export function HeroElement({ id, waves }: { id: Exclude<PillarId, 'blocks'>; waves: MenuWave[] }): ReactNode {
  switch (id) {
    case 'ui':
      return <AlertsPanel />
    case 'motion':
      return <RolloutCurve />
    case 'loaders':
      return <BanyanTree />
    case 'icons':
      return <IconToolbar />
    case 'themes':
      return <AppearancePanel />
    case 'illustrations':
      return <RackScene />
    case 'sound':
      return <Notification waves={waves} />
  }
}
