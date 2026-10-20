import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { TerrainCalendar, type TerrainCalendarDay } from './terrain-calendar'
import { colorWriter } from './terrain-calendar/color'
import { ALL, METRICS, gridOf, longestStreak, peakOf } from './terrain-calendar/data'
import { DEMO_DAYS } from './terrain-calendar/demo'
import { createEngine, type Timing } from './terrain-calendar/engine'
import { FLOOR_HEIGHT, TALL, cellAt, frameOf, project, reachOf } from './terrain-calendar/geometry'
import { DIMS, LEVELS, paintOf } from './terrain-calendar/paint'

/* The drawing is a canvas, which jsdom can't draw: the block is tested
 * through its grid, its readout, its stats and its announcements, and the
 * canvas's engine and geometry on their own, with a clock and frames the
 * tests step by hand. */

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const readout = () => document.querySelector('[data-slot=terrain-readout]') as HTMLElement
const tile = (name: string) => screen.getByRole('group', { name })
/** A figure a Counter rolls to, as it's read out. */
const figure = (within: HTMLElement, text: string) => within.querySelector(`[data-slot=stat-value] .sr-only`)?.textContent === text
const selectedCell = () => screen.getAllByRole('gridcell').find((cell) => cell.tabIndex === 0)!

beforeEach(() => {
  // jsdom has no 2D canvas; the engine draws nothing without one and everything else carries on.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})
afterEach(() => vi.restoreAllMocks())

describe('TerrainCalendar', () => {
  test('is a section named by an h2 by default, or a page named by an h1 with embedded={false}', () => {
    const { unmount } = reduced(<TerrainCalendar embedded={false} />)
    expect(screen.getByRole('main', { name: 'Training' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Training' })).toBeInTheDocument()
    unmount()
    reduced(<TerrainCalendar />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Training' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Training' })).toBeInTheDocument()
  })

  test('the drawing is a picture; every day is a cell of a grid, Monday first, named by its week', () => {
    const { container } = reduced(<TerrainCalendar />)
    expect(container.querySelector('[data-slot=terrain] canvas')).toHaveAttribute('aria-hidden', 'true')
    const grid = screen.getByRole('grid', { name: 'Load by day, All' })
    expect(within(grid).getAllByRole('rowheader').map((th) => th.textContent)).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    const weeks = within(grid).getAllByRole('columnheader')
    expect(weeks).toHaveLength(25)
    expect(weeks[1]).toHaveTextContent('Week of Apr 13')
    expect(weeks[24]).toHaveTextContent('Week of Sep 21')
    expect(within(grid).getAllByRole('gridcell')).toHaveLength(24 * 7)
  })

  test('opens on the peak day, the grid’s one tab stop, and sums up the six months above it', () => {
    reduced(<TerrainCalendar />)
    const cell = selectedCell()
    expect(screen.getAllByRole('gridcell').filter((c) => c.tabIndex === 0)).toHaveLength(1)
    expect(cell).toHaveAttribute('aria-selected', 'true')
    expect(cell).toHaveTextContent('1,305 load, 3 sessions')

    expect(readout()).toHaveTextContent('Sunday, Sep 20')
    expect(readout()).toHaveTextContent('3 sessions')
    expect(figure(readout(), '1,305')).toBe(true)
    const sessions = within(readout()).getByRole('table', { name: 'Sessions' })
    expect(within(sessions).getAllByRole('rowheader').map((th) => th.textContent)).toEqual(['Race Swim', 'Race Ride', 'Race Run'])
    expect(sessions).toHaveTextContent('1.5 km')
    expect(sessions).toHaveTextContent('effort 9 of 10')

    expect(figure(tile('Week of Sep 14'), '2,165')).toBe(true)
    expect(figure(tile('Longest streak'), '27 days')).toBe(true)
    expect(tile('Longest streak')).toHaveTextContent('Jun 2 – Jun 28')
    expect(tile('Peak day')).toHaveTextContent('Sunday, Sep 20 · Race')
  })

  test('the arrow keys move a week along or a day over, and the readout, stats and selection follow', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const { container } = reduced(<TerrainCalendar onSelect={onSelect} />)
    selectedCell().focus()

    await user.keyboard('{ArrowLeft}')
    expect(readout()).toHaveTextContent('Sunday, Sep 13')
    expect(tile('Week of Sep 7')).toBeInTheDocument()
    expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ date: '2026-09-13' }))

    await user.keyboard('{ArrowUp}')
    expect(readout()).toHaveTextContent('Saturday, Sep 12')
    expect(document.activeElement).toBe(selectedCell())
    expect(selectedCell()).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{Home}')
    expect(readout()).toHaveTextContent('Saturday, Apr 18')
    await user.keyboard('{Control>}{End}{/Control}')
    expect(readout()).toHaveTextContent('Sunday, Sep 27')
    // Past the edge, nothing wraps.
    await user.keyboard('{ArrowRight}{ArrowDown}')
    expect(readout()).toHaveTextContent('Sunday, Sep 27')
    // The keyboard's ring is on the drawing.
    expect(container.querySelector('[data-slot=terrain]')).toHaveAttribute('data-focus', 'keyboard')
  })

  test('a rest day reads as one', async () => {
    const user = userEvent.setup()
    reduced(<TerrainCalendar />)
    selectedCell().focus()
    // The week off sick: Wednesday, July 15.
    await user.keyboard('{ArrowLeft>9/}{ArrowUp>4/}')
    expect(readout()).toHaveTextContent('Wednesday, Jul 15')
    expect(readout()).toHaveTextContent('Rest day')
    expect(selectedCell()).toHaveTextContent('Rest day')
    expect(within(readout()).queryByRole('table')).not.toBeInTheDocument()
  })

  test('a day of other sports reads as none of the sport shown, not as rest', async () => {
    const user = userEvent.setup()
    reduced(<TerrainCalendar defaultCategory="swim" />)
    selectedCell().focus()
    // Race week's Tuesday: a run, and no swim.
    await user.keyboard('{Control>}{End}{/Control}{ArrowLeft}{ArrowUp>5/}')
    expect(readout()).toHaveTextContent('Tuesday, Sep 15')
    expect(readout()).toHaveTextContent('No swim sessions')
    expect(readout()).not.toHaveTextContent('Rest day')
    expect(selectedCell()).toHaveTextContent('No swim sessions')
  })

  test('switching the measure or the sport reshapes the terrain and says where it now peaks', async () => {
    const user = userEvent.setup()
    reduced(<TerrainCalendar />)
    await user.click(screen.getByRole('button', { name: 'Time' }))
    expect(screen.getByRole('grid', { name: 'Time by day, All' })).toBeInTheDocument()
    expect(screen.getByText('Time, All. Peak: Saturday, Aug 29: 3h 23m.')).toHaveAttribute('role', 'status')
    // The selected day stays, in the new measure.
    expect(readout()).toHaveTextContent('Sunday, Sep 20')
    expect(readout()).toHaveTextContent('145 min')

    await user.click(screen.getByRole('button', { name: 'Run' }))
    expect(screen.getByText('Time, Run. Peak: Sunday, Aug 30: 1h 31m.')).toHaveAttribute('role', 'status')
    // Only the race's run is left of race day.
    expect(within(readout()).getAllByRole('rowheader').map((th) => th.textContent)).toEqual(['Race Run'])
  })

  test('pointing at a day shows it while the rest recede; leaving goes back to the selection', async () => {
    const frames: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => frames.push(cb))
    const { container } = reduced(<TerrainCalendar />)
    const host = container.querySelector('[data-slot=terrain]') as HTMLElement
    const canvas = host.querySelector('canvas')!
    // The canvas laid out at 1 CSS px per grid unit, from the frame's corner.
    const frame = frameOf(7, 24, reachOf(METRICS.flatMap((m) => [ALL, 'run', 'ride', 'swim'].map((c) => gridOf(DEMO_DAYS, m.id, c)))))
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({ left: frame.x, top: frame.y, width: frame.width, height: frame.height, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => ({}) })
    // Monday, April 13: the front row's first week, low enough that nothing stands in front of it.
    const [x, y] = project(0.4, 6.6, 0)
    fireEvent.pointerMove(host, { clientX: x, clientY: y, pointerType: 'mouse' })
    act(() => frames.splice(0).forEach((cb) => cb(performance.now())))
    expect(readout()).toHaveTextContent('Monday, Apr 13')
    expect(host).toHaveAttribute('data-looking')
    // The selection didn't move: the grid still stops on race day.
    expect(selectedCell()).toHaveTextContent('1,305 load, 3 sessions')

    fireEvent.pointerLeave(host)
    expect(readout()).toHaveTextContent('Sunday, Sep 20')
    expect(host).not.toHaveAttribute('data-looking')
  })

  test('every string can be rewritten, and numbers and dates follow the locale', () => {
    const metrics = [
      { ...METRICS[0]!, label: 'Last', format: { ...METRICS[0]!.format, unit: 'Punkte' } },
      { ...METRICS[1]!, label: 'Zeit' },
      { ...METRICS[2]!, label: 'Strecke' },
    ]
    reduced(<TerrainCalendar metrics={metrics} copy={{ locale: 'de-DE', title: 'Trainingslast' }} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Trainingslast' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Strecke' })).toBeInTheDocument()
    const date = new Intl.DateTimeFormat('de-DE', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(Date.UTC(2026, 8, 20))
    expect(readout()).toHaveTextContent(date)
    expect(figure(readout(), '1.305')).toBe(true)
    expect(selectedCell()).toHaveTextContent('1.305 Punkte')
  })
})

