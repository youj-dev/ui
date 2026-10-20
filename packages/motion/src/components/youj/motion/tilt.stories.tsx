import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tilt } from './tilt'

const meta = {
  title: 'Motion/Tilt',
  component: Tilt,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Tilts toward the pointer in 3D (`max` degrees at the edges, CSS `perspective`) and springs flat on leave. `glare` adds a soft-light highlight that tracks the pointer; it translates a pre-drawn gradient, so it stays on the compositor. Put the rounded corners on `Tilt` so the glare clips to them. Mouse only; static for reduced motion.',
      },
    },
  },
  args: { max: 8, perspective: 900, glare: true, scale: 1.02, spring: 'smooth' },
  argTypes: {
    spring: { control: 'inline-radio', options: ['snappy', 'smooth', 'settle'] },
    children: { control: false },
  },
} satisfies Meta<typeof Tilt>

export default meta
type Story = StoryObj<typeof meta>

function MemberCard() {
  return (
    <div className="relative flex aspect-[1.586] w-full max-w-[380px] flex-col justify-between overflow-hidden rounded-[inherit] border border-line bg-surface p-6 shadow-[0_24px_60px_-24px_color-mix(in_oklch,var(--color-fg)_35%,transparent)]">
      {/* Accent wash and a fine concentric pattern, all from tokens. */}
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_90%_at_100%_0%,color-mix(in_oklch,var(--color-accent)_38%,transparent),transparent_60%)]" />
      <svg aria-hidden viewBox="0 0 200 200" className="absolute -right-16 -bottom-24 size-72 text-fg opacity-[0.07]">
        {Array.from({ length: 9 }, (_, i) => (
          <circle key={i} cx="100" cy="100" r={12 + i * 11} fill="none" stroke="currentColor" strokeWidth="1" />
        ))}
      </svg>
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium tracking-[0.18em] text-fg-muted uppercase">Youj Pro</p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-fg">Studio seat</p>
        </div>
        <svg aria-hidden viewBox="0 0 20 20" className="size-6 text-accent">
          <path d="M3 17 10 3l7 14H3Z" fill="currentColor" />
        </svg>
      </div>
      <div aria-hidden className="relative h-8 w-11 rounded-md border border-line-strong bg-well [background-image:linear-gradient(to_right,transparent_45%,var(--color-line-strong)_45%,var(--color-line-strong)_55%,transparent_55%),linear-gradient(to_bottom,transparent_45%,var(--color-line-strong)_45%,var(--color-line-strong)_55%,transparent_55%)]" />
      <div className="relative flex items-end justify-between font-mono text-sm text-fg">
        <span className="tracking-[0.2em]">•••• 4021</span>
        <span className="text-xs text-fg-muted">MEMBER SINCE 2024</span>
      </div>
    </div>
  )
}

/** A membership card. Hover and sweep across it; the glare follows the pointer. */
export const Hero: Story = {
  render: (args) => (
    <div className="grid place-items-center p-16">
      <Tilt {...args} className="rounded-2xl">
        <MemberCard />
      </Tilt>
    </div>
  ),
}

const SHOTS = [
  { title: 'Aurora', meta: 'Shader · 2.4 KB' },
  { title: 'Orbit', meta: 'Particles · 3.1 KB' },
  { title: 'Ripple', meta: 'Button · 0.9 KB' },
]

export const Gallery: Story = {
  args: { max: 6, glare: true, scale: 1.015 },
  render: (args) => (
    <div className="flex flex-wrap justify-center gap-6 p-10">
      {SHOTS.map((s, i) => (
        <Tilt key={s.title} {...args} className="rounded-xl">
          <article className="w-60 overflow-hidden rounded-[inherit] border border-line bg-surface">
            <div
              className="h-36 bg-well"
              style={{
                backgroundImage: `radial-gradient(80% 80% at ${20 + i * 30}% 30%, color-mix(in oklch, var(--color-accent) ${30 + i * 10}%, transparent), transparent 70%)`,
              }}
            />
            <div className="p-4">
              <p className="text-sm font-medium text-fg">{s.title}</p>
              <p className="text-xs text-fg-muted">{s.meta}</p>
            </div>
          </article>
        </Tilt>
      ))}
    </div>
  ),
}

export const ReducedMotion: Story = {
  ...Hero,
  globals: { reducedMotion: 'always' },
}
