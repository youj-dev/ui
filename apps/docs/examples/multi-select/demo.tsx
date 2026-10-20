'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, Field, FieldDescription, FieldLabel } from '@youj/react'
import { MultiSelect, type MultiSelectOption } from '@youj/react/command'

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

const OPTIONS: MultiSelectOption[] = PEOPLE.map((person) => ({
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

export default function MultiSelectDemo() {
  const [members, setMembers] = useState(['ada', 'dieter', 'grace'])

  return (
    <Field className="w-full max-w-sm">
      <FieldLabel>Members</FieldLabel>
      <MultiSelect
        options={OPTIONS}
        value={members}
        onValueChange={setMembers}
        placeholder="Add members"
        searchPlaceholder="Search people…"
        emptyMessage="Nobody matches."
      />
      <FieldDescription>Members can deploy previews. Owners approve production.</FieldDescription>
    </Field>
  )
}
