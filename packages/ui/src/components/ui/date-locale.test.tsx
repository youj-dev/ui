import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { enUS } from 'date-fns/locale'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Calendar, dateLocale } from './calendar'
import { DatePicker, formatDate, parseDate } from './date-picker'
import { DateRangePicker } from './date-range-picker'

/* The date components follow YoujProvider's locale when no date-fns locale
 * is passed: the order and names come from Intl, the week start from
 * Intl.Locale's week info. */

const ref = new Date(2026, 8, 27)

/** The weekday row's full names, in order (react-day-picker hides the row from the accessibility tree; each cell carries the full name). */
function weekdayHeaders() {
  return [...screen.getByRole('grid').querySelectorAll('thead th')].map((th) => th.getAttribute('aria-label'))
}

describe('dateLocale', () => {
  test('en-US is date-fns’s own, and a bad tag falls back to it', () => {
    expect(dateLocale('en-US')).toBe(enUS)
    expect(dateLocale('not a locale!')).toBe(enUS)
  })

  test('de: day.month.year, German names, weeks from Monday', () => {
    const de = dateLocale('de')
    expect(formatDate(ref, de)).toBe('27.09.2026')
    expect(parseDate('5.9.2026', de, ref)).toEqual(new Date(2026, 8, 5))
    expect(de.localize.month(8, { width: 'wide', context: 'standalone' })).toBe('September')
    expect(de.localize.day(1, { width: 'wide' })).toBe('Montag')
    expect(de.options?.weekStartsOn).toBe(1)
  })

  test('ar: day/month/year without bidi marks, Arabic names, the week from Intl', () => {
    const ar = dateLocale('ar')
    expect(formatDate(ref, ar)).toBe('27/09/2026')
    expect(parseDate('5/9/2026', ar, ref)).toEqual(new Date(2026, 8, 5))
    expect(ar.localize.month(8, { width: 'wide', context: 'standalone' })).toBe(new Intl.DateTimeFormat('ar', { month: 'long' }).format(ref))
    const info = (new Intl.Locale('ar') as Intl.Locale & { getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number } })
    const firstDay = info.getWeekInfo?.().firstDay ?? info.weekInfo?.firstDay ?? 1
    expect(ar.options?.weekStartsOn).toBe(firstDay % 7)
  })
})

describe('DatePicker and Calendar follow the provider’s locale', () => {
  test('de: the field reads DD.MM.YYYY and formats what it’s given', () => {
    render(
      <YoujProvider locale="de">
        <DatePicker aria-label="Fällig" defaultValue={ref} />
      </YoujProvider>,
    )
    const field = screen.getByRole('textbox', { name: 'Fällig' })
    expect(field).toHaveAttribute('placeholder', 'DD.MM.YYYY')
    expect(field).toHaveValue('27.09.2026')
  })

  test('de: typing a German date selects it', async () => {
    const onValueChange = vi.fn()
    render(
      <YoujProvider locale="de">
        <DatePicker aria-label="Fällig" onValueChange={onValueChange} />
      </YoujProvider>,
    )
    await userEvent.type(screen.getByRole('textbox', { name: 'Fällig' }), '5.9.2026')
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 8, 5))
  })

  test('de: the calendar starts its weeks on Monday and names the month in German', () => {
    render(
      <YoujProvider locale="de">
        <Calendar mode="single" defaultMonth={ref} />
      </YoujProvider>,
    )
    expect(weekdayHeaders()[0]).toBe('Montag')
    expect(screen.getByText('September 2026')).toBeInTheDocument()
  })

  test('ar: the field reads DD/MM/YYYY and the calendar starts where Intl says', () => {
    render(
      <YoujProvider locale="ar">
        <DatePicker aria-label="التاريخ" defaultValue={ref} />
        <Calendar mode="single" defaultMonth={ref} />
      </YoujProvider>,
    )
    const field = screen.getByRole('textbox', { name: 'التاريخ' })
    expect(field).toHaveAttribute('placeholder', 'DD/MM/YYYY')
    expect(field).toHaveValue('27/09/2026')
    const ar = dateLocale('ar')
    expect(weekdayHeaders()[0]).toBe(ar.localize.day(ar.options!.weekStartsOn!, { width: 'wide' }))
  })

  test('an explicit date-fns locale wins over the provider’s', () => {
    render(
      <YoujProvider locale="de">
        <DatePicker aria-label="Due" defaultValue={ref} locale={enUS} />
        <Calendar mode="single" defaultMonth={ref} locale={enUS} />
      </YoujProvider>,
    )
    expect(screen.getByRole('textbox', { name: 'Due' })).toHaveValue('09/27/2026')
    expect(weekdayHeaders()[0]).toBe('Sunday')
  })

  test('DateRangePicker: both ends in the provider’s order', () => {
    render(
      <YoujProvider locale="de">
        <DateRangePicker defaultValue={{ from: new Date(2026, 8, 1), to: ref }} />
      </YoujProvider>,
    )
    const values = screen.getAllByRole('textbox').map((input) => (input as HTMLInputElement).value)
    expect(values).toEqual(['01.09.2026', '27.09.2026'])
  })
})
