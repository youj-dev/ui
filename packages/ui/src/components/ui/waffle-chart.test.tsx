import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { de } from '@youj/core/locales/de'
import { WaffleChart, type WaffleChartItem } from './waffle-chart'

const ITEMS: WaffleChartItem[] = [
  { id: 'trim', name: 'Produce trim', value: 5 },
  { id: 'gone', name: 'Nothing', value: 0 },
  { id: 'bread', name: 'Bread', value: 3, tone: 'warning' },
  { id: 'dairy', name: 'Dairy', value: 2 },
]
const kg = (v: number) => `${v} kg`
const reduced = (ui: React.ReactNode) => <YoujProvider reducedMotion="always">{ui}</YoujProvider>
const cells = () => [...document.querySelectorAll('[data-slot=waffle-chart-cell]')]
const filledBy = (tone: string) => cells().filter((c) => c.getAttribute('data-state') === 'on' && c.getAttribute('data-tone') === tone)
const legend = () => screen.getAllByRole('listitem')

describe('WaffleChart', () => {
  test('is a named group described by its parts, with a legend naming each value and share', () => {
    render(reduced(<WaffleChart items={ITEMS} formatValue={kg} label="Waste" />))
    const group = screen.getByRole('group', { name: 'Waste' })
    expect(group).toHaveAccessibleDescription('3 parts, 10 kg in all. The largest is Produce trim, at 50%.')
    expect(
      within(group)
        .getAllByRole('listitem')
        .map((i) => i.getAttribute('aria-label')),
    ).toEqual(['Produce trim: 5 kg, 50% of total', 'Bread: 3 kg, 30% of total', 'Dairy: 2 kg, 20% of total'])
  })

  test('fills one cell per unit in each part’s tone, the chart colors by default', () => {
    render(reduced(<WaffleChart items={ITEMS} columns={5} rows={4} />))
    expect(cells()).toHaveLength(20)
    expect(filledBy('chart-1')).toHaveLength(5)
    expect(filledBy('warning')).toHaveLength(3)
    expect(filledBy('chart-3')).toHaveLength(2)
    expect(cells().filter((c) => c.getAttribute('data-state') === 'off')).toHaveLength(10)
  })

  test('a shared ChartConfig colors an item without a tone of its own', () => {
    render(reduced(<WaffleChart items={ITEMS} config={{ trim: { color: 'var(--color-chart-3)' }, bread: { color: 'var(--color-chart-5)' } }} />))
    const swatches = legend().map((item) => (item as HTMLElement).style.getPropertyValue('--waffle-chart-tone'))
    expect(swatches).toEqual(['var(--color-chart-3)', 'var(--color-warning)', 'var(--color-chart-3)'])
  })

  test('rows fill from the top-start corner, part after part', () => {
    render(reduced(<WaffleChart items={ITEMS} columns={5} rows={2} />))
    expect(cells().map((c) => c.getAttribute('data-tone') ?? '-')).toEqual([
      ...Array(5).fill('chart-1'),
      ...Array(3).fill('warning'),
      ...Array(2).fill('chart-3'),
    ])
  })

  test('grows the grid to hold every cell, and counts a cell as `unit`', () => {
    render(reduced(<WaffleChart items={[{ id: 'a', name: 'a', value: 120 }]} unit={10} columns={5} rows={1} />))
    expect(cells()).toHaveLength(15)
    expect(filledBy('chart-1')).toHaveLength(12)
  })

  test('a cluster fills the same number of cells, with empty room around, in hexagons', () => {
    render(reduced(<WaffleChart items={ITEMS} layout="cluster" shape="hex" columns={8} rows={6} />))
    expect(cells()).toHaveLength(48)
    expect(cells()[0]!.tagName.toLowerCase()).toBe('path')
    expect(filledBy('chart-1')).toHaveLength(5)
    expect(cells()[0]).toHaveAttribute('data-state', 'off')
  })

  test('focusing a part lights it; the arrows walk the parts and Escape lets go', async () => {
    const user = userEvent.setup()
    render(reduced(<WaffleChart items={ITEMS} />))
    expect(legend().map((i) => i.tabIndex)).toEqual([0, -1, -1])
    await user.tab()
    expect(legend()[0]).toHaveFocus()
    expect(legend()[0]).toHaveAttribute('data-active')
    await user.keyboard('{ArrowRight}')
    expect(legend()[1]).toHaveFocus()
    expect(legend()[1]).toHaveAttribute('data-active')
    expect(filledBy('chart-1').every((c) => c.getAttribute('class')?.includes('opacity-25'))).toBe(true)
    await user.keyboard('{End}')
    expect(legend()[2]).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(legend()[2]).not.toHaveAttribute('data-active')
  })

  test('hovering a cell lights its part in the legend', () => {
    render(reduced(<WaffleChart items={ITEMS} />))
    fireEvent.pointerEnter(filledBy('warning')[0]!)
    expect(legend()[1]).toHaveAttribute('data-active')
    fireEvent.pointerLeave(filledBy('warning')[0]!)
    expect(legend()[1]).not.toHaveAttribute('data-active')
  })

  test('shows an empty state when there is nothing to divide', () => {
    render(reduced(<WaffleChart items={[{ id: 'a', name: 'a', value: 0 }]} />))
    expect(screen.getByText('No data')).toBeInTheDocument()
    expect(cells()).toHaveLength(0)
  })

  test('speaks the provider’s language', () => {
    render(
      <YoujProvider reducedMotion="always" locale="de-DE" labels={de}>
        <WaffleChart items={ITEMS} formatValue={kg} />
      </YoujProvider>,
    )
    expect(screen.getByRole('group', { name: 'Waffeldiagramm' })).toBeInTheDocument()
    expect(legend()[0]).toHaveAttribute('aria-label', 'Produce trim: 5 kg, 50 % des Gesamtwerts')
  })
})
