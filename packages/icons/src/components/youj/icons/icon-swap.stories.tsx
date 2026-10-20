import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useMotionValue } from 'motion/react'
import {
  Bell,
  BellOff,
  Bookmark,
  BookmarkCheck,
  Check,
  Copy,
  Eye,
  EyeOff,
  Heart,
  HeartCrack,
  Lock,
  LockOpen,
  Moon,
  Pause,
  Play,
  Plus,
  Search,
  Loader,
  Sun,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  X,
  Star,
  Sparkles,
  Mic,
  MicOff,
  Link2,
  Link2Off,
  ArrowRight,
  Share2,
  type LucideProps,
} from 'lucide-react'
import { YoujProvider, useYouj } from '@youj/core'
import { cn } from '@youj/core'
import { IconSwap, type IconSwapDirection, type IconSwapTransition, type SwapIcon } from './icon-swap'
import { useIconState } from './use-icon-state'
import { BellIcon, HeartIcon, SearchIcon, StarIcon } from './index'
import { ease, focusRing, PageStage, useFlash } from './story-kit'

const TRANSITIONS: { id: IconSwapTransition; note: string }[] = [
  { id: 'scale-blur', note: 'shrinks out of focus, sharpens in' },
  { id: 'rotate', note: 'one continuous quarter turn' },
  { id: 'morph', note: 'true path morph between any two icons' },
  { id: 'draw', note: 'strokes run out, new strokes draw in' },
  { id: 'flip', note: 'a card turned on its vertical axis' },
  { id: 'fold', note: 'hinged flaps, top and bottom' },
  { id: 'slide', note: 'one strip pushed through the box' },
  { id: 'wipe', note: 'a hard edge sweeps across' },
  { id: 'zoom', note: 'out flies past, in arrives from far' },
  { id: 'pop', note: 'success: one settle overshoot' },
]

interface Pair {
  name: string
  from: SwapIcon
  to: SwapIcon
  states: [string, string]
}

const PAIRS: Pair[] = [
  { name: 'bookmark', from: Bookmark, to: BookmarkCheck, states: ['bookmark', 'bookmarked'] },
  { name: 'bell', from: Bell, to: BellOff, states: ['notify', 'muted'] },
  { name: 'theme', from: Sun, to: Moon, states: ['light', 'dark'] },
  { name: 'copy', from: Copy, to: Check, states: ['copy', 'copied'] },
  { name: 'play', from: Play, to: Pause, states: ['play', 'pause'] },
  { name: 'heart', from: Heart, to: HeartCrack, states: ['love', 'broken'] },
  { name: 'lock', from: Lock, to: LockOpen, states: ['locked', 'unlocked'] },
  { name: 'wifi', from: Wifi, to: WifiOff, states: ['online', 'offline'] },
  { name: 'volume', from: Volume2, to: VolumeX, states: ['sound', 'muted'] },
  { name: 'eye', from: Eye, to: EyeOff, states: ['visible', 'hidden'] },
  { name: 'plus', from: Plus, to: X, states: ['add', 'close'] },
]


const meta = {
  title: 'Icons/IconSwap',
  component: IconSwap,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`<IconSwap from={A} to={B} active={on} transition="…" />` swaps any two icons, lucide-react or youj, with a choreographed transition. Every transition is a pure function of one progress value, so toggling mid-swap reverses from exactly where it is and rapid toggles never jump. `morph` is a true path morph between arbitrary icons with no dependency: strokes shared by both icons stay put, strokes cut by a slash are carved out of the original, the rest pair by position and morph rotation-aware, and leftovers draw in or retract. Pass `labels` for a standalone status icon; inside a labeled button leave them out, and use `useIconState` for the button\'s aria-pressed or label handling. Under reduced motion the swap is instant.',
      },
    },
  },
  args: { from: Bookmark, to: BookmarkCheck, transition: 'morph', active: false, size: 64, strokeWidth: 1.5 },
  argTypes: {
    from: { control: false },
    to: { control: false },
    transition: { control: 'inline-radio', options: TRANSITIONS.map((t) => t.id) },
    direction: { control: 'inline-radio', options: ['up', 'down', 'left', 'right'] },
    trigger: { control: 'inline-radio', options: ['hover', 'mount', 'loop', 'none'] },
    active: { control: 'boolean' },
    progress: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    size: { control: { type: 'range', min: 16, max: 160, step: 4 } },
    strokeWidth: { control: { type: 'range', min: 0.75, max: 3, step: 0.25 } },
  },
} satisfies Meta<typeof IconSwap>

