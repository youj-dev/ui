import { act, fireEvent, render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { DotMap, type DotMapRegion } from './dot-map'

const REGIONS: DotMapRegion[] = [
  { id: 'fra', name: 'Frankfurt', lon: 8.68, lat: 50.11, value: 9_800 },
  { id: 'iad', name: 'Washington', lon: -77.04, lat: 38.9, value: 12_400 },
  { id: 'syd', name: 'Sydney', lon: 151.21, lat: -33.87, value: 1_900 },
]

const withMotion = (ui: React.ReactNode, reducedMotion: 'always' | 'never' = 'always') =>
  render(<YoujProvider reducedMotion={reducedMotion}>{ui}</YoujProvider>)

/** The canvas measures 1200 × 450 px, so one 3° cell is 10 px. */
function sizeCanvas(canvas: HTMLElement) {
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1200, height: 450, right: 1200, bottom: 450, x: 0, y: 0, toJSON: () => ({}) })
}

describe('DotMap', () => {
  test('is a labelled image described by a summary of its regions', () => {
    withMotion(<DotMap regions={REGIONS} label="Requests by region" formatValue={(v) => `${v} rps`} />)
    const map = screen.getByRole('img', { name: 'Requests by region' })
    expect(map).toHaveAccessibleDescription('3 regions marked. The largest is Washington, at 12400 rps.')
    // The drawing itself stays out of the accessibility tree.
    expect(map.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  test('falls back to the labels for its name, so a provider translates it', () => {
    render(
      <YoujProvider reducedMotion="always" labels={{ dotMap: 'Weltkarte' }}>
        <DotMap regions={REGIONS} />
      </YoujProvider>,
    )
    expect(screen.getByRole('img', { name: 'Weltkarte' })).toBeInTheDocument()
  })

  test('draws the land from the committed grid and a marker per region', () => {
    const { container } = withMotion(<DotMap regions={REGIONS} />)
    const land = container.querySelector('[data-slot="dot-map-land"]')!
    // 1,910 land cells, one round-capped segment each.
    expect(land.getAttribute('d')!.split('M')).toHaveLength(1911)
    expect(container.querySelectorAll('[data-slot="dot-map-region"]')).toHaveLength(3)
    expect(container.querySelectorAll('[data-slot="dot-map-lit"] circle').length).toBeGreaterThan(20)
  })

  test('the active region gets the crosshair tag with its name and value, and the others dim', () => {
    const { container } = withMotion(<DotMap regions={REGIONS} active="fra" formatValue={(v) => `${v / 1000}k`} />)
    expect(container.querySelector('[data-slot="dot-map-tag"]')).toHaveTextContent('Frankfurt9.8k')
    expect(container.querySelector('[data-slot="dot-map-region"][data-active]')).not.toBeNull()
    expect(container.querySelector('[data-slot="dot-map-canvas"]')).toHaveAttribute('data-active')
  })

  test('hovering the map reports the nearest region, and leaving it clears it', () => {
    const onActiveChange = vi.fn()
    withMotion(<DotMap regions={REGIONS} onActiveChange={onActiveChange} />)
    const canvas = screen.getByRole('img')
    sizeCanvas(canvas)
    // Frankfurt sits at column 62.9, row 9.3: 629 px, 93 px.
    fireEvent.pointerMove(canvas, { clientX: 632, clientY: 96 })
    expect(onActiveChange).toHaveBeenLastCalledWith('fra')
    // Mid-Atlantic: nothing within reach.
    fireEvent.pointerMove(canvas, { clientX: 400, clientY: 250 })
    expect(onActiveChange).toHaveBeenLastCalledWith(null)
    fireEvent.pointerMove(canvas, { clientX: 632, clientY: 96 })
    fireEvent.pointerLeave(canvas)
    expect(onActiveChange).toHaveBeenLastCalledWith(null)
  })

  test('each change to a region’s value sends one pulse from it, and only from it', () => {
    // The map counts as on screen, so it reveals and pulses as it would in a browser.
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private callback: IntersectionObserverCallback) {}
        observe(target: Element) {
          this.callback([{ isIntersecting: true, intersectionRatio: 1, target } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
        }
        unobserve() {}
        disconnect() {}
        takeRecords() {
          return []
        }
      },
    )
    const view = (regions: DotMapRegion[]) => (
      <YoujProvider reducedMotion="never">
        <DotMap regions={regions} />
      </YoujProvider>
    )
    const { container, rerender } = render(view(REGIONS))
    expect(container.querySelectorAll('[data-slot="dot-map-pulse"]')).toHaveLength(0)
    act(() => rerender(view(REGIONS.map((r) => (r.id === 'fra' ? { ...r, value: 11_000 } : r)))))
    const pulses = container.querySelectorAll('[data-slot="dot-map-pulse"]')
    expect(pulses).toHaveLength(1)
    expect(pulses[0]!.closest('[data-slot="dot-map-region"]')).toBe(container.querySelectorAll('[data-slot="dot-map-region"]')[0])
    // The same values again: no new pulse.
    act(() => rerender(view(REGIONS.map((r) => (r.id === 'fra' ? { ...r, value: 11_000 } : r)))))
    expect(container.querySelectorAll('[data-slot="dot-map-pulse"]')).toHaveLength(1)
    vi.unstubAllGlobals()
  })

  test('reduced motion sends no pulses', () => {
    const { container, rerender } = withMotion(<DotMap regions={REGIONS} />)
    const next = REGIONS.map((r) => ({ ...r, value: r.value * 2 }))
    act(() => rerender(<YoujProvider reducedMotion="always"><DotMap regions={next} /></YoujProvider>))
    expect(container.querySelectorAll('[data-slot="dot-map-pulse"]')).toHaveLength(0)
    expect(container.querySelector('[data-slot="dot-map"]')).toHaveAttribute('data-reduced-motion')
  })

  test('stays west to east in RTL, and draws the grid alone with no regions', () => {
    const { container } = render(
      <div dir="rtl">
        <YoujProvider reducedMotion="always">
          <DotMap />
        </YoujProvider>
      </div>,
    )
    expect(screen.getByRole('img', { name: 'World map' })).toHaveAttribute('dir', 'ltr')
    expect(container.querySelector('[data-slot="dot-map-summary"]')).toBeNull()
    expect(container.querySelector('[data-slot="dot-map-land"]')).not.toBeNull()
  })
})
