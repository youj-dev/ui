import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Wizard, WizardStep, type WizardProps } from './wizard'

function Flow({ validate, onComplete, ...props }: Partial<WizardProps> & { validate?: () => boolean | string | Promise<boolean | string> }) {
  return (
    <YoujProvider reducedMotion="always">
      <Wizard onComplete={onComplete} {...props}>
        <WizardStep id="account" title="Account" validate={validate}>
          <input aria-label="Name" />
        </WizardStep>
        <WizardStep id="tools" title="Tools" optional>
          <p>Pick tools</p>
        </WizardStep>
        <WizardStep id="invite" title="Invite">
          <p>Invite people</p>
        </WizardStep>
      </Wizard>
    </YoujProvider>
  )
}

const heading = () => screen.getByRole('heading', { level: 3 })

describe('Wizard', () => {
  test('shows one step at a time and moves with Continue and Back', async () => {
    const user = userEvent.setup()
    render(<Flow />)
    expect(heading()).toHaveTextContent('Account')
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => expect(heading()).toHaveTextContent('Tools'))
    expect(screen.getByText(/Step 2 of 3/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Back' }))
    await waitFor(() => expect(heading()).toHaveTextContent('Account'))
  })

  test('the summary is a polite live region naming the step', async () => {
    const user = userEvent.setup()
    render(<Flow />)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    const summary = document.querySelector('[data-slot=wizard-summary]')!
    expect(summary).toHaveAttribute('aria-live', 'polite')
    await waitFor(() => expect(summary).toHaveTextContent('Step 2 of 3: Tools'))
  })

  test('focus moves to the new step heading after Continue', async () => {
    const user = userEvent.setup()
    render(<Flow />)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => expect(heading()).toHaveFocus())
  })

  test('headingLevel sets the step title level, and focus still lands on it', async () => {
    const user = userEvent.setup()
    render(<Flow headingLevel={2} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Account')
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => expect(screen.getByRole('heading', { level: 2 })).toHaveFocus())
  })

  test('a failed validation keeps the step, marks it in the stepper and announces the message', async () => {
    const user = userEvent.setup()
    render(<Flow validate={() => 'Enter your name.'} />)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter your name.')
    expect(heading()).toHaveTextContent('Account')
    expect(document.querySelector('[data-slot=stepper-item]')).toHaveAttribute('data-status', 'error')
  })

  test('`false` keeps the step without a message of its own', async () => {
    const user = userEvent.setup()
    render(<Flow validate={() => false} />)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => expect(document.querySelector('[data-slot=stepper-item]')).toHaveAttribute('data-status', 'error'))
    expect(document.querySelector('[data-slot=wizard-error]')).toBeNull()
  })

  test('async validation: Continue is busy while it runs, and a pass moves on and clears the error', async () => {
    const user = userEvent.setup()
    let resolve!: (ok: boolean) => void
    let calls = 0
    render(
      <Flow
        validate={() => {
          calls++
          return calls === 1 ? 'Taken' : new Promise<boolean>((r) => (resolve = r))
        }}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await screen.findByRole('alert')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => expect(screen.getByRole('button', { name: /Continue/ })).toHaveAttribute('aria-busy', 'true'))
    // A second press while it runs does not start another validation.
    await user.click(screen.getByRole('button', { name: /Continue/ }))
    expect(calls).toBe(2)
    resolve(true)
    await waitFor(() => expect(heading()).toHaveTextContent('Tools'))
    expect(document.querySelector('[data-slot=stepper-item]')).toHaveAttribute('data-status', 'complete')
  })

  test('an optional step can be skipped', async () => {
    const user = userEvent.setup()
    render(<Flow defaultStep={1} />)
    await user.click(screen.getByRole('button', { name: 'Skip' }))
    await waitFor(() => expect(heading()).toHaveTextContent('Invite'))
  })

  test('done steps in the stepper go back to them', async () => {
    const user = userEvent.setup()
    render(<Flow defaultStep={2} />)
    await user.click(screen.getByRole('button', { name: /Account, completed/ }))
    await waitFor(() => expect(heading()).toHaveTextContent('Account'))
  })

  test('Finish runs onComplete on the last step', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn(() => Promise.resolve())
    render(<Flow defaultStep={2} onComplete={onComplete} />)
    await user.click(screen.getByRole('button', { name: 'Finish' }))
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
  })

  test('controlled: step and onStepChange', async () => {
    const user = userEvent.setup()
    const onStepChange = vi.fn()
    render(<Flow step={1} onStepChange={onStepChange} />)
    expect(heading()).toHaveTextContent('Tools')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onStepChange).toHaveBeenCalledWith(2)
    // The parent did not change `step`, so the wizard stays.
    expect(heading()).toHaveTextContent('Tools')
  })
})