export default meta
type Story = StoryObj<typeof meta>

/* ── Shared ─────────────────────────────────────────────────────────────── */

function Heading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.18em] text-fg-muted uppercase">{eyebrow}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg">{title}</h1>
      {children && <p className="mt-1.5 max-w-xl text-sm text-fg-muted">{children}</p>}
    </div>
  )
}

function Chip({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('h-8 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-fg hover:bg-hover', ease, focusRing)}
    >
      {children}
    </button>
  )
}

/** Timeouts that die with the component. */
function useSchedule() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  return (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms))
  }
}

/* ── Matrix ─────────────────────────────────────────────────────────────── */

function Matrix({ auto }: { auto: boolean }) {
  const k = useYouj()
  const schedule = useSchedule()
  const [cells, setCells] = useState<boolean[][]>(() => TRANSITIONS.map(() => PAIRS.map(() => false)))
  const set = (row: number, col: number, value: boolean) =>
    setCells((c) => c.map((r, i) => (i === row ? r.map((v, j) => (j === col ? value : v)) : r)))
  const step = k.stagger('tight') * 1000

  // A row ripples left to right; everything ripples diagonally.
  const toggleRow = (row: number) => {
    const next = !cells[row]!.every(Boolean)
    PAIRS.forEach((_, col) => schedule(() => set(row, col, next), col * step))
  }
  const all = cells.every((r) => r.every(Boolean))
  const toggleAll = () => TRANSITIONS.forEach((_, row) => PAIRS.forEach((_, col) => schedule(() => set(row, col, !all), (row + col) * step)))

  const latest = useRef(toggleAll)
  latest.current = toggleAll
  useEffect(() => {
    if (!auto || k.reduced) return
    const t = setInterval(() => latest.current(), k.ms('deliberate') * 4)
    return () => clearInterval(t)
  }, [auto, k])

  return (
    <PageStage>
      <div className="mx-auto max-w-[980px]">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <Heading eyebrow="youj / icons / swap" title="Any two icons, ten ways across">
            Ten choreographies on eleven common lucide pairs. Click a row to swap it; click again mid-swap to watch it reverse from where it is.
          </Heading>
          <Chip onClick={toggleAll}>{all ? 'Reset all' : 'Swap all'}</Chip>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <div className="min-w-[760px]">
            <div aria-hidden className="grid grid-cols-[132px_repeat(11,minmax(0,1fr))] border-b border-line px-2 py-3">
              <span />
              {PAIRS.map((p) => (
                <span key={p.name} className="text-center font-mono text-[10px] text-fg-muted">
                  {p.name}
                </span>
              ))}
            </div>
            {TRANSITIONS.map((t, row) => {
              const pressed = cells[row]!.every(Boolean)
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={pressed}
                  aria-label={`${t.id}: swap every pair`}
                  onClick={() => toggleRow(row)}
                  className={cn(
                    'group grid w-full grid-cols-[132px_repeat(11,minmax(0,1fr))] items-center border-b border-line px-2 py-3.5 text-left last:border-b-0 hover:bg-hover',
                    ease,
                    'outline-none focus-visible:bg-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset',
                  )}
                >
                  <span className="pl-2">
                    <span className="block font-mono text-xs text-fg">{t.id}</span>
                    <span className="mt-0.5 block text-[11px] leading-tight text-fg-muted">{t.note}</span>
                  </span>
                  {PAIRS.map((p, col) => (
                    <span key={p.name} className="flex justify-center text-fg-muted group-hover:text-fg">
                      <IconSwap from={p.from} to={p.to} active={cells[row]![col]} transition={t.id} size={22} />
                    </span>
                  ))}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </PageStage>
  )
}

export const Transitions: Story = {
  parameters: { layout: 'fullscreen', docs: { description: { story: 'Every transition on every pair. Use the toolbar’s ¼× speed to study the choreography.' } } },
  render: () => <Matrix auto={false} />,
}

export const TransitionsAutoplay: Story = {
  name: 'Transitions (autoplay)',
  parameters: { layout: 'fullscreen', docs: { description: { story: 'The matrix swapping itself on a slow cycle, in a diagonal ripple. Stops under reduced motion.' } } },
  render: () => <Matrix auto />,
}

/* ── Gallery ────────────────────────────────────────────────────────────── */

function PairCard({ pair, transition, size = 40 }: { pair: Pair; transition: IconSwapTransition; size?: number }) {
  const state = useIconState({ label: `${pair.states[0]} / ${pair.states[1]}` })
  return (
    <button
      {...state.buttonProps}
      className={cn(
        'group flex flex-col items-center gap-5 rounded-2xl border bg-surface px-4 pt-8 pb-5',
        ease,
        focusRing,
        state.active ? 'border-line-strong text-fg' : 'border-line text-fg-muted hover:text-fg',
      )}
    >
      <IconSwap {...state.iconProps} from={pair.from} to={pair.to} transition={transition} size={size} />
      <span className="flex items-center gap-1.5 font-mono text-[11px]">
        <span className={state.active ? 'text-fg-muted' : 'text-fg'}>{pair.states[0]}</span>
        <span className="text-fg-muted">↔</span>
        <span className={state.active ? 'text-fg' : 'text-fg-muted'}>{pair.states[1]}</span>
      </span>
    </button>
  )
}

/** A radio group: one tab stop, arrow keys (and Home/End) move the selection. */
function TransitionPicker({ value, onChange }: { value: IconSwapTransition; onChange: (t: IconSwapTransition) => void }) {
  const group = useRef<HTMLDivElement>(null)
  const move = (e: KeyboardEvent) => {
    const i = TRANSITIONS.findIndex((t) => t.id === value)
    const last = TRANSITIONS.length - 1
    const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: last }[e.key]
    if (next === undefined) return
    e.preventDefault()
    const index = (next + TRANSITIONS.length) % TRANSITIONS.length
    onChange(TRANSITIONS[index]!.id)
    group.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[index]?.focus()
  }
  return (
    <div ref={group} role="radiogroup" aria-label="Transition" onKeyDown={move} className="flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1">
      {TRANSITIONS.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={value === t.id}
          tabIndex={value === t.id ? 0 : -1}
          onClick={() => onChange(t.id)}
          className={cn(
            'h-7 rounded-lg px-2.5 font-mono text-xs',
            ease,
            focusRing,
            value === t.id ? 'bg-selected text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
          )}
        >
          {t.id}
        </button>
      ))}
    </div>
  )
}

