import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowRight } from 'lucide-react'
import { Magnetic, MagneticInner } from './magnetic'
import { Reveal } from './reveal'
import { Stagger } from './stagger'
import { TextSplit } from './text-split'
import { GridBackdrop, Replayable } from './story-kit'

const meta = {
  title: 'Motion/Magnetic',
  component: Magnetic,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Pulls its content toward the pointer once it comes within `radius` px of the box, at `strength` × the offset, with a linear falloff so there is no jump at the edge. Springs back on leave. `MagneticInner` inside the child (e.g. a label) travels `ratio` as far as the shell for a sense of depth. Off for reduced motion, touch and coarse pointers.',
      },
    },
  },
  args: { strength: 0.35, radius: 80, spring: 'smooth' },
  argTypes: {
    spring: { control: 'inline-radio', options: ['snappy', 'smooth', 'settle'] },
    children: { control: false },
  },
} satisfies Meta<typeof Magnetic>

export default meta
type Story = StoryObj<typeof meta>

const primary =
  'inline-flex items-center gap-2 rounded-full bg-fg px-6 py-3 text-sm font-medium text-canvas focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none'
const secondary =
  'inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-6 py-3 text-sm font-medium text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none'

function LandingHero(args: Story['args']) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <GridBackdrop />
      <header className="relative flex items-center justify-between px-8 py-5">
        <span className="flex items-center gap-2 text-sm font-semibold tracking-tight text-fg">
          <svg aria-hidden viewBox="0 0 20 20" className="size-5 text-accent">
            <path d="M3 17 10 3l7 14H3Z" fill="currentColor" />
          </svg>
          youj
        </span>
        <nav className="flex gap-6 text-sm text-fg-muted">
          <a href="#" className="rounded hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">Docs</a>
          <a href="#" className="rounded hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">Changelog</a>
          <a href="#" className="rounded hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">Pricing</a>
        </nav>
      </header>
      <main className="relative mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
        <Reveal variant="fade" inView={false} className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 youj-allow-glass px-3 py-1 text-xs text-fg-muted backdrop-blur">
          <span className="size-1.5 rounded-full bg-accent" />
          Motion primitives for React
        </Reveal>
        <TextSplit
          as="h1"
          by="lines"
          mask
          inView={false}
          delay={1}
          ease="enter"
          duration="deliberate"
          className="text-6xl leading-[1.05] font-semibold tracking-tight text-balance text-fg"
        >
          Interfaces that move with intent.
        </TextSplit>
        <Stagger inView={false} delay={6} step="loose" className="flex flex-col items-center">
          <p className="mt-7 max-w-xl text-lg/relaxed text-fg-muted">
            Tokens for time, springs that never overshoot, and primitives that respect reduced motion by default.
          </p>
          <div className="mt-10 flex items-center gap-5">
            <Magnetic {...args}>
              <a href="#" className={primary}>
                <MagneticInner className="flex items-center gap-2">
                  Get started <ArrowRight aria-hidden className="size-4" />
                </MagneticInner>
              </a>
            </Magnetic>
            <Magnetic {...args} strength={(args?.strength ?? 0.35) * 0.6}>
              <a href="#" className={secondary}>
                <MagneticInner>Browse primitives</MagneticInner>
              </a>
            </Magnetic>
          </div>
        </Stagger>
      </main>
    </div>
  )
}

/** A landing hero built from TextSplit (masked lines), Stagger and Magnetic CTAs. Move the pointer near the buttons. */
export const Hero: Story = {
  parameters: { layout: 'fullscreen' },
  args: { strength: 0.3, radius: 40 },
  render: (args) => (
    <Replayable buttonClassName="right-4 bottom-4">
      <LandingHero {...args} />
    </Replayable>
  ),
}

/** The dashed ring marks where the pull begins (`radius` beyond the box). */
export const Playground: Story = {
  render: (args) => (
    <div className="grid size-[420px] place-items-center">
      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-full border border-dashed border-line-strong"
          style={{ inset: -(args.radius ?? 80) }}
        />
        <Magnetic {...args}>
          <button type="button" className="grid size-20 place-items-center rounded-full bg-accent text-on-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none">
            <MagneticInner>
              <ArrowRight aria-label="Next" className="size-5" />
            </MagneticInner>
          </button>
        </Magnetic>
      </div>
    </div>
  ),
}

/** No pull. The buttons are ordinary, fully usable links. */
export const ReducedMotion: Story = {
  ...Hero,
  globals: { reducedMotion: 'always' },
}
