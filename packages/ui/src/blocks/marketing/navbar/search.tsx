'use client'

import { useMemo } from 'react'
import { AppHeaderSearch } from '../../../components/ui/app-header'
import { CommandGroup, CommandItem } from '../../../components/ui/command'
import { CommandPalette } from '../../../components/ui/command-palette'
import type { MarketingNavbarCopy, MarketingNavbarItem, MarketingNavbarSearchItem } from './data'

/* ⌘K search. The palette finds every link of the menus (by label,
 * description and its section) and any extra pages you pass, grouped. */

function entries(links: MarketingNavbarItem[], extra: MarketingNavbarSearchItem[]) {
  const own: MarketingNavbarSearchItem[] = links.flatMap((item) =>
    item.groups
      ? item.groups.flatMap((group) =>
          group.links.map((link) => ({
            id: link.href,
            label: link.label,
            href: link.href,
            group: item.label,
            keywords: [group.title, link.description ?? ''],
          })),
        )
      : item.href
        ? [{ id: item.href, label: item.label, href: item.href }]
        : [],
  )
  const seen = new Set(own.map((entry) => entry.href))
  return [...own, ...extra.filter((entry) => !seen.has(entry.href))]
}

interface SearchProps {
  links: MarketingNavbarItem[]
  items: MarketingNavbarSearchItem[]
  copy: MarketingNavbarCopy
  /** A result was chosen; the palette has closed. */
  onSelect: (item: MarketingNavbarSearchItem) => void
  /** Opens from outside, e.g. the drawer's own search button. */
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NavbarSearch({ links, items, copy, onSelect, open, onOpenChange }: SearchProps) {
  const all = useMemo(() => entries(links, items), [links, items])
  const groups = useMemo(() => {
    const map = new Map<string, MarketingNavbarSearchItem[]>()
    for (const entry of all) map.set(entry.group ?? copy.searchPages, [...(map.get(entry.group ?? copy.searchPages) ?? []), entry])
    return [...map]
  }, [all, copy.searchPages])
  return (
    <CommandPalette open={open} onOpenChange={onOpenChange} title={copy.searchTitle} placeholder={copy.searchPlaceholder} autoFocusField>
      {groups.map(([heading, rows]) => (
        <CommandGroup key={heading} heading={heading}>
          {rows.map((entry) => (
            <CommandItem
              key={entry.id}
              value={[entry.label, heading, ...(entry.keywords ?? [])].join(' ')}
              onSelect={() => {
                onOpenChange(false)
                onSelect(entry)
              }}
            >
              {entry.label}
            </CommandItem>
          ))}
        </CommandGroup>
      ))}
    </CommandPalette>
  )
}

export function SearchButton({ copy, onOpen }: { copy: MarketingNavbarCopy; onOpen: () => void }) {
  return <AppHeaderSearch placeholder={copy.searchPlaceholder} aria-label={copy.searchLabel} onClick={onOpen} />
}
