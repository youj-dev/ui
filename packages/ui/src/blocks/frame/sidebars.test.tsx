import { renderToString } from 'react-dom/server'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { DOCS_NAV } from '../../docs/demo-navs'
import { FrameAccountCard } from './account-card'
import { AppFrame, useFrame, type AppFrameProps } from './shell'
import { NAV, TEAMS, USER } from './shell/data'
import { FrameSidebarClassic, type FrameSidebarClassicProps } from './sidebar-classic'
import { FrameSidebarGlass } from './sidebar-glass'
import { FrameSidebarIconRail } from './sidebar-icon-rail'
import { FrameSidebarRailPanel } from './sidebar-rail-panel'
import { FrameSidebarWorkspace } from './sidebar-workspace'
import { FrameTopbarBreadcrumb } from './topbar-breadcrumb'
import { FrameUpgradeCard } from './upgrade-card'
import { FrameWorkspace } from './workspace'

/* The five sidebars: each draws the frame's nav, follows the current page,
 * reads counts after names, collapses its own way and keeps what matters
 * within reach. Then what Classic, Rail + panel, Icon rail and Glass each do
 * of their own (the filter and the resizable edge, the side menus, the rail
 * and its flyouts, the panel's tree, the explorer); Workspace's command
 * field, spaces and live state, and the drill-down panel, are in
 * sidebars-variants.test.tsx. Reduced motion throughout, so every change is
 * immediate. */

const SIDEBARS = {
  classic: FrameSidebarClassic,
  workspace: FrameSidebarWorkspace,
  'rail-panel': FrameSidebarRailPanel,
  'icon-rail': FrameSidebarIconRail,
  glass: FrameSidebarGlass,
}
type Kind = keyof typeof SIDEBARS

function Page() {
  const { trail } = useFrame()
  return <h1>{(trail?.child ?? trail?.item)?.label}</h1>
}

function Frame({ kind, frame, props }: { kind: Kind; frame?: Partial<AppFrameProps>; props?: Partial<FrameSidebarClassicProps> & Record<string, unknown> }) {
  const Sidebar = SIDEBARS[kind]
  return (
    <YoujProvider reducedMotion="always">
      <AppFrame
        nav={NAV}
        sidebar={
          <Sidebar
            header={<FrameWorkspace teams={TEAMS} />}
            footer={
              <>
                <FrameUpgradeCard />
                <FrameAccountCard user={USER} />
              </>
            }
            {...props}
          />
        }
        topbar={<FrameTopbarBreadcrumb />}
        {...frame}
      >
        <Page />
      </AppFrame>
    </YoujProvider>
  )
}

/** A page's link in the sidebar (not the phone's tab bar, which jsdom draws at every width): the trees' are their treeitems. */
const link = (name: string) =>
  screen.queryAllByRole('link', { name: new RegExp(`^${name}`) }).find((el) => !el.closest('[data-slot=frame-tab-bar]')) ??
  screen.getByRole('treeitem', { name: new RegExp(`^${name}`) })
const trigger = () => screen.getByRole('button', { name: 'Toggle sidebar' })
const heading = () => screen.getByRole('heading', { level: 1 })
const sidebar = (kind: Kind) => document.querySelector<HTMLElement>(`[data-frame-sidebar=${kind}]`)!
/** Out of reach: inside an inert subtree (jsdom's queries don't know inert). */
const inert = (el: Element) => el.closest('[inert]') !== null

