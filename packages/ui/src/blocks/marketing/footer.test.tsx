import { forwardRef, type ComponentProps } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { MarketingFooter, type FooterLinkColumn } from './footer'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

const columns: FooterLinkColumn[] = [
  { title: 'Shop', links: [{ label: 'Beans', href: '/beans' }] },
  { title: 'Help', links: [{ label: 'Shipping', href: '/shipping' }] },
]

describe('Footer', () => {
  test('renders the brand, columns and legal line it is given', () => {
    reduced(<MarketingFooter brand={{ name: 'Fernhill', href: '/' }} columns={columns} social={[]} copy={{ legal: '© Fernhill', status: '', navLabel: 'Sitemap' }} />)
    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByRole('link', { name: 'Fernhill' })).toHaveAttribute('href', '/')
    const nav = within(footer).getByRole('navigation', { name: 'Sitemap' })
    expect(within(nav).getAllByRole('heading').map((h) => h.textContent)).toEqual(['Shop', 'Help'])
    expect(within(nav).getByRole('link', { name: 'Shipping' })).toHaveAttribute('href', '/shipping')
    expect(within(footer).getByText('© Fernhill')).toBeInTheDocument()
    expect(within(footer).queryByRole('link', { name: 'All systems normal' })).not.toBeInTheDocument()
    expect(within(footer).queryByRole('link', { name: 'GitHub' })).not.toBeInTheDocument()
  })

  test('onSubscribe receives the email; a rejection shows its message', async () => {
    const user = userEvent.setup()
    const onSubscribe = vi.fn().mockRejectedValue(new Error('That list is full.'))
    reduced(<MarketingFooter onSubscribe={onSubscribe} copy={{ subscribe: 'Join' }} />)
    await user.type(screen.getByRole('textbox'), 'ana@fernhill.coffee')
    await user.click(screen.getByRole('button', { name: 'Join' }))
    expect(onSubscribe).toHaveBeenCalledWith('ana@fernhill.coffee')
    await waitFor(() => expect(screen.getByText('That list is full.')).toBeInTheDocument())
  })

  test('newsletter={false} hides the sign-up', () => {
    reduced(<MarketingFooter newsletter={false} />)
    expect(screen.queryByRole('form', { name: 'Newsletter' })).not.toBeInTheDocument()
  })

  test('linkComponent renders internal links; extra props reach the root', () => {
    const Link = forwardRef<HTMLAnchorElement, ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    reduced(<MarketingFooter linkComponent={Link} columns={columns} id="site-footer" />)
    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveAttribute('id', 'site-footer')
    expect(within(footer).getByRole('link', { name: 'Beans' })).toHaveAttribute('data-router')
    expect(within(footer).getByRole('link', { name: 'Northwind' })).toHaveAttribute('data-router')
  })
  test('the demo is a sitemap: four columns with tagged links, trust badges, legal links, a language switch and a status pill', () => {
    reduced(<MarketingFooter />)
    const footer = screen.getByRole('contentinfo')
    const nav = within(footer).getByRole('navigation', { name: 'Footer' })
    expect(within(nav).getAllByRole('heading').map((h) => h.textContent)).toEqual(['Product', 'Solutions', 'Developers', 'Company'])
    expect(within(nav).getByRole('link', { name: /Careers/ })).toHaveTextContent('Hiring')
    expect(within(footer).getByText('The platform for teams who ship every day.')).toBeInTheDocument()
    expect(within(within(footer).getByRole('list', { name: 'Security and compliance' })).getAllByRole('link').map((a) => a.textContent)).toEqual(['SOC 2 Type II', 'ISO 27001', 'GDPR'])
    expect(within(within(footer).getByRole('list', { name: 'Legal' })).getAllByRole('link').map((a) => a.textContent)).toEqual(['Privacy', 'Terms', 'Security', 'Accessibility'])
    expect(within(footer).getByRole('link', { name: 'All systems normal' })).toHaveAttribute('href', '#status')
    expect(within(footer).getByRole('combobox', { name: 'Language' })).toHaveValue('en')
  })

  test('the language switch is a named select that reports the choice, or is controlled', async () => {
    const user = userEvent.setup()
    const onLanguageChange = vi.fn()
    reduced(<MarketingFooter onLanguageChange={onLanguageChange} />)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'de')
    expect(onLanguageChange).toHaveBeenCalledWith('de')
    expect(screen.getByRole('combobox', { name: 'Language' })).toHaveValue('de')
    expect(screen.getByRole('option', { name: 'Deutsch' })).toHaveAttribute('lang', 'de')
  })

  test('a controlled language and fewer than two languages', () => {
    const { unmount } = reduced(<MarketingFooter language="fr" />)
    expect(screen.getByRole('combobox', { name: 'Language' })).toHaveValue('fr')
    unmount()
    reduced(<MarketingFooter languages={[{ id: 'en', label: 'English' }]} />)
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  test('the status pill follows the state: its words, and an empty text hides it', () => {
    const { unmount } = reduced(<MarketingFooter statusState="degraded" />)
    expect(screen.getByRole('link', { name: 'Some systems degraded' })).toBeInTheDocument()
    unmount()
    reduced(<MarketingFooter statusState="outage" copy={{ statusOutage: 'Outage in US-East' }} />)
    expect(screen.getByRole('link', { name: 'Outage in US-East' })).toBeInTheDocument()
  })

  test('Cookie settings shows only when wired, and calls it', async () => {
    const user = userEvent.setup()
    const onCookieSettings = vi.fn()
    const { unmount } = reduced(<MarketingFooter />)
    expect(screen.queryByRole('button', { name: 'Cookie settings' })).not.toBeInTheDocument()
    unmount()
    reduced(<MarketingFooter onCookieSettings={onCookieSettings} />)
    await user.click(screen.getByRole('button', { name: 'Cookie settings' }))
    expect(onCookieSettings).toHaveBeenCalledTimes(1)
  })

  test('badges and legal links can be left out; controls render at the end of the bottom bar', () => {
    reduced(<MarketingFooter badges={[]} legalLinks={[]} controls={<button type="button">Theme</button>} />)
    expect(screen.queryByRole('list', { name: 'Security and compliance' })).not.toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Legal' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Theme' })).toBeInTheDocument()
  })

  test('a successful subscription says so politely and clears the field', async () => {
    const user = userEvent.setup()
    const onSubscribe = vi.fn().mockResolvedValue(undefined)
    reduced(<MarketingFooter onSubscribe={onSubscribe} />)
    await user.type(screen.getByRole('textbox'), 'ana@fernhill.coffee')
    await user.click(screen.getByRole('button', { name: 'Subscribe' }))
    await waitFor(() => expect(screen.getAllByText('Thanks. Check your inbox to confirm.').length).toBeGreaterThan(0))
    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  test('a bad email is explained under the field and not sent; typing clears it', async () => {
    const user = userEvent.setup()
    const onSubscribe = vi.fn()
    reduced(<MarketingFooter onSubscribe={onSubscribe} />)
    await user.type(screen.getByRole('textbox'), 'nope')
    await user.click(screen.getByRole('button', { name: 'Subscribe' }))
    expect(await screen.findByText('Enter an email like you@company.com.')).toBeInTheDocument()
    expect(onSubscribe).not.toHaveBeenCalled()
    await user.type(screen.getByRole('textbox'), 'x')
    expect(screen.queryByText('Enter an email like you@company.com.')).not.toBeInTheDocument()
  })
})
