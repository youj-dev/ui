'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FieldGroup, TagInput, TimePicker } from '@youj/react'
import { Combobox } from '@youj/react/command'
import { DatePicker } from '@youj/react/date'
import { Form, FormField, FormSelect, FormSubmit } from '@youj/react/form'

const OWNERS = [
  { value: 'ada', label: 'Ada Lovelace', description: 'ada@orion.dev' },
  { value: 'grace', label: 'Grace Hopper', description: 'grace@orion.dev' },
  { value: 'dieter', label: 'Dieter Rams', description: 'dieter@orion.dev' },
  { value: 'susan', label: 'Susan Kare', description: 'susan@orion.dev' },
]

const REGIONS = [
  { value: 'fra', label: 'Frankfurt' },
  { value: 'iad', label: 'Washington, D.C.' },
  { value: 'sin', label: 'Singapore' },
]

// The pickers hold null while empty, so each required one refines it away.
const schema = z.object({
  owner: z
    .string()
    .nullable()
    .refine((v) => v !== null, 'Someone has to own the launch.'),
  region: z
    .string()
    .nullable()
    .refine((v) => v !== null, 'Pick where it launches.'),
  launch: z
    .date()
    .nullable()
    .refine((v) => v !== null, 'Pick a launch date.'),
  time: z
    .string()
    .nullable()
    .refine((v) => v !== null, 'Pick a time.'),
  labels: z.array(z.string()).min(1, 'Add at least one label.'),
})

type Values = z.input<typeof schema>

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function FormPickers() {
  const form = useForm<Values, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { owner: null, region: null, launch: null, time: '10:00', labels: [] },
    mode: 'onTouched',
  })

  return (
    <Form form={form} onSubmit={() => wait(900)} className="w-full max-w-sm">
      <FieldGroup>
        <FormField name="owner" label="Owner" required>
          {(field) => (
            <Combobox
              ref={field.ref}
              options={OWNERS}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="Assign an owner"
            />
          )}
        </FormField>
        <FormSelect name="region" label="Region" options={REGIONS} placeholder="Choose a region" required />
        <div className="grid grid-cols-[minmax(0,1fr)_8.5rem] gap-3">
          <FormField name="launch" label="Launch" required>
            {(field) => (
              <DatePicker
                ref={field.ref}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                minDate={new Date()}
              />
            )}
          </FormField>
          <FormField name="time" label="At" required>
            {(field) => (
              <TimePicker
                ref={field.ref}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                step={15}
                hourCycle={12}
                locale="en-US"
              />
            )}
          </FormField>
        </div>
        <FormField name="labels" label="Labels" required>
          {(field) => (
            <TagInput ref={field.ref} value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} placeholder="Add a label…" />
          )}
        </FormField>
        <div className="flex justify-end">
          <FormSubmit pendingLabel="Scheduling…" successLabel="Scheduled">
            Schedule launch
          </FormSubmit>
        </div>
      </FieldGroup>
    </Form>
  )
}
