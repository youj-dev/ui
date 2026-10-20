import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from './navigation-menu'

function SiteNav() {
  return (
    <NavigationMenu aria-label="Main">
      <NavigationMenuList>
        <NavigationMenuItem value="products">
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink href="#deploy">Deployments</NavigationMenuLink>
            <NavigationMenuLink href="#analytics">Analytics</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="solutions">
          <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink href="#ai">AI apps</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#pricing" className={navigationMenuTriggerStyle()}>
            Pricing
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

const trigger = (name: string) => screen.getByRole('button', { name })

describe('NavigationMenu', () => {
  test('a named nav whose triggers disclose panels of links', async () => {
    const user = userEvent.setup()
    render(<SiteNav />)
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(trigger('Products')).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('link', { name: 'Deployments' })).not.toBeInTheDocument()

    await user.click(trigger('Products'))
    expect(trigger('Products')).toHaveAttribute('aria-expanded', 'true')
    expect(await screen.findByRole('link', { name: 'Deployments' })).toBeInTheDocument()
  })

  test('keyboard: Tab to a trigger, Enter opens, Escape closes and returns focus', async () => {
    const user = userEvent.setup()
    render(<SiteNav />)
    await user.tab()
    expect(trigger('Products')).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(trigger('Products')).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(trigger('Products')).toHaveAttribute('aria-expanded', 'false'))
    expect(trigger('Products')).toHaveFocus()
  })

  test('the chevron turns over with its panel', async () => {
    const user = userEvent.setup()
    render(<SiteNav />)
    const icon = () => trigger('Products').querySelector('[data-icon=chevron-down]')
    expect(icon()).toHaveAttribute('data-state', 'rest')
    await user.click(trigger('Products'))
    await waitFor(() => expect(icon()).toHaveAttribute('data-state', 'active'))
  })

  test('the hover pill is one decorative indicator in the list', () => {
    render(<SiteNav />)
    const list = screen.getByRole('list')
    const pills = list.querySelectorAll('[data-slot=navigation-menu-hover-indicator]')
    expect(pills).toHaveLength(1)
    expect(pills[0]).toHaveAttribute('aria-hidden', 'true')
  })

  test('the portaled popup inherits the provider\'s motion scope', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always">
        <SiteNav />
      </YoujProvider>,
    )
    await user.click(trigger('Products'))
    const link = await screen.findByRole('link', { name: 'Deployments' })
    const scope = link.closest('[data-yj-reduced]') as HTMLElement | null
    expect(scope).not.toBeNull()
    expect(scope!.style.getPropertyValue('--yj-motion')).toBe('0')
  })
})
