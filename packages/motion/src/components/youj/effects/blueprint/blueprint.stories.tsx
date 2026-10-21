import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Bell, CreditCard, Folder, Home, Search, Settings, Users } from 'lucide-react'
import { expect, waitFor } from 'storybook/test'
import { ThemeScope, YoujProvider } from '@youj/core/lib/youj/provider'
import { BlueprintEntrance, type BlueprintEntranceProps } from './blueprint'
import { blueprint, type BlueprintRun } from './engine'

type Args = Pick<BlueprintEntranceProps, 'duration' | 'speed' | 'phases' | 'columns'>

const meta: Meta<Args> = {
  title: 'Motion/Effects/Blueprint',
  component: BlueprintEntrance as never,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'An entrance for real UI: the demo is drafted as an architect’s blueprint (a paper grid, a registration cross, the dotted bounds with their dimensions, the main regions, then every part pencilled by kind in reading order, with build and value columns beside it), then a ruled edge sweeps down and inks it into the real thing. `<BlueprintEntrance>` plays around its first child; `blueprint(node)` is the engine, for any element. It reads the DOM once, draws on two canvases and only animates opacity, clip-path and transform, and leaves nothing behind. Under reduced motion the UI is just there.',
      },
    },
  },
  argTypes: {
    speed: { control: { type: 'range', min: 0.25, max: 3, step: 0.25 } },
    columns: { control: 'inline-radio', options: ['auto', 'none'] },
    duration: { control: { type: 'number', min: 1000, max: 12000, step: 250 } },
    phases: { control: 'object', description: 'Each stage’s share of the run, as weights: survey, layout, detail, ink, tone, set, finish.' },
  },
  args: { speed: 1, columns: 'auto' },
}
export default meta
type Story = StoryObj<Args>

function Stage({ children, replay }: { children: React.ReactNode; replay: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden bg-canvas px-4 py-12">
      {children}
      <button
        type="button"
        onClick={replay}
        className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs text-fg-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-accent"
      >
        Replay
      </button>
    </div>
  )
}

function SignInCard() {
  return (
    <form
      className="flex w-[360px] flex-col gap-5 rounded-xl border border-line bg-surface p-6 shadow-sm"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-lg bg-fg text-sm font-semibold text-canvas">N</span>
        <div>
          <h2 className="text-base font-semibold text-fg">Sign in to Northwind</h2>
          <p className="text-sm text-fg-muted">Welcome back. Pick up where you left off.</p>
        </div>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
        Email
        <input
          type="email"
          defaultValue="ada@northwind.dev"
          className="h-9 rounded-md border border-line bg-field px-3 text-sm font-normal text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
        Password
        <input
          type="password"
          defaultValue="hunter22"
          className="h-9 rounded-md border border-line bg-field px-3 text-sm font-normal text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </label>
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-fg-muted">
          <input type="checkbox" defaultChecked className="size-4 accent-accent" />
          Remember me
        </label>
        <a href="#reset" className="text-fg underline-offset-4 hover:underline">
          Forgot password?
        </a>
      </div>
      <button
        type="submit"
        className="h-9 rounded-md bg-accent text-sm font-medium text-accent-contrast focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        Sign in
      </button>
      <hr className="border-line" />
      <p className="text-center text-xs text-fg-subtle">Protected by single sign-on.</p>
    </form>
  )
}

const NAV = [
  { icon: Home, label: 'Overview' },
  { icon: Folder, label: 'Projects' },
  { icon: Users, label: 'Team' },
  { icon: CreditCard, label: 'Billing' },
  { icon: Settings, label: 'Settings' },
]
const STATS = [
  ['Revenue', '$48,210', '+12.4%'],
  ['Active users', '3,982', '+4.1%'],
  ['Churn', '1.8%', '−0.3%'],
]
const ROWS = [
  ['Atlas redesign', 'Mira Okafor', 'In review'],
  ['Billing v2', 'Tomas Lind', 'Shipped'],
  ['Mobile onboarding', 'Ines Duarte', 'Draft'],
  ['Search revamp', 'Kenji Mori', 'Shipped'],
]
const BARS = [32, 48, 40, 64, 56, 72, 60, 84, 76, 92, 70, 88]

