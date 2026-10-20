import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Settings, type SettingsMember } from './settings'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

const members: SettingsMember[] = [
  { id: 'm1', name: 'Rosa Diaz', email: 'rosa@harbor.io', role: 'owner' },
  { id: 'm2', name: 'Jake Peralta', email: 'jake@harbor.io', role: 'member' },
]

describe('settings block', () => {
  test('props drive the tabs, the user and the team; copy rewrites the strings', async () => {
    const user = userEvent.setup()
    reduced(
      <Settings
        brand={{ name: "Harbor" }}
        user={{ name: 'Rosa Diaz', username: 'rosa', bio: 'Runs the harbor.', email: 'rosa@harbor.io' }}
        members={members}
        sections={['profile', 'team', { id: 'api', label: 'API', panel: <p>Your tokens</p> }]}
        copy={{ title: 'Preferences', teamTab: 'People', teamCount: (n, ws) => `${ws}: ${n}` }}
      />,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Preferences' })).toBeInTheDocument()
    expect(screen.getByText('Manage your profile, your team and how Harbor is billed.')).toBeInTheDocument()
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Profile', 'People', 'API'])
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Rosa Diaz')
    expect(screen.queryByText('Verified')).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'People' }))
    expect(screen.getByText('Harbor: 2')).toBeInTheDocument()
    expect(screen.getByText('jake@harbor.io')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'API' }))
    expect(screen.getByText('Your tokens')).toBeInTheDocument()
  })

  test('the profile form saves what was typed', async () => {
    const user = userEvent.setup()
    const onSaveProfile = vi.fn()
    reduced(<Settings onSaveProfile={onSaveProfile} />)
    const name = screen.getByRole('textbox', { name: 'Name' })
    await user.clear(name)
    await user.type(name, 'Ada King')
    await user.click(screen.getByRole('button', { name: 'Save profile' }))
    await waitFor(() =>
      expect(onSaveProfile).toHaveBeenCalledWith({ name: 'Ada King', username: 'ada', bio: 'Analyst, metaphysician and founder of scientific computing.' }),
    )
  })

  test('team actions call back with the member and the invite', async () => {
    const user = userEvent.setup()
    const onInvite = vi.fn()
    const onRemoveMember = vi.fn()
    reduced(<Settings defaultTab="team" members={members} onInvite={onInvite} onRemoveMember={onRemoveMember} />)

    await user.click(screen.getByRole('button', { name: 'Actions for Jake Peralta' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Remove from team' }))
    expect(onRemoveMember).toHaveBeenCalledWith(members[1])
    await waitFor(() => expect(screen.queryByText('jake@harbor.io')).not.toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Invite' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByRole('textbox', { name: 'Email' }), 'amy@harbor.io')
    await user.click(within(dialog).getByRole('button', { name: 'Send invite' }))
    await waitFor(() => expect(onInvite).toHaveBeenCalledWith({ email: 'amy@harbor.io', role: 'member' }))
    expect(await screen.findByText('amy@harbor.io')).toBeInTheDocument()
  })

  test('billing: switching plan calls back, the current plan follows, and an empty invoice list says so', async () => {
    const user = userEvent.setup()
    const onChangePlan = vi.fn()
    const onUpdatePayment = vi.fn()
    reduced(<Settings defaultTab="billing" invoices={[]} paymentMethod={{ brand: 'Amex', last4: '1005', expires: '01 / 2030' }} onChangePlan={onChangePlan} onUpdatePayment={onUpdatePayment} />)
    expect(screen.getByText('Amex ending 1005')).toBeInTheDocument()
    expect(screen.getByText(/No invoices yet/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Update' }))
    expect(onUpdatePayment).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Downgrade' }))
    await waitFor(() => expect(onChangePlan).toHaveBeenCalledWith(expect.objectContaining({ id: 'hobby' })))
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Upgrade' })).toHaveLength(1))
  })

  test('the tab can be controlled', async () => {
    const user = userEvent.setup()
    const onTabChange = vi.fn()
    reduced(<Settings tab="billing" onTabChange={onTabChange} />)
    expect(screen.getByRole('tab', { name: 'Billing' })).toHaveAttribute('aria-selected', 'true')
    await user.click(screen.getByRole('tab', { name: 'Team' }))
    expect(onTabChange).toHaveBeenCalledWith('team')
    expect(screen.getByRole('tab', { name: 'Billing' })).toHaveAttribute('aria-selected', 'true')
  })

  test('an error shows above the tabs and Retry calls back; a rejected invite shows its message', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<Settings defaultTab="team" headingLevel={2} error="The server timed out." onRetry={onRetry} onInvite={() => Promise.reject(new Error('That address already has a seat.'))} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByText('The server timed out.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Invite' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByRole('textbox', { name: 'Email' }), 'amy@harbor.io')
    await user.click(within(dialog).getByRole('button', { name: 'Send invite' }))
    expect(await within(dialog).findByText('That address already has a seat.')).toBeInTheDocument()
  })

  test('loading marks the tables busy', () => {
    reduced(<Settings defaultTab="team" loading />)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument()
  })

  test('it takes the page’s layout density, and the app can set its own', () => {
    const { container, unmount } = reduced(<Settings />)
    expect(container.querySelector('[data-yj-density]')).toBeNull()
    unmount()
    const roomy = reduced(<Settings data-yj-density="roomy" />)
    expect(roomy.container.querySelector('[data-yj-density]')).toHaveAttribute('data-yj-density', 'roomy')
  })

  test('by default, a page of the app’s frame in a centered readable column; standalone, its own page with the logo', () => {
    const logo = <span>Harbor logo</span>
    const { container, unmount } = reduced(<Settings brand={{ name: 'Harbor', logo }} />)
    const header = container.querySelector('[data-slot=app-page-header]')!
    expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'Settings' }))
    expect(container.querySelector('[data-slot=app-page-body]')).toHaveClass('own:mx-auto', 'max-w-[calc(var(--container-5xl)+--spacing(16))]')
    expect(screen.queryByText('Harbor logo')).not.toBeInTheDocument()
    unmount()
    const standalone = reduced(<Settings embedded={false} brand={{ name: 'Harbor', logo }} />)
    expect(standalone.container.querySelector('[data-slot=app-page]')).toBeNull()
    expect(screen.getByText('Harbor logo')).toBeInTheDocument()
  })
})
