import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { TieredCapacity } from './tiered-capacity'
import { REGIONS } from './tiered-capacity/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

/** The panel beside the drawing, which names the selected region. */
const detail = (container: HTMLElement) => container.querySelector('[data-slot=tiered-capacity-detail]') as HTMLElement

describe('TieredCapacity', () => {
  test('is a section named by an h2 by default, or a page named by an h1 with embedded={false}', () => {
    const { unmount } = reduced(<TieredCapacity embedded={false} />)
    expect(screen.getByRole('main', { name: 'Capacity' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Capacity' })).toBeInTheDocument()
    unmount()
    reduced(<TieredCapacity />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Capacity' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Capacity' })).toBeInTheDocument()
  })

  test('the drawing is a picture; every region’s figures are there as a table', () => {
    const { container } = reduced(<TieredCapacity />)
    const svg = container.querySelector('svg[data-slot=iso-scene]')!
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    const table = screen.getByRole('table', { name: 'Storage used by region and tier' })
    expect(
      within(table)
        .getAllByRole('rowheader')
        .map((th) => th.textContent),
    ).toEqual(REGIONS.map((r) => r.name))
    const frankfurt = within(table).getByRole('row', { name: /Frankfurt/ })
    expect(frankfurt).toHaveTextContent('460 TB (88%)')
    expect(frankfurt).toHaveTextContent('520 TB')
  })

  test('opens on the region nearest its ceiling, and says how many are near their limit', () => {
    const { container } = reduced(<TieredCapacity />)
    expect(screen.getByText('2 near limit')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'FRA, Frankfurt, 88% used' })).toHaveAttribute('aria-pressed', 'true')
    expect(detail(container)).toHaveTextContent('Frankfurt')
    expect(detail(container)).toHaveTextContent('Full in ~28 days')
  })

  test('arrow keys move along the regions, and the panel follows', async () => {
    const user = userEvent.setup()
    const { container } = reduced(<TieredCapacity />)
    const fra = screen.getByRole('button', { name: /^FRA/ })
    fra.focus()
    await user.keyboard('{ArrowRight}')
    const iad = screen.getByRole('button', { name: /^IAD/ })
    expect(iad).toHaveFocus()
    expect(iad).toHaveAttribute('aria-pressed', 'true')
    expect(fra).toHaveAttribute('aria-pressed', 'false')
    expect(detail(container)).toHaveTextContent('Ashburn')
    expect(detail(container)).toHaveTextContent('562 TB')
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(detail(container)).toHaveTextContent('São Paulo')
  })

  test('pointing at a column selects it and dims the rest while you look', () => {
    const { container } = reduced(<TieredCapacity />)
    const scene = container.querySelector('svg[data-slot=iso-scene]')!
    fireEvent.pointerEnter(scene)
    fireEvent.pointerEnter(container.querySelector('[data-region=syd]')!)
    expect(detail(container)).toHaveTextContent('Sydney')
    expect(container.querySelector('[data-region=syd]')).toHaveAttribute('data-selected')
    expect((container.querySelector('[data-region=fra]') as SVGGElement).style.opacity).toBe('0.32')
    fireEvent.pointerLeave(scene)
    expect((container.querySelector('[data-region=fra]') as SVGGElement).style.opacity).toBe('1')
    // The selection stays where the pointer left it.
    expect(detail(container)).toHaveTextContent('Sydney')
  })

  test('a region past its ceiling reads as over the limit', () => {
    const over = REGIONS.map((r) => (r.id === 'fra' ? { ...r, used: { hot: 96, warm: 170, cold: 300 } } : r))
    const { container } = reduced(<TieredCapacity regions={over} />)
    expect(screen.getByText('1 over limit')).toBeInTheDocument()
    expect(detail(container)).toHaveTextContent('109% used')
    expect(detail(container)).toHaveTextContent('46 TB over')
  })

  test('Add capacity provisions a step more for the selected region and says so', async () => {
    const user = userEvent.setup()
    const onAddCapacity = vi.fn()
    const { container } = reduced(<TieredCapacity onAddCapacity={onAddCapacity} />)
    await user.click(screen.getByRole('button', { name: 'Add capacity' }))
    expect(onAddCapacity).toHaveBeenCalledWith(expect.objectContaining({ id: 'fra' }), 100)
    await waitFor(() => expect(detail(container)).toHaveTextContent('of 620 TB provisioned'))
    expect(screen.getByText('Added 100 TB to Frankfurt')).toHaveAttribute('role', 'status')
    // 460 of 620 is no longer near the limit: one region is left there.
    expect(screen.getByText('1 near limit')).toBeInTheDocument()
  })

  test('under reduced motion the columns stand from the start: nothing waits hidden to drop in', () => {
    const { container } = reduced(<TieredCapacity />)
    for (const g of container.querySelectorAll('svg[data-slot=iso-scene] g')) expect((g as SVGGElement).style.opacity).not.toBe('0')
  })

  test('with motion, the columns wait out of sight to drop in when the chart is seen', () => {
    const { container } = render(
      <YoujProvider reducedMotion="never">
        <TieredCapacity />
      </YoujProvider>,
    )
    const pieces = [...container.querySelectorAll('svg[data-slot=iso-scene] > g')].filter((g) => (g as SVGGElement).style.opacity === '0')
    expect(pieces.length).toBeGreaterThan(REGIONS.length)
  })

  test('every string can be rewritten, numbers follow the locale', () => {
    reduced(
      <TieredCapacity
        copy={{
          locale: 'de-DE',
          title: 'Kapazität',
          subtitle: (n) => `Objektspeicher · ${n} Regionen`,
          nearLimit: (n) => `${n} nahe am Limit`,
          addCapacity: 'Kapazität hinzufügen',
          ofProvisioned: (size) => `von ${size} bereitgestellt`,
        }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Kapazität' })).toBeInTheDocument()
    expect(screen.getByText('Objektspeicher · 6 Regionen')).toBeInTheDocument()
    expect(screen.getByText('2 nahe am Limit')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kapazität hinzufügen' })).toBeInTheDocument()
    expect(screen.getByText('von 2,6 PB bereitgestellt')).toBeInTheDocument()
  })

  test('your tiers drive the key, the panel, the table and the units', () => {
    const { container } = reduced(
      <TieredCapacity
        tiers={[
          { id: 'ev', label: 'EV charging', tone: 'chart-1' },
          { id: 'std', label: 'Standard', tone: 'chart-2' },
        ]}
        format={(n) => `${n} spaces`}
        regions={[
          { id: 'p1', name: 'Level P1', provisioned: 200, used: { ev: 30, std: 120 }, growth: 0.5 },
          { id: 'p2', name: 'Level P2', provisioned: 200, used: { ev: 10, std: 60 }, growth: 0 },
        ]}
        copy={{ addStep: 20 }}
      />,
    )
    expect(
      within(screen.getByRole('list', { name: 'Tiers' }))
        .getAllByRole('listitem')
        .map((i) => i.textContent),
    ).toEqual(['EV charging', 'Standard', 'Provisioned'])
    expect(detail(container)).toHaveTextContent('150 spaces')
    expect(detail(container)).toHaveTextContent('of 200 spaces provisioned')
    expect(
      within(detail(container))
        .getAllByRole('term')
        .map((t) => t.textContent),
    ).toEqual(['EV charging', 'Standard'])
    const table = screen.getByRole('table', { name: 'Storage used by region and tier' })
    expect(within(table).getByRole('row', { name: /Level P2/ })).toHaveTextContent('10 spaces')
  })

  test('empty shows the message, loading holds the place, an error offers Retry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const empty = reduced(<TieredCapacity regions={[]} />)
    expect(screen.getByText('No regions yet')).toBeInTheDocument()
    expect(empty.container.querySelector('svg[data-slot=iso-scene]')).toBeNull()
    empty.unmount()
    const loading = reduced(<TieredCapacity loading />)
    expect(screen.getByText('Loading capacity')).toBeInTheDocument()
    expect(loading.container.querySelector('svg[data-slot=iso-scene]')).toBeNull()
    loading.unmount()
    reduced(<TieredCapacity error="Couldn’t load capacity." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load capacity.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('data that arrives after the first render replaces what was shown', () => {
    const { rerender } = reduced(<TieredCapacity regions={[]} />)
    rerender(
      <YoujProvider reducedMotion="always">
        <TieredCapacity />
      </YoujProvider>,
    )
    expect(screen.getByRole('button', { name: 'FRA, Frankfurt, 88% used' })).toHaveAttribute('aria-pressed', 'true')
  })
})
