import { forwardRef, type ComponentProps, type ReactNode } from 'react'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { NavbarFloating, type NavbarFloatingLink } from './navbar-floating'

const reduced = (ui: ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const moving = (ui: ReactNode) => render(<YoujProvider reducedMotion="never">{ui}</YoujProvider>)

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

const pages: NavbarFloatingLink[] = [
  { label: 'Shows', href: '/shows' },
  { label: 'Live', href: '/live', badge: 'On air' },
  { label: 'Archive', href: '/archive' },
]

const nav = () => screen.getByRole('navigation', { name: 'Main' })

describe('NavbarFloating', () => {
  test('renders the links, brand and calls to action it is given, and marks the current page', () => {
    reduced(
      <NavbarFloating
        links={pages}
        current="/shows"
        brand={{ name: 'Oriel', href: '/' }}
        primaryCta={{ label: 'Listen', href: '/listen' }}
        secondaryCta={null}
        copy={{ navLabel: 'Site' }}
      />,
    )
    const banner = screen.getByRole('banner')
    const site = within(banner).getByRole('navigation', { name: 'Site' })
    expect(within(site).getByRole('link', { name: 'Shows' })).toHaveAttribute('aria-current', 'page')
    expect(within(site).getByRole('link', { name: /Live/ })).not.toHaveAttribute('aria-current')
    expect(within(site).getByText('On air')).toBeInTheDocument()
    expect(within(banner).getByRole('link', { name: 'Oriel' })).toHaveAttribute('href', '/')
    expect(within(banner).getByRole('link', { name: 'Listen' })).toHaveAttribute('href', '/listen')
    expect(within(banner).queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument()
  })

  test('linkComponent renders every link, and the calls to action keep their onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault())
    const Link = forwardRef<HTMLAnchorElement, ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    reduced(<NavbarFloating links={pages} linkComponent={Link} primaryCta={{ label: 'Listen', href: '/listen', onClick }} />)
    const banner = screen.getByRole('banner')
    for (const name of ['Shows', 'Archive', 'Halden', 'Listen', 'Sign in']) expect(within(banner).getByRole('link', { name })).toHaveAttribute('data-router')
    await user.click(within(banner).getByRole('link', { name: 'Listen' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('follows the section in view, reports it, and marks a followed in-page link at once', async () => {
    const user = userEvent.setup()
    const onCurrentChange = vi.fn()
    reduced(
      <>
        <NavbarFloating onCurrentChange={onCurrentChange} />
        <section id="features" />
        <section id="pricing" />
        <section id="customers" />
        <section id="changelog" />
      </>,
    )
    // jsdom lays nothing out, so every section sits on the line and the last one is the one in view.
    await waitFor(() => expect(within(nav()).getByRole('link', { name: /Changelog/ })).toHaveAttribute('aria-current', 'true'))
    expect(onCurrentChange).toHaveBeenLastCalledWith('#changelog')
    await user.click(within(nav()).getByRole('link', { name: 'Pricing' }))
    expect(within(nav()).getByRole('link', { name: 'Pricing' })).toHaveAttribute('aria-current', 'true')
    expect(within(nav()).getByRole('link', { name: /Changelog/ })).not.toHaveAttribute('aria-current')
  })

  test('condenses once the page scrolls under it, steps aside on the way down and returns on the way up', async () => {
    moving(<NavbarFloating />)
    const banner = screen.getByRole('banner')
    expect(banner).not.toHaveAttribute('data-yj-condensed')
    scrollTo(40)
    await waitFor(() => expect(banner).toHaveAttribute('data-yj-condensed'))
    scrollTo(200)
    scrollTo(420)
    await waitFor(() => expect(banner).toHaveAttribute('data-yj-hidden'))
    scrollTo(390)
    await waitFor(() => expect(banner).not.toHaveAttribute('data-yj-hidden'))
    scrollTo(2)
    await waitFor(() => expect(banner).not.toHaveAttribute('data-yj-condensed'))
  })

  test('never hides under reduced motion, or with hideOnScroll off', async () => {
    reduced(<NavbarFloating />)
    const banner = screen.getByRole('banner')
    scrollTo(40)
    scrollTo(240)
    scrollTo(520)
    await waitFor(() => expect(banner).toHaveAttribute('data-yj-condensed'))
    expect(banner).not.toHaveAttribute('data-yj-hidden')
  })

  test('on a phone the menu button opens the menu; Escape folds it and returns focus to the button', async () => {
    phone(true)
    const user = userEvent.setup()
    reduced(<NavbarFloating />)
    const button = screen.getByRole('button', { name: 'Open menu' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(button).toHaveAccessibleName('Close menu')
    const panel = document.getElementById(button.getAttribute('aria-controls')!)!
    expect(await within(panel).findByRole('link', { name: 'Pricing' })).toBeInTheDocument()
    expect(within(panel).getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '#login')
    within(panel).getByRole('link', { name: 'Pricing' }).focus()
    await user.keyboard('{Escape}')
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveFocus()
  })

  test('following a link in the phone menu folds it', async () => {
    phone(true)
    const user = userEvent.setup()
    reduced(<NavbarFloating links={pages} />)
    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    const panel = document.getElementById(screen.getByRole('button', { name: 'Close menu' }).getAttribute('aria-controls')!)!
    await user.click(await within(panel).findByRole('link', { name: 'Archive' }))
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false')
  })

  test('a skip link leads to the content, renamed by copy; skipTo={null} leaves it out', () => {
    const { unmount } = reduced(<NavbarFloating copy={{ skipLink: 'Zum Inhalt' }} />)
    expect(screen.getByRole('link', { name: 'Zum Inhalt' })).toHaveAttribute('href', '#content')
    unmount()
    reduced(<NavbarFloating skipTo={null} />)
    expect(screen.queryByRole('link', { name: 'Skip to content' })).not.toBeInTheDocument()
  })

  test('spreads extra props on the root header', () => {
    reduced(<NavbarFloating id="top" className="custom" />)
    expect(screen.getByRole('banner')).toHaveAttribute('id', 'top')
    expect(screen.getByRole('banner')).toHaveClass('custom')
  })
})
