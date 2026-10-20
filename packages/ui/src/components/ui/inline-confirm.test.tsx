import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { de } from '@youj/core/locales/de'
import { InlineConfirm, type InlineConfirmProps } from './inline-confirm'

function deferred() {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

/* Reduced motion, so the swap lands at once. */
function renderConfirm(props: Partial<InlineConfirmProps> = {}) {
  const onConfirm = props.onConfirm ?? vi.fn()
  const result = render(
    <YoujProvider reducedMotion="always">
      <InlineConfirm onConfirm={onConfirm} {...props}>
        {props.children ?? 'Delete'}
      </InlineConfirm>
      <button type="button">Elsewhere</button>
    </YoujProvider>,
  )
  const root = result.container.querySelector('[data-slot=inline-confirm]')!
  return { ...result, root, onConfirm }
}

const polite = () => screen.getAllByRole('status').find((el) => el.dataset.slot === 'inline-confirm-announcer')!

describe('InlineConfirm', () => {
  afterEach(() => vi.useRealTimers())

  test('pressing the trigger asks in place, moves focus to the confirm button and announces the question', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const { root, onConfirm } = renderConfirm({ onOpenChange, confirmLabel: 'Delete file' })
    expect(root).toHaveAttribute('data-state', 'closed')
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(root).toHaveAttribute('data-state', 'open')
    expect(screen.getByRole('group', { name: 'Are you sure?' })).toBe(root)
    expect(screen.getByRole('button', { name: 'Delete file' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(polite()).toHaveTextContent('Are you sure?')
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  test('Escape cancels without running the action and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    const onKeyDown = vi.fn()
    const onConfirm = vi.fn()
    const { container } = render(
      <YoujProvider reducedMotion="always">
        <div onKeyDown={onKeyDown}>
          <InlineConfirm onConfirm={onConfirm}>Delete</InlineConfirm>
        </div>
      </YoujProvider>,
    )
    const root = container.querySelector('[data-slot=inline-confirm]')!
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.keyboard('{Escape}')
    expect(root).toHaveAttribute('data-state', 'closed')
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveFocus()
    expect(onConfirm).not.toHaveBeenCalled()
    // Escape was answered here, not passed on to a dialog around it.
    expect(onKeyDown).not.toHaveBeenCalled()
  })

  test('Cancel folds back and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const { root, onConfirm } = renderConfirm({ onOpenChange })
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(root).toHaveAttribute('data-state', 'closed')
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveFocus()
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  test('focus leaving the row folds it back', async () => {
    const user = userEvent.setup()
    const { root } = renderConfirm()
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }))
    expect(root).toHaveAttribute('data-state', 'closed')
    expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus()
  })

  test('an unanswered question folds back after the timeout; timeout={false} waits', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { root, unmount } = renderConfirm({ timeout: 3000 })
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    act(() => vi.advanceTimersByTime(2900))
    expect(root).toHaveAttribute('data-state', 'open')
    act(() => vi.advanceTimersByTime(200))
    expect(root).toHaveAttribute('data-state', 'closed')
    // Focus was in the row, so it lands on the trigger rather than the page.
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveFocus()
    unmount()

    const waiting = renderConfirm({ timeout: false })
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    act(() => vi.advanceTimersByTime(60_000))
    expect(waiting.root).toHaveAttribute('data-state', 'open')
  })

  test('confirming awaits onConfirm through pending and done, then folds back into the trigger', async () => {
    const work = deferred()
    const onConfirm = vi.fn(() => work.promise)
    const { root } = renderConfirm({ onConfirm, pendingLabel: 'Deleting…', successLabel: 'Deleted', resetAfter: 40 })
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    const confirm = screen.getByRole('button', { name: 'Delete' })
    fireEvent.click(confirm)
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(confirm).toHaveAttribute('data-state', 'pending')
    expect(confirm).toHaveAttribute('aria-busy', 'true')
    // While it runs the question can't be dismissed.
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    fireEvent.keyDown(confirm, { key: 'Escape' })
    expect(root).toHaveAttribute('data-state', 'open')

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    await act(async () => work.resolve())
    expect(confirm).toHaveAttribute('data-state', 'success')
    // The tick stays square; the outcome is announced.
    expect(screen.getByText('Deleted')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(40))
    expect(root).toHaveAttribute('data-state', 'closed')
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveFocus()
  })

  test('a rejection shows the error, then folds back so the person can try again', async () => {
    const work = deferred()
    const { root } = renderConfirm({ onConfirm: () => work.promise, errorLabel: (error) => (error as Error).message, resetAfter: 40 })
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    const confirm = screen.getByRole('button', { name: 'Delete' })
    fireEvent.click(confirm)
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    await act(async () => work.reject(new Error('Offline')))
    expect(confirm).toHaveAttribute('data-state', 'error')
    expect(screen.getByRole('alert')).toHaveTextContent('Offline')
    act(() => vi.advanceTimersByTime(40))
    expect(root).toHaveAttribute('data-state', 'closed')
  })

  test('destructive gives the confirm button the danger fill', () => {
    renderConfirm({ destructive: true })
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveAttribute('data-variant', 'danger')
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute('data-variant', 'outline')
  })

  test('a disabled trigger does not open', () => {
    const { root } = renderConfirm({ disabled: true })
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(root).toHaveAttribute('data-state', 'closed')
  })

  test('its strings come from the provider’s language pack and can be renamed', () => {
    render(
      <YoujProvider reducedMotion="always" labels={de}>
        <InlineConfirm onConfirm={vi.fn()}>Löschen</InlineConfirm>
        <InlineConfirm onConfirm={vi.fn()} prompt="Delete for everyone?" cancelLabel="Keep">
          Remove
        </InlineConfirm>
      </YoujProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }))
    expect(screen.getByRole('group', { name: 'Sind Sie sicher?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abbrechen' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(screen.getByRole('group', { name: 'Delete for everyone?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument()
  })
})
