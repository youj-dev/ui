import type { ReactNode } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { FrameAccountCard } from './account-card'
import { AppFrame, FrameLogo, useFrame, type AppFrameProps } from './shell'
import { NAV, TEAMS, USER } from './shell/data'
import { FrameNotifications } from './notifications'
import { FrameSearchPalette } from './search-palette'
import { FrameSidebarClassic } from './sidebar-classic'
import { FrameTopbarBreadcrumb } from './topbar-breadcrumb'
import { FrameUpgradeCard } from './upgrade-card'
import { FrameWorkspace } from './workspace'

/* The frame contract and the parts that come with it: navigation through
 * context, the current page everywhere, collapse, the phone fallbacks, and
 * each part's own keyboard and names. Reduced motion throughout, so every
 * change is immediate. */

function Page() {
  const { trail } = useFrame()
  return <h1>{(trail?.child ?? trail?.item)?.label}</h1>
}

function Frame({ frame, footer, account }: { frame?: Partial<AppFrameProps>; footer?: ReactNode; account?: ReactNode }) {
  return (
    <YoujProvider reducedMotion="always">
      <AppFrame
        nav={NAV}
        sidebar={<FrameSidebarClassic header={<FrameWorkspace teams={TEAMS} />} footer={footer ?? <FrameAccountCard user={USER} />} />}
        topbar={<FrameTopbarBreadcrumb search={<FrameSearchPalette />} actions={<FrameNotifications />} account={account} />}
        {...frame}
      >
        <Page />
      </AppFrame>
    </YoujProvider>
  )
}

const link = (name: string) => screen.getByRole('link', { name: new RegExp(`^${name}`) })
const crumbs = () => screen.getByRole('navigation', { name: 'Breadcrumb' })

describe('AppFrame', () => {
  test('starts on the first page, and following a link moves the current page everywhere', async () => {
    const user = userEvent.setup()
    render(<Frame />)
    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toBeInTheDocument()
    expect(link('Overview')).toHaveAttribute('aria-current', 'page')
    expect(crumbs()).toHaveTextContent('GeneralOverview')

    await user.click(link('Calendar'))
    expect(link('Calendar')).toHaveAttribute('aria-current', 'page')
    expect(link('Overview')).not.toHaveAttribute('aria-current')
    expect(crumbs()).toHaveTextContent('WorkspaceCalendar')
    expect(screen.getByRole('heading', { level: 1, name: 'Calendar' })).toBeInTheDocument()
    // A page of the frame is followed in place: no jump to #calendar.
    expect(window.location.hash).toBe('')
    // The sidebar's pages are a navigation landmark.
    expect(within(screen.getByRole('navigation', { name: 'Pages' })).getByRole('link', { name: /^Calendar/ })).toHaveAttribute('aria-current', 'page')
  })

  test('with `active` it follows the router: onNavigate reports the item and the page waits for it', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(<Frame frame={{ active: 'inbox', onNavigate }} />)
    expect(link('Inbox')).toHaveAttribute('aria-current', 'page')
    await user.click(link('Reports'))
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ id: 'reports' }), expect.anything())
    expect(link('Inbox')).toHaveAttribute('aria-current', 'page')
  })

  test('useFrame outside an AppFrame says what went wrong', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Page />)).toThrow('useFrame must be used inside <AppFrame>.')
    error.mockRestore()
  })
})

