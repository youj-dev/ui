import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Flow, type FlowNode, type FlowPath } from './flow'
import { DEMO } from './flow/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const nodes = () => within(screen.getByRole('group', { name: 'Steps of the flow' })).getAllByRole('button')
const node = (id: string) => document.querySelector<HTMLElement>(`[data-yj-node="${id}"]`)!
const readout = () => document.querySelector('[data-slot=flow-readout]')!
const ribbons = (path: number) => [...document.querySelectorAll<SVGPathElement>(`[data-yj-path="${path}"]`)]
const number = new Intl.NumberFormat('en-US')
const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 })
const total = (paths: FlowPath[]) => paths.reduce((t, p) => t + p.value, 0)
const through = (paths: FlowPath[], id: string) => total(paths.filter((p) => p.steps.includes(id)))

describe('Flow block', () => {
  test('every node a button on one tab stop, named with its figure and where its people went; at rest the last stage splits', () => {
    reduced(<Flow />)
    const paths = DEMO['30d']
    expect(screen.getByRole('heading', { level: 2, name: 'Trial flow' })).toBeInTheDocument()
    expect(nodes()).toHaveLength(11)
    expect(nodes().filter((n) => n.tabIndex === 0)).toEqual([node('search')])
    const referral = through(paths, 'referral')
    const pro = total(paths.filter((p) => p.steps[0] === 'referral' && p.steps[1] === 'pro'))
    expect(node('referral')).toHaveAccessibleName(
      new RegExp(`^Referral, Source: ${number.format(referral)} trials, ${percent.format(referral / total(paths))} of all\\. Went on to Pro ${number.format(pro)} \\(${percent.format(pro / referral)}\\), `),
    )
    // The last stage says where its people came from.
    expect(node('paid')).toHaveAccessibleName(/^Paid, Outcome: [\d,]+ trials, [\d.]+% of all\. Came from Search [\d,]+ \([\d.]+%\), /)
    expect(screen.getByRole('figure', { name: 'Trial flow' })).toHaveAccessibleDescription(
      new RegExp(`^${number.format(total(paths))} trials from 5 sources\\. Paid [\\d.]+%, Still trialing [\\d.]+%, Cancelled [\\d.]+%\\.$`),
    )
    expect(readout()).toHaveTextContent(/^Paid[\d.]+%Still trialing[\d.]+%Cancelled[\d.]+%$/)
  })

  test('pointing at a node lights every path through it and reads its split; pointing at a ribbon lights its one path', async () => {
    const user = userEvent.setup()
    reduced(<Flow />)
    await user.hover(node('team'))
    const paths = DEMO['30d']
    const lit = paths.map((p, i) => (p.steps.includes('team') ? i : -1)).filter((i) => i >= 0)
    expect(ribbons(lit[0]!)[0]).toHaveAttribute('data-state', 'lit')
    expect(ribbons(paths.findIndex((p) => !p.steps.includes('team')))[0]).toHaveAttribute('data-state', 'back')
    // Every source fed Team, so none steps back; nothing else in its stage is on its paths.
    expect(node('search')).not.toHaveClass('opacity-35')
    expect(node('starter')).toHaveClass('opacity-35')
    expect(readout()).toHaveTextContent(new RegExp(`^Team${number.format(through(paths, 'team'))} trials · [\\d.]+%Paid[\\d.]+%`))
    await user.hover(ribbons(0)[1]!)
    expect(readout()).toHaveTextContent(new RegExp(`^Search → Starter → Paid${number.format(paths[0]!.value)} trials · [\\d.]+%$`))
    expect(ribbons(0)[0]).toHaveAttribute('data-state', 'lit')
    expect(ribbons(1)[0]).toHaveAttribute('data-state', 'back')
    await user.unhover(ribbons(0)[1]!)
    await user.hover(document.body)
  })

  test('arrows move along and across the stages; Enter pins a node and Escape lets it go', async () => {
    const user = userEvent.setup()
    const onSelectedChange = vi.fn()
    reduced(<Flow onSelectedChange={onSelectedChange} />)
    await user.tab()
    while (!nodes().includes(document.activeElement as HTMLElement)) await user.tab()
    expect(node('search')).toHaveFocus()
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(node('referral')).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(node('pro')).toHaveFocus()
    await user.keyboard('{End}')
    expect(node('team')).toHaveFocus()
    await user.keyboard('{ArrowRight}{Home}')
    expect(node('paid')).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(node('paid')).toHaveAttribute('aria-pressed', 'true')
    expect(onSelectedChange).toHaveBeenLastCalledWith('paid')
    // Pinned, it stays lit when the pointer and focus are elsewhere.
    act(() => node('paid').blur())
    expect(readout()).toHaveTextContent(/^Paid[\d,]+ trials/)
    act(() => node('paid').focus())
    await user.keyboard('{Escape}')
    expect(node('paid')).toHaveAttribute('aria-pressed', 'false')
    expect(onSelectedChange).toHaveBeenLastCalledWith(null)
    expect(nodes().filter((n) => n.tabIndex === 0)).toHaveLength(1)
  })

  test('a new range redraws the flow and is spoken; View data swaps in the table, in the same room', async () => {
    const user = userEvent.setup()
    const onRangeChange = vi.fn()
    reduced(<Flow onRangeChange={onRangeChange} />)
    const room = document.querySelector<HTMLElement>('[data-slot=flow-chart]')!.parentElement!
    const height = room.style.height
    await user.click(screen.getByRole('button', { name: 'last 7 days' }))
    expect(onRangeChange).toHaveBeenCalledWith('7d')
    expect(screen.getByText(`last 7 days: ${number.format(total(DEMO['7d']))} trials`, { selector: '[role=status]' })).toBeInTheDocument()
    expect(node('social')).toHaveTextContent(number.format(through(DEMO['7d'], 'social')))
    await user.click(screen.getByRole('button', { name: 'View data' }))
    const table = screen.getByRole('region', { name: 'Trial flow, step to step, last 7 days' })
    expect(within(table).getAllByRole('row')).toHaveLength(1 + 5 * 3 + 3 * 3)
    expect(within(table).getAllByRole('rowheader', { name: 'Search' })).toHaveLength(3)
    expect(screen.queryByRole('figure')).toBeNull()
    expect(room.style.height).toBe(height)
    await user.click(screen.getByRole('button', { name: 'Hide data' }))
    expect(screen.getByRole('figure', { name: 'Trial flow' })).toBeInTheDocument()
  })

  describe('with your data', () => {
    const own: FlowNode[] = [
      { id: 'a', label: 'Alpha', stage: 0 },
      { id: 'b', label: 'Beta', stage: 0 },
      { id: 'x', label: 'Kept', stage: 1, tone: 'success' },
      { id: 'y', label: 'Lost', stage: 1 },
    ]
    const paths: FlowPath[] = [
      { steps: ['a', 'x'], value: 30 },
      { steps: ['a', 'y'], value: 10 },
      { steps: ['b', 'x'], value: 20 },
      { steps: ['b', 'y'], value: 40 },
      // Routes that skip a stage are left out.
      { steps: ['x'], value: 99 },
    ]

    test('new nodes keep one tab stop when the one it was on goes away', () => {
      const view = reduced(<Flow />)
      act(() => node('partners').focus())
      view.rerender(
        <YoujProvider reducedMotion="always">
          <Flow stages={['In', 'Out']} nodes={own} paths={paths} />
        </YoujProvider>,
      )
      expect(nodes().filter((n) => n.tabIndex === 0)).toEqual([node('a')])
    })

    test('your ranges drive the switch, the description, the table and what is spoken', async () => {
      const user = userEvent.setup()
      const onRangeChange = vi.fn()
      reduced(
        <Flow
          stages={['In', 'Out']}
          nodes={own}
          paths={paths}
          ranges={[
            { id: 'fy25', label: 'FY25', name: 'fiscal year 2025' },
            { id: 'fy26', label: 'FY26', name: 'fiscal year 2026' },
          ]}
          copy={{ description: (range) => `Spending · ${range}`, table: (range) => `Budget, ${range}` }}
          onRangeChange={onRangeChange}
        />,
      )
      // The first range is the one shown first.
      expect(screen.getByText('Spending · fiscal year 2025')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'last 7 days' })).toBeNull()
      await user.click(screen.getByRole('button', { name: 'fiscal year 2026' }))
      expect(onRangeChange).toHaveBeenCalledWith('fy26')
      expect(screen.getByText('Spending · fiscal year 2026')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'View data' }))
      expect(screen.getByRole('region', { name: 'Budget, fiscal year 2026' })).toBeInTheDocument()
    })

    test('stages, nodes, paths, copy and locale drive it; there is no range to switch; a controlled pin asks first', async () => {
      const user = userEvent.setup()
      const onSelectedChange = vi.fn()
      reduced(<Flow stages={['In', 'Out']} nodes={own} paths={paths} locale="de-DE" copy={{ title: 'Fluss', count: (v) => `${v} Leute` }} selected={null} onSelectedChange={onSelectedChange} />)
      expect(screen.getByRole('heading', { level: 2, name: 'Fluss' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'last 7 days' })).toBeNull()
      // Intl sets "60 %" with a narrow space.
      const name = (el: HTMLElement) => el.getAttribute('aria-label')!.replace(/\s/g, ' ')
      expect(name(node('b'))).toBe('Beta, In: 60 Leute, 60 % of all. Went on to Lost 40 (66,7 %), Kept 20 (33,3 %).')
      expect(name(node('x'))).toBe('Kept, Out: 50 Leute, 50 % of all. Came from Alpha 30 (60 %), Beta 20 (40 %).')
      await user.click(node('a'))
      expect(onSelectedChange).toHaveBeenCalledWith('a')
      expect(node('a')).toHaveAttribute('aria-pressed', 'false')
    })
  })

  test('loading, an error with Retry, and nothing to show each take the chart’s room', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const loading = reduced(<Flow loading />)
    expect(screen.getByText('Loading the flow')).toBeInTheDocument()
    const room = screen.getByText('Loading the flow').parentElement!.parentElement!
    expect(room.style.height).toBe('268px')
    loading.unmount()
    const failed = reduced(<Flow error="It failed." onRetry={onRetry} />)
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalled()
    failed.unmount()
    reduced(<Flow paths={[]} />)
    expect(screen.getByText('Nothing has flowed yet')).toBeInTheDocument()
    expect(screen.queryByRole('figure')).toBeNull()
  })

  test('with motion the nodes wait to be seen; reduced motion shows them at once; unmounting leaves nothing running', () => {
    const view = render(
      <YoujProvider reducedMotion="never">
        <Flow />
      </YoujProvider>,
    )
    expect(node('search')).toHaveClass('opacity-0')
    view.unmount()
    const still = reduced(<Flow />)
    expect(node('search')).not.toHaveClass('opacity-0')
    still.unmount()
    expect(document.querySelector('[data-yj-node]')).toBeNull()
  })

  test('embedded is a section named by its heading; standalone draws the page', () => {
    const view = reduced(<Flow headingLevel={3} className="custom-root" data-testid="card" />)
    expect(screen.getByTestId('card')).toHaveClass('custom-root')
    expect(screen.getByRole('region', { name: 'Trial flow' })).toBeInTheDocument()
    view.unmount()
    reduced(<Flow embedded={false} />)
    expect(screen.getByRole('main', { name: 'Trial flow' })).toBeInTheDocument()
  })
})
