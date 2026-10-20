import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bell,
  CircleAlert,
  CircleCheck,
  Cloud,
  Eraser,
  Flame,
  Ghost,
  Gift,
  Heart,
  HeartPulse,
  LampCeiling,
  Map,
  Mountain,
  Pencil,
  Rocket,
  Satellite,
  Send,
  Settings,
  Share2,
  ShoppingBag,
  Signature,
  Smile,
  Stamp,
  Sun,
  Trophy,
  Umbrella,
  Waypoints,
  Zap,
  ZoomIn,
  Coins,
  type LucideIcon,
} from 'lucide-react'
import { YoujProvider, useYouj } from '@youj/core'
import { cn } from '@youj/core'
import { YoujIcon, type YoujIconDirection, type YoujIconEffect, type YoujIconIntensity } from './youj-icon'
import { ease, focusRing, PageStage } from './story-kit'

interface Spec {
  effect: YoujIconEffect
  icon: LucideIcon
  note: string
}

const TRANSFORMS: Spec[] = [
  { effect: 'pop', icon: Heart, note: 'squeeze, pop, settle' },
  { effect: 'wiggle', icon: Smile, note: 'damped rotation' },
  { effect: 'spin', icon: Settings, note: 'one turn, always forwards' },
  { effect: 'nudge', icon: ArrowRight, note: 'out and back, any direction' },
  { effect: 'pulse', icon: Zap, note: 'scale and dim' },
  { effect: 'ring', icon: Bell, note: 'swings from the top' },
  { effect: 'bounce', icon: Rocket, note: 'two hops' },
  { effect: 'flip', icon: Coins, note: 'a coin turned in 3D' },
  { effect: 'swing', icon: LampCeiling, note: 'a pendulum, top pivot' },
  { effect: 'float', icon: Cloud, note: 'lifts, then bobs' },
  { effect: 'heartbeat', icon: HeartPulse, note: 'lub-dub, then release' },
  { effect: 'shake', icon: CircleAlert, note: 'a decaying “no”' },
  { effect: 'jelly', icon: Ghost, note: 'squash and stretch' },
  { effect: 'orbit', icon: Satellite, note: 'one lap round its center' },
  { effect: 'tilt', icon: Pencil, note: 'cocks and holds' },
  { effect: 'zoom-in', icon: ZoomIn, note: 'dips, returns from small' },
  { effect: 'zoom-out', icon: Stamp, note: 'dips, lands from large' },
]

const DRAWS: Spec[] = [
  { effect: 'draw', icon: Signature, note: 're-traces every stroke' },
  { effect: 'draw-in', icon: CircleCheck, note: 'rests undrawn, draws on' },
  { effect: 'draw-out', icon: Eraser, note: 'runs out through its ends' },
  { effect: 'draw-sequence', icon: Waypoints, note: 'stroke by stroke, pen speed' },
  { effect: 'stagger-draw', icon: Sun, note: 'a wave; never goes blank' },
]

const ALL = [...TRANSFORMS, ...DRAWS]
const LUCIDE = { Rocket, Heart, Bell, Settings, ArrowRight, Zap, Coins, LampCeiling, Cloud, HeartPulse, CircleAlert, Ghost, Satellite, Pencil, ZoomIn, Stamp, Signature, CircleCheck, Eraser, Waypoints, Sun, Mountain }


const meta = {
  title: 'Icons/YoujIcon',
  component: YoujIcon,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`<YoujIcon icon={AnyLucideIcon} effect="…" />` puts youj motion on any of lucide-react’s icons, with the same triggers, parent-button hover, loop pausing and reduced-motion handling as the bespoke set. 22 effects: seventeen transforms (pop, wiggle, spin, nudge, pulse, ring, bounce, flip, swing, float, heartbeat, shake, jelly, orbit, tilt, zoom-in, zoom-out) and five draws that animate each lucide stroke’s pathLength (draw, draw-in, draw-out, draw-sequence, stagger-draw). `intensity` scales amplitude, draw pace and turns; `direction` steers `nudge` and follows the reading direction. Every effect starts from the icon’s current pose, so re-triggering never jumps. Held effects (float, tilt, draw-in, draw-out) hold while active. Under reduced motion icons stay still and fully drawn.',
      },
    },
  },
  args: { icon: Rocket, effect: 'bounce', trigger: 'hover', intensity: 'default', direction: 'right', size: 64, strokeWidth: 1.5 },
  argTypes: {
    icon: { control: 'select', options: Object.keys(LUCIDE), mapping: LUCIDE },
    effect: { control: 'select', options: ALL.map((e) => e.effect) },
    trigger: { control: 'inline-radio', options: ['hover', 'mount', 'loop', 'none'] },
    intensity: { control: 'inline-radio', options: ['subtle', 'default', 'strong'] },
    direction: { control: 'inline-radio', options: ['up', 'down', 'left', 'right'] },
    active: { control: 'boolean' },
    size: { control: { type: 'range', min: 16, max: 128, step: 4 } },
    strokeWidth: { control: { type: 'range', min: 0.75, max: 3, step: 0.25 } },
  },
} satisfies Meta<typeof YoujIcon>

