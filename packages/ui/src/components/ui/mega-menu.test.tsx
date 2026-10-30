import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MegaMenuContent, MegaMenuFeatured, MegaMenuGroup, MegaMenuLink } from './mega-menu'
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger } from './navigation-menu'

function Menu() {
  return (
    <NavigationMenu aria-label="Main">
      <NavigationMenuList>
        <NavigationMenuItem value="product">
          <NavigationMenuTrigger>Product</NavigationMenuTrigger>
          <MegaMenuContent featured={<MegaMenuFeatured href="#launch" eyebrow="New" title="Youj 2.0" description="Themes" />}>
            <MegaMenuGroup title="Build">
              <MegaMenuLink href="#deploy" icon={<svg />} title="Deployments" description="Git-push to preview." />
              <MegaMenuLink href="#functions" title="Functions" />
            </MegaMenuGroup>
            <MegaMenuGroup title="Observe">
              <MegaMenuLink href="#analytics" title="Analytics" />
            </MegaMenuGroup>
          </MegaMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

describe('MegaMenu', () => {
  test('columns are labelled groups of links, with the featured card as a link too', async () => {
    const user = userEvent.setup()
    render(<Menu />)
    await user.click(screen.getByRole('button', { name: 'Product' }))
    const build = await screen.findByRole('group', { name: 'Build' })
    expect(build).toContainElement(screen.getByRole('link', { name: /^Deployments\b/ }))
    expect(screen.getByRole('group', { name: 'Observe' })).toContainElement(screen.getByRole('link', { name: /^Analytics\b/ }))
    expect(screen.getByRole('link', { name: /Youj 2.0/ })).toHaveAttribute('href', '#launch')
    // The icon tile is decorative: the title names the link and the description describes it.
    const deployments = screen.getByRole('link', { name: /^Deployments\b/ })
    expect(deployments).toHaveAccessibleName('Deployments Git-push to preview.')
    expect(screen.getByRole('link', { name: 'New Youj 2.0' })).toHaveAccessibleDescription('Themes')
  })

  test('keyboard: Enter opens, Tab walks the links in column order, Escape closes and returns focus', async () => {
    const user = userEvent.setup()
    render(<Menu />)
    await user.tab()
    const trigger = screen.getByRole('button', { name: 'Product' })
    expect(trigger).toHaveFocus()
    await user.keyboard('{Enter}')
    await screen.findByRole('group', { name: 'Build' })
    await user.tab()
    expect(screen.getByRole('link', { name: /^Deployments\b/ })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: /^Functions\b/ })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: /^Analytics\b/ })).toHaveFocus()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'))
    // Base UI hands focus back to the trigger after the close, not in the same tick.
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  test('following a link closes the menu', async () => {
    const user = userEvent.setup()
    render(<Menu />)
    const trigger = screen.getByRole('button', { name: 'Product' })
    await user.click(trigger)
    await user.click(await screen.findByRole('link', { name: /^Analytics\b/ }))
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'))
  })
})
