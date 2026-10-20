import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { de } from '@youj/core/locales/de'
import { ExportDialog, type ExportDialogProps } from './export-dialog'
import { presetRange } from './export-dialog-range'

/* September 29, 2026, noon: a Tuesday, in the middle of a month. */
const NOW = new Date(2026, 8, 29, 12)
const COLUMNS = [
  { id: 'id', label: 'Payment ID' },
  { id: 'amount', label: 'Amount' },
  { id: 'status', label: 'Status' },
  { id: 'customer', label: 'Customer' },
]
const plain = (text: string) => text.replace(/\s/g, ' ')
const day = (y: number, m: number, d: number) => new Date(y, m - 1, d)

function deferred<T = void>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function setup(props: Partial<ExportDialogProps> = {}) {
  const onExport = props.onExport ?? vi.fn()
  render(
    <YoujProvider reducedMotion="always">
      <ExportDialog open columns={COLUMNS} now={NOW} locale="en-US" onExport={onExport} {...props} />
    </YoujProvider>,
  )
  return { onExport }
}

describe('presetRange', () => {
  test('each preset is the days it names, both ends included, ending today', () => {
    const range = (id: Parameters<typeof presetRange>[0]) => {
      const { from, to } = presetRange(id, NOW, 'en-US')
      return [from, to]
    }
    expect(range('today')).toEqual([day(2026, 9, 29), day(2026, 9, 29)])
    expect(range('yesterday')).toEqual([day(2026, 9, 28), day(2026, 9, 28)])
    expect(range('last7Days')).toEqual([day(2026, 9, 23), day(2026, 9, 29)])
    expect(range('last30Days')).toEqual([day(2026, 8, 31), day(2026, 9, 29)])
    expect(range('thisMonth')).toEqual([day(2026, 9, 1), day(2026, 9, 30)])
    expect(range('lastMonth')).toEqual([day(2026, 8, 1), day(2026, 8, 31)])
    expect(range('yearToDate')).toEqual([day(2026, 1, 1), day(2026, 9, 29)])
  })

  test('reads each range the way the locale writes it, with the year only when it is not this one', () => {
    expect(plain(presetRange('last7Days', NOW, 'en-US').text)).toBe('Sep 23 – 29')
    expect(presetRange('today', NOW, 'en-US').text).toBe('Sep 29')
    expect(plain(presetRange('lastMonth', day(2027, 1, 3), 'en-US').text)).toBe('Dec 1 – 31, 2026')
    expect(plain(presetRange('last7Days', day(2027, 1, 3), 'en-US').text)).toBe('Dec 28, 2026 – Jan 3, 2027')
    expect(plain(presetRange('last7Days', NOW, 'de-DE').text)).toBe('23.–29. Sept.')
  })

  test('the clock is the argument: the same call on another day gives another range', () => {
    expect(presetRange('last7Days', day(2026, 3, 8), 'en-US').from).toEqual(day(2026, 3, 2))
    expect(presetRange('last7Days', day(2026, 3, 8), 'en-US').to).toEqual(day(2026, 3, 8))
  })
})

