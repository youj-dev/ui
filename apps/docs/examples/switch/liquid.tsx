'use client'

import { useState } from 'react'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, Switch } from '@youj/react'

const SETTINGS = [
  { id: 'focus', label: 'Focus mode', description: 'Hold notifications until you finish.', on: true },
  { id: 'power', label: 'Low power mode', description: 'Pause background sync and dim the screen.', on: false },
  { id: 'nearby', label: 'Share with nearby', description: 'Let people around you send you files.', on: true },
]

export default function SwitchLiquid() {
  const [state, setState] = useState(() => Object.fromEntries(SETTINGS.map((s) => [s.id, s.on])))

  return (
    <FieldGroup className="w-full max-w-md gap-0 divide-y divide-line rounded-xl border border-line bg-surface">
      {SETTINGS.map((setting) => (
        <Field key={setting.id} orientation="horizontal" className="px-4 py-3.5">
          <FieldContent>
            <FieldLabel>{setting.label}</FieldLabel>
            <FieldDescription>{setting.description}</FieldDescription>
          </FieldContent>
          <Switch variant="liquid" checked={state[setting.id]} onCheckedChange={(next) => setState((s) => ({ ...s, [setting.id]: next }))} />
        </Field>
      ))}
    </FieldGroup>
  )
}
