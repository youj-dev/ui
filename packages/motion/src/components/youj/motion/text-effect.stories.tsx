import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ThemeScope, useYouj } from '@youj/core/lib/youj/provider'
import { TextEffect } from './text-effect'

const meta = {
  title: 'Motion/TextEffect',
  component: TextEffect,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'One text renderer, five reveals: `split-flap` (a station board: each character flips through its alphabet to land), `terminal` (typed out behind an optional prompt, with a block cursor and optional erase), `decode` (ScrambleText), `blur-in` (word by word, sharpening as it rises) and `roll` (each character on a reel). Plays on mount or in view (`inView`) and again whenever `text` changes. The final text holds the box from the first frame, assistive tech reads one hidden copy, the text at rest is plain and selectable, and reduced motion shows it at once. `duration` and `stagger` are tokens; each effect has its own defaults.',
      },
    },
  },
  args: {
    text: 'Deploys that land where you meant them',
    effect: 'blur-in',
    inView: false,
  },
  argTypes: {
    effect: { control: 'inline-radio', options: ['split-flap', 'terminal', 'decode', 'blur-in', 'roll'] },
    duration: { control: 'inline-radio', options: [undefined, 'instant', 'fast', 'base', 'slow', 'deliberate'] },
    stagger: { control: 'inline-radio', options: [undefined, 'tight', 'base', 'loose'] },
    as: { control: false },
    inView: { control: 'boolean' },
  },
} satisfies Meta<typeof TextEffect>

export default meta
type Story = StoryObj<typeof meta>

const PHRASES = ['Deploys that land where you meant them', 'Preview every change', 'Ship on Friday, calmly']

function Picker(args: Story['args']) {
  const [i, setI] = useState(0)
  return (
    <div className="flex w-full max-w-[560px] flex-col items-start gap-6">
      <TextEffect {...args} text={PHRASES[i]!} as="p" className="font-mono text-3xl font-semibold tracking-tight text-fg" />
      <button
        type="button"
        onClick={() => setI((n) => (n + 1) % PHRASES.length)}
        className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-medium text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        Next text
      </button>
    </div>
  )
}

/** Pick an effect in Controls; Next text replays it from the old text to the new. */
export const Playground: Story = { render: (args) => <Picker {...args} /> }

/* ---------------------------------------------------------------- board */

const DEPARTURES = [
  [
    ['08:15', 'LONDON', 'BOARDING', '4'],
    ['08:32', 'PARIS NORD', 'ON TIME', '7'],
    ['08:47', 'BRUXELLES', 'DELAYED', '2'],
    ['09:05', 'AMSTERDAM', 'ON TIME', '11'],
  ],
  [
    ['08:32', 'PARIS NORD', 'BOARDING', '7'],
    ['08:47', 'BRUXELLES', 'EXP 09:02', '2'],
    ['09:05', 'AMSTERDAM', 'ON TIME', '11'],
    ['09:20', 'KOLN HBF', 'ON TIME', '9'],
  ],
]

const pad = (s: string, n: number) => s.padEnd(n, ' ')

function DeparturesBoard() {
  const k = useYouj()
  const [page, setPage] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setPage((p) => (p + 1) % DEPARTURES.length), k.ms('deliberate') * 9)
    return () => clearInterval(t)
  }, [k])
  return (
    // A board is dark in either mode.
    <ThemeScope mode="dark">
      <section aria-label="Departures" className="w-fit max-w-full overflow-x-auto rounded-xl border border-line bg-canvas p-5 font-mono text-lg text-warning shadow-lg">
        <header className="mb-3 flex justify-between text-[11px] tracking-[0.2em] text-fg-subtle uppercase">
          <span>Departures</span>
          <span>Platform</span>
        </header>
        <ul className="flex flex-col gap-1.5">
          {DEPARTURES[page]!.map(([time, to, status, platform], row) => (
            <li key={row} className="flex gap-3">
              <TextEffect effect="split-flap" inView={false} text={time!} />
              <TextEffect effect="split-flap" inView={false} text={pad(to!, 10)} />
              <TextEffect effect="split-flap" inView={false} text={pad(status!, 9)} />
              <TextEffect effect="split-flap" inView={false} text={pad(platform!, 2)} />
            </li>
          ))}
        </ul>
      </section>
    </ThemeScope>
  )
}

/** A station board: every row flips to the next page of departures, character by character. */
export const DeparturesBoardStory: Story = { name: 'Departures board', render: () => <DeparturesBoard /> }

/* ---------------------------------------------------------------- terminal */

const LOG = ['pnpm install --frozen-lockfile', 'pnpm build', 'youj deploy --prod']
const STATUS = ['Building', 'Running checks', 'Ready on www.youj.dev']

