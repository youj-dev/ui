import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { AppHeader, AppHeaderActions, AppHeaderBrand, AppHeaderMenu, AppHeaderMenuLink, AppHeaderNav, AppHeaderSearch } from './app-header'

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

function Header({ onSearch = () => {} }: { onSearch?: () => void }) {
  return (
    <AppHeader>
      <AppHeaderBrand href="#home">Northwind</AppHeaderBrand>
      <AppHeaderNav>
        <a href="#pricing">Pricing</a>
      </AppHeaderNav>
      <AppHeaderActions>
        <AppHeaderSearch onClick={onSearch} />
        <AppHeaderMenu>
          <AppHeaderMenuLink href="#deploy" active>
            Deployments
          </AppHeaderMenuLink>
          <AppHeaderMenuLink href="#docs">Docs</AppHeaderMenuLink>
        </AppHeaderMenu>
      </AppHeaderActions>
    </AppHeader>
  )
}

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  Object.defineProperty(document.documentElement, 'scrollTop', { value: y, configurable: true })
  act(() => {
    window.dispatchEvent(new Event('scroll'))
  })
}

// jsdom has no scrollingElement, which motion's useScroll tracks by default.
beforeAll(() => {
  Object.defineProperty(document, 'scrollingElement', { value: document.documentElement, configurable: true })
})

afterEach(() => {
  vi.restoreAllMocks()
  scrollTo(0)
})

describe('AppHeader', () => {
  test('a banner with the brand link and a search button named Search at every size', async () => {
    const onSearch = vi.fn()
    const user = userEvent.setup()
    render(<Header onSearch={onSearch} />)
    expect(screen.getByRole('banner')).toHaveAttribute('data-sticky')
    expect(screen.getByRole('link', { name: 'Northwind' })).toHaveAttribute('href', '#home')
    const search = screen.getByRole('button', { name: 'Search' })
    expect(search).toHaveAttribute('aria-keyshortcuts')
    await user.click(search)
    expect(onSearch).toHaveBeenCalledOnce()
  })

  test('condenses once the page scrolls past 24px, and only returns under 8px', async () => {
    render(<Header />)
    const header = screen.getByRole('banner')
    expect(header).not.toHaveAttribute('data-condensed')
    scrollTo(40)
    await waitFor(() => expect(header).toHaveAttribute('data-condensed'))
    scrollTo(16)
    await new Promise((r) => setTimeout(r, 50))
    expect(header).toHaveAttribute('data-condensed')
    scrollTo(2)
    await waitFor(() => expect(header).not.toHaveAttribute('data-condensed'))
  })

  test('a static header never condenses and always has its surface', () => {
    render(
      <AppHeader sticky={false}>
        <AppHeaderBrand href="#">N</AppHeaderBrand>
      </AppHeader>,
    )
    const header = screen.getByRole('banner')
    expect(header).not.toHaveAttribute('data-sticky')
    expect(header).toHaveAttribute('data-surface')
  })

  test('phone drawer: opens from the hamburger, traps focus, Escape closes and returns focus', async () => {
    phone(true)
    const user = userEvent.setup()
    render(<Header />)
    const hamburger = screen.getByRole('button', { name: 'Open menu' })
    expect(hamburger).toHaveAttribute('aria-expanded', 'false')
    await user.click(hamburger)
    const drawer = await screen.findByRole('dialog', { name: 'Menu' })
    expect(hamburger).toHaveAttribute('aria-expanded', 'true')
    const nav = screen.getByRole('navigation', { name: 'Menu' })
    expect(drawer).toContainElement(nav)
    expect(screen.getByRole('link', { name: 'Deployments' })).toHaveAttribute('aria-current', 'page')

    // Focus stays inside the drawer as Tab cycles past its last control: a
    // Tab onto Base UI's trap sentinel is sent straight back in.
    await waitFor(() => expect(drawer).toContainElement(document.activeElement as HTMLElement))
    for (let i = 0; i < 6; i++) {
      await user.tab()
      await waitFor(() => expect(drawer).toContainElement(document.activeElement as HTMLElement))
    }

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(hamburger).toHaveFocus()
  })

  test('following a drawer link closes the drawer', async () => {
    phone(true)
    const user = userEvent.setup()
    render(<Header />)
    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await user.click(await screen.findByRole('link', { name: 'Docs' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  test('reduced motion marks the header for instant transitions', () => {
    render(
      <YoujProvider reducedMotion="always">
        <Header />
      </YoujProvider>,
    )
    expect(screen.getByRole('banner')).toHaveAttribute('data-reduced-motion')
  })
})
