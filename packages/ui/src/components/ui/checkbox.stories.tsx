import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Specimen } from '../../stories/kit'
import { Checkbox } from './checkbox'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldLegend, FieldSet } from './field'
import { Label } from './label'

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Primitives/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Base UI checkbox. The check is youj\'s CheckIcon: every tick replays its draw-in (an emphasized stroke, then the settle spring, the one allowed overshoot, since a tick is a small arrival). An untick fades the glyph on the instant token while the box drains on fast; the indicator stays mounted so a reversal mid-draw never jumps. Mixed state draws a dash and reports aria-checked="mixed". The 16px box has a 24px hit area (40px on touch) and a boundary that clears 3:1. Space toggles; Enter submits the form, as natively. Reduced motion: instant check, no press scale.',
      },
    },
  },
  args: { defaultChecked: true },
}
export default meta
type Story = StoryObj<typeof Checkbox>

const topics = [
  { id: 'mentions', label: 'Mentions', desc: 'When someone @mentions you or replies to your thread.' },
  { id: 'deploys', label: 'Deployments', desc: 'Failed and promoted production deployments.' },
  { id: 'billing', label: 'Billing', desc: 'Invoices, usage alerts and plan changes.' },
]

function EmailPreferences() {
  const [on, setOn] = useState<string[]>(['mentions', 'deploys'])
  const all = on.length === topics.length
  const some = on.length > 0 && !all
  return (
    <FieldSet className="w-full max-w-[420px] gap-4">
      <FieldLegend>Email notifications</FieldLegend>
      <Field orientation="horizontal" className="border-b border-line pb-4">
        <Checkbox
          checked={all}
          indeterminate={some}
          onCheckedChange={(next) => setOn(next ? topics.map((t) => t.id) : [])}
        />
        <FieldLabel>Everything</FieldLabel>
      </Field>
      {topics.map((t) => (
        <Field key={t.id} orientation="horizontal">
          <Checkbox
            checked={on.includes(t.id)}
            onCheckedChange={(next) => setOn((cur) => (next ? [...cur, t.id] : cur.filter((x) => x !== t.id)))}
          />
          <FieldContent>
            <FieldLabel>{t.label}</FieldLabel>
            <FieldDescription>{t.desc}</FieldDescription>
          </FieldContent>
        </Field>
      ))}
    </FieldSet>
  )
}

/** Tick and untick fast: every tick redraws from zero, reversals never jump. "Everything" is tri-state. */
export const Hero: Story = {
  render: () => <EmailPreferences />,
}

export const Playground: Story = {
  render: (args) => (
    <div className="flex items-center gap-2.5">
      <Checkbox id="cb-playground" {...args} />
      <Label htmlFor="cb-playground">Remember this device</Label>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-x-10 gap-y-6">
      <Specimen label="unchecked">
        <Checkbox aria-label="Unchecked" />
      </Specimen>
      <Specimen label="checked">
        <Checkbox aria-label="Checked" defaultChecked />
      </Specimen>
      <Specimen label="indeterminate">
        <Checkbox aria-label="Indeterminate" indeterminate />
      </Specimen>
      <Specimen label="invalid">
        <Checkbox aria-label="Invalid" aria-invalid />
      </Specimen>
      <Specimen label="disabled">
        <Checkbox aria-label="Disabled" disabled />
      </Specimen>
      <Specimen label="disabled checked">
        <Checkbox aria-label="Disabled checked" disabled defaultChecked />
      </Specimen>
      <Specimen label="read-only checked">
        <Checkbox aria-label="Read only" readOnly defaultChecked />
      </Specimen>
    </div>
  ),
}

/** Reduced motion: the check appears whole and the box does not squeeze. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <EmailPreferences />
    </YoujProvider>
  ),
}
