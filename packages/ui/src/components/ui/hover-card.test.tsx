import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card'

function Mention({ delay = 0 }: { delay?: number }) {
  return (
    <p>
      Thanks{' '}
      <HoverCard>
        <HoverCardTrigger href="#ada" delay={delay} closeDelay={0}>
          @ada
        </HoverCardTrigger>
        <HoverCardContent>Ada Lovelace, platform lead</HoverCardContent>
      </HoverCard>{' '}
      for the review.
    </p>
  )
}

const card = () => document.querySelector('[data-slot=hover-card-content]')

describe('HoverCard', () => {
  test('on touch, the first tap opens the card instead of following the link; the next follows it and closes the card', async () => {
    const user = userEvent.setup()
    // The real delay, so the card can't have opened on the tap's focus first.
    render(<Mention delay={500} />)
    const link = screen.getByRole('link', { name: '@ada' })
    // Read after React's handler: was the link's navigation canceled?
    const followed = vi.fn((event: Event) => event.defaultPrevented)
    document.addEventListener('click', followed)
    await user.pointer({ keys: '[TouchA]', target: link })
    await waitFor(() => expect(card()).toHaveTextContent('Ada Lovelace, platform lead'))
    expect(followed).toHaveLastReturnedWith(true)
    await user.pointer({ keys: '[TouchA]', target: link })
    expect(followed).toHaveLastReturnedWith(false)
    // …and the card goes with the page it previewed.
    await waitFor(() => expect(card()).toBeNull())
    document.removeEventListener('click', followed)
  })

  test('on touch, a tap outside closes the card without following the link', async () => {
    const user = userEvent.setup()
    render(<Mention delay={500} />)
    const link = screen.getByRole('link', { name: '@ada' })
    await user.pointer({ keys: '[TouchA]', target: link })
    await waitFor(() => expect(card()).not.toBeNull())
    await user.pointer({ keys: '[TouchA]', target: document.body })
    await waitFor(() => expect(card()).toBeNull())
  })

  test('a mouse click follows the link at once, as any link does', async () => {
    const user = userEvent.setup()
    render(<Mention delay={500} />)
    const followed = vi.fn((event: Event) => event.defaultPrevented)
    document.addEventListener('click', followed)
    await user.click(screen.getByRole('link', { name: '@ada' }))
    expect(followed).toHaveLastReturnedWith(false)
    document.removeEventListener('click', followed)
  })

  test('the trigger stays a plain link; resting on it opens the card, leaving closes it', async () => {
    const user = userEvent.setup()
    render(<Mention />)
    const link = screen.getByRole('link', { name: '@ada' })
    expect(link).toHaveAttribute('href', '#ada')
    await user.hover(link)
    await waitFor(() => expect(card()).toHaveTextContent('Ada Lovelace, platform lead'))
    expect(card()).toHaveClass('yj-pop')
    await user.unhover(link)
    await waitFor(() => expect(card()).toBeNull())
  })

  test('it waits for the delay before opening', () => {
    // The delay is a timer: faked, so "not yet" never depends on how fast a busy runner gets here.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      render(<Mention delay={300} />)
      const link = screen.getByRole('link', { name: '@ada' })
      fireEvent.pointerEnter(link, { pointerType: 'mouse' })
      fireEvent.mouseEnter(link)
      act(() => vi.advanceTimersByTime(299))
      expect(card()).toBeNull()
      act(() => vi.advanceTimersByTime(1))
      expect(card()).not.toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  test('keyboard focus opens it and Escape closes it, leaving focus on the link', async () => {
    const user = userEvent.setup()
    render(<Mention />)
    await user.tab()
    const link = screen.getByRole('link', { name: '@ada' })
    expect(link).toHaveFocus()
    await waitFor(() => expect(card()).not.toBeNull())
    await user.keyboard('{Escape}')
    await waitFor(() => expect(card()).toBeNull())
    expect(link).toHaveFocus()
  })

  test('its portal carries the youj scope', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always">
        <Mention />
      </YoujProvider>,
    )
    await user.hover(screen.getByRole('link', { name: '@ada' }))
    await waitFor(() => expect(card()).not.toBeNull())
    const portal = card()!.closest('[data-yj-reduced]') as HTMLElement
    expect(portal.style.getPropertyValue('--yj-motion')).toBe('0')
  })
})
