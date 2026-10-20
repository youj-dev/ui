import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Check } from 'lucide-react'
import { cn } from '@youj/core/lib/youj/cn'
import { Counter } from './counter'

const meta = {
  title: 'Motion/Counter',
  component: Counter,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'An animated number formatted by `Intl.NumberFormat` (currency, percent, compact, fraction digits) in tabular numerals. `tween` counts through values; `roll` turns each digit on its own wheel like an odometer, always the way the number moved (9 → 0 going up wraps forward), on the `smooth` spring, fading through soft edges and blurring by its speed; columns are keyed by place value, and one that appears or goes opens or closes its width. New values mid-animation retarget from wherever the number is. Plays on first view by default (`startOnView`). The formatted value is always in an `sr-only` span. Reduced motion shows the value directly.',
      },
    },
  },
  args: {
    value: 48210,
    from: 0,
    mode: 'roll',
    format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
    locale: 'en-US',
    inView: true,
    duration: 'deliberate',
    ease: 'emphasized',
  },
  argTypes: {
    mode: { control: 'inline-radio', options: ['tween', 'roll'] },
    duration: { control: 'inline-radio', options: ['base', 'slow', 'deliberate'] },
    ease: { control: 'inline-radio', options: ['standard', 'enter', 'emphasized'] },
  },
} satisfies Meta<typeof Counter>

export default meta
type Story = StoryObj<typeof meta>

const PLANS = [
  { name: 'Hobby', monthly: 0, yearly: 0, blurb: 'For side projects.', features: ['1 seat', 'Community support'] },
  { name: 'Pro', monthly: 24, yearly: 19, blurb: 'For shipping teams.', features: ['Unlimited seats', 'All primitives', 'Priority support'], featured: true },
  { name: 'Studio', monthly: 96, yearly: 79, blurb: 'For agencies.', features: ['Client workspaces', 'Custom tokens', 'SSO'] },
]

function Pricing() {
  const [yearly, setYearly] = useState(true)
  return (
    <div className="w-[min(920px,92vw)]">
      <div className="mb-10 flex flex-col items-center gap-5">
        <h2 className="text-3xl font-semibold tracking-tight text-fg">Simple pricing</h2>
        <div role="radiogroup" aria-label="Billing period" className="flex rounded-full border border-line bg-surface p-1 text-sm">
          {[false, true].map((y) => (
            <button
              key={String(y)}
              role="radio"
              aria-checked={yearly === y}
              onClick={() => setYearly(y)}
              className={cn(
                'rounded-full px-4 py-1.5 font-medium transition-colors yj-duration-fast ease-standard focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none',
                yearly === y ? 'bg-fg text-canvas' : 'text-fg-muted hover:text-fg',
              )}
            >
              {y ? 'Yearly · save 20%' : 'Monthly'}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.name} className={cn('rounded-2xl border bg-surface p-6', p.featured ? 'border-accent' : 'border-line')}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-fg">{p.name}</p>
              {p.featured && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-on-accent">Popular</span>}
            </div>
            <p className="mt-1 text-sm text-fg-muted">{p.blurb}</p>
            <p className="mt-6 flex items-baseline gap-1">
              <Counter
                value={yearly ? p.yearly : p.monthly}
                from={p.monthly}
                inView={false}
                format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
                locale="en-US"
                className="text-5xl font-semibold tracking-tight text-fg"
              />
              <span className="text-sm text-fg-muted">/ seat / mo</span>
            </p>
            <ul className="mt-6 space-y-2 text-sm text-fg-muted">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check aria-hidden className="size-4 text-accent" /> {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Toggle the billing period quickly: prices retarget mid-count without jumping. */
export const Hero: Story = { parameters: { layout: 'fullscreen' }, render: () => <div className="grid min-h-screen place-items-center p-8"><Pricing /></div> }

function Stats() {
  const [n, setN] = useState(0)
  const bump = () => setN((x) => x + 1)
  const rows = [
    { label: 'Revenue', value: 48210 + n * 1377, format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } as const },
    { label: 'Requests', value: 1_240_000_000 + n * 83_000_000, format: { notation: 'compact', maximumFractionDigits: 2 } as const },
    { label: 'Uptime', value: 0.9998 - n * 0.0003, format: { style: 'percent', minimumFractionDigits: 2 } as const },
  ]
  return (
    <div className="w-full max-w-[640px]">
      <div className="grid grid-cols-1 divide-y divide-line rounded-2xl sm:grid-cols-3 sm:divide-x sm:divide-y-0 border border-line bg-surface">
        {rows.map((r) => (
          <div key={r.label} className="p-6">
            <p className="text-xs text-fg-muted">{r.label}</p>
            <Counter mode="roll" value={r.value} format={r.format} locale="en-US" className="mt-2 text-3xl font-semibold tracking-tight text-fg" />
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button type="button" onClick={bump} className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-medium text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">
          Next period
        </button>
      </div>
    </div>
  )
}

/** Odometer columns for a dashboard stat row: currency, compact and percent. */
export const RollingStats: Story = { render: () => <Stats /> }

function OdometerDemo() {
  const [n, setN] = useState(996)
  const steps = [-100, -1, 1, 7, 100]
  return (
    <div className="flex w-full max-w-[420px] flex-col items-center gap-6 rounded-2xl border border-line bg-surface p-8">
      <Counter mode="roll" value={n} from={n} locale="en-US" inView={false} className="text-6xl font-semibold tracking-tight text-fg" />
      <div className="flex gap-2">
        {steps.map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => setN((x) => Math.max(0, x + step))}
            className="rounded-md border border-line bg-surface px-3 py-1.5 font-mono text-xs font-medium text-fg tabular-nums hover:bg-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            {step > 0 ? `+${step}` : step}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Each wheel turns the way the number moved (9 → 0 going up rolls forward), blurs by how fast it turns, and a new column opens its width at 999 → 1,000. Click quickly: the wheels keep their momentum. */
export const Odometer: Story = { render: () => <OdometerDemo /> }

export const Playground: Story = {
  render: (args) => <Counter {...args} className="text-6xl font-semibold tracking-tight text-fg" />,
}

export const ReducedMotion: Story = {
  ...Hero,
  globals: { reducedMotion: 'always' },
}
