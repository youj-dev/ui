'use client'

import {
  Badge,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
  RadioGroup,
  RadioGroupItem,
} from '@youj/react'

const PLANS = [
  { value: 'hobby', title: 'Hobby', price: '$0', description: 'Side projects. One member and community support.' },
  { value: 'pro', title: 'Pro', price: '$20', description: 'Teams that ship daily. Previews, analytics and priority support.', popular: true },
  { value: 'enterprise', title: 'Enterprise', price: 'Custom', description: 'SSO, audit logs, an uptime SLA and a named contact.' },
]

export default function RadioGroupDemo() {
  return (
    <FieldSet className="w-full max-w-md">
      <FieldLegend>Plan</FieldLegend>
      <FieldDescription>Change or cancel at any time. Billing is prorated to the day.</FieldDescription>
      <RadioGroup defaultValue="pro" name="plan">
        {PLANS.map((plan) => (
          // A FieldLabel around a Field makes the whole card the target.
          <FieldLabel key={plan.value}>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>
                  {plan.title}
                  {plan.popular && <Badge>Popular</Badge>}
                </FieldTitle>
                <FieldDescription>{plan.description}</FieldDescription>
              </FieldContent>
              <span className="text-ui font-medium text-fg tabular-nums">{plan.price}</span>
              <RadioGroupItem value={plan.value} />
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
    </FieldSet>
  )
}
