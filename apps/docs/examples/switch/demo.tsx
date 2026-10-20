'use client'

import { useState } from 'react'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, Switch } from '@youj/react'

const SETTINGS = [
  { id: 'previews', label: 'Preview deployments', description: 'Build every pull request on its own URL.', on: true },
  { id: 'protection', label: 'Deployment protection', description: 'Ask visitors to sign in before they see a preview.', on: true },
  { id: 'cache', label: 'Build cache', description: 'Reuse dependencies and outputs between builds.', on: true },
  { id: 'insights', label: 'Speed Insights', description: 'Collect Core Web Vitals from real visitors.', on: false },
]

export default function SwitchDemo() {
  const [state, setState] = useState(() => Object.fromEntries(SETTINGS.map((s) => [s.id, s.on])))

  return (
    <FieldGroup className="w-full max-w-md gap-0 divide-y divide-line rounded-xl border border-line bg-surface">
      {SETTINGS.map((setting) => (
        <Field key={setting.id} orientation="horizontal" className="px-4 py-3.5">
          <FieldContent>
            <FieldLabel>{setting.label}</FieldLabel>
            <FieldDescription>{setting.description}</FieldDescription>
          </FieldContent>
          <Switch checked={state[setting.id]} onCheckedChange={(next) => setState((s) => ({ ...s, [setting.id]: next }))} />
        </Field>
      ))}
    </FieldGroup>
  )
}
