import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { CellBar, type CellBarCell } from './cell-bar'

const CELLS: CellBarCell[] = [
  { label: 'Jan', value: 100 },
  { label: 'Feb', value: 300 },
  { label: 'Mar', value: 100, projected: true },
]
const usd = (v: number) => `$${v}`
const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const cells = () => within(screen.getByRole('list')).getAllByRole('listitem')

describe('CellBar', () => {
  test('is a named group described by its total, projected part and target; each cell reads its period and amount', () => {
    reduced(<CellBar cells={CELLS} target={450} formatValue={usd} label="Spend" />)
    expect(screen.getByRole('group', { name: 'Spend' })).toHaveAccessibleDescription('$500 in all. $100 of it projected. Target $450.')
    expect(cells().map((c) => c.getAttribute('aria-label'))).toEqual(['Jan: $100', 'Feb: $300', 'Mar: $100, projected'])
  })

  test('each cell is as wide as its amount, the bar as long as the total on the shared scale; projected cells are hatched', () => {
    reduced(<CellBar cells={CELLS} max={1000} target={450} />)
    expect(cells().map((c) => c.style.flex)).toEqual(['100 1 0%', '300 1 0%', '100 1 0%'])
    expect(document.querySelector<HTMLElement>('[data-slot=cell-bar-cells]')!.style.width).toBe('50%')
    expect(document.querySelector<HTMLElement>('[data-slot=cell-bar-target]')!.style.insetInlineStart).toBe('45%')
    expect(cells()[2]).toHaveAttribute('data-yj-projected')
    expect(cells()[2]!.querySelector('[data-slot=hatch]')).not.toBeNull()
    expect(cells()[0]!.querySelector('[data-slot=hatch]')).toBeNull()
  })

  test('is one tab stop: the arrows walk the cells, Home and End go to the ends', async () => {
    const user = userEvent.setup()
    reduced(<CellBar cells={CELLS} formatValue={usd} />)
    await user.tab()
    expect(document.activeElement).toBe(cells()[0])
    expect(cells().filter((c) => c.tabIndex === 0)).toHaveLength(1)
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(cells()[1])
    await user.keyboard('{End}')
    expect(document.activeElement).toBe(cells()[2])
    await user.keyboard('{Home}')
    expect(document.activeElement).toBe(cells()[0])
  })

  test('captions write each cell’s label and amount under it, and a target can be named', () => {
    reduced(<CellBar cells={CELLS} captions target={450} targetLabel="Plan" formatValue={usd} />)
    expect([...document.querySelectorAll('[data-slot=cell-bar-caption]')].map((c) => c.textContent)).toEqual(['Jan$100', 'Feb$300', 'Mar$100'])
    expect(screen.getByText('Plan')).toBeInTheDocument()
  })

  test('the labels translate its built-in text', () => {
    render(
      <YoujProvider reducedMotion="always" labels={{ cellBar: 'Zellen', cellBarSummary: (total) => `Insgesamt ${total}.` }}>
        <CellBar cells={[{ label: 'Jan', value: 5 }]} />
      </YoujProvider>,
    )
    expect(screen.getByRole('group', { name: 'Zellen' })).toHaveAccessibleDescription('Insgesamt 5.')
  })
})
