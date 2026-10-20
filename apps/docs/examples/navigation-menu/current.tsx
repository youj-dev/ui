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

const stay = (event: MouseEvent) => event.preventDefault()

const COMPONENTS = {
  Navigation: ['Tabs', 'Breadcrumb', 'Pagination', 'Sidebar'],
  Overlays: ['Dialog', 'Popover', 'Tooltip', 'Toast'],
}
// The page this header sits on.
const CURRENT = 'Tabs'

export default function NavigationMenuCurrent() {
  return (
    <div className="w-full max-w-xl rounded-xl border border-line bg-canvas px-3 py-2">
      {/* align="center" centers each panel under its trigger. */}
      <NavigationMenu aria-label="Documentation" align="center" className="mx-auto">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/docs" onClick={stay} className={navigationMenuTriggerStyle()}>
              Guides
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="components">
            <NavigationMenuTrigger>Components</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid w-[calc(100vw-2rem)] max-w-[360px] grid-cols-2 gap-x-2 p-1">
                {Object.entries(COMPONENTS).map(([group, names]) => (
                  <div key={group} className="flex flex-col">
                    <p className="px-2.5 pt-1.5 pb-1 text-ui-xs font-medium tracking-wide text-fg-muted uppercase">{group}</p>
                    {names.map((name) => (
                      // `active` marks the current page: aria-current="page" and a highlight.
                      <NavigationMenuLink
                        key={name}
                        href={`/docs/${name.toLowerCase()}`}
                        onClick={stay}
                        active={name === CURRENT}
                        closeOnClick
                        className="py-1.5 text-fg-muted hover:text-fg data-active:font-medium data-active:text-fg"
                      >
                        {name}
                      </NavigationMenuLink>
                    ))}
                  </div>
                ))}
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/changelog" onClick={stay} className={navigationMenuTriggerStyle()}>
              Changelog
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}
