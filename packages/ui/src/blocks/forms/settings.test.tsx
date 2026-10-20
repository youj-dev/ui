import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SettingsForm, type SettingsGroup } from './settings'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const bar = () => document.querySelector<HTMLElement>('[data-slot=settings-bar]')!
const status = () => document.querySelector<HTMLElement>('[data-slot=settings-status]')!
const save = () => document.querySelector<HTMLButtonElement>('[data-slot=form-submit]')!

describe('Settings form block', () => {
  test('lays out each group with its title and its fields at their saved values', () => {
    reduced(<SettingsForm />)
    expect(screen.getByRole('heading', { level: 2, name: 'General' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Workspace', 'Defaults', 'Security'])
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Northwind')
    expect(screen.getByRole('textbox', { name: 'URL' })).toHaveValue('northwind')
    expect(screen.getByRole('radio', { name: /Workspace/ })).toBeChecked()
    expect(screen.getByRole('switch', { name: 'Require two-factor authentication' })).not.toBeChecked()
    expect(screen.getByText('northwind.com')).toBeInTheDocument()
    // At rest the foot says where changes apply, and nothing in the bar can be reached.
    expect(bar()).toHaveAttribute('data-state', 'idle')
    expect(screen.getByText('Changes apply to everyone in the workspace.')).toBeVisible()
  })

  test('standalone, it is the page: an h1 and its groups under it', () => {
    reduced(<SettingsForm embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'General' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3)
  })

  test('a change is counted in the bar and marked on its field, whose Reset puts the saved value back', async () => {
    const user = userEvent.setup()
    reduced(<SettingsForm />)
    const name = screen.getByRole('textbox', { name: 'Name' })
    await user.clear(name)
    await user.type(name, 'Northwind Labs')
    expect(bar()).toHaveAttribute('data-state', 'dirty')
    expect(status()).toHaveTextContent('1 unsaved change')
    expect(name.closest('[data-slot=setting]')).toHaveAttribute('data-yj-changed')
    await user.click(screen.getByRole('switch', { name: 'Require two-factor authentication' }))
    expect(status()).toHaveTextContent('2 unsaved changes')

    await user.click(screen.getByRole('button', { name: 'Reset Name to “Northwind”' }))
    expect(name).toHaveValue('Northwind')
    expect(status()).toHaveTextContent('1 unsaved change')
    await waitFor(() => expect(name).toHaveFocus())
  })

  test('a field checks itself when you leave it, and Save focuses the first problem without saving', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    reduced(<SettingsForm onSave={onSave} />)
    const name = screen.getByRole('textbox', { name: 'Name' })
    await user.clear(name)
    await user.tab()
    expect(await screen.findByText('Name can’t be empty.')).toBeInTheDocument()
    expect(name).toHaveAttribute('aria-invalid', 'true')
    await user.type(screen.getByRole('textbox', { name: 'Description' }), ' And more.')
    await user.click(save())
    await waitFor(() => expect(name).toHaveFocus())
    expect(onSave).not.toHaveBeenCalled()
  })

  test('the counter says how many characters are left near the limit, and too many is refused', async () => {
    const user = userEvent.setup()
    reduced(<SettingsForm />)
    const name = screen.getByRole('textbox', { name: 'Name' })
    await user.type(name, ' Labs and Workshop Inc.')
    expect(screen.getByText('32/32')).toBeInTheDocument()
    expect(screen.getByText('0 characters left')).toBeInTheDocument()
    await user.type(name, '!')
    await user.tab()
    expect(await screen.findByText('Use 32 characters or fewer.')).toBeInTheDocument()
  })

  test('Save sends every setting with the names that changed, then the foot says it’s saved', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const onValueChange = vi.fn()
    reduced(<SettingsForm onSave={onSave} onValueChange={onValueChange} />)
    await user.click(screen.getByRole('radio', { name: /Private/ }))
    await user.click(save())
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
    const [values, changed] = onSave.mock.calls[0]!
    expect(changed).toEqual(['visibility'])
    expect(values).toMatchObject({ name: 'Northwind', visibility: 'private', domains: ['northwind.com'] })
    await waitFor(() => expect(bar()).toHaveAttribute('data-state', 'idle'))
    expect(onValueChange).toHaveBeenCalledWith(values)
    expect(screen.getByText('Your changes are saved.')).toBeInTheDocument()
    // What was saved is the new baseline: nothing is marked as changed.
    expect(document.querySelector('[data-yj-changed]')).toBeNull()
  })

  test('⌘S saves from the form', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    reduced(<SettingsForm onSave={onSave} />)
    await user.click(screen.getByRole('switch', { name: 'Require two-factor authentication' }))
    await user.keyboard('{Meta>}s{/Meta}')
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ twoFactor: true }), ['twoFactor']))
  })

  test('field errors from the server go under their fields and the bar says why', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockRejectedValue({ fields: { name: 'That name is reserved.' }, message: 'One setting needs another look.' })
    reduced(<SettingsForm onSave={onSave} />)
    const name = screen.getByRole('textbox', { name: 'Name' })
    await user.type(name, ' HQ')
    await user.click(save())
    expect(await screen.findByText('That name is reserved.')).toBeInTheDocument()
    expect(await screen.findAllByText('One setting needs another look.')).not.toHaveLength(0)
    await waitFor(() => expect(name).toHaveFocus())
    // What was typed is kept.
    expect(name).toHaveValue('Northwind HQ')
  })

  test('Discard puts the saved values back and offers Undo, which brings the changes back', async () => {
    const user = userEvent.setup()
    reduced(<SettingsForm />)
    const name = screen.getByRole('textbox', { name: 'Name' })
    await user.type(name, ' HQ')
    await user.click(screen.getByRole('switch', { name: 'Require two-factor authentication' }))
    await user.click(screen.getByRole('button', { name: 'Discard' }))
    expect(name).toHaveValue('Northwind')
    expect(bar()).toHaveAttribute('data-state', 'discarded')
    expect(status()).toHaveTextContent('Discarded 2 changes')
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(name).toHaveValue('Northwind HQ')
    expect(screen.getByRole('switch', { name: 'Require two-factor authentication' })).toBeChecked()
    expect(status()).toHaveTextContent('2 unsaved changes')
  })

  test('with changes unsaved, a link elsewhere is held until they are saved or discarded, then followed', async () => {
    const user = userEvent.setup()
    const followed = vi.fn((event: React.MouseEvent) => event.preventDefault())
    const onDirtyChange = vi.fn()
    reduced(
      <>
        <a href="/settings/members" onClick={followed}>
          Members
        </a>
        <SettingsForm onDirtyChange={onDirtyChange} />
      </>,
    )
    await user.type(screen.getByRole('textbox', { name: 'Name' }), ' HQ')
    expect(onDirtyChange).toHaveBeenLastCalledWith(true)
    await user.click(screen.getByRole('link', { name: 'Members' }))
    expect(followed).not.toHaveBeenCalled()
    expect(bar()).toHaveAttribute('data-state', 'nudge')
    expect(status()).toHaveTextContent('Save or discard your changes first')
    expect(within(bar()).getByRole('button', { name: 'Discard and continue' })).toBeInTheDocument()

    await user.click(within(bar()).getByRole('button', { name: 'Discard and continue' }))
    await waitFor(() => expect(followed).toHaveBeenCalledTimes(1))
    expect(onDirtyChange).toHaveBeenLastCalledWith(false)
  })

  test('Escape on the bar stays: the held link is forgotten', async () => {
    const user = userEvent.setup()
    const followed = vi.fn((event: React.MouseEvent) => event.preventDefault())
    reduced(
      <>
        <a href="/settings/billing" onClick={followed}>
          Billing
        </a>
        <SettingsForm />
      </>,
    )
    await user.type(screen.getByRole('textbox', { name: 'Name' }), ' HQ')
    await user.click(screen.getByRole('link', { name: 'Billing' }))
    within(bar()).getByRole('button', { name: 'Discard and continue' }).focus()
    await user.keyboard('{Escape}')
    expect(bar()).toHaveAttribute('data-state', 'dirty')
    await user.click(within(bar()).getByRole('button', { name: 'Discard' }))
    // youj-allow: sleep — proving a link is not followed has no condition to wait for, only time to give it.
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)))
    expect(followed).not.toHaveBeenCalled()
  })

  test('a changed value with a check is asked about once typing pauses; a refusal shows under it and blocks the save', async () => {
    const user = userEvent.setup()
    const check = vi.fn(async (value: string) => (value === 'taken' ? 'That handle is taken.' : true as const))
    const onSave = vi.fn()
    const groups: SettingsGroup[] = [{ id: 'profile', title: 'Profile', fields: [{ type: 'text', name: 'handle', label: 'Handle', prefix: '@', check }] }]
    reduced(<SettingsForm groups={groups} defaultValue={{ handle: 'ada' }} onSave={onSave} />)
    const handle = screen.getByRole('textbox', { name: 'Handle' })
    await user.clear(handle)
    await user.type(handle, 'taken')
    expect(await screen.findByText('That handle is taken.', {}, { timeout: 2000 })).toBeInTheDocument()
    expect(check).toHaveBeenCalledWith('taken')
    await user.click(save())
    await waitFor(() => expect(handle).toHaveFocus())
    expect(onSave).not.toHaveBeenCalled()

    await user.clear(handle)
    await user.type(handle, 'ada-l')
    expect(await screen.findByText('Available', {}, { timeout: 2000 })).toBeInTheDocument()
    await user.click(save())
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ handle: 'ada-l' }, ['handle']))
  })

  test('your groups, values and copy replace the demo', () => {
    const groups: SettingsGroup[] = [
      { id: 'email', title: 'Email', description: 'What reaches your inbox.', fields: [{ type: 'switch', name: 'digest', label: 'Weekly digest' }] },
    ]
    reduced(<SettingsForm groups={groups} defaultValue={{ digest: true }} copy={{ title: 'Notifications', footer: 'Only for you.' }} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Notifications' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Email' })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Weekly digest' })).toBeChecked()
    expect(screen.getByText('Only for you.')).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Name' })).toBeNull()
  })

  test('a new saved value from the app updates the fields you haven’t touched', async () => {
    const user = userEvent.setup()
    const { rerender } = reduced(<SettingsForm value={{ name: 'Northwind', url: 'northwind', about: '', visibility: 'workspace', timezone: 'Europe/Berlin', weekStart: 'monday', twoFactor: false, domains: [], session: '30d' }} />)
    await user.type(screen.getByRole('textbox', { name: 'Description' }), 'Mine')
    rerender(
      <YoujProvider reducedMotion="always">
        <SettingsForm value={{ name: 'Northwind Co', url: 'northwind', about: '', visibility: 'workspace', timezone: 'Europe/Berlin', weekStart: 'monday', twoFactor: false, domains: [], session: '30d' }} />
      </YoujProvider>,
    )
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Northwind Co'))
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue('Mine')
  })

  test('a clinic’s hours, reminders and intake settings come from props, and a change saves under its own field name', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const groups: SettingsGroup[] = [
      {
        id: 'reminders',
        title: 'Appointment reminders',
        fields: [
          { type: 'switch', name: 'textReminders', label: 'Text message reminders' },
          { type: 'segmented', name: 'remindAhead', label: 'Send the reminder', options: [{ value: '24h', label: '1 day before' }, { value: '48h', label: '2 days before' }] },
        ],
      },
      { id: 'hours', title: 'Hours', fields: [{ type: 'select', name: 'opens', label: 'Opens', options: [{ value: '8:00 AM', label: '8:00 AM' }, { value: '9:00 AM', label: '9:00 AM' }] }] },
      { id: 'intake', title: 'Intake forms', fields: [{ type: 'tags', name: 'forms', label: 'Forms to send', max: 3 }] },
    ]
    reduced(
      <SettingsForm
        groups={groups}
        defaultValue={{ textReminders: true, remindAhead: '48h', opens: '8:00 AM', forms: ['Health history'] }}
        copy={{ title: 'Clinic preferences' }}
        onSave={onSave}
      />,
    )
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Appointment reminders', 'Hours', 'Intake forms'])
    expect(screen.getByRole('switch', { name: 'Text message reminders' })).toBeChecked()
    expect(screen.getByText('2 days before').closest('button')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Health history')).toBeInTheDocument()
    await user.click(screen.getByText('1 day before'))
    await user.click(save())
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({ textReminders: true, remindAhead: '24h', opens: '8:00 AM', forms: ['Health history'] }, ['remindAhead']),
    )
  })
})
