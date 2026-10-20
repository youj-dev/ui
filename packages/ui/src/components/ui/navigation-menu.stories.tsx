import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { BarChartIcon, DatabaseIcon, GlobeIcon, PackageIcon, PuzzleIcon, RocketIcon, ShieldCheckIcon, ShoppingBagIcon, SparklesIcon, ZapIcon } from '@youj/icons'
import { YoujProvider, ThemeScope } from '@youj/core/lib/youj/provider'
import { Button } from './button'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from './navigation-menu'

const meta: Meta<typeof NavigationMenu> = {
  title: 'UI/Navigation/NavigationMenu',
  component: NavigationMenu,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Base UI\'s navigation menu. A hover pill (motion SlidingIndicator, follow="hover") glides between the top-level triggers and links with the pointer or keyboard focus. The popup grows out of its trigger (scale .96 + fade on the enter curve, out on the instant exit); moving to another trigger slides it across while its box morphs to the next panel\'s size, and the panels trade places, the outgoing one drifting away from the way you moved. The trigger\'s chevron turns over while its panel is open. Keyboard: Tab between triggers, Enter / Space / ↓ opens, Tab into the panel, Escape closes and returns focus. The Portal carries the provider\'s scope, so Speed and reduced motion (instant everything) reach the popup.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof NavigationMenu>

function Card({ href, icon, title, children }: { href: string; icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <NavigationMenuLink href={href} closeOnClick>
      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-md border border-line bg-surface text-fg shadow-xs">
        {icon}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-medium text-fg">{title}</span>
        <span className="text-ui-sm text-fg-muted">{children}</span>
      </span>
    </NavigationMenuLink>
  )
}

function Row({ href, title }: { href: string; title: string }) {
  return (
    <NavigationMenuLink href={href} closeOnClick className="py-1.5 text-fg-muted hover:text-fg">
      {title}
    </NavigationMenuLink>
  )
}

function SiteNav() {
  return (
    <NavigationMenu aria-label="Main" className="max-w-full">
      <NavigationMenuList className="flex-wrap justify-start">
        <NavigationMenuItem value="products">
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-full max-w-[520px] grid-cols-2 gap-0.5">
              <li>
                <Card href="#deploy" icon={<RocketIcon />} title="Deployments">
                  Git-push to preview, promote to production.
                </Card>
              </li>
              <li>
                <Card href="#analytics" icon={<BarChartIcon />} title="Analytics">
                  Real traffic, no cookies, no sampling.
                </Card>
              </li>
              <li>
                <Card href="#storage" icon={<DatabaseIcon />} title="Storage">
                  Blobs, KV and Postgres next to your code.
                </Card>
              </li>
              <li>
                <Card href="#functions" icon={<ZapIcon />} title="Functions">
                  Server code that scales to zero, at the edge.
                </Card>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="solutions">
          <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-full max-w-[380px] grid-cols-2 gap-x-2 p-1">
              <div className="flex flex-col">
                <p className="px-2.5 pt-1.5 pb-1 text-ui-xs font-medium tracking-wide text-fg-muted uppercase">Use cases</p>
                <Row href="#ai" title="AI apps" />
                <Row href="#commerce" title="Commerce" />
                <Row href="#platforms" title="Platforms" />
              </div>
              <div className="flex flex-col">
                <p className="px-2.5 pt-1.5 pb-1 text-ui-xs font-medium tracking-wide text-fg-muted uppercase">Teams</p>
                <Row href="#eng" title="Engineering" />
                <Row href="#design" title="Design" />
                <Row href="#marketing" title="Marketing" />
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="resources">
          <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="flex w-[300px] flex-col gap-0.5">
              <li>
                <Card href="#changelog" icon={<SparklesIcon />} title="Changelog">
                  What shipped this week.
                </Card>
              </li>
              <li>
                <Card href="#security" icon={<ShieldCheckIcon />} title="Security">
                  SOC 2, pen tests and our trust center.
                </Card>
              </li>
              <li>
                <Card href="#templates" icon={<PuzzleIcon />} title="Templates">
                  Start from something that already works.
                </Card>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#docs" className={navigationMenuTriggerStyle()}>
            Docs
          </NavigationMenuLink>
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

function Header() {
  return (
    <div className="min-h-[520px] bg-canvas">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-line px-6 py-3">
        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-x-8 gap-y-2">
          <a href="#home" className="flex items-center gap-2 rounded-md text-ui-lg font-semibold tracking-tight text-fg focus-ring">
            <span aria-hidden className="grid size-6 place-items-center rounded-md bg-fg text-canvas">
              <PackageIcon className="size-3.5" />
            </span>
            Acme
          </a>
          <SiteNav />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            Log in
          </Button>
          <Button size="sm">Start deploying</Button>
        </div>
      </header>
      <div className="flex flex-col items-center gap-3 px-6 pt-24 text-center">
        <p className="flex items-center gap-1.5 text-ui-sm text-fg-muted">
          <GlobeIcon className="size-3.5" />
          18 regions · 99.99% uptime
        </p>
        <h1 className="max-w-xl text-[40px] leading-[1.1] font-semibold tracking-[-0.03em] text-fg">Ship the web, faster.</h1>
        <p className="max-w-md text-ui-lg text-fg-muted">Move across the menu: the pill follows you, and the panel morphs between Products, Solutions and Resources.</p>
      </div>
    </div>
  )
}

/** A site header. Hover across the triggers, or Tab to one and press ↓. */
export const Hero: Story = {
  render: () => <Header />,
}

/** Reduced motion: the popup and its panels appear, resize and swap at once; the pill jumps. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <Header />
    </YoujProvider>
  ),
}

/** dir="rtl": the pill, the popup's slide and the panels' drift all mirror. */
export const RightToLeft: Story = {
  render: () => (
    <ThemeScope dir="rtl">
      <div dir="rtl">
        <Header />
      </div>
    </ThemeScope>
  ),
}

export const ShoppingIcons: Story = {
  name: 'Single panel',
  render: () => (
    <div className="flex min-h-[360px] justify-center bg-canvas pt-6">
      <NavigationMenu aria-label="Store">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>
              <ShoppingBagIcon className="size-4" />
              Store
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="flex w-[280px] flex-col gap-0.5">
                <li>
                  <Card href="#plans" icon={<SparklesIcon />} title="Plans">
                    Hobby, Pro and Enterprise.
                  </Card>
                </li>
                <li>
                  <Card href="#addons" icon={<PuzzleIcon />} title="Add-ons">
                    Extra seats, storage and bandwidth.
                  </Card>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
}