describe.each(Object.keys(SIDEBARS) as Kind[])('the %s sidebar', (kind) => {
  test('draws the nav, follows the current page, and reads counts after the name', async () => {
    const user = userEvent.setup()
    render(<Frame kind={kind} />)
    expect(sidebar(kind)).toBeInTheDocument()
    expect(link('Overview')).toHaveAttribute('aria-current', 'page')
    expect(link('Inbox')).toHaveAccessibleName('Inbox, 4 unread')
    expect(link('My tasks')).toHaveAccessibleName('My tasks, 12 open')

    await user.click(link('Inbox'))
    expect(link('Inbox')).toHaveAttribute('aria-current', 'page')
    expect(link('Overview')).not.toHaveAttribute('aria-current')
    expect(heading()).toHaveTextContent('Inbox')
    // A page of the frame is followed in place: no jump to #inbox.
    expect(window.location.hash).toBe('')
  })

  test('its pages are a navigation landmark, so assistive tech can jump to them', () => {
    render(<Frame kind={kind} />)
    // Rail + panel names its panel after the section it shows.
    const nav = screen.getByRole('navigation', { name: kind === 'rail-panel' ? 'General' : 'Pages' })
    expect(within(nav).queryByRole('link', { name: /^Overview/ }) ?? within(nav).getByRole('treeitem', { name: /^Overview/ })).toBeInTheDocument()
  })

  test('collapses from the trigger and ⌘B, and comes back', async () => {
    const user = userEvent.setup()
    render(<Frame kind={kind} />)
    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    await user.click(trigger())
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(sidebar(kind).closest('[data-slot=sidebar]')).toHaveAttribute('data-state', 'collapsed')
    await user.keyboard('{Meta>}b{/Meta}')
    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    expect(inert(link('Inbox'))).toBe(false)
  })

  test('under reduced motion it says so to its CSS', () => {
    render(<Frame kind={kind} />)
    expect(sidebar(kind).closest('[data-slot=sidebar]')).toHaveAttribute('data-reduced-motion')
  })

  test('renders on the server', () => {
    expect(renderToString(<Frame kind={kind} />)).toContain(`data-frame-sidebar="${kind}"`)
  })
})

describe('what stays within reach, collapsed', () => {
  test('Classic and Workspace keep every page (as icons)', async () => {
    const user = userEvent.setup()
    for (const kind of ['classic', 'workspace'] as const) {
      const { unmount } = render(<Frame kind={kind} frame={{ defaultCollapsed: true }} />)
      expect(inert(link('Inbox'))).toBe(false)
      await user.click(link('Inbox'))
      expect(heading()).toHaveTextContent('Inbox')
      unmount()
    }
  })

  test('Glass goes off-canvas: out of reach, and ⌘B from inside hands focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<Frame kind="glass" />)
    link('Inbox').focus()
    await user.keyboard('{Meta>}b{/Meta}')
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(inert(sidebar('glass'))).toBe(true)
    expect(trigger()).toHaveFocus()
    await user.keyboard('{Meta>}b{/Meta}')
    expect(inert(sidebar('glass'))).toBe(false)
  })
})

describe('the current page’s look', () => {
  test.each([
    ['classic', 'fill'],
    ['workspace', 'raised'],
    ['glass', 'fill'],
  ] as const)('the %s sidebar marks it with the %s indicator', (kind, indicator) => {
    render(<Frame kind={kind} />)
    expect(sidebar(kind).querySelector('[data-slot=sidebar-content]')).toHaveAttribute('data-yj-indicator', indicator)
  })
})

