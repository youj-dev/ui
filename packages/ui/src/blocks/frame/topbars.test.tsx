import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { AppFrame, useFrame, type AppFrameProps } from './shell'
import { NAV } from './shell/data'
import { FrameSearchPalette } from './search-palette'
import { FrameSidebarClassic } from './sidebar-classic'
import { FrameTopbarBreadcrumb } from './topbar-breadcrumb'
import { FrameTopbarMinimal } from './topbar-minimal'
import { FrameTopbarSearch } from './topbar-search'
import { FrameTopbarTabs } from './topbar-tabs'

/* The three top bars: what each names, where the slots land, the tabs'
 * views as links with the current one marked, and each bar's sticky,
 * condensing header. Reduced motion throughout, as in frame.test.tsx. */

function Page() {
  const { trail } = useFrame()
  return <h1>{(trail?.child ?? trail?.item)?.label}</h1>
}

function Frame({ topbar, frame, reduced = true }: { topbar: ReactNode; frame?: Partial<AppFrameProps>; reduced?: boolean }) {
  return (
    <YoujProvider reducedMotion={reduced ? 'always' : 'never'}>
      <AppFrame nav={NAV} sidebar={<FrameSidebarClassic />} topbar={topbar} {...frame}>
        <Page />
      </AppFrame>
    </YoujProvider>
  )
}

const bar = (kind: string) => document.querySelector<HTMLElement>(`[data-yj-frame-topbar=${kind}]`)!
const views = () => screen.getByRole('navigation', { name: 'Views' })
const view = (name: string | RegExp) => within(views()).getByRole('link', { name })

describe('FrameTopbarTabs', () => {
  test('names the page (not as a heading) over its views, the first one current', () => {
    render(<Frame topbar={<FrameTopbarTabs />} frame={{ defaultActive: 'atlas' }} />)
    expect(bar('tabs').tagName).toBe('HEADER')
    expect(bar('tabs')).toHaveAttribute('data-sticky')
    expect(within(bar('tabs')).getByText('Atlas')).toBeInTheDocument()
    expect(within(bar('tabs')).queryByRole('heading')).not.toBeInTheDocument()
    expect(within(views()).getAllByRole('link').map((l) => l.textContent)).toEqual(['Overview', 'Activity', 'Issues 24', 'Insights', 'Settings'])
    expect(view('Overview')).toHaveAttribute('aria-current', 'page')
    expect(view('Issues 24')).toBeInTheDocument()
  })

  test('a view is followed in place, by pointer or keyboard, and reported', async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    render(<Frame topbar={<FrameTopbarTabs onViewChange={onViewChange} />} />)
    await user.click(view('Activity'))
    expect(view('Activity')).toHaveAttribute('aria-current', 'page')
    expect(view('Overview')).not.toHaveAttribute('aria-current')
    expect(onViewChange).toHaveBeenLastCalledWith('activity', expect.anything())
    expect(window.location.hash).toBe('')

    view('Insights').focus()
    await user.keyboard('{Enter}')
    expect(view('Insights')).toHaveAttribute('aria-current', 'page')
    expect(onViewChange).toHaveBeenLastCalledWith('insights', expect.anything())

    // The current view again reports nothing.
    await user.click(view('Insights'))
    expect(onViewChange).toHaveBeenCalledTimes(2)
  })

  test('each page starts on its first view', async () => {
    const user = userEvent.setup()
    render(<Frame topbar={<FrameTopbarTabs />} />)
    await user.click(view('Issues 24'))
    await user.click(screen.getByRole('link', { name: /^Calendar/ }))
    expect(screen.getByRole('heading', { level: 1, name: 'Calendar' })).toBeInTheDocument()
    expect(within(bar('tabs')).getByText('Calendar')).toBeInTheDocument()
    expect(view('Overview')).toHaveAttribute('aria-current', 'page')
  })

  test('takes your views, and follows `view` when you keep it', async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    const views = [
      { id: 'code', label: 'Code' },
      { id: 'prs', label: 'Pull requests', count: 3 },
      { id: 'docs', label: 'Docs', href: '/docs' },
    ]
    const { rerender } = render(<Frame topbar={<FrameTopbarTabs views={views} view="prs" onViewChange={onViewChange} />} />)
    expect(view('Pull requests 3')).toHaveAttribute('aria-current', 'page')
    expect(view('Code')).toHaveAttribute('href', '#view-code')
    expect(view('Docs')).toHaveAttribute('href', '/docs')
    await user.click(view('Code'))
    expect(onViewChange).toHaveBeenCalledWith('code', expect.anything())
    expect(view('Pull requests 3')).toHaveAttribute('aria-current', 'page')
    rerender(<Frame topbar={<FrameTopbarTabs views={views} view="code" onViewChange={onViewChange} />} />)
    expect(view('Code')).toHaveAttribute('aria-current', 'page')
  })

  test('a view with an href is a link: you route it, and a ⌘-click leaves this page as it is', async () => {
    const user = userEvent.setup()
    const views = [
      { id: 'overview', label: 'Overview', href: '#/atlas' },
      { id: 'activity', label: 'Activity', href: '#/atlas/activity' },
    ]
    const onViewChange = vi.fn((_id: string, event: { preventDefault: () => void }) => event.preventDefault())
    render(<Frame topbar={<FrameTopbarTabs views={views} onViewChange={onViewChange} />} />)
    await user.keyboard('{Meta>}')
    await user.click(view('Activity'))
    await user.keyboard('{/Meta}')
    expect(onViewChange).not.toHaveBeenCalled()
    expect(view('Overview')).toHaveAttribute('aria-current', 'page')

    await user.click(view('Activity'))
    expect(onViewChange).toHaveBeenCalledWith('activity', expect.objectContaining({ defaultPrevented: true }))
    expect(view('Activity')).toHaveAttribute('aria-current', 'page')
    // jsdom follows the ⌘-click in place (a browser opens a tab): put the URL back.
    history.replaceState(null, '', location.pathname)
  })

  test('slots land in the first row: search, actions, then the account', () => {
    render(
      <Frame
        topbar={<FrameTopbarTabs search={<FrameSearchPalette />} actions={<button type="button">Bell</button>} account={<button type="button">Me</button>} />}
      />,
    )
    const row = bar('tabs').querySelector<HTMLElement>('[data-slot=frame-topbar-row]')!
    expect(within(row).getAllByRole('button').map((b) => b.getAttribute('aria-label') ?? b.textContent)).toEqual(['Toggle sidebar', 'Search', 'Bell', 'Me'])
  })

  test('the trigger steps aside on phones when the tab bar has Menu', () => {
    render(<Frame topbar={<FrameTopbarTabs />} frame={{ mobileNav: 'tabs' }} />)
    expect(within(bar('tabs')).getByRole('button', { name: 'Toggle sidebar' })).toHaveClass('max-md:hidden')
  })

  test('keeps the current view in sight on a scroller: smoothly with motion, at once when reduced', async () => {
    const user = userEvent.setup()
    for (const reduced of [false, true]) {
      const { unmount } = render(<Frame topbar={<FrameTopbarTabs />} reduced={reduced} />)
      const nav = views()
      Object.defineProperty(nav, 'scrollWidth', { configurable: true, value: 600 })
      Object.defineProperty(nav, 'clientWidth', { configurable: true, value: 300 })
      const scrollBy = vi.fn()
      nav.scrollBy = scrollBy as unknown as typeof nav.scrollBy
      await user.click(view('Settings'))
      expect(scrollBy).toHaveBeenCalledWith(expect.objectContaining({ behavior: reduced ? 'auto' : 'smooth' }))
      unmount()
    }
  })

  test('under reduced motion the header says so, so its condense is instant', () => {
    render(<Frame topbar={<FrameTopbarTabs />} />)
    expect(bar('tabs')).toHaveAttribute('data-reduced-motion')
  })
})

