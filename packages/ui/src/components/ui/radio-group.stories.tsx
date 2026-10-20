import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Badge } from './badge'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldLegend, FieldSet, FieldTitle } from './field'
import { RadioGroup, RadioGroupItem } from './radio-group'

const meta: Meta<typeof RadioGroup> = {
  title: 'UI/Primitives/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Base UI radio group: one tab stop, arrow keys move the selection (and wrap), Space selects. The dot grows in on the enter curve as the previous one shrinks out on the exit curve, both on the fast token, and a reversal mid-way picks up from the current scale. Wrap a Field in a FieldLabel for choice cards: the whole card is the target, it tints when chosen, and it carries the focus ring. Reduced motion: the dot appears without scaling.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof RadioGroup>

const plans = [
  { value: 'hobby', title: 'Hobby', price: '$0', desc: 'For side projects. One member, community support.' },
  { value: 'pro', title: 'Pro', price: '$20', desc: 'For teams shipping every day. Previews, analytics, priority support.', badge: 'Popular' },
  { value: 'enterprise', title: 'Enterprise', price: 'Custom', desc: 'SSO, audit logs, SLAs and a named contact.' },
]

function PlanPicker() {
  return (
    <FieldSet className="w-full max-w-[440px]">
      <FieldLegend>Plan</FieldLegend>
      <FieldDescription>Change or cancel any time. Prorated to the day.</FieldDescription>
      <RadioGroup defaultValue="pro" name="plan">
        {plans.map((p) => (
          <FieldLabel key={p.value}>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>
                  {p.title}
                  {p.badge && <Badge>{p.badge}</Badge>}
                </FieldTitle>
                <FieldDescription>{p.desc}</FieldDescription>
              </FieldContent>
              <span className="text-ui font-medium text-fg tabular-nums">{p.price}</span>
              <RadioGroupItem value={p.value} />
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
    </FieldSet>
  )
}

/** Choice cards: click anywhere on a card, or tab in and use the arrow keys. */
export const Hero: Story = {
  render: () => <PlanPicker />,
}

/** The plain list shape, with a disabled option. */
export const Default: Story = {
  render: () => (
    <FieldSet className="w-72">
      <FieldLegend variant="label">Density</FieldLegend>
      <RadioGroup defaultValue="comfortable">
        {[
          { v: 'comfortable', l: 'Comfortable' },
          { v: 'compact', l: 'Compact' },
          { v: 'spacious', l: 'Spacious (coming soon)', disabled: true },
        ].map((o) => (
          <Field key={o.v} orientation="horizontal">
            <RadioGroupItem value={o.v} disabled={o.disabled} />
            <FieldLabel>{o.l}</FieldLabel>
          </Field>
        ))}
      </RadioGroup>
    </FieldSet>
  ),
}

export const States: Story = {
  render: () => (
    <RadioGroup defaultValue="b" className="w-auto grid-cols-2 gap-x-8 gap-y-3 sm:grid-flow-col sm:grid-cols-none" aria-label="States">
      {[
        ['a', 'unchecked'],
        ['b', 'checked'],
      ].map(([v, l]) => (
        <Field key={v} orientation="horizontal">
          <RadioGroupItem value={v!} />
          <FieldLabel>{l}</FieldLabel>
        </Field>
      ))}
      <Field orientation="horizontal">
        <RadioGroupItem value="c" disabled />
        <FieldLabel>disabled</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <RadioGroupItem value="d" aria-invalid />
        <FieldLabel>invalid</FieldLabel>
      </Field>
    </RadioGroup>
  ),
}

export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <PlanPicker />
    </YoujProvider>
  ),
}
