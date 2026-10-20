'use client'

import type { ReactNode } from 'react'
import { MenuIcon, SearchIcon, SparkleIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Kbd, KbdGroup } from '../../../components/ui/kbd'
import type { DocsCopy } from './data'

/** The docs' product in the header. */
export interface DocsBrand {
  name: string
  /** Your mark before the name. Default: the demo's sparkle tile. */
  logo?: ReactNode
  /** Where the name links. Default '#northstar'. */
  href?: string
}

export function DocsHeader({ brand, version, copy, onMenu, onSearch }: { brand: DocsBrand; version: string | null; copy: DocsCopy; onMenu: () => void; onSearch: () => void }) {
  return (
    <header data-yj-tone="header" className="sticky top-0 z-30 border-b border-line yj-glass">
      <div className="mx-auto flex h-14 max-w-[90rem] items-center gap-3 px-4 lg:px-6">
        <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label={copy.openNavigation} onClick={onMenu}>
          <MenuIcon size={16} />
        </Button>
        <a href={brand.href ?? '#northstar'} className="focus-ring flex items-center gap-2 rounded-md font-semibold tracking-tight">
          {brand.logo ?? (
            <span aria-hidden className="grid size-6 place-items-center rounded-md bg-fg text-canvas">
              <SparkleIcon size={14} />
            </span>
          )}
          {brand.name}
        </a>
        {version !== null && (
          <Badge variant="secondary" className="font-mono">
            {version}
          </Badge>
        )}
        <Button variant="outline" className="ms-auto w-control justify-start px-0 text-fg-muted max-sm:justify-center sm:w-64 sm:px-3" onClick={onSearch}>
          <SearchIcon size={15} />
          <span className="sr-only sm:not-sr-only">{copy.search}</span>
          <KbdGroup className="ms-auto hidden sm:inline-flex">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </Button>
      </div>
    </header>
  )
}
