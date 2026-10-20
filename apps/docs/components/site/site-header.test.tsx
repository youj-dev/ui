import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RootProvider } from 'fumadocs-ui/provider/base'
import type { HeaderNav } from '@/lib/nav'
import { pageIndex } from '@/lib/page-index'
import { communityLinks, site } from '@/lib/project'
import { activeSection, SiteHeader } from './site-header'

const path = vi.hoisted(() => ({ current: '/docs' }))
vi.mock('next/navigation', () => ({ usePathname: () => path.current, useRouter: () => ({ push: () => {}, prefetch: () => {} }) }))

const loadSearch = vi.hoisted(() => vi.fn())
vi.mock('@/components/site/search-seed', () => ({ loadSearch }))

const nav: HeaderNav = {
  pages: pageIndex([
    '/',
    '/icons',
    '/illustrations',
    '/loaders',
    '/docs',
    '/docs/guides',
    '/docs/theming',
    '/docs/components',
    '/docs/components/actions',
    '/docs/components/button',
    '/docs/motion',
    '/docs/motion/playground',
    '/docs/sound',
    '/docs/sound/api',
    '/docs/components-extra',
    '/docs/components/data-and-tables',
    '/docs/components/table',
    '/docs/blocks/activity-and-conversations',
    '/docs/blocks/media',
    '/docs/blocks/checkout',
    '/create',
  ]),
  menus: [
    {
      id: 'docs',
      label: 'Docs',
      href: '/docs',
      links: [
        { title: 'Get started', url: '/docs', description: 'Install the kit', glyph: 'docs' },
        { title: 'Guides', url: '/docs/guides', description: 'Recipes', glyph: 'guides' },
        { title: 'Loaders', url: '/docs/loaders', description: 'Loading', glyph: 'loaders', status: 'experimental' },
      ],
      feature: { title: 'Start here', url: '/docs/installation', description: 'One command.', cta: 'Install Youj', art: 'prompt' },
    },
    {
      id: 'components',
      label: 'Components',
      href: '/docs/components/button',
      links: [],
      columns: [
        {
          title: 'Components',
          url: '/docs/components',
          links: [
            ['Actions', 'actions'],
            ['Overlays', 'overlays'],
            ['Data & tables', 'data-and-tables'],
          ],
        },
      ],
      feature: { title: 'Every state designed', url: '/docs/components', description: 'Accessible.', cta: 'All components', art: 'tabstop' },
    },
    {
      id: 'blocks',
      label: 'Blocks',
      links: [
        { title: 'Cards', url: '/docs/blocks/activity-and-conversations', description: 'Cards', glyph: 'cards' },
        { title: 'Screens', url: '/docs/blocks/checkout', description: 'Screens', glyph: 'screens' },
      ],
      feature: { title: 'Build an app frame', url: '/create', description: 'Pick a frame.', cta: 'Create', art: 'gantry' },
    },
    {
      id: 'visuals',
      label: 'Visuals',
      links: [
        { title: 'Icons', url: '/icons', description: 'Icons', glyph: 'icons', art: 'tabstop', count: '511 icons' },
        { title: 'Loaders', url: '/loaders', description: 'Loading', glyph: 'loaders', art: 'draft', count: '229 loaders' },
      ],
      feature: { title: 'Every icon, searchable', url: '/icons', description: 'Preview and copy.', cta: 'Icon explorer', art: 'draft' },
    },
  ],
}

describe('activeSection', () => {
  it('marks Components on its groups and their pages, the composites’ included', () => {
    for (const url of ['/docs/components', '/docs/components/actions', '/docs/components/button', '/docs/components/data-and-tables', '/docs/components/table']) {
      expect(activeSection(url, nav), url).toBe('components')
    }
  })

  it('marks Blocks on every Blocks docs page and Create', () => {
    for (const url of ['/docs/blocks/activity-and-conversations', '/docs/blocks/media', '/docs/blocks/checkout', '/create']) expect(activeSection(url, nav), url).toBe('blocks')
  })

  it('marks Visuals on the explorers and galleries', () => {
    for (const url of ['/icons', '/loaders']) expect(activeSection(url, nav), url).toBe('visuals')
  })

  it('marks Docs on every other docs page', () => {
    for (const url of ['/docs', '/docs/guides', '/docs/sound/api']) expect(activeSection(url, nav), url).toBe('docs')
  })

  it('never matches part of a segment', () => {
    expect(activeSection('/docs/components-extra', nav)).toBe('docs')
  })

  it('marks nothing on the homepage, or on a URL the site does not have, as the prerendered 404 shows it', () => {
    expect(activeSection('/', nav)).toBeUndefined()
    expect(activeSection('/docsy', nav)).toBeUndefined()
    expect(activeSection('/docs/motion/does-not-exist', nav)).toBeUndefined()
  })
})

