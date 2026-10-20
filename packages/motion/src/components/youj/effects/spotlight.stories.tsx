import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Check } from 'lucide-react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { cn } from '@youj/core/lib/youj/cn'
import { SpotlightGroup, SpotlightSurface, useSpotlight, type SpotlightGroupProps } from './spotlight'

const meta: Meta<SpotlightGroupProps> = {
  title: 'Motion/Effects/Spotlight',
  component: SpotlightGroup,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The spotlight behind SpotlightCard, for any surface. `SpotlightSurface` is a surface with the lit layers and no look of its own; `SpotlightGroup` shares one pointer-tracked light across the surfaces inside it (neighbors light up at their nearest edges); `useSpotlight(ref)` is the tracker alone: it writes `--yj-spot-x` / `--yj-spot-y` onto every `[data-yj-spot-card]` for your own CSS. Keyboard focus parks the light on the focused surface and glides it between surfaces. Off for touch; reduced motion drops tracking and shows a static accent border on hover and focus.',
      },
    },
  },
  argTypes: { radius: { control: { type: 'range', min: 120, max: 480, step: 20 } } },
  args: { radius: 220 },
}
export default meta
type Story = StoryObj<SpotlightGroupProps>

const PLANS = [
  { name: 'Hobby', price: '$0', note: 'For side projects', features: ['1 project', 'Preview deploys', 'Community support'] },
  { name: 'Pro', price: '$24', note: 'Per seat / month', features: ['Unlimited projects', 'Password protection', 'Priority builds'] },
  { name: 'Team', price: '$64', note: 'Per seat / month', features: ['SSO and audit log', 'Role-based access', '99.99% SLA'] },
]

function Plans(props: SpotlightGroupProps) {
  const [picked, setPicked] = useState('Pro')
  return (
    <SpotlightGroup {...props} role="radiogroup" aria-label="Plan" className="grid w-full max-w-[760px] grid-cols-1 gap-3 sm:grid-cols-3">
      {PLANS.map((plan) => (
        <SpotlightSurface key={plan.name} className="rounded-2xl border border-line bg-surface">
          <button
            type="button"
            role="radio"
            aria-checked={picked === plan.name}
            onClick={() => setPicked(plan.name)}
            className="flex h-full w-full flex-col rounded-2xl p-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="flex items-center justify-between">
              <span className="text-sm font-medium text-fg">{plan.name}</span>
              <span
                className={cn(
                  'grid size-4 place-items-center rounded-full border',
                  picked === plan.name ? 'border-accent bg-accent text-on-accent' : 'border-line-strong',
                )}
              >
                {picked === plan.name && <Check className="size-3" strokeWidth={3} />}
              </span>
            </span>
            <span className="mt-4 text-2xl font-semibold tracking-tight text-fg">{plan.price}</span>
            <span className="text-xs text-fg-muted">{plan.note}</span>
            <span className="mt-4 flex flex-col gap-1.5 text-[13px] text-fg-muted">
              {plan.features.map((f) => (
                <span key={f} className="flex items-center gap-2">
                  <Check aria-hidden className="size-3.5 text-fg-subtle" />
                  {f}
                </span>
              ))}
            </span>
          </button>
        </SpotlightSurface>
      ))}
    </SpotlightGroup>
  )
}

/** A plan picker: three surfaces share one light. Move across them, or Tab / arrow through. */
export const Hero: Story = {
  render: (args) => <Plans {...args} />,
}

/** useSpotlight alone, driving custom CSS: a dot grid that brightens around the pointer. */
export const CustomLight: Story = {
  render: () => {
    function Field() {
      const ref = useRef<HTMLDivElement>(null)
      useSpotlight(ref)
      return (
        <div
          ref={ref}
          data-yj-spot-card=""
          className="relative grid h-56 w-full max-w-[520px] place-items-center overflow-hidden rounded-2xl border border-line bg-surface"
        >
          <div
            aria-hidden
            className="absolute inset-0 [background-image:radial-gradient(var(--color-line-strong)_1px,transparent_1px)] [background-size:16px_16px]"
          />
          <div
            aria-hidden
            className="absolute inset-0 [background-image:radial-gradient(var(--color-accent)_1.5px,transparent_1.5px)] [background-size:16px_16px] [mask-image:radial-gradient(160px_circle_at_var(--yj-spot-x,-999px)_var(--yj-spot-y,-999px),black,transparent)]"
          />
          <p className="relative rounded-full border border-line bg-surface px-3 py-1 font-mono text-xs text-fg-muted">
            --yj-spot-x / --yj-spot-y, your CSS
          </p>
        </div>
      )
    }
    return <Field />
  },
}

/** Reduced motion: no tracking. The hovered or focused surface shows a static accent border. */
export const ReducedMotion: Story = {
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <Plans {...args} />
    </YoujProvider>
  ),
}
