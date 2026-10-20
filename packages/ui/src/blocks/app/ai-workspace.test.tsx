import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { AiWorkspace, type AiWorkspaceProps } from './ai-workspace'

const reduced = (props: AiWorkspaceProps = {}) =>
  render(
    <YoujProvider reducedMotion="always">
      <AiWorkspace autoplay={false} {...props} />
    </YoujProvider>,
  )

const chats = () => within(screen.getAllByRole('navigation', { name: 'Chats' })[0]!)

describe('AI workspace', () => {
  test('lists the chats by group, the open one current and titling the page', () => {
    reduced({ embedded: false })
    expect(screen.getByRole('main')).toBeInTheDocument()
    const nav = chats()
    expect(nav.getByText('Pinned')).toBeInTheDocument()
    expect(nav.getByText('Previous 7 days')).toBeInTheDocument()
    expect(nav.getByRole('button', { name: /Checkout conversion dip/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('heading', { level: 1, name: 'Checkout conversion dip' })).toBeInTheDocument()
    // The finished answer: its tool calls, cited sources and follow-ups.
    const log = screen.getByRole('log')
    expect(log).toHaveTextContent('query_metrics')
    expect(log).toHaveTextContent('Most likely cause')
    expect(screen.getByRole('group', { name: 'Follow-ups' })).toBeInTheDocument()
  })

  test('by default, a page of the app’s frame: the shared page header holds the open chat’s title and Share, with no main of its own', () => {
    const { container } = reduced()
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    const header = container.querySelector('[data-slot=app-page-header]')!
    expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'Checkout conversion dip' }))
    expect(header).toContainElement(screen.getByRole('button', { name: 'Share' }))
    expect(screen.getByRole('log')).toHaveTextContent('Most likely cause')
  })

  test('search narrows the list and says when nothing matches', async () => {
    const user = userEvent.setup()
    reduced()
    const search = screen.getAllByRole('searchbox', { name: 'Search chats' })[0]!
    await user.type(search, 'pricing')
    expect(chats().getByRole('button', { name: /Seat pricing benchmarks/ })).toBeInTheDocument()
    expect(chats().queryByRole('button', { name: /Checkout conversion dip/ })).not.toBeInTheDocument()
    await user.clear(search)
    await user.type(search, 'zebra')
    expect(chats().getByRole('status')).toHaveTextContent('No chats match “zebra”.')
  })

  test('opening another chat shows its conversation; New chat offers ways in', async () => {
    const user = userEvent.setup()
    reduced()
    await user.click(chats().getByRole('button', { name: /Why teams downgrade/ }))
    expect(chats().getByRole('button', { name: /Why teams downgrade/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('log')).toHaveTextContent('Unused seats')
    await user.click(screen.getAllByRole('button', { name: 'New chat' })[0]!)
    expect(screen.getByRole('heading', { level: 1, name: 'New chat' })).toBeInTheDocument()
    expect(screen.queryByRole('log')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Explain a drop/ })).toBeInTheDocument()
  })

  test('a question in a new chat names it, files it under Today and plays the answer', async () => {
    vi.useFakeTimers()
    try {
      reduced()
      fireEvent.click(screen.getAllByRole('button', { name: 'New chat' })[0]!)
      fireEvent.click(screen.getByRole('button', { name: /Size the impact/ }))
      const fresh = chats().getByRole('button', { name: /How much revenue did the Android/ })
      expect(fresh).toHaveAttribute('aria-current', 'page')
      expect(screen.getByRole('button', { name: /Stop/ })).toBeInTheDocument()
      await act(() => vi.advanceTimersByTimeAsync(12_000))
      const log = screen.getByRole('log')
      // The first query fails and the second recovers: both calls stay visible.
      expect(log).toHaveTextContent('The warehouse took too long to answer.')
      expect(log).toHaveTextContent('$55,850')
      expect(screen.queryByRole('button', { name: /Stop/ })).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  test('with motion, the opening answer streams in; Stop keeps what arrived; unmounting clears every timer', async () => {
    vi.useFakeTimers()
    try {
      const { unmount } = render(
        <YoujProvider reducedMotion="never">
          <AiWorkspace />
        </YoujProvider>,
      )
      const log = screen.getByRole('log')
      expect(log).toHaveTextContent('Reading your workspace…')
      await act(() => vi.advanceTimersByTimeAsync(4_000))
      expect(log).toHaveTextContent('query_metrics')
      expect(log).not.toHaveTextContent('Most likely cause')
      await act(() => vi.advanceTimersByTimeAsync(600))
      fireEvent.click(screen.getByRole('button', { name: /Stop/ }))
      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(log).not.toHaveTextContent('Most likely cause')
      expect(screen.queryByRole('group', { name: 'Follow-ups' })).not.toBeInTheDocument()

      // A reply mid-flight: its timers go with the workspace.
      fireEvent.click(screen.getAllByRole('button', { name: 'New chat' })[0]!)
      fireEvent.click(screen.getByRole('button', { name: /Write an update/ }))
      await act(() => vi.advanceTimersByTimeAsync(100))
      const before = vi.getTimerCount()
      unmount()
      expect(vi.getTimerCount()).toBeLessThan(before)
    } finally {
      vi.useRealTimers()
    }
  })
})