function DeployLog() {
  const k = useYouj()
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (step >= LOG.length - 1) return
    const t = setTimeout(() => setStep((s) => s + 1), k.ms('deliberate') * 5)
    return () => clearTimeout(t)
  }, [step, k])
  return (
    <div className="w-full max-w-[480px] overflow-hidden rounded-xl border border-line bg-surface font-mono text-sm shadow-lg">
      <div className="flex items-center gap-1.5 border-b border-line px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-line-strong" />
        <span className="size-2.5 rounded-full bg-line-strong" />
        <span className="size-2.5 rounded-full bg-line-strong" />
        <span className="ms-3 text-xs text-fg-muted">deploy — youj-web</span>
      </div>
      <div className="flex flex-col gap-1.5 p-4 text-fg [&_[data-yj-prompt]]:text-accent">
        {LOG.slice(0, step + 1).map((line, i) => (
          <TextEffect key={line} as="div" effect="terminal" prompt="$ " text={line} inView={false} cursor={i === step} />
        ))}
        <p role="status" className="mt-2 text-fg-muted">
          <TextEffect effect="terminal" text={STATUS[step]!} erase cursor={false} inView={false} />
        </p>
      </div>
      <div className="flex justify-end border-t border-line px-4 py-2.5">
        <button
          type="button"
          onClick={() => setStep(0)}
          className="rounded-md bg-fg px-3 py-1.5 font-sans text-xs font-medium text-canvas focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          Redeploy
        </button>
      </div>
    </div>
  )
}

/** A deploy log: commands type out behind the prompt; the status line erases back and types its next state. */
export const DeployLogStory: Story = { name: 'Deploy log', render: () => <DeployLog /> }

/* ---------------------------------------------------------------- decode */

/** A headline decoded once as it scrolls into view. */
export const DecodeHeadline: Story = {
  name: 'Decode headline',
  render: () => (
    <div className="flex max-w-xl flex-col gap-3">
      <p className="text-xs font-medium tracking-[0.2em] text-accent uppercase">Launch week · Day 3</p>
      <TextEffect effect="decode" as="h1" text="SIGNALS, NOT NOISE" className="font-mono text-5xl font-semibold tracking-tight text-fg" />
      <p className="text-fg-muted">Alerts that only fire when something actually changed.</p>
    </div>
  ),
}

/* ---------------------------------------------------------------- blur-in */

/** A landing hero: the headline sharpens in word by word, then the lede follows. */
export const BlurInHero: Story = {
  name: 'Blur-in hero',
  render: () => (
    <div className="flex max-w-2xl flex-col items-center gap-5 text-center">
      <TextEffect as="h1" text="Interfaces that move with intent" className="text-5xl font-semibold tracking-tight text-balance text-fg" />
      <TextEffect
        as="p"
        text="Motion tokens, accessible components and a design language your whole product speaks."
        stagger="base"
        className="text-lg text-fg-muted"
      />
    </div>
  ),
}

/* ---------------------------------------------------------------- roll */

const STATS = [
  [
    ['Uptime', '99.98%'],
    ['Deploys', '1,284'],
    ['p95', '182ms'],
  ],
  [
    ['Uptime', '99.99%'],
    ['Deploys', '1,291'],
    ['p95', '176ms'],
  ],
]

function RollingStats() {
  const k = useYouj()
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % STATS.length), k.ms('deliberate') * 6)
    return () => clearInterval(t)
  }, [k])
  return (
    <dl className="grid w-full max-w-[520px] grid-cols-3 divide-x divide-line rounded-xl border border-line bg-surface">
      {STATS[i]!.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-1 px-5 py-4">
          <dt className="text-xs text-fg-muted">{label}</dt>
          <dd className="text-3xl font-semibold tracking-tight text-fg tabular-nums">
            <TextEffect effect="roll" text={value!} />
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** Stats that roll to their figures in view, and roll again as they update. */
export const RollingStatsStory: Story = { name: 'Rolling stats', render: () => <RollingStats /> }

/** Every effect under reduced motion: the final text, at once. */
export const ReducedMotion: Story = {
  globals: { reducedMotion: 'always' },
  render: () => (
    <div className="flex flex-col gap-3 font-mono text-xl text-fg">
      <TextEffect effect="split-flap" text="ON TIME" />
      <TextEffect effect="terminal" prompt="$ " text="pnpm build" />
      <TextEffect effect="decode" text="SYSTEMS NOMINAL" />
      <TextEffect effect="blur-in" text="Interfaces that move with intent" />
      <TextEffect effect="roll" text="1,284" />
    </div>
  ),
}
