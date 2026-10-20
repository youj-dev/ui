import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ChatMessageList } from './chat-message-list'
import { ChatToolApproval, type ChatToolApprovalProps } from './chat-tool-approval'

const reduced = { wrapper: ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="always">{children}</YoujProvider> }
const base: ChatToolApprovalProps = {
  name: 'send_email',
  summary: 'Email finance about invoice 4821',
  reason: 'You asked me to chase it.',
  args: { to: 'finance@acme.test', retries: 3, password: 'hunter2', body: 'x'.repeat(200) },
  scope: 'this project',
}

describe('ChatToolApproval', () => {
  test('shows the tool, summary, reason, arguments and a risk tier in words', () => {
    render(<ChatToolApproval {...base} risk="high" />, reduced)
    const group = screen.getByRole('group', { name: 'send_email' })
    expect(group).toHaveAttribute('data-yj-risk', 'high')
    expect(screen.getByText('Email finance about invoice 4821')).toBeInTheDocument()
    expect(screen.getByText(/You asked me to chase it/)).toBeInTheDocument()
    expect(screen.getByText('High risk')).toBeInTheDocument()
    expect(screen.getByText('finance@acme.test')).toBeInTheDocument()
    for (const name of ['Allow once', 'Always allow for this project', 'Deny', 'Edit']) expect(screen.getByRole('button', { name })).toBeInTheDocument()
  })

  test('masks sensitive values until revealed, and folds long ones', async () => {
    const user = userEvent.setup()
    render(<ChatToolApproval {...base} />, reduced)
    expect(screen.queryByText('hunter2')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(screen.getByText('hunter2')).toBeInTheDocument()
    const more = screen.getByRole('button', { name: 'Show more' })
    expect(more).toHaveAttribute('aria-expanded', 'false')
    await user.click(more)
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true')
  })

  test('each action reports its decision, scope and arguments, and resolves an uncontrolled card', async () => {
    const user = userEvent.setup()
    const onDecision = vi.fn()
    render(<ChatToolApproval {...base} onDecision={onDecision} approver="Maya Chen" />, reduced)
    await user.click(screen.getByRole('button', { name: 'Always allow for this project' }))
    expect(onDecision).toHaveBeenCalledWith({ decision: 'allow', scope: 'always', args: base.args })
    expect(document.querySelector('[data-slot=chat-tool-approval]')).toHaveAttribute('data-status', 'approved')
    expect(screen.getByText(/Approved by Maya Chen/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Deny' })).not.toBeInTheDocument()
  })

  test('a controlled card stays pending until its status changes', async () => {
    const user = userEvent.setup()
    const onDecision = vi.fn()
    const { rerender } = render(<ChatToolApproval {...base} status="pending" onDecision={onDecision} />, reduced)
    await user.click(screen.getByRole('button', { name: 'Deny' }))
    expect(onDecision).toHaveBeenCalledWith(expect.objectContaining({ decision: 'deny', scope: 'once' }))
    expect(screen.getByRole('button', { name: 'Allow once' })).toBeInTheDocument()
    rerender(<ChatToolApproval {...base} status="denied" resolution={{ by: 'Maya', reason: 'Too broad' }} />)
    expect(screen.getByText(/Denied by Maya/)).toBeInTheDocument()
    expect(screen.getByText(/Reason: Too broad/)).toBeInTheDocument()
  })

  test('Edit validates against each value’s type, then approves with the edited arguments', async () => {
    const user = userEvent.setup()
    const onDecision = vi.fn()
    const validate = (key: string, value: unknown) => (key === 'retries' && (value as number) > 5 ? 'At most 5' : undefined)
    render(<ChatToolApproval {...base} args={{ to: 'a@b.test', retries: 3 }} onDecision={onDecision} validate={validate} />, reduced)
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    const retries = screen.getByLabelText('retries')
    await user.clear(retries)
    await user.type(retries, 'many')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Enter a number')).toBeInTheDocument()
    expect(retries).toHaveAttribute('aria-invalid', 'true')
    expect(retries).toHaveFocus()
    await user.clear(retries)
    await user.type(retries, '9')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('At most 5')).toBeInTheDocument()
    await user.clear(retries)
    await user.type(retries, '4')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Edited')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Allow once' }))
    expect(onDecision).toHaveBeenCalledWith({ decision: 'allow', scope: 'once', args: { to: 'a@b.test', retries: 4 } })
  })

  test('Escape cancels an edit and returns focus to Edit', async () => {
    const user = userEvent.setup()
    render(<ChatToolApproval {...base} args={{ to: 'a@b.test' }} />, reduced)
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Edit' })).toHaveFocus())
  })

  test('focus lands on the summary, not on Allow, and Enter allows only below high risk', async () => {
    const user = userEvent.setup()
    const onDecision = vi.fn()
    const { unmount } = render(<ChatToolApproval {...base} risk="high" autoFocus onDecision={onDecision} />, reduced)
    expect(screen.getByText('Email finance about invoice 4821')).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onDecision).not.toHaveBeenCalled()
    unmount()

    render(<ChatToolApproval {...base} risk="low" autoFocus onDecision={onDecision} />, reduced)
    expect(screen.getByText('Email finance about invoice 4821')).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onDecision).toHaveBeenCalledWith(expect.objectContaining({ decision: 'allow', scope: 'once' }))
  })

  test('every state names itself, and a failure says why', async () => {
    const { rerender } = render(<ChatToolApproval {...base} status="expired" />, reduced)
    expect(screen.getAllByText('Expired').length).toBeGreaterThan(0)
    expect(screen.getByText('The agent did not run this.')).toBeInTheDocument()
    rerender(<ChatToolApproval {...base} status="failed" error="403: no scope" />)
    expect(await screen.findByRole('alert')).toHaveTextContent('403: no scope')
    rerender(<ChatToolApproval {...base} status="done" duration={1400} />)
    expect(screen.getByText('Done · 1.4s')).toBeInTheDocument()
  })

  test('a new request and each state change are announced once', async () => {
    const { rerender } = render(<ChatToolApproval {...base} status="pending" risk="high" />)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('send_email needs your approval. High risk.'))
    rerender(<ChatToolApproval {...base} status="approved" />)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('send_email: approved'))
  })

  test('inside a conversation it speaks through the list, and stays quiet as history', async () => {
    const list = (status: 'approved' | 'running') => (
      <ChatMessageList>
        <ChatToolApproval key="t" {...base} status={status} />
      </ChatMessageList>
    )
    const { rerender } = render(list('approved'))
    const live = document.querySelector('[data-slot=chat-message-list-status]')!
    // youj-allow: sleep — proving history is not announced has no condition to wait for, only time to give it.
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(live).toBeEmptyDOMElement()
    rerender(list('running'))
    await waitFor(() => expect(live).toHaveTextContent('send_email: running'))
  })
})
