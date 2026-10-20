import { type ComponentProps } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import type { AsyncState } from '@youj/motion'
import { AsyncButton } from './async-button'

describe('AsyncButton', () => {
  describe('onAction', () => {
    function deferred() {
      let resolve!: () => void
      let reject!: (error: Error) => void
      const promise = new Promise<void>((res, rej) => {
        resolve = res
        reject = rej
      })
      return { promise, resolve, reject }
    }
    const labels = { pendingLabel: 'Saving…', successLabel: 'Saved', errorLabel: 'Couldn’t save' }
    const polite = () => screen.getAllByRole('status').find((el) => el.getAttribute('aria-live') === 'polite')!

    /* A settled state (success, error) holds for a timer: resetAfter, or 3 ×
     * deliberate. Tests that assert one fake that timer from just before the
     * action settles, so a busy runner reaching the assertion late still sees
     * the state instead of the button already back at rest; the hold ends only
     * when the test advances time. (user-event runs before: it waits on real
     * timers.) */
    function fakeHold() {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      return (ms: number) => act(() => vi.advanceTimersByTime(ms))
    }
    afterEach(() => vi.useRealTimers())

    test('runs the action: busy while pending, then Saved, then back to rest', async () => {
      const user = userEvent.setup()
      const work = deferred()
      const onActionStateChange = vi.fn()
      render(
        <AsyncButton onAction={() => work.promise} resetAfter={40} onActionStateChange={onActionStateChange} {...labels}>
          Save
        </AsyncButton>,
      )
      const button = screen.getByRole('button', { name: 'Save' })
      await user.click(button)

      expect(button).toHaveAttribute('data-state', 'pending')
      expect(button).toHaveAttribute('aria-busy', 'true')
      // Blocks presses without dropping focus.
      expect(button).toHaveAttribute('aria-disabled', 'true')
      expect(button).toHaveFocus()
      expect(button).toHaveTextContent('Saving…')
      expect(polite()).toHaveTextContent('Saving…')

      const endHold = fakeHold()
      await act(async () => work.resolve())
      expect(button).toHaveAttribute('data-state', 'success')
      expect(button).toHaveAccessibleName('Saved')
      expect(polite()).toHaveTextContent('Saved')
      expect(button).not.toHaveAttribute('aria-busy')

      endHold(40)
      expect(button).toHaveAttribute('data-state', 'idle')
      expect(button).toHaveAccessibleName('Save')
      expect(onActionStateChange.mock.calls.map(([state]) => state)).toEqual(['pending', 'success', 'idle'])
    })

    test('a double click (or a press while it runs) starts one action', async () => {
      const user = userEvent.setup()
      const work = deferred()
      const onAction = vi.fn(() => work.promise)
      render(
        <AsyncButton onAction={onAction} {...labels}>
          Save
        </AsyncButton>,
      )
      const button = screen.getByRole('button', { name: 'Save' })
      await user.dblClick(button)
      await user.keyboard('{Enter}')
      expect(onAction).toHaveBeenCalledTimes(1)
      const endHold = fakeHold()
      await act(async () => work.resolve())
      expect(button).toHaveAttribute('data-state', 'success')
      // Still settling: presses are ignored until it is back at rest.
      fireEvent.click(button)
      expect(onAction).toHaveBeenCalledTimes(1)
      endHold(3 * 560)
      expect(button).toHaveAttribute('data-state', 'idle')
      fireEvent.click(button)
      expect(onAction).toHaveBeenCalledTimes(2)
    })

    test('after an error a new press retries at once (the input was fixed), keeping the error until then', async () => {
      const first = deferred()
      const retry = deferred()
      const onAction = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(retry.promise)
      render(
        <AsyncButton onAction={onAction} {...labels}>
          Invite
        </AsyncButton>,
      )
      const button = screen.getByRole('button', { name: 'Invite' })
      fireEvent.click(button)
      const endHold = fakeHold()
      await act(async () => first.reject(new Error('Invalid email')))
      expect(button).toHaveAttribute('data-state', 'error')
      fireEvent.click(button)
      expect(onAction).toHaveBeenCalledTimes(2)
      expect(button).toHaveAttribute('data-state', 'pending')
      endHold(3 * 560)
      expect(button).toHaveAttribute('data-state', 'pending')
      await act(async () => retry.resolve())
      expect(button).toHaveAttribute('data-state', 'success')
    })

    test('a rejection shows the error, announces it assertively, then recovers', async () => {
      const user = userEvent.setup()
      const work = deferred()
      render(
        <AsyncButton onAction={() => work.promise} resetAfter={40} {...labels}>
          Save
        </AsyncButton>,
      )
      const button = screen.getByRole('button', { name: 'Save' })
      await user.click(button)
      const endHold = fakeHold()
      await act(async () => work.reject(new Error('offline')))
      expect(button).toHaveAttribute('data-state', 'error')
      expect(button).toHaveAccessibleName('Couldn’t save')
      expect(screen.getByRole('alert')).toHaveTextContent('Couldn’t save')
      endHold(40)
      expect(button).toHaveAttribute('data-state', 'idle')
      expect(screen.getByRole('alert')).toBeEmptyDOMElement()
    })

    test('a synchronous throw is an error, not an exception', async () => {
      const user = userEvent.setup()
      render(
        <AsyncButton
          onAction={() => {
            throw new Error('nope')
          }}
          {...labels}
        >
          Save
        </AsyncButton>,
      )
      await user.click(screen.getByRole('button', { name: 'Save' }))
      await waitFor(() => expect(screen.getByRole('button')).toHaveAttribute('data-state', 'error'))
    })

    test('onClick still fires, and preventDefault skips the action', async () => {
      const user = userEvent.setup()
      const onAction = vi.fn(() => Promise.resolve())
      const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault())
      render(
        <AsyncButton onAction={onAction} onClick={onClick}>
          Save
        </AsyncButton>,
      )
      await user.click(screen.getByRole('button', { name: 'Save' }))
      expect(onClick).toHaveBeenCalledTimes(1)
      expect(onAction).not.toHaveBeenCalled()
    })

    test('a disabled action button does not run', async () => {
      const user = userEvent.setup()
      const onAction = vi.fn(() => Promise.resolve())
      render(
        <AsyncButton onAction={onAction} disabled>
          Save
        </AsyncButton>,
      )
      await user.click(screen.getByRole('button', { name: 'Save' }))
      expect(onAction).not.toHaveBeenCalled()
    })

    test('a bare spinner never leaves the button nameless while pending', async () => {
      const user = userEvent.setup()
      const work = deferred()
      render(<AsyncButton onAction={() => work.promise}>Save</AsyncButton>)
      const button = screen.getByRole('button', { name: 'Save' })
      await user.click(button)
      expect(button).toHaveAttribute('data-state', 'pending')
      expect(button).toHaveAccessibleName('Working…')
      work.resolve()
      await waitFor(() => expect(button).toHaveAttribute('data-state', 'success'))
    })

    test('icon-only buttons keep their shape: labels are announced, not shown', async () => {
      const user = userEvent.setup()
      const work = deferred()
      render(
        <AsyncButton size="icon" aria-label="Sync" onAction={() => work.promise} successLabel="Synced">
          <svg aria-hidden />
        </AsyncButton>,
      )
      const button = screen.getByRole('button', { name: 'Sync' })
      await user.click(button)
      fakeHold()
      await act(async () => work.resolve())
      expect(button).toHaveAttribute('data-state', 'success')
      expect(button).not.toHaveTextContent('Synced')
      expect(polite()).toHaveTextContent('Synced')
    })

    test('reduced motion: the pending label replaces the spinner', async () => {
      const user = userEvent.setup()
      const work = deferred()
      render(
        <YoujProvider reducedMotion="always">
          <AsyncButton onAction={() => work.promise} {...labels}>
            Save
          </AsyncButton>
        </YoujProvider>,
      )
      const button = screen.getByRole('button', { name: 'Save' })
      await user.click(button)
      expect(button).toHaveAttribute('data-reduced-motion')
      expect(button).toHaveTextContent('Saving…')
      expect(button.querySelector('[data-slot=spinner]')).toBeNull()
      work.resolve()
      await waitFor(() => expect(button).toHaveAttribute('data-state', 'success'))
    })

    test('unmounting mid-action is safe', async () => {
      const user = userEvent.setup()
      const work = deferred()
      const onActionStateChange = vi.fn()
      const { unmount } = render(
        <AsyncButton onAction={() => work.promise} onActionStateChange={onActionStateChange}>
          Save
        </AsyncButton>,
      )
      await user.click(screen.getByRole('button', { name: 'Save' }))
      unmount()
      work.resolve()
      await new Promise((resolve) => setTimeout(resolve, 20))
      expect(onActionStateChange.mock.calls.map(([state]) => state)).toEqual(['pending'])
    })

    test('reads its radius after layout, not while mounting, and hands it to the morph', async () => {
      const callbacks: ResizeObserverCallback[] = []
      const Stub = globalThis.ResizeObserver
      globalThis.ResizeObserver = class {
        constructor(callback: ResizeObserverCallback) {
          callbacks.push(callback)
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      } as unknown as typeof ResizeObserver
      const real = window.getComputedStyle.bind(window)
      const read = vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
        const style = real(el, pseudo)
        if (!(el instanceof HTMLButtonElement)) return style
        return new Proxy(style, {
          get: (target, key) => {
            if (key === 'borderRadius') return '9px'
            const value = Reflect.get(target, key, target)
            return typeof value === 'function' ? value.bind(target) : value
          },
        })
      })
      try {
        const { container } = render(
          <AsyncButton onAction={() => Promise.resolve()} className="rounded-[9px]">
            Save
          </AsyncButton>,
        )
        const button = container.querySelector('button')!
        const reads = () => read.mock.calls.filter(([el]) => el === button).length
        // Mounting doesn't read it: that forced a style pass of everything mounted with the button.
        expect(reads()).toBe(0)
        act(() => callbacks.forEach((callback) => callback([], {} as ResizeObserver)))
        expect(reads()).toBe(1)
        await waitFor(() => expect(button.style.borderRadius).toBe('9px'))
      } finally {
        read.mockRestore()
        globalThis.ResizeObserver = Stub
      }
    })
  })

  describe('label functions', () => {
    const polite = () => screen.getAllByRole('status').find((el) => el.getAttribute('aria-live') === 'polite')!
    const assertive = () => screen.getByRole('alert')

    test('successLabel gets what onAction resolved with, and the button shows and announces it', async () => {
      const successLabel = vi.fn((user: { name: string }) => `Saved ${user.name}`)
      render(
        <AsyncButton onAction={async () => ({ name: 'Ada' })} successLabel={successLabel} resetAfter={5000}>
          Save
        </AsyncButton>,
      )
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))
      await waitFor(() => expect(screen.getByRole('button')).toHaveAttribute('data-state', 'success'))
      expect(screen.getByRole('button')).toHaveAccessibleName('Saved Ada')
      expect(polite()).toHaveTextContent('Saved Ada')
      expect(successLabel).toHaveBeenCalledWith({ name: 'Ada' })
    })

    test('errorLabel gets what onAction rejected with, and a synchronous throw reaches it too', async () => {
      const first = vi.fn().mockRejectedValueOnce(new Error('Email taken')).mockImplementationOnce(() => {
        throw new TypeError('boom')
      })
      render(
        <AsyncButton onAction={first} errorLabel={(error) => (error instanceof Error ? `${error.name}: ${error.message}` : 'Failed')} resetAfter={5000}>
          Invite
        </AsyncButton>,
      )
      const button = screen.getByRole('button', { name: 'Invite' })
      fireEvent.click(button)
      await waitFor(() => expect(button).toHaveAttribute('data-state', 'error'))
      expect(button).toHaveAccessibleName('Error: Email taken')
      expect(assertive()).toHaveTextContent('Error: Email taken')
      // An error can be retried at once.
      fireEvent.click(button)
      await waitFor(() => expect(button).toHaveAccessibleName('TypeError: boom'))
    })

    test('strings keep working, and a function that gives nothing falls back to the default', async () => {
      render(
        <>
          <AsyncButton onAction={async () => 1} successLabel="Great" resetAfter={5000}>
            A
          </AsyncButton>
          <AsyncButton onAction={async () => 1} successLabel={() => ''} resetAfter={5000}>
            B
          </AsyncButton>
        </>,
      )
      fireEvent.click(screen.getByRole('button', { name: 'A' }))
      fireEvent.click(screen.getByRole('button', { name: 'B' }))
      await waitFor(() => expect(screen.getAllByRole('button').map((b) => b.getAttribute('data-state'))).toEqual(['success', 'success']))
      expect(screen.getByRole('button', { name: 'Great' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument()
    })
  })

  describe('status', () => {
    const polite = () => screen.getAllByRole('status').find((el) => el.getAttribute('aria-live') === 'polite')!
    const labels = { pendingLabel: 'Saving…', successLabel: 'Saved', errorLabel: 'Couldn’t save' }
    const state = () => screen.getByRole('button').getAttribute('data-state')

    function fakeHold() {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      return (ms: number) => act(() => vi.advanceTimersByTime(ms))
    }
    afterEach(() => vi.useRealTimers())

    /** A button driven from outside, as `status={mutation.status}` does. */
    function Driven({ status, ...props }: Omit<ComponentProps<typeof AsyncButton>, 'onAction'> & { status: AsyncState }) {
      return (
        <AsyncButton status={status} {...labels} resetAfter={100} {...props}>
          Save
        </AsyncButton>
      )
    }

    test('follows a pending status like onAction does: busy, blocked, the pending label announced', async () => {
      const onActionStateChange = vi.fn()
      const { rerender } = render(<Driven status="idle" onActionStateChange={onActionStateChange} />)
      const button = screen.getByRole('button')
      expect(state()).toBe('idle')
      rerender(<Driven status="pending" onActionStateChange={onActionStateChange} />)
      await waitFor(() => expect(state()).toBe('pending'))
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(button).toHaveAttribute('aria-disabled', 'true')
      expect(button).toHaveTextContent('Saving…')
      expect(polite()).toHaveTextContent('Saving…')
      expect(onActionStateChange).toHaveBeenCalledWith('pending')
    })

    test('success holds, then the button rests although the status stays success', async () => {
      const onActionStateChange = vi.fn()
      const { rerender } = render(<Driven status="pending" onActionStateChange={onActionStateChange} />)
      await waitFor(() => expect(state()).toBe('pending'))
      const endHold = fakeHold()
      rerender(<Driven status="success" onActionStateChange={onActionStateChange} />)
      expect(state()).toBe('success')
      expect(screen.getByRole('button')).toHaveAccessibleName('Saved')
      expect(polite()).toHaveTextContent('Saved')
      endHold(100)
      expect(state()).toBe('idle')
      expect(screen.getByRole('button')).toHaveAccessibleName('Save')
      // Still `success` as far as the mutation goes: nothing plays again.
      rerender(<Driven status="success" onActionStateChange={onActionStateChange} />)
      endHold(1000)
      expect(state()).toBe('idle')
      expect(onActionStateChange.mock.calls.map(([next]) => next)).toEqual(['success', 'idle'])
    })

    test('a status that changes again plays again: a retry that fails after a success', async () => {
      const { rerender } = render(<Driven status="pending" />)
      await waitFor(() => expect(state()).toBe('pending'))
      const endHold = fakeHold()
      rerender(<Driven status="success" />)
      endHold(100)
      expect(state()).toBe('idle')
      rerender(<Driven status="pending" />)
      expect(state()).toBe('pending')
      rerender(<Driven status="error" />)
      expect(state()).toBe('error')
      expect(screen.getByRole('alert')).toHaveTextContent('Couldn’t save')
      endHold(100)
      expect(state()).toBe('idle')
    })

    test('a status that goes back to idle clears the hold at once', async () => {
      const { rerender } = render(<Driven status="pending" />)
      await waitFor(() => expect(state()).toBe('pending'))
      fakeHold()
      rerender(<Driven status="error" />)
      expect(state()).toBe('error')
      rerender(<Driven status="idle" />)
      expect(state()).toBe('idle')
    })

    test('a button that mounts already settled is at rest', async () => {
      render(<Driven status="success" />)
      await act(async () => {})
      expect(state()).toBe('idle')
    })

    test('pressing runs onClick, which starts the work; labels that are functions fall back to the defaults', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      const { rerender } = render(
        <AsyncButton status="idle" onClick={onClick} successLabel={() => 'unused'}>
          Save
        </AsyncButton>,
      )
      await user.click(screen.getByRole('button'))
      expect(onClick).toHaveBeenCalledTimes(1)
      const endHold = fakeHold()
      rerender(
        <AsyncButton status="success" onClick={onClick} successLabel={() => 'unused'}>
          Save
        </AsyncButton>,
      )
      await act(async () => {})
      expect(screen.getByRole('button')).toHaveAccessibleName('Done')
      endHold(5000)
    })

    test('with both status and onAction, status wins, onAction does not run, and development says so', async () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})
      const onAction = vi.fn()
      render(
        <AsyncButton {...({ status: 'idle', onAction } as { status: 'idle' })}>
          Save
        </AsyncButton>,
      )
      expect(screen.getByRole('button')).toHaveAttribute('data-state', 'idle')
      fireEvent.click(screen.getByRole('button'))
      expect(onAction).not.toHaveBeenCalled()
      expect(error).toHaveBeenCalledWith(expect.stringContaining('AsyncButton got both `status` and `onAction`'))
      error.mockRestore()
    })

    test('reduced motion and motion={false} show the same states, without the animation', async () => {
      for (const motion of [true, false]) {
        const { rerender, unmount } = render(
          <YoujProvider reducedMotion="always" motion={motion}>
            <Driven status="pending" />
          </YoujProvider>,
        )
        await waitFor(() => expect(state()).toBe('pending'))
        expect(screen.getByRole('button')).toHaveTextContent('Saving…')
        rerender(
          <YoujProvider reducedMotion="always" motion={motion}>
            <Driven status="error" />
          </YoujProvider>,
        )
        expect(state()).toBe('error')
        expect(screen.getByRole('button')).toHaveAccessibleName('Couldn’t save')
        unmount()
      }
    })
  })


  describe('hold', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'setTimeout', 'clearTimeout'] })
    })
    afterEach(() => vi.useRealTimers())
    const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))

    test('runs the action only once a held press completes, then shows its lifecycle', async () => {
      let finish!: () => void
      const onAction = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)))
      render(
        <AsyncButton hold={500} onAction={onAction} pendingLabel="Deleting…" successLabel="Deleted">
          Delete project
        </AsyncButton>,
      )
      const button = screen.getByRole('button', { name: 'Delete project' })
      expect(button).toHaveAccessibleDescription('Hold to confirm')
      fireEvent.click(button)
      fireEvent.pointerDown(button, { button: 0 })
      advance(250)
      fireEvent.pointerUp(button, { button: 0 })
      expect(onAction).not.toHaveBeenCalled()
      expect(button).toHaveAttribute('data-yj-hold', 'release')
      expect(button.style.getPropertyValue('--ui--hold')).toBe('0')

      fireEvent.pointerDown(button, { button: 0 })
      advance(250)
      expect(Number(button.style.getPropertyValue('--ui--hold'))).toBeGreaterThan(0.4)
      advance(270)
      expect(onAction).toHaveBeenCalledTimes(1)
      expect(button).toHaveAttribute('data-state', 'pending')
      await act(async () => finish())
      expect(button).toHaveAttribute('data-state', 'success')
      expect(button).toHaveAccessibleName('Deleted')
    })

    test('Space or Enter held down confirms from the keyboard; the key’s own click is swallowed', () => {
      const onAction = vi.fn()
      render(
        <AsyncButton hold={400} onAction={onAction}>
          Send payment
        </AsyncButton>,
      )
      const button = screen.getByRole('button', { name: 'Send payment' })
      fireEvent.keyDown(button, { key: 'Enter' })
      fireEvent.click(button)
      advance(200)
      fireEvent.keyUp(button, { key: 'Enter' })
      expect(onAction).not.toHaveBeenCalled()

      fireEvent.keyDown(button, { key: ' ' })
      advance(450)
      fireEvent.keyUp(button, { key: ' ' })
      expect(onAction).toHaveBeenCalledTimes(1)
    })

    test('`true` holds for twice the deliberate token, at the provider’s speed', () => {
      const onAction = vi.fn()
      render(
        <YoujProvider timeScale={2}>
          <AsyncButton hold onAction={onAction}>
            Delete
          </AsyncButton>
        </YoujProvider>,
      )
      const button = screen.getByRole('button', { name: 'Delete' })
      fireEvent.pointerDown(button, { button: 0 })
      advance(2200)
      expect(onAction).not.toHaveBeenCalled()
      advance(100)
      expect(onAction).toHaveBeenCalledTimes(1)
    })

    test('keeps the caller’s description first, and a disabled button never starts a hold', () => {
      const onAction = vi.fn()
      render(
        <>
          <AsyncButton hold={200} aria-describedby="own" disabled onAction={onAction}>
            Close account
          </AsyncButton>
          <span id="own">Your data is deleted after 30 days.</span>
        </>,
      )
      const button = screen.getByRole('button', { name: 'Close account' })
      expect(button).toHaveAccessibleDescription('Your data is deleted after 30 days. Hold to confirm')
      fireEvent.pointerDown(button, { button: 0 })
      advance(300)
      expect(onAction).not.toHaveBeenCalled()
    })

    test('under reduced motion the fill stays still and a count stands in the label’s place', () => {
      render(
        <YoujProvider reducedMotion="always">
          <AsyncButton hold={1000} onAction={() => {}}>
            Delete
          </AsyncButton>
        </YoujProvider>,
      )
      const button = screen.getByRole('button', { name: 'Delete' })
      fireEvent.pointerDown(button, { button: 0 })
      advance(500)
      expect(button).toHaveTextContent('50%')
      fireEvent.pointerUp(button, { button: 0 })
      expect(button).not.toHaveTextContent('%')
    })

    test('without `hold` there is no fill and no description', () => {
      render(<AsyncButton onAction={() => {}}>Save</AsyncButton>)
      const button = screen.getByRole('button', { name: 'Save' })
      expect(button).not.toHaveAttribute('data-yj-hold')
      expect(button).not.toHaveAttribute('aria-describedby')
    })
  })
})
