import { act, fireEvent, render, screen } from '@testing-library/react'
import { renderFull, renderReduced } from '@youj/core/test-utils'
import { AsyncAnnouncer, AsyncFeedback, useAsyncAction, type AsyncState } from './async-feedback'

function deferred() {
  let resolve!: () => void
  let reject!: (e: unknown) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

/* The settled hold (resetAfter) is a timer. The useAsyncAction tests fake it,
 * so a state asserted right after the action settles never depends on a
 * loaded worker reaching that line within 30ms; the hold ends only when a
 * test advances time. */
function fakeHold() {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  return () => act(() => vi.advanceTimersByTime(30))
}
afterEach(() => vi.useRealTimers())

function Harness({ onAction, onStateChange }: { onAction: () => unknown; onStateChange?: (s: AsyncState) => void }) {
  const { state, run } = useAsyncAction(onAction, { resetAfter: 30, onStateChange })
  return (
    <button type="button" data-state={state} onClick={run}>
      Run
    </button>
  )
}

test('useAsyncAction walks idle → pending → success → idle', async () => {
  const endHold = fakeHold()
  const d = deferred()
  const states: AsyncState[] = []
  render(<Harness onAction={() => d.promise} onStateChange={(s) => states.push(s)} />)
  const button = screen.getByRole('button')

  fireEvent.click(button)
  expect(button).toHaveAttribute('data-state', 'pending')
  await act(async () => d.resolve())
  expect(button).toHaveAttribute('data-state', 'success')
  endHold()
  expect(button).toHaveAttribute('data-state', 'idle')
  expect(states).toEqual(['pending', 'success', 'idle'])
})

test('useAsyncAction guards re-entry while pending and through a success hold', async () => {
  const endHold = fakeHold()
  const d = deferred()
  const onAction = vi.fn(() => d.promise)
  render(<Harness onAction={onAction} />)
  const button = screen.getByRole('button')

  fireEvent.click(button)
  fireEvent.click(button)
  expect(onAction).toHaveBeenCalledTimes(1)
  await act(async () => d.resolve())
  expect(button).toHaveAttribute('data-state', 'success')
  fireEvent.click(button)
  expect(onAction).toHaveBeenCalledTimes(1)
  endHold()
  expect(button).toHaveAttribute('data-state', 'idle')
  fireEvent.click(button)
  expect(onAction).toHaveBeenCalledTimes(2)
})

test('useAsyncAction lets an error be retried at once, and the old hold does not cut the retry short', async () => {
  const endHold = fakeHold()
  const first = deferred()
  const retry = deferred()
  const onAction = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(retry.promise)
  render(<Harness onAction={onAction} />)
  const button = screen.getByRole('button')

  fireEvent.click(button)
  await act(async () => first.reject(new Error('nope')))
  expect(button).toHaveAttribute('data-state', 'error')
  fireEvent.click(button)
  expect(onAction).toHaveBeenCalledTimes(2)
  expect(button).toHaveAttribute('data-state', 'pending')
  // The error's hold would have ended here: the retry is still pending.
  endHold()
  expect(button).toHaveAttribute('data-state', 'pending')
  await act(async () => retry.resolve())
  expect(button).toHaveAttribute('data-state', 'success')
})

test('useAsyncAction treats a synchronous throw, or a plain return, as a settled outcome', async () => {
  const { unmount } = render(
    <Harness
      onAction={() => {
        throw new Error('sync')
      }}
    />,
  )
  await act(async () => fireEvent.click(screen.getByRole('button')))
  expect(screen.getByRole('button')).toHaveAttribute('data-state', 'error')
  unmount()

  render(<Harness onAction={() => 42} />)
  await act(async () => fireEvent.click(screen.getByRole('button')))
  expect(screen.getByRole('button')).toHaveAttribute('data-state', 'success')
})

test('useAsyncAction clears its reset timer and ignores settling after unmount', async () => {
  const d = deferred()
  const onStateChange = vi.fn()
  const { unmount } = render(<Harness onAction={() => d.promise} onStateChange={onStateChange} />)
  fireEvent.click(screen.getByRole('button'))
  unmount()
  await act(async () => d.resolve())
  expect(onStateChange).toHaveBeenCalledTimes(1)
})

test('AsyncFeedback shows the idle content, a spinner while pending, and drawn marks with labels', () => {
  const { rerender, container } = renderReduced(<AsyncFeedback state="idle">Save</AsyncFeedback>)
  expect(screen.getByText('Save')).toBeInTheDocument()

  rerender(<AsyncFeedback state="success" successLabel="Saved">Save</AsyncFeedback>)
  expect(screen.getByText('Saved')).toBeInTheDocument()
  expect(container.querySelector('[data-icon="check"]')).toBeInTheDocument()

  rerender(<AsyncFeedback state="error" errorLabel="Couldn’t save">Save</AsyncFeedback>)
  expect(screen.getByText('Couldn’t save')).toBeInTheDocument()
  expect(container.querySelector('[data-icon="cross"]')).toBeInTheDocument()
})

test('AsyncFeedback shows a spinner with motion (the label kept for assistive tech) and the pending label when reduced', () => {
  const full = renderFull(<AsyncFeedback state="pending" pendingLabel="Saving…">Save</AsyncFeedback>)
  expect(full.container.querySelector('svg')).toBeInTheDocument()
  expect(screen.getByText('Saving…')).toHaveClass('sr-only')
  full.unmount()

  renderReduced(<AsyncFeedback state="pending" pendingLabel="Saving…">Save</AsyncFeedback>)
  expect(screen.getByText('Saving…')).toBeInTheDocument()
})

test('AsyncFeedback takes replacement marks and can drop the tint', () => {
  const { container } = renderReduced(
    <AsyncFeedback state="success" tint={false} icons={{ success: <i data-testid="mark" /> }}>
      Save
    </AsyncFeedback>,
  )
  expect(screen.getByTestId('mark')).toBeInTheDocument()
  expect(container.querySelector('.bg-success')).not.toBeInTheDocument()
})

test('AsyncFeedback tints the surface while settled, and the tints are hidden from assistive tech', () => {
  const { container } = renderReduced(<AsyncFeedback state="error">Save</AsyncFeedback>)
  const tints = container.querySelectorAll('.bg-success, .bg-danger')
  expect(tints).toHaveLength(2)
  tints.forEach((tint) => expect(tint).toHaveAttribute('aria-hidden', 'true'))
})

test('AsyncAnnouncer is polite for progress and success, assertive for errors', () => {
  const { rerender } = render(<AsyncAnnouncer state="pending" pendingLabel="Saving…" />)
  expect(screen.getByRole('status')).toHaveTextContent('Saving…')
  expect(screen.getByRole('alert')).toHaveTextContent('')

  rerender(<AsyncAnnouncer state="success" successLabel="Saved" />)
  expect(screen.getByRole('status')).toHaveTextContent('Saved')

  rerender(<AsyncAnnouncer state="error" errorLabel="Couldn’t save" />)
  expect(screen.getByRole('status')).toHaveTextContent('')
  expect(screen.getByRole('alert')).toHaveTextContent('Couldn’t save')

  rerender(<AsyncAnnouncer state="idle" />)
  expect(screen.getByRole('status')).toHaveTextContent('')
  expect(screen.getByRole('alert')).toHaveTextContent('')
})
