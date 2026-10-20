import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowUp, AtSign, Paperclip, Sparkles } from 'lucide-react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ShimmerBorder, ShimmerButton, type ShimmerOptions } from './shimmer-border'

const meta: Meta<ShimmerOptions> = {
  title: 'Motion/Interactions/ShimmerBorder',
  component: ShimmerBorder as never,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A point of accent light travels the border: a conic gradient on a registered `@property` angle, masked to the border ring, so the loop runs entirely in CSS. Hover or keyboard focus lengthens the comet and lifts a soft bloom; both transition through registered properties, so leaving mid-way reverses smoothly. Pauses offscreen and in hidden tabs. Reduced motion parks the light at a fixed corner and keeps the hover emphasis.',
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

function Composer(props: ShimmerOptions) {
  return (
    <div className="w-full max-w-[560px]">
      <p className="mb-3 text-center text-sm text-fg-muted">Good afternoon, Ada. What should we ship today?</p>
      <ShimmerBorder {...props} className="rounded-2xl">
        <label htmlFor="yj-composer" className="sr-only">
          Ask the assistant
        </label>
        <textarea
          id="yj-composer"
          rows={3}
          placeholder="Ask anything about your workspace…"
          className="block w-full resize-none bg-transparent px-4 pt-4 text-[15px] leading-6 text-fg outline-none placeholder:text-fg-subtle"
        />
        <div className="flex items-center gap-1 px-2 pb-2">
          <button type="button" aria-label="Attach file" className="grid size-8 place-items-center rounded-lg text-fg-muted hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">
            <Paperclip className="size-4" />
          </button>
          <button type="button" aria-label="Mention" className="grid size-8 place-items-center rounded-lg text-fg-muted hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">
            <AtSign className="size-4" />
          </button>
          <span className="ml-1 inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1 font-mono text-[11px] text-fg-muted">
            <Sparkles className="size-3 text-accent" />
            reasoning · high
          </span>
          <button
            type="button"
            aria-label="Send"
            className="ml-auto grid size-8 place-items-center rounded-lg bg-fg text-canvas focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      </ShimmerBorder>
      <div className="mt-3 flex justify-center gap-2 text-xs text-fg-subtle">
        <span className="rounded-full border border-line px-2.5 py-1">Summarize this week’s incidents</span>
        <span className="rounded-full border border-line px-2.5 py-1">Draft release notes</span>
      </div>
    </div>
  )
}

/** An AI composer at rest. Focus the textarea (or hover) to see the light intensify. */
export const Hero: Story = {
  render: (args) => <Composer {...args} />,
}

/** The button form, on a plan-upgrade card. Tab to it: focus-visible intensifies exactly like hover. */
export const UpgradeCard: Story = {
  render: (args) => (
    <div className="w-full max-w-[340px] rounded-2xl border border-line bg-surface p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-fg">Team plan</span>
        <span className="rounded-full bg-well px-2 py-0.5 font-mono text-[11px] text-fg-muted">14 days left</span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-fg">
        $24<span className="text-base font-normal text-fg-muted"> / seat / mo</span>
      </p>
      <ul className="mt-4 space-y-2 text-sm text-fg-muted">
        <li>Unlimited projects and previews</li>
        <li>SAML SSO and audit log</li>
        <li>Priority build queue</li>
      </ul>
      <ShimmerButton {...args} className="mt-6 w-full">
        <Sparkles className="size-4 text-accent" />
        Upgrade to Pro
      </ShimmerButton>
    </div>
  ),
}

export const Playground: Story = {
  render: (args) => (
    <div className="flex flex-col items-center gap-8">
      <ShimmerBorder {...args} className="grid h-40 w-72 place-items-center">
        <span className="text-sm text-fg-muted">Container</span>
      </ShimmerBorder>
      <ShimmerButton {...args}>Button</ShimmerButton>
    </div>
  ),
}

/** Reduced motion: the light is parked at a fixed corner, hover and focus still intensify it (instantly). */
export const ReducedMotion: Story = {
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <Composer {...args} />
    </YoujProvider>
  ),
}
