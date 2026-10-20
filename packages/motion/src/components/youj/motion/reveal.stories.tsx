import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AnimatePresence } from 'motion/react'
import { CircleCheck, X } from 'lucide-react'
import { Reveal, revealVariantNames } from './reveal'
import { Replayable } from './story-kit'

const meta = {
  title: 'Motion/Reveal',
  component: Reveal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Enters on mount or when scrolled into view (once or every time). Variants: `fade`, `rise`, `blur-in`, `scale`, and `wipe-up|down|left|right` (clip-path). `delay` is a multiple of a stagger token. Inside `AnimatePresence` it exits with the `exit` ease. Inside a `Stagger` it takes its cue and delay from the parent. Reduced motion renders the final state and exits instantly.',
      },
    },
  },
  args: {
    variant: 'rise',
    inView: false,
    delay: 0,
    delayStep: 'base',
    duration: undefined,
    ease: undefined,
    distance: 12,
  },
  argTypes: {
    variant: { control: 'select', options: revealVariantNames },
    inView: { control: 'boolean' },
    delayStep: { control: 'inline-radio', options: ['tight', 'base', 'loose'] },
    duration: { control: 'select', options: [undefined, 'instant', 'fast', 'base', 'slow', 'deliberate'] },
    ease: { control: 'select', options: [undefined, 'standard', 'enter', 'exit', 'emphasized', 'linear'] },
    as: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof Reveal>

export default meta
type Story = StoryObj<typeof meta>

// ---------------------------------------------------------------- hero

function TimelinePanel() {
  const tracks = [
    { label: 'Opacity', bars: [[4, 30]] },
    { label: 'Translate Y', bars: [[4, 42]] },
    { label: 'Clip path', bars: [[18, 62]] },
    { label: 'Blur', bars: [[30, 70]] },
  ]
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
        <span className="size-2.5 rounded-full bg-line-strong" />
        <span className="size-2.5 rounded-full bg-line-strong" />
        <span className="size-2.5 rounded-full bg-line-strong" />
        <span className="ml-3 font-mono text-[11px] text-fg-subtle">hero-enter.motion</span>
      </div>
      <div className="space-y-3 p-4">
        {tracks.map((t, i) => (
          <div key={t.label} className="grid grid-cols-[88px_1fr] items-center gap-3">
            <span className="text-xs text-fg-muted">{t.label}</span>
            <div className="relative h-6 rounded-md bg-well">
              {t.bars.map(([from, to]) => (
                <Reveal
                  key={from}
                  variant="wipe-right"
                  inView={false}
                  delay={6 + i}
                  className="absolute inset-y-1 rounded-sm bg-accent"
                  style={{ left: `${from}%`, width: `${to! - from!}%` }}
                />
              ))}
            </div>
          </div>
        ))}
        <div className="relative mt-1 h-px bg-line">
          <Reveal variant="fade" inView={false} delayStep="loose" delay={10} className="absolute -top-1 left-[46%] h-[152px] w-px -translate-y-full bg-fg" />
        </div>
      </div>
    </div>
  )
}

function FeatureLaunch() {
  return (
    <section className="grid w-[min(960px,92vw)] items-center gap-12 md:grid-cols-[1.05fr_1fr]">
      <div>
        <Reveal variant="fade" inView={false} className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-fg-muted">
          <span className="size-1.5 rounded-full bg-accent" />
          New in 2.0 · Timeline editor
        </Reveal>
        <Reveal as="h1" variant="rise" inView={false} delayStep="loose" delay={1} className="text-5xl font-semibold tracking-tight text-balance text-fg">
          Motion that lands where you meant it.
        </Reveal>
        <Reveal as="p" variant="rise" inView={false} delayStep="loose" delay={3} className="mt-5 max-w-md text-lg/relaxed text-fg-muted">
          Scrub every property on one timeline, snap keyframes to tokens, and ship the exact curve you designed.
        </Reveal>
        <Reveal variant="rise" inView={false} delayStep="loose" delay={5} className="mt-8 flex gap-3">
          <a href="#" className="rounded-lg bg-fg px-4 py-2.5 text-sm font-medium text-canvas focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">
            Open the editor
          </a>
          <a href="#" className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">
            Read the changelog
          </a>
        </Reveal>
      </div>
      <Reveal variant="wipe-up" inView={false} delayStep="loose" delay={4}>
        <TimelinePanel />
      </Reveal>
    </section>
  )
}

export const Hero: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <Replayable className="flex min-h-screen items-center justify-center p-8">
      <FeatureLaunch />
    </Replayable>
  ),
}

// ---------------------------------------------------------------- variants

export const Variants: Story = {
  render: () => (
    <Replayable className="pt-12">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {revealVariantNames.map((v, i) => (
          <Reveal key={v} variant={v} inView={false} delay={i} delayStep="loose">
            <div className="flex h-28 w-40 flex-col justify-between rounded-xl border border-line bg-surface p-3">
              <div className="h-10 rounded-md bg-accent-subtle" />
              <span className="font-mono text-xs text-fg-muted">{v}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </Replayable>
  ),
}

// ---------------------------------------------------------------- presence

function ToastDemo() {
  const [open, setOpen] = useState(true)
  return (
    <div className="flex h-56 w-96 flex-col items-center justify-between">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg bg-fg px-4 py-2 text-sm font-medium text-canvas focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        {open ? 'Dismiss' : 'Deploy'}
      </button>
      <AnimatePresence>
        {open && (
          <Reveal key="toast" variant="rise" inView={false} role="status" className="flex w-full items-start gap-3 rounded-xl border border-line bg-surface p-4 shadow-sm">
            <CircleCheck aria-hidden className="mt-0.5 size-4 text-success" />
            <div className="flex-1">
              <p className="text-sm font-medium text-fg">Deployed to production</p>
              <p className="mt-0.5 text-xs text-fg-muted">youj-web · 4f2a91c · 38s</p>
            </div>
            <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="rounded text-fg-subtle hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">
              <X aria-hidden className="size-4" />
            </button>
          </Reveal>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Toggle quickly: exits accelerate away with the `exit` ease and re-entries retarget mid-flight. */
export const Presence: Story = { render: () => <ToastDemo /> }

// ---------------------------------------------------------------- on scroll

export const OnScroll: Story = {
  parameters: { layout: 'fullscreen' },
  args: { inView: { once: false } },
  render: (args) => (
    <div className="mx-auto max-w-xl space-y-6 px-6 py-[40vh]">
      <p className="text-center text-sm text-fg-subtle">Scroll. With once off, cards replay each time they enter.</p>
      {Array.from({ length: 8 }, (_, i) => (
        <Reveal key={i} {...args} className="rounded-xl border border-line bg-surface p-6">
          <p className="text-sm font-medium text-fg">Release {8 - i}.0</p>
          <p className="mt-1 text-sm text-fg-muted">Faster springs, tighter staggers and a new clip-wipe.</p>
        </Reveal>
      ))}
    </div>
  ),
}

// ---------------------------------------------------------------- playground

export const Playground: Story = {
  args: { children: 'Reveal me' },
  render: (args) => (
    <Replayable className="pt-12">
      <Reveal {...args} className="rounded-xl border border-line bg-surface px-8 py-6 text-lg font-medium" />
    </Replayable>
  ),
}

/** The final state, instantly. Presence exits remove the element without animating. */
export const ReducedMotion: Story = {
  ...Hero,
  globals: { reducedMotion: 'always' },
}