describe('communityLinks', () => {
  it('shows Discord, then GitHub, each only while it has somewhere to go', () => {
    const repo = site.links.github.url
    const discord = { url: 'https://discord.gg/example', comingSoon: false }
    expect(communityLinks({ discord, github: { url: repo, public: true, comingSoon: false } })).toEqual([
      { id: 'discord', label: 'Join the Discord', url: discord.url },
      { id: 'github', label: 'GitHub', url: repo },
    ])
    expect(communityLinks({ discord: undefined, github: { url: repo, public: true, comingSoon: false } })).toEqual([{ id: 'github', label: 'GitHub', url: repo }])
    expect(communityLinks({ discord: undefined, github: { url: repo, public: false, comingSoon: false } })).toEqual([])
  })

  it('marks a button "coming soon" per link, until its launch', () => {
    const repo = site.links.github.url
    const discord = { url: 'https://discord.gg/example', comingSoon: true }
    expect(communityLinks({ discord, github: { url: repo, public: true, comingSoon: false } }).map((link) => link.soon)).toEqual([true, undefined])
    expect(communityLinks({ discord, github: { url: repo, public: true, comingSoon: true } }).every((link) => link.soon)).toBe(true)
  })

  it('has GitHub live and Discord still say "coming soon"', () => {
    expect(communityLinks().map((link) => [link.id, link.soon])).toEqual([['discord', true], ['github', undefined]])
  })
})

