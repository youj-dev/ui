'use client'

import { useState } from 'react'
import { Field, FieldDescription, FieldLabel } from '@youj/react'
import { Combobox, type ComboboxOption } from '@youj/react/command'

const FRAMEWORKS: ComboboxOption[] = [
  { value: 'next', label: 'Next.js' },
  { value: 'remix', label: 'Remix' },
  { value: 'astro', label: 'Astro' },
  { value: 'sveltekit', label: 'SvelteKit' },
  { value: 'nuxt', label: 'Nuxt' },
  { value: 'vite', label: 'Vite (static)' },
]

export default function ComboboxCreate() {
  const [options, setOptions] = useState(FRAMEWORKS)
  const [value, setValue] = useState<string | null>(null)

  return (
    <Field className="w-full max-w-xs">
      <FieldLabel>Framework</FieldLabel>
      <Combobox
        options={options}
        value={value}
        onValueChange={setValue}
        placeholder="Pick a framework"
        searchPlaceholder="Search or create…"
        onCreate={(label) => {
          const option = { value: label.toLowerCase().replace(/\W+/g, '-'), label }
          setOptions((current) => [...current, option])
          return option
        }}
      />
      <FieldDescription>Type one that isn’t listed to add it.</FieldDescription>
    </Field>
  )
}