export default meta
type Story = StoryObj<typeof meta>

/* ── Shared ─────────────────────────────────────────────────────────────── */

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[11px] tracking-[0.18em] text-fg-muted uppercase">{children}</p>
}

function EffectCard({ spec, intensity, direction }: { spec: Spec; intensity?: YoujIconIntensity; direction?: YoujIconDirection }) {
  const { effect, icon, note } = spec
  return (
    <button
      type="button"
      aria-label={`${effect}: ${note}`}
      className={cn(
        'group flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface px-3 pt-8 pb-4 text-fg-muted hover:border-line-strong hover:text-fg',
        ease,
        focusRing,
      )}
    >
      <span className="relative grid place-items-center">
        {/* draw-in rests undrawn: a faint tracing shows what it will draw. */}
        {effect === 'draw-in' && <Tracing icon={icon} />}
        <YoujIcon icon={icon} effect={effect} trigger="hover" intensity={intensity} direction={direction} size={36} />
      </span>
      <span className="text-center">
        <span className="block font-mono text-xs text-fg">{effect}</span>
        <span className="mt-1 block text-[11px] leading-snug text-fg-muted">{note}</span>
      </span>
    </button>
  )
}

function Tracing({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon aria-hidden size={36} strokeWidth={1.5} className="absolute text-fg-subtle opacity-25" />
}

function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="mb-3 flex items-baseline gap-2 text-sm font-medium text-fg">
        {title}
        <span className="font-mono text-[11px] text-fg-muted">{count}</span>
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">{children}</div>
    </section>
  )
}

/* ── Effects ────────────────────────────────────────────────────────────── */

export const Effects: Story = {
  parameters: {
    layout: 'fullscreen',
    docs: { description: { story: 'All 22 effects. Hover or keyboard-focus a card: the card is the trigger. Intensity and direction come from the controls.' } },
  },
  render: ({ intensity, direction }) => (
    <PageStage>
      <div className="mx-auto max-w-[1080px]">
        <div className="mb-8">
          <Eyebrow>youj / icons / youj-icon</Eyebrow>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg">Motion for any lucide icon</h1>
          <p className="mt-1.5 max-w-xl text-sm text-fg-muted">
            Hover a card to play its effect. Change intensity and direction in the controls; leaving mid-effect settles from wherever it is.
          </p>
        </div>
        <Section title="Transforms" count={TRANSFORMS.length}>
          {TRANSFORMS.map((s) => (
            <EffectCard key={s.effect} spec={s} intensity={intensity} direction={direction} />
          ))}
        </Section>
        <Section title="Draws" count={DRAWS.length}>
          {DRAWS.map((s) => (
            <EffectCard key={s.effect} spec={s} intensity={intensity} direction={direction} />
          ))}
        </Section>
      </div>
    </PageStage>
  ),
}

/* ── Intensity ──────────────────────────────────────────────────────────── */

const LEVELS: YoujIconIntensity[] = ['subtle', 'default', 'strong']

export const Intensity: Story = {
  parameters: {
    layout: 'fullscreen',
    docs: { description: { story: 'The same effects at each intensity, looping side by side: amplitude for transforms, pace for draws, one or two turns for spin and flip.' } },
  },
  render: () => (
    <PageStage className="flex items-center justify-center">
      <div className="w-full max-w-[640px] overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="grid grid-cols-[120px_repeat(3,1fr)] border-b border-line px-4 py-3 font-mono text-[11px] text-fg-muted">
          <span>effect</span>
          {LEVELS.map((l) => (
            <span key={l} className="text-center">
              {l}
            </span>
          ))}
        </div>
        {(['wiggle', 'bounce', 'swing', 'shake', 'jelly', 'orbit', 'spin', 'stagger-draw'] as YoujIconEffect[]).map((effect) => {
          const spec = ALL.find((s) => s.effect === effect)!
          return (
            <div key={effect} className="grid grid-cols-[120px_repeat(3,1fr)] items-center border-b border-line px-4 py-4 last:border-b-0">
              <span className="font-mono text-xs text-fg">{effect}</span>
              {LEVELS.map((level) => (
                <span key={level} className="flex justify-center text-fg">
                  <YoujIcon icon={spec.icon} effect={effect} intensity={level} trigger="loop" size={32} />
                </span>
              ))}
            </div>
          )
        })}
      </div>
    </PageStage>
  ),
}

