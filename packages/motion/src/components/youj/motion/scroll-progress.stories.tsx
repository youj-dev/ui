import { useRef } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ScrollProgress } from './scroll-progress'

const meta = {
  title: 'Motion/ScrollProgress',
  component: ScrollProgress,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'How far the page (or a `container` ref) has scrolled, as a `bar` (scaleX) or a `ring` (SVG pathLength), spring-smoothed with a motion token. Exposed as a `progressbar` whose `aria-valuenow` is updated without re-rendering. Position it yourself (e.g. `fixed inset-x-0 top-0`). Reduced motion tracks scroll directly with no spring.',
      },
    },
  },
  args: { variant: 'bar', spring: 'smooth', size: 36, thickness: 3, axis: 'y', label: 'Reading progress' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['bar', 'ring'] },
    spring: { control: 'inline-radio', options: ['snappy', 'smooth', 'settle'] },
    axis: { control: 'inline-radio', options: ['y', 'x'] },
    container: { control: false },
  },
} satisfies Meta<typeof ScrollProgress>

export default meta
type Story = StoryObj<typeof meta>

const SECTIONS = [
  ['Timing is a token', 'Every duration in the system is a name, not a number. The names never change; the values are tuned in one place, and the time-scale control reaches everything, down to rAF loops.'],
  ['Springs without overshoot', 'Most interface motion should arrive and stop. We describe springs by perceived duration and bounce, and reserve bounce for success and arrival moments.'],
  ['Reduced motion first', 'The reduced state is designed, not subtracted. Loops stop, scroll effects rest, and every entrance renders its final frame with the same information.'],
  ['Only the compositor', 'Transform, opacity, clip-path and filter. Everything else waits for layout and paint, and you can feel it on a mid-range phone.'],
  ['Measure, then split', 'Text split by lines is grouped from real layout and measured again when the container resizes or web fonts arrive.'],
]

function Article() {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div className="w-[min(760px,94vw)] overflow-hidden rounded-2xl border border-line bg-surface">
      <header className="relative flex items-center justify-between border-b border-line px-6 py-4">
        <div>
          <p className="text-[11px] tracking-[0.16em] text-fg-subtle uppercase">Handbook</p>
          <p className="text-sm font-semibold text-fg">The youj principles</p>
        </div>
        <ScrollProgress variant="ring" container={ref} size={28} thickness={2.5} label="Article progress" />
        <ScrollProgress container={ref} className="absolute inset-x-0 -bottom-px" label="Article progress bar" />
      </header>
      <div ref={ref} tabIndex={0} className="h-[440px] overflow-y-auto px-10 py-10 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:ring-inset">
        <h1 className="text-3xl font-semibold tracking-tight text-fg">Five rules for interfaces that move with intent</h1>
        {SECTIONS.map(([h, p], i) => (
          <section key={h} className="mt-10">
            <h2 className="flex items-baseline gap-3 text-lg font-semibold text-fg">
              <span className="font-mono text-xs text-accent">0{i + 1}</span>
              {h}
            </h2>
            <p className="mt-3 text-base/relaxed text-fg-muted">{p}</p>
            <p className="mt-3 text-base/relaxed text-fg-muted">{p}</p>
          </section>
        ))}
      </div>
    </div>
  )
}

/** A reader panel: a bar under the header and a ring in the corner, both bound to the article's scroll container. */
export const Hero: Story = { render: () => <Article /> }

/** Bound to the page. Scroll the canvas. */
export const Page: Story = {
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <div>
      <ScrollProgress {...args} className={args.variant === 'ring' ? 'fixed top-4 right-4' : 'fixed inset-x-0 top-0 z-10'} />
      <div className="mx-auto max-w-2xl space-y-6 px-6 py-24">
        {Array.from({ length: 24 }, (_, i) => (
          <div key={i} className="h-24 rounded-xl border border-line bg-surface" />
        ))}
      </div>
    </div>
  ),
}

export const ReducedMotion: Story = {
  ...Hero,
  globals: { reducedMotion: 'always' },
}
