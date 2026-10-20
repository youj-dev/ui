import { forwardRef, type ComponentProps, type ReactNode } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { NavbarDocs, type NavbarDocsSection } from './navbar-docs'

const reduced = (ui: ReactNode, locale?: string) =>
  render(
    <YoujProvider reducedMotion="always" locale={locale}>
      {ui}
    </YoujProvider>,
  )

function phone(matches: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        matches: matches && query.includes('max-width'),
        media: query,
        onchange: null,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  )
}

afterEach(() => vi.restoreAllMocks())

const sections: NavbarDocsSection[] = [
  { id: 'handbook', label: 'Handbook', href: '/handbook', groups: [{ title: 'Roasting', pages: [{ label: 'Profiles', href: '/handbook/profiles', badge: 'New' }, { label: 'Storage', href: '/handbook/storage', pages: [{ label: 'Freezing', href: '/handbook/storage/freezing' }] }] }] },
  { id: 'api', label: 'API', href: '/api', groups: [{ title: 'Orders', pages: [{ label: 'Subscriptions', href: '/api/subscriptions' }] }] },
]

const tabs = () => screen.getByRole('navigation', { name: 'Sections' })

describe('NavbarDocs', () => {
  test('renders the brand, the section tabs with the current one marked, the links, the repository and the call to action', () => {
    reduced(<NavbarDocs sections={sections} section="api" brand={{ name: 'Fernhill', href: '/' }} cta={{ label: 'Sign in', href: '/login' }} repository={{ href: 'https://github.com/fernhill', stars: 2400 }} />, 'en-US')
    const banner = screen.getByRole('banner')
    expect(within(banner).getByRole('link', { name: /Fernhill/ })).toHaveAttribute('href', '/')
    expect(within(tabs()).getByRole('link', { name: 'API' })).toHaveAttribute('aria-current', 'page')
    expect(within(tabs()).getByRole('link', { name: 'Handbook' })).not.toHaveAttribute('aria-current')
    expect(within(banner).getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '#blog')
    expect(within(banner).getAllByRole('link', { name: 'GitHub, 2.4K stars' })[0]).toHaveAttribute('href', 'https://github.com/fernhill')
    expect(within(banner).getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login')
  })

  test('following a section tab moves the mark and reports it', async () => {
    const user = userEvent.setup()
    const onSectionChange = vi.fn()
    reduced(<NavbarDocs sections={sections} onSectionChange={onSectionChange} />)
    expect(within(tabs()).getByRole('link', { name: 'Handbook' })).toHaveAttribute('aria-current', 'page')
    await user.click(within(tabs()).getByRole('link', { name: 'API' }))
    expect(onSectionChange).toHaveBeenCalledWith('api')
    expect(within(tabs()).getByRole('link', { name: 'API' })).toHaveAttribute('aria-current', 'page')
  })

  test('the version menu checks the latest, reports a choice and links archived versions', async () => {
    const user = userEvent.setup()
    const onVersionChange = vi.fn()
    reduced(<NavbarDocs onVersionChange={onVersionChange} />)
    await user.click(screen.getByRole('button', { name: 'Version v4.2, change version' }))
    const latest = await screen.findByRole('menuitemradio', { name: /v4\.2/ })
    expect(latest).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menuitem', { name: /v3\.x/ })).toHaveAttribute('href', '#archive/v3')
    await user.click(screen.getByRole('menuitemradio', { name: /v4\.3/ }))
    expect(onVersionChange).toHaveBeenCalledWith('v4.3')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Version v4.3, change version' })).toBeInTheDocument())
  })

  test('versions={[]} and repository={null} leave them out', () => {
    reduced(<NavbarDocs versions={[]} repository={null} />)
    expect(screen.queryByRole('button', { name: /change version/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /GitHub/ })).not.toBeInTheDocument()
  })

  test('search finds a nested page by its words and reports the choice, then lists it under Recent', async () => {
    const user = userEvent.setup()
    const onSearchSelect = vi.fn()
    reduced(<NavbarDocs sections={sections} onSearchSelect={onSearchSelect} />)
    await user.click(screen.getByRole('button', { name: 'Search docs' }))
    const dialog = await screen.findByRole('dialog', { name: 'Search the docs' })
    await user.keyboard('freez')
    await user.click(within(dialog).getByRole('option', { name: /Freezing/ }))
    expect(onSearchSelect).toHaveBeenCalledWith(expect.objectContaining({ href: '/handbook/storage/freezing', section: 'Handbook', group: 'Roasting / Storage' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Search the docs' })).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Search docs' }))
    const again = await screen.findByRole('dialog', { name: 'Search the docs' })
    expect(within(within(again).getByRole('group', { name: 'Recent' })).getByRole('option', { name: /Freezing/ })).toBeInTheDocument()
  })

  test('on a phone the drawer shows the current section’s tree, open to the current page; chips switch the tree', async () => {
    phone(true)
    const user = userEvent.setup()
    reduced(<NavbarDocs sections={sections} current="/handbook/storage/freezing" />)
    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    const drawer = await screen.findByRole('dialog')
    const tree = within(drawer).getByRole('navigation', { name: 'Handbook' })
    expect(within(tree).getByRole('link', { name: 'Freezing' })).toHaveAttribute('aria-current', 'page')
    expect(within(tree).getByRole('button', { name: 'Show pages in Storage' })).toHaveAttribute('aria-expanded', 'true')
    await user.click(within(drawer).getByRole('button', { name: 'API' }))
    expect(within(drawer).getByRole('button', { name: 'API' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(within(drawer).getByRole('navigation', { name: 'API' })).getByRole('link', { name: 'Subscriptions' })).toHaveAttribute('href', '/api/subscriptions')
    await user.click(within(drawer).getByRole('link', { name: 'Subscriptions' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  test('copy and linkComponent reach the bar', () => {
    const Link = forwardRef<HTMLAnchorElement, ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    reduced(<NavbarDocs sections={sections} linkComponent={Link} copy={{ docs: 'Doku', sectionsLabel: 'Bereiche' }} />)
    const banner = screen.getByRole('banner')
    expect(within(banner).getByRole('link', { name: /Atlas.*Doku/ })).toHaveAttribute('data-router')
    expect(within(within(banner).getByRole('navigation', { name: 'Bereiche' })).getByRole('link', { name: 'API' })).toHaveAttribute('data-router')
  })
})
