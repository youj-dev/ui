import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core'
import { TooltipProvider } from '@youj/react'
import { MotionPlayground } from './playground'

function open(search = '', reducedMotion: 'user' | 'always' = 'user') {
  window.history.replaceState(null, '', `/docs/motion/playground${search}`)
  return render(
    <YoujProvider reducedMotion={reducedMotion}>
      <TooltipProvider>
        <MotionPlayground />
      </TooltipProvider>
    </YoujProvider>,
  )
}

const code = () => screen.getByLabelText(/the code for this view/).textContent ?? ''

function mockClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  return writeText
}

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('MotionPlayground', () => {
  it('opens on Springs, with the code for the token on stage', () => {
    open()
    expect(screen.getByRole('tab', { name: 'Springs' })).toHaveAttribute('aria-selected', 'true')
    expect(code()).toContain("k.spring('smooth')")
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Springs')
  })

  it('opens the view a link names', () => {
    open('?tab=tweens&duration=slow&ease=emphasized')
    expect(screen.getByRole('tab', { name: 'Tweens' })).toHaveAttribute('aria-selected', 'true')
    expect(code()).toContain("k.tween('slow', 'emphasized')")
  })

  it('moves between views with the arrow keys and writes the view into the address', async () => {
    const user = userEvent.setup()
    open()
    await user.click(screen.getByRole('tab', { name: 'Springs' }))
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Tweens' })).toHaveAttribute('aria-selected', 'true')
    expect(code()).toContain("k.tween('base', 'enter')")
    await waitFor(() => expect(window.location.search).toBe('?tab=tweens'))
  })

  it('offers the closest token for a custom value, and using it puts the token in the code and the link', async () => {
    const user = userEvent.setup()
    open('?spring=0.5,0.2')
    expect(code()).toContain("{ type: 'spring', visualDuration: 0.5 * k.timeScale, bounce: 0.2 }")
    expect(screen.getByRole('note')).toHaveTextContent(/Custom, not a token/)
    await user.click(screen.getByRole('button', { name: 'Use settle' }))
    expect(code()).toContain("k.spring('settle')")
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
    await waitFor(() => expect(window.location.search).toBe('?spring=settle'))
  })

  it('steps a slider off a token with the arrow keys, and back onto it', async () => {
    const user = userEvent.setup()
    open()
    // jsdom can't measure Base UI's thumbs, so it keeps them hidden: find one by its label, as the ui slider tests do.
    const slider = screen.getAllByRole('slider', { hidden: true }).find((el) => el.getAttribute('aria-label') === 'Felt duration')!
    act(() => slider.focus())
    await user.keyboard('{ArrowRight}')
    expect(code()).toContain("{ type: 'spring', visualDuration: 0.37 * k.timeScale, bounce: 0 }")
    await user.keyboard('{ArrowRight}')
    expect(code()).toContain('visualDuration: 0.38 * k.timeScale')
    // Moving back toward the token, a step inside its reach lands on it.
    await user.keyboard('{ArrowLeft}')
    expect(code()).toContain("k.spring('smooth')")
  })

  it('moves the selection when an item on the stage is pressed', async () => {
    const user = userEvent.setup()
    open()
    const nav = screen.getByRole('navigation', { name: 'Demo sidebar' })
    await user.click(within(nav).getByRole('button', { name: 'Settings' }))
    expect(within(nav).getByRole('button', { name: 'Settings' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('button', { name: 'Analytics' })).not.toHaveAttribute('aria-current')
  })

  it('copies the code, and a link to the view', async () => {
    const writeText = mockClipboard()
    open('?tab=presence&preset=yj-dialog')
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy code' })))
    expect(writeText).toHaveBeenLastCalledWith(expect.stringContaining('className="yj-dialog'))
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy a link to this view' })))
    expect(writeText).toHaveBeenLastCalledWith(expect.stringMatching(/\/docs\/motion\/playground\?tab=presence&preset=yj-dialog$/))
    expect(screen.getByRole('button', { name: 'Link copied' })).toBeInTheDocument()
  })

  it('says so on every stage under reduced motion, and the reduced lanes both honor it', () => {
    open('?tab=reduced', 'always')
    expect(screen.getByText('reduced motion')).toBeInTheDocument()
    expect(screen.getByText(/Your reduced-motion setting is on, so both lanes are reduced/)).toBeInTheDocument()
    expect(screen.getAllByText(/reducedMotion="always"/).length).toBeGreaterThanOrEqual(2)
  })

  it('still shows all three personalities, whatever the site runs', () => {
    open('?tab=personalities')
    for (const name of ['precise', 'calm', 'lively']) expect(screen.getAllByText(new RegExp(name, 'i')).length).toBeGreaterThan(0)
  })

  it('renders every view, and unmounts mid-play without leaving anything running', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    for (const tab of ['springs', 'tweens', 'stagger', 'personalities', 'presence', 'reduced']) {
      vi.useFakeTimers()
      const { unmount } = open(`?tab=${tab}`)
      expect(screen.getByRole('tabpanel')).toBeInTheDocument()
      act(() => vi.advanceTimersByTime(100))
      unmount()
      act(() => vi.advanceTimersByTime(5000))
      vi.useRealTimers()
    }
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
  })
})