/* ── Direction ──────────────────────────────────────────────────────────── */

const ARROWS: Record<YoujIconDirection, LucideIcon> = { up: ArrowUp, down: ArrowDown, left: ArrowLeft, right: ArrowRight }

function NudgeRow({ dir }: { dir: 'ltr' | 'rtl' }) {
  const directions: YoujIconDirection[] = ['up', 'down', 'left', 'right']
  return (
    <div dir={dir} className="flex items-center gap-3">
      <span className="w-12 font-mono text-[11px] text-fg-muted">{dir}</span>
      {directions.map((d) => (
        <button
          key={d}
          type="button"
          className={cn('flex w-20 flex-col items-center gap-2 rounded-xl border border-line bg-surface py-4 text-fg-muted hover:text-fg', ease, focusRing)}
        >
          {/* Horizontal arrows mirror in RTL, as directional glyphs should; the nudge follows without flipping twice. */}
          <YoujIcon icon={ARROWS[d]} effect="nudge" direction={d} size={28} className={d === 'left' || d === 'right' ? 'rtl:-scale-x-100' : ''} />
          <span className="font-mono text-[10px]">{d}</span>
        </button>
      ))}
    </div>
  )
}

export const Direction: Story = {
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          '`direction` steers `nudge`. Left and right follow the reading direction: under dir="rtl" the same prop moves the other way, so a forward nudge stays forward. A glyph you mirror with CSS `scale` for RTL is already flipped, so it isn’t flipped twice.',
      },
    },
  },
  render: () => (
    <PageStage className="flex items-center justify-center">
      <div className="flex flex-col gap-3">
        <NudgeRow dir="ltr" />
        <NudgeRow dir="rtl" />
      </div>
    </PageStage>
  ),
}

/* ── In context ─────────────────────────────────────────────────────────── */

function useFlag(beats: number): [boolean, () => void] {
  const k = useYouj()
  const [on, setOn] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  return [
    on,
    () => {
      clearTimeout(timer.current)
      setOn(true)
      timer.current = setTimeout(() => setOn(false), k.ms('deliberate') * beats)
    },
  ]
}

function IconButton({ label, children, onClick }: { label: string; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn('inline-flex size-8 items-center justify-center rounded-lg text-fg-muted hover:bg-hover hover:text-fg', ease, focusRing)}
    >
      {children}
    </button>
  )
}

function ReleasePanel() {
  const k = useYouj()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'error' | 'sent'>('idle')
  const [shake, flashShake] = useFlag(1)
  const [liked, setLiked] = useState(false)
  const [beat, flashBeat] = useFlag(2)
  const [syncing, setSyncing] = useState(true)

  useEffect(() => {
    if (!syncing) return
    const t = setTimeout(() => setSyncing(false), k.ms('deliberate') * 8)
    return () => clearTimeout(t)
  }, [syncing, k])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (/^\S+@\S+\.\S+$/.test(email)) {
      setStatus('sent')
    } else {
      setStatus('error')
      flashShake()
    }
  }

  return (
    <div className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <header className="flex h-12 items-center gap-2 border-b border-line px-4">
        <span className="size-2 rounded-full bg-success" aria-hidden />
        <span className="text-sm font-medium text-fg">acme/web</span>
        <span className="font-mono text-xs text-fg-muted">main</span>
        <span className="ms-auto flex items-center gap-0.5">
          <IconButton label="Notifications">
            <YoujIcon icon={Bell} effect="ring" size={16} />
          </IconButton>
          <IconButton label="Settings">
            <YoujIcon icon={Settings} effect="spin" size={16} />
          </IconButton>
        </span>
      </header>

      <div className="border-b border-line p-5">
        <p className="text-xs text-fg-muted">Production</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-tight text-fg">Release 2.4 “Northwind”</h2>
          <button
            type="button"
            aria-pressed={liked}
            aria-label="Like release"
            onClick={() => {
              setLiked((v) => !v)
              if (!liked) flashBeat()
            }}
            className={cn('inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm hover:bg-hover', ease, focusRing, liked ? 'text-danger' : 'text-fg-muted')}
          >
            <YoujIcon icon={Heart} effect="heartbeat" active={beat} size={16} className={liked ? 'fill-current' : ''} />
            <span className="tabular-nums">{liked ? 13 : 12}</span>
          </button>
        </div>
        <p className="mt-3 flex items-center gap-2 text-sm text-fg-muted" aria-live="polite">
          <YoujIcon icon={syncing ? Cloud : CircleCheck} key={syncing ? 'sync' : 'done'} effect={syncing ? 'float' : 'draw-in'} active={syncing ? true : undefined} size={16} className={syncing ? '' : 'text-success'} />
          {syncing ? 'Syncing assets to the edge…' : 'Live on 38 regions'}
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setSyncing(true)}
            className={cn('inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-3 text-sm font-medium text-on-accent hover:opacity-90', ease, focusRing)}
          >
            <YoujIcon icon={Rocket} effect="nudge" direction="up" size={16} />
            Redeploy
          </button>
          <button type="button" className={cn('inline-flex h-9 items-center gap-2 rounded-lg border border-line px-3 text-sm font-medium text-fg hover:bg-hover', ease, focusRing)}>
            <YoujIcon icon={Share2} effect="wiggle" intensity="subtle" size={16} />
            Share
          </button>
        </div>
      </div>

      <form onSubmit={submit} noValidate className="p-5">
        <label htmlFor="reviewer" className="text-sm font-medium text-fg">
          Invite a reviewer
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="reviewer"
            type="email"
            value={email}
            placeholder="name@company.com"
            aria-invalid={status === 'error'}
            aria-describedby="reviewer-status"
            onChange={(e) => {
              setEmail(e.target.value)
              if (status !== 'idle') setStatus('idle')
            }}
            className={cn(
              'h-9 min-w-0 flex-1 rounded-lg border bg-canvas px-3 text-sm text-fg placeholder:text-fg-subtle',
              ease,
              'outline-none focus-visible:ring-2 focus-visible:ring-accent',
              status === 'error' ? 'border-danger' : 'border-line',
            )}
          />
          <button type="submit" className={cn('inline-flex h-9 items-center gap-2 rounded-lg border border-line px-3 text-sm font-medium text-fg hover:bg-hover', ease, focusRing)}>
            Send
            <YoujIcon icon={Send} effect="nudge" size={15} />
          </button>
        </div>
        <p id="reviewer-status" className="mt-2 flex h-5 items-center gap-1.5 text-xs" aria-live="polite">
          {status === 'error' && (
            <>
              <YoujIcon icon={CircleAlert} effect="shake" active={shake} size={14} className="text-danger" />
              <span className="text-danger">Enter a full email address.</span>
            </>
          )}
          {status === 'sent' && (
            <>
              <YoujIcon icon={CircleCheck} effect="draw-in" size={14} className="text-success" />
              <span className="text-fg-muted">Invite sent to {email}</span>
            </>
          )}
        </p>
      </form>
    </div>
  )
}

