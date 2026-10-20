import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { basalt, brutal, shippedThemes, terminal, themes } from '@youj/core/lib/youj/theme'
import { EmptyStates } from './empty-states'
import { Onboarding } from './onboarding'
import { Settings } from './settings'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('app blocks', () => {
  test('settings: arrow keys move between tabs; inviting adds a row to the team', async () => {
    const user = userEvent.setup()
    reduced(<Settings />)
    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument()
    const profile = screen.getByRole('tab', { name: 'Profile' })
    profile.focus()
    await user.keyboard('{ArrowDown}{ArrowDown}')
    const team = screen.getByRole('tab', { name: 'Team' })
    expect(team).toHaveFocus()
    expect(team).toHaveAttribute('aria-selected', 'true')

    await user.click(screen.getByRole('button', { name: 'Invite' }))
    const dialog = await screen.findByRole('dialog', { name: 'Invite a teammate' })
    await user.type(within(dialog).getByRole('textbox', { name: 'Email' }), 'mary@northwind.dev')
    await user.click(within(dialog).getByRole('button', { name: 'Send invite' }))
    expect(await screen.findByText('mary@northwind.dev')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByText('5 people in Northwind Labs.')).toBeInTheDocument()
  })

  test('settings: a bad invite address is explained, not sent', async () => {
    const user = userEvent.setup()
    reduced(<Settings defaultTab="team" />)
    await user.click(screen.getByRole('button', { name: 'Invite' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByRole('textbox', { name: 'Email' }), 'mary')
    await user.click(within(dialog).getByRole('button', { name: 'Send invite' }))
    expect(await within(dialog).findByText('Enter an email like name@company.com.')).toBeInTheDocument()
  })

  test('onboarding: steps advance, the name is required, and a preset is a radio choice', async () => {
    const user = userEvent.setup()
    const onFinish = vi.fn().mockResolvedValue(undefined)
    reduced(<Onboarding onFinish={onFinish} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Set up your workspace')
    await user.click(screen.getByRole('button', { name: 'Get started' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Name your workspace' })).toHaveFocus())
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByText('Give your workspace a name.')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: /Workspace name/ }), 'Northwind Labs')
    expect(screen.getByRole('textbox', { name: 'URL' })).toHaveValue('northwind-labs')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    const presets = screen.getByRole('radiogroup', { name: 'Theme preset' })
    expect(within(presets).getAllByRole('radio')).toHaveLength(shippedThemes.length)
    await user.click(within(presets).getByRole('radio', { name: /Terminal/ }))
    expect(within(presets).getByRole('radio', { name: /Terminal/ })).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'grace@northwind.dev{Enter}')
    expect(within(screen.getByRole('list', { name: 'Invites' })).getByText('grace@northwind.dev')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Send 1 invite and finish' }))
    await waitFor(() => expect(onFinish).toHaveBeenCalledWith({ name: 'Northwind Labs', theme: 'terminal', invites: ['grace@northwind.dev'] }))
    expect(await screen.findByRole('heading', { name: 'You’re all set' })).toBeInTheDocument()
  })

  test('onboarding: follows the preset around it until one is picked here', async () => {
    const user = userEvent.setup()
    const page = (theme: (typeof themes)[number]) => (
      <YoujProvider reducedMotion="always" theme={theme}>
        <Onboarding />
      </YoujProvider>
    )
    const { container, rerender } = render(page(terminal))
    // The wizard's own scope, inside the provider's: none until a preset is picked, so it wears the app's.
    const scope = () => container.firstElementChild!.querySelector('[data-yj-theme]')
    const radio = (name: RegExp) => within(screen.getByRole('radiogroup', { name: 'Theme preset' })).getByRole('radio', { name })
    expect(scope()).toBeNull()
    rerender(page(brutal))
    expect(scope()).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Get started' }))
    await user.type(await screen.findByRole('textbox', { name: /Workspace name/ }), 'Northwind')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    // The app's preset shows as the current pick.
    expect(radio(/Brutal/)).toHaveAttribute('aria-checked', 'true')
    await user.click(radio(/Basalt/))
    rerender(page(terminal))
    expect(scope()).toHaveAttribute('data-yj-theme', basalt.id)
  })

  test('empty states: each says what is missing, and the offline one reports the connection', () => {
    reduced(<EmptyStates />)
    for (const title of ['No projects yet', 'No results for “billing webhook”', 'You don’t have access', 'You’re offline']) {
      expect(screen.getByText(title)).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: 'Request access' })).toBeInTheDocument()
    expect(screen.getByText('Your browser reports a connection.')).toHaveAttribute('role', 'status')
  })
})
