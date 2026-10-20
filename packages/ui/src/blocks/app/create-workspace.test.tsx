import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { CreateWorkspace } from './create-workspace'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const free = async (slug: string) => slug !== 'acme'

async function fillFirstTwoSteps(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole('textbox', { name: /Workspace name/ }), 'Orbit Labs')
  expect(await screen.findByText('orbit-labs is available.')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Continue' }))
  await user.click(await screen.findByRole('combobox', { name: /Team size/ }))
  await user.click(await screen.findByRole('option', { name: '11–50 people' }))
  await user.click(screen.getByRole('combobox', { name: /What will you use it for/ }))
  await user.click(await screen.findByRole('option', { name: 'Design' }))
  await user.click(screen.getByRole('button', { name: 'Continue' }))
  await screen.findByRole('heading', { name: 'Invite your team' })
}

describe('Create workspace block', () => {
  test('a page with one main and h1, starting on the workspace step', () => {
    reduced(<CreateWorkspace checkSlug={free} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Create a workspace' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Workspace' })).toBeInTheDocument()
  })

  test('Continue with nothing filled stays on the step and says why', async () => {
    const user = userEvent.setup()
    reduced(<CreateWorkspace checkSlug={free} />)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByText('Give your workspace a name.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Workspace' })).toBeInTheDocument()
  })

  test('the slug follows the name, is checked live, and a taken one is refused', async () => {
    const user = userEvent.setup()
    reduced(<CreateWorkspace checkSlug={free} />)
    await user.type(screen.getByRole('textbox', { name: /Workspace name/ }), 'Acme')
    const url = screen.getByRole('textbox', { name: /Workspace URL/ })
    expect(url).toHaveValue('acme')
    expect(await screen.findByText('acme is taken. Try another.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByRole('heading', { name: 'Workspace' })).toBeInTheDocument()

    // Editing the slug by hand: it's cleaned as typed and stops following the name.
    await user.clear(url)
    await user.type(url, 'Acme HQ')
    expect(url).toHaveValue('acme-hq')
    expect(await screen.findByText('acme-hq is available.')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: /Workspace name/ }), ' Inc')
    expect(url).toHaveValue('acme-hq')
  })

  test('a malformed slug is flagged', async () => {
    const user = userEvent.setup()
    reduced(<CreateWorkspace checkSlug={free} />)
    await user.type(screen.getByRole('textbox', { name: /Workspace URL/ }), 'ab')
    expect(await screen.findByText(/Use 3–40 lowercase letters/)).toBeInTheDocument()
  })

  test('invites: bad emails are refused, good ones become chips, and sending lands on done', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    reduced(<CreateWorkspace checkSlug={free} onCreate={onCreate} />)
    await fillFirstTwoSteps(user)

    await user.click(screen.getByRole('button', { name: 'Send invites' }))
    expect(await screen.findByText('Add at least one email, or skip for now.')).toBeInTheDocument()

    const emails = screen.getByRole('textbox', { name: /Email addresses/ })
    await user.type(emails, 'not-an-email{Enter}')
    expect(await screen.findByText('“not-an-email” isn’t an email address.')).toBeInTheDocument()
    await user.clear(emails)
    await user.type(emails, 'mara@orbit.dev,theo@orbit.dev,')
    await user.click(await screen.findByRole('button', { name: 'Send 2 invites' }))

    expect(await screen.findByRole('heading', { name: 'Orbit Labs is ready' })).toBeInTheDocument()
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Orbit Labs', slug: 'orbit-labs', teamSize: '11-50', useCase: 'design', invites: ['mara@orbit.dev', 'theo@orbit.dev'], role: 'member' }))
  })

  test('Skip for now finishes without invites', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    reduced(<CreateWorkspace checkSlug={free} onCreate={onCreate} />)
    await fillFirstTwoSteps(user)
    await user.click(screen.getByRole('button', { name: 'Skip for now' }))
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ invites: [] })))
    expect(await screen.findByText(/You can invite people from Settings any time/)).toBeInTheDocument()
  })

  test('every string comes through copy', () => {
    reduced(<CreateWorkspace checkSlug={free} copy={{ title: 'Neuen Workspace anlegen', next: 'Weiter' }} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Neuen Workspace anlegen' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeInTheDocument()
  })
})
