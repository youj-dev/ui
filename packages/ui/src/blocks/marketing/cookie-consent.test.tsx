import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { CookieConsent } from './cookie-consent'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('cookie consent block', () => {
  test('the card names itself, and accepting hands over to the corner button', async () => {
    const user = userEvent.setup()
    reduced(<CookieConsent />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    const card = screen.getByRole('region', { name: 'A few cookies, if that’s all right' })
    expect(card).not.toHaveAttribute('inert')
    expect(screen.getByRole('button', { name: 'Cookie preferences' })).toHaveAttribute('inert')

    await user.click(within(card).getByRole('button', { name: 'Accept all' }))
    expect(await screen.findByText('All cookies are on.')).toBeInTheDocument()
    await waitFor(() => expect(card).toHaveAttribute('inert'))
    expect(screen.getByRole('button', { name: 'Cookie preferences' })).not.toHaveAttribute('inert')
  })

  test('preferences: necessary is locked, categories toggle, and cookie details disclose', async () => {
    const user = userEvent.setup()
    reduced(<CookieConsent defaultOpen="preferences" />)
    const dialog = await screen.findByRole('dialog', { name: 'Cookie preferences' })
    const switches = within(dialog).getAllByRole('switch')
    expect(switches).toHaveLength(4)
    expect(switches[0]).toBeChecked()
    expect(switches[0]).toHaveAttribute('aria-disabled', 'true')
    expect(switches[1]).not.toBeChecked()
    await user.click(switches[1]!)
    expect(switches[1]).toBeChecked()

    const disclosure = within(dialog).getAllByRole('button', { name: 'Show 2 cookies' })[0]!
    await user.click(disclosure)
    expect(disclosure).toHaveAttribute('aria-expanded', 'true')
    expect(within(dialog).getByText('_pa_id')).toBeInTheDocument()
  })

  const categories = [
    { id: 'essential', title: 'Essential', description: 'Sign-in.', required: true, cookies: [{ name: 'tl_auth', purpose: 'Session', expires: 'Session' }] },
    { id: 'personal', title: 'Personalisation', description: 'Suggestions.', cookies: [] },
  ]

  test('categories, copy and children drive the block; onSave and onValueChange get the choices', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const onValueChange = vi.fn()
    reduced(
      <CookieConsent categories={categories} onSave={onSave} onValueChange={onValueChange} policyHref="/privacy" id="consent" copy={{ title: 'Cookies help us plan', policyLink: 'privacy notice' }}>
        <p>Tideline</p>
      </CookieConsent>,
    )
    expect(screen.getByText('Tideline')).toBeInTheDocument()
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(document.getElementById('consent')).toBeInTheDocument()
    const card = screen.getByRole('region', { name: 'Cookies help us plan' })
    expect(within(card).getByRole('link', { name: 'privacy notice' })).toHaveAttribute('href', '/privacy')
    await user.click(within(card).getByRole('button', { name: 'Reject all' }))
    expect(onSave).toHaveBeenCalledWith({ essential: true, personal: false })
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith({ essential: true, personal: false }))
  })

  test('a saved defaultValue skips the card; the preferences show it', async () => {
    const user = userEvent.setup()
    reduced(<CookieConsent categories={categories} defaultValue={{ essential: true, personal: true }} />)
    expect(screen.getByRole('region', { hidden: true })).toHaveAttribute('inert')
    await user.click(screen.getByRole('button', { name: 'Cookie preferences' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getAllByRole('switch').map((s) => (s as HTMLInputElement).getAttribute('aria-checked'))).toEqual(['true', 'true'])
  })

  test('a failed save keeps the card and shows the error’s message', async () => {
    const user = userEvent.setup()
    reduced(<CookieConsent onSave={() => Promise.reject(new Error('Storage is full'))} />)
    const card = screen.getByRole('region')
    await user.click(within(card).getByRole('button', { name: 'Accept all' }))
    expect(await within(card).findByText('Storage is full')).toHaveAttribute('role', 'alert')
    expect(card).not.toHaveAttribute('inert')
  })

  test('four newspaper categories with their own words: the required one is locked, the rest toggle', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    reduced(
      <CookieConsent
        defaultOpen="preferences"
        onSave={onSave}
        copy={{ dialogDescription: 'Choose which cookies The Cedar Herald may set.' }}
        categories={[
          { id: 'necessary', title: 'Necessary', description: 'Keep you signed in.', required: true, cookies: [{ name: 'ch_session', purpose: 'Sign-in', expires: 'Session' }] },
          { id: 'analytics', title: 'Analytics', description: 'Which stories are read.', cookies: [] },
          { id: 'ads', title: 'Personalized ads', description: 'Match ads to interests.', cookies: [] },
          { id: 'video', title: 'Embedded video', description: 'Videos inside articles.', cookies: [] },
        ]}
      />,
    )
    const dialog = await screen.findByRole('dialog', { name: 'Cookie preferences' })
    expect(within(dialog).getByText('Choose which cookies The Cedar Herald may set.')).toBeInTheDocument()
    const switches = within(dialog).getAllByRole('switch')
    expect(switches).toHaveLength(4)
    expect(switches[0]).toHaveAttribute('aria-disabled', 'true')
    await user.click(within(dialog).getByRole('switch', { name: /Personalized ads/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Save choices' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ necessary: true, analytics: false, ads: true, video: false }))
  })
})