function Gallery() {
  const [transition, setTransition] = useState<IconSwapTransition>('morph')
  return (
    <PageStage>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Heading eyebrow="youj / icons / swap" title="Common pairs">
            Pick a transition, then click any card. Each card is a toggle built with useIconState.
          </Heading>
        </div>
        <div className="mb-6">
          <TransitionPicker value={transition} onChange={setTransition} />
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
          {PAIRS.map((p) => (
            <PairCard key={p.name} pair={p} transition={transition} />
          ))}
        </div>
      </div>
    </PageStage>
  )
}

export const Pairs: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => <Gallery />,
}

/* ── Morph ──────────────────────────────────────────────────────────────── */

/** A filled variant is just another component: the morph blends fill as well as shape. */
function HeartFilled(props: LucideProps) {
  return <Heart {...props} fill="currentColor" />
}

const MORPHS: Pair[] = [
  ...PAIRS,
  { name: 'mic', from: Mic, to: MicOff, states: ['live', 'muted'] },
  { name: 'link', from: Link2, to: Link2Off, states: ['linked', 'unlinked'] },
  { name: 'like', from: Heart, to: HeartFilled, states: ['like', 'liked'] },
  { name: 'youj → lucide', from: SearchIcon, to: X, states: ['search', 'clear'] },
  { name: 'unrelated', from: ArrowRight, to: Check, states: ['next', 'done'] },
]

function MorphCard({ pair, active, onToggle }: { pair: Pair; active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`${pair.states[0]} / ${pair.states[1]}`}
      onClick={onToggle}
      className={cn(
        'group flex flex-col items-center gap-4 rounded-2xl border bg-surface px-4 pt-7 pb-4',
        ease,
        focusRing,
        active ? 'border-line-strong text-fg' : 'border-line text-fg-muted hover:text-fg',
      )}
    >
      <IconSwap from={pair.from} to={pair.to} active={active} transition="morph" size={64} strokeWidth={1.5} />
      <span className="flex items-center gap-1.5 font-mono text-[11px]">
        <span className={active ? 'text-fg-muted' : 'text-fg'}>{pair.states[0]}</span>
        <span className="text-fg-muted">→</span>
        <span className={active ? 'text-fg' : 'text-fg-muted'}>{pair.states[1]}</span>
      </span>
    </button>
  )
}

