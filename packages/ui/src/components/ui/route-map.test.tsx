import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { RouteMap, type RouteMapRoute, type RouteMapStop } from './route-map'

const STOPS: RouteMapStop[] = [
  { id: 'a', name: 'Harbor depot', kind: 'origin', x: 10, y: 70, detail: 'Departed 09:14' },
  { id: 'b', name: 'Load 4821', kind: 'current', x: 40, y: 45, card: <p>47 min late</p> },
  { id: 'c', name: 'Ridge junction', x: 64, y: 30 },
  { id: 'd', name: 'Summit DC', kind: 'destination', x: 86, y: 18, detail: 'ETA 15:49' },
]
const ROUTES: RouteMapRoute[] = [
  { id: 'driven', status: 'done', path: ['a', [24, 60], 'b'] },
  { id: 'late', status: 'delayed', path: ['b', 'c'] },
  { id: 'ahead', path: ['c', 'd'] },
  { id: 'alt', status: 'proposed', label: 'Proposed via river road', path: ['b', [60, 60], 'd'] },
]

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('RouteMap', () => {
  test('is a named group whose stops are buttons named by place, kind and detail, in route order', () => {
    reduced(<RouteMap stops={STOPS} routes={ROUTES} />)
    const map = screen.getByRole('group', { name: 'Route map' })
    const markers = [...map.querySelectorAll('[data-slot=route-map-marker]')].map((el) => el.getAttribute('aria-label'))
    expect(markers).toEqual(['Harbor depot, Origin, Departed 09:14', 'Load 4821, Current position', 'Ridge junction, Stop', 'Summit DC, Destination, ETA 15:49'])
  })

  test('writes the routes and stops out as text, each route with its state and the stops it runs through', () => {
    reduced(<RouteMap stops={STOPS} routes={ROUTES} />)
    const summary = document.querySelector('[data-slot=route-map-summary]')!
    expect([...summary.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
      'Traveled: Harbor depot → Load 4821',
      'On time: Ridge junction → Summit DC',
      'Delayed: Load 4821 → Ridge junction',
      'Proposed via river road: Load 4821 → Summit DC',
    ])
    expect(document.querySelectorAll('[data-slot=route-map-stops] li')).toHaveLength(4)
  })

  test('draws each route in its state, with a legend of the states on the map', () => {
    reduced(<RouteMap stops={STOPS} routes={ROUTES} />)
    expect([...document.querySelectorAll('[data-slot=route-map-route]')].map((el) => el.getAttribute('data-status'))).toEqual(['done', 'on-time', 'delayed', 'proposed'])
    const legend = document.querySelector('[data-slot=route-map-legend]')!
    expect(legend).toHaveTextContent('Traveled')
    expect(legend).toHaveTextContent('Proposed via river road')
  })

  test('hides the legend on request and anchors cards beside their stop', () => {
    reduced(<RouteMap stops={STOPS} routes={ROUTES} legend={false} />)
    expect(document.querySelector('[data-slot=route-map-legend]')).toBeNull()
    const card = document.querySelector('[data-slot=route-map-card]')!
    expect(card).toHaveTextContent('47 min late')
    expect(card.closest('[data-slot=route-map-stop]')).toHaveAttribute('data-kind', 'current')
    expect(card).toHaveAttribute('data-side', 'right')
  })

  test('a stop with its own icon wears it on a disc in place of its dot', () => {
    const truck = <svg data-testid="truck" />
    reduced(<RouteMap stops={[...STOPS, { id: 'e', name: 'Load 4930', x: 70, y: 70, icon: truck }]} routes={ROUTES} />)
    const marker = screen.getByRole('button', { name: 'Load 4930, Stop' })
    expect(marker).toContainElement(screen.getByTestId('truck'))
    // The plain stops keep their dot.
    expect(screen.getByRole('button', { name: 'Ridge junction, Stop' }).querySelector('svg')).toBeNull()
  })

  test('pressing a marker picks its stop, and pressing it again lets go', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    reduced(<RouteMap stops={STOPS} routes={ROUTES} onValueChange={onValueChange} />)
    const ridge = screen.getByRole('button', { name: 'Ridge junction, Stop' })
    await user.click(ridge)
    expect(ridge).toHaveAttribute('aria-pressed', 'true')
    expect(onValueChange).toHaveBeenLastCalledWith('c')
    await user.click(ridge)
    expect(ridge).toHaveAttribute('aria-pressed', 'false')
    expect(onValueChange).toHaveBeenLastCalledWith(null)
  })

  test('drops waypoints that name no stop from the text, and keeps the map still under reduced motion', () => {
    reduced(<RouteMap stops={STOPS} routes={[{ id: 'x', path: ['a', 'missing', 'd'] }]} />)
    expect(document.querySelector('[data-slot=route-map-summary] li')).toHaveTextContent('On time: Harbor depot → Summit DC')
    expect(document.querySelector('[data-slot=route-map]')).toHaveAttribute('data-reduced-motion', 'true')
  })
})
