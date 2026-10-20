import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { basalt, YoujProvider } from '@youj/core'
import { CtaForm } from './cta-form'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const submit = () => screen.getByRole('button', { name: /Start the team trial/ })

describe('CTA form', () => {
  test('a section named by its headline, with the form fields labelled', () => {
    reduced(<CtaForm />)
    expect(screen.getByRole('region', { name: 'Put your whole team on Pro for 14 days' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Work email' })).toHaveAttribute('type', 'email')
    const sizes = screen.getByRole('group', { name: 'Team size' })
    expect(within(sizes).getByRole('button', { name: '11–50', pressed: true })).toBeInTheDocument()
  })

  test('an empty, malformed or personal email is explained under the field', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(() => Promise.resolve())
    reduced(<CtaForm onSubmit={onSubmit} />)
    await user.click(submit())
    expect(await screen.findByText('Enter your work email.')).toBeInTheDocument()
    const input = screen.getByRole('textbox', { name: 'Work email' })
    await user.type(input, 'mira@gmail.com')
    expect(screen.queryByText('Enter your work email.')).not.toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: /Start the team trial/ }, { timeout: 4000 }))
    expect(await screen.findByText('Use your work email, so we can find your team.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  test('a good email sends the team size, then shows what happens next and focuses it', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(() => Promise.resolve())
    reduced(<CtaForm onSubmit={onSubmit} />)
    await user.type(screen.getByRole('textbox', { name: 'Work email' }), 'mira@lumen.dev')
    await user.click(screen.getByRole('button', { name: '51–200' }))
    await user.click(submit())
    expect(onSubmit).toHaveBeenCalledWith({ email: 'mira@lumen.dev', teamSize: '51–200' })
    const heading = await screen.findByRole('heading', { level: 3, name: 'Check mira@lumen.dev' }, { timeout: 4000 })
    // It's drawn while the next steps settle in, and takes focus once they have (a timer later).
    await waitFor(() => expect(heading).toHaveFocus())
    expect(screen.getByText('Invite your team: 51–200 seats are on us for 14 days.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Use a different email' }))
    expect(await screen.findByRole('textbox', { name: 'Work email' })).toHaveValue('mira@lumen.dev')
  })

  test('a failed send keeps the input and raises an alert with the error’s message', async () => {
    const user = userEvent.setup()
    reduced(<CtaForm onSubmit={() => Promise.reject(new Error('Signups are paused'))} />)
    await user.type(screen.getByRole('textbox', { name: 'Work email' }), 'mira@lumen.dev')
    await user.click(submit())
    expect(await screen.findByText('We couldn’t start your trial')).toBeInTheDocument()
    expect(screen.getByText('Signups are paused')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Work email' })).toHaveValue('mira@lumen.dev')
  })

  test('proof, team sizes and copy drive the form, and onSubmit gets the chosen size', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    reduced(
      <CtaForm
        onSubmit={onSubmit}
        proof={[{ icon: () => null, text: 'Every lab test in one timeline' }]}
        teamSizes={['Solo', '2–5']}
        defaultValues={{ teamSize: 'Solo', email: 'ana@' }}
        requireWorkEmail={false}
        headingLevel={3}
        className="my-form"
        copy={{ title: 'Bring your practice', emailLabel: 'Email', teamSizeLabel: 'Practitioners', submit: 'Request the pilot', doneSteps: (s: string) => [`Seats: ${s}`] }}
      />,
    )
    expect(screen.getByRole('region', { name: 'Bring your practice' })).toHaveClass('my-form')
    expect(screen.getByText('Every lab test in one timeline')).toBeInTheDocument()
    const sizes = screen.getByRole('group', { name: 'Practitioners' })
    expect(within(sizes).getAllByRole('button').map((b) => b.textContent)).toEqual(['Solo', '2–5'])
    expect(screen.getByRole('heading', { level: 3, name: 'Bring your practice' })).toBeInTheDocument()
    expect(within(sizes).getByRole('button', { name: 'Solo' })).toHaveAttribute('aria-pressed', 'true')
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'gmail.com')
    await user.click(within(sizes).getByRole('button', { name: '2–5' }))
    await user.click(screen.getByRole('button', { name: /Request the pilot/ }))
    expect(onSubmit).toHaveBeenCalledWith({ email: 'ana@gmail.com', teamSize: '2–5' })
    expect(await screen.findByText('Seats: 2–5', undefined, { timeout: 4000 })).toBeInTheDocument()
  })

  test('unmounting mid-success clears its timers', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const view = render(<CtaForm onSubmit={() => Promise.resolve()} />)
    await user.type(screen.getByRole('textbox', { name: 'Work email' }), 'mira@lumen.dev')
    await user.click(submit())
    view.unmount()
    expect(() => vi.runOnlyPendingTimers()).not.toThrow()
    vi.useRealTimers()
  })

  test('embedded, it drops the page padding; a theme adds a ThemeScope', () => {
    const scopes = (ui: React.ReactNode) => {
      const view = reduced(ui)
      const n = view.container.querySelectorAll('[data-yj-theme]').length
      view.unmount()
      return n
    }
    expect(scopes(<CtaForm theme={basalt} />)).toBe(scopes(<CtaForm />) + 1)
    reduced(<CtaForm embedded />)
    expect(screen.getByRole('region')).not.toHaveClass('py-20')
  })
})
