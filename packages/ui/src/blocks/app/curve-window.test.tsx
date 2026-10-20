import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { CurveWindow } from './curve-window'
import { SERIES } from './curve-window/data'
import { curvePath, endOf, endsInWindow, ticks, xOf, yOf, type Plot } from './curve-window/geometry'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const PLOT: Plot = { x0: 10, x1: 110, y0: 0, y1: 100, minX: 0, maxX: 50, minY: 0, maxY: 20 }

describe('curve window geometry', () => {
  test('angles run left to right and torque bottom to top across the plot', () => {
    expect(xOf(PLOT, 0)).toBe(10)
    expect(xOf(PLOT, 25)).toBe(60)
    expect(xOf(PLOT, 50)).toBe(110)
    expect(yOf(PLOT, 0)).toBe(100)
    expect(yOf(PLOT, 10)).toBe(50)
    expect(yOf(PLOT, 20)).toBe(0)
  })

  test('a curve is a polyline through its points, and ends where its last point is', () => {
    const points = [
      [0, 0],
      [25, 10],
      [50, 20],
    ] as const
    expect(curvePath(PLOT, points)).toBe('M10 100L60 50L110 0')
    expect(endOf(points)).toEqual([50, 20])
    expect(endOf([])).toEqual([0, 0])
  })

  test('a tightening passes when it ends inside the window, edges included', () => {
    const window = { xFrom: 34, xTo: 46, yFrom: 22, yTo: 28 }
    expect(endsInWindow([[38, 24.8]], window)).toBe(true)
    expect(endsInWindow([[34, 22]], window)).toBe(true)
    expect(endsInWindow([[47, 21.4]], window)).toBe(false)
    expect(endsInWindow([[40, 29]], window)).toBe(false)
  })

  test('a domain that starts above zero puts its lowest value on the bottom edge', () => {
    const raised: Plot = { x0: 0, x1: 100, y0: 0, y1: 100, minX: 0, maxX: 10, minY: 2, maxY: 4 }
    expect(yOf(raised, 2)).toBe(100)
    expect(yOf(raised, 3)).toBe(50)
    expect(ticks(4, 1, 2)).toEqual([2, 3, 4])
  })

  test('ticks run from zero by the step up to the max', () => {
    expect(ticks(60, 20)).toEqual([0, 20, 40, 60])
    expect(ticks(30, 10)).toEqual([0, 10, 20, 30])
  })

  test('the demo’s good curves end in the window and its failed one does not', () => {
    for (const bolt of SERIES)
      for (const curve of bolt.curves) expect(endsInWindow(curve.points, bolt.window)).toBe(curve.result === 'ok')
  })
})

describe('curve window block', () => {
  test('says the last tightening with its verdict and the failed count, as a section named by an h2', () => {
    reduced(<CurveWindow />)
    expect(screen.getByRole('heading', { level: 2, name: 'Tightening' })).toBeInTheDocument()
    expect(screen.getByText('1 NOK')).toBeInTheDocument()
    expect(screen.getByText('24.2')).toBeInTheDocument()
    expect(screen.getByText('Nm at 38°')).toBeInTheDocument()
    expect(screen.getByText('OK', { selector: '[data-slot=badge]' })).toBeInTheDocument()
  })

  test('picking a bolt shows its parts and a failed one gets a callout naming why', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    reduced(<CurveWindow onValueChange={onValueChange} />)
    expect(screen.queryByText('soft joint at 47°')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Bolt 2' }))
    expect(onValueChange).toHaveBeenCalledWith('bolt-2')
    expect(screen.getByText('Part 118 · 21.4 Nm')).toBeInTheDocument()
    expect(screen.getByText('soft joint at 47°')).toBeInTheDocument()
    expect(screen.getByText('24.8')).toBeInTheDocument()
  })

  test('the chart has a text equivalent and every part is listed with its result', () => {
    reduced(<CurveWindow defaultValue="bolt-2" />)
    expect(screen.getByRole('img')).toHaveAccessibleName('Bolt 2: torque against angle for the last 13 parts, 1 outside the pass window of 34–46° and 22–28 Nm')
    const parts = within(screen.getByRole('list', { name: 'Parts' })).getAllByRole('listitem')
    expect(parts).toHaveLength(13)
    expect(parts[10]).toHaveTextContent('Part 118: NOK, 21.4 Nm at 47°, soft joint at 47°')
  })

  test('your bolts, words and window drive the content', () => {
    reduced(
      <CurveWindow
        copy={{ title: 'Torque' }}
        series={[{ id: 'x', label: 'Bolt X', window: { xFrom: 10, xTo: 20, yFrom: 5, yTo: 9 }, curves: [{ id: 'P1', result: 'ok', points: [[0, 0], [15, 7.5]] }] }]}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Torque' })).toBeInTheDocument()
    expect(screen.getByText('All OK')).toBeInTheDocument()
    expect(screen.getByText('7.5')).toBeInTheDocument()
  })

  test('your axes drive the ticks, the headline and the text alternative', () => {
    reduced(
      <CurveWindow
        axes={{
          x: { label: 'capacity', unit: 'mAh', domain: [0, 3000], step: 1000, format: (v) => `${v} mAh` },
          y: { label: 'voltage', unit: 'V', domain: [0, 4], step: 2, format: (v) => `${v.toFixed(2)} V` },
        }}
        copy={{ callout: (id, y) => `${id} drew ${y}` }}
        series={[
          {
            id: 'a',
            label: 'Cell A',
            window: { xFrom: 2500, xTo: 3000, yFrom: 3, yTo: 3.5 },
            curves: [
              { id: 'R1', result: 'ok', points: [[0, 4], [2800, 3.2]] },
              { id: 'R2', result: 'nok', note: 'sagged', points: [[0, 4], [2000, 2.9]] },
            ],
          },
        ]}
      />,
    )
    expect(screen.getByText('2.90 V')).toBeInTheDocument()
    expect(screen.getByText('at 2000 mAh')).toBeInTheDocument()
    expect(screen.getByText('R2 drew 2.90 V')).toBeInTheDocument()
    expect(screen.getByText('1000 mAh')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAccessibleName('Cell A: voltage against capacity for the last 2 parts, 1 outside the pass window of 2500 mAh–3000 mAh and 3.00 V–3.50 V')
  })

  test('with no series it shows the empty state instead of the chart', () => {
    reduced(<CurveWindow series={[]} />)
    expect(screen.getByText('Nothing to chart')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByText('All OK')).not.toBeInTheDocument()
  })

  test('your empty node replaces the default message', () => {
    reduced(<CurveWindow series={[]} empty={<p>Add a bolt</p>} />)
    expect(screen.getByText('Add a bolt')).toBeInTheDocument()
    expect(screen.queryByText('Nothing to chart')).not.toBeInTheDocument()
  })

  test('an error shows its message and Retry calls onRetry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<CurveWindow error="Couldn’t load the curves." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load the curves.')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByText('1 NOK')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('loading holds the chart’s place and shows no demo figures', () => {
    reduced(<CurveWindow loading />)
    expect(screen.getByText('Loading the curves')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByText('24.2')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Bolt 2' })).not.toBeInTheDocument()
  })

  test('standalone draws a page with the title as the h1', () => {
    reduced(<CurveWindow embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Tightening' })).toBeInTheDocument()
  })
})
