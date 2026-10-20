import { render, screen, within } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ProposalCard, type ProposalCardProps } from './proposal-card'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

const props: ProposalCardProps = {
  source: 'Route agent',
  title: 'Reroute load 4821',
  options: [
    { id: 'current', label: 'Harbor Fwy', value: '15:49', detail: '+47 min', tone: 'danger' },
    { id: 'proposed', label: 'Ridge Rd', value: '15:18', detail: '−31 min', proposed: true },
  ],
  facts: [{ label: 'Time saved', value: '31 min', tone: 'success' }],
  actions: <button type="button">Approve</button>,
  resolution: 'Approved by you',
}

describe('ProposalCard', () => {
  test('is an article named by its title, and says which option is proposed', () => {
    reduced(<ProposalCard {...props} />)
    const card = screen.getByRole('article', { name: 'Reroute load 4821' })
    const rows = within(card).getAllByRole('listitem')
    expect(rows[1]).toHaveTextContent('Ridge Rd, Proposed')
    expect(rows[1]).toHaveAttribute('data-proposed')
    expect(rows[0]).not.toHaveTextContent('Proposed')
    expect(within(card).getByText('Time saved').tagName).toBe('DT')
  })

  test('pending shows the actions; approved folds them away for the resolution and steps the old plan back', async () => {
    const { rerender } = reduced(<ProposalCard {...props} />)
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument()
    expect(screen.queryByText('Approved by you')).toBeNull()
    rerender(
      <YoujProvider reducedMotion="always">
        <ProposalCard {...props} status="approved" />
      </YoujProvider>,
    )
    expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull()
    expect(await screen.findByRole('status')).toHaveTextContent('Approved by you')
    const [current, proposed] = screen.getAllByRole('listitem')
    expect(current).toHaveAttribute('data-muted')
    expect(proposed).not.toHaveAttribute('data-muted')
    expect(screen.getByRole('article')).toHaveAttribute('data-status', 'approved')
  })

  test('dismissed fades the proposal and keeps the current plan', () => {
    reduced(<ProposalCard {...props} status="dismissed" />)
    const [current, proposed] = screen.getAllByRole('listitem')
    expect(proposed).toHaveAttribute('data-muted')
    expect(current).not.toHaveAttribute('data-muted')
  })

  test('takes the heading level it is given', () => {
    reduced(<ProposalCard {...props} headingLevel={2} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Reroute load 4821' })).toBeInTheDocument()
  })
})
