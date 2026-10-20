import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from './checkbox'
import { Input } from './input'
import { Label } from './label'

describe('Label', () => {
  test('names its control through htmlFor, without the decorative required mark', () => {
    render(
      <>
        <Label htmlFor="name" required>
          Display name
        </Label>
        <Input id="name" required />
      </>,
    )
    expect(screen.getByRole('textbox', { name: 'Display name' })).toBeRequired()
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden')
  })

  test('a sibling label names a Base UI checkbox and clicking it toggles', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <Checkbox id="terms" />
        <Label htmlFor="terms">Accept the terms</Label>
      </div>,
    )
    const box = screen.getByRole('checkbox', { name: 'Accept the terms' })
    await user.click(screen.getByText('Accept the terms'))
    expect(box).toHaveAttribute('aria-checked', 'true')
  })
})