function MorphShowcase() {
  const [on, setOn] = useState<Record<string, boolean>>({})
  const all = MORPHS.every((p) => on[p.name])
  return (
    <PageStage>
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <Heading eyebrow="youj / icons / swap / morph" title="One shape becomes another">
            A true path morph between any two icons, with no dependency. Shared strokes hold still, strokes cut by a slash are carved from the original, the rest turn and bend into place, and leftovers draw in or retract.
          </Heading>
          <Chip onClick={() => setOn(Object.fromEntries(MORPHS.map((p) => [p.name, !all])))}>{all ? 'Reset all' : 'Morph all'}</Chip>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
          {MORPHS.map((p) => (
            <MorphCard key={p.name} pair={p} active={Boolean(on[p.name])} onToggle={() => setOn((s) => ({ ...s, [p.name]: !s[p.name] }))} />
          ))}
        </div>
      </div>
    </PageStage>
  )
}

export const Morph: Story = {
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'Every common pair plus mic, link, a fill morph (heart → filled heart), a youj icon into a lucide one, and two unrelated icons. Click a card; click again mid-morph to reverse it.',
      },
    },
  },
  render: () => <MorphShowcase />,
}

/* ── In context ─────────────────────────────────────────────────────────── */

const toolButton = cn('inline-flex size-8 items-center justify-center rounded-lg text-fg-muted hover:bg-hover hover:text-fg aria-pressed:text-fg', ease, focusRing)

function Reader() {
  const notify = useIconState({ label: 'Notify me about replies' })
  const save = useIconState({ label: 'Save' })
  const play = useIconState({ labels: ['Play article', 'Pause article'] })
  const mute = useIconState({ label: 'Mute' })
  const like = useIconState({ label: 'Like' })
  const [copied, flashCopied] = useFlash(3)

  return (
    <article className="w-full max-w-[460px] rounded-2xl border border-line bg-surface shadow-sm">
      <header className="flex items-center gap-3 px-5 pt-5">
        <span aria-hidden className="grid size-8 place-items-center rounded-full bg-well text-xs font-semibold text-fg-muted">
          MC
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-fg">Mira Chen</span>
          <span className="block text-xs text-fg-muted">6 min read</span>
        </span>
        <button {...notify.buttonProps} title="Notify me about replies" className={toolButton}>
          <IconSwap {...notify.iconProps} from={Bell} to={BellOff} transition="morph" size={18} />
        </button>
        <button {...save.buttonProps} title="Save" className={toolButton}>
          <IconSwap {...save.iconProps} from={Bookmark} to={BookmarkCheck} transition="draw" size={18} />
        </button>
      </header>

      <div className="px-5 pt-4 pb-5">
        <h2 className="text-lg leading-snug font-semibold tracking-tight text-fg">Motion that respects attention</h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          Every transition spends a little of the reader’s focus. The best ones pay it back by explaining what changed.
        </p>

        <div className="mt-5 flex items-center gap-3 rounded-xl border border-line bg-canvas p-2 pe-3">
          <button
            {...play.buttonProps}
            className={cn('inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-on-accent hover:opacity-90', ease, focusRing)}
          >
            <IconSwap {...play.iconProps} from={Play} to={Pause} transition="morph" size={18} strokeWidth={2} />
          </button>
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-fg-muted">Listen</span>
            <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-line">
              <span className={cn('block h-full w-1/3 rounded-full', play.active ? 'bg-accent' : 'bg-fg-subtle')} />
            </span>
          </span>
          <span className="font-mono text-xs text-fg-muted tabular-nums">2:04</span>
          <button {...mute.buttonProps} title="Mute" className={toolButton}>
            <IconSwap {...mute.iconProps} from={Volume2} to={VolumeX} transition="morph" size={18} />
          </button>
        </div>
      </div>

      <footer className="flex items-center gap-1 border-t border-line px-3 py-2">
        <button
          {...like.buttonProps}
          className={cn('inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm hover:bg-hover', ease, focusRing, like.active ? 'text-danger' : 'text-fg-muted')}
        >
          <IconSwap {...like.iconProps} from={Heart} to={HeartFilled} transition="pop" size={16} />
          <span className="tabular-nums">{like.active ? 129 : 128}</span>
        </button>
        <button
          type="button"
          onClick={flashCopied}
          className={cn('inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm text-fg-muted hover:bg-hover hover:text-fg', ease, focusRing)}
        >
          <IconSwap from={Copy} to={Check} active={copied} transition="rotate" size={16} className={copied ? 'text-success' : ''} />
          <span aria-live="polite">{copied ? 'Copied' : 'Copy link'}</span>
        </button>
        <button type="button" aria-label="Share" title="Share" className={cn('ms-auto', toolButton)}>
          <IconSwap from={Share2} to={ArrowRight} transition="slide" direction="right" size={16} />
        </button>
      </footer>
    </article>
  )
}

