'use client'

import { SlidingIndicator } from '@youj/motion'
import { Badge } from '../../../components/ui/badge'
import type { ElementType, MouseEvent, ReactNode } from 'react'
import type { ApiKeysCopy, ApiKeysNavLink } from './data'

export function TopBar({ nav, copy, brand, linkComponent: Link }: { nav: ApiKeysNavLink[]; copy: ApiKeysCopy; brand: { name: string; logo?: ReactNode }; linkComponent: ElementType }) {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex h-12 max-w-6xl items-center gap-4 px-4 md:px-8">
        <span className="flex shrink-0 items-center gap-2 font-semibold tracking-tight text-fg">
          <span aria-hidden className="grid size-6 place-items-center rounded-sm bg-accent font-mono text-ui-xs text-on-accent">
            {brand.logo}
          </span>
          {brand.name}
          <Badge variant="outline" className="font-mono max-sm:hidden">
            {copy.brandBadge}
          </Badge>
        </span>
        <nav aria-label={copy.nav} className="relative isolate -mb-px flex min-w-0 items-stretch self-stretch overflow-x-auto">
          {nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              // The demo's placeholder links go nowhere.
              onClick={item.href === '#' ? (event: MouseEvent) => event.preventDefault() : undefined}
              aria-current={item.current ? 'page' : undefined}
              className="focus-ring flex shrink-0 items-center border-b-2 border-transparent px-2.5 text-ui text-fg-muted transition-colors yj-duration-fast ease-standard hover:text-fg aria-[current=page]:border-accent aria-[current=page]:text-fg"
            >
              {item.label}
            </Link>
          ))}
          <SlidingIndicator follow="hover" className="inset-y-2 rounded-sm bg-hover" />
        </nav>
      </div>
    </header>
  )
}
