import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  BarChartIcon,
  BookmarkIcon,
  CodeIcon,
  DatabaseIcon,
  GitBranchIcon,
  GlobeIcon,
  KeyboardIcon,
  RocketIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TerminalIcon,
  UserIcon,
  UsersIcon,
} from '@youj/icons'
import { MeshGradient } from '@youj/motion/backgrounds'
import { AccountMenu } from './account-menu'
import {
  AppHeader,
  AppHeaderActions,
  AppHeaderBrand,
  AppHeaderMenu,
  AppHeaderMenuLink,
  AppHeaderNav,
  AppHeaderSearch,
} from './app-header'
import { Button } from './button'
import { CommandGroup, CommandItem, CommandShortcut } from './command'
import { CommandPalette } from './command-palette'
import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuShortcut } from './dropdown-menu'
import { MegaMenuContent, MegaMenuFeatured, MegaMenuGroup, MegaMenuLink } from './mega-menu'
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from './navigation-menu'
import { Separator } from './separator'

const meta: Meta<typeof AppHeader> = {
  title: 'UI/Navigation/AppHeader',
  component: AppHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The app\'s top bar (a navbar): brand, primary navigation (plain links or a MegaMenu), a search trigger for the command palette, actions and the account menu. It is sticky, and condenses once the page scrolls under it: 8px less height and a translucent, blurred surface with a hairline, on the base token, with hysteresis so it never flickers at the threshold. Below `md` the navigation moves into AppHeaderMenu, a hamburger whose bars morph into a cross (MenuIcon) as a focus-trapped Sheet slides in; its own cross lands where the hamburger was. Reduced motion: the same states, instantly.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AppHeader>

function Logo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="text-accent">
      <path d="M4 5h4l4 7-4 7H4l4-7z" fill="currentColor" />
      <path d="M12 5h4l4 7-4 7h-4l4-7z" fill="currentColor" opacity={0.45} />
    </svg>
  )
}

function ProductMenu() {
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
        <NavigationMenuItem value="developers">
          <NavigationMenuTrigger>Developers</NavigationMenuTrigger>
          <MegaMenuContent>
            <MegaMenuGroup title="Learn">
              <MegaMenuLink href="#docs" icon={<BookmarkIcon size={16} />} title="Docs" description="Guides and the API reference." />
              <MegaMenuLink href="#templates" icon={<SparklesIcon size={16} />} title="Templates" description="Start from something that works." />
            </MegaMenuGroup>
            <MegaMenuGroup title="Tools">
              <MegaMenuLink href="#cli" icon={<CodeIcon size={16} />} title="CLI" description="Deploy from your terminal." />
              <MegaMenuLink href="#git" icon={<GitBranchIcon size={16} />} title="Git integration" description="Previews for every branch." />
            </MegaMenuGroup>
          </MegaMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#customers" className={navigationMenuTriggerStyle()}>
            Customers
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

function Header({ signedIn = true, sticky }: { signedIn?: boolean; sticky?: boolean }) {
  const [palette, setPalette] = useState(false)
  const [theme, setTheme] = useState('graphite')
  const [mode, setMode] = useState<'light' | 'dark' | 'system'>('system')
  return (
    <AppHeader sticky={sticky}>
      <AppHeaderBrand href="#home">
        <Logo />
        Northwind
      </AppHeaderBrand>
      <AppHeaderNav>
        <ProductMenu />
      </AppHeaderNav>
      <AppHeaderActions>
        <AppHeaderSearch onClick={() => setPalette(true)} />
        {signedIn ? (
          <AccountMenu
            user={{ name: 'Ada Lovelace', email: 'ada@northwind.dev' }}
            theme={theme}
            onThemeChange={setTheme}
            colorMode={mode}
            onColorModeChange={setMode}
            onSignOut={() => {}}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <UserIcon size={16} strokeWidth={1.75} />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SettingsIcon size={16} strokeWidth={1.75} />
                Settings
                <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <KeyboardIcon size={16} strokeWidth={1.75} />
                Keyboard shortcuts
                <DropdownMenuShortcut>?</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </AccountMenu>
        ) : (
          <Button size="sm" className="max-md:hidden">
            Sign up
          </Button>
        )}
        <AppHeaderMenu
          header={
            <span className="inline-flex items-center gap-2 [&_svg]:size-5">
              <Logo />
              Northwind
            </span>
          }
          footer={
            <>
              <Button size="lg">Start deploying</Button>
              <Button size="lg" variant="outline">
                Contact sales
              </Button>
            </>
          }
        >
          <AppHeaderMenuLink href="#deploy" active>
            <RocketIcon size={16} /> Deployments
          </AppHeaderMenuLink>
          <AppHeaderMenuLink href="#analytics">
            <BarChartIcon size={16} /> Analytics
          </AppHeaderMenuLink>
          <AppHeaderMenuLink href="#storage">
            <DatabaseIcon size={16} /> Storage
          </AppHeaderMenuLink>
          <Separator className="my-2" />
          <AppHeaderMenuLink href="#docs">
            <BookmarkIcon size={16} /> Docs
          </AppHeaderMenuLink>
          <AppHeaderMenuLink href="#customers">
            <UsersIcon size={16} /> Customers
          </AppHeaderMenuLink>
          <AppHeaderMenuLink href="#pricing">
            <SparklesIcon size={16} /> Pricing
          </AppHeaderMenuLink>
        </AppHeaderMenu>
      </AppHeaderActions>
      <CommandPalette open={palette} onOpenChange={setPalette}>
        <CommandGroup heading="Go to">
          <CommandItem onSelect={() => setPalette(false)}>
            <RocketIcon size={16} /> Deployments <CommandShortcut>G D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => setPalette(false)}>
            <BarChartIcon size={16} /> Analytics <CommandShortcut>G A</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => setPalette(false)}>
            <SettingsIcon size={16} /> Settings <CommandShortcut>⌘,</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandPalette>
    </AppHeader>
  )
}

function Page() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-fg">Ship the web, faster.</h1>
      <p className="text-ui-lg text-fg-muted">
        Scroll: the header condenses as the page passes under it, and returns when you come back to the top.
      </p>
      {Array.from({ length: 10 }, (_, i) => (
        <section key={i} className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-5">
          <h2 className="text-ui-lg font-semibold text-fg">Section {i + 1}</h2>
          <p className="text-ui text-fg-muted">
            Previews for every push, instant rollbacks and analytics that respect your visitors. Everything you need to put
            work in front of people, and nothing you don’t.
          </p>
        </section>
      ))}
    </main>
  )
}

export const Default: Story = {
  render: () => (
    <div className="min-h-dvh bg-canvas">
      <Header />
      <Page />
    </div>
  ),
}

export const SignedOut: Story = {
  render: () => (
    <div className="min-h-dvh bg-canvas">
      <Header signedIn={false} />
      <Page />
    </div>
  ),
}

/** Not sticky: it scrolls away with the page and keeps its surface. */
export const Static: Story = {
  render: () => (
    <div className="min-h-dvh bg-canvas">
      <Header sticky={false} />
      <Page />
    </div>
  ),
}