export const InContext: Story = {
  name: 'In context',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'A release panel. Header and button icons play on hover or focus of their button. The sync status floats while syncing, then draws its check in. Submitting an invalid email shakes the alert (controlled `active`); liking beats the heart once.',
      },
    },
  },
  render: () => (
    <PageStage className="flex items-center justify-center">
      <ReleasePanel />
    </PageStage>
  ),
}

/* ── Draw ───────────────────────────────────────────────────────────────── */

const DRAW_SET = [Mountain, Map, Cloud, Umbrella, Trophy, Gift, ShoppingBag, Flame, Sun]

export const Draw: Story = {
  parameters: {
    layout: 'fullscreen',
    docs: { description: { story: 'The draw family on detailed lucide icons, looping so the stroke order is visible.' } },
  },
  render: () => (
    <PageStage className="flex items-center justify-center">
      <div className="flex flex-col gap-8">
        {(['draw', 'draw-in', 'draw-out', 'draw-sequence', 'stagger-draw'] as YoujIconEffect[]).map((effect) => (
          <div key={effect} className="flex items-center gap-8">
            <span className="w-28 font-mono text-xs text-fg-muted">{effect}</span>
            <div className="flex flex-wrap gap-8 text-fg">
              {DRAW_SET.map((I, i) => (
                <YoujIcon key={i} icon={I} effect={effect} trigger="loop" size={36} strokeWidth={1.25} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageStage>
  ),
}

/* ── Playground ─────────────────────────────────────────────────────────── */

export const Playground: Story = {
  render: (args) => (
    <div className={cn('rounded-2xl border border-line bg-surface p-10 text-fg')}>
      <YoujIcon key={`${args.effect}-${args.trigger}`} {...args} />
    </div>
  ),
}

/* ── Reduced motion ─────────────────────────────────────────────────────── */

export const ReducedMotion: Story = {
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Forced reduced motion: hover does nothing and loops stop. Every icon rests fully drawn, including draw-in; a controlled draw-out (active) or draw-in (inactive) is hidden instantly instead of animated.',
      },
    },
  },
  render: () => (
    <YoujProvider reducedMotion="always">
      <PageStage>
        <div className="mx-auto max-w-[1080px]">
          <Eyebrow>reduced motion</Eyebrow>
          <Section title="Every effect, at rest" count={ALL.length}>
            {ALL.map((s) => (
              <EffectCard key={s.effect} spec={s} />
            ))}
          </Section>
        </div>
      </PageStage>
    </YoujProvider>
  ),
}
