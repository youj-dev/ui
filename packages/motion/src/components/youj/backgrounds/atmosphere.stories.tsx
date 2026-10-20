import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ThemeScope, YoujProvider } from '@youj/core/lib/youj/provider'
import { cinnabar, meadow, sandstone, umber } from '@youj/core/lib/youj/theme/themes'
import { Atmosphere, type AtmosphereScene } from './atmosphere'

const PRESET = { meadow, sandstone, cinnabar, umber } as const

const SOURCES = [
  { name: 'Direct', share: 38, tone: 'bg-chart-1' },
  { name: 'Search', share: 27, tone: 'bg-chart-2' },
  { name: 'Referral', share: 17, tone: 'bg-chart-3' },
  { name: 'Social', share: 11, tone: 'bg-chart-4' },
  { name: 'Email', share: 7, tone: 'bg-chart-5' },
]

/* Storybook only: a card in the scene's preset, floating on the scene, the way the docs show blocks on it. */
function Card() {
  return (
    <div className="relative w-[min(400px,calc(100%-2rem))] rounded-2xl border border-line bg-raised p-1.5 text-fg shadow-xl">
      <p className="px-3 pt-2 pb-2.5 font-mono text-xs tracking-wider text-fg-muted uppercase">Visitors by source</p>
      <div className="rounded-xl border border-line bg-surface p-4">
        <p className="text-sm text-fg-muted">This week</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">18,406</p>
        <div className="mt-4 flex h-2 gap-1">
          {SOURCES.map((s) => (
            <span key={s.name} className={`${s.tone} rounded-full`} style={{ width: `${s.share}%` }} />
          ))}
        </div>
        <ul className="mt-4 divide-y divide-line text-sm">
          {SOURCES.map((s) => (
            <li key={s.name} className="flex items-center gap-2.5 py-2">
              <span className={`${s.tone} size-2 rounded-sm`} />
              <span className="flex-1">{s.name}</span>
              <span className="text-fg-muted tabular-nums">{s.share}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Stage({ scene, children }: { scene: AtmosphereScene; children: ReactNode }) {
  return (
    <ThemeScope theme={PRESET[scene]}>
      <section className="relative isolate grid min-h-[max(100vh,560px)] place-items-center overflow-hidden bg-canvas p-6">
        {children}
        <Card />
      </section>
    </ThemeScope>
  )
}

const meta = {
  title: 'Motion/Backgrounds/Atmosphere',
  component: Atmosphere,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A painted, grainy ground for a card to float on. Four scenes: `meadow` (a meadow under sky, panned so it streaks), `sandstone` (broad dunes lit from the top left, with a fine suede grain), `cinnabar` (a dark ground glowing into English red, crossed by soft shadow bands) and `umber` (a dusk going down from a pale sky to umber, with a coarse stipple). Each has its own palette for light and dark, from a combination in Sanzo Wada\'s *A Dictionary of Color Combinations*, and pairs with the theme preset of its name, which takes its colors from the same combination. The middle of each composition is the quietest part, so the card stays the hero. One fragment shader at up to 24 frames a second, paused off screen; under reduced motion it draws one still frame, and without WebGL2 a still CSS gradient with grain.',
      },
    },
  },
  args: { scene: 'meadow', speed: 1 },
  argTypes: {
    scene: { control: 'inline-radio', options: ['meadow', 'sandstone', 'cinnabar', 'umber'] },
    speed: { control: { type: 'range', min: 0, max: 6, step: 0.1 } },
    grain: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    colors: { control: 'object' },
    className: { control: false },
  },
} satisfies Meta<typeof Atmosphere>

export default meta
type Story = StoryObj<typeof meta>

/** A card in the scene's own preset, on the scene: switch the scene, and light or dark in the toolbar. */
export const Hero: Story = {
  render: (args) => (
    <Stage scene={args.scene ?? 'meadow'}>
      <Atmosphere {...args} />
    </Stage>
  ),
}

/** All four at once, each with its preset. */
export const Scenes: Story = {
  render: (args) => (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      {(['meadow', 'sandstone', 'cinnabar', 'umber'] as const).map((scene) => (
        <ThemeScope key={scene} theme={PRESET[scene]}>
          <section className="relative isolate grid min-h-[420px] place-items-center overflow-hidden bg-canvas p-6">
            <Atmosphere {...args} scene={scene} />
            <Card />
          </section>
        </ThemeScope>
      ))}
    </div>
  ),
}

/** Your own colors, as tokens: they follow light and dark. Five, in the scene's order (sandstone: light, mid, shadow, deep, rim). */
export const OwnColors: Story = {
  name: 'Own colors',
  args: {
    scene: 'sandstone',
    colors: ['var(--color-surface)', 'var(--color-chart-4)', 'var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-canvas)'],
  },
  render: (args) => (
    <Stage scene="sandstone">
      <Atmosphere {...args} />
    </Stage>
  ),
}

/** Under reduced motion each scene is one composed still frame, with the grain halved; nothing drifts. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <Stage scene={args.scene ?? 'meadow'}>
        <Atmosphere {...args} />
      </Stage>
    </YoujProvider>
  ),
}
