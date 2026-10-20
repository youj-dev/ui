import { forwardRef, type ComponentProps } from 'react'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { StatusScreen } from './status-screen'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const miniature = (container: HTMLElement, id: string) => waitFor(() => expect(container.querySelector(`.yjm-${id}`)).not.toBeNull())

describe('StatusScreen', () => {
  test('401 asks to sign in and says where they return to', async () => {
    const user = userEvent.setup()
    const onSignIn = vi.fn((event: React.MouseEvent) => event.preventDefault())
    reduced(<StatusScreen status="401" signInHref="/login" returnTo="/billing" onSignIn={onSignIn} />)
    const main = screen.getByRole('main')
    expect(within(main).getByRole('heading', { level: 1 })).toHaveTextContent('Sign in to continue')
    expect(within(main).getByText('Error 401')).toBeInTheDocument()
    expect(within(main).getByText('You’ll return to /billing after signing in.')).toBeInTheDocument()
    const signIn = within(main).getByRole('link', { name: /Sign in/ })
    expect(signIn).toHaveAttribute('href', '/login')
    await user.click(signIn)
    expect(onSignIn).toHaveBeenCalledTimes(1)
    expect(within(main).getByRole('link', { name: /Back to home/ })).toHaveAttribute('href', '#home')
  })

  test('each status shows its miniature, decorative, and media={null} shows the code large instead', async () => {
    const cases = [
      ['401', 'parcel-locker'],
      ['403', 'firewall-appliance'],
      ['503', 'server-cabinet'],
      ['loading', 'hourglass'],
    ] as const
    for (const [status, id] of cases) {
      const { container, unmount } = reduced(<StatusScreen status={status} retryDelays={[]} />)
      await miniature(container, id)
      const host = container.querySelector(`.yjm-${id}`)!
      expect(host.closest('[aria-hidden]')).not.toBeNull()
      expect(host).toHaveAttribute('data-interactive', 'false')
      unmount()
    }
    const { container } = reduced(<StatusScreen status="403" media={null} />)
    expect(screen.getByText('403')).toBeInTheDocument()
    expect(screen.queryByText('Error 403')).toBeNull()
    await act(async () => {})
    expect(container.querySelector('.yjm')).toBeNull()
  })

  test('your own media replaces the miniature', () => {
    reduced(<StatusScreen status="401" media={<svg data-testid="art" />} />)
    expect(screen.getByTestId('art').closest('[aria-hidden]')).not.toBeNull()
  })

  test('403 names the permission and the account, requests access and says what happens next', async () => {
    const user = userEvent.setup()
    const onRequestAccess = vi.fn().mockResolvedValue(undefined)
    reduced(
      <StatusScreen
        status="403"
        media={null}
        permission="invoices:export"
        account="sam@ledgerly.dev"
        signInHref="/login"
        onRequestAccess={onRequestAccess}
      />,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('You don’t have access to this')
    expect(screen.getByText('invoices:export')).toBeInTheDocument()
    expect(screen.getByText(/Signed in as sam@ledgerly.dev/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Switch account' })).toHaveAttribute('href', '/login')
    await user.click(screen.getByRole('button', { name: /Request access/ }))
    expect(onRequestAccess).toHaveBeenCalledTimes(1)
    expect(await screen.findAllByText('Request sent')).not.toHaveLength(0)
    expect(await screen.findByText(/We’ve asked your workspace admins/)).toHaveAttribute('role', 'status')
  })

  test('403 with an empty permission and account shows neither line', () => {
    reduced(<StatusScreen status="403" media={null} permission="" account="" />)
    expect(screen.queryByText('Needs permission')).not.toBeInTheDocument()
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument()
  })

  test('503 retries on its own, waiting longer after each failure', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const onRetry = vi.fn(() => Promise.reject(new Error('down')))
      reduced(<StatusScreen status="503" media={null} retryDelays={[2, 5]} onRetry={onRetry} statusHref="https://status.example.com" />)
      expect(screen.getByRole('link', { name: /Status page/ })).toHaveAttribute('href', 'https://status.example.com')
      expect(await screen.findByText(/Trying again in 2s/)).toBeInTheDocument()
      await act(() => vi.advanceTimersByTimeAsync(2100))
      expect(onRetry).toHaveBeenCalledTimes(1)
      expect(await screen.findByText(/Trying again in 5s/)).toBeInTheDocument()
      await act(() => vi.advanceTimersByTimeAsync(5100))
      expect(onRetry).toHaveBeenCalledTimes(2)
      // The last delay repeats.
      expect(await screen.findByText(/Trying again in 5s/)).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  test('503 Try now retries at once and stops the schedule once it works', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce(undefined)
    reduced(<StatusScreen status="503" media={null} retryDelays={[60]} onRetry={onRetry} />)
    await user.click(screen.getByRole('button', { name: /Try now/ }))
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(await screen.findAllByText('Still down')).not.toHaveLength(0)
    await waitFor(() => expect(screen.getByRole('button', { name: /Try now/ })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: /Try now/ }))
    expect(onRetry).toHaveBeenCalledTimes(2)
    expect(await screen.findAllByText('Back online')).not.toHaveLength(0)
    expect(screen.queryByText(/Trying again in/)).toBeNull()
  })

  test('503 with no delays only retries when asked', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const onRetry = vi.fn()
      reduced(<StatusScreen status="503" media={null} retryDelays={[]} onRetry={onRetry} />)
      await act(() => vi.advanceTimersByTimeAsync(120_000))
      expect(onRetry).not.toHaveBeenCalled()
      expect(screen.queryByText(/Trying again in/)).toBeNull()
      expect(screen.getByText('Usually back within a few minutes.')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  test('loading is a busy page with a status region and a progress bar', () => {
    reduced(<StatusScreen status="loading" media={null} progress={40} />)
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getAllByRole('status')[0]).toHaveTextContent('Getting things ready')
    expect(screen.getByRole('progressbar', { name: 'Loading progress' })).toHaveAttribute('aria-valuenow', '40')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  test('loading without progress is indeterminate', () => {
    reduced(<StatusScreen status="loading" media={null} />)
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow')
  })

  test('loading says when it is slow and offers a reload', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const onReload = vi.fn()
      reduced(<StatusScreen status="loading" media={null} slowAfter={3000} onReload={onReload} />)
      expect(screen.queryByText('This is taking longer than usual.')).toBeNull()
      await act(() => vi.advanceTimersByTimeAsync(3100))
      expect(screen.getByText('This is taking longer than usual.')).toBeInTheDocument()
      screen.getByRole('button', { name: /Reload/ }).click()
      expect(onReload).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  test('copy, actions, headingLevel and linkComponent', () => {
    const Link = forwardRef<HTMLAnchorElement, ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    const { unmount } = reduced(
      <StatusScreen status="401" media={null} linkComponent={Link} headingLevel={2} copy={{ unauthorizedTitle: 'Members only' }} id="gate" />,
    )
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Members only')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'gate')
    for (const link of screen.getAllByRole('link')) expect(link).toHaveAttribute('data-router')
    unmount()
    reduced(<StatusScreen status="503" media={null} actions={<button type="button">Contact us</button>} />)
    expect(screen.getByRole('button', { name: 'Contact us' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Try now/ })).not.toBeInTheDocument()
  })

  test('there is one h1 and nothing pictured is announced', () => {
    const { container } = reduced(<StatusScreen status="403" />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(container.querySelector('svg[role="img"]')).toBeNull()
  })
})
