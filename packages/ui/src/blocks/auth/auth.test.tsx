import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ForgotPassword } from './forgot-password'
import { Login } from './login'
import { MagicLinkSent } from './magic-link-sent'
import { ResetPassword } from './reset-password'
import { Signup } from './signup'
import { TwoFactor } from './two-factor'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('auth blocks', () => {
  test.each([
    ['login', <Login />, 'Welcome back'],
    ['signup', <Signup />, 'Create your account'],
    ['two-factor', <TwoFactor />, 'Two-step verification'],
    ['forgot password', <ForgotPassword />, 'Reset your password'],
    ['reset password', <ResetPassword />, 'Choose a new password'],
    ['magic link sent', <MagicLinkSent />, 'Check your inbox'],
  ])('%s: one main landmark and one h1, in both layouts', (_, page, heading) => {
    for (const layout of ['card', 'split'] as const) {
      const { unmount } = reduced(<page.type {...page.props} layout={layout} />)
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(heading)
      unmount()
    }
  })

  test.each([
    ['login', <Login />],
    ['signup', <Signup />],
  ])("%s: providers use Google's approved label and full-color G", (_, page) => {
    reduced(page)
    const google = screen.getByRole('button', { name: 'Continue with Google' })
    const fills = [...google.querySelectorAll('svg path')].map((p) => p.getAttribute('fill')?.toUpperCase())
    expect(fills).toEqual(['#EA4335', '#4285F4', '#FBBC05', '#34A853'])
    expect(google.querySelector('svg')).toHaveAttribute('aria-hidden')
    expect(screen.getByRole('button', { name: 'Continue with GitHub' })).toBeInTheDocument()
  })

  test('login: submitting empty shows every error, focuses the first and sends nothing', async () => {
    const user = userEvent.setup()
    const onSignIn = vi.fn()
    reduced(<Login onSignIn={onSignIn} />)
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Enter your email.')).toBeInTheDocument()
    expect(screen.getByText('Enter your password.')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('textbox', { name: /Email/ })).toHaveFocus())
    expect(screen.getByRole('textbox', { name: /Email/ })).toHaveAttribute('aria-invalid', 'true')
    expect(onSignIn).not.toHaveBeenCalled()
  })

  test('login: valid details are sent; a rejection explains itself in an alert', async () => {
    const user = userEvent.setup()
    const onSignIn = vi.fn().mockRejectedValue(new Error('That email and password don’t match.'))
    reduced(<Login onSignIn={onSignIn} />)
    await user.type(screen.getByRole('textbox', { name: /Email/ }), 'ada@northwind.dev')
    await user.type(screen.getByLabelText(/^Password/, { selector: 'input' }), 'hunter22')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(onSignIn).toHaveBeenCalledWith({ email: 'ada@northwind.dev', password: 'hunter22', remember: true }))
    const message = await screen.findByText('That email and password don’t match.')
    expect(message.closest('[data-slot=alert]')).toHaveAttribute('role', 'alert')
  })

  test('login: Enter in the password field submits', async () => {
    const user = userEvent.setup()
    const onSignIn = vi.fn().mockResolvedValue(undefined)
    reduced(<Login onSignIn={onSignIn} />)
    await user.type(screen.getByRole('textbox', { name: /Email/ }), 'ada@northwind.dev')
    await user.type(screen.getByLabelText(/^Password/, { selector: 'input' }), 'hunter22{Enter}')
    await waitFor(() => expect(onSignIn).toHaveBeenCalledOnce())
  })

  test('signup: the rules tick as the password meets them, and the terms must be accepted', async () => {
    const user = userEvent.setup()
    const onSignUp = vi.fn()
    reduced(<Signup onSignUp={onSignUp} />)
    await user.type(screen.getByLabelText(/^Password/, { selector: 'input' }), 'Abcdefg1!')
    const rules = screen.getByRole('list')
    expect(within(rules).getAllByText(/Done:/)).toHaveLength(4)
    await user.type(screen.getByRole('textbox', { name: /Name/ }), 'Ada')
    await user.type(screen.getByRole('textbox', { name: /Work email/ }), 'ada@northwind.dev')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByText('Accept the terms to create an account.')).toBeInTheDocument()
    expect(onSignUp).not.toHaveBeenCalled()
    // The Form's submit shakes to "Check the form", then settles back.
    expect(screen.getByRole('button', { name: /Check the form/ })).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox'))
    await user.click(await screen.findByRole('button', { name: 'Create account' }, { timeout: 4000 }))
    await waitFor(() => expect(onSignUp).toHaveBeenCalledOnce())
  })

  test('two-factor: a full code verifies itself; the recovery code is the fallback', async () => {
    const user = userEvent.setup()
    const onVerify = vi.fn().mockResolvedValue(true)
    reduced(<TwoFactor onVerify={onVerify} />)
    await user.type(screen.getByRole('textbox', { name: /Verification code/ }), '123456')
    await waitFor(() => expect(onVerify).toHaveBeenCalledWith('123456', 'totp'))
    await user.click(screen.getByRole('button', { name: 'Use a recovery code instead' }))
    await user.type(screen.getByRole('textbox', { name: /Recovery code/ }), 'abcd2345')
    await waitFor(() => expect(onVerify).toHaveBeenCalledWith('ABCD2345', 'recovery'))
  })

  test('forgot password: sending swaps in the confirmation and moves focus to it', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn().mockResolvedValue(undefined)
    reduced(<ForgotPassword onSend={onSend} />)
    await user.type(screen.getByRole('textbox', { name: /Email/ }), 'ada@northwind.dev')
    await user.click(screen.getByRole('button', { name: 'Send reset link' }))
    const heading = await screen.findByRole('heading', { name: 'Check your email' })
    await waitFor(() => expect(heading).toHaveFocus())
    expect(onSend).toHaveBeenCalledWith('ada@northwind.dev')
    await user.click(screen.getByRole('button', { name: 'Use a different email' }))
    await waitFor(() => expect(screen.getByRole('textbox', { name: /Email/ })).toHaveFocus())
  })

  test('reset password: the confirmation must match', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()
    reduced(<ResetPassword onReset={onReset} />)
    await user.type(screen.getByLabelText(/^New password/, { selector: 'input' }), 'Abcdefg1!')
    await user.type(screen.getByLabelText(/^Confirm password/, { selector: 'input' }), 'Abcdefg2!')
    await user.click(screen.getByRole('button', { name: 'Update password' }))
    expect(await screen.findByText('The passwords don’t match yet.')).toBeInTheDocument()
    expect(onReset).not.toHaveBeenCalled()
  })

  test('magic link: names the address and offers mail apps and a resend', () => {
    reduced(<MagicLinkSent email="grace@compilers.dev" />)
    expect(screen.getByText('grace@compilers.dev')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Gmail' })).toHaveAttribute('rel', 'noreferrer')
    expect(screen.getByRole('button', { name: /Resend in/ })).toBeInTheDocument()
  })
})