describe('ExportDialog', () => {
  test('lists the ranges with their days, focus starts on the chosen one, arrows move it', async () => {
    const user = userEvent.setup()
    setup()
    const group = screen.getByRole('radiogroup', { name: 'Date range' })
    const last7 = within(group).getByRole('radio', { name: 'Last 7 days' })
    expect(last7).toBeChecked()
    expect(last7).toHaveAccessibleDescription(/Sep 23\s*–\s*29/)
    await waitFor(() => expect(last7).toHaveFocus())
    await user.keyboard('{ArrowDown}')
    expect(within(group).getByRole('radio', { name: /Last 30 days/ })).toBeChecked()
    expect(within(group).getByRole('radio', { name: /Custom/ })).toBeInTheDocument()
  })

  test('the summary asks the app for the chosen range and says it back; it asks again when the range changes', async () => {
    const user = userEvent.setup()
    const summary = vi.fn(async ({ from }: { from: Date }) => ({ count: from.getDate() === 23 ? 412 : 1_204, total: '€18,240' }))
    setup({ summary, countLabel: (n) => `${n.toLocaleString('en-US')} payments` })
    const summaryRegion = () => document.querySelector('[data-slot=export-dialog-summary]')!
    await waitFor(() => expect(summary).toHaveBeenCalledTimes(1))
    expect(summary.mock.calls[0]![0]).toMatchObject({ from: day(2026, 9, 23), to: day(2026, 9, 29), format: 'csv', timeZone: 'local' })
    expect(await within(summaryRegion() as HTMLElement).findByText('412 payments')).toBeInTheDocument()
    expect(summaryRegion()).toHaveTextContent('€18,240')
    expect(plain(summaryRegion().textContent!)).toContain('Sep 23 – 29, 2026')
    expect(summaryRegion()).toHaveAttribute('role', 'status')
    await user.click(screen.getByRole('radio', { name: /Last 30 days/ }))
    expect(await within(summaryRegion() as HTMLElement).findByText('1,204 payments')).toBeInTheDocument()
    expect(summary).toHaveBeenCalledTimes(2)
  })

  test('a range with nothing in it says so and cannot be exported', async () => {
    setup({ summary: async () => ({ count: 0 }) })
    expect(await screen.findByText('Nothing to export in this range')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled()
  })

  test('the default count line is the provider’s noun and number format', async () => {
    setup({ summary: async () => ({ count: 1234 }) })
    expect(await screen.findByText('1,234 rows')).toBeInTheDocument()
  })

  test('the columns button counts them: all, some, none; All and None in the popover change it', async () => {
    const user = userEvent.setup()
    setup()
    const columns = screen.getByRole('button', { name: /Columns/ })
    expect(columns).toHaveTextContent('All 4')
    await user.click(columns)
    const popover = await screen.findByRole('dialog', { name: 'Choose columns' })
    await user.click(within(popover).getByRole('checkbox', { name: 'Status' }))
    expect(columns).toHaveTextContent('3 of 4')
    await user.click(within(popover).getByRole('button', { name: 'None' }))
    expect(columns).toHaveTextContent('None')
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled()
    await user.click(within(popover).getByRole('button', { name: 'All' }))
    expect(columns).toHaveTextContent('All 4')
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeEnabled()
  })

  test('Custom reveals the date range picker, a preset hides it again, and an incomplete range cannot be exported', async () => {
    const user = userEvent.setup()
    const onExport = vi.fn()
    setup({ onExport })
    expect(screen.queryByRole('textbox', { name: 'Start date' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: /Custom/ }))
    const start = await screen.findByRole('textbox', { name: 'Start date' })
    const end = screen.getByRole('textbox', { name: 'End date' })
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled()
    await user.type(start, '9/1/2026')
    await user.type(end, '9/10/2026')
    await user.tab()
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Export CSV' }))
    expect(onExport).toHaveBeenCalledWith(expect.objectContaining({ period: 'custom', from: day(2026, 9, 1), to: day(2026, 9, 10) }))
    await user.click(screen.getByRole('radio', { name: /Last 7 days/ }))
    await waitFor(() => expect(screen.queryByRole('textbox', { name: 'Start date' })).not.toBeInTheDocument())
  })

  test('export runs through working to done, locks the choices meanwhile, and names the chosen format', async () => {
    const user = userEvent.setup()
    const run = deferred()
    const { onExport } = setup({ onExport: vi.fn(() => run.promise) })
    await user.click(screen.getByRole('combobox', { name: 'Format' }))
    await user.click(await screen.findByRole('option', { name: 'XLSX' }))
    await user.click(screen.getByRole('radio', { name: /Last 30 days/ }))
    await user.click(screen.getByRole('button', { name: 'Export XLSX' }))
    expect(onExport).toHaveBeenCalledWith({
      period: 'last30Days',
      from: day(2026, 8, 31),
      to: day(2026, 9, 29),
      format: 'xlsx',
      timeZone: 'local',
      columns: ['id', 'amount', 'status', 'customer'],
    })
    await waitFor(() => expect(screen.getByRole('button', { name: /Working/ })).toBeInTheDocument())
    expect(screen.getByRole('radio', { name: /Last 7 days/ })).toHaveAttribute('data-disabled')
    run.resolve()
    await waitFor(() => expect(screen.getByRole('button', { name: /Done/ })).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  test('a large export that resolves as emailed says it will arrive by email, politely', async () => {
    const user = userEvent.setup()
    setup({ onExport: async () => ({ emailed: true, email: 'ada@example.com' }) })
    await user.click(screen.getByRole('button', { name: 'Export CSV' }))
    await waitFor(() => expect(screen.getByRole('button', { name: /Queued/ })).toBeInTheDocument())
    await waitFor(() => expect(document.querySelector('[data-slot=export-dialog-status]')).toHaveTextContent('We’ll email it to ada@example.com when it’s ready.'))
  })

  test('a failed export says so assertively and can be tried again', async () => {
    const user = userEvent.setup()
    const onExport = vi.fn().mockRejectedValueOnce(new Error('The bank feed is down.')).mockResolvedValueOnce(undefined)
    setup({ onExport })
    await user.click(screen.getByRole('button', { name: 'Export CSV' }))
    const alert = () => document.querySelector('[data-slot=export-dialog-alert]')!
    await waitFor(() => expect(alert()).toHaveTextContent('The bank feed is down.'))
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Export CSV' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Export CSV' }))
    await waitFor(() => expect(onExport).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(alert()).toBeEmptyDOMElement())
  })

  test('the time zone switch and the preset list are configurable', async () => {
    const user = userEvent.setup()
    const { onExport } = setup({
      presets: ['today', 'yesterday'],
      custom: false,
      timeZones: [
        { value: 'Europe/Paris', label: 'Paris' },
        { value: 'UTC', label: 'UTC' },
      ],
    })
    expect(screen.getAllByRole('radio')).toHaveLength(2)
    expect(screen.queryByRole('radio', { name: /Custom/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'UTC' }))
    await user.click(screen.getByRole('button', { name: 'Export CSV' }))
    expect(onExport).toHaveBeenCalledWith(expect.objectContaining({ period: 'today', timeZone: 'UTC' }))
  })

  test('its words follow the provider’s labels', () => {
    render(
      <YoujProvider reducedMotion="always" locale="de-DE" labels={de}>
        <ExportDialog open columns={COLUMNS} now={NOW} onExport={vi.fn()} />
      </YoujProvider>,
    )
    expect(screen.getByRole('dialog', { name: 'Daten exportieren' })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Zeitraum' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Spalten/ })).toHaveTextContent('Alle 4')
    expect(screen.getByRole('button', { name: 'CSV exportieren' })).toBeInTheDocument()
  })
})
