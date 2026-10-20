import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Field, FieldDescription, FieldLabel } from './field'
import { TimePicker } from './time-picker'

function Standup(props: Partial<Parameters<typeof TimePicker>[0]>) {
  return (
    <Field>
      <FieldLabel>Standup</FieldLabel>
      <TimePicker hourCycle={12} {...props} />
      <FieldDescription>Every weekday.</FieldDescription>
    </Field>
  )
}
const hours = () => screen.getByRole('spinbutton', { name: 'Hours' })
const minutes = () => screen.getByRole('spinbutton', { name: 'Minutes' })
const period = () => screen.getByRole('spinbutton', { name: 'AM/PM' })

describe('TimePicker', () => {
  test('a group of spinbuttons named by the Field; the label focuses the hours', async () => {
    const user = userEvent.setup()
    render(<Standup defaultValue="09:30" />)
    expect(screen.getByRole('group', { name: 'Standup' })).toContainElement(hours())
    expect(hours()).toHaveAttribute('aria-valuenow', '9')
    expect(minutes()).toHaveAttribute('aria-valuetext', '30')
    // The locale's own word ("AM", "am"…), shown uppercase.
    expect((period() as HTMLInputElement).value).toMatch(/^am$/i)
    expect(hours()).toHaveAccessibleDescription('Every weekday.')
    await user.click(screen.getByText('Standup'))
    expect(hours()).toHaveFocus()
  })

  test('typing digits fills segments and moves on by itself (12-hour → "HH:mm")', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Standup onValueChange={onValueChange} />)
    await user.click(hours())
    await user.keyboard('245p')
    expect(onValueChange).toHaveBeenLastCalledWith('14:45')
    expect(period()).toHaveFocus()
    expect(hours()).toHaveValue('02')
  })

  test('a digit that can’t start a pair completes the segment; one that can waits', async () => {
    const user = userEvent.setup()
    render(<Standup hourCycle={24} />)
    await user.click(hours())
    await user.keyboard('1')
    expect(hours()).toHaveFocus()
    await user.keyboard('7')
    expect(minutes()).toHaveFocus()
    expect(hours()).toHaveValue('17')
    await user.keyboard('7')
    expect(minutes()).toHaveValue('07')
  })

  test('arrows step and wrap; minutes move by `step`; Home and End jump (controlled)', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [time, setTime] = useState<string | null>('23:50')
      return <Standup hourCycle={24} step={15} value={time} onValueChange={setTime} />
    }
    render(<Controlled />)
    await user.click(minutes())
    await user.keyboard('{ArrowUp}')
    expect(minutes()).toHaveValue('00')
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(minutes()).toHaveValue('30')
    await user.keyboard('{End}')
    expect(minutes()).toHaveValue('45')
    await user.keyboard('{ArrowLeft}{ArrowUp}')
    expect(hours()).toHaveValue('00')
    await user.keyboard('{Home}')
    expect(hours()).toHaveValue('00')
  })

  test('A/P and arrows set the period; Backspace clears a segment and the value goes null', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Standup defaultValue="09:00" onValueChange={onValueChange} />)
    await user.click(period())
    await user.keyboard('p')
    expect(onValueChange).toHaveBeenLastCalledWith('21:00')
    await user.keyboard('{ArrowUp}')
    expect(onValueChange).toHaveBeenLastCalledWith('09:00')
    await user.click(minutes())
    await user.keyboard('{Backspace}')
    expect(onValueChange).toHaveBeenLastCalledWith(null)
    expect(minutes()).toHaveValue('')
  })

  test('an off-step minute snaps to the grid on blur', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <>
        <Standup hourCycle={24} step={15} onValueChange={onValueChange} />
        <button type="button">Next field</button>
      </>,
    )
    await user.click(hours())
    await user.keyboard('0907')
    // Tab out to a real next control; tabbing past the end of the page wraps
    // focus back into the picker, which (correctly) isn't a blur.
    await user.tab()
    expect(screen.getByRole('button', { name: 'Next field' })).toHaveFocus()
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith('09:00'))
  })

  test('follows the locale’s clock, the Field’s disabled state and submits through `name`', () => {
    const { container } = render(
      <Field disabled>
        <FieldLabel>Beginn</FieldLabel>
        <TimePicker locale="de-DE" defaultValue="14:45" name="start" />
      </Field>,
    )
    expect(screen.queryByRole('spinbutton', { name: 'AM/PM' })).not.toBeInTheDocument()
    expect(hours()).toHaveValue('14')
    expect(hours()).toBeDisabled()
    expect(container.querySelector('input[name=start]')).toHaveValue('14:45')
  })
})
