import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { TeamMembers, type TeamMember } from './team-members'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('Team members block', () => {
  test('names its landmarks, counts seats and locks the owner’s role', () => {
    reduced(<TeamMembers embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Team members' })).toBeInTheDocument()
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '10 of 12 seats used')
    const table = screen.getByRole('table', { name: 'Members' })
    expect(within(table).getAllByRole('row')).toHaveLength(9)
    // The owner's role is a label; everyone else has a named role control.
    expect(screen.queryByRole('combobox', { name: 'Role for Mara Okafor' })).not.toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Role for Theo Lindqvist' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Pending invites' }).children).toHaveLength(2)
  })

  test('search narrows the table and an empty result offers to clear it', async () => {
    const user = userEvent.setup()
    reduced(<TeamMembers embedded={false} />)
    const search = screen.getByRole('searchbox', { name: 'Search members' })
    await user.type(search, 'priya')
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2)
    await user.clear(search)
    await user.type(search, 'nobody')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(search).toHaveValue('')
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(9)
  })

  test('changing a role updates the row and says so', async () => {
    const user = userEvent.setup()
    reduced(<TeamMembers embedded={false} />)
    const role = screen.getByRole('combobox', { name: 'Role for Jonah Beck' })
    await user.click(role)
    await user.click(await screen.findByRole('option', { name: 'Admin' }))
    await waitFor(() => expect(role).toHaveTextContent('Admin'))
    expect(await screen.findByText('Jonah Beck is now an Admin')).toBeInTheDocument()
  })

  test('removing a member asks first, then drops the row', async () => {
    const user = userEvent.setup()
    reduced(<TeamMembers embedded={false} />)
    await user.click(screen.getByRole('button', { name: 'Actions for Jonah Beck' }))
    await user.click(await screen.findByRole('menuitem', { name: /Remove from team/ }))
    const confirm = await screen.findByRole('alertdialog', { name: 'Remove Jonah Beck from Halyard?' })
    await user.click(within(confirm).getByRole('button', { name: 'Remove member' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    await waitFor(() => expect(within(screen.getByRole('table')).queryByText('Jonah Beck')).not.toBeInTheDocument())
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '9 of 12 seats used')
  })

  test('the owner and you can’t be removed', async () => {
    const user = userEvent.setup()
    reduced(<TeamMembers embedded={false} />)
    await user.click(screen.getByRole('button', { name: 'Actions for Mara Okafor' }))
    expect(await screen.findByRole('menuitem', { name: 'Copy email' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /Remove/ })).not.toBeInTheDocument()
  })

  test('invites go out as a batch, checked per address and capped by free seats', async () => {
    const user = userEvent.setup()
    reduced(<TeamMembers embedded={false} />)
    await user.click(screen.getByRole('button', { name: 'Invite people' }))
    const dialog = await screen.findByRole('dialog', { name: 'Invite to Halyard' })
    const field = within(dialog).getByRole('textbox', { name: 'Email addresses' })
    await user.type(field, 'theo@halyard.dev{Enter}')
    expect(within(dialog).getByText('theo@halyard.dev is already in Halyard.')).toBeInTheDocument()
    await user.clear(field)
    await user.type(field, 'a@x.io{Enter}b@x.io{Enter}c@x.io{Enter}')
    expect(within(dialog).getByText('Only 2 seats left. Remove 1 or add seats.')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Remove c@x.io' }))
    await user.click(within(dialog).getByRole('button', { name: 'Send 2 invites' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Invite to Halyard' })).not.toBeInTheDocument(), { timeout: 3000 })
    const invites = screen.getByRole('list', { name: 'Pending invites' })
    expect(within(invites).getByText('a@x.io')).toBeInTheDocument()
    expect(within(invites).getByText('b@x.io')).toBeInTheDocument()
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '12 of 12 seats used')
  })

  test('revoking an invite removes it', async () => {
    const user = userEvent.setup()
    reduced(<TeamMembers embedded={false} />)
    await user.click(screen.getByRole('button', { name: 'Revoke invite to rhea@halyard.dev' }))
    await waitFor(() => expect(screen.queryByText('rhea@halyard.dev', { selector: 'li *' })).not.toBeInTheDocument())
    expect(await screen.findByText('Invite to rhea@halyard.dev revoked')).toBeInTheDocument()
  })

  test('by default, a page of the app’s frame: the shared header holds the title and Invite, with no top bar, in the host’s theme', () => {
    const { container } = reduced(<TeamMembers workspace="Acme" />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.queryByText('Halyard')).not.toBeInTheDocument()
    const header = container.querySelector('[data-slot=app-page-header]')!
    expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'Team members' }))
    expect(header).toContainElement(screen.getByRole('button', { name: /Invite/ }))
    expect(screen.getByRole('heading', { level: 2, name: /Team/ })).toBeInTheDocument()
    expect(screen.getByText('Manage who has access to Acme and what they can change.')).toBeInTheDocument()
    expect(container.querySelector('[data-yj-theme]')).toBeNull()
  })

  describe('with your data', () => {
    const crew: TeamMember[] = [
      { id: 'c1', name: 'Nia Brooks', email: 'nia@orbit.co', role: 'owner', active: 0, you: true },
      { id: 'c2', name: 'Omar Haddad', email: 'omar@orbit.co', role: 'editor', active: 30 },
    ]
    const roles = [
      { value: 'owner', label: 'Owner' },
      { value: 'editor', label: 'Editor', blurb: 'Edits everything.' },
      { value: 'guest', label: 'Guest' },
    ]

    test('props drive the rows, roles, brand and copy', () => {
      reduced(<TeamMembers embedded={false} members={crew} invites={[]} roles={roles} seats={5} brand={{ name: 'Orbit' }} copy={{ title: 'People', seatsUsed: (u, s) => `${u}/${s}` }} />)
      expect(screen.getByRole('heading', { level: 1, name: 'People' })).toBeInTheDocument()
      expect(screen.getByText('Manage who has access to Orbit and what they can change.')).toBeInTheDocument()
      expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(3)
      expect(screen.getByRole('combobox', { name: 'Role for Omar Haddad' })).toHaveTextContent('Editor')
      expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '2/5')
    })

    test('callbacks get the payload; a rejected role change puts the row back', async () => {
      const user = userEvent.setup()
      const onRoleChange = vi.fn().mockRejectedValue(new Error('Only owners can do that.'))
      const onRemoveMember = vi.fn()
      const onInvite = vi.fn()
      reduced(<TeamMembers embedded={false} members={crew} invites={[]} roles={roles} onRoleChange={onRoleChange} onRemoveMember={onRemoveMember} onInvite={onInvite} />)

      const role = screen.getByRole('combobox', { name: 'Role for Omar Haddad' })
      await user.click(role)
      await user.click(await screen.findByRole('option', { name: 'Guest' }))
      expect(onRoleChange).toHaveBeenCalledWith(crew[1], 'guest')
      expect(await screen.findByText('Only owners can do that.')).toBeInTheDocument()
      await waitFor(() => expect(role).toHaveTextContent('Editor'))

      await user.click(screen.getByRole('button', { name: 'Actions for Omar Haddad' }))
      await user.click(await screen.findByRole('menuitem', { name: /Remove from team/ }))
      await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Remove member' }))
      await waitFor(() => expect(onRemoveMember).toHaveBeenCalledWith(crew[1]))

      await user.click(screen.getByRole('button', { name: 'Invite people' }))
      const dialog = await screen.findByRole('dialog')
      await user.type(within(dialog).getByRole('textbox', { name: 'Email addresses' }), 'li@orbit.co{Enter}')
      await user.click(within(dialog).getByRole('button', { name: 'Send invite' }))
      await waitFor(() => expect(onInvite).toHaveBeenCalledWith({ emails: ['li@orbit.co'], role: 'editor' }))
      expect(await screen.findByRole('list', { name: 'Pending invites' })).toHaveTextContent('li@orbit.co')
    })

    test('loading, error and empty states', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      const { rerender } = reduced(<TeamMembers embedded={false} loading members={[]} invites={[]} />)
      expect(screen.getByText('Loading members…')).toBeInTheDocument()
      rerender(
        <YoujProvider reducedMotion="always">
          <TeamMembers embedded={false} members={[]} invites={[]} error="Network down." onRetry={onRetry} />
        </YoujProvider>,
      )
      expect(screen.getByText('No members yet')).toBeInTheDocument()
      expect(screen.getByText('Network down.')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Retry' }))
      expect(onRetry).toHaveBeenCalled()
    })
  })
})
