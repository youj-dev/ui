import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SessionComposer } from './chat-session.fixtures'

const panel = () => screen.getByRole('region', { name: 'Session details' })

describe('Session details under the composer', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
  afterEach(() => vi.useRealTimers())

  test('lists the session as rows with a context meter, and the footer holds the selects', () => {
    render(
      <YoujProvider reducedMotion="always">
        <SessionComposer />
      </YoujProvider>,
    )
    const rows = within(panel())
    expect(rows.getByText('Context')).toBeInTheDocument()
    expect(rows.getByText('18.2K')).toBeInTheDocument()
    expect(rows.getByRole('meter', { name: 'Context used' })).toHaveAttribute('aria-valuenow', '18200')
    expect(rows.getByText('Read, Edit, Bash +3')).toBeInTheDocument()
    expect(rows.getByText('MCP & Skills')).toBeInTheDocument()
    expect(rows.getByText('Idle')).toBeInTheDocument()
    expect(rows.getByRole('combobox', { name: 'Workspace' })).toHaveTextContent('Playground')
    expect(rows.queryByRole('status')).toBeNull()
  })

  test('sending turns Status to Running with a spinner, then the context grows by a turn', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(
      <YoujProvider reducedMotion="always">
        <SessionComposer />
      </YoujProvider>,
    )
    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Explain the build spike{Enter}')
    expect(within(panel()).getByText('Running')).toBeInTheDocument()
    expect(within(panel()).getByRole('status')).toHaveTextContent('Working')

    act(() => vi.advanceTimersByTime(3_500))
    expect(within(panel()).getByText('Idle')).toBeInTheDocument()
    expect(within(panel()).getByText('20.6K')).toBeInTheDocument()
    expect(within(panel()).getByRole('meter', { name: 'Context used' })).toHaveAttribute('aria-valuenow', '20600')
  })
})
