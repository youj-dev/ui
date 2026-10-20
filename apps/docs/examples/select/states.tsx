'use client'

import { Field, FieldError, FieldLabel, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@youj/react'

const ROLES = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'billing', label: 'Billing (Enterprise)', disabled: true },
]

function RoleOptions() {
  return ROLES.map((role) => (
    <SelectItem key={role.value} value={role.value} disabled={role.disabled}>
      {role.label}
    </SelectItem>
  ))
}

export default function SelectStates() {
  return (
    <div className="grid w-full max-w-xl gap-x-6 gap-y-5 sm:grid-cols-2">
      <Field>
        <FieldLabel>Placeholder</FieldLabel>
        <Select items={ROLES}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a role" />
          </SelectTrigger>
          <SelectContent>
            <RoleOptions />
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel>Small, as a dropdown</FieldLabel>
        {/* alignItemWithTrigger={false} opens below the trigger instead of over it. */}
        <Select items={ROLES} defaultValue="member">
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <RoleOptions />
          </SelectContent>
        </Select>
      </Field>
      <Field disabled>
        <FieldLabel>Disabled</FieldLabel>
        <Select items={ROLES} defaultValue="owner">
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <RoleOptions />
          </SelectContent>
        </Select>
      </Field>
      <Field invalid>
        <FieldLabel>Invalid</FieldLabel>
        <Select items={ROLES}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a role" />
          </SelectTrigger>
          <SelectContent>
            <RoleOptions />
          </SelectContent>
        </Select>
        <FieldError>Pick a role before you send the invite.</FieldError>
      </Field>
    </div>
  )
}
