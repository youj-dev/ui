import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { BreakdownList, type BreakdownItem } from './breakdown-list'
import { ShareBar } from './share-bar'

const ITEMS: BreakdownItem[] = [
  { label: 'Direct', value: 600 },
  { label: 'Partners', value: 300, detail: 'Two resellers' },
  { label: 'Other', value: 100 },
]

describe('BreakdownList', () => {
  test('a list of rows, each with its name, value and share of the total', () => {
    render(<BreakdownList items={ITEMS} format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }} aria-label="By channel" />)
    const rows = within(screen.getByRole('list', { name: 'By channel' })).getAllByRole('listitem')
    expect(rows.map((r) => r.textContent)).toEqual(['Direct$60060%', 'PartnersTwo resellers$30030%', 'Other$10010%'])
  })

  test('shares are out of `total` when given, in the provider’s locale, with a decimal under 10%', () => {
    render(
      <YoujProvider locale="de-DE">
        <BreakdownList items={[{ label: 'A', value: 5 }, { label: 'B', value: 45 }]} total={200} />
      </YoujProvider>,
    )
    const shares = [...document.querySelectorAll('[data-slot=breakdown-list-share]')].map((s) => s.textContent)
    expect(shares).toEqual(['2,5 %', '23 %'])
  })

  test('markers take the chart colors in order, like ShareBar’s parts, and are decorative', () => {
    render(<BreakdownList items={[...ITEMS, { label: 'Own tone', value: 1, tone: 'danger' }]} />)
    const markers = [...document.querySelectorAll<HTMLElement>('[data-slot=breakdown-list-marker]')]
    expect(markers.map((m) => m.style.backgroundColor)).toEqual(['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-danger)'])
    for (const m of markers) expect(m).toHaveAttribute('aria-hidden', 'true')
  })

  test('the rows are one tab stop; arrows, Home and End move focus, and focus reports the active row', async () => {
    const onActiveChange = vi.fn()
    render(
      <>
        <BreakdownList items={ITEMS} onActiveChange={onActiveChange} />
        <button type="button">after</button>
      </>,
    )
    const rows = screen.getAllByRole('listitem')
    expect(rows.map((r) => r.tabIndex)).toEqual([0, -1, -1])
    await userEvent.tab()
    expect(rows[0]).toHaveFocus()
    expect(onActiveChange).toHaveBeenLastCalledWith(0)
    await userEvent.keyboard('{ArrowDown}')
    expect(rows[1]).toHaveFocus()
    expect(onActiveChange).toHaveBeenLastCalledWith(1)
    await userEvent.keyboard('{End}')
    expect(rows[2]).toHaveFocus()
    await userEvent.keyboard('{Home}')
    expect(rows[0]).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'after' })).toHaveFocus()
    expect(onActiveChange).toHaveBeenLastCalledWith(null)
    // Focus comes back to the row it left from.
    await userEvent.tab({ shift: true })
    expect(rows[1]).toHaveFocus()
  })

  test('hovering a row lights its segment in a paired ShareBar and quiets the rest', () => {
    function Paired() {
      const [active, setActive] = useState<number | null>(null)
      return (
        <>
          <ShareBar parts={ITEMS.map((item) => ({ value: item.value }))} active={active} />
          <BreakdownList items={ITEMS} active={active} onActiveChange={setActive} />
        </>
      )
    }
    render(<Paired />)
    const parts = () => [...document.querySelectorAll('[data-slot=share-bar-part]')].map((p) => p.getAttribute('data-state'))
    expect(parts()).toEqual([null, null, null])
    const rows = screen.getAllByRole('listitem')
    fireEvent.pointerEnter(rows[1]!)
    expect(parts()).toEqual(['inactive', 'active', 'inactive'])
    expect(rows[1]).toHaveAttribute('data-state', 'active')
    fireEvent.pointerLeave(rows[1]!.parentElement!)
    expect(parts()).toEqual([null, null, null])
  })

  test('tiles lead with the value', () => {
    render(<BreakdownList items={ITEMS} variant="tiles" showShare={false} />)
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent(/^600Direct$/)
    expect(document.querySelector('[data-slot=breakdown-list]')).toHaveAttribute('data-variant', 'tiles')
  })
})
