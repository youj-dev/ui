import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowRight, Search, Sparkles } from 'lucide-react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { cn } from '@youj/core/lib/youj/cn'
import { Shimmer, useShimmer, type ShimmerOptions } from './shimmer'

const meta: Meta<ShimmerOptions> = {
  title: 'Motion/Effects/Shimmer',
  component: Shimmer as never,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The traveling border light behind ShimmerBorder, for any element. `Shimmer` wraps content in the effect and brings no look of its own; `useShimmer()` puts it on your own element (spread `rootProps`, merging `className` and `style`, and render `layers` first). A conic gradient on a registered `@property` angle, masked to the border, runs entirely in CSS; hover and keyboard focus lengthen the comet and lift a bloom, reversing smoothly mid-way. The loop pauses offscreen and in hidden tabs; reduced motion parks the light at a corner.',
      },
    },
  },
  argTypes: {
    idle: { control: 'inline-radio', options: ['subtle', 'visible', 'hidden'] },
    intensify: { control: 'boolean' },
    speed: { control: 'inline-radio', options: ['slow', 'base', 'fast'] },
    borderWidth: { control: { type: 'range', min: 1, max: 3, step: 0.5 } },
  },
  args: { idle: 'subtle', intensify: true, speed: 'base', borderWidth: 1 },
}
export default meta
type Story = StoryObj<ShimmerOptions>

function UpgradeLink(props: ShimmerOptions) {
  const { rootProps, layers } = useShimmer<HTMLAnchorElement>(props)
  return (
    <a
      href="#upgrade"
      onClick={(e) => e.preventDefault()}
      {...rootProps}
      className={cn(
        rootProps.className,
        'inline-flex h-7 items-center gap-1.5 rounded-full bg-surface px-3 text-xs font-medium text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
      )}
    >
      {layers}
      <span className="relative z-2 inline-flex items-center gap-1.5">
        <Sparkles className="size-3.5 text-accent" />
        Try Pro free
        <ArrowRight className="size-3" />
      </span>
    </a>
  )
}

function SearchBar(props: ShimmerOptions) {
  return (
    <div className="flex w-full max-w-[560px] flex-col items-center gap-5">
      <nav aria-label="Account" className="flex w-full items-center justify-between rounded-xl border border-line bg-surface px-3 py-2">
        <span className="text-sm font-medium text-fg">acme</span>
        <UpgradeLink {...props} />
      </nav>
      <Shimmer {...props} className="w-full rounded-xl bg-surface">
        <label className="flex h-12 items-center gap-3 px-4">
          <Search aria-hidden className="size-4 text-fg-subtle" />
          <span className="sr-only">Search docs and ask AI</span>
          <input placeholder="Search docs or ask anything…" className="h-full flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle" />
          <kbd className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-fg-subtle">⌘K</kbd>
        </label>
      </Shimmer>
    </div>
  )
}

/** Shimmer around a search field (focus it to intensify) and useShimmer on a nav link. */
export const Hero: Story = {
  render: (args) => <SearchBar {...args} />,
}

/** Reduced motion: the light is parked; hover and focus still intensify it, instantly. */
export const ReducedMotion: Story = {
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <SearchBar {...args} />
    </YoujProvider>
  ),
}
