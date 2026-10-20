import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core'
import { toast, Toaster } from './toast'

// The manager is global: leave nothing behind for the next test.
afterEach(async () => {
  act(() => toast.dismiss())
  await waitFor(() => expect(document.querySelectorAll('[data-slot=toast]')).toHaveLength(0))
})

const region = () => screen.getByRole('region', { name: 'Notifications' })
const toasts = () => [...document.querySelectorAll<HTMLElement>('[data-slot=toast]')]

describe('toast()', () => {
  test('shows a toast in a polite live region, named and described by its text', async () => {
    render(<Toaster />)
    expect(region()).toHaveAttribute('aria-live', 'polite')
    act(() => {
      toast('Archived 3 issues', { description: 'ORI-812 and two more.' })
    })
    const item = await within(region()).findByRole('dialog', { name: 'Archived 3 issues' })
    expect(item).toHaveAccessibleDescription('ORI-812 and two more.')
    expect(item).toHaveClass('yj-toast')
  })

  test('status helpers mark the type and add a status icon', async () => {
    render(<Toaster />)
    act(() => {
      toast.success('Invite link copied')
      toast.error('Couldn’t reach the build server')
    })
    await waitFor(() => expect(toasts()).toHaveLength(2))
    const [error, success] = toasts()
    expect(success).toHaveAttribute('data-type', 'success')
    expect(error).toHaveAttribute('data-type', 'error')
    expect(success!.querySelector('[data-slot=toast-title] svg')).not.toBeNull()
  })

  test('an action runs its callback and dismisses its own toast only', async () => {
    const user = userEvent.setup()
    const undo = vi.fn()
    render(<Toaster />)
    act(() => {
      toast('Deployed')
      toast('Archived 3 issues', { action: { label: 'Undo', onClick: undo } })
    })
    await user.click(await screen.findByRole('button', { name: 'Undo' }))
    expect(undo).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Archived 3 issues' })).not.toBeInTheDocument())
    expect(screen.getByRole('dialog', { name: 'Deployed' })).toBeInTheDocument()
  })

  test('the × button appears to assistive tech once the stack is expanded, and dismisses the toast', async () => {
    const user = userEvent.setup()
    render(<Toaster />)
    act(() => {
      toast('Maintenance tonight')
    })
    await waitFor(() => expect(toasts()).toHaveLength(1))
    // Collapsed, the close button is hidden like the rest of the stack's chrome.
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull()
    await user.hover(toasts()[0]!)
    await waitFor(() => expect(toasts()[0]).toHaveAttribute('data-expanded'))
    await user.click(screen.getByRole('button', { name: 'Dismiss' }))
    await waitFor(() => expect(toasts()).toHaveLength(0))
  })

  test('toasts leave on their own after the timeout', async () => {
    render(<Toaster timeout={60} />)
    act(() => {
      toast('Saved')
    })
    await waitFor(() => expect(toasts()).toHaveLength(1))
    await waitFor(() => expect(toasts()).toHaveLength(0))
  })

  test('past the limit, the oldest toasts wait hidden', async () => {
    render(<Toaster limit={2} />)
    act(() => {
      toast('One')
      toast('Two')
      toast('Three')
    })
    await waitFor(() => expect(toasts()).toHaveLength(3))
    expect(toasts().filter((t) => t.hasAttribute('data-limited'))).toHaveLength(1)
  })

  test('toast.promise follows the work from loading to success, and its action closes only it', async () => {
    const user = userEvent.setup()
    let resolve!: (value: string) => void
    render(<Toaster />)
    act(() => {
      toast('Unrelated')
      void toast.promise(new Promise<string>((r) => (resolve = r)), {
        loading: 'Deploying orion…',
        success: (url) => ({ title: 'Deployed', description: url, action: { label: 'Visit', onClick: () => {} } }),
        error: 'Deployment failed',
      })
    })
    await screen.findByRole('dialog', { name: /Deploying orion/ })
    expect(toasts()[0]).toHaveAttribute('data-type', 'loading')
    await act(async () => resolve('orion.acme.dev'))
    await waitFor(() => expect(toasts()[0]).toHaveAttribute('data-type', 'success'))
    expect(toasts()[0]).toHaveTextContent('Deployed')
    expect(toasts()[0]).toHaveTextContent('orion.acme.dev')

    await user.click(screen.getByRole('button', { name: 'Visit' }))
    await waitFor(() => expect(toasts()).toHaveLength(1))
    expect(screen.getByRole('dialog', { name: 'Unrelated' })).toBeInTheDocument()
  })

  test('a rejected promise turns the toast into an error', async () => {
    render(<Toaster />)
    let result: Promise<unknown> | undefined
    act(() => {
      result = toast
        .promise(Promise.reject(new Error('2 type errors')), {
          loading: 'Deploying…',
          success: 'Deployed',
          error: (error) => ({ title: 'Deployment failed', description: (error as Error).message }),
        })
        .catch(() => 'handled')
    })
    await act(async () => {
      await result
    })
    await waitFor(() => expect(toasts()[0]).toHaveAttribute('data-type', 'error'))
    expect(toasts()[0]).toHaveTextContent('2 type errors')
  })

  test('media renders at the start in place of the status icon, hidden from assistive tech, with the status as a pip', async () => {
    render(<Toaster />)
    act(() => {
      toast.success('Deployed', { description: 'orion.acme.dev is live', media: <svg data-testid="scene" /> })
      toast('Archived 3 issues')
    })
    const item = await screen.findByRole('dialog', { name: 'Deployed' })
    expect(item).toHaveAccessibleDescription('orion.acme.dev is live')
    const media = item.querySelector('[data-slot=toast-media]')!
    expect(media).toHaveAttribute('aria-hidden', 'true')
    expect(within(media as HTMLElement).getByTestId('scene')).toBeInTheDocument()
    expect(item.querySelector('[data-slot=toast-title] svg')).toBeNull()
    expect(media.querySelector('[data-slot=toast-media-status] svg')).not.toBeNull()
    expect(item).toHaveAttribute('data-yj-media')

    const plain = screen.getByRole('dialog', { name: 'Archived 3 issues' })
    expect(plain.querySelector('[data-slot=toast-media]')).toBeNull()
    expect(plain).not.toHaveAttribute('data-yj-media')
  })

  test('each promise step shows its own media, and a step without media shows none', async () => {
    let resolve!: (value: string) => void
    render(
      <YoujProvider reducedMotion="always">
        <Toaster />
      </YoujProvider>,
    )
    act(() => {
      void toast.promise(new Promise<string>((r) => (resolve = r)), {
        loading: { title: 'Deploying orion…', media: <span data-testid="loader" /> },
        success: { title: 'Deployed', media: <span data-testid="scene" /> },
        error: 'Deployment failed',
      })
    })
    await screen.findByTestId('loader')
    // No status pip while loading: the loader is the wait.
    expect(document.querySelector('[data-slot=toast-media-status]')).toBeNull()
    await act(async () => resolve('orion.acme.dev'))
    await screen.findByTestId('scene')
    await waitFor(() => expect(screen.queryByTestId('loader')).toBeNull())
    expect(toasts()[0]).toHaveAttribute('data-type', 'success')
    expect(document.querySelector('[data-slot=toast-media-status] svg')).not.toBeNull()

    act(() => {
      void toast.promise(Promise.reject(new Error('no')), {
        loading: { title: 'Retrying…', media: <span data-testid="loader-2" /> },
        success: 'Deployed',
        error: 'Deployment failed',
      }).catch(() => {})
    })
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Deployment failed' })).toBeInTheDocument())
    expect(screen.getByRole('dialog', { name: 'Deployment failed' }).querySelector('[data-slot=toast-media]')).toBeNull()
  })

  test('toast.update swaps the media in place', async () => {
    render(
      <YoujProvider reducedMotion="always">
        <Toaster />
      </YoujProvider>,
    )
    let id = ''
    act(() => {
      id = toast('Indexing orion…', { media: <span data-testid="before" />, timeout: 0 })
    })
    await screen.findByTestId('before')
    act(() => toast.update(id, { media: <span data-testid="after" /> }))
    await screen.findByTestId('after')
    await waitFor(() => expect(screen.queryByTestId('before')).toBeNull())
    expect(toasts()[0]).toHaveTextContent('Indexing orion…')
  })

  test('the viewport carries the youj scope', async () => {
    render(
      <YoujProvider reducedMotion="always">
        <Toaster />
      </YoujProvider>,
    )
    const portal = region().closest('[data-yj-reduced]') as HTMLElement
    expect(portal.style.getPropertyValue('--yj-motion')).toBe('0')
  })

  test('a second Toaster shows nothing while the first is mounted, and takes over when it unmounts', async () => {
    const first = render(<Toaster />)
    render(<Toaster position="top-center" />)
    expect(screen.getAllByRole('region', { name: 'Notifications' })).toHaveLength(1)
    act(() => {
      toast('Saved')
    })
    expect(await screen.findAllByRole('dialog', { name: 'Saved' })).toHaveLength(1)

    first.unmount()
    expect(await screen.findAllByRole('region', { name: 'Notifications' })).toHaveLength(1)
    act(() => {
      toast('Saved again')
    })
    expect(await screen.findAllByRole('dialog', { name: 'Saved again' })).toHaveLength(1)
  })
})
