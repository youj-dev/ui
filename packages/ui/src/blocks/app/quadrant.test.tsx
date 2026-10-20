import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Quadrant, type QuadrantItem } from './quadrant'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const bubbles = () => within(screen.getByRole('group', { name: 'Accounts' })).getAllByRole('button')
const bubble = (id: string) => document.querySelector<HTMLElement>(`[data-slot=quadrant-plot] [data-yj-item="${id}"]`)!
const chips = () => within(screen.getByRole('group', { name: 'Show a group' })).getAllByRole('button')
const list = () => document.querySelector('[data-slot=quadrant-list]') as HTMLElement
const readout = () => document.querySelector('[data-slot=quadrant-readout]')!

describe('Quadrant block', () => {
  test('bubbles on one tab stop, each named with its figures and group; the chips count the groups; the splits are sliders', () => {
    reduced(<Quadrant />)
    expect(screen.getByRole('heading', { level: 2, name: 'Account health' })).toBeInTheDocument()
    expect(chips().map((c) => c.getAttribute('aria-label'))).toEqual(['Champions: 9', 'At risk: 6', 'Expand: 8', 'Nurture: 13'])
    expect(bubbles()).toHaveLength(36)
    expect(bubbles().filter((b) => b.tabIndex === 0)).toHaveLength(1)
    expect(bubble('granite')).toHaveAccessibleName('Granite Assurance: 31% weekly active, $36.8K MRR, 310 seats. At risk.')
    expect(bubble('granite')).toHaveAttribute('data-yj-group', 'low-high')
    expect(screen.getByRole('figure', { name: 'Accounts by usage and revenue' })).toHaveAccessibleDescription('36 accounts. Champions: 9, At risk: 6, Expand: 8, Nurture: 13.')
    expect(screen.getByRole('slider', { name: 'Usage split' })).toHaveAttribute('aria-valuetext', 'Usage split at 55%')
    expect(screen.getByRole('slider', { name: 'Revenue split' })).toHaveAttribute('aria-valuetext', 'Revenue split at $5K')
    // At rest the line over the field says what the axes and sizes are.
    expect(readout()).toHaveTextContent('→ Weekly active seats↑ MRR● Seats')
    expect(within(list()).getAllByRole('listitem')[0]).toHaveTextContent('Kestrel Mutual$54.2K68%')
  })

  test('a split steps with the keys and recolours what it passes; the new counts are spoken once it stops', async () => {
    vi.useFakeTimers()
    const onThresholdsChange = vi.fn()
    reduced(<Quadrant onThresholdsChange={onThresholdsChange} />)
    const usage = screen.getByRole('slider', { name: 'Usage split' })
    act(() => usage.focus())
    fireEvent.keyDown(usage, { key: 'ArrowRight' })
    expect(onThresholdsChange).toHaveBeenLastCalledWith([56, 5000])
    fireEvent.keyDown(usage, { key: 'End' })
    expect(onThresholdsChange).toHaveBeenLastCalledWith([100, 5000])
    expect(chips().map((c) => c.getAttribute('aria-label'))).toEqual(['Champions: 0', 'At risk: 15', 'Expand: 0', 'Nurture: 21'])
    expect(bubble('northgate')).toHaveAttribute('data-yj-group', 'low-high')
    await act(async () => vi.advanceTimersByTimeAsync(600))
    expect(screen.getByRole('status')).toHaveTextContent('Champions: 0, At risk: 15, Expand: 0, Nurture: 21.')
    const revenue = screen.getByRole('slider', { name: 'Revenue split' })
    fireEvent.keyDown(revenue, { key: 'ArrowUp' })
    expect(onThresholdsChange).toHaveBeenLastCalledWith([100, 5500])
    fireEvent.keyDown(revenue, { key: 'Home' })
    expect(revenue).toHaveAttribute('aria-valuenow', '500')
    vi.useRealTimers()
  })

  test('dragging a split moves it to the pointer, rounded to read', () => {
    const onThresholdsChange = vi.fn()
    reduced(<Quadrant onThresholdsChange={onThresholdsChange} />)
    const field = bubble('granite').parentElement!.parentElement!
    vi.spyOn(field, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 400, height: 200, right: 400, bottom: 200, x: 0, y: 0, toJSON: () => ({}) })
    const usage = screen.getByRole('slider', { name: 'Usage split' })
    usage.setPointerCapture = vi.fn()
    fireEvent.pointerDown(usage, { pointerId: 1, clientX: 241, clientY: 300 })
    expect(onThresholdsChange).toHaveBeenLastCalledWith([60, 5000])
    fireEvent.pointerMove(usage, { pointerId: 1, clientX: 122, clientY: 300 })
    fireEvent.pointerUp(usage, { pointerId: 1, clientX: 122, clientY: 300 })
    expect(onThresholdsChange).toHaveBeenLastCalledWith([31, 5000])
    expect(usage).toHaveAttribute('aria-valuenow', '31')
  })

  test('a chip shows its group alone, in the list and the field; Movement draws who changed group', async () => {
    const user = userEvent.setup()
    const onGroupChange = vi.fn()
    const onMovementChange = vi.fn()
    reduced(<Quadrant onGroupChange={onGroupChange} onMovementChange={onMovementChange} />)
    await user.click(chips()[1]!)
    expect(onGroupChange).toHaveBeenCalledWith('low-high')
    expect(chips()[1]).toHaveAttribute('aria-pressed', 'true')
    expect(within(list()).getByText('At risk, by revenue')).toBeInTheDocument()
    expect(within(list()).getAllByRole('listitem')).toHaveLength(6)
    expect(bubble('northgate')).toHaveClass('opacity-20')
    expect(bubble('granite')).not.toHaveClass('opacity-20')
    await user.click(screen.getByRole('switch'))
    expect(onMovementChange).toHaveBeenCalledWith(true)
    expect(bubble('granite')).toHaveAccessibleName(/\. At risk, from Champions\.$/)
    expect(within(list()).getAllByText('from Champions')).toHaveLength(3)
    await user.click(chips()[1]!)
    expect(onGroupChange).toHaveBeenLastCalledWith(null)
    expect(within(list()).getAllByRole('listitem')).toHaveLength(36)
  })

  test('arrow keys go to the nearest bubble that way, Home and End to the ends across; pointing at a row lights its bubble', async () => {
    const user = userEvent.setup()
    reduced(<Quadrant />)
    act(() => bubbles()[0]!.focus())
    expect(readout()).toHaveTextContent(/^Northgate Labs\$42\.1K MRR86% weekly active380 seats$/)
    await user.keyboard('{Home}')
    expect(bubble('driftwood')).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    const next = document.activeElement as HTMLElement
    expect(next).not.toBe(bubble('driftwood'))
    expect(bubbles().filter((b) => b.tabIndex === 0)).toEqual([next])
    await user.keyboard('{End}')
    expect(bubble('yardline')).toHaveFocus()
    await user.hover(within(list()).getAllByRole('listitem')[2]!)
    expect(bubble('granite')).toHaveAttribute('data-active')
  })

  describe('with your data', () => {
    const items: QuadrantItem[] = [
      { id: 'a', label: 'Alpha', x: 10, y: 2 },
      { id: 'b', label: 'Beta', x: 30, y: 8 },
      { id: 'c', label: 'Gamma', x: 70, y: 4 },
      { id: 'd', label: 'Delta', x: 90, y: 9 },
    ]

    test('items, axes, copy and locale drive it; the splits start at the medians; there is no Movement; an item calls back', async () => {
      const user = userEvent.setup()
      const onItemSelect = vi.fn()
      reduced(<Quadrant items={items} locale="de-DE" copy={{ title: 'Funktionen', groups: { 'high-high': 'Kern', 'low-high': 'Nische', 'high-low': 'Flach', 'low-low': 'Offen' } }} onItemSelect={onItemSelect} />)
      expect(screen.getByRole('heading', { level: 2, name: 'Funktionen' })).toBeInTheDocument()
      expect(screen.queryByRole('switch')).toBeNull()
      expect(screen.getByRole('slider', { name: 'Usage split' })).toHaveAttribute('aria-valuenow', '50')
      expect(screen.getByRole('slider', { name: 'Revenue split' })).toHaveAttribute('aria-valuenow', '6')
      expect(chips().map((c) => c.getAttribute('aria-label'))).toEqual(['Kern: 1', 'Nische: 1', 'Flach: 1', 'Offen: 1'])
      await user.click(bubble('c'))
      expect(onItemSelect).toHaveBeenCalledWith(items[2])
      within(list()).getAllByRole('button')[0]!.focus()
      await user.keyboard('{Enter}')
      expect(onItemSelect).toHaveBeenLastCalledWith(items[3])
    })

    test('another world: patient groups with their own axes, group names and size copy', () => {
      const groups: QuadrantItem[] = [
        { id: 'a', label: 'Heart failure', x: 60, y: 80, size: 300 },
        { id: 'b', label: 'Asthma, under 12', x: 80, y: 20, size: 500 },
        { id: 'c', label: 'COPD', x: 55, y: 75, size: 270 },
        { id: 'd', label: 'Statin therapy', x: 85, y: 30, size: 1_400 },
      ]
      reduced(
        <Quadrant
          items={groups}
          x={{ format: { style: 'unit', unit: 'percent', maximumFractionDigits: 0 }, domain: [40, 100] }}
          y={{ domain: [0, 100] }}
          defaultThresholds={[70, 50]}
          copy={{
            title: 'Patient risk',
            groups: { 'high-high': 'Monitor closely', 'low-high': 'Reach out now', 'high-low': 'Stable', 'low-low': 'Encourage' },
            point: (label: string, x: string, y: string, _size: string, group: string) => `${label}: ${x} adherence, risk ${y}. ${group}.`,
          }}
        />,
      )
      expect(screen.getByRole('heading', { level: 2, name: 'Patient risk' })).toBeInTheDocument()
      expect(chips().map((c) => c.getAttribute('aria-label'))).toEqual(['Monitor closely: 0', 'Reach out now: 2', 'Stable: 2', 'Encourage: 0'])
      expect(bubble('a')).toHaveAccessibleName('Heart failure: 60% adherence, risk 80. Reach out now.')
      expect(screen.getByRole('slider', { name: 'Usage split' })).toHaveAttribute('aria-valuenow', '70')
    })

    test('items that arrive after the first render get their medians, and the bubbles keep their tab stop', () => {
      const view = reduced(<Quadrant items={[]} loading />)
      view.rerender(
        <YoujProvider reducedMotion="always">
          <Quadrant items={items} />
        </YoujProvider>,
      )
      expect(screen.getByRole('slider', { name: 'Usage split' })).toHaveAttribute('aria-valuenow', '50')
      expect(bubbles().filter((b) => b.tabIndex === 0)).toHaveLength(1)
    })

    test('controlled splits and group ask first', async () => {
      const user = userEvent.setup()
      const onThresholdsChange = vi.fn()
      const onGroupChange = vi.fn()
      reduced(<Quadrant items={items} thresholds={[50, 5]} onThresholdsChange={onThresholdsChange} group={null} onGroupChange={onGroupChange} />)
      fireEvent.keyDown(screen.getByRole('slider', { name: 'Usage split' }), { key: 'ArrowRight' })
      expect(onThresholdsChange).toHaveBeenCalledWith([51, 5])
      expect(screen.getByRole('slider', { name: 'Usage split' })).toHaveAttribute('aria-valuenow', '50')
      await user.click(chips()[0]!)
      expect(onGroupChange).toHaveBeenCalledWith('high-high')
      expect(chips()[0]).toHaveAttribute('aria-pressed', 'false')
    })
  })

  test('loading, an error with Retry, and no items each take the room of the field and the list', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const loading = reduced(<Quadrant loading />)
    expect(screen.getByText('Loading accounts').closest('.h-124')).not.toBeNull()
    loading.unmount()
    const failed = reduced(<Quadrant error="It failed." onRetry={onRetry} />)
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalled()
    failed.unmount()
    reduced(<Quadrant items={[]} />)
    expect(screen.getByText('No accounts yet').closest('.h-124')).not.toBeNull()
    expect(screen.queryByRole('figure')).toBeNull()
  })

  test('embedded is a section named by its heading; standalone draws the page', () => {
    const view = reduced(<Quadrant headingLevel={3} className="custom-root" data-testid="card" />)
    expect(screen.getByTestId('card')).toHaveClass('custom-root')
    expect(screen.getByRole('region', { name: 'Account health' })).toBeInTheDocument()
    view.unmount()
    reduced(<Quadrant embedded={false} />)
    expect(screen.getByRole('main', { name: 'Account health' })).toBeInTheDocument()
  })
})
