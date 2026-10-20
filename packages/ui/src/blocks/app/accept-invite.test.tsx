import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { AcceptInvite } from './accept-invite'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('Accept invite block', () => {
  test('a valid invite names the workspace, the inviter, the role and the address', () => {
    reduced(<AcceptInvite />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Join Northwind Labs' })).toBeInTheDocument()
    expect(screen.getByText('Ana Ruiz invited you to collaborate in Northwind Labs.')).toBeInTheDocument()
    expect(screen.getByText('Editor')).toBeInTheDocument()
    expect(screen.getByText('sam.lee@northwind.dev')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'I have an account' })).toHaveAttribute('aria-selected', 'true')
  })

  test('signing in: the password is required, then joining lands on “You’re in”', async () => {
    const user = userEvent.setup()
    const onAccept = vi.fn()
    reduced(<AcceptInvite onAccept={onAccept} />)
    await user.click(screen.getByRole('button', { name: 'Sign in and join' }))
    expect(await screen.findByText('Enter your password.')).toBeInTheDocument()
    expect(onAccept).not.toHaveBeenCalled()

    // Enter submits from the field.
    await user.type(screen.getByLabelText('Password'), 'hunter22{Enter}')
    expect(await screen.findByRole('heading', { level: 1, name: 'You’re in Northwind Labs' })).toBeInTheDocument()
    expect(onAccept).toHaveBeenCalledWith({ mode: 'sign-in', email: 'sam.lee@northwind.dev', password: 'hunter22' })
  })

  test('creating an account: arrow keys reach the tab, and name and an 8-character password are required', async () => {
    const user = userEvent.setup()
    const onAccept = vi.fn()
    reduced(<AcceptInvite onAccept={onAccept} />)
    screen.getByRole('tab', { name: 'I have an account' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'I’m new here' })).toHaveAttribute('aria-selected', 'true')

    await user.type(screen.getByLabelText('Choose a password'), 'short')
    await user.click(screen.getByRole('button', { name: 'Create account and join' }))
    expect(await screen.findByText('Enter your name.')).toBeInTheDocument()
    expect(screen.getByText('Use at least 8 characters.')).toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: 'Full name' }), 'Sam Lee')
    await user.type(screen.getByLabelText('Choose a password'), 'enough')
    await user.click(screen.getByRole('button', { name: 'Create account and join' }))
    expect(await screen.findByRole('heading', { name: 'You’re in Northwind Labs' })).toBeInTheDocument()
    expect(onAccept).toHaveBeenCalledWith({ mode: 'create', email: 'sam.lee@northwind.dev', password: 'shortenough', name: 'Sam Lee' })
  })

  test('a rejected join stays on the form', async () => {
    const user = userEvent.setup()
    const onAccept = vi.fn(() => Promise.reject(new Error('Wrong password')))
    reduced(<AcceptInvite onAccept={onAccept} />)
    await user.type(screen.getByLabelText('Password'), 'nope')
    await user.click(screen.getByRole('button', { name: 'Sign in and join' }))
    await waitFor(() => expect(onAccept).toHaveBeenCalledOnce())
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.getByRole('heading', { name: 'Join Northwind Labs' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'You’re in Northwind Labs' })).not.toBeInTheDocument()
  })

  test('an expired invite offers to request a new one', async () => {
    const user = userEvent.setup()
    const onRequestNew = vi.fn()
    reduced(<AcceptInvite status="expired" onRequestNew={onRequestNew} />)
    expect(screen.getByRole('heading', { level: 1, name: 'This invite has expired' })).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Request a new invite' }))
    expect(onRequestNew).toHaveBeenCalledOnce()
  })

  test('an existing member is pointed straight in', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    reduced(<AcceptInvite status="member" onOpen={onOpen} />)
    const main = screen.getByRole('main')
    expect(within(main).getByRole('heading', { level: 1, name: 'You’re already in Northwind Labs' })).toBeInTheDocument()
    await user.click(within(main).getByRole('button', { name: 'Open Northwind Labs' }))
    expect(onOpen).toHaveBeenCalledOnce()
  })

  test('every string comes through copy', () => {
    reduced(<AcceptInvite copy={{ joinTitle: (w) => `Rejoindre ${w}`, signInAndJoin: 'Se connecter' }} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Rejoindre Northwind Labs' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument()
  })
})
