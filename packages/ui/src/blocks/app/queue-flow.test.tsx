import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { QueueFlow } from './queue-flow'
import { NODES, ROUTES, TARGET_MINUTES, opening, step, seeded, totals, type QueueFlowNode, type QueueFlowRoute } from './queue-flow/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const inspector = (container: HTMLElement) => container.querySelector('[data-slot=queue-flow-inspector]') as HTMLElement
const node = (name: RegExp) => screen.getByRole('button', { name })

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('QueueFlow', () => {
  test('is a section named by an h2 by default, or a page named by an h1 with embedded={false}', () => {
    const { unmount } = reduced(<QueueFlow embedded={false} />)
    expect(screen.getByRole('main', { name: 'Support desk' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Support desk' })).toBeInTheDocument()
    unmount()
    reduced(<QueueFlow />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Support desk' })).toBeInTheDocument()
  })

  test('the drawing is a picture: each step is a button, and every route is in a table', () => {
    const { container } = reduced(<QueueFlow />)
    expect(container.querySelector('[data-slot=queue-flow-canvas] svg')).toHaveAttribute('aria-hidden', 'true')
    const steps = within(screen.getByRole('group', { name: 'Support steps' })).getAllByRole('button')
    expect(steps).toHaveLength(NODES.length)
    const table = screen.getByRole('table', { name: 'Routes and their volume' })
    expect(within(table).getAllByRole('row')).toHaveLength(ROUTES.length + 1)
    expect(within(table).getByRole('row', { name: /Assistant Spam/ })).toBeInTheDocument()
  })

  test('opens on the team in the most trouble, one tab stop for the whole drawing', () => {
    const { container } = reduced(<QueueFlow />)
    const billing = node(/^Billing, Team/)
    expect(billing).toHaveAttribute('aria-pressed', 'true')
    expect(billing).toHaveAttribute('tabindex', '0')
    expect(node(/^Routing, Triage/)).toHaveAttribute('tabindex', '-1')
    expect(billing).toHaveAttribute('aria-controls', inspector(container).id)
    expect(inspector(container)).toHaveTextContent('refunds, invoices and plan changes')
    expect(inspector(container)).toHaveTextContent('Gets tickets from Routing')
  })

  test('arrows follow the flow: back along a route, down a column, Home and End', async () => {
    const user = userEvent.setup()
    const { container } = reduced(<QueueFlow />)
    node(/^Billing, Team/).focus()
    await user.keyboard('{ArrowLeft}')
    expect(node(/^Routing, Triage/)).toHaveFocus()
    expect(node(/^Routing, Triage/)).toHaveAttribute('aria-pressed', 'true')
    expect(inspector(container)).toHaveTextContent('tags topic and priority, routes to a team')
    await user.keyboard('{ArrowLeft}')
    expect(node(/^Email, Channel/)).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(node(/^Phone, Channel/)).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(node(/^Routing, Triage/)).toHaveFocus()
    await user.keyboard('{End}')
    expect(node(/^Spam, Filter/)).toHaveFocus()
    await user.keyboard('{Home}')
    expect(node(/^Email, Channel/)).toHaveFocus()
  })

  test('the lens sets each step’s figure: volume, reply time or spam', async () => {
    const user = userEvent.setup()
    reduced(<QueueFlow />)
    expect(node(/^Chat, Channel/).getAttribute('aria-label')).toMatch(/\/h, [A-Za-z ]+$/)
    await user.click(screen.getByRole('button', { name: 'Reply time' }))
    expect(node(/^Chat, Channel/).getAttribute('aria-label')).toMatch(/\d min, [A-Za-z ]+$/)
    await user.click(screen.getByRole('button', { name: 'Spam' }))
    expect(node(/^Spam, Filter/).getAttribute('aria-label')).toMatch(/, 38, [A-Za-z ]+$/)
  })

  test('a new reading lands every beat; pause holds it and says so', () => {
    vi.useFakeTimers()
    reduced(<QueueFlow />)
    const spam = () => screen.getByRole('group', { name: 'Spam held' }).textContent
    const before = spam()
    act(() => vi.advanceTimersByTime(2000))
    const after = spam()
    expect(after).not.toBe(before)
    fireEvent.click(screen.getByRole('button', { name: 'Pause the desk' }))
    expect(screen.getByText('Paused')).toBeInTheDocument()
    expect(screen.getByText('Desk paused. Figures hold until you resume.')).toHaveAttribute('role', 'status')
    act(() => vi.advanceTimersByTime(6000))
    expect(spam()).toBe(after)
    fireEvent.click(screen.getByRole('button', { name: 'Resume the desk' }))
    act(() => vi.advanceTimersByTime(2000))
    expect(spam()).not.toBe(after)
  })

  test('a filling queue puts its team over target and makes triage hold back; more agents clear it', () => {
    let state = opening(NODES, ROUTES)
    const random = seeded(3)
    expect(state.nodes.billing!.health).toBe('ok')
    for (let i = 0; i < 3; i++) state = step(state, NODES, ROUTES, random)
    expect(state.nodes.billing!.health).toBe('over')
    for (let i = 0; i < 12; i++) state = step(state, NODES, ROUTES, random)
    expect(state.nodes.routing!.health).toBe('holding')
    expect(totals(state, NODES, ROUTES).reply).toBeGreaterThan(TARGET_MINUTES)
    state = { ...state, staff: { ...state.staff, billing: 8 } }
    for (let i = 0; i < 4; i++) state = step(state, NODES, ROUTES, random)
    expect(state.nodes.billing!.health).toBe('ok')
    expect(state.nodes.routing!.health).toBe('ok')
    expect(totals(state, NODES, ROUTES).reply).toBeLessThan(TARGET_MINUTES)
  })

  test('routes split what a step sends on; the assistant answers the rest itself', () => {
    const state = opening(NODES, ROUTES)
    const r = state.routes
    expect(r['routing>billing']! / (r['routing>billing']! + r['routing>technical']!)).toBeCloseTo(0.45)
    expect(r['assistant>technical']! / state.nodes.assistant!.out).toBeCloseTo(0.4)
  })

  test('Add agents doubles a team whose queue is building, and says so', async () => {
    const user = userEvent.setup()
    const onStaff = vi.fn()
    const { container } = reduced(<QueueFlow onStaff={onStaff} />)
    await user.click(screen.getByRole('button', { name: 'Add 4 agents' }))
    expect(onStaff).toHaveBeenCalledWith(expect.objectContaining({ id: 'billing' }), 8)
    await waitFor(() => expect(screen.getByText('Billing now has 8 agents. The queue is shrinking.')).toHaveAttribute('role', 'status'))
    expect(within(inspector(container)).getByText('8')).toBeInTheDocument()
  })

  test('the spam folder can be emptied', async () => {
    const user = userEvent.setup()
    const onPurge = vi.fn()
    reduced(<QueueFlow onPurge={onPurge} />)
    await user.click(node(/^Spam, Filter/))
    await user.click(screen.getByRole('button', { name: 'Delete 38' }))
    expect(onPurge).toHaveBeenCalled()
    await waitFor(() => expect(screen.getByText('Deleted 38 spam tickets.')).toBeInTheDocument())
    expect(screen.getByRole('group', { name: 'Spam held' })).toHaveTextContent('0')
  })

  describe('the moving tickets', () => {
    /** A ResizeObserver that reports the lattice's size once observing starts, as a browser does after layout. */
    const lattice = () =>
      vi.stubGlobal(
        'ResizeObserver',
        class {
          constructor(private callback: ResizeObserverCallback) {}
          observe(target: Element) {
            queueMicrotask(() => this.callback([{ target, contentRect: { width: 720, height: 220 } } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver))
          }
          unobserve() {}
          disconnect() {}
        },
      )
    const animations: { pause: ReturnType<typeof vi.fn>; play: ReturnType<typeof vi.fn>; cancel: ReturnType<typeof vi.fn>; options: KeyframeAnimationOptions }[] = []
    beforeEach(() => {
      animations.length = 0
      Element.prototype.animate = vi.fn(function (_frames: Keyframe[], options: KeyframeAnimationOptions) {
        const run = { pause: vi.fn(), play: vi.fn(), cancel: vi.fn(), updatePlaybackRate: vi.fn(), playbackRate: 1, options }
        animations.push(run)
        return run as unknown as Animation
      }) as unknown as typeof Element.prototype.animate
    })
    afterEach(() => {
      delete (Element.prototype as Partial<Element>).animate
    })

    test('ride their routes on the compositor, pause with the desk and are cancelled on unmount', async () => {
      lattice()
      const { unmount } = render(
        <YoujProvider reducedMotion="never">
          <QueueFlow />
        </YoujProvider>,
      )
      await waitFor(() => expect(animations.length).toBeGreaterThan(ROUTES.length))
      expect(animations.every((a) => a.options.iterations === Infinity)).toBe(true)
      fireEvent.click(screen.getByRole('button', { name: 'Pause the desk' }))
      expect(animations.every((a) => a.pause.mock.calls.length > 0)).toBe(true)
      const made = [...animations]
      unmount()
      expect(made.every((a) => a.cancel.mock.calls.length > 0)).toBe(true)
    })

    test('stand still along their routes under reduced motion', async () => {
      lattice()
      const { container } = reduced(<QueueFlow />)
      const dots = container.querySelectorAll<HTMLElement>('[data-slot=queue-flow-items] > span')
      await waitFor(() => expect(dots[0]!.style.transform).toMatch(/^translate\(/))
      expect(Element.prototype.animate).not.toHaveBeenCalled()
    })
  })

  test('every string can be rewritten, numbers follow the locale', () => {
    reduced(<QueueFlow copy={{ locale: 'de-DE', title: 'Kundenservice', volume: 'Neue Tickets', layers: ['Kanäle', 'Sortierung', 'Teams'] }} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Kundenservice' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Neue Tickets' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Spam held' })).toHaveTextContent(/\d,\d+\s%/)
  })

  test('simulates its readings only without your desk, under a Demo data marker', () => {
    const demo = render(<QueueFlow />)
    expect(screen.getByText('Demo data')).toBeInTheDocument()
    demo.unmount()
    const desk = opening(NODES, ROUTES)
    vi.useFakeTimers()
    try {
      render(<QueueFlow desk={desk} />)
      expect(screen.queryByText('Demo data')).toBeNull()
      const before = document.body.textContent
      act(() => vi.advanceTimersByTime(10_000))
      expect(document.body.textContent).toBe(before)
    } finally {
      vi.useRealTimers()
    }
  })
  describe('for any queue', () => {
    const nodes: QueueFlowNode[] = [
      { id: 'dock', label: 'Dock', kind: 'channel', about: 'unloaded here', icon: <svg data-testid="dock-icon" />, layer: 0, lane: 0, rate: 100, reply: 5 },
      { id: 'sorter', label: 'Sorter', kind: 'triage', about: 'reads each label', icon: 'route', layer: 1, lane: 0.5, rejects: 0.1, reply: 10 },
      { id: 'north', label: 'North', kind: 'team', about: 'trucks north', icon: 'card', layer: 2, lane: 0, staff: 1, perStaff: 40, reply: 30, limit: 100, opens: 0.8 },
      { id: 'chute', label: 'Chute', kind: 'sink', about: 'rejects', icon: 'ban', layer: 2, lane: 2, reply: 0, holds: 12 },
    ]
    const routes: QueueFlowRoute[] = [
      { from: 'dock', to: 'sorter' },
      { from: 'sorter', to: 'north' },
      { from: 'sorter', to: 'chute', reject: true },
    ]

    test('draws your steps, your icons and what the rejecting step holds', () => {
      const { container } = reduced(<QueueFlow nodes={nodes} routes={routes} />)
      expect(within(screen.getByRole('group', { name: 'Support steps' })).getAllByRole('button')).toHaveLength(4)
      expect(screen.getByTestId('dock-icon')).toBeInTheDocument()
      expect(node(/^Chute, Filter/).getAttribute('aria-label')).toMatch(/\/h, [A-Za-z ]+$/)
      expect(screen.getByRole('group', { name: 'Spam held' })).toHaveTextContent('12')
      expect(inspector(container)).toHaveTextContent('trucks north')
    })

    test('your lenses name the three readings, and the first one opens', async () => {
      const user = userEvent.setup()
      reduced(
        <QueueFlow
          nodes={nodes}
          routes={routes}
          lenses={[
            { id: 'reply', label: 'Dwell' },
            { id: 'volume', label: 'Parcels' },
            { id: 'rejected', label: 'Rejects' },
          ]}
        />,
      )
      expect(screen.queryByRole('button', { name: 'Volume' })).toBeNull()
      expect(node(/^Dock, Channel/).getAttribute('aria-label')).toMatch(/\d min, [A-Za-z ]+$/)
      await user.click(screen.getByRole('button', { name: 'Parcels' }))
      expect(node(/^Dock, Channel/).getAttribute('aria-label')).toMatch(/\/h, [A-Za-z ]+$/)
      await user.click(screen.getByRole('button', { name: 'Rejects' }))
      expect(node(/^Chute, Filter/).getAttribute('aria-label')).toMatch(/, 12, [A-Za-z ]+$/)
    })

    test('your formatters write the figures, and the target sets the meter', () => {
      reduced(<QueueFlow nodes={nodes} routes={routes} target={90} format={{ time: (m) => `${Math.round(m)} mins`, count: (n) => `${Math.round(n)} pcs` }} />)
      expect(screen.getByRole('group', { name: 'First reply p95' })).toHaveTextContent(/\d+ mins/)
      expect(screen.getByRole('group', { name: 'First reply p95' })).toHaveTextContent('of the 90 mins target')
      expect(screen.getByRole('group', { name: 'Spam held' })).toHaveTextContent('12 pcs')
      expect(node(/^Dock, Channel/).getAttribute('aria-label')).toMatch(/pcs\/h, [A-Za-z ]+$/)
    })
  })
})