describe('SiteHeader', () => {
  // The menus and the mobile drawer are chunks of their own on the site; have them in before the header renders.
  beforeAll(() => Promise.all([import('./desktop-nav'), import('./mobile-menu')]))

  const header = () =>
    render(
      <RootProvider theme={{ attribute: ['class', 'data-theme'], defaultTheme: 'dark', enableSystem: false }} search={{ enabled: false }}>
        <SiteHeader nav={nav} />
      </RootProvider>,
    )
  const panelOf = (link: HTMLElement) => link.closest<HTMLElement>('[data-slot=navigation-menu-content]')!

  beforeEach(() => {
    path.current = '/docs'
    localStorage.clear()
    // Left behind by the old site-wide switchers: nothing reads them now.
    localStorage.setItem('youj-site-preset', 'terminal')
    localStorage.setItem('youj-site-motion', JSON.stringify({ speed: 0.25, motion: 'reduce' }))
    document.documentElement.setAttribute('data-yj-theme', 'basalt')
  })
  afterEach(() => document.documentElement.removeAttribute('data-yj-theme'))

  it('holds no motion control and no theme menu: one button switches light and dark, and the site stays Basalt', async () => {
    const user = userEvent.setup()
    header()
    expect(screen.queryByRole('button', { name: /motion|speed/i })).toBeNull()
    const toggle = screen.getByRole('button', { name: 'Switch to light theme' })
    expect(toggle).not.toHaveAttribute('aria-haspopup')
    await user.click(toggle)
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument()
    expect(screen.queryByRole('radio')).toBeNull()
    expect(document.documentElement).toHaveAttribute('data-yj-theme', 'basalt')
  })

  it('has Docs and Components as links, then the Blocks and Visuals menus, and nothing else in the bar', async () => {
    header()
    const main = await screen.findByRole('navigation', { name: 'Main' })
    expect(within(main).getAllByRole('link').map((l) => l.textContent)).toEqual(['Docs', 'Components'])
    expect(within(main).getAllByRole('button').map((b) => b.textContent)).toEqual(['Blocks', 'Visuals'])
  })

  it('marks the current section on its link or trigger, and only there', async () => {
    path.current = '/docs/components/button'
    const { container } = header()
    const link = await screen.findByRole('link', { name: 'Components' })
    expect(link.querySelector('[aria-hidden]:not(svg)')).not.toBeNull()
    expect(container.querySelectorAll(':is([data-slot=navigation-menu-trigger], [data-slot=navigation-menu-link]) > span[aria-hidden]')).toHaveLength(1)
  })

  it('puts Search, Discord, GitHub, Sound, then light and dark on the right', () => {
    header()
    // GitHub is live; Discord is still a button that says "Coming soon".
    const discord = screen.getByRole('button', { name: 'Join the Discord: coming soon' })
    expect(discord).not.toHaveAttribute('href')
    expect(within(discord).getByText('Coming soon')).toHaveAttribute('aria-hidden', 'true')
    const github = screen.getByRole('link', { name: 'GitHub' })
    const order = [screen.getByRole('button', { name: 'Search docs' }), discord, github, screen.getByRole('button', { name: 'Sound' }), screen.getByRole('button', { name: 'Switch to light theme' })]
    for (let i = 1; i < order.length; i++) expect(order[i - 1]!.compareDocumentPosition(order[i]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('fetches the search palette when a hand reaches for its trigger, before the press that opens it', async () => {
    const user = userEvent.setup()
    header()
    expect(loadSearch).not.toHaveBeenCalled()
    await user.hover(screen.getByRole('button', { name: 'Search docs' }))
    expect(loadSearch).toHaveBeenCalled()
  })

  it('links Docs and Components straight to their first page, with no menu', async () => {
    header()
    const docs = await screen.findByRole('link', { name: 'Docs' })
    expect(docs).toHaveAttribute('href', '/docs')
    // This page is the docs' first: its link says so.
    expect(docs).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Components' })).toHaveAttribute('href', '/docs/components/button')
    expect(screen.queryByRole('button', { name: 'Docs' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Components' })).toBeNull()
  })

  it('draws a feature’s animation, live, only while its menu is open: a picture out of the link’s name, and no video', async () => {
    const user = userEvent.setup()
    header()
    expect(document.querySelector('[data-yj-loader]')).toBeNull()
    const trigger = await screen.findByRole('button', { name: 'Blocks' })
    await user.click(trigger)
    const feature = await screen.findByRole('link', { name: /Build an app frame/ })
    // Its code arrives with the menu (a chunk of its own), then it draws on the gallery's stage.
    const art = await waitFor(() => {
      const found = panelOf(feature).querySelector<HTMLElement>('[data-yj-loader="gantry"]')
      expect(found).not.toBeNull()
      return found!
    })
    expect(art).toHaveAttribute('aria-hidden', 'true')
    expect(art).not.toHaveAttribute('role')
    expect(art).not.toHaveAttribute('data-paused')
    expect(art.closest('.site-stage')).not.toBeNull()
    expect(feature).not.toContainElement(art)
    expect(document.querySelector('video, [data-promo-loop]')).toBeNull()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(document.querySelector('[data-yj-loader]')).toBeNull())
  })

  it('gives each menu its own animation: a gantry for Blocks, a drafting sheet for Visuals’ Loaders', async () => {
    const user = userEvent.setup()
    header()
    for (const [name, link, id] of [
      ['Blocks', /Build an app frame/, 'gantry'],
      ['Visuals', /Loaders/, 'draft'],
    ] as const) {
      const trigger = await screen.findByRole('button', { name })
      await user.hover(trigger)
      await user.click(trigger)
      const feature = await screen.findByRole('link', { name: link })
      await waitFor(() => expect(panelOf(feature).querySelector(`[data-yj-loader="${id}"]`)).not.toBeNull())
      await user.keyboard('{Escape}')
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'))
    }
  })

  it('opens Blocks on its docs groups, then Create, featured, at the end', async () => {
    const user = userEvent.setup()
    header()
    await user.click(await screen.findByRole('button', { name: 'Blocks' }))
    const panel = panelOf(await screen.findByRole('link', { name: /Build an app frame/ }))
    const links = within(panel).getAllByRole('link')
    expect(links.at(-1)).toHaveAttribute('href', '/create')
    expect(links.slice(0, -1).map((l) => l.getAttribute('href'))).toEqual(['/docs/blocks/activity-and-conversations', '/docs/blocks/checkout'])
  })

  it('opens Visuals on its galleries as even cards, with no count and no feature', async () => {
    const user = userEvent.setup()
    header()
    await user.click(await screen.findByRole('button', { name: 'Visuals' }))
    const panel = panelOf(await screen.findByRole('link', { name: /Loaders/ }))
    expect(within(panel).getAllByRole('link').map((l) => l.getAttribute('href'))).toEqual(['/icons', '/loaders'])
    expect(within(panel).getByRole('link', { name: /Icons/ })).not.toHaveTextContent('511 icons')
    expect(within(panel).queryByRole('link', { name: /Every icon, searchable/ })).toBeNull()
  })

  it('moves between the menus with the arrow keys, opens one from the keyboard, and Esc closes it back to its trigger', async () => {
    const user = userEvent.setup()
    header()
    const blocks = await screen.findByRole('button', { name: 'Blocks' })
    blocks.focus()
    await user.keyboard('{ArrowRight}')
    const visuals = screen.getByRole('button', { name: 'Visuals' })
    expect(visuals).toHaveFocus()
    await user.keyboard('{Enter}')
    await waitFor(() => expect(visuals).toHaveAttribute('aria-expanded', 'true'))
    expect(await screen.findByRole('link', { name: /Loaders/ })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(visuals).toHaveAttribute('aria-expanded', 'false'))
    expect(visuals).toHaveFocus()
  })

  it('keeps a menu hovering opened when its trigger is then clicked; the next click closes it', async () => {
    const user = userEvent.setup()
    header()
    const trigger = await screen.findByRole('button', { name: 'Visuals' })
    await user.hover(trigger)
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'))
    // Past Base UI's half-second "patient click" window, where a click alone would close it.
    await new Promise((resolve) => setTimeout(resolve, 600))
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await user.click(trigger)
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'))
  })

  it('gives the mobile menu the same four menus, as sections that open in place, the current one open', async () => {
    path.current = '/docs/blocks/checkout'
    const user = userEvent.setup()
    header()
    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    const dialog = await screen.findByRole('dialog', { name: 'Menu' })
    const main = within(dialog).getByRole('navigation', { name: 'Main' })
    const toggles = within(main).getAllByRole('button')
    expect(toggles.map((b) => [b.textContent, b.getAttribute('aria-expanded')])).toEqual([
      ['Docs', 'false'],
      ['Components', 'false'],
      ['Blocks', 'true'],
      ['Visuals', 'false'],
    ])
    expect(within(main).getByRole('link', { name: /^Create/ })).toHaveAttribute('href', '/create')
    expect(within(main).getByRole('link', { name: /^Screens/ })).toHaveAttribute('aria-current', 'page')
    await user.click(toggles[1]!)
    expect(toggles[1]).toHaveAttribute('aria-expanded', 'true')
    expect(await within(main).findByRole('link', { name: /^All components/ })).toHaveAttribute('href', '/docs/components')
    // No animations in the sheet: it stays light.
    expect(dialog.querySelector('[data-yj-loader], video')).toBeNull()
  })

  it('keeps light and dark in the header, and focuses the sheet, not search', async () => {
    const user = userEvent.setup()
    header()
    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    const dialog = await screen.findByRole('dialog', { name: 'Menu' })
    expect(within(dialog).queryByRole('group', { name: 'Appearance' })).toBeNull()
    // Behind the modal sheet, out of the accessibility tree while it's open.
    expect(screen.getByRole('button', { name: 'Switch to light theme', hidden: true })).toBeInTheDocument()
    await waitFor(() => expect(dialog).toHaveFocus())
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open menu' })).toHaveFocus())
  })

  it('sizes the header’s buttons for a thumb on touch, and pins search, the community links and sound to the bottom edge of the menu sheet', async () => {
    const user = userEvent.setup()
    header()
    // 32px under a pointer, 44px on touch (the variant is CSS; jsdom sees the class).
    for (const name of ['Search docs', 'Sound', 'Switch to light theme', 'Open menu']) {
      expect(screen.getByRole('button', { name }).className).toContain('touch:size-11')
    }
    expect(screen.getByRole('button', { name: 'Join the Discord: coming soon' }).className).toContain('touch:size-11')
    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    const dialog = await screen.findByRole('dialog', { name: 'Menu' })
    const search = within(dialog).getByRole('button', { name: /Search docs/ })
    // Last in the sheet and sticky, so it rests under the thumb however far the list is scrolled.
    const bar = search.parentElement!
    expect(bar).toHaveClass('sticky')
    expect(bar.nextElementSibling).toBeNull()
    const discord = within(bar).getByRole('button', { name: 'Join the Discord: coming soon' })
    await user.click(discord)
    expect(discord).toHaveAttribute('aria-expanded', 'true')
    expect(within(discord).getByText('Coming soon')).toHaveClass('opacity-100')
    expect(within(bar).getByRole('button', { name: 'Sound' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('fetches the docs tree for the mobile menu when it’s about to open, not with the page, and draws it', async () => {
    const tree = { name: 'Docs', children: [{ type: 'separator', name: 'Get started' }, { type: 'page', name: 'Installation', url: '/docs/installation' }] }
    const fetchTree = vi.fn(async () => Response.json(tree))
    vi.stubGlobal('fetch', fetchTree)
    const user = userEvent.setup()
    header()
    expect(fetchTree).not.toHaveBeenCalled()
    await user.hover(screen.getByRole('button', { name: 'Open menu' }))
    expect(fetchTree).toHaveBeenCalledWith('/docs-tree.json')
    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(await screen.findByRole('link', { name: 'Installation' })).toHaveAttribute('href', '/docs/installation')
    expect(fetchTree).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })
})
