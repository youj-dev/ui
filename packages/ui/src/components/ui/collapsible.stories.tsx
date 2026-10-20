import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { FileCodeIcon, FolderIcon } from '@youj/icons'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Button } from './button'
import { Collapsible, CollapsibleChevron, CollapsibleContent, CollapsibleTrigger } from './collapsible'
import { Field, FieldDescription, FieldLabel } from './field'
import { Input } from './input'
import { Switch } from './switch'

const meta: Meta<typeof Collapsible> = {
  title: 'UI/Layout/Collapsible',
  component: Collapsible,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Base UI collapsible: a trigger with aria-expanded / aria-controls and a panel that wears motion\'s yj-collapse preset (height to the measured size, then auto, with the content fading; a reversal mid-way continues from where it is). `CollapsibleChevron` is youj\'s ChevronDownIcon turned over by its `active` state; it reads the nearest trigger\'s aria-expanded, so it works inside any disclosure, including triggers composed through `render`. Keep focus rings inside the panel\'s padding: it clips while it moves.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Collapsible>

function DeploySettings() {
  return (
    <div className="flex w-full max-w-[480px] flex-col gap-4 rounded-xl border border-line bg-surface p-5">
      <Field>
        <FieldLabel>Build command</FieldLabel>
        <Input defaultValue="pnpm build" className="font-mono" />
      </Field>
      <Collapsible>
        <CollapsibleTrigger render={<Button variant="ghost" size="sm" className="-ms-2.5" />}>
          Advanced
          <CollapsibleChevron />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col gap-4 pt-3">
            <Field>
              <FieldLabel>Output directory</FieldLabel>
              <Input defaultValue=".next" className="font-mono" />
              <FieldDescription>Relative to the project root.</FieldDescription>
            </Field>
            <Field orientation="horizontal">
              <Switch defaultChecked />
              <FieldLabel>Skip builds when nothing changed</FieldLabel>
            </Field>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

/** Advanced build settings behind a disclosure. The button is a Collapsible trigger composed through `render`; the chevron follows it. */
export const Hero: Story = {
  render: () => <DeploySettings />,
}

const FILES = ['page.tsx', 'layout.tsx', 'pricing-grid.tsx', 'checkout-button.tsx', 'use-subscription.ts', 'stripe.server.ts', 'plans.json']

/** "Show more": the list grows by its hidden rows and the button's label and chevron follow the state. */
export const ShowMore: Story = {
  render: () => {
    function Files() {
      const [open, setOpen] = useState(false)
      const row = (f: string) => (
        <li key={f} className="flex items-center gap-2.5 px-3 py-2 text-ui text-fg">
          <FileCodeIcon className="size-4 text-fg-muted" />
          <span className="font-mono text-ui-sm">{f}</span>
        </li>
      )
      return (
        <Collapsible open={open} onOpenChange={setOpen} className="w-full max-w-[420px] rounded-xl border border-line bg-surface">
          <div className="flex items-center gap-2 border-b border-line px-3 py-2.5 text-ui font-medium text-fg">
            <FolderIcon className="size-4 text-fg-muted" />
            app/(marketing)/pricing
          </div>
          <ul className="divide-y divide-line">{FILES.slice(0, 3).map(row)}</ul>
          <CollapsibleContent>
            <ul className="divide-y divide-line border-t border-line">{FILES.slice(3).map(row)}</ul>
          </CollapsibleContent>
          <div className="border-t border-line p-1.5">
            <CollapsibleTrigger render={<Button variant="ghost" size="sm" className="w-full" />}>
              {open ? 'Show less' : `Show ${FILES.length - 3} more`}
              <CollapsibleChevron />
            </CollapsibleTrigger>
          </div>
        </Collapsible>
      )
    }
    return <Files />
  },
}

/** Reduced motion: the panel opens and closes at once, and the chevron flips without turning. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <DeploySettings />
    </YoujProvider>
  ),
}
