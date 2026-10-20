'use client'

import { Checkbox, Field, FieldContent, FieldDescription, FieldLabel, FieldLegend, FieldSet, FieldTitle } from '@youj/react'

const ENVIRONMENTS = [
  { id: 'production', title: 'Production', description: 'youj.io and every production alias.', checked: true },
  { id: 'preview', title: 'Preview', description: 'Branch and pull request deployments.', checked: true },
  { id: 'development', title: 'Development', description: 'Pulled by the CLI for local runs.' },
]

export default function CheckboxCards() {
  return (
    <FieldSet className="w-full max-w-xl">
      <FieldLegend variant="label">Environments</FieldLegend>
      <FieldDescription>Where DATABASE_URL is available. Changes apply to the next deployment.</FieldDescription>
      <div className="grid gap-2.5 sm:grid-cols-3">
        {ENVIRONMENTS.map((env) => (
          // A FieldLabel around a Field makes a choice card: the whole card is the target and carries the focus ring.
          <FieldLabel key={env.id}>
            <Field orientation="horizontal" name={env.id}>
              <FieldContent>
                <FieldTitle>{env.title}</FieldTitle>
                <FieldDescription>{env.description}</FieldDescription>
              </FieldContent>
              <Checkbox defaultChecked={env.checked} />
            </Field>
          </FieldLabel>
        ))}
      </div>
    </FieldSet>
  )
}
