import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Onboarding } from './onboarding'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('onboarding block', () => {
  test('brand and copy drive the welcome; className and rest reach the root', () => {
    reduced(<Onboarding illustration={null} brand={{ name: 'Harbor' }} copy={{ start: 'Begin', page: 'Set up Harbor' }} className="root-x" data-testid="root" />)
    expect(screen.getByTestId('root')).toHaveClass('root-x')
    expect(screen.getByRole('heading', { level: 1, name: 'Set up Harbor' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Welcome to Harbor' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Begin' })).toBeInTheDocument()
  })

  test('defaultValues prefill, presets narrow the choice, and onFinish gets the setup', async () => {
    const user = userEvent.setup()
    const onFinish = vi.fn()
    reduced(<Onboarding illustration={null} defaultStep={1} defaultValues={{ name: 'Harbor Freight' }} presets={['graphite', 'terminal']} onFinish={onFinish} />)
    expect(screen.getByRole('textbox', { name: /Workspace name/ })).toHaveValue('Harbor Freight')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getAllByRole('radio')).toHaveLength(2)
    await user.click(screen.getByRole('radio', { name: /Terminal/ }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Skip and finish' }))
    await waitFor(() => expect(onFinish).toHaveBeenCalledWith({ name: 'Harbor Freight', theme: 'terminal', invites: [] }))
  })

  test('a failed finish says why and stays on the step', async () => {
    const user = userEvent.setup()
    reduced(<Onboarding illustration={null} defaultStep={3} defaultValues={{ name: 'Harbor' }} onFinish={() => Promise.reject(new Error('That workspace URL is taken.'))} />)
    await user.click(screen.getByRole('button', { name: 'Skip and finish' }))
    expect(await screen.findByText('That workspace URL is taken.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'You’re all set' })).not.toBeInTheDocument()
  })

  test('the step can be controlled', async () => {
    const user = userEvent.setup()
    const onStepChange = vi.fn()
    reduced(<Onboarding illustration={null} step={0} onStepChange={onStepChange} />)
    await user.click(screen.getByRole('button', { name: 'Get started' }))
    expect(onStepChange).toHaveBeenCalledWith(1)
    expect(screen.getByRole('heading', { name: 'Welcome to Northwind' })).toBeInTheDocument()
  })

  test('the dashboard button links through linkComponent', async () => {
    const user = userEvent.setup()
    const RouterLink = (props: React.ComponentProps<'a'>) => <a data-router="" {...props} />
    reduced(<Onboarding illustration={null} defaultStep={3} defaultValues={{ name: 'Harbor' }} onFinish={() => {}} dashboardHref="/app" linkComponent={RouterLink} />)
    await user.click(screen.getByRole('button', { name: 'Skip and finish' }))
    const link = await screen.findByRole('link', { name: 'Open your dashboard' }, { timeout: 3000 })
    expect(link).toHaveAttribute('href', '/app')
    expect(link).toHaveAttribute('data-router')
  })
})
