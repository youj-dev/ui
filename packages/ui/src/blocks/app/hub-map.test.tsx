import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { HubMap } from './hub-map'
import { HUBS } from './hub-map/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const map = () => document.querySelector<HTMLElement>('[data-slot="hub-map-canvas"]')!
const detail = () => document.querySelector<HTMLElement>('[data-slot="hub-map-detail"]')!

/** Every observed element reports as on screen, so the map draws itself in and the demo can run. */
function inView() {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(private cb: IntersectionObserverCallback) {}
      observe = (el: Element) =>
        this.cb([{ isIntersecting: true, target: el, intersectionRatio: 1 } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
      unobserve() {}
      disconnect() {}
    },
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('HubMap', () => {
  test('leads with the totals, and opens on the hub behind schedule', () => {
    reduced(<HubMap live={false} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Hub network' })).toBeInTheDocument()
    expect(screen.getByText('8 of 9')).toBeInTheDocument()
    const hubs = within(screen.getByRole('radiogroup', { name: 'Hubs' })).getAllByRole('radio')
    expect(hubs).toHaveLength(9)
    const picked = screen.getByRole('radio', { checked: true })
    expect(picked).toHaveAccessibleName('GRU, São Paulo, Delayed, 9.4K/h, 81.2% on time')
    expect(picked).toHaveAttribute('tabindex', '0')
    expect(within(detail()).getByText('Delayed')).toBeInTheDocument()
    expect(within(detail()).getByText('81.2%')).toBeInTheDocument()
    expect(within(detail()).getByText('2.1K')).toBeInTheDocument()
  })

  test('arrow keys walk the hubs west to east, wrapping, and Home and End jump to the ends', async () => {
    const user = userEvent.setup()
    reduced(<HubMap live={false} defaultHub="ANC" />)
    act(() => screen.getByRole('radio', { checked: true }).focus())
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: /^MEM/ })).toHaveFocus()
    expect(screen.getByRole('radio', { name: /^MEM/ })).toBeChecked()
    expect(within(detail()).getByText('Memphis')).toBeInTheDocument()
    await user.keyboard('{End}')
    expect(screen.getByRole('radio', { name: /^SYD/ })).toBeChecked()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: /^ANC/ })).toBeChecked()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('radio', { name: /^SYD/ })).toHaveFocus()
  })

  test('the picked hub’s lanes pick the hub at their other end', async () => {
    const user = userEvent.setup()
    reduced(<HubMap live={false} defaultHub="MEM" />)
    const lanes = within(detail()).getAllByRole('button')
    // Busiest first: out to Leipzig, in from Anchorage, out to São Paulo.
    expect(lanes.map((b) => b.getAttribute('aria-label'))).toEqual([
      'to LEJ, 11.8K/h, Transit 11h',
      'from ANC, 8.6K/h, Transit 6h',
      'to GRU, 3.9K/h, Transit 13h',
    ])
    await user.click(lanes[0]!)
    expect(screen.getByRole('radio', { name: /^LEJ/ })).toBeChecked()
    expect(within(detail()).getByText('Leipzig')).toBeInTheDocument()
  })

  test('the metric control swaps what the map shows beside each hub', async () => {
    const user = userEvent.setup()
    reduced(<HubMap live={false} />)
    expect(map()).toHaveTextContent('MEM62.4K')
    await user.click(screen.getByRole('button', { name: 'Delays' }))
    expect(map()).toHaveTextContent('MEM820')
  })

  test('Divert sends the picked hub’s parcels through its peers, says so, and Resume brings them back', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    reduced(<HubMap live={false} defaultHub="MEM" onAction={onAction} />)
    await user.click(screen.getByRole('button', { name: 'Divert to peers' }))
    await waitFor(() => expect(within(detail()).getByText('Diverted')).toBeInTheDocument())
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ id: 'MEM' }), true)
    expect(screen.getByText('MEM diverted. Its parcels are rerouting through nearby hubs.')).toHaveAttribute('role', 'status')
    expect(screen.getByText('7 of 9')).toBeInTheDocument()
    // Its peers took the parcels: Leipzig now sorts more than it did.
    expect(screen.getByRole('radio', { name: /^LEJ/ }).getAttribute('aria-label')).not.toContain('38.6K')
    await user.click(await screen.findByRole('button', { name: 'Resume intake' }))
    await waitFor(() => expect(within(detail()).getByText('On schedule')).toBeInTheDocument())
    expect(onAction).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'MEM' }), false)
  })

  test('reduced motion draws direction as chevrons and runs no parcels', () => {
    inView()
    reduced(<HubMap live={false} />)
    expect(map()).toHaveAttribute('data-reduced-motion')
    expect(map().querySelector('animateMotion')).toBeNull()
    expect(map().querySelectorAll('.kh-arc path[transform]').length).toBe(9)
  })

  test('with motion, parcels run along every lane once the map is on screen, fewer on a slow device', () => {
    inView()
    const { unmount } = render(
      <YoujProvider reducedMotion="never" quality="high">
        <HubMap live={false} />
      </YoujProvider>,
    )
    expect(map()).toHaveAttribute('data-shown')
    expect(map()).not.toHaveAttribute('data-reduced-motion')
    // Paused (Live off) but drawn: one, plus one at 5K and one at 9K parcels an hour, per lane.
    expect(map().querySelectorAll('animateMotion').length).toBe(16)
    expect(map()).toHaveAttribute('data-paused')
    unmount()
    // The low tier sends one parcel per lane.
    render(
      <YoujProvider reducedMotion="never" quality="low">
        <HubMap live={false} />
      </YoujProvider>,
    )
    expect(map().querySelectorAll('animateMotion').length).toBe(9)
  })

  test('live, the demo figures drift on a timer under a Demo data marker, which stops on unmount', () => {
    vi.useFakeTimers()
    inView()
    const { unmount } = render(
      <YoujProvider reducedMotion="always">
        <HubMap />
      </YoujProvider>,
    )
    expect(screen.getByText('Demo data')).toBeInTheDocument()
    const before = screen.getByRole('radio', { name: /^MEM/ }).getAttribute('aria-label')
    act(() => vi.advanceTimersByTime(2600))
    expect(screen.getByRole('radio', { name: /^MEM/ }).getAttribute('aria-label')).not.toBe(before)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  test('your hubs show as given: no drift and no marker', () => {
    vi.useFakeTimers()
    inView()
    render(
      <YoujProvider reducedMotion="always">
        <HubMap hubs={HUBS} />
      </YoujProvider>,
    )
    expect(screen.queryByText('Demo data')).toBeNull()
    const before = screen.getByRole('radio', { name: /^MEM/ }).getAttribute('aria-label')
    act(() => vi.advanceTimersByTime(2600 * 3))
    expect(screen.getByRole('radio', { name: /^MEM/ }).getAttribute('aria-label')).toBe(before)
    vi.useRealTimers()
  })

  test('embedded, it is a section named by an h2', () => {
    reduced(<HubMap embedded live={false} copy={{ title: 'Freight' }} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Freight' })).toBeInTheDocument()
    expect(screen.queryByRole('main')).toBeNull()
  })

  test('your statuses, metrics, thresholds and formats drive the legend, the map and the panel', async () => {
    const user = userEvent.setup()
    reduced(
      <HubMap
        live={false}
        statuses={[
          { id: 'up', label: 'Healthy', tone: 'success', healthy: true },
          { id: 'down', label: 'Down', tone: 'danger' },
        ]}
        metrics={[
          { id: 'traffic', label: 'Traffic', measure: 'volume' },
          { id: 'errors', label: 'Errors', measure: 'backlog' },
        ]}
        thresholds={{ health: 0.99 }}
        durationFormat={{ style: 'unit', unit: 'millisecond', maximumFractionDigits: 0 }}
        hubs={[
          { id: 'IAD', city: 'Virginia', lng: -77.4, lat: 39, volume: 1200, health: 0.995, backlog: 40, load: 0.5, status: 'up' },
          { id: 'BOM', city: 'Mumbai', lng: 72.9, lat: 19.1, volume: 400, health: 0.31, backlog: 3800, load: 0.1, status: 'down' },
        ]}
        lanes={[{ from: 'IAD', to: 'BOM', volume: 90, time: 118 }]}
        copy={{ action: 'Drain region', unit: ' Gbps', acted: 'Drained' }}
      />,
    )
    expect(
      within(screen.getByRole('list', { name: 'Legend' }))
        .getAllByRole('listitem')
        .slice(0, 2)
        .map((i) => i.textContent),
    ).toEqual(['Healthy', 'Down'])
    // Opens on the first hub that isn't healthy.
    expect(screen.getByRole('radio', { checked: true })).toHaveAccessibleName('BOM, Mumbai, Down, 400 Gbps, 31% on time')
    expect(screen.getByText('1 of 2')).toBeInTheDocument()
    expect(within(detail()).getByText('Down')).toBeInTheDocument()
    expect(within(detail()).getAllByRole('button')[0]).toHaveAccessibleName('from IAD, 90 Gbps, Transit 118 ms')
    expect(map()).toHaveTextContent('IAD1.2K')
    await user.click(screen.getByRole('button', { name: 'Errors' }))
    expect(map()).toHaveTextContent('BOM3.8K')
    expect(screen.getByRole('button', { name: 'Drain region' })).toBeInTheDocument()
  })

  test('empty shows the message, loading holds the place, an error offers Retry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const empty = reduced(<HubMap live={false} hubs={[]} lanes={[]} />)
    expect(screen.getByText('No hubs yet')).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup')).toBeNull()
    empty.unmount()
    const loading = reduced(<HubMap live={false} loading />)
    expect(screen.getByText('Loading the network')).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup')).toBeNull()
    loading.unmount()
    reduced(<HubMap live={false} error="Couldn’t load the network." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load the network.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
