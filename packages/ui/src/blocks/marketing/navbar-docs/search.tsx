'use client'

import { useMemo, useState } from 'react'
import { FileTextIcon, HistoryIcon } from '@youj/icons'
import { CommandGroup, CommandItem } from '../../../components/ui/command'
import { CommandPalette } from '../../../components/ui/command-palette'
import type { NavbarDocsCopy, NavbarDocsPage, NavbarDocsResult, NavbarDocsSection } from './data'

/* ⌘K search over every page of every section, found by its title, its group
 * and its section, each row showing where it sits. Before anything is typed,
 * the pages chosen earlier in this visit come first, under Recent. */

/** Every page of every section, nested pages included, with its section and group. */
export function resultsOf(sections: NavbarDocsSection[]): NavbarDocsResult[] {
  const walk = (pages: NavbarDocsPage[], section: string, group: string): NavbarDocsResult[] =>
    pages.flatMap((page) => [{ label: page.label, href: page.href, section, group }, ...walk(page.pages ?? [], section, `${group} / ${page.label}`)])
  return sections.flatMap((section) => (section.groups ?? []).flatMap((group) => walk(group.pages, section.label, group.title)))
}

interface DocsSearchProps {
  results: NavbarDocsResult[]
  open: boolean
  onOpenChange: (open: boolean) => void
  /** A result was chosen; the palette has closed. */
  onSelect: (result: NavbarDocsResult) => void
  copy: NavbarDocsCopy
}

export function DocsSearch({ results, open, onOpenChange, onSelect, copy }: DocsSearchProps) {
  const [recent, setRecent] = useState<NavbarDocsResult[]>([])
  const bySection = useMemo(() => {
    const map = new Map<string, NavbarDocsResult[]>()
    for (const result of results) map.set(result.section, [...(map.get(result.section) ?? []), result])
    return [...map]
  }, [results])
  const choose = (result: NavbarDocsResult) => {
    setRecent((was) => [result, ...was.filter((r) => r.href !== result.href)].slice(0, 4))
    onOpenChange(false)
    onSelect(result)
  }
  const row = (result: NavbarDocsResult, icon: typeof FileTextIcon) => {
    const Icon = icon
    return (
      <>
        <Icon size={16} className="text-fg-subtle" />
        <span className="min-w-0 truncate">{result.label}</span>
        <span className="ms-auto truncate ps-3 text-ui-sm text-fg-subtle">{result.group}</span>
      </>
    )
  }
  return (
    <CommandPalette open={open} onOpenChange={onOpenChange} title={copy.searchTitle} placeholder={copy.searchPlaceholder} autoFocusField>
      {(state) => (
        <>
          {!state.search && recent.length > 0 && (
            <CommandGroup heading={copy.recent}>
              {recent.map((result) => (
                <CommandItem key={`recent ${result.href}`} value={`recent ${result.href}`} onSelect={() => choose(result)}>
                  {row(result, HistoryIcon)}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {bySection.map(([section, rows]) => (
            <CommandGroup key={section} heading={section}>
              {rows.map((result) => (
                <CommandItem key={result.href} value={`${result.label} ${result.group} ${section}`} onSelect={() => choose(result)}>
                  {row(result, FileTextIcon)}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </>
      )}
    </CommandPalette>
  )
}
