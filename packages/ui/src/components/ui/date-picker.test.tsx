import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { de } from 'react-day-picker/locale'
import { YoujProvider } from '@youj/core'
import { DatePicker, datePlaceholder, formatDate, parseDate } from './date-picker'
import { Field, FieldLabel } from './field'

const ref = new Date(2026, 8, 27)

function Due(props: Partial<Parameters<typeof DatePicker>[0]>) {
  return (
    <Field>
      <FieldLabel>Due date</FieldLabel>
      <DatePicker {...props} />
    </Field>
  )
}
const field = () => screen.getByRole('textbox', { name: 'Due date' })

describe('date parsing', () => {
  test('reads the locale order with any separator, two-digit years, month names, ISO and words', () => {
    expect(parseDate('9/5/2026', undefined, ref)).toEqual(new Date(2026, 8, 5))
    expect(parseDate('09-05-26', undefined, ref)).toEqual(new Date(2026, 8, 5))
    expect(parseDate('Sep 5, 2026', undefined, ref)).toEqual(new Date(2026, 8, 5))
    expect(parseDate('2026-09-05', undefined, ref)).toEqual(new Date(2026, 8, 5))
    expect(parseDate('tomorrow', undefined, ref)).toEqual(new Date(2026, 8, 28))
    expect(parseDate('5.9.2026', de, ref)).toEqual(new Date(2026, 8, 5))
    expect(parseDate('13/45/2026', undefined, ref)).toBeNull()
    expect(parseDate('soon', undefined, ref)).toBeNull()
  })

  test('formats and spells the placeholder in the locale’s order', () => {
    expect(formatDate(ref)).toBe('09/27/2026')
    expect(formatDate(ref, de)).toBe('27.09.2026')
    expect(datePlaceholder()).toBe('MM/DD/YYYY')
    expect(datePlaceholder(de)).toBe('DD.MM.YYYY')
  })
})

describe('DatePicker', () => {
  test('the field is labelled by the Field; typing a complete date selects it (uncontrolled)', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Due onValueChange={onValueChange} />)
    expect(field()).toHaveAttribute('placeholder', 'MM/DD/YYYY')
    await user.type(field(), '9/5/2026')
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 8, 5))
    expect(field()).toHaveValue('9/5/2026')
    await user.tab()
    expect(field()).toHaveValue('09/05/2026')
  })

  test('no value is committed for a two-digit year while typing, only on blur', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Due onValueChange={onValueChange} />)
    await user.type(field(), '9/5/26')
    expect(onValueChange).not.toHaveBeenCalled()
    await user.keyboard('{Enter}')
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 8, 5))
  })

  test('text that isn’t an allowed date marks the field invalid and clears the value', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Due defaultValue={ref} minDate={new Date(2026, 8, 1)} onValueChange={onValueChange} />)
    await user.clear(field())
    await user.type(field(), '8/31/2026')
    await user.tab()
    expect(field()).toHaveAttribute('aria-invalid', 'true')
    expect(onValueChange).toHaveBeenLastCalledWith(null)
    await user.clear(field())
    expect(field()).not.toHaveAttribute('aria-invalid')
  })

  test('the calendar opens on the chosen day, picks, closes and returns focus to its button (controlled)', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [date, setDate] = useState<Date | null>(ref)
      return <Due value={date} onValueChange={setDate} />
    }
    render(<Controlled />)
    await user.click(screen.getByRole('button', { name: 'Choose date' }))
    const grid = await screen.findByRole('grid', { name: 'September 2026' })
    await waitFor(() => expect(document.activeElement).toHaveAccessibleName(/September 27, 2026/))
    expect(grid).toBeInTheDocument()
    await user.keyboard('{ArrowRight}{Enter}')
    await waitFor(() => expect(screen.queryByRole('grid')).not.toBeInTheDocument())
    expect(field()).toHaveValue('09/28/2026')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Choose date' })).toHaveFocus())
  })

  test('ArrowDown in the field opens the calendar, and closing it returns to the field; disabled days can’t be picked', async () => {
    const user = userEvent.setup()
    render(<Due defaultValue={ref} disabledDates={{ dayOfWeek: [0, 6] }} />)
    await user.click(field())
    await user.keyboard('{ArrowDown}')
    expect(await screen.findByRole('grid')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /September 26, 2026/ })).toBeDisabled()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(field()).toHaveFocus())
  })

  test('submits yyyy-MM-dd with a native form through `name`', () => {
    const { container } = render(<Due defaultValue={ref} name="due" />)
    expect(container.querySelector('input[name=due]')).toHaveValue('2026-09-27')
  })
})

describe('DatePicker on touch', () => {
  test('the field stays a typed field and the calendar opens in a sheet; picking a day commits and closes it', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <YoujProvider device="touch">
        <Due defaultValue={new Date(2026, 8, 10)} onValueChange={onValueChange} />
      </YoujProvider>,
    )
    expect(field()).toHaveClass('own:touch:text-base')
    const button = screen.getByRole('button', { name: 'Choose date' })
    await user.click(button)
    const sheet = await screen.findByRole('dialog', { name: 'Choose date' })
    expect(sheet).toHaveAttribute('data-sheet-popup')
    expect(sheet.querySelector('[data-slot=sheet-handle]')).not.toBeNull()
    expect(screen.getByRole('grid')).toBeInTheDocument()
    // Days are 44px on touch (Calendar's touch: size).
    expect(screen.getByRole('button', { name: /September 14, 2026/ })).toHaveClass('touch:size-11')

    await user.click(screen.getByRole('button', { name: /September 14, 2026/ }))
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 8, 14))
    expect(field()).toHaveValue('09/14/2026')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(button).toHaveFocus())
  })

  test('presentation="popover" keeps the popover on touch', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider device="touch">
        <Due presentation="popover" />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Choose date' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveClass('yj-pop')
    expect(dialog).not.toHaveAttribute('data-sheet-popup')
  })

  test('under a pointer it is the popover', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider device="pointer">
        <Due />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Choose date' }))
    expect(await screen.findByRole('dialog')).toHaveClass('yj-pop')
    expect(document.querySelector('[data-sheet-scrim]')).toBeNull()
  })
})

describe('the ghost variant', () => {
  test('is a quiet button named for its purpose and the date, which opens the calendar and shows the pick', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<DatePicker variant="ghost" size="sm" aria-label="Due date" defaultValue={ref} onValueChange={onValueChange} />)
    const trigger = screen.getByRole('button', { name: 'Due date, Sep 27, 2026' })
    expect(trigger).toHaveAttribute('data-variant', 'ghost')
    expect(trigger).toHaveAttribute('data-size', 'sm')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    await user.click(trigger)
    await user.click(await screen.findByRole('button', { name: /September 28/ }))
    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 8, 28))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Due date, Sep 28, 2026' })).toHaveFocus())
  })

  test('with no date it shows the placeholder, muted', () => {
    render(<DatePicker variant="ghost" aria-label="Due date" placeholder="No due date" />)
    const trigger = screen.getByRole('button', { name: 'Due date, No due date' })
    expect(trigger).toHaveTextContent('No due date')
    expect(trigger).toHaveAttribute('data-placeholder')
  })
})
