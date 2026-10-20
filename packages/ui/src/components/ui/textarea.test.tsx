import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Field, FieldDescription, FieldLabel } from './field'
import { Textarea } from './textarea'

describe('Textarea', () => {
  test('is a real textarea that takes multi-line input', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Textarea aria-label="Notes" rows={4} onChange={onChange} />)
    const area = screen.getByRole('textbox', { name: 'Notes' })
    expect(area.tagName).toBe('TEXTAREA')
    expect(area).toHaveAttribute('rows', '4')
    await user.type(area, 'one{Enter}two')
    expect(area).toHaveValue('one\ntwo')
    expect(onChange).toHaveBeenCalled()
  })

  test('inside a Field it is labelled, described and required like Input', () => {
    render(
      <Field required>
        <FieldLabel>Feedback</FieldLabel>
        <Textarea />
        <FieldDescription>Goes to the team that owns it.</FieldDescription>
      </Field>,
    )
    const area = screen.getByRole('textbox', { name: 'Feedback' })
    expect(area).toBeRequired()
    expect(area).toHaveAccessibleDescription('Goes to the team that owns it.')
  })

  test('disabled is native', () => {
    render(<Textarea aria-label="Locked" disabled />)
    expect(screen.getByRole('textbox', { name: 'Locked' })).toBeDisabled()
  })
})
