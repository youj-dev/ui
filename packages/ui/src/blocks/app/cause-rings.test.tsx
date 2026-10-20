import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { CauseRings } from './cause-rings'
import { rankContributors, sectorPath, sliceArcs, TAU, topShare } from './cause-rings/geometry'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('donut geometry', () => {
  test('slices share the circle by their values, with the gap trimmed from each end', () => {
    const arcs = sliceArcs([1, 3], 0, TAU, 0.1)
    expect(arcs[0]?.from).toBeCloseTo(0.1)
    expect(arcs[0]?.to).toBeCloseTo(TAU / 4 - 0.1)
    expect(arcs[1]?.from).toBeCloseTo(TAU / 4 + 0.1)
    expect(arcs[1]?.to).toBeCloseTo(TAU - 0.1)
  })

  test('a lone slice keeps the whole turn, and empty values take no room', () => {
    expect(sliceArcs([5], 0, TAU, 0.1)).toEqual([{ from: 0, to: TAU }])
    expect(sliceArcs([0, 0])).toEqual([
      { from: 0, to: 0 },
      { from: 0, to: 0 },
    ])
  })

  test('a sector runs the outer arc, in to the inner radius, then back along the inner arc', () => {
    expect(sectorPath(100, 100, 50, 80, 0, Math.PI / 2)).toBe('M100 20A80 80 0 0 1 180 100L150 100A50 50 0 0 0 100 50Z')
    expect(sectorPath(100, 100, 50, 80, 0, Math.PI * 1.5)).toContain('A80 80 0 1 1')
  })

  test('the largest values make up their share, and contributors are ranked with the rest folded in', () => {
    expect(topShare([412, 318, 221, 168, 77, 40], 3)).toBeCloseTo(0.769, 3)
    expect(topShare([], 3)).toBe(0)
    const ranked = rankContributors(
      [
        { label: 'b', value: 30 },
        { label: 'a', value: 60 },
        { label: 'c', value: 5 },
        { label: 'd', value: 4 },
        { label: 'e', value: 1 },
      ],
      100,
    )
    expect(ranked.map((p) => [p.label, p.rank])).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', 3],
      ['', 0],
    ])
    expect(ranked[3]?.value).toBe(5)
  })
})

describe('cause rings block', () => {
  test('says the total, its change, the legend and the insight, as a section named by an h2', () => {
    reduced(<CauseRings />)
    expect(screen.getByRole('heading', { level: 2, name: 'Why lines stop' })).toBeInTheDocument()
    expect(screen.getByText('1,236 min')).toBeInTheDocument()
    expect(screen.getByText('-14% vs Aug')).toBeInTheDocument()
    expect(screen.getByText('3 causes make up 77% of lost minutes')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tooling 412/ })).toHaveAttribute('aria-pressed', 'true')
  })

  test('the chart has a text equivalent with every cause and its share', () => {
    reduced(<CauseRings />)
    const chart = screen.getByRole('img', { name: /Lost minutes by cause/ })
    expect(chart).toHaveAccessibleName(/Tooling 412 min, 33%/)
    expect(chart).toHaveAccessibleName(/Other 40 min, 3%/)
  })

  test('selecting a cause names it and lists where its minutes came from, and selecting it again clears', async () => {
    const user = userEvent.setup()
    const onActiveChange = vi.fn()
    reduced(<CauseRings onActiveChange={onActiveChange} />)
    await user.click(screen.getByRole('button', { name: /Maint\. 318/ }))
    expect(onActiveChange).toHaveBeenLastCalledWith('maintenance')
    expect(screen.getByText('Most from Press 2 140 · Mill 07 96 · Mill 04 52')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Maint\. 318/ }))
    expect(onActiveChange).toHaveBeenLastCalledWith(null)
  })

  test('your causes, change and words drive the content', () => {
    reduced(
      <CauseRings
        change={0.1}
        copy={{ title: 'Stops by cause' }}
        causes={[
          { id: 'a', label: 'Jam', value: 90, tone: 'chart-1' },
          { id: 'b', label: 'Wait', value: 10, tone: 'chart-2' },
        ]}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Stops by cause' })).toBeInTheDocument()
    expect(screen.getByText('100 min')).toBeInTheDocument()
    expect(screen.getByText('+10% vs Aug')).toBeInTheDocument()
    expect(screen.getByText('2 causes make up 100% of lost minutes')).toBeInTheDocument()
  })

  test('format rewrites the figures and copy carries the unit', () => {
    reduced(
      <CauseRings
        format={(n) => `#${n}`}
        copy={{ total: (v) => `${v} customers`, share: (l, v, p) => `${l} ${v}, ${p}` }}
        causes={[
          { id: 'a', label: 'Price', value: 60, tone: 'chart-1', contributors: [{ label: 'Pro', value: 40 }, { label: 'Team', value: 20 }] },
          { id: 'b', label: 'Support', value: 40, tone: 'chart-2' },
        ]}
      />,
    )
    expect(screen.getByText('#100 customers')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Price #60/ })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Price #60, 60%/ })).toBeInTheDocument()
    expect(screen.getByText('Most from Pro #40 · Team #20')).toBeInTheDocument()
  })

  test('insightCount sets how many causes the insight sums', () => {
    reduced(<CauseRings insightCount={2} />)
    expect(screen.getByText('2 causes make up 59% of lost minutes')).toBeInTheDocument()
  })

  test('an error shows its message with dashes for the figures, and Retry calls onRetry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<CauseRings error="Couldn’t load." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load.')).toBeInTheDocument()
    expect(screen.queryByText('1,236 min')).not.toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /Lost minutes/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Tooling/ })).not.toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('loading shows no chart and no demo figures', () => {
    reduced(<CauseRings loading />)
    expect(screen.getByText('Loading')).toBeInTheDocument()
    expect(screen.queryByText('1,236 min')).not.toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /Lost minutes/ })).not.toBeInTheDocument()
    expect(screen.queryByText(/make up/)).not.toBeInTheDocument()
  })

  test('with no causes it shows the empty message, or yours', () => {
    const { unmount } = reduced(<CauseRings causes={[]} />)
    expect(screen.getByText('Nothing lost')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /Lost minutes/ })).not.toBeInTheDocument()
    unmount()
    reduced(<CauseRings causes={[]} empty={<p>No stops this month</p>} />)
    expect(screen.getByText('No stops this month')).toBeInTheDocument()
  })

  test('standalone draws a page with the title as the h1', () => {
    reduced(<CauseRings embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Why lines stop' })).toBeInTheDocument()
  })
})