describe('auth blocks with your data', () => {
  test('login: brand, copy and links drive the page', () => {
    reduced(
      <Login
        brand={{ name: 'Fernleaf', href: '/home' }}
        copy={{ signInTitle: 'Sign in to your portal', createAccountLink: 'Register' }}
        links={{ signUp: '/register', forgot: '/reset', terms: '/terms' }}
      />,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sign in to your portal')
    expect(screen.getByRole('link', { name: 'Fernleaf' })).toHaveAttribute('href', '/home')
    expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute('href', '/register')
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute('href', '/reset')
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms')
  })

  test('login: your providers replace the demo pair, and onProvider hears their id', async () => {
    const user = userEvent.setup()
    const onProvider = vi.fn()
    reduced(<Login providers={[{ id: 'apple', label: 'Continue with Apple' }]} onProvider={onProvider} />)
    expect(screen.queryByRole('button', { name: 'Continue with Google' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue with Apple' }))
    await waitFor(() => expect(onProvider).toHaveBeenCalledWith('apple'))
  })

  test('login: defaultValues fill the form, and a server error shows above it', async () => {
    const user = userEvent.setup()
    const onSignIn = vi.fn().mockResolvedValue(undefined)
    reduced(<Login defaultValues={{ email: 'sam@fernleaf.health', remember: false }} error="Your session expired." onSignIn={onSignIn} />)
    expect(screen.getByText('Your session expired.').closest('[data-slot=alert]')).toHaveAttribute('role', 'alert')
    expect(screen.getByRole('textbox', { name: /Email/ })).toHaveValue('sam@fernleaf.health')
    await user.type(screen.getByLabelText(/^Password/, { selector: 'input' }), 'hunter22{Enter}')
    await waitFor(() => expect(onSignIn).toHaveBeenCalledWith({ email: 'sam@fernleaf.health', password: 'hunter22', remember: false }))
  })

  test('signup: no providers leaves the email form without the "or" divider', () => {
    reduced(<Signup providers={[]} copy={{ signUpTitle: 'Register as a patient' }} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Register as a patient')
    expect(screen.queryByRole('button', { name: /Continue with/ })).not.toBeInTheDocument()
    expect(screen.queryByText('or')).not.toBeInTheDocument()
  })

  test('linkComponent renders every internal link; className, rest and headingLevel reach the page', () => {
    const RouterLink = (props: React.ComponentProps<'a'>) => <a data-router="" {...props} />
    reduced(<ForgotPassword linkComponent={RouterLink} links={{ signIn: '/sign-in' }} className="custom-root" data-testid="page" headingLevel={2} />)
    const back = screen.getByRole('link', { name: 'Back to sign in' })
    expect(back).toHaveAttribute('href', '/sign-in')
    expect(back).toHaveAttribute('data-router')
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('data-router')
    expect(screen.getByRole('link', { name: 'Northwind' })).toHaveAttribute('data-router')
    expect(screen.getByTestId('page')).toHaveClass('custom-root')
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Reset your password')
  })

  test('reset password names your account; magic link takes your mail-app links', () => {
    const { unmount } = reduced(<ResetPassword email="sam@fernleaf.health" error="This link has expired." />)
    expect(screen.getByText(/For sam@fernleaf\.health\./)).toBeInTheDocument()
    expect(screen.getByText('This link has expired.')).toBeInTheDocument()
    unmount()
    reduced(<MagicLinkSent links={{ gmail: 'https://mail.example.com' }} />)
    expect(screen.getByRole('link', { name: 'Open Gmail' })).toHaveAttribute('href', 'https://mail.example.com')
  })
})