function AccountPanel() {
  const reveal = useIconState({ labels: ['Show password', 'Hide password'] })
  const theme = useIconState({ labels: ['Switch to dark theme', 'Switch to light theme'] })
  const lock = useIconState({ label: 'Lock workspace' })
  const [online, setOnline] = useState(true)

  return (
    <section aria-label="Account" className="w-full max-w-[360px] rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-fg">Account</h2>
        <button {...theme.buttonProps} title={theme.buttonProps['aria-label']} className={toolButton}>
          <IconSwap {...theme.iconProps} from={Sun} to={Moon} transition="morph" size={18} />
        </button>
      </div>

      <label htmlFor="password" className="mt-4 block text-xs font-medium text-fg-muted">
        Password
      </label>
      <div className="mt-1.5 flex h-9 items-center rounded-lg border border-line bg-canvas ps-3 pe-1 focus-within:ring-2 focus-within:ring-accent">
        <input
          id="password"
          type={reveal.active ? 'text' : 'password'}
          defaultValue="correct-horse-battery"
          className="min-w-0 flex-1 bg-transparent font-mono text-sm text-fg outline-none"
        />
        <button {...reveal.buttonProps} className={toolButton}>
          <IconSwap {...reveal.iconProps} from={Eye} to={EyeOff} transition="morph" size={16} />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-line px-3 py-2.5">
        <span className="flex items-center gap-2 text-sm text-fg">
          <IconSwap
            from={Wifi}
            to={WifiOff}
            active={!online}
            transition="morph"
            labels={['Online', 'Offline']}
            size={16}
            className={online ? 'text-success' : 'text-fg-muted'}
          />
          {online ? 'Syncing live' : 'Working offline'}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={online}
          aria-label="Sync"
          onClick={() => setOnline((v) => !v)}
          className={cn('relative h-5 w-9 rounded-full', ease, focusRing, online ? 'bg-accent' : 'bg-line-strong')}
        >
          <span
            className={cn(
              'absolute top-0.5 size-4 rounded-full bg-surface shadow-sm transition-[inset-inline-start] duration-(--yj-duration-fast) ease-standard',
              online ? 'start-[18px]' : 'start-0.5',
            )}
          />
        </button>
      </div>

      <button
        {...lock.buttonProps}
        className={cn('mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-line text-sm font-medium text-fg hover:bg-hover', ease, focusRing)}
      >
        <IconSwap {...lock.iconProps} from={LockOpen} to={Lock} transition="morph" size={16} />
        {lock.active ? 'Workspace locked' : 'Lock workspace'}
      </button>
    </section>
  )
}

export const InContext: Story = {
  name: 'In context',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'Toggles built with `useIconState`: pressed toggles (notify, save, mute, like, lock) keep one name and announce aria-pressed; actions (play, show password, theme) name what they will do next. The connection indicator is a standalone IconSwap with `labels`, so it reads as “Online” or “Offline”.',
      },
    },
  },
  render: () => (
    <PageStage className="flex items-center justify-center">
      <div className="flex w-full flex-col items-center justify-center gap-4 lg:flex-row lg:items-start">
        <Reader />
        <AccountPanel />
      </div>
    </PageStage>
  ),
}

/* ── Playground ─────────────────────────────────────────────────────────── */

const ICONS: Record<string, SwapIcon> = {
  Bookmark,
  BookmarkCheck,
  Bell,
  BellOff,
  Sun,
  Moon,
  Copy,
  Check,
  Play,
  Pause,
  Heart,
  HeartCrack,
  Lock,
  LockOpen,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Plus,
  X,
  Search,
  Loader,
  Star,
  Sparkles,
  Mic,
  MicOff,
  Link2,
  Link2Off,
  'BellIcon (youj)': BellIcon,
  'HeartIcon (youj)': HeartIcon,
  'SearchIcon (youj)': SearchIcon,
  'StarIcon (youj)': StarIcon,
}

