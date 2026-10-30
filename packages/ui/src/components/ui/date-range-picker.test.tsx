import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { addDays, startOfDay } from 'date-fns'
import { DateRangePicker, dateRangePresets, type DateRange } from './date-range-picker'
import { Field, FieldLabel } from './field'
import { YoujProvider } from '@youj/core'

function Timeline(props: Partial<Parameters<typeof DateRangePicker>[0]>) {
  return (
    <Field>
      <FieldLabel>Timeline</FieldLabel>
      <DateRangePicker {...props} />
    </Field>
  )
}
const startField = () => screen.getByRole('textbox', { name: 'Timeline Start date' })
const endField = () => screen.getByRole('textbox', { name: 'Timeline End date' })
const today = startOfDay(new Date())

describe('DateRangePicker', () => {
  test('two fields, each named by the Field’s label and its end', () => {
    render(<Timeline />)
    expect(startField()).toBeInTheDocument()
    expect(endField()).toBeInTheDocument()
  })

  test('typing both ends commits the range on blur; an end before the start swaps them', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Timeline onValueChange={onValueChange} />)
    await user.type(startField(), '9/20/2026')
    await user.type(endField(), '9/10/2026')
    await user.tab()
    expect(onValueChange).toHaveBeenLastCalledWith({ from: new Date(2026, 8, 10), to: new Date(2026, 8, 20) })
    expect(startField()).toHaveValue('09/10/2026')
    expect(endField()).toHaveValue('09/20/2026')
  })

  test('an unreadable end is marked invalid', async () => {
    const user = userEvent.setup()
    render(<Timeline />)
    await user.type(startField(), '9/1/2026')
    await user.type(endField(), 'later')
    await user.tab()
    expect(endField()).toHaveAttribute('aria-invalid', 'true')
    expect(startField()).not.toHaveAttribute('aria-invalid')
  })

  test('presets apply, show as pressed, and the footer counts the days (controlled)', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [range, setRange] = useState<DateRange | null>(null)
      return <Timeline value={range} onValueChange={setRange} />
    }
    render(<Controlled />)
    await user.click(screen.getByRole('button', { name: 'Choose dates' }))
    const presets = await screen.findByRole('group', { name: 'Presets' })
    expect(presets).toBeInTheDocument()
    expect(screen.getByText('Pick a start date.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Last 7 days' }))
    expect(screen.getByRole('button', { name: 'Last 7 days' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Today' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText(/^7 days:/)).toBeInTheDocument()
    expect(endField()).toHaveValue(new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).format(today))
  })

  test('two clicks pick a range in the calendar; a third starts a new one', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Timeline presets={false} defaultValue={{ from: new Date(2026, 8, 3), to: new Date(2026, 8, 5) }} onValueChange={onValueChange} />)
    await user.click(screen.getByRole('button', { name: 'Choose dates' }))
    await screen.findAllByRole('grid')
    await user.click(screen.getByRole('button', { name: /September 10, 2026/ }))
    expect(onValueChange).toHaveBeenLastCalledWith(expect.objectContaining({ from: new Date(2026, 8, 10) }))
    await user.click(screen.getByRole('button', { name: /September 14, 2026/ }))
    expect(onValueChange).toHaveBeenLastCalledWith({ from: new Date(2026, 8, 10), to: new Date(2026, 8, 14) })
    expect(screen.getByText(/^5 days:/)).toBeInTheDocument()
  })

  test('presets outside min/max are disabled', async () => {
    const user = userEvent.setup()
    render(<Timeline minDate={today} />)
    await user.click(screen.getByRole('button', { name: 'Choose dates' }))
    await screen.findByRole('group', { name: 'Presets' })
    expect(screen.getByRole('button', { name: 'Yesterday' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Today' })).toBeEnabled()
  })

  test('the default presets are exported to extend', () => {
    const lastWeek = dateRangePresets.find((p) => p.label === 'Last 7 days')!.range(today)
    expect(lastWeek).toEqual({ from: addDays(today, -6), to: today })
  })

  test('closing returns focus to what opened it: the calendar button, or the field ArrowDown was pressed in', async () => {
    const user = userEvent.setup()
    render(<Timeline />)
    const button = screen.getByRole('button', { name: 'Choose dates' })
    await user.click(button)
    await screen.findByRole('group', { name: 'Presets' })
    await user.keyboard('{Escape}')
    await waitFor(() => expect(button).toHaveFocus())

    await user.click(startField())
    await user.keyboard('{ArrowDown}')
    await screen.findByRole('group', { name: 'Presets' })
    await user.keyboard('{Escape}')
    await waitFor(() => expect(startField()).toHaveFocus())
  })
})

describe('DateRangePicker on touch', () => {
  test('opens a sheet: a preset row that owns its drag, one month, and Done that closes it', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <YoujProvider device="touch">
        <Timeline numberOfMonths={undefined} onValueChange={onValueChange} />
      </YoujProvider>,
    )
    const button = screen.getByRole('button', { name: 'Choose dates' })
    await user.click(button)
    const sheet = await screen.findByRole('dialog', { name: 'Choose dates' })
    expect(sheet).toHaveAttribute('data-sheet-popup')
    // One month on a phone's column, whatever the window's width.
    expect(screen.getAllByRole('grid')).toHaveLength(1)
    const presets = screen.getByRole('group', { name: 'Presets' })
    expect(presets).toHaveAttribute('data-sheet-no-drag')
    expect(presets).toHaveClass('overflow-x-auto')

    // A sideways drag on the presets never pulls the sheet away.
    fireEvent.pointerDown(presets, { clientY: 10, button: 0 })
    fireEvent.pointerMove(presets, { clientY: 300 })
    fireEvent.pointerUp(presets, { clientY: 300 })
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Last 7 days' }))
    expect(onValueChange).toHaveBeenLastCalledWith({ from: addDays(today, -6), to: today })
    // A range takes more than one tap, so the sheet stays until Done.
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Done' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(button).toHaveFocus())
  })

  test('presentation="popover" keeps the popover on touch, with no Done button', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider device="touch">
        <Timeline presentation="popover" />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Choose dates' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveClass('yj-pop')
    expect(dialog).not.toHaveAttribute('data-sheet-popup')
    expect(screen.queryByRole('button', { name: 'Done' })).toBeNull()
  })
})
