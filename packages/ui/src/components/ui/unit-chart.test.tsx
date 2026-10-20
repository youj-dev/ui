import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { de } from '@youj/core/locales/de'
import { UnitChart, type UnitChartBucket } from './unit-chart'

const DATA: UnitChartBucket[] = [
  { label: '11:00', value: 3 },
  { label: '12:00', value: 7 },
  { label: '13:00', value: 4 },
  { label: '14:00', value: 0 },
]
const covers = (v: number) => `${v} covers`
const reduced = (ui: React.ReactNode) => <YoujProvider reducedMotion="always">{ui}</YoujProvider>
const columns = () => screen.getAllByRole('listitem')
const lit = () => document.querySelectorAll('[data-slot=unit-chart-dot][data-state=on]')

describe('UnitChart', () => {
  test('is a named group holding a list of columns, each named with its label and value', () => {
    render(reduced(<UnitChart data={DATA} formatValue={covers} label="Covers" />))
    const group = screen.getByRole('group', { name: 'Covers' })
    expect(
      within(group)
        .getAllByRole('listitem')
        .map((c) => c.getAttribute('aria-label')),
    ).toEqual(['11:00: 3 covers', '12:00: 7 covers', '13:00: 4 covers', '14:00: 0 covers'])
    expect(group).toHaveAccessibleDescription('4 columns, 14 covers in all. The peak is 12:00, at 7 covers.')
  })

  test('draws one dot per unit over a grid that holds the peak', () => {
    render(reduced(<UnitChart data={DATA} rows={8} />))
    expect(document.querySelectorAll('[data-slot=unit-chart-dot]')).toHaveLength(4 * 8)
    expect(lit()).toHaveLength(14)
  })

  test('counts a dot as `unit`, rounding each column', () => {
    render(
      reduced(
        <UnitChart
          data={[
            { label: 'a', value: 24 },
            { label: 'b', value: 11 },
          ]}
          unit={5}
          rows={6}
        />,
      ),
    )
    expect(lit()).toHaveLength(5 + 2)
  })

  test('names the highlighted columns and leaves the others plain', () => {
    render(reduced(<UnitChart data={DATA} formatValue={covers} highlight={[1, 2]} />))
    const [first, second] = columns()
    expect(second).toHaveAttribute('aria-label', '12:00: 7 covers, highlighted')
    expect(second).toHaveAttribute('data-highlighted')
    expect(first).not.toHaveAttribute('data-highlighted')
  })

  test('labels every nth column under the plot', () => {
    render(reduced(<UnitChart data={DATA} tickEvery={2} />))
    expect([...document.querySelectorAll('[data-slot=unit-chart-tick]')].map((t) => t.textContent)).toEqual(['11:00', '13:00'])
  })

  test('shows an empty state when there is nothing to count', () => {
    render(reduced(<UnitChart data={[{ label: 'a', value: 0 }]} />))
    expect(screen.getByText('No data')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  test('one tab stop; arrows walk the columns, Home and End go to the ends', async () => {
    const user = userEvent.setup()
    render(reduced(<UnitChart data={DATA} />))
    const [a, b, , d] = columns() as HTMLElement[]
    expect(columns().map((c) => c.tabIndex)).toEqual([0, -1, -1, -1])
    await user.tab()
    expect(a).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(b).toHaveFocus()
    await user.keyboard('{End}')
    expect(d).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(d).toHaveFocus()
    await user.keyboard('{Home}')
    expect(a).toHaveFocus()
  })

  test('the arrows follow the drawing in RTL', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always" dir="rtl">
        <UnitChart data={DATA} />
      </YoujProvider>,
    )
    await user.tab()
    await user.keyboard('{ArrowLeft}')
    expect(columns()[1]).toHaveFocus()
  })

  test('hovering a column shows its label and value', async () => {
    const user = userEvent.setup()
    render(reduced(<UnitChart data={DATA} formatValue={covers} />))
    await user.hover(columns()[1]!)
    await waitFor(() => expect(document.querySelector('[data-slot=unit-chart-tooltip]')).toHaveTextContent('12:007 covers'))
  })

  test('speaks the provider’s language', () => {
    render(
      <YoujProvider reducedMotion="always" locale="de-DE" labels={de}>
        <UnitChart data={DATA} />
      </YoujProvider>,
    )
    expect(screen.getByRole('group', { name: 'Einheitendiagramm' })).toHaveAccessibleDescription(
      '4 Spalten, insgesamt 14. Der Höchstwert liegt bei 12:00 mit 7.',
    )
  })
})
