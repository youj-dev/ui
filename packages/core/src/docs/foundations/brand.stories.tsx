import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujLockup, YoujMark, YoujWordmark } from '../brand/youj-logo'
import { block, favicon, mark, MARK_VIEWBOX } from '../brand/logo'
import { IntroHero } from '../components/intro-hero'
import { ReplayButton, useReplay } from '../components/kit'

function Replayable({ children }: { children: (key: string) => ReactNode }) {
  const [key, replay] = useReplay()
  return (
    <div className="flex flex-col items-center gap-8">
      {children(key)}
      <ReplayButton onClick={replay} />
    </div>
  )
}

const meta: Meta = {
  title: 'Foundations/Brand',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The youj logo: the word on its own in the text colour, no badge. Its one colour is the j\'s square tittle in the accent: Basalt\'s yellow in dark, Graphite\'s blue in light on the site. The lettering is custom and built from one stroke and one bend: every corner turns like the j\'s hook, the o is the u closed and square, and the y is the u\'s bowl on the j\'s tail. At interface sizes (`optical="text"`, the default) the tittle grows 1.3× about its centre so it reads in a 24px header; `optical="display"` draws it as is, for a hero. `animated` plays the stamp: the letters rise into place in reading order on `slow`, and the tittle lands last on the settle spring, the one earned overshoot. Reduced motion shows the rest frame. For marketing, `ui` adds a muted "UI" tag after the word. The badge is kept for icons only: the mark is the u holding the tittle in a badge in the ink, a part dropped into place (the favicons are the mark re-drawn on whole pixels, and the app icon is the mark full bleed); Block, its companion for bots and communities, builds the tittle as an isometric block in the cup.',
      },
    },
  },
}
export default meta

export const Hero: StoryObj = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="mx-auto w-[min(960px,100%)] p-4">
      <IntroHero />
    </div>
  ),
}

/** The logo where it lives: a 24px header, the tittle grown so it reads at nav size. Pointing at it replays the stamp. */
export const InAHeader: StoryObj = {
  name: 'In a header',
  parameters: { layout: 'padded' },
  render: () => (
    <Replayable>
      {(key) => (
        <div className="flex h-14 w-[min(720px,100%)] items-center gap-7 rounded-xl border border-line bg-canvas px-4">
          <YoujLockup key={key} animated className="text-[24px]" />
          <nav className="flex gap-5 text-[13.5px] text-fg-muted">
            <span className="text-fg">Docs</span>
            <span>Components</span>
            <span>Motion</span>
            <span>Blocks</span>
          </nav>
        </div>
      )}
    </Replayable>
  ),
}

export const AnimatedLockup: StoryObj = {
  render: () => <Replayable>{(key) => <YoujLockup key={key} animated optical="display" className="text-[64px]" />}</Replayable>,
}

export const Lockup: StoryObj = {
  render: () => (
    <div className="flex flex-col items-start gap-6">
      {(
        [
          [72, 'display'],
          [48, 'display'],
          [32, 'text'],
          [24, 'text'],
          [20, 'text'],
          [16, 'text'],
        ] as const
      ).map(([size, optical]) => (
        <div key={size} className="flex items-center gap-6">
          <span className="w-28 font-mono text-xs whitespace-nowrap text-fg-muted">
            {size}px · {optical}
          </span>
          <div style={{ fontSize: size }}>
            <YoujLockup optical={optical} />
          </div>
        </div>
      ))}
    </div>
  ),
}

export const UiLockup: StoryObj = {
  name: 'Youj UI lockup',
  render: () => (
    <div className="flex flex-col items-start gap-8">
      <Replayable>{(key) => <YoujLockup key={key} animated ui optical="display" className="text-[56px]" />}</Replayable>
      {[32, 20].map((size) => (
        <div key={size} style={{ fontSize: size }}>
          <YoujLockup ui />
        </div>
      ))}
    </div>
  ),
}

export const Mark: StoryObj = {
  render: () => (
    <div className="flex items-end gap-6">
      {[16, 24, 32, 48, 96].map((size) => (
        <div key={size} style={{ width: size, height: size }}>
          <YoujMark className="size-full" />
        </div>
      ))}
    </div>
  ),
}

export const Favicons: StoryObj = {
  name: 'Favicons (hinted)',
  render: () => (
    <div className="flex items-end gap-6">
      {([16, 32] as const).map((size) => {
        const { tile, glyph, tittle: dot } = favicon[size]
        return (
          <div key={size} className="flex flex-col items-center gap-2">
            <svg width={size * 4} height={size * 4} viewBox={`0 0 ${size} ${size}`} aria-hidden style={{ imageRendering: 'pixelated' }}>
              <path d={tile} className="fill-fg" />
              <path d={glyph} className="fill-canvas" />
              <rect x={dot.x} y={dot.y} width={dot.size} height={dot.size} className="fill-accent" />
            </svg>
            <span className="font-mono text-xs text-fg-muted">{size}px</span>
          </div>
        )
      })}
    </div>
  ),
}

/** The home-screen icon: the mark full bleed (the platform rounds it; here a 22% corner stands in). */
export const AppIcon: StoryObj = {
  name: 'App icon',
  render: () => (
    <div className="flex items-end gap-6">
      {[180, 120, 60].map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <svg width={size} height={size} viewBox={MARK_VIEWBOX} aria-hidden className="rounded-[22%]">
            <rect width={24} height={24} className="fill-fg" />
            <path d={mark.glyph} className="fill-canvas" />
            <rect x={mark.tittle.x} y={mark.tittle.y} width={mark.tittle.size} height={mark.tittle.size} className="fill-accent" />
          </svg>
          <span className="font-mono text-xs text-fg-muted">{size}px</span>
        </div>
      ))}
    </div>
  ),
}

/** Block, the companion for bot and community avatars: the mark with its tittle as an isometric block, in a circle crop
 * and a rounded one. */
export const Block: StoryObj = {
  render: () => (
    <div className="flex items-end gap-6">
      {[128, 64, 32].flatMap((size) =>
        ['rounded-full', 'rounded-[22%]'].map((crop) => (
          <svg key={`${size}${crop}`} width={size} height={size} viewBox={MARK_VIEWBOX} aria-hidden className={crop}>
            <rect width={24} height={24} className="fill-fg" />
            <path transform={`translate(12 12) scale(${block.scale}) translate(-12 -12)`} d={mark.glyph} className="fill-canvas" />
            <path d={block.faces.top} className="fill-accent" />
            <path d={block.faces.left} className="fill-canvas" />
            <path d={block.faces.right} style={{ fill: 'color-mix(in oklab, var(--color-canvas) 55%, var(--color-fg))' }} />
          </svg>
        )),
      )}
    </div>
  ),
}

export const Wordmark: StoryObj = {
  render: () => <YoujWordmark className="h-16" />,
}
