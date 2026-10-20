'use client'

import { Checkbox, Field, FieldLabel } from '@youj/react'

export default function CheckboxStates() {
  return (
    <div className="grid w-full max-w-lg grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
      <Field orientation="horizontal">
        <Checkbox />
        <FieldLabel>Unchecked</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <Checkbox defaultChecked />
        <FieldLabel>Checked</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <Checkbox indeterminate />
        <FieldLabel>Mixed</FieldLabel>
      </Field>
      {/* A Field marked invalid reaches the control, which draws its box in the danger color. */}
      <Field orientation="horizontal" invalid>
        <Checkbox />
        <FieldLabel>Invalid</FieldLabel>
      </Field>
      <Field orientation="horizontal" disabled>
        <Checkbox />
        <FieldLabel>Disabled</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <Checkbox readOnly defaultChecked />
        <FieldLabel>Read-only</FieldLabel>
      </Field>
    </div>
  )
}
