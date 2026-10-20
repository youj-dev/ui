import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ChatMessageList } from './chat-message-list'
import { ChatReasoning, ChatTypingIndicator } from './chat-thinking'

const reduced = { wrapper: ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="always">{children}</YoujProvider> }

describe('ChatReasoning', () => {
  test('open while it streams, folded to "Thought for …" once done', async () => {
    // Reduced motion shows whole sentences as they complete.
    const { rerender } = render(<ChatReasoning content="Check the deployments first. Then" streaming />, reduced)
    const trigger = screen.getByRole('button', { name: /Thinking…/ })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await waitFor(() => expect(screen.getByText(/Check the deployments/)).toBeVisible())

    rerender(<ChatReasoning content="Check the deployments first." duration={8} />)
    expect(screen.getByRole('button', { name: /Thought for 8s/ })).toHaveAttribute('aria-expanded', 'false')
    // Reduced motion: folded at once.
    await waitFor(() => expect(screen.queryByText(/Check the deployments/)).toBeNull())
  })

  test('the reader’s choice sticks: closed while streaming stays closed; opened after stays open', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<ChatReasoning content="Thinking it through." streaming />, reduced)
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
    rerender(<ChatReasoning content="Thinking it through." duration={3} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false')

    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: /Thought for 3s/ })).toHaveAttribute('aria-expanded', 'true')
    await waitFor(() => expect(screen.getByText('Thinking it through.')).toBeVisible())
  })

  test('the trigger controls the panel', () => {
    render(<ChatReasoning content="Reasoning text." duration={74} open />, reduced)
    const trigger = screen.getByRole('button', { name: /Thought for 1m 14s/ })
    const panel = document.getElementById(trigger.getAttribute('aria-controls')!)
    expect(panel).toHaveTextContent('Reasoning text.')
  })
})

describe('ChatTypingIndicator', () => {
  test('on its own it is a status', () => {
    render(<ChatTypingIndicator />)
    expect(screen.getByRole('status')).toHaveTextContent('Thinking…')
  })

  test('in a conversation it is announced once through the list, not as a region of its own', async () => {
    render(
      <ChatMessageList>
        <ChatTypingIndicator key="typing" label="Searching the docs…" />
      </ChatMessageList>,
    )
    expect(screen.getAllByRole('status')).toHaveLength(1)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Searching the docs…'))
  })

  test('the sweep pauses offscreen and stops under reduced motion', () => {
    const callbacks: IntersectionObserverCallback[] = []
    const disconnect = vi.fn()
    const Real = globalThis.IntersectionObserver
    globalThis.IntersectionObserver = class {
      constructor(callback: IntersectionObserverCallback) {
        callbacks.push(callback)
      }
      observe() {}
      disconnect = disconnect
    } as unknown as typeof IntersectionObserver
    try {
      const { container, unmount } = render(<ChatTypingIndicator />, {
        wrapper: ({ children }) => <YoujProvider reducedMotion="never">{children}</YoujProvider>,
      })
      const shimmer = container.querySelector('.yj-chat-shimmer')!
      act(() => callbacks[0]!([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver))
      expect(shimmer).toHaveAttribute('data-paused')
      act(() => callbacks[0]!([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver))
      expect(shimmer).not.toHaveAttribute('data-paused')
      unmount()
      expect(disconnect).toHaveBeenCalled()
    } finally {
      globalThis.IntersectionObserver = Real
    }
    const { container } = render(<ChatTypingIndicator />, reduced)
    expect(container.querySelector('.yj-chat-shimmer')).toHaveAttribute('data-reduced-motion')
  })
})
