import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { de } from '@youj/core/locales/de'
import { Treemap, type TreemapItem } from './treemap'

const ITEMS: TreemapItem[] = [
  { id: 'styles', name: 'styles', value: 20 },
  { id: 'app', name: 'app', value: 50 },
  { id: 'dead', name: 'deleted', value: 0 },
  { id: 'vendor', name: 'vendor', value: 30 },
]
const kb = (v: number) => `${v} kB`
const reduced = (ui: React.ReactNode) => <YoujProvider reducedMotion="always">{ui}</YoujProvider>
const cells = () => screen.getAllByRole('listitem')

/** jsdom has no layout: place the cells as a squarified map of 50/30/20 would (app left, vendor top-right, styles below it). */
const RECTS: Record<string, [number, number, number, number]> = {
  app: [0, 0, 350, 200],
  vendor: [354, 0, 346, 118],
  styles: [354, 122, 346, 78],
}
function mockLayout() {
  return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const id = this.getAttribute('data-slot') === 'treemap-cell' ? this.getAttribute('aria-label')!.split(':')[0]! : ''
    const [x, y, w, h] = RECTS[id] ?? [0, 0, 700, 200]
    return { x, y, left: x, top: y, width: w, height: h, right: x + w, bottom: y + h, toJSON: () => ({}) } as DOMRect
  })
}

describe('Treemap', () => {
  test('is a named group holding a list, largest first, each part named with its value and share', () => {
    render(reduced(<Treemap items={ITEMS} formatValue={kb} label="Bundle" highlight="app" />))
    const group = screen.getByRole('group', { name: 'Bundle' })
    const list = within(group).getByRole('list')
    expect(within(list).getAllByRole('listitem').map((c) => c.getAttribute('aria-label'))).toEqual([
      'app: 50 kB, 50% of total, highlighted',
      'vendor: 30 kB, 30% of total',
      'styles: 20 kB, 20% of total',
    ])
  })

  test('leaves out parts at zero, and describes the whole', () => {
    render(reduced(<Treemap items={ITEMS} formatValue={kb} />))
    expect(screen.queryByText('deleted')).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Treemap' })).toHaveAccessibleDescription('3 parts, 100 kB in all. The largest is app, at 50%.')
  })

  test('marks highlighted cells and their tone for styling', () => {
    render(reduced(<Treemap items={[...ITEMS, { id: 'x', name: 'images', value: 10, tone: 'warning' }]} highlight={['vendor', 'x']} />))
    const [, vendor, , images] = cells()
    expect(vendor).toHaveAttribute('data-highlighted')
    expect(vendor).toHaveAttribute('data-tone', 'accent')
    expect(images).toHaveAttribute('data-tone', 'warning')
    expect(cells()[0]).not.toHaveAttribute('data-highlighted')
  })

  test('shows an empty state and no list when there is nothing to divide', () => {
    render(reduced(<Treemap items={[{ id: 'a', name: 'a', value: 0 }]} />))
    expect(screen.getByText('No data')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  test('one tab stop; arrows move to the nearest cell in that direction, Home and End to the ends', async () => {
    const layout = mockLayout()
    const user = userEvent.setup()
    render(reduced(<Treemap items={ITEMS} formatValue={kb} />))
    const [app, vendor, styles] = cells() as [HTMLElement, HTMLElement, HTMLElement]
    expect(cells().map((c) => c.tabIndex)).toEqual([0, -1, -1])
    await user.tab()
    expect(app).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(vendor).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(styles).toHaveFocus()
    expect(cells().map((c) => c.tabIndex)).toEqual([-1, -1, 0])
    await user.keyboard('{ArrowLeft}')
    expect(app).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(app).toHaveFocus()
    await user.keyboard('{End}')
    expect(styles).toHaveFocus()
    await user.keyboard('{Home}')
    expect(app).toHaveFocus()
    layout.mockRestore()
  })

  test('hovering a cell shows its name, value and share', async () => {
    const user = userEvent.setup()
    render(reduced(<Treemap items={ITEMS} formatValue={kb} />))
    await user.hover(cells()[1]!)
    await waitFor(() => expect(document.querySelector('[data-slot=treemap-tooltip]')).toHaveTextContent('vendor30 kB · 30% of total'))
  })

  test('speaks the provider’s language', () => {
    render(
      <YoujProvider reducedMotion="always" locale="de-DE" labels={de}>
        <Treemap items={ITEMS} formatValue={kb} highlight="styles" />
      </YoujProvider>,
    )
    expect(screen.getByRole('group', { name: 'Kacheldiagramm' })).toBeInTheDocument()
    expect(cells()[2]).toHaveAttribute('aria-label', 'styles: 20 kB, 20\u00a0% des Gesamtwerts, hervorgehoben')
  })
})
