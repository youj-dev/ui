import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { NotificationPreferences } from '../settings'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('notification preferences', () => {
  test('is a named region with the master, what, reminders and channels, and Save waits for a change', () => {
    reduced(<NotificationPreferences />)
    const card = screen.getByRole('region', { name: 'Notifications' })
    expect(within(card).getByRole('button', { name: 'On' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(card).getByRole('radio', { name: /Mentions and replies/ })).toBeChecked()
    expect(within(card).getByRole('checkbox', { name: /Due tomorrow/ })).toBeChecked()
    expect(within(card).getByRole('checkbox', { name: /Email/ })).toBeChecked()
    expect(within(card).getByRole('checkbox', { name: /Push/ })).not.toBeChecked()
    expect(within(card).getByRole('button', { name: 'Save changes' })).toBeDisabled()
  })

  test('changes are reported as a draft and saved together through onSave', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const onSave = vi.fn()
    reduced(<NotificationPreferences onValueChange={onValueChange} onSave={onSave} />)
    await user.click(screen.getByRole('radio', { name: /Assigned to me/ }))
    await user.click(screen.getByRole('checkbox', { name: /Overdue/ }))
    await user.click(screen.getByRole('checkbox', { name: /Push/ }))
    const draft = { enabled: true, what: 'assigned', reminders: ['due', 'overdue'], channels: ['email', 'inapp', 'push'] }
    expect(onValueChange).toHaveBeenLastCalledWith(draft)
    expect(onSave).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(onSave).toHaveBeenCalledWith(draft)
    await waitFor(() => expect(screen.getByRole('button', { name: /Saved/ })).toBeInTheDocument())
  })

  test('turning the master off mutes and disables everything under it', async () => {
    const user = userEvent.setup()
    reduced(<NotificationPreferences />)
    await user.click(screen.getByRole('button', { name: 'Off' }))
    expect(screen.getByRole('radio', { name: /Everything/ })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('checkbox', { name: /Due tomorrow/ })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('checkbox', { name: /Email/ })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByText(/Everything is muted/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled()
  })

  test('a failed save says why and keeps the draft', async () => {
    const user = userEvent.setup()
    reduced(<NotificationPreferences onSave={() => Promise.reject(new Error('Your session expired.'))} />)
    await user.click(screen.getByRole('checkbox', { name: /Push/ }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('Your session expired.')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Push/ })).toBeChecked()
  })

  test('your choices, value and copy drive the card; className and rest reach the root', () => {
    reduced(
      <NotificationPreferences
        className="custom-root"
        data-testid="prefs"
        value={{ enabled: true, what: 'urgent', reminders: [], channels: ['sms'] }}
        what={[
          { id: 'all', label: 'Every update' },
          { id: 'urgent', label: 'Urgent only' },
        ]}
        reminders={[{ id: 'refills', label: 'Prescription refills' }]}
        channels={[{ id: 'sms', label: 'Text message' }]}
        copy={{ title: 'Alerts', save: 'Save alerts' }}
      />,
    )
    expect(screen.getByTestId('prefs')).toHaveClass('custom-root')
    expect(screen.getByRole('region', { name: 'Alerts' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Urgent only' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Prescription refills' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Text message/ })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Save alerts' })).toBeInTheDocument()
  })
})