describe('FrameSidebarClassic', () => {
  const edge = () => screen.getByRole('separator', { name: 'Resize sidebar' })
  const filter = () => screen.getByRole('searchbox', { name: 'Filter pages' })

  test('its edge is a window splitter: arrows, Home, End and Enter', async () => {
    const user = userEvent.setup()
    const onWidthChange = vi.fn()
    render(<Frame kind="classic" props={{ defaultWidth: 256, onWidthChange }} />)
    expect(edge()).toHaveAttribute('aria-orientation', 'vertical')
    expect(edge()).toHaveAttribute('aria-valuenow', '256')
    expect(edge()).toHaveAttribute('aria-valuetext', '256 pixels wide')
    edge().focus()
    await user.keyboard('{ArrowRight}')
    expect(onWidthChange).toHaveBeenLastCalledWith(272)
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}')
    expect(onWidthChange).toHaveBeenLastCalledWith(336)
    expect(sidebar('classic').closest('[data-slot=sidebar-container]')).toHaveStyle({ '--sidebar-width': '336px' })
    await user.keyboard('{End}')
    expect(onWidthChange).toHaveBeenLastCalledWith(420)
    await user.keyboard('{Home}')
    expect(onWidthChange).toHaveBeenLastCalledWith(200)
    // Pushed past the narrowest, it folds; Enter brings it back.
    await user.keyboard('{ArrowLeft}')
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(edge()).toHaveAttribute('aria-valuetext', 'Collapsed to icons')
    await user.keyboard('{Enter}')
    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
  })

  test('mirrors its arrows on a sidebar at the right, and a press that doesn’t move folds it', async () => {
    const user = userEvent.setup()
    const onWidthChange = vi.fn()
    render(
      <div dir="rtl">
        <Frame kind="classic" props={{ width: 300, onWidthChange }} />
      </div>,
    )
    edge().focus()
    await user.keyboard('{ArrowLeft}')
    expect(onWidthChange).toHaveBeenLastCalledWith(316)
    fireEvent.pointerDown(edge(), { button: 0, clientX: 10, pointerId: 1 })
    fireEvent.pointerUp(edge(), { clientX: 10, pointerId: 1 })
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
  })

  test('takes its edge’s name and value text from copy', () => {
    render(<Frame kind="classic" props={{ defaultWidth: 240, copy: { resize: 'Seitenleiste anpassen', resizeValue: (px) => `${px} Pixel` } }} />)
    expect(screen.getByRole('separator', { name: 'Seitenleiste anpassen' })).toHaveAttribute('aria-valuetext', '240 Pixel')
  })

  test('the filter narrows the list as you type, nested pages included, and says how many; Enter goes, Escape clears, / reaches it', async () => {
    const user = userEvent.setup()
    render(<Frame kind="classic" />)
    await user.keyboard('/')
    await waitFor(() => expect(filter()).toHaveFocus())
    await user.keyboard('re')
    expect(within(sidebar('classic')).getByRole('status')).toHaveTextContent('2 pages')
    expect(link('Borealis')).toBeInTheDocument()
    expect(link('Reports')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^Overview/ })).not.toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(heading()).toHaveTextContent('Borealis')
    filter().focus()
    await user.keyboard('{Escape}')
    expect(filter()).toHaveValue('')
    expect(link('Overview')).toBeInTheDocument()
    await user.type(filter(), 'zebra')
    expect(screen.getByText('No pages match “zebra”', { selector: 'p:not([role=status])' })).toBeInTheDocument()
  })

  test('a collapsible section folds under its label, and opens again for its current page', async () => {
    const user = userEvent.setup()
    const nav = NAV.map((s) => (s.id === 'admin' ? { ...s, collapsible: true } : s))
    const { rerender } = render(<Frame kind="classic" frame={{ nav, active: 'overview' }} />)
    const admin = screen.getByRole('button', { name: /^Admin/ })
    expect(admin).toHaveAttribute('aria-expanded', 'true')
    await user.click(admin)
    expect(admin).toHaveAttribute('aria-expanded', 'false')
    rerender(<Frame kind="classic" frame={{ nav, active: 'members' }} />)
    expect(screen.getByRole('button', { name: /^Admin/ })).toHaveAttribute('aria-expanded', 'true')
  })

  test('pages for the foot sit above the footer, and the inset variant sets the page as a card', () => {
    render(<Frame kind="classic" props={{ variant: 'inset', links: [{ id: 'help', label: 'Help center', href: 'https://example.com/help' }] }} />)
    expect(screen.getByRole('link', { name: 'Help center' })).toHaveAttribute('href', 'https://example.com/help')
    expect(sidebar('classic').closest('[data-slot=sidebar]')).toHaveAttribute('data-variant', 'inset')
  })

  test('folded to icons, a page with nested pages opens them in a menu to its side, which goes there', async () => {
    const user = userEvent.setup()
    render(<Frame kind="classic" frame={{ defaultCollapsed: true }} />)
    const projects = screen.getByRole('button', { name: 'Projects' })
    expect(projects).toHaveAttribute('aria-haspopup', 'menu')
    await user.click(projects)
    const menu = await screen.findByRole('menu')
    expect(within(menu).getAllByRole('menuitem')).toHaveLength(3)
    await user.click(within(menu).getByRole('menuitem', { name: 'Borealis, New' }))
    expect(heading()).toHaveTextContent('Borealis')
    // Still folded: the menu was a glance, not a layout change.
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  })

  test('expanded, the same button is a disclosure, and ⌘B keeps focus on it both ways', async () => {
    const user = userEvent.setup()
    render(<Frame kind="classic" frame={{ defaultActive: 'atlas' }} />)
    const projects = screen.getByRole('button', { name: 'Projects' })
    expect(projects).toHaveAttribute('aria-expanded', 'true')
    expect(projects).not.toHaveAttribute('aria-haspopup')
    projects.focus()
    await user.keyboard('{Meta>}b{/Meta}')
    expect(projects).toHaveFocus()
    expect(projects).toHaveAttribute('aria-haspopup', 'menu')
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('menu')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(projects).toHaveFocus())
  })
})

