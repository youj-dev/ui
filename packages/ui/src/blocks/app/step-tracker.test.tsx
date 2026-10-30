import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { StepTracker } from './step-tracker'
import { ITEMS, STAGES } from './step-tracker/data'
import { LOAN_COPY, LOAN_ITEMS, LOAN_STAGES } from './step-tracker/loan'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const route = (ref = '4822') => screen.getByRole('list', { name: `Route of order ${ref}` })
const scans = (ref?: string) => within(route(ref)).getAllByRole('button')
const detail = (container: HTMLElement) => container.querySelector('[data-slot=step-detail]') as HTMLElement
const summary = () => screen.getByLabelText('Shipment summary')
const status = (container: HTMLElement) => container.querySelector('[data-slot=step-status]') as HTMLElement
/** The rows the detail keeps, whatever the stage: it never changes height. */
const rowsKept = (container: HTMLElement) => detail(container).style.getPropertyValue('--rows-n')

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('StepTracker', () => {
  test('is a section named by an h2 by default, or a page named by an h1 with embedded={false}', () => {
    const { unmount } = reduced(<StepTracker embedded={false} />)
    expect(screen.getByRole('main', { name: 'Shipments' })).toBeInTheDocument()
    unmount()
    reduced(<StepTracker />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Shipments' })).toBeInTheDocument()
  })

  test('under reduced motion the journey is shown finished: every scan, its time and its place', () => {
    const { container } = reduced(<StepTracker />)
    const [ordered, packed, shipped, customs, out, delivered] = scans()
    expect(ordered).toHaveAccessibleName('Ordered, Mon 14:02, Done, acme.shop')
    expect(packed).toHaveAccessibleName('Packed, Mon 17:28, Done, Reno, NV')
    expect(shipped).toHaveAccessibleName('Shipped, Mon 23:42, Done, Oakland, CA')
    expect(customs).toHaveAccessibleName('Customs, Wed 01:07, Done, Toronto, ON')
    expect(out).toHaveAccessibleName('Out for delivery, Wed 08:38, Done, Mississauga, ON')
    expect(delivered).toHaveAccessibleName('Delivered, Thu 11:56, Done, 2 tries, Toronto, ON')
    expect(delivered).toHaveAttribute('aria-current', 'step')
    expect(status(container)).toHaveTextContent('Delivered')
    expect(container).toHaveTextContent('Oct 1, 11:56 UTC · Toronto, ON')
    expect(summary()).toHaveTextContent('Order total$1,342.40')
    expect(summary()).toHaveTextContent('Order to door3 days')
    expect(summary()).toHaveTextContent('Attempts2 · 1 missed')
    // The detail follows the parcel to where it is, and the retry loop stays drawn.
    expect(detail(container)).toHaveTextContent('Signed byA. Lovelace')
    expect(container.querySelector('[data-slot=step-retry-loop]')).toHaveClass('opacity-100')
  })

  test('picking a stage opens it: its place, its scan, its facts and the missed attempt', async () => {
    const user = userEvent.setup()
    const { container } = reduced(<StepTracker />)
    await user.click(scans()[3]!)
    expect(scans()[3]).toHaveAttribute('aria-pressed', 'true')
    const panel = detail(container)
    expect(scans()[3]).toHaveAttribute('aria-controls', panel.id)
    expect(within(panel).getByRole('heading', { level: 3 })).toHaveTextContent('Customs')
    expect(panel).toHaveTextContent('Toronto, ON')
    expect(panel).toHaveTextContent('Sep 30, 01:07 UTC')
    expect(panel).toHaveTextContent('PortToronto Pearson (YYZ)')
    expect(panel).toHaveTextContent('Duties$41.20 · prepaid')
    await user.click(scans()[5]!)
    expect(detail(container)).toHaveTextContent('Oct 1, 11:56 UTC')
    expect(detail(container)).toHaveTextContent('Attempt 1Sep 30, 13:12 UTC · No one was in to sign for it.')
    expect(within(detail(container)).getByText('Signature and photo').closest('dd')).toHaveAttribute('title', 'Signature and photo')
  })

  test('the detail keeps the rows the data needs at most, so it never changes height between scans or items', async () => {
    const user = userEvent.setup()
    const { container } = reduced(<StepTracker />)
    // Three facts and a missed attempt: the delivered stage of #4822.
    expect(rowsKept(container)).toBe('4')
    for (const stage of scans()) {
      await user.click(stage)
      expect(rowsKept(container)).toBe('4')
    }
    await user.click(screen.getByRole('tab', { name: /4821/ }))
    expect(rowsKept(container)).toBe('4')
    // There are no hidden copies of other scans holding it open.
    expect(container.querySelectorAll('[data-slot=step-detail] h3')).toHaveLength(1)
  })

  test('arrows move along the road, Home and End jump, one tab stop', async () => {
    const user = userEvent.setup()
    reduced(<StepTracker />)
    const list = scans()
    expect(list.filter((b) => b.tabIndex === 0)).toHaveLength(1)
    list[5]!.focus()
    await user.keyboard('{ArrowLeft}')
    expect(scans()[4]).toHaveFocus()
    expect(scans()[4]).toHaveAttribute('aria-pressed', 'true')
    await user.keyboard('{Home}')
    expect(scans()[0]).toHaveFocus()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(scans()[2]).toHaveFocus()
    await user.keyboard('{End}')
    expect(scans()[5]).toHaveFocus()
  })

  test('a parcel refused at customs goes back to the sender and skips the rest', async () => {
    const user = userEvent.setup()
    const { container } = reduced(<StepTracker />)
    await user.click(screen.getByRole('tab', { name: /4823/ }))
    const list = scans('4823')
    expect(list[3]).toHaveAccessibleName('Customs, Wed 19:40, Failed, Mexico City')
    for (const skipped of list.slice(4)) expect(skipped).toHaveAccessibleName(/, Skipped$/)
    expect(status(container)).toHaveTextContent('Returned to sender')
    expect(detail(container)).toHaveTextContent('ReasonNo commercial invoice (over $1,000)')
    expect(summary()).toHaveTextContent('Stopped after2 days')
    expect(summary()).toHaveTextContent('Attempts0 · never out')
    expect(screen.getByRole('button', { name: 'Email tracking link' })).toBeDisabled()
    await user.click(list[5]!)
    expect(detail(container)).toHaveTextContent('Skipped: the parcel stopped at customs and went back to the sender.')
  })

  test('with motion, the journey plays when seen: the missed delivery, the retry, the doorstep, each said', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private callback: IntersectionObserverCallback) {}
        observe(target: Element) {
          this.callback([{ target, isIntersecting: true, intersectionRatio: 1 } as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver)
        }
        unobserve() {}
        disconnect() {}
      },
    )
    const { container } = render(
      <YoujProvider reducedMotion="never">
        <StepTracker />
      </YoujProvider>,
    )
    const rows = rowsKept(container)
    await act(async () => vi.advanceTimersByTimeAsync(50))
    expect(scans()[2]).toHaveAccessibleName('Shipped, Not reached yet')
    expect(status(container)).not.toHaveTextContent('Delivered')
    await act(async () => vi.advanceTimersByTimeAsync(6100))
    expect(scans()[5]).toHaveAccessibleName('Delivered, Wed 13:12, Failed, attempt failed')
    expect(screen.getByText('Delivery attempt failed: recipient unavailable. Retrying the next day.')).toHaveAttribute('role', 'status')
    expect(status(container)).toHaveTextContent('Delivery attempt missed')
    await act(async () => vi.advanceTimersByTimeAsync(1800))
    expect(scans()[5]).toHaveAccessibleName('Delivered, Thu 11:56, Done, 2 tries, Toronto, ON')
    expect(screen.getByText('Delivered on attempt 2.')).toBeInTheDocument()
    await act(async () => vi.advanceTimersByTimeAsync(2000))
    expect(screen.getByText('Delivered in Toronto, ON.')).toBeInTheDocument()
    expect(scans()[5]).toHaveAttribute('aria-current', 'step')
    // The detail followed the parcel the whole way in the same rows: nothing below it moved.
    expect(rowsKept(container)).toBe(rows)
  })

  test('Replay under reduced motion says how the item ended', async () => {
    const user = userEvent.setup()
    reduced(<StepTracker defaultItem={ITEMS[2]!.id} />)
    await user.click(screen.getByRole('button', { name: 'Replay the route of order 4823' }))
    await waitFor(() => expect(screen.getByText('Refused at customs: no commercial invoice. Returning to sender.')).toHaveAttribute('role', 'status'))
  })

  test('Email tracking link hands the item to your API', async () => {
    const user = userEvent.setup()
    const onNotify = vi.fn()
    reduced(<StepTracker onNotify={onNotify} />)
    await user.click(screen.getByRole('button', { name: 'Email tracking link' }))
    expect(onNotify).toHaveBeenCalledWith(expect.objectContaining({ id: ITEMS[0]!.id }))
  })

  test('every string can be rewritten, money and times follow the locale', () => {
    reduced(<StepTracker copy={{ locale: 'de-DE', title: 'Sendungen' }} stages={[{ id: 'ordered', label: 'Bestellt' }, ...STAGES.slice(1)]} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Sendungen' })).toBeInTheDocument()
    expect(scans()[0]).toHaveAccessibleName(/^Bestellt, Mo\., 14:02, Done, acme\.shop$/)
    expect(summary()).toHaveTextContent('1.342,40')
  })

  test('a loan road drives the card: five stops from your stages, its own items, figures and copy', async () => {
    const user = userEvent.setup()
    const { container } = reduced(<StepTracker stages={LOAN_STAGES} items={LOAN_ITEMS} copy={LOAN_COPY} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Loan applications' })).toBeInTheDocument()
    const route = screen.getByRole('list', { name: 'Progress of application 20817' })
    const stops = within(route).getAllByRole('button')
    expect(stops.map((b) => b.getAttribute('aria-label')?.split(',')[0])).toEqual(['Submitted', 'Reviewed', 'Approved', 'Signed', 'Funded'])
    expect(stops[4]).toHaveAccessibleName('Funded, Fri 23:20, Done, 2 attempts, Treasury')
    expect(status(container)).toHaveTextContent('Funded')
    expect(screen.getByLabelText('Application summary')).toHaveTextContent('Loan amount$18,500.00')
    expect(screen.getByLabelText('Application summary')).toHaveTextContent('Funding attempts2 · 1 returned')
    expect(container.querySelector('[data-slot=step-retry-loop]')).toHaveClass('opacity-100')
    // The rail is five columns wide, whatever the stages.
    expect(route.parentElement!.style.getPropertyValue('--n')).toBe('5')
    await user.click(stops[4]!)
    expect(detail(container)).toHaveTextContent('Attempt 1')
    expect(detail(container)).toHaveTextContent('The bank returned the deposit')
    await user.click(screen.getByRole('tab', { name: /20822/ }))
    expect(status(container)).toHaveTextContent('Declined')
    expect(screen.getByLabelText('Application summary')).toHaveTextContent('Funding attempts0 · not funded')
    expect(screen.getByRole('button', { name: 'Email status link' })).toBeDisabled()
  })

  test('a stage can carry an icon in the detail', () => {
    const Dot = ({ size }: { size?: number }) => <svg data-testid="stage-icon" width={size} height={size} />
    const { container } = reduced(<StepTracker stages={STAGES.map((stage) => ({ ...stage, icon: Dot }))} />)
    expect(detail(container).querySelector('[data-testid=stage-icon]')).toBeInTheDocument()
  })

  test('loading shows skeletons in the card’s shape and no figures; the replay and notify actions wait', () => {
    const { container } = reduced(<StepTracker loading />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading shipments')
    expect(container.querySelectorAll('[data-slot=skeleton]').length).toBeGreaterThan(10)
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByText('NL4822771093CA', { exact: false })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Replay' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Email tracking link' })).toBeDisabled()
  })

  test('an error shows its message in place of the road, and Retry calls onRetry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<StepTracker error="Couldn’t reach the carrier." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t reach the carrier.')).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  test('no items shows the empty message, or your own node', () => {
    const { unmount } = reduced(<StepTracker items={[]} />)
    expect(screen.getByText('No shipments yet')).toBeInTheDocument()
    unmount()
    reduced(<StepTracker items={[]} empty={<p>Nothing is moving.</p>} copy={{ emptyTitle: 'unused' }} />)
    expect(screen.getByText('Nothing is moving.')).toBeInTheDocument()
    expect(screen.queryByText('unused')).not.toBeInTheDocument()
  })
})
