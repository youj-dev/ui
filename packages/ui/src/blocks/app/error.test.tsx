import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ErrorScreen } from './error'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('error page block', () => {
  test('each page shows its miniature, decorative, beside the text', async () => {
    for (const [variant, id] of [
      ['500', 'mainframe'],
      ['maintenance', 'repair-bench'],
      ['launch', 'drone-dock'],
    ] as const) {
      const { container, unmount } = reduced(<ErrorScreen variant={variant} />)
      await waitFor(() => expect(container.querySelector(`.yjm-${id}`)).not.toBeNull())
      const host = container.querySelector(`.yjm-${id}`)!
      expect(host.closest('[aria-hidden]')).not.toBeNull()
      expect(host).toHaveAttribute('data-interactive', 'false')
      unmount()
    }
  })

  test('media={null} is the plain page: the code set large and no miniature', async () => {
    const { container } = reduced(<ErrorScreen media={null} />)
    await act(async () => {})
    expect(container.querySelector('.yjm')).toBeNull()
    expect(screen.queryByText('Error 500')).toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: 'Something broke on our side' })).toBeInTheDocument()
  })

  test('the 500 points to support beside the incident ID', () => {
    reduced(<ErrorScreen media={null} supportHref="mailto:help@example.com" />)
    expect(screen.getByRole('link', { name: 'Contact support' })).toHaveAttribute('href', 'mailto:help@example.com')
  })

  test('maintenance takes an email for when it’s back', async () => {
    const user = userEvent.setup()
    const onSubscribe = vi.fn().mockResolvedValue(undefined)
    reduced(<ErrorScreen variant="maintenance" media={null} onSubscribe={onSubscribe} />)
    const field = screen.getByLabelText('Email me when it’s back')
    await user.type(field, 'not an email')
    await user.click(screen.getByRole('button', { name: 'Notify me' }))
    expect(await screen.findByText('Enter an email like you@company.com.')).toBeInTheDocument()
    expect(onSubscribe).not.toHaveBeenCalled()
    await user.clear(field)
    await user.type(field, 'ana@northwind.io')
    await user.click(screen.getByRole('button', { name: /Notify me|Try again/ }))
    expect(onSubscribe).toHaveBeenCalledWith('ana@northwind.io')
    expect(await screen.findAllByText('We’ll email you')).not.toHaveLength(0)
  })

  test('the 500 page names itself, the services and the incident', () => {
    reduced(<ErrorScreen incidentId="inc_test" />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Something broke on our side' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Current status' })).toBeInTheDocument()
    expect(screen.getByText('inc_test')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Status page/ })).toHaveAttribute('href', '#status')
  })

  test('retry runs onRetry and reports the outcome', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn(() => Promise.reject(new Error('down')))
    reduced(<ErrorScreen media={null} onRetry={onRetry} />)
    await user.click(screen.getByRole('button', { name: /Try again/ }))
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(await screen.findAllByText('Still down')).not.toHaveLength(0)
  })

  test('copying the incident ID writes it to the clipboard', async () => {
    const user = userEvent.setup()
    reduced(<ErrorScreen media={null} incidentId="inc_copy" />)
    await user.click(screen.getByRole('button', { name: 'Copy incident ID inc_copy' }))
    expect(await navigator.clipboard.readText()).toBe('inc_copy')
    expect(await screen.findAllByText('Copied')).not.toHaveLength(0)
  })

  test('maintenance shows the window’s time left and progress', async () => {
    const start = Date.now() - 30 * 60_000
    const end = Date.now() + 30 * 60_000
    reduced(<ErrorScreen variant="maintenance" window={{ start, end }} />)
    await act(async () => {})
    expect(screen.getByRole('heading', { level: 1, name: 'We’re upgrading our databases' })).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveAccessibleName(/Back in about (30|31) minutes/)
    expect(screen.getByRole('progressbar', { name: 'Maintenance progress' })).toHaveAttribute('aria-valuenow', '50')
    expect(screen.getByText('(in progress)')).toBeInTheDocument()
  })

  test('launch counts down to the launch and redeems a code', async () => {
    const user = userEvent.setup()
    const onRedeem = vi.fn((code: string) => (code === 'good' ? Promise.resolve() : Promise.reject(new Error('Nope, not that one.'))))
    reduced(<ErrorScreen variant="launch" launchAt={Date.now() + 2 * 86_400_000 + 3 * 3_600_000 + 30_000} title="Almost here" onRedeem={onRedeem} />)
    await act(async () => {})
    expect(screen.getByRole('heading', { level: 1, name: 'Almost here' })).toBeInTheDocument()
    expect(screen.getByText('Launching soon')).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent('2 days, 3 hours left')
    const field = screen.getByLabelText('Have an early access code? Get in early')
    await user.type(field, 'bad')
    await user.click(screen.getByRole('button', { name: /Get in/ }))
    expect(onRedeem).toHaveBeenCalledWith('bad')
    expect(await screen.findByText('Nope, not that one.')).toBeInTheDocument()
    await user.clear(field)
    await user.type(field, ' good {Enter}')
    expect(onRedeem).toHaveBeenLastCalledWith('good')
    expect(await screen.findByText('You’re in. Taking you there…')).toHaveAttribute('role', 'status')
  })

  test('launch turns live at zero and takes your own code form', async () => {
    reduced(<ErrorScreen variant="launch" launchAt={Date.now() - 1000} brand={<span>Acme</span>} codeForm={<form aria-label="Own form" />} />)
    await act(async () => {})
    expect(screen.getByText('We’re live')).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveAttribute('data-state', 'complete')
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'Own form' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Have an early access code? Get in early')).toBeNull()
  })

  test('your services, copy, link component and heading level drive the 500 page', () => {
    const Link = ({ href, ...props }: React.ComponentProps<'a'>) => <a data-router-link="" href={href} {...props} />
    reduced(
      <ErrorScreen
        services={[
          { name: 'Checkout', state: 'outage' },
          { name: 'Search', state: 'operational' },
        ]}
        statusHref="/status"
        linkComponent={Link}
        headingLevel={2}
        className="custom-root"
        data-testid="error-root"
        copy={{
          serverTitle: 'Payments are down',
          currentStatus: 'Right now',
          statusPage: 'See status',
          serviceStates: { operational: 'Up', degraded: 'Slow', outage: 'Down' },
        }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Payments are down' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Right now' })).toBeInTheDocument()
    expect(screen.getByText('Checkout').closest('li')).toHaveTextContent('Down')
    expect(screen.getByText('Search').closest('li')).toHaveTextContent('Up')
    expect(screen.queryByText('Dashboard')).toBeNull()
    const link = screen.getByRole('link', { name: /See status/ })
    expect(link).toHaveAttribute('href', '/status')
    expect(link).toHaveAttribute('data-router-link')
    expect(screen.getByTestId('error-root')).toHaveClass('custom-root')
  })

  test('a failed retry shows the rejection’s message', async () => {
    const user = userEvent.setup()
    reduced(<ErrorScreen media={null} onRetry={() => Promise.reject(new Error('Database still unreachable'))} />)
    await user.click(screen.getByRole('button', { name: /Try again/ }))
    expect(await screen.findByText('Database still unreachable')).toHaveAttribute('role', 'alert')
  })

  test('maintenance takes your steps and copy, set from `now`', async () => {
    const now = Date.now()
    reduced(
      <ErrorScreen
        variant="maintenance"
        now={now}
        steps={[{ label: 'Rotate certificates', state: 'active' }]}
        copy={{ maintenanceTitle: 'Rotating keys', stepStates: { done: '(ok)', active: '(running)', pending: '(queued)' } }}
      />,
    )
    await act(async () => {})
    expect(screen.getByRole('heading', { level: 1, name: 'Rotating keys' })).toBeInTheDocument()
    expect(screen.getByText('Rotate certificates')).toBeInTheDocument()
    expect(screen.getByText('(running)')).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveAccessibleName(/Back in about (52|53) minutes/)
  })

  test('launch takes a { name, logo } brand and its strings from copy', async () => {
    reduced(
      <ErrorScreen
        variant="launch"
        launchAt={Date.now() + 86_400_000}
        brand={{ name: 'Acme Cloud', logo: <svg aria-hidden /> }}
        copy={{ launchTitle: 'Acme Cloud is coming', launching: 'Soon', codeLabel: 'Invite code' }}
      />,
    )
    await act(async () => {})
    expect(screen.getByText('Acme Cloud')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Acme Cloud is coming' })).toBeInTheDocument()
    expect(screen.getByText('Soon')).toBeInTheDocument()
    expect(screen.getByLabelText('Invite code')).toBeInTheDocument()
  })

  test('takes a theme', () => {
    const { container } = reduced(<ErrorScreen theme={{ accent: 'oklch(0.7 0.15 30)' }} />)
    expect(container.querySelector('main')?.parentElement?.getAttribute('style')).toMatch(/--/)
  })
})