/** Two weeks of a corner shop, Monday first: revenue and orders in two departments, closed on the second Sunday. */
const SHOP: TerrainCalendarDay[] = Array.from({ length: 14 }, (_, i) => {
  const date = new Date(Date.UTC(2026, 8, 7 + i)).toISOString().slice(0, 10)
  if (i === 13) return { date, entries: [] }
  return {
    date,
    entries: [
      { category: 'bakery', values: { revenue: 100 + i * 10, orders: 20 + i } },
      ...(i % 2 ? [{ category: 'deli', title: i === 11 ? 'Tasting' : undefined, values: { revenue: 300 + i * 5, orders: 5 } }] : []),
    ],
  }
})
const SHOP_PROPS = {
  days: SHOP,
  metrics: [
    { id: 'revenue', label: 'Revenue', format: { options: { style: 'currency' as const, currency: 'USD', maximumFractionDigits: 0 } } },
    { id: 'orders', label: 'Orders', format: { options: { maximumFractionDigits: 0 }, unit: 'orders' } },
  ],
  categories: [
    { id: 'bakery', label: 'Bakery', tone: 'chart-2' as const },
    { id: 'deli', label: 'Deli', tone: 'chart-4' as const },
    { id: 'back', label: 'Back room', filter: false },
  ],
  details: [{ id: 'revenue', format: (v: number) => `$${v}` }, { id: 'orders', format: (v: number) => `${v} orders`, spoken: (v: number) => `${v} orders placed` }],
  copy: { title: 'Corner shop', rest: 'Closed', entries: 'Departments', entryCount: (n: number) => `${n} departments`, noCategory: (c: string) => `No ${c.toLowerCase()} sales` },
}

