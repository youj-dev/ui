import { forwardRef, type ComponentProps } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { MarketingNavbar, type MarketingNavbarItem } from './navbar'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

const links: MarketingNavbarItem[] = [
  { label: 'Coffee', groups: [{ title: 'Shop', links: [{ label: 'Blends', href: '/blends', description: 'For espresso.' }] }] },
  { label: 'Menu', href: '/menu' },
  { label: 'Cafés', href: '/cafes' },
]

describe('MarketingNavbar', () => {
  test('renders the links, brand and calls to action it is given', async () => {
    const user = userEvent.setup()
    reduced(
      <MarketingNavbar
        links={links}
        current="/menu"
        brand={{ name: 'Fernhill', href: '/' }}
        primaryCta={{ label: 'Subscribe', href: '/subscribe' }}
        secondaryCta={null}
        copy={{ navLabel: 'Site' }}
      />,
    )
    const banner = screen.getByRole('banner')
    const nav = within(banner).getByRole('navigation', { name: 'Site' })
    expect(within(nav).getByRole('link', { name: 'Menu' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: 'Cafés' })).not.toHaveAttribute('aria-current')
    expect(within(banner).getByRole('link', { name: 'Fernhill' })).toHaveAttribute('href', '/')
    expect(within(banner).getByRole('link', { name: 'Subscribe' })).toHaveAttribute('href', '/subscribe')
    expect(within(banner).queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument()
    await user.click(within(nav).getByRole('button', { name: 'Coffee' }))
    expect(await screen.findByRole('link', { name: /Blends/ })).toHaveAttribute('href', '/blends')
  })

  test('the actions slot sits before the calls to action, whose onClick fires', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault())
    reduced(<MarketingNavbar actions={<button type="button">Theme</button>} primaryCta={{ label: 'Join', href: '/join', onClick }} />)
    const banner = screen.getByRole('banner')
    expect(within(banner).getByRole('button', { name: 'Theme' })).toBeInTheDocument()
    await user.click(within(banner).getAllByRole('link', { name: 'Join' })[0]!)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('linkComponent renders every internal link', () => {
    const Link = forwardRef<HTMLAnchorElement, ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    reduced(<MarketingNavbar links={links} linkComponent={Link} />)
    const banner = screen.getByRole('banner')
    for (const name of ['Menu', 'Cafés', 'Northwind', 'Start free', 'Sign in']) {
      expect(within(banner).getAllByRole('link', { name })[0]).toHaveAttribute('data-router')
    }
  })

  test('spreads extra props on the root header', () => {
    reduced(<MarketingNavbar id="top" className="custom" />)
    expect(screen.getByRole('banner')).toHaveAttribute('id', 'top')
    expect(screen.getByRole('banner')).toHaveClass('custom')
  })
  test('the announcement bar names itself, links to its post and dismisses', async () => {
    const user = userEvent.setup()
    const onDismissAnnouncement = vi.fn()
    reduced(<MarketingNavbar onDismissAnnouncement={onDismissAnnouncement} />)
    const bar = screen.getByRole('complementary', { name: 'Announcement' })
    expect(within(bar).getByRole('link', { name: /Northwind 2.0 ships instant rollbacks/ })).toHaveAttribute('href', '#launch')
    await user.click(within(bar).getByRole('button', { name: 'Dismiss announcement' }))
    expect(onDismissAnnouncement).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('complementary', { name: 'Announcement' })).not.toBeInTheDocument())
  })

  test('announcement={null} leaves only the header', () => {
    reduced(<MarketingNavbar announcement={null} />)
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })

  test('signed in: a dashboard button and an account menu replace the sign-in calls to action', async () => {
    const user = userEvent.setup()
    const onSignOut = vi.fn()
    reduced(<MarketingNavbar user={{ name: 'Ada Lovelace', email: 'ada@analytical.dev' }} onSignOut={onSignOut} />)
    const banner = screen.getByRole('banner')
    expect(within(banner).getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '#dashboard')
    expect(within(banner).queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument()
    expect(within(banner).queryByRole('link', { name: 'Start free' })).not.toBeInTheDocument()
    await user.click(within(banner).getByRole('button', { name: 'Account menu, Ada Lovelace' }))
    expect(await screen.findByText('ada@analytical.dev')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Billing' })).toHaveAttribute('href', '#billing')
    await user.click(screen.getByRole('menuitem', { name: 'Sign out' }))
    expect(onSignOut).toHaveBeenCalledTimes(1)
  })

  test('a mega menu opens from the keyboard, its preview follows the focused link, and Escape returns to the trigger', async () => {
    const user = userEvent.setup()
    reduced(<MarketingNavbar />)
    const trigger = screen.getByRole('button', { name: 'Product' })
    await user.tab()
    trigger.focus()
    await user.keyboard('{Enter}')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const preview = () => document.querySelector('[data-slot=navbar-preview]')!
    expect(preview()).toHaveTextContent('Every push gets a live URL')
    const functions = await screen.findByRole('link', { name: /Functions/ })
    functions.focus()
    await waitFor(() => expect(preview()).toHaveTextContent('Write a handler'))
    expect(preview()).toHaveAttribute('aria-hidden', 'true')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'))
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  test('the mega menu strip links to the featured launch', async () => {
    const user = userEvent.setup()
    reduced(<MarketingNavbar />)
    await user.click(screen.getByRole('button', { name: 'Product' }))
    expect(await screen.findByRole('link', { name: /Northwind 2.0\s*Instant rollbacks/ })).toHaveAttribute('href', '#launch')
  })

  test('a menu can start open and reports opening and closing; its trigger carries a dot when it holds the current page', async () => {
    const user = userEvent.setup()
    const onMenuChange = vi.fn()
    reduced(<MarketingNavbar defaultMenu="Product" current="#analytics" onMenuChange={onMenuChange} />)
    const trigger = screen.getByRole('button', { name: 'Product' })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(trigger.querySelector('[data-slot=navbar-current-dot]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Solutions' }).querySelector('[data-slot=navbar-current-dot]')).toBeNull()
    expect(await screen.findByRole('link', { name: /Analytics/ })).toHaveAttribute('aria-current', 'page')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'))
    expect(onMenuChange).toHaveBeenLastCalledWith(null)
  })

  test('a menu with cards shows them as links in place of the preview', async () => {
    const user = userEvent.setup()
    reduced(<MarketingNavbar />)
    await user.click(screen.getByRole('button', { name: 'Resources' }))
    const cards = await waitFor(() => document.querySelector<HTMLElement>('[data-slot=navbar-cards]')!)
    expect(within(cards).getByRole('link', { name: /How we cut cold starts to 40 ms/ })).toHaveAttribute('href', '#blog/cold-starts')
    expect(document.querySelector('[data-slot=navbar-preview]')).toBeNull()
  })

  test('search finds a menu link by its words and a listed page, and reports the choice', async () => {
    const user = userEvent.setup()
    const onSearchSelect = vi.fn()
    reduced(<MarketingNavbar onSearchSelect={onSearchSelect} />)
    await user.click(screen.getAllByRole('button', { name: 'Search the site' })[0]!)
    const dialog = await screen.findByRole('dialog', { name: 'Search the site' })
    await user.keyboard('cookies')
    expect(within(dialog).getByRole('option', { name: 'Analytics' })).toBeInTheDocument()
    await user.clear(within(dialog).getByRole('combobox'))
    await user.keyboard('soc 2')
    await user.click(within(dialog).getByRole('option', { name: 'Security and trust' }))
    expect(onSearchSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'security', href: '#security' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Search the site' })).not.toBeInTheDocument())
  })

  test('search={false} removes the search buttons', () => {
    reduced(<MarketingNavbar search={false} />)
    expect(screen.queryByRole('button', { name: 'Search the site' })).not.toBeInTheDocument()
  })

  test('the drawer folds each menu open as a section and closes when a link is followed', async () => {
    const user = userEvent.setup()
    reduced(<MarketingNavbar links={links} current="/blends" />)
    await user.click(screen.getByRole('button', { name: /Open Menu/i }))
    const drawer = await screen.findByRole('dialog')
    const section = within(drawer).getByRole('button', { name: 'Coffee' })
    expect(section).toHaveAttribute('aria-expanded', 'true')
    expect(within(drawer).getByRole('link', { name: /Blends/ })).toHaveAttribute('aria-current', 'page')
    expect(within(drawer).getByRole('link', { name: 'Start free' })).toBeInTheDocument()
    await user.click(section)
    await waitFor(() => expect(section).toHaveAttribute('aria-expanded', 'false'))
    await user.click(within(drawer).getByRole('link', { name: 'Menu' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  test('signed in, the drawer footer shows the person and Sign out', async () => {
    const user = userEvent.setup()
    const onSignOut = vi.fn()
    reduced(<MarketingNavbar user={{ name: 'Ada Lovelace', email: 'ada@analytical.dev' }} onSignOut={onSignOut} />)
    await user.click(screen.getByRole('button', { name: /Open Menu/i }))
    const drawer = await screen.findByRole('dialog')
    expect(within(drawer).getByText('ada@analytical.dev')).toBeInTheDocument()
    await user.click(within(drawer).getByRole('button', { name: 'Sign out' }))
    expect(onSignOut).toHaveBeenCalledTimes(1)
  })
})
