import type { ComponentType } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { AppFrame, useFrame, type AppFrameProps, type FrameSidebarSlots } from './shell'
import { ADMIN_NAV } from '../../docs/demo-navs'
import { NAV } from './shell/data'
import { FrameSidebarRailPanel } from './sidebar-rail-panel'
import { FrameSidebarWorkspace, type FrameSidebarWorkspaceProps } from './sidebar-workspace'
import { FrameTopbarBreadcrumb } from './topbar-breadcrumb'

/* What Workspace and Rail + panel's drill-down do that the others don't:
 * the command field and its go-to keys, the folding spaces, pinned tiles,
 * live state and the setup card, and the drill-down's levels and path at any
 * depth. The shared behavior (nav, current page, collapse, reduced motion,
 * server render, the phone's sheet) is in sidebars.test.tsx. Reduced motion
 * throughout. */

function Page() {
  const { trail } = useFrame()
  return <h1>{(trail?.child ?? trail?.item)?.label}</h1>
}

function Frame({ sidebar: Sidebar, frame }: { sidebar: ComponentType<FrameSidebarSlots>; frame?: Partial<AppFrameProps> }) {
  return (
    <YoujProvider reducedMotion="always">
      <AppFrame nav={NAV} sidebar={<Sidebar />} topbar={<FrameTopbarBreadcrumb />} {...frame}>
        <Page />
      </AppFrame>
    </YoujProvider>
  )
}

const workspace = (props: Partial<FrameSidebarWorkspaceProps>) => (slots: FrameSidebarSlots) => <FrameSidebarWorkspace {...slots} {...props} />

const link = (name: string) => screen.getByRole('link', { name: new RegExp(`^${name}`) })
const button = (name: string | RegExp) => screen.getByRole('button', { name })
const trigger = () => button('Toggle sidebar')
const heading = () => screen.getByRole('heading', { level: 1 })

