import type { Meta, StoryObj } from '@storybook/react-vite'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from './button'
import { FieldGroup } from './field'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, FormSubmit } from './form'
import { Input } from './input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from './input-group'

const meta: Meta<typeof Form> = {
  title: 'UI/Inputs/Form',
  component: Form,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'react-hook-form (with any resolver, zod here) wired into Field and AsyncButton, with shadcn’s part names (FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage). FormField’s shorthand labels, describes and marks its control, and its error grows in and out (Collapse). FormSubmit is an AsyncButton: it validates, then runs `onSubmit` through spinner → drawn check, or shakes to “Check the form” (invalid) or `errorLabel` (the submit failed). Enter in a field presses it; a second press while pending is ignored. An invalid submit focuses the first invalid control in document order and scrolls it into view (at once under reduced motion). The composed example is UI/Examples/Form.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Form>

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const schema = z.object({
  name: z.string().trim().min(3, 'Use at least 3 characters.').max(32, 'Keep it under 32 characters.'),
  slug: z
    .string()
    .trim()
    .min(1, 'Choose a URL.')
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only.'),
})
type Values = z.infer<typeof schema>

function RenameProject({ failWith }: { failWith?: 'taken' | 'network' }) {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: 'Orion', slug: 'orion' }, mode: 'onTouched' })
  return (
    <Form
      form={form}
      className="w-full max-w-96"
      onSubmit={async (values) => {
        await wait(900)
        if (failWith === 'taken' || values.slug === 'taken') {
          form.setError('slug', { message: 'orion.dev/taken is already in use.' })
          throw new Error('taken')
        }
        if (failWith === 'network') throw new Error('network')
      }}
    >
      <FieldGroup>
        <FormField name="name" label="Project name" required>
          {(field) => <Input {...field} autoComplete="off" />}
        </FormField>
        <FormField name="slug" label="URL" description="Type “taken” to see a server-side error." required>
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

/** Clear the name and press Save: the error grows in, focus lands on the field, and the button shakes to “Check the form”. */
export const Default: Story = { render: () => <RenameProject /> }

/** The submit fails with a field error from the “server”: the message appears on the field and focus moves there. */
export const ServerFieldError: Story = { render: () => <RenameProject failWith="taken" /> }

/** The submit fails outright: the button shakes to its error label and returns. */
export const SubmitFails: Story = { render: () => <RenameProject failWith="network" /> }

function ShadcnParts() {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: '', slug: 'orion' }, mode: 'onTouched' })
  return (
    <Form form={form} className="w-full max-w-96" onSubmit={() => wait(900)}>
      <FieldGroup>
        <FormField
          name="name"
          render={({ field }) => (
            <FormItem required>
              <FormLabel>Project name</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" />
              </FormControl>
              <FormDescription>Shown on the dashboard.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormSubmit successLabel="Saved">Save</FormSubmit>
      </FieldGroup>
    </Form>
  )
}

/** shadcn's parts: `render` on FormField, then FormItem, FormLabel, FormControl, FormDescription and FormMessage in your order. */
export const ShadcnPartsStory: Story = { name: 'Shadcn parts', render: () => <ShadcnParts /> }
