import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ChatMessageList } from './chat-message-list'
import { ChatToolCall } from './chat-tool-call'

const reduced = { wrapper: ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="always">{children}</YoujProvider> }

describe('ChatToolCall', () => {
  test('one line at rest, named by the tool and its status; opening shows the arguments and the result', async () => {
    const user = userEvent.setup()
    render(<ChatToolCall name="get_deployments" args={{ project: 'orion', limit: 3 }} status="success" duration={1400} result={{ id: 'dpl_1', state: 'READY' }} />, reduced)
    const trigger = screen.getByRole('button', { name: 'get_deployments: Done · 1.4s' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveTextContent('project: orion, limit: 3')
    // A preview of the result while folded.
    await waitFor(() => expect(document.querySelector('[data-slot=chat-tool-call-preview]')).toHaveTextContent('"state": "READY"'))

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('region', { name: 'Arguments' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Result' })).toBeInTheDocument()
    expect(screen.getByText('"project"')).toHaveClass('own:text-accent-text')
  })

  test('Enter and Space toggle it from the keyboard', async () => {
    const user = userEvent.setup()
    render(<ChatToolCall name="search_docs" status="running" />)
    await user.tab()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard(' ')
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
  })

  test('an error shows why, and says it failed', () => {
    render(<ChatToolCall name="rollback" status="error" error="403: no permission" />, reduced)
    expect(screen.getByRole('button', { name: 'rollback: Failed' })).toBeInTheDocument()
    expect(document.querySelector('[data-slot=chat-tool-call]')).toHaveAttribute('data-status', 'error')
  })

  test('status changes are announced once each, through the conversation when inside one', async () => {
    const list = (status: 'running' | 'success') => (
      <ChatMessageList>
        <ChatToolCall key="t" name="query_metrics" status={status} result={status === 'success' ? '{}' : undefined} />
      </ChatMessageList>
    )
    const { rerender } = render(list('running'))
    const status = document.querySelector('[data-slot=chat-message-list-status]')!
    await new Promise((resolve) => setTimeout(resolve, 60))
    // Mounted with the list: history, not news.
    expect(status).toBeEmptyDOMElement()
    rerender(list('success'))
    await waitFor(() => expect(status).toHaveTextContent('query_metrics: done'))
  })

  test('on its own it has its own status region', async () => {
    const { rerender } = render(<ChatToolCall name="search_docs" status="running" />)
    rerender(<ChatToolCall name="search_docs" status="error" error="timeout" />)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('search_docs failed: timeout'))
  })
})