describe('a bar that names the page', () => {
  test('marks itself, so the frame folds a page title that would repeat it; the breadcrumb only places the page', () => {
    const titled = [
      ['minimal', <FrameTopbarMinimal key="minimal" />],
      ['search', <FrameTopbarSearch key="search" />],
      ['tabs', <FrameTopbarTabs key="tabs" />],
    ] as const
    for (const [kind, topbar] of titled) {
      const { unmount } = render(<Frame topbar={topbar} />)
      expect(bar(kind)).toHaveAttribute('data-yj-frame-titled')
      unmount()
    }
    render(<Frame topbar={<FrameTopbarBreadcrumb />} />)
    expect(bar('breadcrumb')).not.toHaveAttribute('data-yj-frame-titled')
  })
})

describe('FrameTopbarSearch', () => {
  test('the search sits in the centre, between the page and the actions', () => {
    render(
      <Frame
        topbar={<FrameTopbarSearch search={<FrameSearchPalette />} actions={<button type="button">Bell</button>} account={<button type="button">Me</button>} />}
        frame={{ defaultActive: 'inbox' }}
      />,
    )
    const [start, centre, end] = Array.from(bar('search').children) as HTMLElement[]
    expect(within(start!).getByRole('button', { name: 'Toggle sidebar' })).toBeInTheDocument()
    expect(within(start!).getByText('Inbox')).toBeInTheDocument()
    expect(within(centre!).getByRole('button', { name: 'Search' })).toHaveAttribute('data-frame-search', 'palette')
    expect(within(end!).getAllByRole('button').map((b) => b.textContent)).toEqual(['Bell', 'Me'])
  })

  test('with no search, the page takes the centre (wide screens) and keeps the start (phones)', () => {
    render(<Frame topbar={<FrameTopbarSearch />} frame={{ defaultActive: 'reports' }} />)
    const [start, centre] = Array.from(bar('search').children) as HTMLElement[]
    expect(within(centre!).getByText('Reports')).toHaveClass('max-md:hidden')
    expect(within(start!).getByText('Reports')).toHaveClass('md:hidden')
  })
})

describe('FrameTopbarMinimal', () => {
  test('the page set large, then search, actions, one primary action (New) and the account', () => {
    render(
      <Frame
        topbar={<FrameTopbarMinimal search={<FrameSearchPalette />} actions={<button type="button">Bell</button>} account={<button type="button">Me</button>} />}
        frame={{ defaultActive: 'tasks' }}
      />,
    )
    expect(within(bar('minimal')).getByText('My tasks')).toHaveClass('text-lg')
    expect(within(bar('minimal')).getAllByRole('button').map((b) => b.getAttribute('aria-label') ?? b.textContent)).toEqual([
      'Toggle sidebar',
      'Search',
      'Bell',
      'New',
      'Me',
    ])
  })

  test('the primary action is yours, or none', () => {
    const { rerender } = render(<Frame topbar={<FrameTopbarMinimal primary={<button type="button">Invite</button>} />} />)
    expect(within(bar('minimal')).getByRole('button', { name: 'Invite' })).toBeInTheDocument()
    expect(within(bar('minimal')).queryByRole('button', { name: 'New' })).not.toBeInTheDocument()
    rerender(<Frame topbar={<FrameTopbarMinimal primary={null} />} />)
    expect(within(bar('minimal')).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Toggle sidebar'])
  })
})
