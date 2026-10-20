import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Combobox } from './combobox'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, FormSelect, FormSubmit, useFormField } from './form'
import { Input } from './input'

const schema = z.object({
  name: z.string().trim().min(3, 'Use at least 3 characters.'),
  framework: z
    .string()
    .nullable()
    .refine((v) => v !== null, 'Pick a framework.'),
})
type Values = z.input<typeof schema>

function Project({
  onSubmit = async () => {},
  defaults = { name: '', framework: null },
}: {
  onSubmit?: (values: z.output<typeof schema>, form: ReturnType<typeof useForm<Values, unknown, z.output<typeof schema>>>) => unknown
  defaults?: Values
}) {
  const form = useForm<Values, unknown, z.output<typeof schema>>({ resolver: zodResolver(schema), defaultValues: defaults })
  return (
    <Form form={form} onSubmit={(values) => onSubmit(values, form)}>
      <FormField name="name" label="Project name" description="Shown on the dashboard." required>
        {(field) => <Input {...field} />}
      </FormField>
      <FormField name="framework" label="Framework" required>
        {(field) => (
          <Combobox
            ref={field.ref}
            options={[
              { value: 'next', label: 'Next.js' },
              { value: 'astro', label: 'Astro' },
            ]}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      </FormField>
      <FormSubmit pendingLabel="Creating…" successLabel="Created" errorLabel="Couldn’t create">
        Create
      </FormSubmit>
    </Form>
  )
}

const name = () => screen.getByRole('textbox', { name: /Project name/ })
const framework = () => screen.getByRole('combobox', { name: /Framework/ })
const submit = () => screen.getByRole('button', { name: /Create|Check the form|Created|Couldn’t create|Creating/ })

describe('Form', () => {
  test('FormField labels, describes and requires its control', () => {
    render(<Project />)
    expect(name()).toHaveAccessibleDescription('Shown on the dashboard.')
    expect(name()).toBeRequired()
    expect(framework()).toHaveAttribute('aria-required', 'true')
  })

  test('an invalid submit shows each error, marks the controls, focuses the first and says “Check the form”', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<Project onSubmit={onSubmit} />)
    await user.click(submit())
    expect(await screen.findByText('Use at least 3 characters.')).toHaveAttribute('role', 'alert')
    expect(screen.getByText('Pick a framework.')).toBeInTheDocument()
    expect(name()).toHaveAttribute('aria-invalid', 'true')
    expect(framework()).toHaveAttribute('aria-invalid', 'true')
    await waitFor(() => expect(name()).toHaveFocus())
    expect(await screen.findByRole('button', { name: /Check the form/ })).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  test('focus goes to the first invalid control in document order', async () => {
    const user = userEvent.setup()
    render(<Project defaults={{ name: 'Orion', framework: null }} />)
    await user.click(submit())
    await waitFor(() => expect(framework()).toHaveFocus())
  })

  test('a valid submit runs onSubmit with parsed values, through pending to success', async () => {
    const user = userEvent.setup()
    let finish = () => {}
    const onSubmit = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)))
    render(<Project onSubmit={onSubmit} defaults={{ name: '  Orion ', framework: 'astro' }} />)
    await user.click(submit())
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'Orion', framework: 'astro' }, expect.anything()))
    expect(submit()).toHaveAttribute('aria-busy', 'true')
    // A second press while pending is ignored.
    await user.click(submit())
    finish()
    expect(await screen.findByRole('button', { name: /Created/ })).toBeInTheDocument()
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  test('Enter in a field submits through the button', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<Project onSubmit={onSubmit} defaults={{ name: '', framework: 'next' }} />)
    await user.type(name(), 'Vega{Enter}')
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(await screen.findByRole('button', { name: /Created/ })).toBeInTheDocument()
  })

  test('a server-side field error lands on its field and takes focus; the button shows errorLabel', async () => {
    const user = userEvent.setup()
    render(
      <Project
        defaults={{ name: 'Orion', framework: 'next' }}
        onSubmit={(_values, form) => {
          form.setError('name', { message: 'That name is taken.' })
          throw new Error('taken')
        }}
      />,
    )
    await user.click(submit())
    expect(await screen.findByText('That name is taken.')).toBeInTheDocument()
    await waitFor(() => expect(name()).toHaveFocus())
    expect(await screen.findByRole('button', { name: /Couldn’t create/ })).toBeInTheDocument()
  })

  test('scrolls the first invalid control into view smoothly, and at once under reduced motion', async () => {
    const user = userEvent.setup()
    const scroll = vi.fn()
    const original = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = scroll
    try {
      const { unmount } = render(<Project />)
      await user.click(submit())
      await waitFor(() => expect(scroll).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' }))
      unmount()
      scroll.mockClear()
      render(
        <YoujProvider reducedMotion="always">
          <Project />
        </YoujProvider>,
      )
      await user.click(submit())
      await waitFor(() => expect(scroll).toHaveBeenCalledWith({ block: 'center', behavior: 'auto' }))
    } finally {
      Element.prototype.scrollIntoView = original
    }
  })

  test('choosing a value clears its error', async () => {
    const user = userEvent.setup()
    render(<Project defaults={{ name: 'Orion', framework: null }} />)
    await user.click(submit())
    expect(await screen.findByText('Pick a framework.')).toBeInTheDocument()
    await user.click(framework())
    await user.click(await screen.findByRole('option', { name: /Astro/ }))
    await waitFor(() => expect(framework()).not.toHaveAttribute('aria-invalid'))
  })

  describe('FormSelect', () => {
    const regionSchema = z.object({
      region: z
        .string()
        .nullable()
        .refine((v) => v !== null, 'Pick a region.'),
    })
    type RegionValues = z.input<typeof regionSchema>

    function Service({ onSubmit = async () => {} }: { onSubmit?: (values: z.output<typeof regionSchema>) => unknown }) {
      const form = useForm<RegionValues, unknown, z.output<typeof regionSchema>>({
        resolver: zodResolver(regionSchema),
        defaultValues: { region: null },
      })
      return (
        <Form form={form} onSubmit={onSubmit}>
          <FormSelect
            name="region"
            label="Region"
            description="Where it runs."
            placeholder="Choose a region"
            required
            options={[
              { value: 'fra', label: 'Frankfurt' },
              { value: 'iad', label: 'Washington' },
              { value: 'sin', label: 'Singapore', disabled: true },
            ]}
          />
          <FormSubmit>Create</FormSubmit>
        </Form>
      )
    }
    const region = () => screen.getByRole('combobox', { name: /Region/ })

    test('labels, describes and requires its trigger, and shows the placeholder while empty', () => {
      render(<Service />)
      expect(region()).toHaveAttribute('aria-required', 'true')
      expect(region()).toHaveAccessibleDescription('Where it runs.')
      expect(region()).toHaveTextContent('Choose a region')
    })

    test('an empty submit marks the trigger invalid and focuses it; choosing clears the error and submits the value', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<Service onSubmit={onSubmit} />)
      await user.click(screen.getByRole('button', { name: 'Create' }))
      expect(await screen.findByText('Pick a region.')).toBeInTheDocument()
      expect(region()).toHaveAttribute('aria-invalid', 'true')
      await waitFor(() => expect(region()).toHaveFocus())
      await user.click(region())
      expect(await screen.findByRole('option', { name: 'Singapore' })).toHaveAttribute('aria-disabled', 'true')
      await user.click(screen.getByRole('option', { name: 'Frankfurt' }))
      await waitFor(() => expect(region()).not.toHaveAttribute('aria-invalid'))
      expect(region()).toHaveTextContent('Frankfurt')
      await user.click(screen.getByRole('button', { name: /Create|Check the form/ }))
      await waitFor(() => expect(onSubmit.mock.calls[0]?.[0]).toEqual({ region: 'fra' }))
    })
  })
  describe("shadcn's parts", () => {
    function Parts({ onSubmit = async () => {} }: { onSubmit?: (values: { name: string }) => unknown }) {
      const form = useForm<{ name: string }>({ resolver: zodResolver(z.object({ name: z.string().min(3, 'Use at least 3 characters.') })), defaultValues: { name: '' } })
      return (
        <Form form={form} onSubmit={onSubmit}>
          <FormField
            name="name"
            render={({ field }) => (
              <FormItem required>
                <FormLabel>Project name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Shown on the dashboard.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormSubmit>Create</FormSubmit>
        </Form>
      )
    }

    test('FormItem, FormLabel and FormDescription label, describe and require the control', () => {
      render(<Parts />)
      const input = screen.getByRole('textbox', { name: /Project name/ })
      expect(input).toHaveAccessibleDescription('Shown on the dashboard.')
      expect(input).toBeRequired()
    })

    test('FormMessage shows the field error and the control is marked invalid; typing a valid value clears it', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<Parts onSubmit={onSubmit} />)
      await user.click(screen.getByRole('button', { name: 'Create' }))
      expect(await screen.findByText('Use at least 3 characters.')).toHaveAttribute('role', 'alert')
      const input = screen.getByRole('textbox', { name: /Project name/ })
      expect(input).toHaveAttribute('aria-invalid', 'true')
      await waitFor(() => expect(input).toHaveFocus())
      await user.type(input, 'Orion')
      await waitFor(() => expect(input).not.toHaveAttribute('aria-invalid'))
      await user.click(screen.getByRole('button', { name: /Create|Check the form/ }))
      await waitFor(() => expect(onSubmit.mock.calls[0]?.[0]).toEqual({ name: 'Orion' }))
    })

    test('FormControl marks a control Base UI does not know as invalid', async () => {
      const user = userEvent.setup()
      function Custom() {
        const form = useForm<{ name: string }>({ resolver: zodResolver(z.object({ name: z.string().min(3, 'Too short.') })), defaultValues: { name: '' } })
        return (
          <Form form={form} onSubmit={async () => {}}>
            <FormField
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div role="textbox" tabIndex={0} aria-label="Custom" data-value={field.value} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormSubmit>Create</FormSubmit>
          </Form>
        )
      }
      render(<Custom />)
      await user.click(screen.getByRole('button', { name: 'Create' }))
      expect(await screen.findByText('Too short.')).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: 'Custom' })).toHaveAttribute('aria-invalid', 'true')
    })

    test('useFormField outside a FormField says what is missing', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})
      function Probe() {
        useFormField()
        return null
      }
      expect(() => render(<Probe />)).toThrow('useFormField must be used inside a FormField.')
      error.mockRestore()
    })
  })
})
