import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Form } from '@base-ui/react/form'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Button } from './button'
import { Checkbox } from './checkbox'
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet, useFieldControl } from './field'
import { Input } from './input'
import { Switch } from './switch'

describe('Field', () => {
  test('labels and describes its control', () => {
    render(
      <Field>
        <FieldLabel>Email</FieldLabel>
        <Input />
        <FieldDescription>We never share it.</FieldDescription>
      </Field>,
    )
    const input = screen.getByRole('textbox', { name: 'Email' })
    expect(input).toHaveAccessibleDescription('We never share it.')
  })

  test('required marks the label without polluting the name, and requires the control', () => {
    render(
      <Field required>
        <FieldLabel>Email</FieldLabel>
        <Input />
      </Field>,
    )
    const input = screen.getByRole('textbox', { name: 'Email' })
    expect(input).toBeRequired()
    expect(document.querySelector('[data-slot=required-mark]')).toHaveAttribute('aria-hidden')
  })

  test('a control can still opt out of the field-level required', () => {
    render(
      <Field required>
        <FieldLabel>Nickname</FieldLabel>
        <Input required={false} />
      </Field>,
    )
    expect(screen.getByRole('textbox', { name: 'Nickname' })).not.toBeRequired()
  })

  test('invalid shows app-controlled errors as an alert that describes the control', async () => {
    render(
      <Field invalid>
        <FieldLabel>Handle</FieldLabel>
        <Input defaultValue="acme" />
        <FieldError>That handle is taken.</FieldError>
      </Field>,
    )
    const input = screen.getByRole('textbox', { name: 'Handle' })
    expect(screen.getByRole('alert')).toHaveTextContent('That handle is taken.')
    await waitFor(() => expect(input).toHaveAccessibleDescription('That handle is taken.'))
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  test('errors[] collapses duplicates and lists several', () => {
    render(
      <Field invalid>
        <FieldLabel>Password</FieldLabel>
        <Input type="password" />
        <FieldError errors={[{ message: 'Too short.' }, { message: 'Add a number.' }, { message: 'Too short.' }]} />
      </Field>,
    )
    const items = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(items).toEqual(['Too short.', 'Add a number.'])
  })

  test('an empty errors[] renders nothing', () => {
    render(
      <Field>
        <Input aria-label="Name" />
        <FieldError errors={[]} />
      </Field>,
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('with no content, FieldError shows the native message after a submit and focuses the field', async () => {
    const user = userEvent.setup()
    render(
      <Form>
        <Field name="name" required>
          <FieldLabel>Token name</FieldLabel>
          <Input />
          <FieldError />
        </Field>
        <Button type="submit">Create</Button>
      </Form>,
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Create' }))
    const input = screen.getByRole('textbox', { name: 'Token name' })
    await waitFor(() => expect(screen.getByRole('alert')).not.toBeEmptyDOMElement())
    expect(input).toHaveFocus()
    expect(input).toHaveAttribute('aria-invalid', 'true')

    await user.type(input, 'CI')
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  test('disabled reaches the control', () => {
    render(
      <Field disabled>
        <FieldLabel>Region</FieldLabel>
        <Input defaultValue="eu" />
      </Field>,
    )
    expect(screen.getByRole('textbox', { name: 'Region' })).toBeDisabled()
  })

  test('labels composite controls (checkbox, switch) by aria-labelledby', () => {
    render(
      <>
        <Field orientation="horizontal">
          <Checkbox />
          <FieldLabel>Accept terms</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <FieldLabel>Wi-Fi</FieldLabel>
          <Switch />
        </Field>
      </>,
    )
    expect(screen.getByRole('checkbox', { name: 'Accept terms' })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Wi-Fi' })).toBeInTheDocument()
  })

  test('parts render as plain elements outside a Field instead of throwing', () => {
    render(
      <FieldSet>
        <FieldLegend>Scopes</FieldLegend>
        <FieldDescription>Pick what the token can do.</FieldDescription>
        <FieldLabel htmlFor="free">Free label</FieldLabel>
        <input id="free" />
        <FieldError>Standalone error</FieldError>
      </FieldSet>,
    )
    expect(screen.getByRole('group', { name: 'Scopes' })).toBeInTheDocument()
    expect(screen.getByText('Pick what the token can do.').tagName).toBe('P')
    expect(screen.getByRole('textbox', { name: 'Free label' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Standalone error')
  })

  function Handle({ error }: { error?: string }) {
    return (
      <Field invalid={!!error}>
        <FieldLabel>Handle</FieldLabel>
        <Input defaultValue="acme" />
        <FieldError>{error}</FieldError>
        <FieldDescription>Letters, numbers and dashes.</FieldDescription>
      </Field>
    )
  }

  test('an app-controlled error grows in inside a collapse panel and collapses out when it clears', async () => {
    const { rerender } = render(<Handle />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    rerender(<Handle error="That handle is taken." />)
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('That handle is taken.')
    expect(alert.closest('[data-slot=field-error-panel]')).not.toBeNull()

    rerender(<Handle />)
    // The last message stays while the panel closes over it, then leaves.
    expect(document.querySelector('[data-slot=field-error-panel]')).toHaveTextContent('That handle is taken.')
    await waitFor(() => expect(document.querySelector('[data-slot=field-error-panel]')).toBeNull())
  })

  test('under reduced motion the error leaves at once', async () => {
    const { rerender } = render(
      <YoujProvider reducedMotion="always" timeScale={50}>
        <Handle error="Taken." />
      </YoujProvider>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Taken.')
    rerender(
      <YoujProvider reducedMotion="always" timeScale={50}>
        <Handle />
      </YoujProvider>,
    )
    // At this Speed any animation would take seconds: settling inside waitFor's timeout proves it was instant, without racing a busy runner.
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  test('a conditionally rendered error grows in; one present with its Field is simply there', async () => {
    function Late({ show }: { show: boolean }) {
      return (
        <Field invalid={show}>
          <FieldLabel>Slug</FieldLabel>
          <Input defaultValue="linear" />
          {show && <FieldError>That slug is taken.</FieldError>}
        </Field>
      )
    }
    const { rerender, unmount } = render(<Late show={false} />)
    rerender(<Late show />)
    // Mounted after its Field: the panel starts closed and opens a frame later.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent('That slug is taken.')
    unmount()

    render(<Late show />)
    expect(screen.getByRole('alert')).toHaveTextContent('That slug is taken.')
  })

  test('a toggled error keeps focus in the control', async () => {
    const user = userEvent.setup()
    function Live() {
      const [value, setValue] = useState('')
      return (
        <Field invalid={value === 'taken'}>
          <FieldLabel>Handle</FieldLabel>
          <Input value={value} onValueChange={setValue} />
          <FieldError>{value === 'taken' ? 'That handle is taken.' : undefined}</FieldError>
        </Field>
      )
    }
    render(<Live />)
    const input = screen.getByRole('textbox', { name: 'Handle' })
    await user.type(input, 'taken')
    expect(await screen.findByRole('alert')).toHaveTextContent('That handle is taken.')
    expect(input).toHaveFocus()
    await user.type(input, 's')
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(input).toHaveFocus()
  })

  test('the error marks itself for reduced motion so it arrives without sliding', () => {
    render(
      <YoujProvider reducedMotion="always">
        <Field invalid>
          <Input aria-label="x" />
          <FieldError>Nope</FieldError>
        </Field>
      </YoujProvider>,
    )
    expect(screen.getByRole('alert')).toHaveAttribute('data-reduced-motion')
  })

  test('useFieldControl wires a custom control to the label, description and invalid state', () => {
    function Trigger() {
      const control = useFieldControl()
      return (
        <button
          type="button"
          id={control.id}
          aria-describedby={control.describedBy}
          aria-invalid={control.invalid || undefined}
          aria-required={control.required}
        >
          Pick
        </button>
      )
    }
    render(
      <Field invalid required>
        <FieldLabel>Owner</FieldLabel>
        <Trigger />
        <FieldDescription>Who runs it.</FieldDescription>
      </Field>,
    )
    const trigger = screen.getByRole('button', { name: /Owner/ })
    expect(trigger).toHaveAccessibleDescription('Who runs it.')
    expect(trigger).toHaveAttribute('aria-invalid', 'true')
    expect(trigger).toHaveAttribute('aria-required', 'true')
  })
})
