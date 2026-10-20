'use client'

import { Field, FieldLabel, Switch } from '@youj/react'

export default function SwitchLiquidSizes() {
  return (
    <div className="grid w-full max-w-md grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
      <Field orientation="horizontal">
        <Switch variant="liquid" size="sm" defaultChecked />
        <FieldLabel>Small</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <Switch variant="liquid" defaultChecked />
        <FieldLabel>Default</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <Switch variant="liquid" size="lg" defaultChecked />
        <FieldLabel>Large</FieldLabel>
      </Field>
      <Field orientation="horizontal" disabled>
        <Switch variant="liquid" defaultChecked />
        <FieldLabel>Disabled</FieldLabel>
      </Field>
    </div>
  )
}
