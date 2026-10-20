import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { de } from '@youj/core/locales/de'
import { ShareDialog, type ShareDialogProps, type SharePerson, type ShareSuggestion } from './share-dialog'

const people: SharePerson[] = [
  { id: 'ada', name: 'Ada Lovelace', email: 'ada@acme.com', role: 'editor', owner: true },
  { id: 'grace', name: 'Grace Hopper', email: 'grace@acme.com', role: 'commenter' },
  { id: 'alan', name: 'Alan Turing', email: 'alan@acme.com', role: 'viewer', pending: true },
]
const suggestions: ShareSuggestion[] = [
  { id: 'grace', name: 'Grace Hopper', email: 'grace@acme.com' },
  { id: 'katherine', name: 'Katherine Johnson', email: 'katherine@acme.com' },
  { id: 'design', name: 'Design team', members: 12 },
]

function renderShare(props: Partial<ShareDialogProps> = {}) {
  return render(
    <YoujProvider reducedMotion="always">
      <ShareDialog open resource="Q3 roadmap" link="https://acme.test/doc/q3" people={people} suggestions={suggestions} {...props} />
    </YoujProvider>,
  )
}

const dialog = () => screen.getByRole('dialog', { name: 'Share “Q3 roadmap”' })
const field = () => screen.getByRole('combobox', { name: 'Add people, groups or emails' })
const polite = () => within(dialog()).getAllByRole('status').map((el) => el.textContent).join(' ')