function SmallScreen() {
  return (
    <div className="flex h-[560px] w-[880px] overflow-hidden rounded-xl border border-line bg-canvas text-fg shadow-sm">
      <aside aria-label="Workspace" className="flex w-52 shrink-0 flex-col gap-1 border-e border-line bg-surface p-3">
        <div className="mb-3 flex items-center gap-2 px-2 py-1.5">
          <span className="grid size-6 place-items-center rounded-md bg-fg text-xs font-semibold text-canvas">N</span>
          <span className="text-sm font-semibold">Northwind</span>
        </div>
        <nav aria-label="Main" className="flex flex-col gap-0.5">
          {NAV.map(({ icon: Icon, label }, i) => (
            <a
              key={label}
              href={`#${label}`}
              aria-current={i === 0 ? 'page' : undefined}
              className={`flex h-8 items-center gap-2 rounded-md px-2 text-sm ${i === 0 ? 'bg-well text-fg' : 'text-fg-muted'}`}
            >
              <Icon aria-hidden className="size-4" />
              {label}
            </a>
          ))}
        </nav>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-line px-5">
          <h1 className="text-base font-semibold">Overview</h1>
          <div className="flex items-center gap-2">
            <label className="flex h-8 w-52 items-center gap-2 rounded-md border border-line bg-field px-2 text-sm text-fg-subtle">
              <Search aria-hidden className="size-4" />
              <input aria-label="Search" placeholder="Search…" className="min-w-0 flex-1 bg-transparent outline-none" />
            </label>
            <button type="button" aria-label="Notifications" className="grid size-8 place-items-center rounded-md border border-line text-fg-muted">
              <Bell aria-hidden className="size-4" />
            </button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-5">
          <section aria-label="This month" className="grid grid-cols-3 gap-3">
            {STATS.map(([label, value, delta]) => (
              <div key={label} className="rounded-lg border border-line bg-surface p-3">
                <p className="text-xs text-fg-muted">{label}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-fg-subtle">
                  <ArrowUpRight aria-hidden className="size-3" />
                  {delta}
                </p>
              </div>
            ))}
          </section>
          <div className="grid flex-1 grid-cols-[1.3fr_1fr] gap-3">
            <section aria-label="Weekly revenue" className="flex flex-col rounded-lg border border-line bg-surface p-3">
              <p className="text-xs font-medium text-fg-muted">Weekly revenue</p>
              <svg viewBox="0 0 240 110" role="img" aria-label="Revenue rose most weeks" className="mt-2 h-full w-full text-fg-subtle">
                {BARS.map((h, i) => (
                  <rect
                    key={i}
                    x={i * 20 + 4}
                    y={110 - h}
                    width={12}
                    height={h}
                    rx={2}
                    fill="currentColor"
                    opacity={i === BARS.length - 3 ? 1 : 0.45}
                  />
                ))}
              </svg>
            </section>
            <section aria-label="Projects" className="rounded-lg border border-line bg-surface">
              <p className="border-b border-line px-3 py-2 text-xs font-medium text-fg-muted">Projects</p>
              <ul>
                {ROWS.map(([name, owner, status]) => (
                  <li key={name} className="flex items-center justify-between border-b border-line px-3 py-2 text-sm last:border-0">
                    <span>
                      <span className="block">{name}</span>
                      <span className="block text-xs text-fg-subtle">{owner}</span>
                    </span>
                    <span className="rounded-full border border-line px-2 py-0.5 text-xs text-fg-muted">{status}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

function useReplay() {
  const [play, setPlay] = useState(0)
  return [play, () => setPlay((n) => n + 1)] as const
}

/** A sign-in card is drafted, then inked: bounds and dimensions, the regions, every part by kind, the build and values columns. */
export const Hero: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <Stage replay={replay}>
        <BlueprintEntrance key={play} {...args}>
          <SignInCard />
        </BlueprintEntrance>
      </Stage>
    )
  },
}

/** A small dashboard screen: more regions and parts, so the run is longer and the columns scroll. */
export const Screen: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <Stage replay={replay}>
        <BlueprintEntrance key={play} {...args}>
          <SmallScreen />
        </BlueprintEntrance>
      </Stage>
    )
  },
}

/** Pacing: the same card twice. `duration`, `speed` and `phases` set it precisely; on the left a quick run that spends
 * most of it building up, on the right a slow, studied pencil draft. */
