'use client'

import type { MouseEvent, ReactNode } from 'react'
import {
  Button,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@youj/react'
import { BarChartIcon, BookmarkIcon, CpuIcon, DatabaseIcon, RocketIcon, ShieldCheckIcon, SparklesIcon } from '@youj/icons'

// In a site these are real routes. Here they stay on the page.
const stay = (event: MouseEvent) => event.preventDefault()

function Feature({ href, icon, title, children }: { href: string; icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <NavigationMenuLink href={href} onClick={stay} closeOnClick>
      <span className="grid size-8 shrink-0 place-items-center rounded-md border border-line bg-canvas text-fg shadow-xs">{icon}</span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-medium text-fg">{title}</span>
        <span className="text-ui-sm text-fg-muted">{children}</span>
      </span>
    </NavigationMenuLink>
  )
}

export default function NavigationMenuDemo() {
  return (
    <div className="@container w-full max-w-2xl overflow-hidden rounded-xl border border-line bg-canvas">
      <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-2.5">
        <a href="/" onClick={stay} className="rounded-md text-ui-lg font-semibold tracking-tight text-fg focus-ring">
          Acme
        </a>
        <NavigationMenu aria-label="Site">
          <NavigationMenuList>
            <NavigationMenuItem value="products">
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[calc(100vw-2rem)] max-w-[520px] gap-0.5 sm:grid-cols-2">
                  <li>
                    <Feature href="/deployments" icon={<RocketIcon size={16} />} title="Deployments">
                      Push to preview, promote to production.
                    </Feature>
                  </li>
                  <li>
                    <Feature href="/analytics" icon={<BarChartIcon size={16} />} title="Analytics">
                      Real traffic, no cookies, no sampling.
                    </Feature>
                  </li>
                  <li>
                    <Feature href="/storage" icon={<DatabaseIcon size={16} />} title="Storage">
                      Blobs, KV and Postgres beside your code.
                    </Feature>
                  </li>
                  <li>
                    <Feature href="/functions" icon={<CpuIcon size={16} />} title="Functions">
                      Server code that scales to zero.
                    </Feature>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem value="resources">
              <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="flex w-[calc(100vw-2rem)] max-w-[300px] flex-col gap-0.5">
                  <li>
                    <Feature href="/changelog" icon={<SparklesIcon size={16} />} title="Changelog">
                      What shipped this week.
                    </Feature>
                  </li>
                  <li>
                    <Feature href="/security" icon={<ShieldCheckIcon size={16} />} title="Security">
                      SOC 2, pen tests and the trust center.
                    </Feature>
                  </li>
                  <li>
                    <Feature href="/docs/blocks/templates" icon={<BookmarkIcon size={16} />} title="Templates">
                      Start from something that works.
                    </Feature>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            {/* Plain links sit beside the triggers with the same look. */}
            <NavigationMenuItem className="hidden @lg:block">
              <NavigationMenuLink href="/pricing" onClick={stay} className={navigationMenuTriggerStyle()}>
                Pricing
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <Button size="sm" className="hidden @md:inline-flex">
          Sign up
        </Button>
      </header>
      <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
        <p className="text-2xl font-semibold tracking-tight text-fg">Ship the web, faster.</p>
        <p className="max-w-sm text-ui-lg text-fg-muted">Move across the menu: the pill follows you, and the panel morphs between sizes.</p>
      </div>
    </div>
  )
}
