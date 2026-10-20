'use client'

import { Field, FieldLabel, Switch } from '@youj/react'

export default function SwitchSizes() {
  return (
    <div className="grid w-full max-w-md grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
      <Field orientation="horizontal">
        <Switch defaultChecked />
        <FieldLabel>Default</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <Switch size="sm" defaultChecked />
        <FieldLabel>Small, for dense rows</FieldLabel>
      </Field>
      <Field orientation="horizontal" disabled>
        <Switch defaultChecked />
        <FieldLabel>Disabled</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <Switch readOnly defaultChecked />
        <FieldLabel>Read-only</FieldLabel>
      </Field>
    </div>
  )
}