describe('ShareDialog', () => {
  test('opens named after the resource with focus in the invite field', async () => {
    renderShare()
    expect(await screen.findByRole('dialog', { name: 'Share “Q3 roadmap”' })).toBeInTheDocument()
    await waitFor(() => expect(field()).toHaveFocus())
  })

  test('typed addresses become chips and one Send hands them over with the role and message', async () => {
    const user = userEvent.setup()
    const onInvite = vi.fn()
    renderShare({ onInvite })
    await user.type(field(), 'new@acme.com{Enter}other@acme.com,')
    expect(screen.getByRole('button', { name: 'Remove new@acme.com' })).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'Add a message (optional)' }), 'Take a look')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(onInvite).toHaveBeenCalledTimes(1))
    expect(onInvite).toHaveBeenCalledWith({
      recipients: [
        { name: 'new@acme.com', email: 'new@acme.com' },
        { name: 'other@acme.com', email: 'other@acme.com' },
      ],
      role: 'viewer',
      message: 'Take a look',
    })
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Remove new@acme.com' })).not.toBeInTheDocument())
    expect(polite()).toContain('Invitations sent: 2')
  })

  test('an address that is not one stays flagged and blocks Send until it is removed', async () => {
    const user = userEvent.setup()
    const onInvite = vi.fn()
    renderShare({ onInvite })
    await user.type(field(), 'not-an-email{Enter}')
    expect(screen.getAllByRole('alert').find((el) => el.textContent)).toHaveTextContent('not-an-email isn’t a valid email address')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(onInvite).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Remove not-an-email' }))
    expect(screen.queryByText(/isn’t a valid email/)).not.toBeInTheDocument()
  })

  test('someone who already has access is flagged by name', async () => {
    const user = userEvent.setup()
    renderShare()
    await user.type(field(), 'grace@acme.com{Enter}')
    expect(screen.getAllByRole('alert').find((el) => el.textContent)).toHaveTextContent('Grace Hopper already has access')
  })

  test('suggestions are a combobox: arrows and Enter pick, people with access are left out, groups say their size', async () => {
    const user = userEvent.setup()
    renderShare()
    await user.click(field())
    const options = within(screen.getByRole('listbox', { name: 'Suggestions' })).getAllByRole('option')
    expect(options.map((o) => o.textContent)).toEqual(['KJKatherine Johnsonkatherine@acme.com', 'DTDesign teamGroup of 12'])
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    expect(screen.getByRole('button', { name: 'Remove Design team' })).toBeInTheDocument()
    expect(field()).toHaveFocus()
  })

  test('Escape closes the suggestions before it closes the dialog; Backspace takes the last chip back', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderShare({ onOpenChange })
    await user.type(field(), 'a@b.co{Enter}')
    await user.keyboard('{Escape}')
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    await user.keyboard('{Backspace}')
    expect(screen.queryByRole('button', { name: 'Remove a@b.co' })).not.toBeInTheDocument()
    expect(polite()).toContain('a@b.co removed')
    await user.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  })

  test('a failed send keeps the chips and says why', async () => {
    const user = userEvent.setup()
    renderShare({ onInvite: () => Promise.reject(new Error('You can only invite 5 people.')) })
    await user.type(field(), 'new@acme.com{Enter}')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByText('You can only invite 5 people.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove new@acme.com' })).toBeInTheDocument()
    expect(dialog()).toBeInTheDocument()
  })

  test('the owner is fixed and a pending invitation is marked with resend and cancel', async () => {
    const user = userEvent.setup()
    const onResend = vi.fn()
    const onCancelInvite = vi.fn()
    renderShare({ onResend, onCancelInvite })
    const list = screen.getByRole('list', { name: 'People with access' })
    const [owner, , pending] = within(list).getAllByRole('listitem')
    expect(within(owner!).getByText('Owner')).toBeInTheDocument()
    expect(within(owner!).queryByRole('button')).not.toBeInTheDocument()
    expect(within(pending!).getByText('Pending')).toBeInTheDocument()
    await user.click(within(pending!).getByRole('button', { name: 'Resend invitation to Alan Turing' }))
    await waitFor(() => expect(onResend).toHaveBeenCalledWith(people[2]))
    await user.click(within(pending!).getByRole('button', { name: 'Cancel invitation for Alan Turing' }))
    expect(onCancelInvite).toHaveBeenCalledWith(people[2])
  })

  test('removing access is awaited, announced, and a failure stays on its row', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('Only admins can remove people.'))
    renderShare({ onRemove })
    await user.click(screen.getByRole('button', { name: 'Remove access for Grace Hopper' }))
    await waitFor(() => expect(polite()).toContain('Grace Hopper removed'))
    await user.click(screen.getByRole('button', { name: 'Remove access for Grace Hopper' }))
    const row = (await screen.findByText('Only admins can remove people.')).closest('li')!
    expect(row).toHaveTextContent('Grace Hopper')
    expect(dialog()).toBeInTheDocument()
  })

  test('a person’s role changes through their select and is announced', async () => {
    const user = userEvent.setup()
    const onRoleChange = vi.fn()
    renderShare({ onRoleChange })
    await user.click(screen.getByRole('combobox', { name: 'Role for Grace Hopper' }))
    await user.click(await screen.findByRole('option', { name: 'Editor' }))
    await waitFor(() => expect(onRoleChange).toHaveBeenCalledWith(people[1], 'editor'))
    expect(polite()).toContain('Grace Hopper is now Editor')
  })

  test('read-only: no invite field, no role selects or remove, but the link can still be copied', async () => {
    renderShare({ readOnly: true })
    expect(screen.queryByRole('combobox', { name: 'Add people, groups or emails' })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: /Role for/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Remove access/ })).not.toBeInTheDocument()
    expect(screen.getByText('Commenter')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument()
  })

  test('general access offers the organization, applies on success and keeps the old value on failure', async () => {
    const user = userEvent.setup()
    const onAccessChange = vi.fn().mockRejectedValueOnce(new Error('Your admin turned off public links.')).mockResolvedValueOnce(undefined)
    renderShare({ organization: 'Acme', onAccessChange })
    const select = () => screen.getByRole('combobox', { name: 'General access' })
    expect(select()).toHaveTextContent('Restricted')
    await user.click(select())
    expect((await screen.findAllByRole('option')).map((o) => o.textContent)).toEqual(['Restricted', 'Anyone at Acme', 'Anyone with the link'])
    await user.click(await screen.findByRole('option', { name: 'Anyone with the link' }))
    expect(await screen.findByText('Your admin turned off public links.')).toBeInTheDocument()
    expect(select()).toHaveTextContent('Restricted')
    await user.click(select())
    await user.click(await screen.findByRole('option', { name: 'Anyone at Acme' }))
    await waitFor(() => expect(select()).toHaveTextContent('Anyone at Acme'))
    expect(onAccessChange).toHaveBeenLastCalledWith({ scope: 'organization', role: 'viewer' })
    expect(screen.getByRole('combobox', { name: 'Role for people with the link' })).toBeInTheDocument()
    expect(polite()).toContain('General access: Anyone at Acme, Viewer')
  })

  test('Copy link puts the link on the clipboard and confirms it', async () => {
    const user = userEvent.setup()
    const onCopyLink = vi.fn()
    renderShare({ onCopyLink })
    await user.click(screen.getByRole('button', { name: 'Copy link' }))
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument()
    expect(await navigator.clipboard.readText()).toBe('https://acme.test/doc/q3')
    expect(onCopyLink).toHaveBeenCalled()
    expect(polite()).toContain('Link copied')
  })

  test('a preview shows the thing being shared above the invite field', () => {
    renderShare({ preview: { title: 'Q3 roadmap.pdf', description: 'Updated 2 days ago' } })
    const card = dialog().querySelector('[data-slot=share-dialog-preview]')!
    expect(card).toHaveTextContent('Q3 roadmap.pdf')
    expect(card).toHaveTextContent('Updated 2 days ago')
    expect(card.compareDocumentPosition(dialog().querySelector('[data-slot=share-dialog-invite]')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  test('switches layout: the invite role sits on the invited row and a link row opens and closes with its switch', async () => {
    const user = userEvent.setup()
    const onInvite = vi.fn()
    const onAccessChange = vi.fn()
    renderShare({ accessLayout: 'switches', organization: 'Acme', onInvite, onAccessChange })
    expect(screen.queryByRole('textbox', { name: 'Add a message (optional)' })).not.toBeInTheDocument()
    expect(screen.getByText('2 people have access')).toBeInTheDocument()
    const invited = screen.getByRole('switch', { name: 'Only people invited' })
    expect(invited).toBeChecked()
    expect(screen.getByRole('combobox', { name: 'Role' })).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Role for people with the link' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('switch', { name: 'Anyone with the link' }))
    await waitFor(() => expect(onAccessChange).toHaveBeenLastCalledWith({ scope: 'anyone', role: 'viewer' }))
    expect(await screen.findByRole('combobox', { name: 'Role for people with the link' })).toBeInTheDocument()
    expect(invited).not.toBeChecked()
    expect(screen.getByRole('switch', { name: 'Anyone at Acme' })).not.toBeChecked()

    await user.click(screen.getByRole('switch', { name: 'Anyone with the link' }))
    await waitFor(() => expect(onAccessChange).toHaveBeenLastCalledWith({ scope: 'restricted', role: 'viewer' }))
    await waitFor(() => expect(invited).toBeChecked())

    await user.type(field(), 'new@acme.com{Enter}')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(onInvite).toHaveBeenCalledWith({ recipients: [{ name: 'new@acme.com', email: 'new@acme.com' }], role: 'viewer', message: undefined }))
  })

  test('a switch flips before its handler resolves, and goes back with the reason if it rejects', async () => {
    const user = userEvent.setup()
    let reject: (error: Error) => void = () => {}
    const onAccessChange = vi.fn(() => new Promise<void>((_, fail) => (reject = fail)))
    renderShare({ accessLayout: 'switches', onAccessChange })
    await user.click(screen.getByRole('switch', { name: 'Anyone with the link' }))
    expect(screen.getByRole('switch', { name: 'Anyone with the link' })).toBeChecked()
    expect(screen.getByRole('switch', { name: 'Only people invited' })).not.toBeChecked()
    reject(new Error('Links are off.'))
    expect(await screen.findByText('Links are off.')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Anyone with the link' })).not.toBeChecked()
  })

  test('switches layout: the invited-only row stays on until another row is turned on', async () => {
    const user = userEvent.setup()
    const onAccessChange = vi.fn()
    renderShare({ accessLayout: 'switches', onAccessChange })
    await user.click(screen.getByRole('switch', { name: 'Only people invited' }))
    expect(onAccessChange).not.toHaveBeenCalled()
    expect(screen.getByRole('switch', { name: 'Only people invited' })).toBeChecked()
  })

  test('while loading it shows a busy skeleton instead of people', () => {
    renderShare({ loading: true })
    expect(screen.queryByText('Grace Hopper')).not.toBeInTheDocument()
    expect(screen.getByText('Loading people…')).toBeInTheDocument()
    expect(dialog().querySelector('[aria-busy=true]')).toBeInTheDocument()
  })

  test('speaks the provider’s language', async () => {
    render(
      <YoujProvider reducedMotion="always" labels={de}>
        <ShareDialog open resource="Q3-Plan" link="x" people={people} />
      </YoujProvider>,
    )
    expect(await screen.findByRole('dialog', { name: '„Q3-Plan“ teilen' })).toBeInTheDocument()
    expect(screen.getByText('Personen mit Zugriff')).toBeInTheDocument()
  })
})