export const Pacing: Story = {
  render: function Render() {
    const [play, replay] = useReplay()
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden bg-canvas px-4 py-12">
        <div className="flex flex-wrap items-start justify-center gap-10">
          {(
            [
              ['Quick: 1.4 s, short draft', { duration: 1400, phases: { survey: 6, layout: 6, detail: 12, ink: 16, tone: 16, set: 20, finish: 24 } }],
              [
                'Studied: 4 s, long draft',
                { duration: 4000, phases: { survey: 12, layout: 12, detail: 30, ink: 12, tone: 10, set: 10, finish: 14 } },
              ],
            ] as const
          ).map(([name, pace]) => (
            <figure key={name} className="flex flex-col items-center gap-3">
              <BlueprintEntrance key={play} {...pace} columns="none">
                <SignInCard />
              </BlueprintEntrance>
              <figcaption className="font-mono text-xs text-fg-muted">{name}</figcaption>
            </figure>
          ))}
        </div>
        <button
          type="button"
          onClick={replay}
          className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs text-fg-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-accent"
        >
          Replay
        </button>
      </div>
    )
  },
}

/** Reduced motion: no draft. The UI is just there, with nothing added to the page. */
export const ReducedMotion: Story = {
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <Stage replay={() => {}}>
        <BlueprintEntrance {...args}>
          <SignInCard />
        </BlueprintEntrance>
      </Stage>
    </YoujProvider>
  ),
}

/** `blueprint(node)` on any element, and `cancel()` part way: the card is restored at once and the drawing is gone. */
export const CancelMidRun: Story = {
  render: function Render(args) {
    const ref = useRef<HTMLDivElement>(null)
    const run = useRef<BlueprintRun | undefined>(undefined)
    const [state, setState] = useState('Playing')
    const start = () => {
      run.current?.cancel()
      setState('Playing')
      const card = ref.current?.firstElementChild as HTMLElement | null
      if (!card) return
      run.current = blueprint(card, args)
      void run.current.finished.then(() => setState((s) => (s === 'Playing' ? 'Finished' : s)))
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: plays once on mount
    useEffect(() => {
      start()
      return () => run.current?.cancel()
    }, [])
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden bg-canvas px-4 py-12">
        <div ref={ref}>
          <SignInCard />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setState('Cancelled')
              run.current?.cancel()
            }}
            className="rounded-md border border-line bg-surface px-3 py-1.5 text-fg-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-accent"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={start}
            className="rounded-md border border-line bg-surface px-3 py-1.5 text-fg-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-accent"
          >
            Play again
          </button>
          <output className="w-20 text-fg-subtle">{state}</output>
        </div>
      </div>
    )
  }, // In Chromium: cancel part way, then let a run finish; both leave the card's markup and the page's animations as they were.
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector('form')!
    const markup = card.outerHTML
    await waitFor(() => expect(canvasElement.querySelector('[data-yj-blueprint]')).not.toBeNull())
    const cancel = [...canvasElement.querySelectorAll('button')].find((b) => b.textContent === 'Cancel')!
    cancel.click()
    await expect(canvasElement.querySelector('[data-yj-blueprint]')).toBeNull()
    await expect(document.getAnimations()).toHaveLength(0)
    await expect(card.outerHTML).toBe(markup)
    const again = [...canvasElement.querySelectorAll('button')].find((b) => b.textContent === 'Play again')!
    again.click()
    await waitFor(() => expect(canvasElement.querySelector('[data-yj-blueprint]')).not.toBeNull())
    await waitFor(() => expect(canvasElement.querySelector('[data-yj-blueprint]')).toBeNull(), { timeout: 15000 })
    await expect(document.getAnimations()).toHaveLength(0)
    await expect(card.outerHTML).toBe(markup)
  },
}

/** Ink is the theme’s foreground and pencil a lighter one, so the drawing works in either mode. */
export const LightAndDark: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <div className="grid min-h-dvh grid-cols-2">
        {(['light', 'dark'] as const).map((mode) => (
          <ThemeScope key={mode} mode={mode}>
            <div className="flex h-full flex-col items-center justify-center gap-6 overflow-hidden bg-canvas px-4 py-12">
              <BlueprintEntrance key={play} {...args} columns="none">
                <SignInCard />
              </BlueprintEntrance>
              {mode === 'dark' && (
                <button
                  type="button"
                  onClick={replay}
                  className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs text-fg-muted focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Replay
                </button>
              )}
            </div>
          </ThemeScope>
        ))}
      </div>
    )
  },
}

/** Right to left: the cross lands on the top-right, parts are drafted right to left and the columns swap sides. */
export const RightToLeft: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <div dir="rtl">
        <Stage replay={replay}>
          <BlueprintEntrance key={play} {...args}>
            <SmallScreen />
          </BlueprintEntrance>
        </Stage>
      </div>
    )
  },
}
