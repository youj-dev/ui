import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { RegionMap } from './region-map'
import { SNAPSHOTS } from './region-map/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const tag = () => document.querySelector('[data-slot="dot-map-tag"]')

describe('RegionMap', () => {
  test('shows the total, the map and every region busiest first, with the slow one marked', () => {
    reduced(<RegionMap live={false} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Traffic' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Requests by region on a world map' })).toHaveAccessibleDescription(
      '10 regions marked. The largest is iad, at 12.4K rps.',
    )
    const rows = within(screen.getByRole('table', { name: 'Regions' }))
      .getAllByRole('row')
      .slice(1)
    expect(rows).toHaveLength(10)
    expect(rows[0]).toHaveTextContent('iad Washington, D.C.21.5%12.4K38 ms')
    expect(rows[7]).toHaveTextContent('gru São Paulo')
    expect(within(rows[7]!).getByText('Slow')).toBeInTheDocument()
  })

  test('the table leads the map: focusing a region lights it on the map, and a click pins it', async () => {
    const user = userEvent.setup()
    reduced(<RegionMap live={false} />)
    expect(tag()).toBeNull()
    const frankfurt = screen.getByRole('button', { name: /^fra Frankfurt, show on the map/i })
    act(() => frankfurt.focus())
    expect(tag()).toHaveTextContent('fra9.8K rps')
    expect(frankfurt.closest('tr')).toHaveAttribute('data-active')
    await user.click(frankfurt)
    expect(frankfurt).toHaveAttribute('aria-pressed', 'true')
    act(() => frankfurt.blur())
    // Pinned, it stays lit after focus leaves.
    expect(tag()).toHaveTextContent('fra')
  })

  test('defaultRegion pins a region from the start, lit on the map, and a click lets it go', async () => {
    const user = userEvent.setup()
    reduced(<RegionMap live={false} defaultRegion="lhr" />)
    const london = screen.getByRole('button', { name: /^lhr London, show on the map/i })
    expect(london).toHaveAttribute('aria-pressed', 'true')
    expect(tag()).toHaveTextContent('lhr7.6K rps')
    await user.click(london)
    expect(london).toHaveAttribute('aria-pressed', 'false')
  })

  test('the range control swaps the snapshot', async () => {
    const user = userEvent.setup()
    reduced(<RegionMap live={false} />)
    await user.click(screen.getByRole('button', { name: '24H' }))
    expect(screen.getByText('edge network · last 24 hours')).toBeInTheDocument()
    // São Paulo is back under the slow line over the day.
    expect(screen.queryByText('Slow')).toBeNull()
  })

  test('Reroute traffic moves the slow region’s load and clears it', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    reduced(<RegionMap live={false} onAction={onAction} />)
    await user.click(screen.getByRole('button', { name: 'Reroute traffic' }))
    await waitFor(() => expect(screen.queryByText('Slow')).toBeNull())
    expect(onAction).toHaveBeenCalledWith([expect.objectContaining({ id: 'gru' })])
    expect(screen.getByText('10 regions')).toBeInTheDocument()
  })

  test('Live is a toggle, and embedded it becomes a section with an h2', async () => {
    const user = userEvent.setup()
    reduced(<RegionMap embedded live={false} copy={{ title: 'Edge' }} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Edge' })).toBeInTheDocument()
    expect(screen.queryByRole('main')).toBeNull()
    const live = screen.getByRole('button', { name: 'Live' })
    expect(live).toHaveAttribute('aria-pressed', 'false')
    await user.click(live)
    expect(live).toHaveAttribute('aria-pressed', 'true')
  })

  test('drifts only its demo regions, under a Demo data marker; your snapshots show as given', () => {
    vi.useFakeTimers()
    try {
      const demo = render(<RegionMap />)
      expect(screen.getByText('Demo data')).toBeInTheDocument()
      demo.unmount()
      render(<RegionMap snapshots={SNAPSHOTS} />)
      expect(screen.queryByText('Demo data')).toBeNull()
      const table = screen.getByRole('table').textContent
      act(() => vi.advanceTimersByTime(3200 * 3))
      expect(screen.getByRole('table').textContent).toBe(table)
    } finally {
      vi.useRealTimers()
    }
  })

  test('your ranges, snapshots, formats and words drive the figures and the labels', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    reduced(
      <RegionMap
        live={false}
        ranges={[
          { id: 'now', label: 'Now', name: 'right now', previous: 100 },
          { id: 'day', label: 'Day', name: 'today' },
        ]}
        snapshots={{
          now: [
            { id: 'pdx', city: 'Portland', lng: -122.7, lat: 45.5, value: 900, reading: 0.04, failures: 0.01 },
            { id: 'aus', city: 'Austin', lng: -97.7, lat: 30.3, value: 600, reading: 0.12, failures: 0.03 },
          ],
          day: [{ id: 'pdx', city: 'Portland', lng: -122.7, lat: 45.5, value: 400, reading: 0.05 }],
        }}
        format={{ style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }}
        readingFormat={{ style: 'percent', maximumFractionDigits: 1 }}
        threshold={0.08}
        copy={{ scope: 'US stores', unit: '/h', action: 'Ship stock', reading: 'Stockouts', flagged: 'Low stock' }}
        onAction={onAction}
      />,
    )
    expect(screen.getByText('US stores · right now')).toBeInTheDocument()
    const rows = within(screen.getByRole('table', { name: 'Regions' }))
      .getAllByRole('row')
      .slice(1)
    expect(rows[0]).toHaveTextContent('pdx Portland60%$900')
    expect(within(rows[1]!).getByText('Low stock')).toBeInTheDocument()
    expect(screen.getByText('Stockouts')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ship stock' }))
    expect(onAction).toHaveBeenCalledWith([expect.objectContaining({ id: 'aus' })])
    await user.click(screen.getByRole('button', { name: 'Day' }))
    expect(screen.getByText('US stores · today')).toBeInTheDocument()
    expect(screen.queryByText('Low stock')).toBeNull()
  })

  test('empty shows the message, loading holds the place, an error offers Retry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const empty = reduced(<RegionMap live={false} snapshots={{ '5m': [] }} />)
    expect(screen.getByText('No regions yet')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Requests by region on a world map' })).toBeNull()
    empty.unmount()
    const loading = reduced(<RegionMap live={false} loading />)
    expect(screen.getByText('Loading regions')).toBeInTheDocument()
    expect(screen.queryByRole('table', { name: 'Regions' })).toBeNull()
    loading.unmount()
    reduced(<RegionMap live={false} error="Couldn’t load the regions." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load the regions.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
