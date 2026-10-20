import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { CheckGate } from './check-gate'
import { GROUPS } from './check-gate/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const groups = () => within(screen.getByRole('region', { name: 'Suites' })).getAllByRole('listitem')

const loan = [
  { id: 'Identity', owner: 'KYC team', total: 10, passed: 10, delta: null },
  { id: 'Income', owner: 'Underwriting', total: 20, passed: 17, delta: -2 },
]

describe('Check gate block', () => {
  test('names the build, its history and every suite', () => {
    reduced(<CheckGate />)
    expect(screen.getByRole('heading', { level: 2, name: 'Release checks' })).toBeInTheDocument()
    expect(screen.getByText('Harbor iOS 5.2 · build 4127 · ran 14:06 on 6 devices')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Pass rate of the last 12 builds against the 97% bar: 4 fell under it. The candidate is at 98.4%.' })).toBeInTheDocument()
    expect(screen.getByText('3 suites blocking')).toBeInTheDocument()
    const rows = groups()
    expect(rows).toHaveLength(6)
    expect(rows[2]).toHaveTextContent('checkout-e2e')
    expect(rows[2]).toHaveTextContent('payments · 9 failed')
    expect(rows[2]).toHaveTextContent('89.5%')
    expect(rows[2]).toHaveTextContent('+3.9 since 4126')
    expect(rows[5]).toHaveTextContent('unchanged since 4126')
  })

  test('the candidate is compared with the build before it', () => {
    reduced(<CheckGate />)
    expect(screen.getByText('+1.1 pt on 4126')).toBeInTheDocument()
    expect(screen.getByText('1,897 of 1,928 tests passed')).toBeInTheDocument()
  })

  test('the filter and Review blockers show only the groups under the bar', async () => {
    const user = userEvent.setup()
    reduced(<CheckGate />)
    await user.click(screen.getByRole('button', { name: 'Blocking' }))
    await waitFor(() => expect(groups()).toHaveLength(3))
    expect(groups().map((row) => row.querySelector('span')?.textContent)).toEqual(['checkout-e2e', 'accessibility', 'startup-budget'])
    await user.click(screen.getByRole('button', { name: 'All' }))
    await waitFor(() => expect(groups()).toHaveLength(6))
    await user.click(screen.getByRole('button', { name: 'Review 3 blockers' }))
    await waitFor(() => expect(groups()).toHaveLength(3))
    expect(screen.getByRole('button', { name: 'Blocking' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('with every group over the bar nothing blocks', async () => {
    const user = userEvent.setup()
    const clear = GROUPS.map((s) => ({ ...s, passed: s.total }))
    reduced(<CheckGate groups={clear} />)
    expect(screen.getByText('Nothing blocking')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'No blockers' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Blocking' }))
    expect(screen.getByText('Nothing blocking: every suite cleared the bar.')).toBeInTheDocument()
  })

  test('your candidates, groups, bar and words drive the card: no mobile word is left', async () => {
    const user = userEvent.setup()
    const onPromote = vi.fn()
    reduced(
      <CheckGate
        threshold={90}
        groups={loan}
        candidates={[{ id: 'LN-1', rate: 80 }, { id: 'LN-2', rate: 93 }, { id: 'LN-3', rate: 90 }]}
        onPromote={onPromote}
        copy={{
          title: 'Underwriting checks',
          subject: 'Application LN-3',
          groups: 'Check groups',
          blockingCount: (n) => `${n} blocking`,
          checks: (passed, total) => `${passed} of ${total} checks passed`,
          history: (n) => `Last ${n} applications`,
          promote: 'Approve and fund',
        }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Underwriting checks' })).toBeInTheDocument()
    expect(screen.getByText(/Application LN-3/)).toBeInTheDocument()
    expect(screen.getByText('1 blocking')).toBeInTheDocument()
    expect(screen.getByText('27 of 30 checks passed')).toBeInTheDocument()
    expect(screen.getByText('-3.0 pt on LN-2')).toBeInTheDocument()
    const rows = within(screen.getByRole('region', { name: 'Check groups' })).getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(rows[1]).toHaveTextContent('Income')
    expect(rows[1]).toHaveTextContent('85.0%')
    expect(screen.queryByText(/suite|build|TestFlight|test/i)).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Approve and fund' }))
    await waitFor(() => expect(onPromote).toHaveBeenCalledOnce())
  })

  test('Ship runs the app’s promotion', async () => {
    const user = userEvent.setup()
    const onPromote = vi.fn()
    reduced(<CheckGate onPromote={onPromote} />)
    await user.click(screen.getByRole('button', { name: 'Ship to TestFlight' }))
    await waitFor(() => expect(onPromote).toHaveBeenCalledOnce())
  })

  test('embedded, it is a named section with an h2, its parts under h3s, and no page around it', () => {
    reduced(<CheckGate embedded />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Release checks' })).toContainElement(screen.getByRole('heading', { level: 2 }))
    expect(screen.getByRole('heading', { level: 3, name: 'Suites' })).toBeInTheDocument()
  })
})
