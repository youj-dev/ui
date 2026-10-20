import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { DriftHistogram } from './drift-histogram'
import { binHits, capability, centroid, isOut, offsetOf, radial } from './drift-histogram/stats'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('position statistics', () => {
  test('the centroid is the average landing point and the offset is its distance from nominal', () => {
    const hits = [
      { x: 0.02, y: 0.01 },
      { x: 0.04, y: 0.03 },
    ]
    expect(centroid(hits)).toEqual({ x: 0.03, y: 0.02 })
    expect(offsetOf(hits)).toBeCloseTo(Math.hypot(0.03, 0.02))
    expect(radial({ x: 0.03, y: 0.04 })).toBeCloseTo(0.05)
    expect(centroid([])).toEqual({ x: 0, y: 0 })
  })

  test('a hit is out when it lands beyond the tolerance circle’s radius', () => {
    expect(isOut({ x: 0.03, y: 0.04 }, 0.1)).toBe(false)
    expect(isOut({ x: 0.04, y: 0.04 }, 0.1)).toBe(true)
  })

  test('capability is the room left over three spreads, and zero without spread to measure', () => {
    const tight = [
      { x: 0.001, y: 0 },
      { x: -0.001, y: 0 },
      { x: 0, y: 0.001 },
      { x: 0, y: -0.001 },
    ]
    const loose = tight.map((h) => ({ x: h.x * 5, y: h.y * 5 }))
    expect(capability(tight, 0.1)).toBeGreaterThan(capability(loose, 0.1))
    expect(capability([{ x: 0.01, y: 0 }], 0.1)).toBe(0)
    expect(capability([{ x: 0, y: 0 }, { x: 0, y: 0 }], 0.1)).toBe(0)
  })

  test('hits are counted per 0.01 mm cell, split into older, recent and out, and a hit off the plate is dropped', () => {
    const hits = [
      { x: -0.025, y: -0.025 },
      { x: -0.025, y: -0.025 },
      { x: 0.005, y: 0.005 },
      { x: 0.055, y: 0.02 },
      { x: 0.2, y: 0 },
    ]
    const cells = binHits(hits, 2, 0.1)
    expect(cells).toContainEqual({ i: 4, j: 4, older: 2, recent: 0, out: 0 })
    expect(cells).toContainEqual({ i: 7, j: 7, older: 1, recent: 0, out: 0 })
    expect(cells).toContainEqual({ i: 12, j: 9, older: 0, recent: 0, out: 1 })
    expect(cells).toHaveLength(3)
  })
})

describe('drift histogram block', () => {
  test('says the drift, the capability and the state, as a section named by an h2', () => {
    reduced(<DriftHistogram />)
    expect(screen.getByRole('heading', { level: 2, name: 'True position' })).toBeInTheDocument()
    expect(screen.getByText('0.031')).toBeInTheDocument()
    expect(screen.getByText('mm offset · last 30')).toBeInTheDocument()
    expect(screen.getByText('Drifting')).toBeInTheDocument()
    expect(screen.getByText('1.24')).toBeInTheDocument()
  })

  test('the plate has a text equivalent and the legend counts the hits outside', () => {
    reduced(<DriftHistogram />)
    expect(screen.getByRole('img')).toHaveAccessibleName(/Where 64 holes landed against a tolerance of Ø 0.10 mm: 34 older, 29 recent, 1 outside it\. The recent ones sit 0.031 mm from nominal\./)
    expect(screen.getByText('Out · 1')).toBeInTheDocument()
  })

  test('the tool offset brings the recent center back, and Apply sends it and says it was applied', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    reduced(<DriftHistogram onApply={onApply} />)
    expect(screen.getByText(/X −0\.02\d|X -0\.02\d/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }))
    expect(onApply.mock.calls[0]?.[0].x).toBeLessThan(0)
    expect(await screen.findByText('Offset applied')).toBeInTheDocument()
  })

  test('your hits, tolerance and words drive the content', () => {
    reduced(
      <DriftHistogram
        recent={2}
        tolerance={0.2}
        copy={{ title: 'Hole position' }}
        hits={[
          { x: 0, y: 0 },
          { x: 0.001, y: 0 },
          { x: 0, y: 0.001 },
          { x: 0.001, y: 0.001 },
        ]}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Hole position' })).toBeInTheDocument()
    expect(screen.getByText('Stable')).toBeInTheDocument()
    expect(screen.getByText('Out · 0')).toBeInTheDocument()
  })

  test('format drives the offsets and the tolerance, and copy the words', () => {
    reduced(
      <DriftHistogram
        recent={2}
        tolerance={0.2}
        format={(v) => `${(v * 1000).toFixed(0)} µ`}
        copy={{ correction: 'Filler setting', axis: (name, value) => `${name}: ${value}` }}
        hits={[
          { x: 0, y: 0 },
          { x: 0.001, y: 0 },
          { x: 0.03, y: 0.04 },
          { x: 0.03, y: 0.04 },
        ]}
      />,
    )
    expect(screen.getByText('50 µ')).toBeInTheDocument()
    expect(screen.getByText('Filler setting')).toBeInTheDocument()
    expect(screen.getByText('X: -30 µ')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAccessibleName(/tolerance of Ø 200 µ mm/)
  })

  test('with no hits it shows the empty state and no figures', () => {
    reduced(<DriftHistogram hits={[]} />)
    expect(screen.getByText('Nothing measured')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByText('Stable')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled()
  })

  test('your empty node replaces the default message', () => {
    reduced(<DriftHistogram hits={[]} empty={<p>Take a measurement</p>} />)
    expect(screen.getByText('Take a measurement')).toBeInTheDocument()
    expect(screen.queryByText('Nothing measured')).not.toBeInTheDocument()
  })

  test('an error shows its message and Retry calls onRetry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<DriftHistogram error="Couldn’t load the hits." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load the hits.')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByText('0.031')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('loading holds the plate’s place and shows no demo figures', () => {
    reduced(<DriftHistogram loading />)
    expect(screen.getByText('Loading the hits')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByText('0.031')).not.toBeInTheDocument()
    expect(screen.queryByText('Drifting')).not.toBeInTheDocument()
  })

  test('standalone draws a page with the title as the h1', () => {
    reduced(<DriftHistogram embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'True position' })).toBeInTheDocument()
  })
})
