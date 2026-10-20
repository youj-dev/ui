'use client'

import { CommandGroup, CommandItem } from '../../../components/ui/command'
import { CommandPalette } from '../../../components/ui/command-palette'
import { groupsOf, type DocsCopy, type Page } from './data'

export function SearchPalette({
  pages,
  copy,
  open,
  onOpenChange,
  onNavigate,
}: {
  pages: Page[]
  copy: DocsCopy
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (id: string) => void
}) {
  return (
    <CommandPalette open={open} onOpenChange={onOpenChange} placeholder={copy.searchPlaceholder} title={copy.searchTitle}>
      {({ close }) =>
        groupsOf(pages).map((group) => (
          <CommandGroup key={group} heading={group}>
            {pages.filter((p) => p.group === group).map((p) => (
              <CommandItem
                key={p.id}
                value={`${p.title} ${p.sections.map((s) => s.title).join(' ')}`}
                onSelect={() => {
                  onNavigate(p.id)
                  close()
                }}
              >
                <span className="font-medium text-fg">{p.title}</span>
                <span className="ms-auto truncate text-ui-sm text-fg-muted">{p.sections.map((s) => s.title).join(' · ')}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))
      }
    </CommandPalette>
  )
}
