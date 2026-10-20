'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, Field, FieldDescription, FieldLabel } from '@youj/react'
import { Combobox, type ComboboxOption } from '@youj/react/command'

const PEOPLE = [
  { id: 'ada', name: 'Ada Lovelace', team: 'Engineering' },
  { id: 'grace', name: 'Grace Hopper', team: 'Engineering' },
  { id: 'margaret', name: 'Margaret Hamilton', team: 'Engineering' },
  { id: 'alan', name: 'Alan Turing', team: 'Engineering' },
  { id: 'dieter', name: 'Dieter Rams', team: 'Design' },
  { id: 'susan', name: 'Susan Kare', team: 'Design' },
  { id: 'paula', name: 'Paula Scher', team: 'Design' },
  { id: 'katherine', name: 'Katherine Johnson', team: 'Research' },
  { id: 'claude', name: 'Claude Shannon', team: 'Research' },
]

const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')

const OPTIONS: ComboboxOption[] = PEOPLE.map((person) => ({
  value: person.id,
  label: person.name,
  description: `${person.id}@orion.dev`,
  group: person.team,
  icon: (
    <Avatar size="sm" className="size-5">
      <AvatarFallback className="text-[9px]">{initials(person.name)}</AvatarFallback>
    </Avatar>
  ),
}))

export default function ComboboxDemo() {
  const [owner, setOwner] = useState<string | null>('grace')

  return (
    <Field className="w-full max-w-xs">
      <FieldLabel>Owner</FieldLabel>
      <Combobox
        options={OPTIONS}
        value={owner}
        onValueChange={setOwner}
        placeholder="Assign an owner"
        searchPlaceholder="Search people…"
        emptyMessage="Nobody matches."
        clearable
      />
      <FieldDescription>Gets deploy alerts and approves production releases.</FieldDescription>
    </Field>
  )
}
