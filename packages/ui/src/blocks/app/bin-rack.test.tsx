import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { BinRack } from './bin-rack'
import { binCell, binState, fillOf, refillCount } from './bin-rack/model'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('rack model', () => {
  test('a bin is empty at none, low at or under the share, otherwise stocked', () => {
    expect(binState(0, 24, 0.25)).toBe('empty')
    expect(binState(6, 24, 0.25)).toBe('low')
    expect(binState(7, 24, 0.25)).toBe('ok')
    expect(binState(5, 0, 0.25)).toBe('ok')
    expect(refillCount(['ok', 'low', 'empty', 'ok'])).toBe(2)
  })

  test('bins fill two rows across, and a block never vanishes while something is left', () => {
    expect([0, 3, 4, 7].map((i) => binCell(i, 8))).toEqual([
      { col: 0, row: 0 },
      { col: 3, row: 0 },
      { col: 0, row: 1 },
      { col: 3, row: 1 },
    ])
    expect(binCell(2, 3)).toEqual({ col: 0, row: 1 })
    expect(fillOf(12, 24)).toBe(0.5)
    expect(fillOf(1, 100)).toBe(0.12)
    expect(fillOf(0, 24)).toBe(0)
  })
})

describe('bin rack block', () => {
  test('counts the bins that need a refill and says when the tugger runs, as a section named by an h2', () => {
    reduced(<BinRack />)
    expect(screen.getByRole('heading', { level: 2, name: 'Line-side stock' })).toBeInTheDocument()
    expect(screen.getByText('2 low')).toBeInTheDocument()
    expect(screen.getByText('bins to refill')).toBeInTheDocument()
    expect(screen.getByText('run in 6 min')).toBeInTheDocument()
  })

  test('every bin is in the list with its state and when it runs out', () => {
    reduced(<BinRack />)
    expect(screen.getByRole('button', { name: 'Caps C-12, 6 left, low, empty in ~14 min' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Seals S-02, 0 left, empty, empty now' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Housings H-04, 22 left, stocked, empty in ~55 min' })).toBeInTheDocument()
  })

  test('focusing a bin in the list picks it and reports it', async () => {
    const user = userEvent.setup()
    const onBinSelect = vi.fn()
    reduced(<BinRack onBinSelect={onBinSelect} />)
    await user.click(screen.getByRole('button', { name: /Seals S-03/ }))
    expect(onBinSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 's2' }))
    expect(screen.getByRole('button', { name: /Seals S-03/ })).toHaveAttribute('aria-pressed', 'true')
  })

  test('the auto-call switch starts on, flips, and reports it', async () => {
    const user = userEvent.setup()
    const onAutoCallChange = vi.fn()
    reduced(<BinRack onAutoCallChange={onAutoCallChange} />)
    const toggle = screen.getByRole('switch', { name: 'Auto-call the tugger' })
    expect(toggle).toBeChecked()
    await user.click(toggle)
    expect(onAutoCallChange).toHaveBeenCalledWith(false)
    expect(toggle).not.toBeChecked()
  })

  test('your bins, threshold and words drive the content', () => {
    reduced(
      <BinRack
        copy={{ title: 'Rack stock' }}
        lowBelow={0.5}
        nextRefill={null}
        parts={[{ id: 'p', label: 'Pins', tone: 'chart-1' }]}
        bins={[
          { id: 'x', part: 'p', label: 'Pins P-1', quantity: 10, capacity: 24 },
          { id: 'y', part: 'p', label: 'Pins P-2', quantity: 20, capacity: 24 },
        ]}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Rack stock' })).toBeInTheDocument()
    expect(screen.getByText('1 low')).toBeInTheDocument()
    expect(screen.queryByText(/run in/)).not.toBeInTheDocument()
    expect(screen.getByText('when a bin drops below 50%')).toBeInTheDocument()
  })

  test('format drives the counts and the times, and copy names the words', () => {
    reduced(
      <BinRack
        nextRefill={2}
        format={{ count: (n) => `#${n}`, time: (n) => `${n} days` }}
        copy={{ nextRefill: (time) => `delivery in ${time}` }}
        bins={[{ id: 'x', part: 'p', label: 'Tablets', quantity: 3, capacity: 24, timeLeft: 5 }]}
        parts={[{ id: 'p', label: 'Pain', tone: 'chart-1' }]}
      />,
    )
    expect(screen.getByText('delivery in 2 days')).toBeInTheDocument()
    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tablets, #3 left, low, empty in ~5 days' })).toBeInTheDocument()
  })

  test('with no bins it shows the empty state and no figures', () => {
    reduced(<BinRack bins={[]} />)
    expect(screen.getByText('No bins on this rack')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Bins on the rack' })).not.toBeInTheDocument()
    expect(screen.queryByText('All stocked')).not.toBeInTheDocument()
  })

  test('your empty node replaces the default message', () => {
    reduced(<BinRack bins={[]} empty={<p>Add a bin</p>} />)
    expect(screen.getByText('Add a bin')).toBeInTheDocument()
    expect(screen.queryByText('No bins on this rack')).not.toBeInTheDocument()
  })

  test('an error shows its message and Retry calls onRetry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<BinRack error="Couldn’t load the rack." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load the rack.')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Bins on the rack' })).not.toBeInTheDocument()
    expect(screen.queryByText('2 low')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('loading holds the drawing’s place and shows no demo figures', () => {
    reduced(<BinRack loading />)
    expect(screen.getByText('Loading the rack')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Bins on the rack' })).not.toBeInTheDocument()
    expect(screen.queryByText('2 low')).not.toBeInTheDocument()
    expect(screen.queryByText('run in 6 min')).not.toBeInTheDocument()
  })

  test('standalone draws a page with the title as the h1', () => {
    reduced(<BinRack embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Line-side stock' })).toBeInTheDocument()
  })
})
