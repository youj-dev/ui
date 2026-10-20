import { useRef } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Parallax } from './parallax'
import { GridBackdrop } from './story-kit'

const meta = {
  title: 'Motion/Parallax',
  component: Parallax,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "Maps the element's scroll progress through `offset` (default: from entering to leaving the viewport) onto `x`, `y` (px), `scale`, `rotate` and `opacity`, each an output range matched to the `input` stops. Spring-smoothed by default (`spring={false}` to track exactly). Works with page scroll or a `container` ref. Reduced motion leaves the element at rest.",
      },
    },
  },
  args: { input: [0, 1], y: [-60, 60], spring: 'smooth' },
  argTypes: {
    spring: { control: 'inline-radio', options: [false, 'snappy', 'smooth'] },
    container: { control: false },
    offset: { control: false },
  },
} satisfies Meta<typeof Parallax>

export default meta
type Story = StoryObj<typeof meta>

const CARDS = [
  { x: '6%', top: '18%', y: [120, -120], w: 'w-52', title: 'Deploys', value: '1,284', rotate: [-4, 2] },
  { x: '68%', top: '10%', y: [200, -200], w: 'w-56', title: 'P95 latency', value: '84 ms', rotate: [3, -2] },
  { x: '72%', top: '62%', y: [60, -60], w: 'w-44', title: 'Error rate', value: '0.02%', rotate: [0, 0] },
  { x: '10%', top: '66%', y: [260, -260], w: 'w-48', title: 'Edge hits', value: '98.7%', rotate: [2, -3] },
]

function Scene() {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div ref={ref} className="relative h-[560px] w-[min(980px,94vw)] overflow-y-auto rounded-2xl border border-line bg-canvas">
      <div className="h-[200px]" />
      <section className="relative h-[680px] overflow-hidden">
        <Parallax container={ref} y={[-40, 40]} className="absolute inset-0">
          <GridBackdrop />
        </Parallax>
        {CARDS.map((c) => (
          <Parallax
            key={c.title}
            container={ref}
            y={c.y}
            rotate={c.rotate}
            className={`absolute ${c.w} rounded-xl border border-line bg-surface p-4 shadow-sm`}
            style={{ left: c.x, top: c.top }}
          >
            <p className="text-xs text-fg-muted">{c.title}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-fg">{c.value}</p>
          </Parallax>
        ))}
        <Parallax
          container={ref}
          input={[0, 0.5, 1]}
          scale={[0.92, 1, 0.92]}
          opacity={[0.2, 1, 0.2]}
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
        >
          <p className="font-mono text-xs tracking-[0.2em] text-accent uppercase">Observability</p>
          <h2 className="mt-3 max-w-md text-5xl font-semibold tracking-tight text-fg">Every request, in view.</h2>
        </Parallax>
      </section>
      <div className="h-[120px]" />
    </div>
  )
}

/** Scroll inside the frame: metric cards drift at different depths around a headline that focuses at center. */
export const Hero: Story = { render: () => <Scene /> }

export const Playground: Story = {
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <div className="py-[60vh]">
      <Parallax {...args} className="mx-auto w-64 rounded-xl border border-line bg-surface p-6 text-center text-sm text-fg-muted">
        Scroll the page
      </Parallax>
    </div>
  ),
}

export const ReducedMotion: Story = {
  ...Hero,
  globals: { reducedMotion: 'always' },
}
