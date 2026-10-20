import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  BarChartIcon,
  BookmarkIcon,
  CodeIcon,
  CreditCardIcon,
  DatabaseIcon,
  GitBranchIcon,
  GlobeIcon,
  RocketIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  SparklesIcon,
  TerminalIcon,
  UsersIcon,
} from '@youj/icons'
import { MeshGradient } from '@youj/motion/backgrounds'
import { MegaMenuContent, MegaMenuFeatured, MegaMenuGroup, MegaMenuLink } from './mega-menu'
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from './navigation-menu'

const meta: Meta<typeof MegaMenuContent> = {
  title: 'UI/Navigation/MegaMenu',
  component: MegaMenuContent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Multi-column panels for a NavigationMenu: groups of links with an icon tile, a title and a line of description, and an optional featured card at the inline end. It inherits the menu\'s motion: the hover pill between triggers, the popup growing out of its trigger, then sliding and morphing to the next panel\'s size while the panels trade places. Each link\'s youj icon plays while it is hovered or focused. Keyboard is NavigationMenu\'s: Enter / Space / ↓ opens, Tab moves through the links, Escape closes and returns focus. Reduced motion: every change is instant.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof MegaMenuContent>

function Menu() {
  return (
    <NavigationMenu aria-label="Main">
      <NavigationMenuList>
        <NavigationMenuItem value="product">
          <NavigationMenuTrigger>Product</NavigationMenuTrigger>
          <MegaMenuContent
            featured={
              <MegaMenuFeatured
                href="#launch"
                eyebrow="New"
                title="Youj 2.0"
                description="Themes, density and a motion personality per preset."
                media={<MeshGradient intensity={1.1} interactive={false} className="absolute inset-0" />}
              />
            }
          >
            <MegaMenuGroup title="Build">
              <MegaMenuLink href="#deploy" icon={<RocketIcon size={16} />} title="Deployments" description="Git-push to preview, promote to prod." />
              <MegaMenuLink href="#functions" icon={<TerminalIcon size={16} />} title="Functions" description="Server code that scales to zero." />
              <MegaMenuLink href="#storage" icon={<DatabaseIcon size={16} />} title="Storage" description="Blobs, KV and Postgres by your code." />
            </MegaMenuGroup>
            <MegaMenuGroup title="Observe">
              <MegaMenuLink href="#analytics" icon={<BarChartIcon size={16} />} title="Analytics" description="Real traffic, no cookies, no sampling." />
              <MegaMenuLink href="#firewall" icon={<ShieldCheckIcon size={16} />} title="Firewall" description="Rules that deploy with your code." />
              <MegaMenuLink href="#edge" icon={<GlobeIcon size={16} />} title="Edge network" description="Cached close to every visitor." />
            </MegaMenuGroup>
          </MegaMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="solutions">
          <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
          <MegaMenuContent>
            <MegaMenuGroup title="Use cases">
              <MegaMenuLink href="#commerce" icon={<ShoppingBagIcon size={16} />} title="Commerce" description="Storefronts that stay fast on sale day." />
              <MegaMenuLink href="#saas" icon={<CreditCardIcon size={16} />} title="SaaS" description="Multi-tenant apps with per-team previews." />
            </MegaMenuGroup>
            <MegaMenuGroup title="Teams">
              <MegaMenuLink href="#platform" icon={<UsersIcon size={16} />} title="Platform" description="Guardrails without the tickets." />
              <MegaMenuLink href="#design" icon={<SparklesIcon size={16} />} title="Design" description="Review the real thing, not a mock." />
            </MegaMenuGroup>
          </MegaMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="developers">
          <NavigationMenuTrigger>Developers</NavigationMenuTrigger>
          <MegaMenuContent>
            <MegaMenuGroup title="Learn">
              <MegaMenuLink href="#docs" icon={<BookmarkIcon size={16} />} title="Docs" description="Guides and the API reference." />
              <MegaMenuLink href="#cli" icon={<CodeIcon size={16} />} title="CLI" description="Deploy from your terminal." />
              <MegaMenuLink href="#git" icon={<GitBranchIcon size={16} />} title="Git integration" description="Previews for every branch." />
            </MegaMenuGroup>
          </MegaMenuContent>
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

export const Default: Story = {
  render: () => (
    <div className="flex min-h-[28rem] justify-center p-6">
      <Menu />
    </div>
  ),
}
