import { useRef } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowRight } from 'lucide-react'
import { CursorFollower, type CursorFollowerProps } from './cursor-follower'

const meta: Meta<CursorFollowerProps> = {
  title: 'Motion/Interactions/CursorFollower',
  component: CursorFollower,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A spring-following cursor layer that morphs over targets marked `data-cursor`: **button** wraps the target (leaning 10% toward the pointer), **text** becomes an I-beam the height of the line, **link** becomes a small pill label (`data-cursor-label`), **media** a round “View” badge. The shape is one box scaled per axis with counter-scaled corners, so the morph is transform-only. It renders nothing for touch or coarse pointers and under reduced motion. The native cursor stays visible unless `hideNativeCursor` is set, and even then only while the follower is actually drawing.',
      },
    },
  },
  argTypes: { hideNativeCursor: { control: 'boolean' }, disabled: { control: 'boolean' } },
  args: { hideNativeCursor: false, disabled: false },
}
export default meta
type Story = StoryObj<CursorFollowerProps>

const WORK = [
  { title: 'Northwind', kind: 'Brand system', tone: 'bg-[radial-gradient(120%_90%_at_20%_10%,var(--color-accent),transparent_60%)]' },
  { title: 'Halcyon', kind: 'Product site', tone: 'bg-[radial-gradient(120%_90%_at_80%_90%,var(--color-accent),transparent_55%)]' },
  { title: 'Parallel', kind: 'iOS app', tone: 'bg-[conic-gradient(from_200deg_at_60%_40%,var(--color-well),var(--color-accent),var(--color-raised))]' },
]

function Studio(args: CursorFollowerProps) {
  const scope = useRef<HTMLDivElement>(null)
  return (
    <div ref={scope} className="min-h-screen bg-canvas">
      <CursorFollower {...args} scope={scope} />
      <header className="mx-auto flex max-w-[1040px] items-center justify-between px-8 py-6">
        <span className="font-mono text-sm font-medium text-fg">field/studio</span>
        <nav className="flex items-center gap-6 text-sm text-fg-muted">
          {['Work', 'Process', 'Journal'].map((l) => (
            <a key={l} href="#" onClick={(e) => e.preventDefault()} data-cursor="link" data-cursor-label={`See ${l.toLowerCase()}`} className="rounded outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-accent">
              {l}
            </a>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-[1040px] px-8 pt-10 pb-16">
        <h1 data-cursor="text" className="max-w-[16ch] text-5xl leading-[1.05] font-semibold tracking-tight text-fg">
          We design software that feels inevitable.
        </h1>
        <p data-cursor="text" className="mt-5 max-w-[52ch] text-base leading-7 text-fg-muted">
          An independent studio for interface, motion and brand. We work with a handful of teams a year, from first sketch to the
          last easing curve.
        </p>
        <div className="mt-8 flex items-center gap-3">
          <button
            type="button"
            data-cursor="button"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-fg px-5 text-sm font-medium text-canvas outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            Start a project
            <ArrowRight className="size-4" />
          </button>
          <button
            type="button"
            data-cursor="button"
            className="inline-flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-sm font-medium text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Read the manifesto
          </button>
        </div>
        <div className="mt-14 grid grid-cols-3 gap-4">
          {WORK.map((w) => (
            <a key={w.title} href="#" onClick={(e) => e.preventDefault()} data-cursor="media" className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <div className={`aspect-[4/3] rounded-xl border border-line bg-well ${w.tone}`} />
              <div className="mt-3 flex items-baseline justify-between text-sm">
                <span className="font-medium text-fg">{w.title}</span>
                <span className="text-fg-subtle">{w.kind}</span>
              </div>
            </a>
          ))}
        </div>
      </main>
    </div>
  )
}

/** A studio landing page. Move over the nav, headline, buttons and project tiles. Needs a mouse or trackpad. */
export const Hero: Story = {
  render: (args) => <Studio {...args} />,
}

/** The follower becomes the cursor. The native one returns whenever the follower is off or the pointer leaves. */
export const HiddenNativeCursor: Story = {
  args: { hideNativeCursor: true },
  render: (args) => <Studio {...args} />,
}

/** Under reduced motion (or on touch) the component renders nothing and the native cursor does all the work. Switch the toolbar to "Motion: reduced" to check. */
export const ReducedMotion: Story = {
  render: (args) => <Studio {...args} />,
  globals: { reducedMotion: 'always' },
}
