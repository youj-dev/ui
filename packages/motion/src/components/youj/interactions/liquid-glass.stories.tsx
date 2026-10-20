import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Bold, Italic, Link, List, Pause, Play, SkipBack, SkipForward, Underline } from 'lucide-react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Aurora } from '../backgrounds/aurora'
import { LiquidGlass, type LiquidGlassProps } from './liquid-glass'

type Args = Pick<LiquidGlassProps, 'bulge' | 'blur' | 'squish'>

const meta: Meta<Args> = {
  title: 'Motion/Interactions/LiquidGlass',
  component: LiquidGlass as never,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "A pane of liquid glass behind whatever it wraps: the backdrop blurred and saturated, a body of light thin enough to show it, a lit rim and a soft drop. The pointer is read as a position across the pane and three values spring after it on k.spring('settle'), so the glass leans toward the pointer, swells a little that way, overshoots and settles, while the highlight and the brightest stretch of rim slide to it. A press squishes the whole thing, content included. Transform and two custom properties only; no WebGL. The glass is `aria-hidden` and adds no role: the button or link inside carries the meaning and the focus ring. Reduced motion and touch: static glass with the highlight top left.",
      },
    },
  },
  argTypes: {
    bulge: { control: { type: 'range', min: 0, max: 12, step: 1 } },
    blur: { control: { type: 'range', min: 0, max: 32, step: 2 } },
    squish: { control: 'boolean' },
  },
  args: { bulge: 4, blur: 12, squish: true },
}
export default meta
type Story = StoryObj<Args>

/** A busy backdrop, so the blur, the saturation and the rim have something to work on. */
function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-[480px] place-items-center overflow-hidden bg-canvas p-10">
      <div aria-hidden className="absolute inset-0 grid grid-cols-6 gap-3 p-6 opacity-90">
        {Array.from({ length: 24 }, (_, i) => (
          <div
            key={i}
            className="rounded-2xl"
            style={{
              background: `color-mix(in oklab, var(--color-${['accent', 'chart-2', 'chart-3', 'chart-4'][i % 4]}) ${30 + ((i * 17) % 50)}%, transparent)`,
            }}
          />
        ))}
      </div>
      <div className="relative">{children}</div>
    </div>
  )
}

const glassButton =
  'inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent'

export const Playground: Story = {
  render: (args) => (
    <Backdrop>
      <LiquidGlass {...args} className="rounded-full">
        <button type="button" className={glassButton}>
          Join the beta
        </button>
      </LiquidGlass>
    </Backdrop>
  ),
}

/** Glass buttons over a live aurora. Move across them: each leans toward the pointer and its highlight follows; press one to squish it. */
export const GlassButtonsOnAnAurora: Story = {
  name: 'Glass buttons on an aurora',
  render: (args) => (
    <div className="relative grid min-h-[520px] place-items-center overflow-hidden bg-canvas">
      <Aurora className="absolute inset-0" />
      <div className="relative flex flex-col items-center gap-8 px-6 text-center">
        <p className="max-w-md text-3xl font-semibold tracking-tight text-balance text-fg">Your work, in one calm place</p>
        <div className="flex flex-wrap justify-center gap-3">
          <LiquidGlass {...args} className="rounded-full">
            <button type="button" className={glassButton}>
              Start free
            </button>
          </LiquidGlass>
          <LiquidGlass {...args} className="rounded-full">
            <button type="button" className={glassButton}>
              Watch the tour
            </button>
          </LiquidGlass>
          <LiquidGlass {...args} className="rounded-full">
            <span className="inline-flex h-8 items-center px-3 font-mono text-xs text-fg-muted">v2.4 · new</span>
          </LiquidGlass>
        </div>
      </div>
    </div>
  ),
}

const TOOLS = [
  { id: 'bold', label: 'Bold', icon: Bold },
  { id: 'italic', label: 'Italic', icon: Italic },
  { id: 'underline', label: 'Underline', icon: Underline },
  { id: 'link', label: 'Link', icon: Link },
  { id: 'list', label: 'List', icon: List },
]

function Toolbar(args: Args) {
  const [on, setOn] = useState<Set<string>>(() => new Set(['bold']))
  const [playing, setPlaying] = useState(false)
  const toggle = (id: string) =>
    setOn((s) => {
      const next = new Set(s)
      if (!next.delete(id)) next.add(id)
      return next
    })
  return (
    <div className="flex flex-col items-center gap-6">
      <LiquidGlass {...args} className="rounded-full">
        <div role="toolbar" aria-label="Formatting" className="flex items-center gap-1 p-1.5">
          {TOOLS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-label={label}
              aria-pressed={on.has(id)}
              onClick={() => toggle(id)}
              className="grid size-9 place-items-center rounded-full text-fg-muted outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-accent aria-pressed:bg-selected aria-pressed:text-fg"
            >
              <Icon className="size-4" aria-hidden />
            </button>
          ))}
        </div>
      </LiquidGlass>
      <LiquidGlass {...args} className="rounded-full">
        <div className="flex items-center gap-1 p-1.5">
          <button
            type="button"
            aria-label="Previous"
            className="grid size-9 place-items-center rounded-full text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <SkipBack className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            aria-label={playing ? 'Pause' : 'Play'}
            onClick={() => setPlaying((p) => !p)}
            className="grid size-10 place-items-center rounded-full bg-accent text-accent-contrast outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
          </button>
          <button
            type="button"
            aria-label="Next"
            className="grid size-9 place-items-center rounded-full text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <SkipForward className="size-4" aria-hidden />
          </button>
        </div>
      </LiquidGlass>
    </div>
  )
}

/** A floating pill toolbar over content: the glass keeps the page readable through it, and the whole bar leans and squishes as one. */
export const FloatingPillToolbar: Story = {
  name: 'Floating pill toolbar',
  render: (args) => (
    <Backdrop>
      <Toolbar {...args} />
    </Backdrop>
  ),
}

/** Reduced motion: static glass. The blur, rim and drop stay; nothing leans, follows or squishes. */
export const ReducedMotion: Story = {
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <Backdrop>
        <Toolbar {...args} />
      </Backdrop>
    </YoujProvider>
  ),
}