export const Playground: Story = {
  argTypes: {
    from: { control: 'select', options: Object.keys(ICONS), mapping: ICONS },
    to: { control: 'select', options: Object.keys(ICONS), mapping: ICONS },
  },
  render: (args) => {
    const [on, setOn] = useState(false)
    const active = args.active || on
    return (
      <div className="flex flex-col items-center gap-6">
        <button
          type="button"
          aria-pressed={active}
          aria-label="Swap"
          onClick={() => setOn((v) => !v)}
          className={cn('rounded-2xl border border-line bg-surface p-10 text-fg hover:border-line-strong', ease, focusRing)}
        >
          <IconSwap {...args} active={active} />
        </button>
        <p className="text-xs text-fg-muted">Click the card, or flip active in the controls.</p>
      </div>
    )
  },
}

/* ── Direction ──────────────────────────────────────────────────────────── */

function DirectionRow({ transition, dir }: { transition: 'slide' | 'wipe'; dir: 'ltr' | 'rtl' }) {
  const [on, setOn] = useState(false)
  const directions: IconSwapDirection[] = ['up', 'down', 'left', 'right']
  return (
    <div dir={dir} className="flex items-center gap-3">
      <span className="w-24 font-mono text-[11px] text-fg-muted">
        {transition} · {dir}
      </span>
      {directions.map((d) => (
        <button
          key={d}
          type="button"
          aria-pressed={on}
          onClick={() => setOn((v) => !v)}
          className={cn('flex w-20 flex-col items-center gap-2 rounded-xl border border-line bg-surface py-4 text-fg-muted hover:text-fg', ease, focusRing)}
        >
          <IconSwap from={Bookmark} to={BookmarkCheck} active={on} transition={transition} direction={d} size={28} />
          <span className="font-mono text-[10px]">{d}</span>
        </button>
      ))}
    </div>
  )
}

export const Direction: Story = {
  parameters: {
    layout: 'fullscreen',
    docs: { description: { story: '`direction` steers `slide` and `wipe`. Left and right follow the reading direction, so under dir="rtl" they mirror.' } },
  },
  render: () => (
    <PageStage className="flex items-center justify-center">
      <div className="flex flex-col gap-3">
        <DirectionRow transition="slide" dir="ltr" />
        <DirectionRow transition="slide" dir="rtl" />
        <DirectionRow transition="wipe" dir="ltr" />
        <DirectionRow transition="wipe" dir="rtl" />
      </div>
    </PageStage>
  ),
}

/* ── Scrub ──────────────────────────────────────────────────────────────── */

function Scrubber() {
  const [pair, setPair] = useState(PAIRS[1]!)
  const [value, setValue] = useState(0.5)
  const progress = useMotionValue(0.5)
  const set = (v: number) => {
    setValue(v)
    progress.set(v)
  }
  return (
    <PageStage className="flex items-center justify-center">
      <div className="w-full max-w-[980px]">
        <Heading eyebrow="youj / icons / swap / progress" title="One value, every transition">
          `progress` drives the swap directly: 0 shows `from`, 1 shows `to`. One MotionValue paints all ten here without a render.
        </Heading>
        <div className="mt-8 grid grid-cols-5 gap-2 sm:grid-cols-10">
          {TRANSITIONS.map((t) => (
            <div key={t.id} className="flex flex-col items-center gap-3 rounded-xl border border-line bg-surface py-5 text-fg">
              <IconSwap from={pair.from} to={pair.to} progress={progress} transition={t.id} size={32} />
              <span className="font-mono text-[10px] text-fg-muted">{t.id}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <label className="flex min-w-64 flex-1 items-center gap-3 font-mono text-[11px] text-fg-muted">
            <span>{pair.states[0]}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={value}
              onChange={(e) => set(Number(e.target.value))}
              aria-label="Progress"
              className="flex-1 accent-(--color-accent)"
            />
            <span>{pair.states[1]}</span>
            <span className="w-10 text-end text-fg tabular-nums">{value.toFixed(2)}</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PAIRS.slice(0, 6).map((p) => (
              <Chip key={p.name} onClick={() => setPair(p)}>
                {p.name}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </PageStage>
  )
}

export const Scrub: Story = {
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          '`progress` (a number or a MotionValue) drives the swap instead of a state, for scrubbers and scroll-linked swaps. `active` and `trigger` are ignored while it is set, and labels name the nearer icon. It paints as given under reduced motion, since the value is the caller’s.',
      },
    },
  },
  render: () => <Scrubber />,
}

/* ── Reduced motion ─────────────────────────────────────────────────────── */

export const ReducedMotion: Story = {
  parameters: {
    layout: 'fullscreen',
    docs: { description: { story: 'Forced reduced motion: every transition swaps instantly, and labels still follow the state.' } },
  },
  render: () => (
    <YoujProvider reducedMotion="always">
      <Gallery />
    </YoujProvider>
  ),
}
