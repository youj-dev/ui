import { forwardRef, type ComponentProps, type ReactNode } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { NavbarFullscreen, type NavbarFullscreenItem } from './navbar-fullscreen'

const reduced = (ui: ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

const items: NavbarFullscreenItem[] = [
  { label: 'Coffee', items: [{ label: 'Single origin', href: '/coffee/single-origin' }, { label: 'Blends', href: '/coffee/blends' }] },
  { label: 'Cafés', href: '/cafes' },
  { label: 'Journal', href: '/journal', badge: 'New' },
]

const menu = () => screen.findByRole('dialog', { name: 'Menu' })

describe('NavbarFullscreen', () => {
  test('the Menu button opens the menu over the page; from the keyboard, focus lands on its first entry', async () => {
    const user = userEvent.setup()
    reduced(<NavbarFullscreen items={items} brand={{ name: 'Fernhill', href: '/' }} cta={{ label: 'Subscribe', href: '/subscribe' }} />)
    const banner = screen.getByRole('banner')
    expect(within(banner).getByRole('link', { name: 'Fernhill' })).toHaveAttribute('href', '/')
    expect(within(banner).getByRole('link', { name: 'Subscribe' })).toHaveAttribute('href', '/subscribe')
    const trigger = within(banner).getByRole('button', { name: 'Menu' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    trigger.focus()
    await user.keyboard('{Enter}')
    const dialog = await menu()
    const nav = within(dialog).getByRole('navigation', { name: 'Main' })
    expect(within(nav).getByRole('button', { name: /Coffee/ })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: /Journal/ })).toHaveAttribute('href', '/journal')
    await waitFor(() => expect(within(nav).getByRole('button', { name: /Coffee/ })).toHaveFocus())
    expect(within(dialog).getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  test('an entry with a level drills in, focus follows, and Back returns focus to the entry', async () => {
    const user = userEvent.setup()
    reduced(<NavbarFullscreen items={items} defaultOpen />)
    const dialog = await menu()
    await user.click(within(dialog).getByRole('button', { name: /Coffee/ }))
    const level = await within(dialog).findByRole('group', { name: 'Coffee' })
    expect(within(level).getByRole('link', { name: /Single origin/ })).toHaveAttribute('href', '/coffee/single-origin')
    await waitFor(() => expect(within(level).getByRole('link', { name: /Single origin/ })).toHaveFocus())
    await user.click(within(level).getByRole('button', { name: 'Back' }))
    await waitFor(() => expect(within(dialog).getByRole('button', { name: /Coffee/ })).toHaveFocus())
    expect(within(dialog).queryByRole('group', { name: 'Coffee' })).not.toBeInTheDocument()
  })

  test('marks the current page, and following a link closes the menu', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    reduced(<NavbarFullscreen items={items} current="/cafes" defaultOpen onOpenChange={onOpenChange} />)
    const dialog = await menu()
    const cafes = within(dialog).getByRole('link', { name: /Cafés/ })
    expect(cafes).toHaveAttribute('aria-current', 'page')
    await user.click(cafes)
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  test('Escape closes from a nested level and returns focus to Menu', async () => {
    const user = userEvent.setup()
    reduced(<NavbarFullscreen items={items} />)
    const trigger = screen.getByRole('button', { name: 'Menu' })
    await user.click(trigger)
    const dialog = await menu()
    await user.click(within(dialog).getByRole('button', { name: /Coffee/ }))
    await within(dialog).findByRole('group', { name: 'Coffee' })
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  test('open is the app’s to control', async () => {
    const { rerender } = reduced(<NavbarFullscreen open={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    rerender(
      <YoujProvider reducedMotion="always">
        <NavbarFullscreen open />
      </YoujProvider>,
    )
    expect(await menu()).toBeInTheDocument()
  })

  test('the foot carries the small links, the contact line and the profiles', async () => {
    reduced(
      <NavbarFullscreen
        defaultOpen
        footerLinks={[{ label: 'Shipping', href: '/shipping' }]}
        contact={{ label: 'hello@fernhill.coffee', href: 'mailto:hello@fernhill.coffee' }}
        socials={[{ label: 'Fernhill on GitHub', href: 'https://github.com/fernhill', icon: <svg /> }]}
      />,
    )
    const dialog = await menu()
    expect(within(within(dialog).getByRole('navigation', { name: 'More' })).getByRole('link', { name: 'Shipping' })).toHaveAttribute('href', '/shipping')
    expect(within(dialog).getByRole('link', { name: 'hello@fernhill.coffee' })).toHaveAttribute('href', 'mailto:hello@fernhill.coffee')
    expect(within(dialog).getByRole('link', { name: 'Fernhill on GitHub' })).toHaveAttribute('href', 'https://github.com/fernhill')
  })

  test('copy rewrites the words, and linkComponent renders the links', async () => {
    const user = userEvent.setup()
    const Link = forwardRef<HTMLAnchorElement, ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    reduced(<NavbarFullscreen items={items} linkComponent={Link} copy={{ menu: 'Menü', close: 'Schließen', back: 'Zurück', navLabel: 'Seiten' }} />)
    expect(within(screen.getByRole('banner')).getByRole('link', { name: 'Kestrel' })).toHaveAttribute('data-router')
    await user.click(screen.getByRole('button', { name: 'Menü' }))
    const dialog = await screen.findByRole('dialog', { name: 'Menü' })
    expect(within(dialog).getByRole('button', { name: 'Schließen' })).toBeInTheDocument()
    expect(within(within(dialog).getByRole('navigation', { name: 'Seiten' })).getByRole('link', { name: /Cafés/ })).toHaveAttribute('data-router')
    await user.click(within(dialog).getByRole('button', { name: /Coffee/ }))
    expect(await within(dialog).findByRole('button', { name: 'Zurück' })).toBeInTheDocument()
  })
})
