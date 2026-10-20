import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Marquee } from './marquee'

const meta = {
  title: 'Motion/Marquee',
  component: Marquee,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A seamless loop, horizontal (`left`/`right`) or vertical (`up`/`down`). The content is measured and repeated just enough to fill the track; only one copy is real, and the others are `inert` and `aria-hidden`. `speed` is px/s scaled by the time scale. Hover eases it to a stop rather than cutting (`pauseOnHover`). Keyboard focus inside stops it at once and eases the focused item clear of the faded edges, so Tab never lands on a half-hidden or duplicated item. `fade` masks the edges. Pauses offscreen and in hidden tabs. Reduced motion shows one static, wrapping row.',
      },
    },
  },
  args: { direction: 'left', speed: 40, pauseOnHover: true, fade: 64, gap: 56, children: null },
  argTypes: {
    direction: { control: 'inline-radio', options: ['left', 'right', 'up', 'down'] },
    speed: { control: { type: 'range', min: 5, max: 200, step: 5 } },
    fade: { control: { type: 'range', min: 0, max: 160, step: 8 } },
    gap: { control: { type: 'range', min: 8, max: 120, step: 4 } },
    children: { control: false },
  },
} satisfies Meta<typeof Marquee>

export default meta
type Story = StoryObj<typeof meta>

/* Fictional wordmarks, each a small geometric glyph plus set type. */
const Mark = ({ glyph, name, className }: { glyph: ReactNode; name: string; className?: string }) => (
  <span className={`flex items-center gap-2 text-fg-muted ${className ?? ''}`} role="img" aria-label={name}>
    <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="currentColor">
      {glyph}
    </svg>
    <span aria-hidden className="text-xl font-semibold tracking-tight">{name}</span>
  </span>
)

const LOGOS = [
  <Mark key="n" name="Northwind" glyph={<path d="M4 20V4l16 16V4" fill="none" stroke="currentColor" strokeWidth="2.5" />} />,
  <Mark key="h" name="Halcyon" glyph={<><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" /><circle cx="12" cy="12" r="3.5" /></>} />,
  <Mark key="v" name="Vertex" glyph={<path d="M12 3 21 20H3Z" />} className="[&>span]:tracking-[0.12em] [&>span]:uppercase [&>span]:text-base" />,
  <Mark key="o" name="orbital" glyph={<><circle cx="12" cy="12" r="4" /><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(-25 12 12)" /></>} className="[&>span]:font-medium" />,
  <Mark key="q" name="Quanta" glyph={<><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" opacity=".4" /></>} />,
  <Mark key="l" name="Lumen" glyph={<path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />} className="[&>span]:font-medium" />,
  <Mark key="p" name="Parallel" glyph={<path d="M7 3h4l-4 18H3ZM17 3h4l-4 18h-4Z" />} className="[&>span]:italic" />,
  <Mark key="c" name="Cobalt" glyph={<path d="M20 7.5A9 9 0 1 0 20 16.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />} />,
]

/** A logo wall: two rows running opposite ways at slightly different speeds. Hover to ease a row to a stop. */
export const Hero: Story = {
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <section className="grid min-h-screen grid-cols-[minmax(0,1fr)] place-items-center">
      <div className="w-full max-w-5xl">
        <p className="mb-10 text-center text-sm text-fg-muted">Trusted by product teams at</p>
        <div className="space-y-8">
          <Marquee {...args} aria-label="Customer logos">
            {LOGOS}
          </Marquee>
          <Marquee {...args} direction={args.direction === 'left' ? 'right' : 'left'} speed={(args.speed ?? 40) * 0.8} aria-label="More customer logos">
            {[...LOGOS].reverse()}
          </Marquee>
        </div>
      </div>
    </section>
  ),
}

const QUOTES = [
  { q: 'The motion finally feels like one product instead of twelve.', who: 'Design lead, Northwind' },
  { q: 'Reduced motion used to be an afterthought. Now it is the default we test first.', who: 'Staff engineer, Halcyon' },
  { q: 'Tokens for time was the missing piece of our design system.', who: 'Founder, Quanta' },
  { q: 'Our marketing site dropped three animation libraries.', who: 'Frontend, Lumen' },
]

export const VerticalTestimonials: Story = {
  args: { direction: 'up', speed: 24, fade: 80, gap: 16 },
  render: (args) => (
    <Marquee {...args} className="h-[420px] w-full max-w-[360px]" aria-label="Testimonials">
      {QUOTES.map((t) => (
        <figure key={t.who} className="w-full max-w-[360px] rounded-xl border border-line bg-surface p-5">
          <blockquote className="text-sm/relaxed text-fg">“{t.q}”</blockquote>
          <figcaption className="mt-3 text-xs text-fg-muted">{t.who}</figcaption>
        </figure>
      ))}
    </Marquee>
  ),
}

const INTEGRATIONS = ['GitHub', 'Linear', 'Slack', 'Figma', 'Vercel', 'Sentry', 'Notion']

/** Interactive items: Tab walks the real set only. Focus stops the row and brings the focused link clear of the fades. */
export const WithLinks: Story = {
  args: { fade: 80, gap: 12 },
  render: (args) => (
    <div className="w-full max-w-[560px] space-y-3">
      <a href="#before" className="text-sm text-fg-muted underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">
        Before the row
      </a>
      <Marquee {...args} aria-label="Integrations">
        {INTEGRATIONS.map((name) => (
          <a
            key={name}
            href={`#${name.toLowerCase()}`}
            className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-fg outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-accent"
          >
            {name}
          </a>
        ))}
      </Marquee>
    </div>
  ),
}

export const Playground: Story = {
  render: (args) => (
    <Marquee {...args} className={args.direction === 'up' || args.direction === 'down' ? 'h-80 w-64' : 'w-full max-w-[720px]'}>
      {LOGOS.slice(0, 4)}
    </Marquee>
  ),
}

/** One static row that wraps; nothing moves. */
export const ReducedMotion: Story = {
  ...Hero,
  globals: { reducedMotion: 'always' },
}
