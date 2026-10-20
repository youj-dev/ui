import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SetupWizard } from './setup-wizard'
import { sampleDraft } from './setup-wizard/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const heading = (name: string) => screen.findByRole('heading', { level: 2, name })
const cont = () => screen.getByRole('button', { name: 'Continue' })

describe('New hire wizard block', () => {
  test('a page with one main and h1, on the first step with an empty profile', () => {
    reduced(<SetupWizard />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Onboard a new hire' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Personal details' })).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
  })

  test('Continue checks only this step: it stays, says why and focuses the first field', async () => {
    const user = userEvent.setup()
    reduced(<SetupWizard />)
    await user.click(cont())
    expect(await screen.findByText('Enter their first name.')).toBeInTheDocument()
    expect(screen.getByText('Enter a phone number we can text on day one.')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('textbox', { name: /First name/ })).toHaveFocus())
    expect(screen.getByRole('heading', { level: 2, name: 'Personal details' })).toBeInTheDocument()
  })

  test('a valid step moves on, Enter does too, and the progress counts what’s filled', async () => {
    const user = userEvent.setup()
    reduced(<SetupWizard />)
    await user.type(screen.getByRole('textbox', { name: /First name/ }), 'Maya')
    await user.type(screen.getByRole('textbox', { name: /Last name/ }), 'Chen')
    await user.type(screen.getByRole('textbox', { name: /Personal email/ }), 'maya@')
    await user.tab()
    expect(await screen.findByText('Enter an email like maya@example.com.')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: /Personal email/ }), 'example.com')
    await user.type(screen.getByRole('textbox', { name: /Mobile/ }), '4155550132{Enter}')
    expect(await heading('Role')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('heading', { level: 2, name: 'Role' })).toHaveFocus())
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
  })

  test('Save draft keeps the draft and says when', async () => {
    const user = userEvent.setup()
    const onSaveDraft = vi.fn()
    reduced(<SetupWizard onSaveDraft={onSaveDraft} />)
    await user.type(screen.getByRole('textbox', { name: /First name/ }), 'Maya')
    expect(screen.getByText('Not saved yet')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save draft' }))
    await waitFor(() => expect(onSaveDraft).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'Maya' })))
    expect(await screen.findByText(/^Draft saved at/)).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: /First name/ }), 'r')
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
  })

  test('a resumed draft reviews, edits a step, sends the invite and lands on the success state', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const { container } = reduced(<SetupWizard draft={sampleDraft()} onSubmit={onSubmit} />)
    expect(screen.getByText('Draft restored')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
    await user.click(cont())
    await heading('Role')
    await user.click(cont())
    await heading('Accounts and equipment')
    await user.click(cont())
    await heading('Review')
    const role = screen.getByRole('region', { name: 'Role' })
    expect(within(role).getByText('Product designer')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Accounts and equipment' })).getByText('Google Workspace, Slack, Figma')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit role' }))
    await heading('Role')
    const title = screen.getByRole('textbox', { name: /Job title/ })
    await user.clear(title)
    await user.type(title, 'Senior product designer{Enter}')
    await heading('Accounts and equipment')
    await user.click(cont())
    await heading('Review')

    await user.click(screen.getByRole('button', { name: 'Send invite' }))
    expect(await screen.findByRole('heading', { name: 'Maya is all set' }, { timeout: 3000 })).toBeInTheDocument()
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'Maya', title: 'Senior product designer', team: 'design', phone: '+14155550132' }))
    expect(container.querySelector('[data-illustration="success"]')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Onboard someone else' }))
    expect(await heading('Personal details')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /First name/ })).toHaveValue('')
  })

  test('the success state takes another scene, or none', async () => {
    const user = userEvent.setup()
    const { container } = reduced(<SetupWizard draft={sampleDraft()} illustration={null} />)
    for (const next of ['Role', 'Accounts and equipment', 'Review']) {
      await user.click(cont())
      await heading(next)
    }
    await user.click(screen.getByRole('button', { name: 'Send invite' }))
    await screen.findByRole('heading', { name: 'Maya is all set' }, { timeout: 3000 })
    expect(container.querySelector('[data-illustration]')).not.toBeInTheDocument()
  })

  test('brand, copy (validation messages too), className and rest drive the page', async () => {
    const user = userEvent.setup()
    reduced(<SetupWizard brand={{ name: 'Harbor', logo: 'H' }} copy={{ title: 'Add a driver', firstNameRequired: 'Driver’s first name, please.' }} className="root-x" data-testid="root" />)
    expect(screen.getByTestId('root')).toHaveClass('root-x')
    expect(screen.getByText('Harbor')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Add a driver' })).toBeInTheDocument()
    await user.click(cont())
    expect(await screen.findByText('Driver’s first name, please.')).toBeInTheDocument()
  })

  test('your teams, laptops and accounts reach the review; the step can be controlled', async () => {
    const user = userEvent.setup()
    const onStepChange = vi.fn()
    reduced(
      <SetupWizard
        draft={{ ...sampleDraft(), team: 'dispatch', laptop: 'tough', github: true }}
        teams={{ dispatch: 'Dispatch' }}
        laptops={{ tough: 'Rugged tablet' }}
        accounts={[{ id: 'github', label: 'Route planner', description: 'Plans the day’s stops' }]}
        step={3}
        onStepChange={onStepChange}
      />,
    )
    const role = screen.getByRole('region', { name: 'Role' })
    expect(within(role).getByText(/Dispatch/)).toBeInTheDocument()
    const setup = screen.getByRole('region', { name: 'Accounts and equipment' })
    expect(within(setup).getByText('Rugged tablet')).toBeInTheDocument()
    expect(within(setup).getByText('Google Workspace, Route planner')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Edit role' }))
    expect(onStepChange).toHaveBeenCalledWith(1)
  })

  test('a failed send says why and stays on the review', async () => {
    const user = userEvent.setup()
    reduced(<SetupWizard draft={sampleDraft()} step={3} onSubmit={() => Promise.reject(new Error('Maya already has an account.'))} />)
    await user.click(screen.getByRole('button', { name: 'Send invite' }))
    expect(await screen.findByText('Maya already has an account.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Maya is all set' })).not.toBeInTheDocument()
  })
})
