import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { FrameAccountCard } from './account-card'
import { AppFrame } from './shell'
import { NAV, TEAMS, USER } from './shell/data'
import { FrameSidebarClassic } from './sidebar-classic'
import { FrameSidebarGlass } from './sidebar-glass'
import { FrameSidebarIconRail } from './sidebar-icon-rail'
import { FrameSidebarRailPanel } from './sidebar-rail-panel'
import { FrameSidebarWorkspace } from './sidebar-workspace'
import { FrameTopbarBreadcrumb } from './topbar-breadcrumb'
import { FrameUpgradeCard } from './upgrade-card'
import { FrameWorkspace } from './workspace'

/* The sidebar signature as behaviour: every frame sidebar sets its content
 * on one chrome tone plane (Classic's the white paper, on a phone's sheet
 * too; Workspace's the gray chrome), the frame has its own paper behind its
 * parts, and a page's icon plays once as its page becomes current, but never
 * on the first paint and never under reduced motion. */

const SIDEBARS = {
  classic: FrameSidebarClassic,
  workspace: FrameSidebarWorkspace,
  'rail-panel': FrameSidebarRailPanel,
  'icon-rail': FrameSidebarIconRail,
  glass: FrameSidebarGlass,
}
type Kind = keyof typeof SIDEBARS

function Frame({ kind, reduced = 'always', active }: { kind: Kind; reduced?: 'always' | 'never'; active?: string }) {
  const Sidebar = SIDEBARS[kind]
  return (
    <YoujProvider reducedMotion={reduced}>
      <AppFrame
        nav={NAV}
        active={active}
        sidebar={
          <Sidebar
            header={<FrameWorkspace teams={TEAMS} />}
            footer={
              <>
                <FrameUpgradeCard />
                <FrameAccountCard user={USER} />
              </>
            }
          />
        }
        topbar={<FrameTopbarBreadcrumb />}
      >
        <h1>Page</h1>
      </AppFrame>
    </YoujProvider>
  )
}

/** The paper a sidebar's pages sit on: the nearest frame paper around them. */
const paperOf = (el: Element) => el.closest('[data-slot=frame-sidebar-paper]')
const expectPaper = (paper: Element | null) => {
  expect(paper).toHaveAttribute('data-yj-tone', 'chrome')
  // The chrome role, in a scope whose page is the white plane: white in light, the page in dark.
  expect(paper).toHaveClass('bg-chrome', '[--yj-neutral-page:1]')
}

describe.each(Object.keys(SIDEBARS) as Kind[])('the %s sidebar', (kind) => {
  test('sets its pages, header and foot on one chrome plane', () => {
    render(<Frame kind={kind} />)
    const pages = screen.getByRole('navigation', { name: kind === 'rail-panel' ? 'General' : 'Pages' })
    const paper = paperOf(pages)
    expect(paper).toHaveAttribute('data-yj-tone', 'chrome')
    if (kind === 'classic') expectPaper(paper)
    if (kind === 'workspace') expect(paper).toHaveClass('bg-chrome')
    // The paper holds the whole sidebar: its header and its foot too.
    expect(paper).toContainElement(document.querySelector('[data-slot=workspace-switcher-trigger]') as HTMLElement)
    expect(paper).toContainElement(document.querySelector('[data-slot=frame-account-card]') as HTMLElement)
  })
})

test('the frame lies on its own paper, behind its parts and out of reach', () => {
  render(<Frame kind="classic" />)
  const paper = document.querySelector('[data-slot=app-frame-paper]')
  expect(paper).toHaveAttribute('aria-hidden', 'true')
  expectPaper(paper)
  expect(paper).toHaveClass('pointer-events-none', 'absolute', 'inset-0')
  // First in the frame, so every part paints over it.
  expect(paper!.parentElement!.firstElementChild).toBe(paper)
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

  test('the phone’s sheet wears the same paper', async () => {
    const user = userEvent.setup()
    render(<Frame kind="classic" />)
    await user.click(screen.getByRole('button', { name: 'Toggle sidebar' }))
    const sheet = await screen.findByRole('dialog', { name: 'Sidebar' })
    expectPaper(paperOf(within(sheet).getByRole('navigation', { name: 'Pages' })))
  })
})

describe('a page’s icon', () => {
  const icon = (name: string) => screen.getByRole('link', { name: new RegExp(`^${name}`) }).querySelector('svg')!

  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
  afterEach(() => vi.useRealTimers())

  // The page changes from outside the sidebar (the router, the palette), so neither the pointer nor focus is on the row.
  test.each(['classic', 'workspace', 'rail-panel', 'icon-rail', 'glass'] as const)(
    'in the %s sidebar it plays once as its page becomes current, and not on the first paint',
    async (kind) => {
      const { rerender } = render(<Frame kind={kind} reduced="never" active="overview" />)
      const svg = (name: string) =>
        (
          screen.queryAllByRole('link', { name: new RegExp(`^${name}`) }).find((el) => !el.closest('[data-slot=frame-tab-bar]')) ??
          screen.getByRole('treeitem', { name: new RegExp(`^${name}`) })
        ).querySelector('svg')!
      // Overview is current from the start: it doesn't flourish.
      expect(svg('Overview')).toHaveAttribute('data-state', 'rest')
      rerender(<Frame kind={kind} reduced="never" active="inbox" />)
      expect(svg('Inbox')).toHaveAttribute('data-state', 'active')
      expect(svg('Overview')).toHaveAttribute('data-state', 'rest')
      // Its choreography plays out, then it's back on its row's hover.
      await act(() => vi.advanceTimersByTimeAsync(2000))
      expect(svg('Inbox')).toHaveAttribute('data-state', 'rest')
    },
  )

  test('a click that makes the page current plays it too', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<Frame kind="classic" reduced="never" />)
    await user.click(screen.getByRole('link', { name: /^Inbox/ }))
    expect(icon('Inbox')).toHaveAttribute('data-state', 'active')
  })

  test('rests under reduced motion', () => {
    const { rerender } = render(<Frame kind="classic" reduced="always" active="overview" />)
    rerender(<Frame kind="classic" reduced="always" active="inbox" />)
    expect(icon('Inbox')).toHaveAttribute('data-state', 'rest')
  })
})