describe('FrameSidebarClassic', () => {
  test('counts are read after the name, and the visible number is not read twice', () => {
    render(<Frame />)
    expect(link('Inbox')).toHaveAccessibleName('Inbox, 4 unread')
    expect(link('My tasks')).toHaveAccessibleName('My tasks, 12 open')
    const badge = document.querySelector('[data-sidebar=menu-badge]')!
    expect(badge).toHaveAttribute('aria-hidden', 'true')
  })

  test('nested pages sit under a disclosure that opens by itself for the current page', async () => {
    const user = userEvent.setup()
    render(<Frame frame={{ defaultActive: 'borealis' }} />)
    const projects = screen.getByRole('button', { name: 'Projects' })
    expect(projects).toHaveAttribute('aria-expanded', 'true')
    expect(link('Borealis')).toHaveAccessibleName('Borealis, New')
    expect(crumbs()).toHaveTextContent('WorkspaceProjectsBorealis')

    await user.click(projects)
    expect(projects).toHaveAttribute('aria-expanded', 'false')
    await user.click(projects)
    await user.click(link('Cirrus'))
    expect(screen.getByRole('heading', { level: 1, name: 'Cirrus' })).toBeInTheDocument()
  })

  test('collapses from the trigger and ⌘B, and a group opened while collapsed opens its pages beside it', async () => {
    const user = userEvent.setup()
    render(<Frame />)
    const trigger = screen.getByRole('button', { name: 'Toggle sidebar' })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(document.querySelector('[data-frame-sidebar=classic]')?.closest('[data-state]')).toHaveAttribute('data-state', 'collapsed')

    await user.click(screen.getByRole('button', { name: 'Projects' }))
    expect(screen.getByRole('button', { name: 'Projects' })).toHaveAttribute('aria-expanded', 'true')
    expect(await screen.findByRole('menuitem', { name: 'Atlas' })).toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await user.keyboard('{Escape}')

    await user.keyboard('{Meta>}b{/Meta}')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('FrameSearchPalette', () => {
  test('⌘K opens every page of the nav; choosing one goes there; Escape returns focus to the button', async () => {
    const user = userEvent.setup()
    render(<Frame />)
    const button = screen.getByRole('button', { name: 'Search' })
    await user.click(button)
    const dialog = await screen.findByRole('dialog')
    await user.keyboard('bore')
    await user.keyboard('{Enter}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('heading', { level: 1, name: 'Borealis' })).toBeInTheDocument()
    expect(dialog).not.toBeInTheDocument()

    await user.keyboard('{Meta>}k{/Meta}')
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(button).toHaveFocus())
  })

  test('its Toggle sidebar action collapses the sidebar', async () => {
    const user = userEvent.setup()
    render(<Frame />)
    await user.click(screen.getByRole('button', { name: 'Search' }))
    await screen.findByRole('dialog')
    await user.keyboard('toggle sidebar{Enter}')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Toggle sidebar' })).toHaveAttribute('aria-expanded', 'false'))
  })
})

describe('the header and footer parts', () => {
  test('the account card names its person and opens the menu, with Sign out', async () => {
    const user = userEvent.setup()
    const onSignOut = vi.fn()
    render(<Frame footer={<FrameAccountCard user={USER} onSignOut={onSignOut} />} />)
    const card = screen.getByRole('button', { name: /Ada Lovelace/ })
    await user.click(card)
    const menu = await screen.findByRole('menu')
    expect(within(menu).getByText('ada@northwind.dev')).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: /Keyboard shortcuts/ })).toBeInTheDocument()
    await user.click(within(menu).getByRole('menuitem', { name: 'Sign out' }))
    expect(onSignOut).toHaveBeenCalledOnce()
  })

  test('the workspace switcher shows the current team and switches', async () => {
    const user = userEvent.setup()
    render(<Frame />)
    await user.click(screen.getByRole('button', { name: /Northwind Labs/ }))
    await user.click(await screen.findByRole('option', { name: /Acme Corp/ }))
    await waitFor(() => expect(screen.getByRole('button', { name: /Acme Corp/ })).toBeInTheDocument())
  })

  test('the upgrade card shows its meter, and dismissing it takes it away', async () => {
    const user = userEvent.setup()
    render(<Frame footer={<FrameUpgradeCard />} />)
    expect(screen.getByRole('progressbar', { name: /Projects/ })).toHaveAttribute('aria-valuenow', '3')
    await user.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  test('collapsed, the upgrade card and account card keep their names on their icons', async () => {
    render(
      <Frame
        frame={{ defaultCollapsed: true }}
        footer={
          <>
            <FrameUpgradeCard />
            <FrameAccountCard user={USER} />
          </>
        }
      />,
    )
    expect(screen.getByRole('button', { name: 'Upgrade to Pro' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ada Lovelace/ })).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  test('the logo links home and keeps its name', () => {
    render(
      <YoujProvider reducedMotion="always">
        <AppFrame nav={NAV} defaultActive="reports" sidebar={<FrameSidebarClassic header={<FrameLogo name="Northwind" />} />}>
          <Page />
        </AppFrame>
      </YoujProvider>,
    )
    expect(screen.getByRole('link', { name: 'Northwind' })).toHaveAttribute('href', '#overview')
  })

  test('the bell names its unread count, and Mark all as read clears it', async () => {
    const user = userEvent.setup()
    render(<Frame />)
    await user.click(screen.getByRole('button', { name: 'Notifications, 2 unread' }))
    await user.click(await screen.findByRole('button', { name: /Mark all as read/ }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument())
  })
})

describe('below md', () => {
  const matchMedia = window.matchMedia
  beforeEach(() => {
    window.matchMedia = (query: string) =>
      ({
        matches: query.includes('max-width: 767px'),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList
  })
  afterEach(() => {
    window.matchMedia = matchMedia
  })

  test('the sidebar is a sheet, and following a page closes it', async () => {
    const user = userEvent.setup()
    render(<Frame />)
    await user.click(screen.getByRole('button', { name: 'Toggle sidebar' }))
    const sheet = await screen.findByRole('dialog', { name: 'Sidebar' })
    await user.click(within(sheet).getByRole('link', { name: /^Documents/ }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Sidebar' })).not.toBeInTheDocument())
    expect(screen.getByRole('heading', { level: 1, name: 'Documents' })).toBeInTheDocument()
  })

  test('with mobileNav="tabs", a tab bar holds the first pages and Menu opens the sheet', async () => {
    const user = userEvent.setup()
    render(<Frame frame={{ mobileNav: 'tabs' }} />)
    const bar = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(bar).getAllByRole('link')).toHaveLength(4)
    for (const name of ['Overview', 'Inbox, 4 unread', 'My tasks, 12 open', 'Projects']) expect(within(bar).getByRole('link', { name })).toBeInTheDocument()
    expect(within(bar).getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page')

    await user.click(within(bar).getByRole('link', { name: /^Inbox/ }))
    expect(screen.getByRole('heading', { level: 1, name: 'Inbox' })).toBeInTheDocument()

    const menu = within(bar).getByRole('button', { name: 'Menu' })
    expect(menu).toHaveAttribute('aria-expanded', 'false')
    await user.click(menu)
    expect(await screen.findByRole('dialog', { name: 'Sidebar' })).toBeInTheDocument()
  })
})
