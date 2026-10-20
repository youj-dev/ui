import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { LoopRoute } from './loop-route'
import { LOOP, LOOP_LENGTH, pointAt, stopStates, type LoopRouteStop } from './loop-route/loop'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const stop = (id: string, position: number, cargo = 1): LoopRouteStop => ({ id, name: id, position, cargo, eta: 1 })

describe('route loop geometry', () => {
  test('position 0 is on the top edge, the end of the top edge is a quarter of its way, and halfway round is the bottom right', () => {
    const { radius: R, width: W, height: H } = LOOP
    expect(pointAt(0)).toMatchObject({ x: R, y: 0, nx: 0, ny: -1 })
    const top = (W - 2 * R) / LOOP_LENGTH
    expect(pointAt(top)).toMatchObject({ x: W - R, y: 0 })
    expect(pointAt(0.5)).toMatchObject({ x: W - R, y: H, nx: 0, ny: 1 })
    expect(pointAt(1)).toEqual(pointAt(0))
    expect(pointAt(-0.25)).toEqual(pointAt(0.75))
  })

  test('the right edge points out to the right and the corners point diagonally out', () => {
    const { radius: R, width: W } = LOOP
    const side = pointAt((W - 2 * R + (Math.PI * R) / 2 + 10) / LOOP_LENGTH)
    expect(side).toMatchObject({ x: W, nx: 1, ny: 0 })
    const corner = pointAt((W - 2 * R + (Math.PI * R) / 4) / LOOP_LENGTH)
    expect(corner.nx).toBeCloseTo(0.71, 1)
    expect(corner.ny).toBeCloseTo(-0.71, 1)
  })
})

describe('stop states', () => {
  test('behind the tugger is done, the first ahead is next, the rest upcoming, and a skipped stop stays skipped', () => {
    const stops = [stop('c', 0.6), stop('a', 0.1), stop('b', 0.4), stop('d', 0.8)]
    const states = stopStates(stops, 0.45, new Set(['d']))
    expect([...states]).toEqual([
      ['a', 'done'],
      ['b', 'done'],
      ['c', 'next'],
      ['d', 'skipped'],
    ])
    expect(stopStates(stops, 0.45, new Set(['c'])).get('d')).toBe('next')
  })
})

describe('loop route block', () => {
  test('says the loop, the bins on board and the next stop, as a section named by an h2', () => {
    reduced(<LoopRoute />)
    expect(screen.getByRole('heading', { level: 2, name: 'Milk run' })).toBeInTheDocument()
    expect(screen.getByText('Loop 3 of 8')).toBeInTheDocument()
    expect(screen.getByText('7 bins on board')).toBeInTheDocument()
    expect(screen.getByText('Weld 2 3 min')).toBeInTheDocument()
    expect(screen.getByText('On route')).toBeInTheDocument()
  })

  test('the map has a text equivalent and the list gives each stop its bins and arrival', () => {
    reduced(<LoopRoute />)
    expect(screen.getByRole('img')).toHaveAccessibleName('Route map: 3 of 6 stops done, 7 bins on board')
    const list = screen.getByRole('list')
    const rows = within(list).getAllByRole('listitem')
    expect(rows).toHaveLength(3)
    expect(rows[0]).toHaveTextContent('Weld 2, next stop2 bins3 min')
    expect(rows[2]).toHaveTextContent('Assy, upcoming4 bins11 min')
  })

  test('Skip stop leaves the next stop out and reports it', async () => {
    const user = userEvent.setup()
    const onSkip = vi.fn()
    reduced(<LoopRoute onSkip={onSkip} />)
    await user.click(screen.getByRole('button', { name: 'Skip stop' }))
    expect(onSkip).toHaveBeenCalledWith(expect.objectContaining({ id: 'weld-2' }))
    expect(screen.getByText('Paint 7 min')).toBeInTheDocument()
    expect(screen.getByText('5 bins on board')).toBeInTheDocument()
  })

  test('Rush delivery awaits the callback, then the card says it is rushing', async () => {
    const user = userEvent.setup()
    const onRush = vi.fn()
    reduced(<LoopRoute onRush={onRush} />)
    await user.click(screen.getByRole('button', { name: 'Rush delivery' }))
    expect(onRush).toHaveBeenCalledWith(expect.objectContaining({ id: 'weld-2' }))
    expect(await screen.findByText('Rushing')).toBeInTheDocument()
  })

  test('with nothing left on the loop it says so and the actions are off', () => {
    reduced(<LoopRoute progress={0.95} />)
    expect(screen.getByText('No stops left on this loop.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Skip stop' })).toBeDisabled()
  })

  test('your stops, loop and words drive the content', () => {
    reduced(<LoopRoute copy={{ title: 'Supply run' }} loop={null} progress={0.1} stops={[stop('Dock', 0.05, 0), stop('Mill', 0.5, 3)]} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Supply run' })).toBeInTheDocument()
    expect(screen.queryByText(/Loop \d/)).not.toBeInTheDocument()
    expect(screen.getByText('3 bins on board')).toBeInTheDocument()
  })

  test('format.time and copy drive the times and the words', () => {
    reduced(
      <LoopRoute
        loopTime={40}
        format={{ time: (n) => `${n}′` }}
        copy={{ vehicle: 'Bus 9', cargo: (n) => `${n} kids`, onBoard: (n) => `${n} kids aboard` }}
        loop={null}
        progress={0.1}
        stops={[stop('Gate', 0.05, 0), stop('Elm', 0.5, 3)]}
      />,
    )
    expect(screen.getByText('Bus 9 · 40′ loop')).toBeInTheDocument()
    expect(screen.getByText('Elm 1′')).toBeInTheDocument()
    expect(screen.getByText('3 kids aboard')).toBeInTheDocument()
    expect(screen.getByRole('list')).toHaveTextContent('3 kids')
  })

  test('with no stops it shows the empty state instead of the map', () => {
    reduced(<LoopRoute stops={[]} />)
    expect(screen.getByText('No stops on this loop')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByText('On route')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Skip stop' })).toBeDisabled()
  })

  test('your empty node replaces the default message', () => {
    reduced(<LoopRoute stops={[]} empty={<p>Add a stop</p>} />)
    expect(screen.getByText('Add a stop')).toBeInTheDocument()
    expect(screen.queryByText('No stops on this loop')).not.toBeInTheDocument()
  })

  test('an error shows its message and Retry calls onRetry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<LoopRoute error="Couldn’t load the route." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load the route.')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByText('Weld 2', { exact: false })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('loading holds the map’s place and shows no demo stops', () => {
    reduced(<LoopRoute loading />)
    expect(screen.getByText('Loading the route')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByText('Weld 2', { exact: false })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rush delivery' })).toBeDisabled()
  })

  test('standalone draws a page with the title as the h1', () => {
    reduced(<LoopRoute embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Milk run' })).toBeInTheDocument()
  })
})
