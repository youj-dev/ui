'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Button,
  FieldGroup,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@youj/react'
import { Form, FormField, FormSubmit } from '@youj/react/form'

const schema = z.object({
  name: z.string().trim().min(3, 'Use at least 3 characters.').max(32, 'Keep it under 32 characters.'),
  slug: z
    .string()
    .trim()
    .min(1, 'Choose a URL.')
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only.'),
})

type Values = z.infer<typeof schema>

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function FormDemo() {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: 'Orion', slug: 'orion' },
    mode: 'onTouched',
  })

  async function save(values: Values) {
    await wait(900)
    // The server has the last word: a taken URL comes back as a field error.
    if (values.slug === 'taken') {
      form.setError('slug', { message: 'orion.dev/taken is already in use.' })
      throw new Error('Slug taken')
    }
  }

  return (
    <Form form={form} onSubmit={save} className="w-full max-w-sm">
      <FieldGroup>
        <FormField name="name" label="Project name" required>
          {(field) => <Input {...field} autoComplete="off" />}
        </FormField>
        <FormField name="slug" label="URL" description="Try “taken” for an error from the server." required>
          {(field) => (
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>orion.dev/</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput {...field} autoComplete="off" />
            </InputGroup>
          )}
        </FormField>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={() => form.reset()}>
            Reset
          </Button>
          <FormSubmit pendingLabel="Saving…" successLabel="Saved" errorLabel="Couldn’t save">
            Save changes
          </FormSubmit>
        </div>
      </FieldGroup>
    </Form>
  )
}
