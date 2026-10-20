import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

function Toolbar({ delay = 0 }: { delay?: number }) {
  return (
    <TooltipProvider delay={delay}>
      {['Bold', 'Italic'].map((label) => (
        <Tooltip key={label}>
          <TooltipTrigger aria-label={label}>{label[0]}</TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </TooltipProvider>
  )
}

const tooltip = () => document.querySelector('[data-slot=tooltip-content]')

describe('Tooltip', () => {
  test('shows on hover and hides when the pointer leaves; the trigger keeps its own name', async () => {
    const user = userEvent.setup()
    render(<Toolbar />)
    const bold = screen.getByRole('button', { name: 'Bold' })
    await user.hover(bold)
    await waitFor(() => expect(tooltip()).toHaveTextContent('Bold'))
    expect(tooltip()).toHaveClass('yj-tooltip')
    expect(bold).toHaveAttribute('data-popup-open')
    await user.unhover(bold)
    await waitFor(() => expect(tooltip()).toBeNull())
  })

  test('shows on keyboard focus without waiting, and Escape dismisses it', async () => {
    const user = userEvent.setup()
    render(<Toolbar delay={10_000} />)
    await user.tab()
    await waitFor(() => expect(tooltip()).toHaveTextContent('Bold'))
    await user.keyboard('{Escape}')
    await waitFor(() => expect(tooltip()).toBeNull())
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveFocus()
  })

  test('in a provider, the neighbour opens at once and skips its animation', async () => {
    const user = userEvent.setup()
    render(<Toolbar delay={50} />)
    await user.hover(screen.getByRole('button', { name: 'Bold' }))
    await waitFor(() => expect(tooltip()).toHaveTextContent('Bold'))
    await user.hover(screen.getByRole('button', { name: 'Italic' }))
    await waitFor(() => expect(tooltip()).toHaveTextContent('Italic'))
    expect(tooltip()).toHaveAttribute('data-instant')
  })

  test('its portal carries the youj scope', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always" timeScale={4}>
        <Toolbar />
      </YoujProvider>,
    )
    await user.hover(screen.getByRole('button', { name: 'Bold' }))
    await waitFor(() => expect(tooltip()).not.toBeNull())
    const portal = tooltip()!.closest('[data-yj-reduced]') as HTMLElement
    expect(portal.style.getPropertyValue('--yj-motion')).toBe('0')
    expect(portal.style.getPropertyValue('--yj-time-scale')).toBe('4')
  })
})

describe('Tooltip on touch', () => {
  function Bold({ longPress, onClick }: { longPress?: boolean; onClick?: () => void }) {
    return (
      <Tooltip longPress={longPress}>
        <TooltipTrigger aria-label="Bold" onClick={onClick}>
          B
        </TooltipTrigger>
        <TooltipContent>Bold</TooltipContent>
      </Tooltip>
    )
  }
  const touchDown = (el: Element, x = 10, y = 10) => fireEvent.pointerDown(el, { pointerType: 'touch', clientX: x, clientY: y })

  afterEach(() => vi.useRealTimers())

  test('by default a touch never opens it, held or tapped, so none is left stuck', async () => {
    vi.useFakeTimers()
    const onClick = vi.fn()
    render(<Bold onClick={onClick} />)
    const bold = screen.getByRole('button', { name: 'Bold' })
    touchDown(bold)
    act(() => vi.advanceTimersByTime(1000))
    fireEvent.pointerUp(bold, { pointerType: 'touch' })
    fireEvent.click(bold)
    expect(tooltip()).toBeNull()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('with longPress, holding shows it, the press does not activate the control, and it hides after the finger lifts', async () => {
    // Only the timeouts: Base UI's exit frame runs for real once the tooltip closes.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const onClick = vi.fn()
    render(<Bold longPress onClick={onClick} />)
    const bold = screen.getByRole('button', { name: 'Bold' })
    touchDown(bold)
    act(() => vi.advanceTimersByTime(499))
    expect(tooltip()).toBeNull()
    act(() => vi.advanceTimersByTime(1))
    expect(tooltip()).toHaveTextContent('Bold')
    fireEvent.pointerUp(bold, { pointerType: 'touch' })
    fireEvent.click(bold)
    expect(onClick).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1499))
    expect(bold).toHaveAttribute('data-popup-open')
    act(() => vi.advanceTimersByTime(1))
    expect(bold).not.toHaveAttribute('data-popup-open')
    vi.useRealTimers()
    await waitFor(() => expect(tooltip()).toBeNull())
    // The next tap is a tap again.
    touchDown(bold)
    fireEvent.pointerUp(bold, { pointerType: 'touch' })
    fireEvent.click(bold)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('a finger that moves (a scroll) cancels the long press, and a mouse never starts one', () => {
    vi.useFakeTimers()
    render(<Bold longPress />)
    const bold = screen.getByRole('button', { name: 'Bold' })
    touchDown(bold, 10, 10)
    fireEvent.pointerMove(bold, { pointerType: 'touch', clientX: 10, clientY: 40 })
    act(() => vi.advanceTimersByTime(1000))
    expect(tooltip()).toBeNull()
    fireEvent.pointerDown(bold, { pointerType: 'mouse', button: 0 })
    act(() => vi.advanceTimersByTime(1000))
    expect(tooltip()).toBeNull()
  })

  test('unmounting mid-press leaves no timer behind', () => {
    vi.useFakeTimers()
    const { unmount } = render(<Bold longPress />)
    touchDown(screen.getByRole('button', { name: 'Bold' }))
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