describe('FrameSidebarRailPanel', () => {
  const entry = (name: string) => screen.getByRole('button', { name })
  const branch = (name: string) => screen.getByRole('treeitem', { name })

  test('a rail of round keys: one Tab stop, the arrows between them; pressing the shown one folds the panel', async () => {
    const user = userEvent.setup()
    render(<Frame kind="rail-panel" />)
    const rail = screen.getByRole('toolbar', { name: 'Sections' })
    expect(rail).toHaveAttribute('aria-orientation', 'vertical')
    expect(entry('General')).toHaveAttribute('aria-pressed', 'true')
    expect(entry('General')).toHaveAttribute('tabindex', '0')
    expect(entry('Workspace')).toHaveAttribute('tabindex', '-1')
    const panel = screen.getByRole('navigation', { name: 'General' })
    expect(entry('Workspace')).toHaveAttribute('aria-controls', panel.id)
    expect(panel).toContainElement(link('Inbox'))
    expect(within(rail).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['General', 'Workspace', 'Admin'])

    entry('General').focus()
    await user.keyboard('{ArrowDown}')
    expect(entry('Workspace')).toHaveFocus()
    await user.keyboard('{End}')
    expect(entry('Admin')).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(entry('Admin')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('navigation', { name: 'Admin' })).toContainElement(link('Members'))
    // Browsing isn't navigating.
    expect(heading()).toHaveTextContent('Overview')
    await user.keyboard('{Enter}')
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
  })

  test('folded to the rail, each key flies its section’s pages out beside it', async () => {
    const user = userEvent.setup()
    render(<Frame kind="rail-panel" frame={{ defaultCollapsed: true }} />)
    const workspace = screen.getByRole('button', { name: 'Workspace' })
    expect(workspace).toHaveAttribute('aria-expanded', 'false')
    await user.click(workspace)
    expect(workspace).toHaveAttribute('aria-expanded', 'true')
    await user.click(await screen.findByRole('link', { name: 'Calendar' }))
    expect(heading()).toHaveTextContent('Calendar')
    await waitFor(() => expect(workspace).toHaveAttribute('aria-expanded', 'false'))
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    screen.getByRole('button', { name: 'Admin' }).focus()
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('link', { name: 'Members' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Members' })).not.toBeInTheDocument())
  })

  test('⌘B carries focus between the two forms of a key, and from the panel to its section', async () => {
    const user = userEvent.setup()
    render(<Frame kind="rail-panel" />)
    entry('General').focus()
    await user.keyboard('{Meta>}b{/Meta}')
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: 'General' })).toHaveFocus()
    await user.keyboard('{Meta>}b{/Meta}')
    expect(entry('General')).toHaveFocus()
    link('My tasks').focus()
    await user.keyboard('{Meta>}b{/Meta}')
    expect(screen.getByRole('button', { name: 'General' })).toHaveFocus()
  })

  test('the panel follows the current page when it’s reached from elsewhere', () => {
    const { rerender } = render(<Frame kind="rail-panel" frame={{ active: 'overview' }} />)
    rerender(<Frame kind="rail-panel" frame={{ active: 'settings' }} />)
    expect(entry('Admin')).toHaveAttribute('aria-pressed', 'true')
    expect(link('Settings')).toHaveAttribute('aria-current', 'page')
  })

  test('the rail holds the header and footer parts in their compact form, each still named', () => {
    render(<Frame kind="rail-panel" />)
    expect(document.querySelector('[data-slot=workspace-switcher-trigger]')).toHaveAttribute('data-compact')
    expect(screen.getByRole('button', { name: 'Upgrade to Pro' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ada Lovelace/ })).toBeInTheDocument()
  })

  test('the panel’s title, add button and views come from props and copy', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    const onViewChange = vi.fn()
    render(
      <Frame
        kind="rail-panel"
        props={{
          onAdd,
          onViewChange,
          views: [
            { id: '30', label: '30 days' },
            { id: '365', label: '12 months' },
          ],
          copy: { sections: 'Bereiche', add: (s: string) => `Neu in ${s}` } as never,
        }}
      />,
    )
    expect(screen.getByRole('toolbar', { name: 'Bereiche' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'General' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Neu in General' }))
    expect(onAdd).toHaveBeenCalledWith('general')
    await user.click(screen.getByRole('button', { name: '12 months' }))
    expect(onViewChange).toHaveBeenCalledWith('365')
  })

  test('the panel is an ARIA tree with the current page’s branch open, one Tab stop and the tree’s keys', async () => {
    const user = userEvent.setup()
    render(<Frame kind="rail-panel" frame={{ defaultActive: 'atlas' }} />)
    expect(screen.getByRole('tree', { name: 'Workspace' })).toBeInTheDocument()
    expect(branch('Projects')).toHaveAttribute('aria-expanded', 'true')
    expect(link('Atlas')).toHaveAttribute('aria-current', 'page')
    expect(link('Atlas')).toHaveAttribute('aria-level', '2')
    expect(link('Borealis')).toHaveAttribute('aria-posinset', '2')
    expect(link('Borealis')).toHaveAttribute('aria-setsize', '3')
    expect(screen.getAllByRole('treeitem').filter((t) => t.tabIndex === 0)).toEqual([link('Atlas')])
    link('Atlas').focus()
    await user.keyboard('{ArrowLeft}')
    expect(branch('Projects')).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(branch('Projects')).toHaveAttribute('aria-expanded', 'false')
    await user.keyboard('{ArrowRight}')
    expect(branch('Projects')).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard('{ArrowRight}')
    await waitFor(() => expect(link('Atlas')).toHaveFocus())
    await user.keyboard('{End}')
    expect(link('Reports')).toHaveFocus()
    await user.keyboard('{Home}')
    expect(branch('Projects')).toHaveFocus()
    await user.keyboard('ca')
    expect(link('Calendar')).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(heading()).toHaveTextContent('Calendar')
  })

  test('the filter narrows the panel’s tree, opens the branches with a match, and says how many', async () => {
    const user = userEvent.setup()
    render(<Frame kind="rail-panel" frame={{ defaultActive: 'calendar' }} />)
    await user.click(branch('Projects'))
    expect(branch('Projects')).toHaveAttribute('aria-expanded', 'false')
    await user.type(screen.getByRole('searchbox', { name: 'Filter pages' }), 'bor')
    expect(await screen.findByRole('treeitem', { name: 'Borealis, New' })).toBeInTheDocument()
    expect(branch('Projects')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('1 page', { selector: '[role=status]' })).toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(heading()).toHaveTextContent('Borealis')
  })

  test('goes to any depth: the page’s branches open and the breadcrumb names every step', async () => {
    const user = userEvent.setup()
    render(<Frame kind="rail-panel" frame={{ nav: DOCS_NAV, defaultActive: 'rollback-instant' }} />)
    expect(branch('Deploying')).toHaveAttribute('aria-expanded', 'true')
    expect(branch('Rollbacks')).toHaveAttribute('aria-expanded', 'true')
    expect(link('Instant rollback')).toHaveAttribute('aria-level', '3')
    expect(link('Instant rollback')).toHaveAttribute('aria-current', 'page')
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(crumbs).getAllByRole('link').map((a) => a.textContent)).toEqual(['Deploying', 'Rollbacks'])
    // ↓ from the filter goes into the tree, on the row it would Tab to.
    screen.getByRole('searchbox', { name: 'Filter pages' }).focus()
    await user.keyboard('{ArrowDown}')
    expect(link('Instant rollback')).toHaveFocus()
  })
})

