'use client'

import type { MouseEvent } from 'react'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@youj/react'
import { RocketIcon } from '@youj/icons'

// In a site these are real routes. Here they stay on the page.
const stay = (event: MouseEvent) => event.preventDefault()

const DOCS = [
  { href: '/docs', title: 'Documentation', body: 'Guides, concepts and recipes.' },
  { href: '/docs/api', title: 'API reference', body: 'Every endpoint, with examples.' },
  { href: '/docs/cli', title: 'CLI', body: 'Deploy and roll back from your terminal.' },
]

export default function NavigationMenuFeatured() {
  return (
    <div className="w-full max-w-xl rounded-xl border border-line bg-canvas px-3 py-2">
      <NavigationMenu aria-label="Primary" className="mx-auto">
        <NavigationMenuList>
          <NavigationMenuItem value="developers">
            <NavigationMenuTrigger>Developers</NavigationMenuTrigger>
            <NavigationMenuContent>
              {/* A grid: the featured link spans every row beside the others, and stacks above them on a phone. */}
              <div className="grid w-[calc(100vw-2rem)] max-w-[460px] gap-0.5 sm:grid-cols-[11rem_1fr]">
                <NavigationMenuLink
                  href="/docs/quickstart"
                  onClick={stay}
                  closeOnClick
                  className="flex-col gap-1 bg-accent-subtle p-4 hover:bg-accent-subtle focus-visible:bg-accent-subtle sm:row-span-3"
                >
                  <span className="mb-auto grid size-10 place-items-center rounded-lg border border-line bg-canvas text-accent shadow-xs">
                    <RocketIcon size={20} className="size-5" />
                  </span>
                  <span className="mt-4 font-medium text-fg">Quickstart</span>
                  <span className="text-ui-sm text-fg-muted">Deploy a template and ship your first change in a minute.</span>
                </NavigationMenuLink>
                {DOCS.map((doc) => (
                  <NavigationMenuLink key={doc.href} href={doc.href} onClick={stay} closeOnClick className="flex-col gap-0.5">
                    <span className="font-medium text-fg">{doc.title}</span>
                    <span className="text-ui-sm text-fg-muted">{doc.body}</span>
                  </NavigationMenuLink>
                ))}
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/customers" onClick={stay} className={navigationMenuTriggerStyle()}>
              Customers
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/pricing" onClick={stay} className={navigationMenuTriggerStyle()}>
              Pricing
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}
