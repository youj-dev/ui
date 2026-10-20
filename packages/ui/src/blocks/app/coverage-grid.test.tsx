import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { CoverageGrid } from './coverage-grid'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const row = (name: string) => screen.getAllByRole('row').find((r) => within(r).queryByRole('rowheader', { name }))!

describe('CoverageGrid', () => {
  test('counts the covered cells and lays rows against columns, as a section with an h2', () => {
    reduced(<CoverageGrid />)
    expect(screen.getByRole('heading', { level: 2, name: 'Detection coverage' })).toBeInTheDocument()
    expect(screen.getByText('40 of 48 covered')).toBeInTheDocument()
    const grid = screen.getByRole('grid', { name: 'Detection rules by tactic and source' })
    expect(within(grid).getAllByRole('row')).toHaveLength(8)
    expect(within(row('Initial access')).getAllByRole('gridcell')[3]).toHaveAccessibleName('Mail: 5 rules')
    expect(within(row('Execution')).getAllByRole('gridcell')[4]).toHaveAccessibleName('Network: No rules')
  })

  test('picks the row with the most gaps and offers to draft for them', () => {
    reduced(<CoverageGrid />)
    expect(row('Lateral movement')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Lateral movement has 3 gaps. Draft rules to cover them?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Draft 3 rules' })).toBeEnabled()
  })

  test('picking another row points the foot at it; one with no gaps has nothing to draft', async () => {
    const user = userEvent.setup()
    const onRowChange = vi.fn()
    reduced(<CoverageGrid onRowChange={onRowChange} />)
    await user.click(screen.getByRole('rowheader', { name: 'Credential access' }))
    expect(onRowChange).toHaveBeenCalledWith('credential-access')
    expect(screen.getByText('Credential access is covered by every source.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Draft/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Review gaps' })).toBeDisabled()
  })

  test('drafting awaits the app with the gaps, then says the drafts wait for review', async () => {
    const user = userEvent.setup()
    const onDraft = vi.fn()
    const onReview = vi.fn()
    reduced(<CoverageGrid onDraft={onDraft} onReview={onReview} />)
    await user.click(screen.getByRole('button', { name: 'Review gaps' }))
    expect(onReview.mock.calls[0]![1].map((s: { id: string }) => s.id)).toEqual(['cloud', 'mail', 'apps'])
    await user.click(screen.getByRole('button', { name: 'Draft 3 rules' }))
    expect(onDraft.mock.calls[0]![0].id).toBe('lateral-movement')
    await waitFor(() => expect(screen.getAllByText('Drafted 3 rules for Lateral movement. They go live once reviewed.').length).toBeGreaterThan(0))
  })

  test('your columns, rows and words drive the content', () => {
    reduced(
      <CoverageGrid
        columns={[{ id: 'fw', label: 'Firewall', tone: 'chart-2' }]}
        rows={[
          { id: 'a', label: 'Exfil', depth: [2] },
          { id: 'b', label: 'Beaconing', depth: [0] },
        ]}
        copy={{ title: 'Coverage', review: 'Look' }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Coverage' })).toBeInTheDocument()
    expect(screen.getByText('1 of 2 covered')).toBeInTheDocument()
    expect(row('Beaconing')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: 'Draft 1 rule' })).toBeEnabled()
  })

  test('copy words the depth unit and the draft, and maxDepth sets what fills a cell', () => {
    reduced(
      <CoverageGrid
        columns={[
          { id: 'unit', label: 'Unit', tone: 'chart-1' },
          { id: 'e2e', label: 'E2E', tone: 'chart-3' },
        ]}
        rows={[{ id: 'search', label: 'Search', depth: [31, 0] }]}
        maxDepth={40}
        copy={{
          depth: (n: number) => `${n} tests`,
          noDepth: 'No tests',
          draft: (n: number) => `Draft ${n} test plan`,
          suggestion: (gaps: number, r: string) => `${r} lacks ${gaps} kind of test`,
        }}
      />,
    )
    const cells = within(row('Search')).getAllByRole('gridcell')
    expect(cells[0]).toHaveAccessibleName('Unit: 31 tests')
    expect(cells[1]).toHaveAccessibleName('E2E: No tests')
    expect(screen.getByText('Search lacks 1 kind of test')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Draft 1 test plan' })).toBeEnabled()
  })

  test('standalone draws a page with the title as the h1', () => {
    reduced(<CoverageGrid embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Detection coverage' })).toBeInTheDocument()
  })

  test('loading holds the matrix’s place and waits on the head and the foot', () => {
    reduced(<CoverageGrid loading />)
    expect(screen.getByText('Loading the coverage')).toBeInTheDocument()
    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
    expect(screen.queryByText('40 of 48 covered')).not.toBeInTheDocument()
    expect(screen.queryByText(/has 3 gaps/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Draft rules' })).toBeDisabled()
  })

  test('no rows shows the empty state, and your empty node replaces it', () => {
    const { unmount } = reduced(<CoverageGrid rows={[]} />)
    expect(screen.getByText('Nothing to cover')).toBeInTheDocument()
    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
    unmount()
    reduced(<CoverageGrid rows={[]} empty={<p>Add a row</p>} />)
    expect(screen.getByText('Add a row')).toBeInTheDocument()
    expect(screen.queryByText('Nothing to cover')).not.toBeInTheDocument()
  })

  test('an error shows its message and Retry calls onRetry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<CoverageGrid error="Couldn’t load the coverage." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load the coverage.')).toBeInTheDocument()
    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review gaps' })).toBeDisabled()
    expect(document.querySelector('footer p svg')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