describe('the tree’s keys with ids that are not plain words', () => {
  // The rows are found by their id: quotes, backslashes, brackets and line breaks must neither throw nor focus another row.
  const ids = ['say "hi"', 'back\\slash\\', 'close]', 'new\nline', 'a\\"] , [data-yj-tree-item']
  const nav = [{ id: 'odd', label: 'Odd', items: ids.map((id) => ({ id, label: `Page ${ids.indexOf(id) + 1}` })) }]

  test('↓ and ↑ move focus through every row', async () => {
    const user = userEvent.setup()
    render(<Frame kind="rail-panel" frame={{ nav, defaultActive: ids[0] }} />)
    const rows = ids.map((_, i) => link(`Page ${i + 1}`))
    expect(rows).toHaveLength(ids.length)
    rows[0]!.focus()
    for (const row of rows.slice(1)) {
      await user.keyboard('{ArrowDown}')
      expect(row).toHaveFocus()
    }
    for (const row of rows.slice(0, -1).reverse()) {
      await user.keyboard('{ArrowUp}')
      expect(row).toHaveFocus()
    }
  })
})

describe('FrameSidebarIconRail', () => {
  test('one key per top-level page, named in a tooltip; a page with nested pages opens a menu to its side', async () => {
    const user = userEvent.setup()
    render(<Frame kind="icon-rail" />)
    const projects = screen.getByRole('button', { name: 'Projects' })
    expect(projects).toHaveAttribute('aria-haspopup', 'menu')
    await user.click(projects)
    const menu = await screen.findByRole('menu')
    await user.click(within(menu).getByRole('menuitem', { name: 'Atlas' }))
    expect(heading()).toHaveTextContent('Atlas')
    // The group stands in for its page.
    expect(projects).toHaveAttribute('data-active')
  })

  test('the header and footer parts sit on the rail in their compact form', () => {
    render(<Frame kind="icon-rail" />)
    expect(document.querySelector('[data-slot=workspace-switcher-trigger]')).toHaveAttribute('data-compact')
    expect(screen.getByRole('button', { name: /Ada Lovelace/ })).toBeInTheDocument()
  })
})

