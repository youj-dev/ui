import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { DeviceAuthorization } from './device-authorization'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('device authorization block', () => {
  test.each(['card', 'split'] as const)('%s: one main landmark and one h1 naming the app', (layout) => {
    reduced(<DeviceAuthorization code="TFXS-STXG" layout={layout} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Authorize Fernbit CLI')
  })

  test('shows who asks, what it can do, who is signed in, the code and the safety note', () => {
    reduced(<DeviceAuthorization code="tfxs-stxg" />)
    expect(screen.getByText('Fernbit CLI 2.4.0')).toBeInTheDocument()
    expect(screen.getByText('Read your projects and deployments')).toBeInTheDocument()
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Not you? Switch account' })).toHaveAttribute('href', '#login')
    expect(screen.getByRole('img', { name: 'T F X S S T X G' })).toHaveTextContent('TFXSSTXG')
    expect(screen.getByText(/Only approve if you ran the login command yourself/)).toBeInTheDocument()
  })

  test('Authorize runs onAuthorize with the code, then ends on "close this tab"', async () => {
    const user = userEvent.setup()
    const onAuthorize = vi.fn().mockResolvedValue(undefined)
    reduced(<DeviceAuthorization code="TFXS-STXG" onAuthorize={onAuthorize} />)
    await user.click(screen.getByRole('button', { name: 'Authorize' }))
    expect(onAuthorize).toHaveBeenCalledWith('TFXSSTXG')
    expect(await screen.findByRole('heading', { level: 1, name: 'You’re connected' }, { timeout: 4000 })).toBeInTheDocument()
    expect(screen.getByText(/close this tab and return to your terminal/)).toBeInTheDocument()
  })

  test('a failing Authorize stays on the page', async () => {
    const user = userEvent.setup()
    reduced(<DeviceAuthorization code="TFXS-STXG" onAuthorize={() => Promise.reject(new Error('no'))} />)
    await user.click(screen.getByRole('button', { name: 'Authorize' }))
    await screen.findByText('Couldn’t authorize')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Authorize Fernbit CLI')
  })

  test('Deny runs onDeny and ends on the denied state', async () => {
    const user = userEvent.setup()
    const onDeny = vi.fn().mockResolvedValue(undefined)
    reduced(<DeviceAuthorization code="TFXS-STXG" onDeny={onDeny} />)
    await user.click(screen.getByRole('button', { name: 'Deny' }))
    expect(onDeny).toHaveBeenCalledWith('TFXSSTXG')
    expect(await screen.findByRole('heading', { level: 1, name: 'Request denied' }, { timeout: 4000 })).toBeInTheDocument()
  })

  test('without a code it asks for one: typed in lower case it becomes upper case, and a known one moves on to the review', async () => {
    const user = userEvent.setup()
    const onCheckCode = vi.fn().mockResolvedValue(true)
    reduced(<DeviceAuthorization onCheckCode={onCheckCode} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Connect a device' })).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: /Device code/ }), 'kd4m-72qw')
    await waitFor(() => expect(onCheckCode).toHaveBeenCalledWith('KD4M72QW'))
    expect(await screen.findByRole('heading', { level: 1, name: 'Authorize Fernbit CLI' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'K D 4 M 7 2 Q W' })).toBeInTheDocument()
  })

  test('a code that is refused says so and stays on the field', async () => {
    const user = userEvent.setup()
    reduced(<DeviceAuthorization onCheckCode={() => false} />)
    await user.type(screen.getByRole('textbox', { name: /Device code/ }), 'ZZZZZZZZ')
    expect(await screen.findByText('We don’t recognize that code. Check your terminal and try again.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Connect a device')
  })

  test('the expired ending offers a different code, and your app, account and words drive the page', async () => {
    const user = userEvent.setup()
    const { unmount } = reduced(<DeviceAuthorization defaultStep="expired" />)
    await user.click(screen.getByRole('button', { name: 'Enter a different code' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Connect a device' })).toBeInTheDocument()
    unmount()
    reduced(
      <DeviceAuthorization
        code="KD4M-72QW"
        app={{ name: 'Meadow Sync' }}
        access={['Read appointments']}
        account={{ name: 'Priya Raman', email: 'priya@fernleaf.health' }}
        copy={{ deviceTitle: (app: string) => `Connect ${app}` }}
      />,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Connect Meadow Sync' })).toBeInTheDocument()
    expect(screen.getByText('Read appointments')).toBeInTheDocument()
    expect(screen.getByText('priya@fernleaf.health')).toBeInTheDocument()
  })
})
