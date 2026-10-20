import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { AuthFlow, type AuthFlowProps } from './auth-flow'

const flow = (props: AuthFlowProps = {}) => render(<YoujProvider reducedMotion="always">{<AuthFlow {...props} />}</YoujProvider>)
const heading = (name: string | RegExp) => screen.findByRole('heading', { name }, { timeout: 3000 })
const status = () => document.querySelector('[data-slot=auth-flow-status]')!
const deferred = () => {
  let resolve!: (value?: unknown) => void
  let reject!: (error: Error) => void
  const promise = new Promise((res, rej) => ((resolve = res), (reject = rej)))
  return { promise, resolve, reject }
}

async function signInWith(user: ReturnType<typeof userEvent.setup>, email = 'ada@northwind.dev') {
  await user.type(screen.getByRole('textbox', { name: /Email/ }), email)
  await user.type(screen.getByLabelText(/^Password/, { selector: 'input' }), 'hunter22')
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
}

describe('auth flow', () => {
  test('a page opens on sign-in with one main and an h1; a card uses an h2 and no landmark', () => {
    const { unmount } = flow()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome back')
    // Nothing moves focus or speaks on arrival.
    expect(document.body).toHaveFocus()
    expect(status()).toBeEmptyDOMElement()
    unmount()
    flow({ mode: 'card' })
    expect(screen.queryByRole('main')).toBeNull()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Welcome back')
  })

  test('sign in ↔ create account: one step at a time, focus on each heading, and each announced', async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    flow({ onViewChange })
    await user.click(screen.getByRole('button', { name: 'Create an account' }))
    const created = await heading('Create your account')
    await waitFor(() => expect(created).toHaveFocus())
    expect(screen.queryByRole('heading', { name: 'Welcome back' })).toBeNull()
    expect(status()).toHaveTextContent('Create your account.')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Welcome back' })).toHaveFocus())
    expect(onViewChange.mock.calls.map(([v]) => v)).toEqual(['sign-up', 'sign-in'])
  })

  test('the email typed on sign-in starts the reset; sending shows the address and focuses the news', async () => {
    const user = userEvent.setup()
    const onRequestReset = vi.fn().mockResolvedValue(undefined)
    flow({ onRequestReset })
    await user.type(screen.getByRole('textbox', { name: /Email/ }), 'grace@compilers.dev')
    await user.click(screen.getByRole('button', { name: 'Forgot password?' }))
    const reset = await heading('Reset your password')
    await waitFor(() => expect(reset).toHaveFocus())
    expect(screen.getByRole('textbox', { name: /Email/ })).toHaveValue('grace@compilers.dev')
    await user.click(screen.getByRole('button', { name: 'Send reset link' }))
    const news = await heading('Check your email')
    await waitFor(() => expect(news).toHaveFocus())
    expect(onRequestReset).toHaveBeenCalledWith('grace@compilers.dev')
    expect(screen.getByText('grace@compilers.dev')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Use a different email' }))
    const resetAgain = await heading('Reset your password')
    await waitFor(() => expect(resetAgain).toHaveFocus())
    expect(screen.getByRole('textbox', { name: /Email/ })).toHaveValue('grace@compilers.dev')
  })

  test('reset → done → back to sign in', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn().mockResolvedValue(undefined)
    flow({ defaultView: 'reset', email: 'ada@northwind.dev', onReset })
    expect(screen.getByText(/For ada@northwind.dev/)).toBeInTheDocument()
    await user.type(screen.getByLabelText(/^New password/, { selector: 'input' }), 'Abcdefg1!')
    await user.type(screen.getByLabelText(/^Confirm password/, { selector: 'input' }), 'Abcdefg1!')
    await user.click(screen.getByRole('button', { name: 'Update password' }))
    const done = await heading('Password updated')
    await waitFor(() => expect(done).toHaveFocus())
    expect(onReset).toHaveBeenCalledWith('Abcdefg1!')
    await user.click(screen.getByRole('button', { name: 'Continue to sign in' }))
    const welcome = await heading('Welcome back')
    await waitFor(() => expect(welcome).toHaveFocus())
  })

  test("sign in → two-step → signed in: the code field keeps focus, and the flow says you're in", async () => {
    const user = userEvent.setup()
    const onSignIn = vi.fn().mockResolvedValue('two-factor')
    const onVerifyCode = vi.fn().mockResolvedValue(true)
    flow({ onSignIn, onVerifyCode })
    await signInWith(user)
    await heading('Two-step verification')
    const code = screen.getByRole('textbox', { name: /Verification code/ })
    await waitFor(() => expect(code).toHaveFocus())
    expect(onSignIn).toHaveBeenCalledWith({ email: 'ada@northwind.dev', password: 'hunter22', remember: true })
    await user.type(code, '123456')
    const signedIn = await heading('You’re signed in')
    await waitFor(() => expect(signedIn).toHaveFocus())
    expect(onVerifyCode).toHaveBeenCalledWith('123456', 'totp')
    expect(status()).toHaveTextContent('You’re signed in.')
  })

  test('a sign-in that needs no second step goes straight in', async () => {
    const user = userEvent.setup()
    flow({ onSignIn: vi.fn().mockResolvedValue(undefined) })
    await signInWith(user)
    expect(await heading('You’re signed in')).toBeInTheDocument()
  })

  test('a magic link goes to the address in the field; without one, the field says so', async () => {
    const user = userEvent.setup()
    const onMagicLink = vi.fn().mockResolvedValue(undefined)
    flow({ onMagicLink })
    await user.click(screen.getByRole('button', { name: 'Email me a sign-in link' }))
    expect(await screen.findByText('Enter your email.')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('textbox', { name: /Email/ })).toHaveFocus())
    expect(onMagicLink).not.toHaveBeenCalled()
    // The shake settles back before the next press.
    await user.type(screen.getByRole('textbox', { name: /Email/ }), 'ada@northwind.dev')
    await user.click(await screen.findByRole('button', { name: 'Email me a sign-in link' }, { timeout: 4000 }))
    const inbox = await heading('Check your inbox')
    await waitFor(() => expect(inbox).toHaveFocus())
    expect(onMagicLink).toHaveBeenCalledWith('ada@northwind.dev')
    expect(screen.getByText('ada@northwind.dev')).toBeInTheDocument()
    // Pressing the link inside the form never submits it.
    expect(screen.queryByText('Enter your password.')).toBeNull()
  })

  test('a handler is pending while it runs, and a rejection explains itself without moving on', async () => {
    const user = userEvent.setup()
    const request = deferred()
    flow({ onSignIn: () => request.promise })
    await signInWith(user)
    expect(await screen.findByRole('button', { name: /Signing in/ })).toBeInTheDocument()
    await act(async () => request.reject(new Error('That email and password don’t match.')))
    const message = await screen.findByText('That email and password don’t match.')
    expect(message.closest('[data-slot=alert]')).toHaveAttribute('role', 'alert')
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
  })

  test('a rejected reset request stays on its form', async () => {
    const user = userEvent.setup()
    const onRequestReset = vi.fn().mockRejectedValue(new Error('Try again in a minute.'))
    flow({ defaultView: 'forgot', onRequestReset })
    await user.type(screen.getByRole('textbox', { name: /Email/ }), 'ada@northwind.dev')
    await user.click(screen.getByRole('button', { name: 'Send reset link' }))
    expect(await screen.findByRole('button', { name: /Couldn’t send/ })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Check your email' })).toBeNull()
  })

  test('a wrong code shakes and stays on the second step', async () => {
    const user = userEvent.setup()
    flow({ defaultView: 'two-factor', onVerifyCode: vi.fn().mockResolvedValue(false) })
    await user.type(screen.getByRole('textbox', { name: /Verification code/ }), '000000')
    expect(await screen.findByText('That code didn’t work. Check it and try again.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Two-step verification' })).toBeInTheDocument()
  })

  test('controlled: it asks to move and shows what the router says', async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    const { rerender } = flow({ view: 'forgot', onViewChange })
    await user.click(screen.getByRole('button', { name: 'Back to sign in' }))
    expect(onViewChange).toHaveBeenCalledWith('sign-in')
    expect(screen.getByRole('heading', { name: 'Reset your password' })).toBeInTheDocument()
    rerender(
      <YoujProvider reducedMotion="always">
        <AuthFlow view="sign-in" onViewChange={onViewChange} />
      </YoujProvider>,
    )
    const back = await heading('Welcome back')
    await waitFor(() => expect(back).toHaveFocus())
  })

  test('reduced motion swaps in place: no height is pinned and the old step is gone at once', async () => {
    const user = userEvent.setup()
    const { container } = flow()
    await user.click(screen.getByRole('button', { name: 'Create an account' }))
    const stage = container.querySelector<HTMLElement>('[data-slot=auth-flow-stage]')!
    expect(stage.style.height).toBe('')
    expect(stage.querySelectorAll('[data-step]')).toHaveLength(1)
  })

  test('copy replaces the words it names and keeps the rest', () => {
    flow({ copy: { signInTitle: 'Log in to Acme' } })
    expect(screen.getByRole('heading', { name: 'Log in to Acme' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Forgot password?' })).toBeInTheDocument()
  })
})