describe('FrameSidebarGlass', () => {
  test('is glass, and a page with nested pages opens them in the explorer’s tree', async () => {
    const user = userEvent.setup()
    render(<Frame kind="glass" frame={{ nav: DOCS_NAV }} />)
    expect(sidebar('glass').closest('[data-slot=sidebar]')).toHaveAttribute('data-yj-surface', 'glass')
    const explorer = screen.getAllByRole('tree')[0]!
    const first = screen.getAllByRole('button', { pressed: true })[0]!
    expect(explorer).toHaveAccessibleName(first.textContent!)
    const other = screen.getAllByRole('button', { pressed: false }).find((b) => b.hasAttribute('data-yj-trigger'))!
    await user.click(other)
    expect(other).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByRole('tree')[0]).toHaveAccessibleName(other.textContent!)
  })

  test('the explorer follows a page reached from elsewhere and opens its branches', () => {
    const { rerender } = render(<Frame kind="glass" frame={{ nav: DOCS_NAV, active: 'overview' }} />)
    rerender(<Frame kind="glass" frame={{ nav: DOCS_NAV, active: 'rollback-instant' }} />)
    expect(screen.getByRole('treeitem', { name: 'Rollbacks' })).toHaveAttribute('aria-expanded', 'true')
    expect(link('Instant rollback')).toHaveAttribute('aria-current', 'page')
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

  test.each(Object.keys(SIDEBARS) as Kind[])('the %s sidebar is a sheet, and following a page closes it', async (kind) => {
    const user = userEvent.setup()
    render(<Frame kind={kind} frame={{ defaultActive: 'inbox' }} />)
    await user.click(trigger())
    const sheet = await screen.findByRole('dialog', { name: 'Sidebar' })
    const page = within(sheet).queryByRole('link', { name: /^My tasks/ }) ?? within(sheet).getByRole('treeitem', { name: /^My tasks/ })
    await user.click(page)
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Sidebar' })).not.toBeInTheDocument())
    expect(heading()).toHaveTextContent('My tasks')
  })

  test('the resizable edge isn’t drawn on a phone', async () => {
    render(<Frame kind="classic" />)
    expect(screen.queryByRole('separator', { name: 'Resize sidebar' })).not.toBeInTheDocument()
  })

  test('the icon rail is the bottom tab bar, whose Menu opens the whole nav', async () => {
    const user = userEvent.setup()
    render(<Frame kind="icon-rail" />)
    const bar = document.querySelector<HTMLElement>('[data-slot=frame-tab-bar]')!
    expect(within(bar).getByRole('link', { name: /^Inbox/ })).toBeInTheDocument()
    await user.click(within(bar).getByRole('button', { name: 'Menu' }))
    const sheet = await screen.findByRole('dialog', { name: 'Sidebar' })
    expect(within(sheet).getByRole('link', { name: /^Members/ })).toBeInTheDocument()
  })

  test('the rail + panel sheet keeps its rail beside the panel', async () => {
    const user = userEvent.setup()
    render(<Frame kind="rail-panel" />)
    await user.click(trigger())
    const sheet = await screen.findByRole('dialog', { name: 'Sidebar' })
    await user.click(within(sheet).getByRole('button', { name: 'Admin' }))
    expect(within(sheet).getByRole('button', { name: 'Admin' })).toHaveAttribute('aria-pressed', 'true')
    // Pressing the shown section again doesn't close a phone's sheet.
    await user.click(within(sheet).getByRole('button', { name: 'Admin' }))
    expect(within(sheet).getByRole('treeitem', { name: 'Members' })).toBeInTheDocument()
  })

  test('in the classic sheet, Escape clears the filter before it closes the sheet', async () => {
    const user = userEvent.setup()
    render(<Frame kind="classic" />)
    await user.click(trigger())
    const sheet = await screen.findByRole('dialog', { name: 'Sidebar' })
    await user.type(within(sheet).getByRole('searchbox', { name: 'Filter pages' }), 'cal')
    await user.keyboard('{Escape}')
    expect(within(sheet).getByRole('searchbox', { name: 'Filter pages' })).toHaveValue('')
    expect(screen.getByRole('dialog', { name: 'Sidebar' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Sidebar' })).not.toBeInTheDocument())
  })
})
