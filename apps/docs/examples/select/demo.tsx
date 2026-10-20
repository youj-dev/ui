'use client'

import {
  Field,
  FieldDescription,
  FieldLabel,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@youj/react'

const REGIONS = {
  Americas: [
    { value: 'iad1', label: 'Washington, D.C.' },
    { value: 'sfo1', label: 'San Francisco' },
    { value: 'gru1', label: 'São Paulo' },
  ],
  Europe: [
    { value: 'fra1', label: 'Frankfurt' },
    { value: 'cdg1', label: 'Paris' },
    { value: 'arn1', label: 'Stockholm' },
  ],
  'Asia Pacific': [
    { value: 'hnd1', label: 'Tokyo' },
    { value: 'sin1', label: 'Singapore' },
    { value: 'syd1', label: 'Sydney' },
  ],
}

// Lets the trigger show "Frankfurt" for fra1 before the popup has ever opened.
const items = Object.fromEntries(Object.values(REGIONS).flat().map((region) => [region.value, region.label]))

export default function SelectDemo() {
  return (
    <Field className="w-full max-w-xs">
      <FieldLabel>Function region</FieldLabel>
      <Select items={items} defaultValue="fra1" name="region">
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(REGIONS).map(([group, regions], index) => (
            <SelectGroup key={group}>
              {index > 0 && <SelectSeparator />}
              <SelectLabel>{group}</SelectLabel>
              {regions.map((region) => (
                <SelectItem key={region.value} value={region.value}>
                  {/* The space keeps the option's name "Frankfurt fra1", not "Frankfurtfra1". */}
                  {region.label}{' '}
                  <span className="ms-auto font-mono text-ui-xs text-fg-muted">{region.value}</span>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      <FieldDescription>Closest to your database. Changing it redeploys.</FieldDescription>
    </Field>
  )
}
