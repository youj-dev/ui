'use client'

import { Checkbox, Field, FieldContent, FieldDescription, FieldLabel, FieldLegend, FieldSet, FieldTitle } from '@youj/react'

const FEATURES = [
  { id: 'comments', title: 'Preview comments', description: 'Reviewers leave notes right on a preview deployment.', on: true },
  { id: 'insights', title: 'Speed Insights', description: 'Real-user Core Web Vitals for every route.' },
  { id: 'analytics', title: 'Web Analytics', description: 'Privacy-friendly traffic, with no cookie banner.', on: true },
]

export default function FieldChoices() {
  return (
    <FieldSet className="w-full max-w-md">
      <FieldLegend variant="label">Enable for youj-web</FieldLegend>
      <FieldDescription>You can change these per project later.</FieldDescription>
      <div className="flex flex-col gap-2">
        {FEATURES.map((feature) => (
          // A FieldLabel around a whole Field becomes a choice card: the card is the target and carries the focus ring.
          <FieldLabel key={feature.id}>
            <Field orientation="horizontal">
              <Checkbox defaultChecked={feature.on} />
              <FieldContent>
                <FieldTitle>{feature.title}</FieldTitle>
                <FieldDescription>{feature.description}</FieldDescription>
              </FieldContent>
            </Field>
          </FieldLabel>
        ))}
      </div>
    </FieldSet>
  )
}