describe('with your own days', () => {
  test('metrics, categories and details drive the controls, the grid, the stats and the table', async () => {
    const user = userEvent.setup()
    reduced(<TerrainCalendar {...SHOP_PROPS} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Corner shop' })).toBeInTheDocument()
    // The filter follows the categories (the back room is counted in All only), the measure switch the metrics.
    expect(within(screen.getByRole('group', { name: 'Sport' })).getAllByRole('button').map((b) => b.textContent)).toEqual(['All', 'Bakery', 'Deli'])
    expect(within(screen.getByRole('group', { name: 'Measure' })).getAllByRole('button').map((b) => b.textContent)).toEqual(['Revenue', 'Orders'])
    const grid = screen.getByRole('grid', { name: 'Revenue by day, All' })
    expect(within(grid).getAllByRole('gridcell')).toHaveLength(14)
    // It opens on the peak day, with its entries in the table and its figures through the details.
    expect(readout()).toHaveTextContent('Friday, Sep 18')
    const table = within(readout()).getByRole('table', { name: 'Departments' })
    expect(within(table).getAllByRole('rowheader').map((th) => th.textContent)).toEqual(['Bakery', 'Tasting Deli'])
    expect(table).toHaveTextContent('$210')
    expect(table).toHaveTextContent('5 orders placed')
    expect(readout()).toHaveTextContent('2 departments')
    expect(tile('Longest streak')).toHaveTextContent('Sep 7 – Sep 19')

    await user.click(screen.getByRole('button', { name: 'Deli' }))
    expect(screen.getByText('Revenue, Deli. Peak: Friday, Sep 18: $355.')).toHaveAttribute('role', 'status')
    expect(within(readout()).getAllByRole('rowheader').map((th) => th.textContent)).toEqual(['Tasting Deli'])
    await user.click(screen.getByRole('button', { name: 'Orders' }))
    expect(screen.getByRole('grid', { name: 'Orders by day, Deli' })).toBeInTheDocument()
  })

  test('a closed day and a day of other categories read as what they are', async () => {
    const user = userEvent.setup()
    reduced(<TerrainCalendar {...SHOP_PROPS} defaultCategory="deli" />)
    selectedCell().focus()
    // Saturday the 19th has the bakery only: none of the deli shown.
    await user.keyboard('{ArrowDown}')
    expect(readout()).toHaveTextContent('Saturday, Sep 19')
    expect(readout()).toHaveTextContent('No deli sales')
    // Sunday the 20th the shop was shut.
    await user.keyboard('{ArrowDown}')
    expect(readout()).toHaveTextContent('Sunday, Sep 20')
    expect(readout()).toHaveTextContent('Closed')
  })

  test('the default and a defaultMetric of your own', () => {
    reduced(<TerrainCalendar {...SHOP_PROPS} defaultMetric="orders" />)
    expect(screen.getByRole('grid', { name: 'Orders by day, All' })).toBeInTheDocument()
    expect(selectedCell()).toHaveTextContent('orders')
  })

  test('no days shows the empty message at the terrain’s place, with a dash for each figure', () => {
    reduced(<TerrainCalendar days={[]} />)
    expect(screen.getByText('Nothing to show yet')).toBeInTheDocument()
    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThan(2)
  })

  test('empty can be your own node', () => {
    reduced(<TerrainCalendar days={[]} empty={<p>Open the shop first</p>} />)
    expect(screen.getByText('Open the shop first')).toBeInTheDocument()
    expect(screen.queryByText('Nothing to show yet')).not.toBeInTheDocument()
  })

  test('loading waits behind skeletons and draws no demo figures', () => {
    const { container } = reduced(<TerrainCalendar loading />)
    expect(screen.getAllByText('Loading the calendar').length).toBeGreaterThan(0)
    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
    expect(container.querySelectorAll('[data-slot=skeleton]').length).toBeGreaterThan(5)
    expect(screen.queryByText('1,305')).not.toBeInTheDocument()
  })

  test('an error shows its message with Retry, and Retry calls back', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<TerrainCalendar error="No connection." onRetry={onRetry} />)
    expect(screen.getByText('No connection.')).toBeInTheDocument()
    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})

describe('the demo days', () => {
  test('peaks on race day, and its longest streak is the three weeks of every day', () => {
    const rows = gridOf(DEMO_DAYS, 'load', 'all')
    expect(peakOf(rows)).toEqual({ row: 0, col: 22 })
    const streak = longestStreak(DEMO_DAYS)
    expect([DEMO_DAYS[streak.from]!.date, DEMO_DAYS[streak.to]!.date, streak.length]).toEqual(['2026-06-02', '2026-06-28', 27])
  })
})

describe('the terrain geometry', () => {
  test('the cell under the pointer is the nearest: a tall column in front hides the floor behind it, a flat one doesn’t', () => {
    const frame = frameOf(2, 2)
    const floorBehind = project(0.5, 0.5, 0)
    expect(cellAt(frame, () => FLOOR_HEIGHT, floorBehind)).toEqual({ row: 0, col: 0 })
    expect(cellAt(frame, (r, c) => (r === 1 && c === 1 ? 4 : FLOOR_HEIGHT), floorBehind)).toEqual({ row: 1, col: 1 })
    // High above the drawing: nothing.
    expect(cellAt(frame, () => FLOOR_HEIGHT, project(0, 0, 20))).toBeNull()
  })

  test('the frame reaches as high as the tallest column stands, never lower than the floor', () => {
    // A peak near the front leaves less room above than one at the far corner.
    expect(frameOf(7, 24).y).toBeLessThan(frameOf(7, 24, reachOf([[[0, 0], [0, 1]]])).y)
    // A peak at the far corner reaches the full height.
    expect(reachOf([[[1, 0], [0, 0]]])).toBeLessThanOrEqual(-TALL + 0.5)
    expect(reachOf([[[0]]])).toBeLessThanOrEqual(0)
  })
})

describe('the terrain engine', () => {
  const frame = frameOf(2, 3)
  const shares = new Float32Array([0, 0.5, 1, 0.25, 0.75, 1])
  const target = [...shares].map((s) => Math.max(FLOOR_HEIGHT, s * TALL))
  const linear = (t: number) => t
  const timing = (reduced: boolean): Timing => ({
    reduced,
    rise: { duration: 500, spread: 200, ease: linear },
    morph: { duration: 300, spread: 100, ease: linear },
    recede: { duration: 100, spread: 0, ease: linear },
  })
  let now = 0
  let frames: FrameRequestCallback[] = []
  const flush = (ms: number) => {
    now += ms
    frames.splice(0).forEach((cb) => cb(now))
  }
  const near = (actual: Float32Array, expected: number[]) => expected.forEach((v, i) => expect(actual[i]).toBeCloseTo(v, 4))

  beforeEach(() => {
    now = 1000
    frames = []
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => frames.push(cb))
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  const make = (reduced: boolean) => {
    const e = createEngine(document.createElement('canvas'), frame)
    e.setTiming(timing(reduced))
    return e
  }

  test('reduced motion: the columns stand at once, and no frame follows the one that draws them', () => {
    const e = make(true)
    e.setSeen(true)
    e.setShares(shares)
    near(e.heights(), target)
    flush(16)
    expect(frames).toHaveLength(0)
    expect(e.running).toBe(false)
  })

  test('the first readings wait on the floor until the canvas is seen, then rise far corner first', () => {
    const e = make(false)
    e.setShares(shares)
    flush(1000)
    near(e.heights(), target.map(() => FLOOR_HEIGHT))
    expect(frames).toHaveLength(0)

    e.setSeen(true)
    flush(300)
    const mid = e.heights()
    // The far corner is on its way up before the near corner starts.
    expect(mid[4]!).toBeGreaterThan(FLOOR_HEIGHT)
    expect(mid[4]!).toBeLessThan(target[4]!)
    expect(e.running).toBe(true)
    flush(1000)
    near(e.heights(), target)
    flush(16)
    expect(e.running).toBe(false)
  })

  test('a new shape mid-flight carries on from where the columns are: nothing jumps', () => {
    const e = make(false)
    e.setSeen(true)
    e.setShares(shares)
    flush(2000)
    e.setShares(new Float32Array(6))
    flush(150)
    const before = [...e.heights()]
    e.setShares(shares)
    near(e.heights(), before)
    flush(1000)
    near(e.heights(), target)
  })

  test('off screen or in a hidden tab it asks for no frames, and draws what it missed when it’s back', () => {
    const e = make(false)
    e.setSeen(true)
    e.setShares(shares)
    flush(16)
    e.setSeen(false)
    expect(window.cancelAnimationFrame).toHaveBeenCalled()
    frames = []
    e.setShares(new Float32Array(6))
    expect(frames).toHaveLength(0)
    e.setShown(false)
    e.setSeen(true)
    expect(frames).toHaveLength(0)
    e.setShown(true)
    flush(16)
    near(e.heights(), target.map(() => FLOOR_HEIGHT))
  })

  test('looking at a cell makes the rest recede, and it cleans up after itself', () => {
    const e = make(false)
    e.setSeen(true)
    e.setShares(shares)
    flush(2000)
    e.setLooking(true)
    expect(e.running).toBe(false)
    flush(16)
    expect(e.running).toBe(true)
    e.destroy()
    expect(window.cancelAnimationFrame).toHaveBeenCalled()
  })
})

describe('the terrain paint', () => {
  test('writes oklab for a canvas that reads it, and hex for one that doesn’t', () => {
    const reads = { fillStyle: '' } as unknown as CanvasRenderingContext2D
    expect(colorWriter(reads)([0.5, 0.1, -0.1, 1])).toMatch(/^oklab\(0\.5000 0\.1000 -0\.1000 \/ 1\.000\)$/)
    expect(colorWriter(null)([1, 0, 0, 1])).toBe('#ffffff')
  })

  test('the ramp runs from the quiet end to the metric’s colour, and receding pulls it to the floor', () => {
    const lab = (l: number) => [l, 0, 0, 1] as [number, number, number, number]
    const colors = Object.fromEntries(
      ['floorTop', 'floorLeft', 'floorRight', 'lowTop', 'lowLeft', 'lowRight', 'hiTop', 'hiLeft', 'hiRight', 'inkTop', 'inkLeft', 'inkRight', 'edge', 'groove', 'quarter', 'cross', 'xray', 'pin'].map((k) => [
        k,
        k.startsWith('floor') ? lab(0.2) : k.startsWith('low') ? lab(0.4) : k.startsWith('hi') ? lab(0.9) : lab(0.1),
      ]),
    )
    const paint = paintOf(colors, (c) => c[0].toFixed(3))
    expect(paint.ramp).toHaveLength(DIMS * LEVELS * 3)
    // Quiet, then busiest, at full strength; then the busiest, fully receded.
    expect(paint.ramp[1]).toBe('0.400')
    expect(paint.ramp[(LEVELS - 1) * 3 + 1]).toBe('0.900')
    expect(Number(paint.ramp[((DIMS - 1) * LEVELS + LEVELS - 1) * 3 + 1])).toBeLessThan(0.9)
  })
})
