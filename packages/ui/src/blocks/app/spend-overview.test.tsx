import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SpendOverview } from './spend-overview'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const chart = () => screen.getByRole('img', { name: 'Spend this month against the limit' })

describe('spend overview block', () => {
  test('is a page with an h1 and a section named by an h2 for each card', () => {
    reduced(<SpendOverview embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Spend overview' })).toBeInTheDocument()
    for (const name of ['Requests', 'Audit', 'Your usage', 'Top spenders', 'Billing']) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument()
    }
  })

  test('leads with the spend so far, its change and the day the forecast crosses the limit', () => {
    reduced(<SpendOverview />)
    const headline = screen.getByRole('group', { name: 'Workspace spend' })
    expect(within(headline).getByText('$6,516.17')).toBeInTheDocument()
    expect(headline.querySelector('[data-slot=stat-delta]')).toHaveTextContent(/24%\s*vs last period/)
    expect(within(headline).getByText('Will exceed limit by Oct 23')).toBeInTheDocument()
    expect(within(headline).getByText('Projected $16,577 by Oct 31')).toBeInTheDocument()
    expect(chart()).toHaveAccessibleDescription(/Crosses budget Oct 23$/)
  })

  test('a calmer pace is On track and the chart says it stays within the limit', () => {
    reduced(<SpendOverview daily={[100, 110, 90, 100, 105, 95, 100]} limit={12000} previous={650} />)
    expect(screen.getByText('On track')).toBeInTheDocument()
    expect(screen.queryByText(/Will exceed/)).not.toBeInTheDocument()
    expect(chart()).toHaveAccessibleDescription(/Stays within budget$/)
  })

  test('a limit already passed names the day it was passed', () => {
    reduced(<SpendOverview limit={5200} />)
    expect(screen.getByText('Over limit since Oct 11')).toBeInTheDocument()
  })

  test('the request strip says how many failed, and the list shows the latest with their status codes', () => {
    reduced(<SpendOverview />)
    expect(screen.getByRole('img', { name: /^40 requests, 4 failed/ })).toBeInTheDocument()
    const section = screen.getByRole('heading', { level: 2, name: 'Requests' }).closest('[data-slot=card]') as HTMLElement
    expect(section).toHaveTextContent('Last 40 requests · 4 failed')
    const list = within(within(section).getByRole('list'))
    expect(list.getAllByRole('listitem')).toHaveLength(4)
    expect(list.getByText('429')).toHaveTextContent('Failed 429')
    expect(list.getAllByText('200')).toHaveLength(3)
  })

  test('the audit trail lists changes newest first with who made them and when', () => {
    reduced(<SpendOverview />)
    const section = screen.getByRole('heading', { level: 2, name: 'Audit' }).closest('[data-slot=card]') as HTMLElement
    const items = within(section).getAllByRole('listitem')
    expect(items.map((li) => within(li).getByText(/^(Updated|Raised|Created)/).textContent)).toEqual(['Updated model policy', 'Raised Dax’s budget', 'Created ci-evals', 'Created Design spend'])
    expect(within(items[0] as HTMLElement).getByText('by Mara Okafor')).toBeInTheDocument()
    expect(within(items[0] as HTMLElement).getByText('34 min. ago')).toBeInTheDocument()
    expect(screen.getByText('4 changes this week')).toBeInTheDocument()
  })

  test('the three cards show your usage against your limit, the top spenders and the credit and workspace limit', () => {
    reduced(<SpendOverview />)
    const personal = screen.getByRole('heading', { level: 2, name: 'Your usage' }).closest('[data-slot=card]') as HTMLElement
    expect(within(personal).getByText('$249.87')).toBeInTheDocument()
    expect(within(personal).getByText('13,180')).toBeInTheDocument()
    expect(within(personal).getByText('214.2M')).toBeInTheDocument()
    expect(personal.querySelector('[data-slot=stat-meter-share]')).toHaveTextContent('25%')
    const leaders = screen.getByRole('heading', { level: 2, name: 'Top spenders' }).closest('[data-slot=card]') as HTMLElement
    expect(within(leaders).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['MOMara Okafor$1,976.51', 'JPJoon Park$1,193.00', 'TRTilda Reyes$955.63'])
    expect(within(leaders).getByText('$197.45')).toBeInTheDocument()
    const billing = screen.getByRole('heading', { level: 2, name: 'Billing' }).closest('[data-slot=card]') as HTMLElement
    expect(within(billing).getByText('$3,483.83')).toBeInTheDocument()
    expect(within(billing).getByText('Resets at midnight UTC · Nov 1')).toBeInTheDocument()
    expect(billing.querySelector('[data-slot=stat-meter-share]')).toHaveTextContent('54%')
    expect(within(billing).getByText('$5,484 left')).toBeInTheDocument()
  })

  test('open buttons appear only when wired, and name their section', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    const { unmount } = reduced(<SpendOverview />)
    expect(screen.queryByRole('button', { name: /^Open/ })).not.toBeInTheDocument()
    unmount()
    reduced(<SpendOverview onOpen={onOpen} />)
    await user.click(screen.getByRole('button', { name: 'Open requests' }))
    await user.click(screen.getByRole('button', { name: 'Open top spenders' }))
    expect(onOpen.mock.calls).toEqual([['requests'], ['leaderboard']])
  })

  test('your data and copy drive the page', () => {
    reduced(
      <SpendOverview
        locale="de-DE"
        currency="EUR"
        daily={[10, 10, 10]}
        limit={1000}
        previous={20}
        periodDays={10}
        start="2026-10-01"
        requests={[{ id: 'r', status: 503, name: 'Beta', caller: 'Lena', cost: 1, at: '2026-10-13T11:00:00Z' }]}
        audit={[]}
        members={[]}
        copy={{ title: 'Ausgaben', onTrack: 'Im Plan', emptyAudit: 'Keine Änderungen' }}
      />,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Ausgaben' })).toBeInTheDocument()
    expect(screen.getByText('Im Plan')).toBeInTheDocument()
    expect(screen.getByText('Keine Änderungen')).toBeInTheDocument()
    expect(screen.getByText('No spend yet')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /^1 requests, 1 failed/ })).toBeInTheDocument()
  })

  test('loading is busy with skeletons in place of the figures; an error replaces the page’s content and retries', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const { rerender } = reduced(<SpendOverview loading />)
    expect(screen.getByText('Loading spend')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Workspace spend' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByText('$6,516.17')).not.toBeInTheDocument()
    rerender(
      <YoujProvider reducedMotion="always">
        <SpendOverview error="Couldn’t load your spend." onRetry={onRetry} />
      </YoujProvider>,
    )
    expect(screen.getByText('Couldn’t load your spend.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  test('by default, a page of the app’s frame: the shared page header names it, with no main of its own', () => {
    const { container } = reduced(<SpendOverview />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    const header = container.querySelector('[data-slot=app-page-header]')!
    expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'Spend overview' }))
    expect(screen.getByRole('heading', { level: 2, name: 'Requests' })).toBeInTheDocument()
  })
})
