'use client'

import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, Input, Switch } from '@youj/react'

export default function FieldOrientation() {
  return (
    <FieldGroup className="w-full max-w-lg gap-0 divide-y divide-line rounded-xl border border-line bg-surface">
      {/* horizontal: what it does on one side, the control on the other. */}
      <Field orientation="horizontal" className="px-4 py-3.5">
        <FieldContent>
          <FieldLabel>Failed deploy alerts</FieldLabel>
          <FieldDescription>Email the team when a production deploy fails.</FieldDescription>
        </FieldContent>
        <Switch defaultChecked />
      </Field>
      <Field orientation="horizontal" className="px-4 py-3.5">
        <FieldContent>
          <FieldLabel>Weekly summary</FieldLabel>
          <FieldDescription>A Monday digest of traffic, builds and spend.</FieldDescription>
        </FieldContent>
        <Switch />
      </Field>
      {/* responsive: stacked in a narrow group, side by side once the group is wide enough. */}
      <Field orientation="responsive" className="px-4 py-3.5">
        <FieldContent>
          <FieldLabel>Alert address</FieldLabel>
          <FieldDescription>A shared inbox works best.</FieldDescription>
        </FieldContent>
        <Input type="email" defaultValue="oncall@youj.dev" className="@md/field-group:max-w-56" />
      </Field>
    </FieldGroup>
  )
}
