import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ArcGlobe } from './arc-globe'
import { PLACES } from './arc-globe/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
/** What the block's live region last said (Stat tiles carry live regions of their own). */
const said = () =>
  screen
    .getAllByRole('status')
    .map((el) => el.textContent?.trim())
    .filter(Boolean)
    .join(' | ')
const countries = () => within(screen.getByRole('region', { name: 'Top countries' })).getAllByRole('button')

// jsdom has no 2D canvas: the globe skips drawing (and stays quiet about it).
let getContext: typeof HTMLCanvasElement.prototype.getContext
beforeAll(() => {
  getContext = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = (() => null) as typeof getContext
})
afterAll(() => {
  HTMLCanvasElement.prototype.getContext = getContext
})

describe('ArcGlobe', () => {
  test('is a section named by an h2 by default, or a page named by an h1 with embedded={false}', () => {
    const { unmount } = reduced(<ArcGlobe live={false} embedded={false} />)
    expect(screen.getByRole('main', { name: 'Global traffic' })).toBeInTheDocument()
    unmount()
    reduced(<ArcGlobe live={false} />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Global traffic' })).toBeInTheDocument()
  })

  test('the globe is a picture with a summary; every country’s figures are in a table', () => {
    const { container } = reduced(<ArcGlobe live={false} />)
    expect(screen.getByRole('img', { name: 'Globe of 20 countries, lit by visitors; the most come from United States.' })).toBeInTheDocument()
    expect(container.querySelector('canvas')).toHaveAttribute('aria-hidden')
    const table = screen.getByRole('table', { name: 'Visitors by country' })
    expect(within(table).getAllByRole('rowheader')).toHaveLength(PLACES.length)
    expect(within(table).getAllByRole('rowheader')[0]).toHaveTextContent('United States')
  })

  test('lists the regions as toggles and the six top countries, busiest first', () => {
    reduced(<ArcGlobe live={false} />)
    const regions = within(screen.getByRole('region', { name: 'Regions' })).getAllByRole('button')
    expect(regions.map((b) => b.textContent?.split(/\d/)[0])).toEqual([
      'North America',
      'Europe',
      'Asia-Pacific',
      'Latin America',
      'Middle East & Africa',
    ])
    expect(regions.every((b) => b.getAttribute('aria-pressed') === 'false')).toBe(true)
    expect(countries()).toHaveLength(6)
    expect(countries()[0]).toHaveAccessibleName(/^United States, \d+(\.\d)?% of visitors$/)
  })

  test('a region brings its countries forward and narrows the list to them', async () => {
    const user = userEvent.setup()
    reduced(<ArcGlobe live={false} />)
    const asia = screen.getByRole('button', { name: /Asia-Pacific/ })
    await user.click(asia)
    expect(asia).toHaveAttribute('aria-pressed', 'true')
    expect(countries().map((b) => b.textContent)).toEqual(expect.arrayContaining([expect.stringContaining('Japan')]))
    expect(countries().some((b) => b.textContent?.includes('United States'))).toBe(false)
    expect(said()).toMatch(/^Asia-Pacific: /)
    await user.click(asia)
    expect(asia).toHaveAttribute('aria-pressed', 'false')
  })

  test('pressing a country pins it and says its figures; pressing again lets go', async () => {
    const user = userEvent.setup()
    reduced(<ArcGlobe live={false} />)
    const japan = screen.getByRole('button', { name: /^Japan/ })
    await user.click(japan)
    expect(japan).toHaveAttribute('aria-pressed', 'true')
    expect(said()).toMatch(/^Japan: [\d.]+K visitors, [\d.]+% of traffic$/)
    await user.click(japan)
    expect(japan).toHaveAttribute('aria-pressed', 'false')
  })

  test('the period re-cuts every figure and is announced', async () => {
    const user = userEvent.setup()
    reduced(<ArcGlobe live={false} />)
    const before = screen.getByRole('button', { name: /North America/ }).textContent
    await user.click(screen.getByRole('button', { name: /Last 24 hours/ }))
    expect(screen.getByRole('button', { name: /Last 24 hours/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /North America/ }).textContent).not.toBe(before)
    expect(said()).toMatch(/^Last 24 hours: [\d.]+K visitors$/)
  })

  test('the site narrows every figure to its share of the traffic and is announced', async () => {
    const user = userEvent.setup()
    reduced(<ArcGlobe live={false} />)
    const before = countries()[0]!.textContent
    await user.click(screen.getByRole('combobox', { name: 'Site' }))
    await user.click(await screen.findByRole('option', { name: 'docs.fieldnote.app' }))
    expect(said()).toContain('Showing docs.fieldnote.app')
    expect(countries()[0]!.textContent).not.toBe(before)
  })

  describe('live', () => {
    let io: typeof IntersectionObserver
    beforeEach(() => {
      vi.useFakeTimers()
      io = globalThis.IntersectionObserver
      // On screen from the start, as the block would be in a browser.
      globalThis.IntersectionObserver = class {
        constructor(private readonly callback: IntersectionObserverCallback) {}
        observe(target: Element) {
          this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
        }
        unobserve() {}
        disconnect() {}
        takeRecords() {
          return []
        }
      } as unknown as typeof IntersectionObserver
    })
    afterEach(() => {
      globalThis.IntersectionObserver = io
      vi.useRealTimers()
    })

    test('visits land in batches: the feed fills with pages, cities and the regions that served them; Pause stops the stream and says so', () => {
      reduced(<ArcGlobe />)
      expect(screen.getByText('Waiting for the next visitor…')).toBeInTheDocument()
      act(() => vi.advanceTimersByTime(3000))
      const feed = screen.getByRole('list', { name: 'Latest visits' })
      const landed = within(feed).getAllByRole('listitem').length
      expect(landed).toBeGreaterThan(0)
      expect(within(feed).getAllByRole('listitem')[0]).toHaveTextContent(/^\/\S*.*(IAD|FRA|GRU|SIN).*\d+ pages?$/)
      const pause = screen.getByRole('button', { name: 'Pause live visitors' })
      expect(pause).toHaveAttribute('aria-pressed', 'true')
      fireEvent.click(pause)
      expect(screen.getByRole('button', { name: 'Resume live visitors' })).toHaveAttribute('aria-pressed', 'false')
      expect(said()).toContain('Live visitors paused')
      // Visits already in the air still land; nothing new is placed.
      act(() => vi.advanceTimersByTime(5000))
      const settled = within(feed)
        .getAllByRole('listitem')
        .map((li) => li.textContent)
      act(() => vi.advanceTimersByTime(10000))
      expect(
        within(feed)
          .getAllByRole('listitem')
          .map((li) => li.textContent),
      ).toEqual(settled)
    })

    test('unmounting clears the stream: no timer is left behind', () => {
      const { unmount } = reduced(<ArcGlobe />)
      act(() => vi.advanceTimersByTime(1500))
      unmount()
      expect(vi.getTimerCount()).toBe(0)
    })
  })

  test('every string can be rewritten, numbers follow the locale', () => {
    reduced(
      <ArcGlobe
        live={false}
        copy={{ locale: 'de-DE', title: 'Weltweiter Traffic', topPlaces: 'Top-Länder' }}
        regions={[
          { id: 'na', label: 'Nordamerika', tone: 'chart-1' },
          { id: 'eu', label: 'Europa', tone: 'chart-2' },
        ]}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Weltweiter Traffic' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Top-Länder' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Nordamerika/ })).toHaveTextContent('Mio.')
  })

  test('marks its simulated visits as demo data; your countries get no marker', () => {
    const demo = reduced(<ArcGlobe />)
    expect(screen.getByText('Demo data')).toBeInTheDocument()
    demo.unmount()
    reduced(<ArcGlobe places={PLACES} />)
    expect(screen.queryByText('Demo data')).toBeNull()
  })

  test('your regions, periods, sites and format drive the lists, the toggles and the figures', async () => {
    const user = userEvent.setup()
    reduced(
      <ArcGlobe
        live={false}
        places={[
          {
            id: 'LHR',
            name: 'London Heathrow',
            city: 'London',
            lng: -0.45,
            lat: 51.47,
            region: 'hub',
            volume: 900_000,
            weight: 1.2,
            servedBy: 'LHR',
          },
          { id: 'JFK', name: 'New York JFK', city: 'New York', lng: -73.8, lat: 40.64, region: 'hub', volume: 700_000, weight: 1.1, servedBy: 'LHR' },
          { id: 'NRT', name: 'Tokyo Narita', city: 'Tokyo', lng: 140.4, lat: 35.77, region: 'spoke', volume: 300_000, weight: 1.3, servedBy: 'LHR' },
        ]}
        regions={[
          { id: 'hub', label: 'Hubs', tone: 'chart-1' },
          { id: 'spoke', label: 'Spokes', tone: 'chart-3', lat: 35, lng: 140 },
        ]}
        periods={[
          { id: 'day', label: '1d', name: 'Today', days: 1, rate: { share: 0.12, change: -0.01 } },
          { id: 'month', label: '1m', name: 'This month', days: 30 },
        ]}
        sites={[
          { id: 'all', label: 'All airlines' },
          { id: 'ba', label: 'Skyline Air', share: 0.5 },
        ]}
        format={{ style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }}
        defaultPeriod="month"
        copy={{ rate: 'Delay rate', primary: 'Passengers' }}
      />,
    )
    expect(
      within(screen.getByRole('region', { name: 'Regions' }))
        .getAllByRole('button')
        .map((b) => b.textContent?.split(/[\d$]/)[0]),
    ).toEqual(['Hubs', 'Spokes'])
    expect(screen.getByRole('button', { name: /Hubs/ })).toHaveTextContent('$')
    expect(screen.getByRole('button', { name: /This month/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByText('Delay rate')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Today/ }))
    expect(screen.getByText('Delay rate')).toBeInTheDocument()
    expect(said()).toMatch(/^Today: \$/)
    await user.click(screen.getByRole('combobox', { name: 'Site' }))
    await user.click(await screen.findByRole('option', { name: 'Skyline Air' }))
    expect(said()).toContain('Showing Skyline Air')
  })

  test('your visits fill the feed and the table of arcs, while your places get no simulated stream', () => {
    reduced(
      <ArcGlobe
        places={[
          {
            id: 'LHR',
            name: 'London Heathrow',
            city: 'London',
            lng: -0.45,
            lat: 51.47,
            region: 'hub',
            volume: 900_000,
            weight: 1.2,
            servedBy: 'LHR',
            code: 'LHR',
          },
          { id: 'JFK', name: 'New York JFK', city: 'New York', lng: -73.8, lat: 40.64, region: 'hub', volume: 700_000, weight: 1.1, servedBy: 'LHR' },
        ]}
        regions={[{ id: 'hub', label: 'Hubs', tone: 'chart-1' }]}
        visits={[{ id: 1, from: 'JFK', to: 'LHR', label: 'BA 178', weight: 214, at: Date.UTC(2026, 9, 14, 9, 30) }]}
        copy={{ units: (n: number) => `${n} seats` }}
      />,
    )
    const feed = screen.getByRole('list', { name: 'Latest visits' })
    expect(within(feed).getAllByRole('listitem')).toHaveLength(1)
    expect(within(feed).getByRole('listitem')).toHaveTextContent(/BA 178.*New York.*LHR.*214 seats/)
    expect(screen.queryByText('Demo data')).toBeNull()
  })

  test('empty shows the message, loading holds the place, an error offers Retry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const empty = reduced(<ArcGlobe live={false} places={[]} />)
    expect(screen.getByText('Nothing to show yet')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /Globe of/ })).toBeNull()
    empty.unmount()
    const loading = reduced(<ArcGlobe live={false} loading />)
    expect(screen.getByText('Loading the globe')).toBeInTheDocument()
    expect(loading.container.querySelector('canvas')).toBeNull()
    loading.unmount()
    reduced(<ArcGlobe live={false} error="Couldn’t load the globe." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load the globe.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
