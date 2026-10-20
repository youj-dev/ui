import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SlideToConfirm, type SlideToConfirmProps } from './slide-to-confirm'

/* Reduced motion, so the spring back and the snap land at once. */
function renderSlide(props: SlideToConfirmProps = {}, dir: 'ltr' | 'rtl' = 'ltr') {
  const result = render(
    <YoujProvider reducedMotion="always" dir={dir}>
      <SlideToConfirm {...props} />
    </YoujProvider>,
  )
  const thumb = screen.getByRole('slider')
  // jsdom lays nothing out: a 300px track and a 40px thumb leave 260px of travel.
  Object.defineProperty(thumb.parentElement!, 'clientWidth', { value: 300 })
  Object.defineProperty(thumb, 'offsetWidth', { value: 40 })
  return { ...result, thumb, root: thumb.closest('[data-slot=slide-to-confirm]')! }
}

function dragBy(thumb: HTMLElement, dx: number) {
  fireEvent.pointerDown(thumb, { button: 0, clientX: 10, pointerId: 1 })
  fireEvent.pointerMove(thumb, { clientX: 10 + dx, pointerId: 1 })
  fireEvent.pointerUp(thumb, { clientX: 10 + dx, pointerId: 1 })
}

describe('SlideToConfirm', () => {
  test('is a slider named by its label and described by how to confirm from the keyboard', () => {
    const { thumb } = renderSlide()
    expect(thumb).toHaveAccessibleName('Slide to confirm')
    expect(thumb).toHaveAccessibleDescription('Use the arrow keys or End to reach the end, then press Enter.')
    expect(thumb).toHaveAttribute('aria-valuenow', '0')
    expect(thumb).toHaveAttribute('tabindex', '0')
  })

  test('a drag past 90% confirms; a shorter one springs back without confirming', () => {
    const onConfirm = vi.fn()
    const { thumb, root } = renderSlide({ onConfirm, label: 'Slide to pay' })
    dragBy(thumb, 200)
    expect(onConfirm).not.toHaveBeenCalled()
    expect(thumb).toHaveAttribute('aria-valuenow', '0')
    expect(root).toHaveAttribute('data-state', 'idle')

    dragBy(thumb, 250)
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(thumb).toHaveAttribute('aria-valuenow', '100')
  })

  test('the keyboard moves the thumb, and Enter confirms only at the end', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const { thumb } = renderSlide({ onConfirm })
    thumb.focus()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(thumb).toHaveAttribute('aria-valuenow', '20')
    await user.keyboard('{Enter}')
    expect(onConfirm).not.toHaveBeenCalled()
    await user.keyboard('{Home}')
    expect(thumb).toHaveAttribute('aria-valuenow', '0')
    await user.keyboard('{End}{Enter}')
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  test('awaits onConfirm: confirming, then confirmed with a check, and stays', async () => {
    let finish!: () => void
    const onConfirm = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)))
    const { thumb, root } = renderSlide({ onConfirm, confirmingLabel: 'Paying…', confirmedLabel: 'Paid' })
    dragBy(thumb, 260)
    expect(root).toHaveAttribute('data-state', 'confirming')
    expect(thumb).toHaveAttribute('aria-valuetext', 'Paying…')
    expect(thumb).toHaveAttribute('aria-readonly', 'true')
    expect(screen.getAllByRole('status').some((el) => el.textContent === 'Paying…')).toBe(true)
    // A second confirm while it runs is ignored.
    fireEvent.keyDown(thumb, { key: 'Enter' })
    expect(onConfirm).toHaveBeenCalledTimes(1)
    await act(async () => finish())
    expect(root).toHaveAttribute('data-state', 'confirmed')
    expect(thumb).toHaveAttribute('aria-valuetext', 'Paid')
    dragBy(thumb, -260)
    expect(thumb).toHaveAttribute('aria-valuenow', '100')
  })

  test('a rejection shows its message, springs back and returns to rest', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      const onConfirm = vi.fn(() => Promise.reject(new Error('Card declined')))
      const { thumb, root } = renderSlide({ onConfirm, resetAfter: 500 })
      dragBy(thumb, 260)
      await act(async () => {})
      expect(root).toHaveAttribute('data-state', 'error')
      expect(screen.getByRole('alert')).toHaveTextContent('Card declined')
      expect(root).toHaveTextContent('Card declined')
      expect(thumb).toHaveAttribute('aria-valuenow', '0')
      act(() => vi.advanceTimersByTime(520))
      expect(root).toHaveAttribute('data-state', 'idle')
      expect(root).toHaveTextContent('Slide to confirm')
      // It can be tried again.
      dragBy(thumb, 260)
      expect(onConfirm).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  test('errorLabel names the failure in place of the message', async () => {
    const { thumb } = renderSlide({ onConfirm: () => Promise.reject('nope'), errorLabel: 'Transfer failed' })
    dragBy(thumb, 260)
    await act(async () => {})
    expect(screen.getByRole('alert')).toHaveTextContent('Transfer failed')
  })

  test('disabled: out of the tab order, and neither keys nor drags move it', () => {
    const onConfirm = vi.fn()
    const { thumb, root } = renderSlide({ onConfirm, disabled: true })
    expect(thumb).toHaveAttribute('tabindex', '-1')
    expect(thumb).toHaveAttribute('aria-disabled', 'true')
    expect(root).toHaveAttribute('data-disabled')
    fireEvent.keyDown(thumb, { key: 'End' })
    dragBy(thumb, 260)
    expect(thumb).toHaveAttribute('aria-valuenow', '0')
    expect(onConfirm).not.toHaveBeenCalled()
  })

  test('mirrors in right-to-left: the thumb slides and steps toward the left', () => {
    const onConfirm = vi.fn()
    const { thumb } = renderSlide({ onConfirm }, 'rtl')
    fireEvent.keyDown(thumb, { key: 'ArrowLeft' })
    expect(thumb).toHaveAttribute('aria-valuenow', '10')
    fireEvent.keyDown(thumb, { key: 'Home' })
    dragBy(thumb, -260)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  test('takes its size and tone as data attributes', () => {
    const { root } = renderSlide({ size: 'lg', tone: 'danger' })
    expect(root).toHaveAttribute('data-size', 'lg')
    expect(root).toHaveAttribute('data-tone', 'danger')
  })
})
