import { useId, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { cn } from '@youj/core/lib/youj/cn'
import { Collapse, type CollapseProps } from './collapse'

const meta: Meta<CollapseProps> = {
  title: 'Motion/Transitions/Collapse',
  component: Collapse,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Height-auto disclosure for anything that isn’t a Base UI Collapsible or Accordion (those take the `yj-collapse` preset). Height eases between 0 and the content’s own height on the `standard` curve; the content fades with it, out quicker than it collapses so text never looks squashed. A reversal mid-way starts from the current height. It clips only while moving or closed, so focus rings inside aren’t cut off at rest. Closed content is `inert` at once, then unmounts (or, with `keepMounted`, leaves the accessibility tree). Reduced motion opens and closes instantly.',
      },
    },
  },
  argTypes: {
    duration: { control: 'inline-radio', options: ['fast', 'base', 'slow', 'deliberate'] },
    keepMounted: { control: 'boolean' },
    open: { control: false },
    children: { control: false },
  },
  args: { duration: 'base', keepMounted: false },
}
export default meta
type Story = StoryObj<CollapseProps>

const chip =
  'rounded-full border border-line px-2.5 py-1 text-xs text-fg-muted transition-colors yj-duration-fast hover:text-fg aria-pressed:border-accent aria-pressed:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none'

function Filters({ duration, keepMounted }: Partial<CollapseProps>) {
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<string[]>(['Production'])
  const id = useId()
  const toggle = (v: string) => setPicked((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]))
  return (
    <div className="w-full max-w-[520px] rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="text-sm font-medium text-fg">Deployments</p>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-2.5 text-xs font-medium text-fg-muted transition-colors yj-duration-fast hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <SlidersHorizontal className="size-3.5" />
          Filters
          <ChevronDown className={cn('size-3.5 transition-transform yj-duration-base ease-standard', open && 'rotate-180')} />
        </button>
      </div>
      <Collapse id={id} open={open} duration={duration} keepMounted={keepMounted}>
        <div className="grid gap-4 border-t border-line px-4 py-4">
          {[
            ['Environment', ['Production', 'Preview', 'Development']],
            ['Status', ['Ready', 'Building', 'Error', 'Canceled']],
          ].map(([label, values]) => (
            <fieldset key={label as string}>
              <legend className="mb-2 text-xs font-medium text-fg-subtle">{label}</legend>
              <div className="flex flex-wrap gap-1.5">
                {(values as string[]).map((v) => (
                  <button key={v} type="button" aria-pressed={picked.includes(v)} onClick={() => toggle(v)} className={chip}>
                    {v}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
          <label className="flex items-center justify-between gap-3 text-sm text-fg">
            Branch
            <input
              placeholder="main"
              className="h-8 w-48 rounded-md border border-line bg-canvas px-2.5 text-sm text-fg outline-none placeholder:text-fg-subtle focus-visible:ring-2 focus-visible:ring-accent"
            />
          </label>
        </div>
      </Collapse>
      <ul className="border-t border-line text-sm">
        {['a41f9e2 Tighten cache headers', '9c02b1d Debounce the query', '77e1a08 Keep the return path'].map((c) => (
          <li key={c} className="border-b border-line px-4 py-2.5 font-mono text-[13px] text-fg-muted last:border-b-0">
            {c}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** A filter panel that opens above a list: the list below moves with the height. Toggle quickly to see it reverse mid-way. */
export const Hero: Story = {
  render: (args) => <Filters {...args} />,
}

function Faq() {
  const items = [
    ['What counts as a seat?', 'Anyone who can sign in to the team. Guests with view-only links are free.'],
    [
      'Can I change plans mid-cycle?',
      'Yes. Upgrades are prorated to the day and apply at once; downgrades take effect at the end of the billing period, so nobody loses access they already paid for.',
    ],
    ['Do previews count toward usage?', 'Preview builds share the build minutes of your plan. Bandwidth for previews is free.'],
  ]
  const [open, setOpen] = useState<number | null>(1)
  return (
    <div className="w-full max-w-[520px] divide-y divide-line rounded-2xl border border-line bg-surface">
      {items.map(([q, a], i) => (
        <div key={q}>
          <button
            type="button"
            aria-expanded={open === i}
            aria-controls={`faq-${i}`}
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left text-sm font-medium text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:ring-inset"
          >
            {q}
            <ChevronDown aria-hidden className={cn('size-4 shrink-0 text-fg-subtle transition-transform yj-duration-base ease-standard', open === i && 'rotate-180')} />
          </button>
          <Collapse id={`faq-${i}`} open={open === i}>
            <p className="px-4 pb-4 text-sm leading-6 text-fg-muted">{a}</p>
          </Collapse>
        </div>
      ))}
    </div>
  )
}

/** One open at a time: one panel collapses while the next opens, on the same curve. */
export const Accordion: Story = {
  render: () => <Faq />,
}

/** Reduced motion: panels open and close instantly. */
export const ReducedMotion: Story = {
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <Filters {...args} />
    </YoujProvider>
  ),
}
