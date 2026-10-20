'use client'

import {
  BarChartIcon,
  BookmarkIcon,
  CodeIcon,
  DatabaseIcon,
  GlobeIcon,
  RocketIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TerminalIcon,
} from '@youj/icons'
import { MeshGradient } from '@youj/motion/backgrounds'
import {
  MegaMenuContent,
  MegaMenuFeatured,
  MegaMenuGroup,
  MegaMenuLink,
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@youj/react'

export default function MegaMenuDemo() {
  return (
    // The bar sits at the top of the stage, so its panels open into the room below.
    <div className="flex h-[22rem] w-full max-w-2xl flex-col">
      <div className="flex items-center gap-4 rounded-xl border border-line bg-canvas px-4 py-2 shadow-xs">
        <span className="text-ui-lg font-semibold tracking-tight text-fg">Northwind</span>
        {/* The top padding keeps a flipped panel clear of a 56px sticky header. */}
        <NavigationMenu aria-label="Main" collisionPadding={{ top: 64, right: 8, bottom: 8, left: 8 }}>
          <NavigationMenuList>
            <NavigationMenuItem value="product">
              <NavigationMenuTrigger>Product</NavigationMenuTrigger>
              <MegaMenuContent
                featured={
                  <MegaMenuFeatured
                    href="#launch"
                    eyebrow="New"
                    title="Northwind 2.0"
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
                  <MegaMenuLink href="#api" icon={<TerminalIcon size={16} />} title="REST API" description="Everything the dashboard can do." />
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
      </div>
    </div>
  )
}
