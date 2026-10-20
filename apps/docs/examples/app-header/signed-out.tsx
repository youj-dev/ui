'use client'

import { BookmarkIcon, CodeIcon, RocketIcon, SparklesIcon, TerminalIcon, UsersIcon } from '@youj/icons'
import {
  AppHeader,
  AppHeaderActions,
  AppHeaderBrand,
  AppHeaderMenu,
  AppHeaderMenuLink,
  AppHeaderNav,
  Button,
  MegaMenuContent,
  MegaMenuGroup,
  MegaMenuLink,
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  Separator,
  navigationMenuTriggerStyle,
} from '@youj/react'

function Logo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="text-accent">
      <path d="M4 5h4l4 7-4 7H4l4-7z" fill="currentColor" />
      <path d="M12 5h4l4 7-4 7h-4l4-7z" fill="currentColor" opacity={0.45} />
    </svg>
  )
}

export default function SignedOutHeader() {
  return (
    <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-line bg-canvas shadow-xs">
      {/* Not sticky: it scrolls away with the page and keeps its surface. */}
      <AppHeader sticky={false}>
        <AppHeaderBrand href="#">
          <Logo />
          Northwind
        </AppHeaderBrand>
        <AppHeaderNav>
          <NavigationMenu aria-label="Main">
            <NavigationMenuList>
              <NavigationMenuItem value="product">
                <NavigationMenuTrigger>Product</NavigationMenuTrigger>
                <MegaMenuContent>
                  <MegaMenuGroup title="Build">
                    <MegaMenuLink href="#deploy" icon={<RocketIcon size={16} />} title="Deployments" description="Git-push to preview, promote to prod." />
                    <MegaMenuLink href="#functions" icon={<TerminalIcon size={16} />} title="Functions" description="Server code that scales to zero." />
                  </MegaMenuGroup>
                  <MegaMenuGroup title="Learn">
                    <MegaMenuLink href="#docs" icon={<BookmarkIcon size={16} />} title="Docs" description="Guides and the API reference." />
                    <MegaMenuLink href="#cli" icon={<CodeIcon size={16} />} title="CLI" description="Deploy from your terminal." />
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
        </AppHeaderNav>
        <AppHeaderActions>
          <Button size="sm" variant="ghost" className="max-md:hidden">
            Log in
          </Button>
          <Button size="sm" className="max-md:hidden">
            Sign up
          </Button>
          <AppHeaderMenu
            header="Northwind"
            footer={
              <>
                <Button size="lg">Sign up</Button>
                <Button size="lg" variant="outline">
                  Log in
                </Button>
              </>
            }
          >
            <AppHeaderMenuLink href="#deploy">
              <RocketIcon size={16} /> Deployments
            </AppHeaderMenuLink>
            <AppHeaderMenuLink href="#functions">
              <TerminalIcon size={16} /> Functions
            </AppHeaderMenuLink>
            <Separator className="my-2" />
            <AppHeaderMenuLink href="#customers">
              <UsersIcon size={16} /> Customers
            </AppHeaderMenuLink>
            <AppHeaderMenuLink href="#pricing">
              <SparklesIcon size={16} /> Pricing
            </AppHeaderMenuLink>
          </AppHeaderMenu>
        </AppHeaderActions>
      </AppHeader>
      <div className="flex h-72 flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-2xl font-semibold tracking-tight text-fg">Ship the web, faster.</p>
        <p className="max-w-sm text-ui text-fg-muted">Previews for every push, instant rollbacks and analytics that respect your visitors.</p>
      </div>
    </div>
  )
}