describe('FrameSidebarWorkspace: the command field', () => {
  const field = () => screen.getByRole('combobox', { name: 'Search pages and actions' })

  test('typing ranks pages in a listbox the field drives; ↓ and ↵ go, and the nav comes back', async () => {
    const user = userEvent.setup()
    render(<Frame sidebar={FrameSidebarWorkspace} />)
    await user.type(field(), 're')
    const results = screen.getByRole('listbox', { name: 'Results' })
    expect(within(results).getAllByRole('option').map((o) => o.textContent)).toEqual([expect.stringMatching(/^Reports/), expect.stringMatching(/^Borealis/)])
    expect(field()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('2 pages', { selector: '[role=status]' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Pages' })).not.toBeInTheDocument()

    const first = within(results).getAllByRole('option')[0]!
    expect(field()).toHaveAttribute('aria-activedescendant', first.id)
    await user.keyboard('{ArrowDown}{Enter}')
    expect(heading()).toHaveTextContent('Borealis')
    expect(field()).toHaveValue('')
    expect(link('Borealis')).toHaveAttribute('aria-current', 'page')
  })

  test('Escape clears the field; nothing matching says so', async () => {
    const user = userEvent.setup()
    render(<Frame sidebar={FrameSidebarWorkspace} />)
    await user.type(field(), 'zebra')
    expect(screen.getByText('No pages match “zebra”', { selector: 'p' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(field()).toHaveValue('')
    expect(await screen.findByRole('link', { name: /^Overview/ })).toBeInTheDocument()
  })

  test('↓ in the empty field lists where you have been, then the actions, which run', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<Frame sidebar={workspace({ actions: [{ id: 'invite', label: 'Invite people', onSelect }] })} />)
    await user.click(link('Inbox'))
    await user.click(link('Reports'))
    await user.click(field())
    await user.keyboard('{ArrowDown}')
    const recent = screen.getByRole('group', { name: 'Recent' })
    expect(within(recent).getAllByRole('option').map((o) => o.textContent)).toEqual([expect.stringMatching(/^Inbox/), expect.stringMatching(/^Overview/)])
    await user.click(within(screen.getByRole('group', { name: 'Actions' })).getByRole('option', { name: /Invite people/ }))
    expect(onSelect).toHaveBeenCalledOnce()
  })

  test('G then a page’s key goes there, and / focuses the field, even folded', async () => {
    const user = userEvent.setup()
    render(<Frame sidebar={FrameSidebarWorkspace} frame={{ defaultCollapsed: true }} />)
    expect(link('Inbox')).toHaveAttribute('aria-keyshortcuts', 'G I')
    expect(link('Members')).toHaveAttribute('aria-keyshortcuts', 'G E')
    await user.keyboard('gi')
    expect(heading()).toHaveTextContent('Inbox')
    await user.keyboard('/')
    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    await waitFor(() => expect(field()).toHaveFocus())
    // Typed into the field, G is just a letter.
    await user.keyboard('gr')
    expect(heading()).toHaveTextContent('Inbox')
  })

  test('takes its strings from your app', () => {
    render(<Frame sidebar={workspace({ copy: { search: 'Seiten suchen', placeholder: 'Suchen…' } })} />)
    expect(screen.getByRole('combobox', { name: 'Seiten suchen' })).toHaveAttribute('placeholder', 'Suchen…')
  })
})

describe('FrameSidebarWorkspace: spaces, tiles, live state and setup', () => {
  const spaced = NAV.map((s) => (s.id === 'workspace' ? { ...s, collapsible: true } : s))

  test('a collapsible section is a space: it folds, shows its total, and folded over the current page it wears the key', async () => {
    const user = userEvent.setup()
    const counted = spaced.map((s) => (s.id === 'workspace' ? { ...s, items: s.items.map((i) => (i.id === 'calendar' ? { ...i, badge: 7 } : i)) } : s))
    render(<Frame sidebar={FrameSidebarWorkspace} frame={{ nav: counted, defaultActive: 'documents' }} />)
    const space = button(/^Workspace/)
    expect(space).toHaveAttribute('aria-expanded', 'true')
    expect(document.getElementById(space.getAttribute('aria-controls')!)).toContainElement(link('Documents'))
    await user.click(space)
    expect(space).toHaveAttribute('aria-expanded', 'false')
    expect(space).toHaveTextContent('7')
    expect(space).toHaveAttribute('data-active')
    await user.click(space)
    expect(space).not.toHaveAttribute('data-active')
  })

  test('folded to icons every space opens, so every page stays in reach', async () => {
    const user = userEvent.setup()
    render(<Frame sidebar={FrameSidebarWorkspace} frame={{ nav: spaced }} />)
    await user.click(button(/^Workspace/))
    expect(button(/^Workspace/)).toHaveAttribute('aria-expanded', 'false')
    await user.click(trigger())
    expect(button(/^Workspace/)).toHaveAttribute('aria-expanded', 'true')
  })

  test('pinned pages are tiles, each page listed once; a danger count is loud', () => {
    const loud = NAV.map((s) => ({ ...s, items: s.items.map((i) => (i.id === 'tasks' ? { ...i, badgeTone: 'danger' as const } : i)) }))
    render(<Frame sidebar={workspace({ pinned: ['overview', 'inbox'] })} frame={{ nav: loud }} />)
    const pinned = screen.getByRole('list', { name: 'Pinned' })
    expect(within(pinned).getAllByRole('link').map((a) => a.textContent)).toEqual(['Overview', 'Inbox, 4 unread'])
    expect(screen.getAllByRole('link', { name: /^Inbox/ })).toHaveLength(1)
    expect(document.querySelector('[data-slot=sidebar-menu-badge][data-tone=danger]')).toHaveTextContent('12')
  })

  test('what needs you links to its page; clearing one takes it off, and none left says so', async () => {
    const user = userEvent.setup()
    const onSignalClear = vi.fn()
    const signals = [
      { id: 's1', page: 'inbox', title: 'Mira mentioned you', priority: 'urgent' as const, time: '2m' },
      { id: 's2', page: 'borealis', title: 'Review requested', priority: 'high' as const, time: '18m' },
    ]
    render(<Frame sidebar={workspace({ signals, onSignalClear })} />)
    const needs = screen.getByRole('list', { name: 'Needs you' })
    expect(within(needs).getAllByRole('link')).toHaveLength(2)
    await user.click(button('Clear: Review requested'))
    expect(onSignalClear).toHaveBeenCalledWith('s2')
    await user.click(within(needs).getByRole('link', { name: /^Mira mentioned you/ }))
    expect(heading()).toHaveTextContent('Inbox')
    expect(await screen.findByText('You’re all caught up')).toBeInTheDocument()
  })

  test('a page’s live state is read after its name', () => {
    const activity = { reports: { live: true }, calendar: { unread: true }, documents: { people: [{ id: 'a', name: 'Ada Park' }] } }
    render(<Frame sidebar={workspace({ activity })} />)
    expect(link('Reports')).toHaveAccessibleName('Reports, live')
    expect(link('Calendar')).toHaveAccessibleName('Calendar, new')
    expect(link('Documents')).toHaveAccessibleName('Documents, Ada Park here')
  })

  test('the setup card says how far along it is, and Skip and Next reach the app', async () => {
    const user = userEvent.setup()
    const onSetupNext = vi.fn()
    const onSetupSkip = vi.fn()
    render(<Frame sidebar={workspace({ setup: { title: 'Connect the front desk', done: 3, total: 4 }, onSetupNext, onSetupSkip })} />)
    const card = screen.getByRole('region', { name: 'Connect the front desk' })
    expect(within(card).getByRole('img', { name: 'Setup: 3 of 4 steps done' })).toBeInTheDocument()
    await user.click(within(card).getByRole('button', { name: 'Next' }))
    await user.click(within(card).getByRole('button', { name: 'Skip' }))
    expect(onSetupNext).toHaveBeenCalledOnce()
    expect(onSetupSkip).toHaveBeenCalledOnce()
  })
})

describe('FrameSidebarRailPanel: panel="drill"', () => {
  const Drill = (props: FrameSidebarSlots) => <FrameSidebarRailPanel {...props} panel="drill" />
  const level = () => screen.getByRole('heading', { level: 3 })

  test('opens on the current page’s level, goes back to the section, and deeper again', async () => {
    const user = userEvent.setup()
    render(<Frame sidebar={Drill} frame={{ defaultActive: 'borealis' }} />)
    expect(level()).toHaveTextContent('Projects')
    expect(link('Borealis')).toHaveAttribute('aria-current', 'page')

    await user.click(button('Back to Workspace'))
    await waitFor(() => expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument())
    // The way in that holds the current page wears the key and names it.
    expect(button(/^Projects/)).toHaveAttribute('data-active')
    expect(button(/^Projects/)).toHaveAccessibleName('Projects, Borealis')
    await user.click(button(/^Projects/))
    await waitFor(() => expect(level()).toHaveTextContent('Projects'))
    await user.click(link('Cirrus'))
    expect(heading()).toHaveTextContent('Cirrus')
  })

  test('→ goes in and focus lands on the new level; ← comes back to the row you left', async () => {
    const user = userEvent.setup()
    render(<Frame sidebar={Drill} frame={{ defaultActive: 'calendar' }} />)
    button(/^Projects/).focus()
    await user.keyboard('{ArrowRight}')
    await waitFor(() => expect(level()).toHaveTextContent('Projects'))
    await waitFor(() => expect(link('Atlas')).toHaveFocus())
    await user.keyboard('{ArrowLeft}')
    await waitFor(() => expect(button(/^Projects/)).toHaveFocus())
  })

  test('goes as deep as the nav, names the whole path, and jumps straight up any number of levels', async () => {
    const user = userEvent.setup()
    render(<Frame sidebar={Drill} frame={{ nav: ADMIN_NAV, defaultActive: 'design-projects' }} />)
    expect(level()).toHaveTextContent('Design')
    const path = screen.getByRole('list', { name: 'Path' })
    const steps = within(path).getAllByRole('button').map((b) => b.textContent)
    expect(steps.length).toBeGreaterThanOrEqual(2)
    expect(link('Projects')).toHaveAttribute('aria-current', 'page')
    await user.click(within(path).getAllByRole('button')[0]!)
    await waitFor(() => expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument())
  })

  test('takes the path’s and the back button’s strings from copy', () => {
    const German = (props: FrameSidebarSlots) => <FrameSidebarRailPanel {...props} panel="drill" copy={{ path: 'Pfad', back: (to: string) => `Zurück zu ${to}` }} />
    render(<Frame sidebar={German} frame={{ defaultActive: 'borealis' }} />)
    expect(screen.getByRole('list', { name: 'Pfad' })).toBeInTheDocument()
    expect(button('Zurück zu Workspace')).toBeInTheDocument()
  })
})

describe('below md', () => {
  const matchMedia = window.matchMedia
  beforeEach(() => {
    window.matchMedia = (query: string) =>
      ({ matches: query.includes('max-width: 767px'), media: query, addEventListener: () => {}, removeEventListener: () => {} }) as unknown as MediaQueryList
  })
  afterEach(() => {
    window.matchMedia = matchMedia
  })

  test('in the workspace sheet, Escape clears the field before it closes the sheet', async () => {
    const user = userEvent.setup()
    render(<Frame sidebar={FrameSidebarWorkspace} />)
    await user.click(trigger())
    const sheet = await screen.findByRole('dialog', { name: 'Sidebar' })
    await user.type(within(sheet).getByRole('combobox'), 'cal')
    await user.keyboard('{Escape}')
    expect(within(sheet).getByRole('combobox')).toHaveValue('')
    expect(screen.getByRole('dialog', { name: 'Sidebar' })).toBeInTheDocument()
  })
})
