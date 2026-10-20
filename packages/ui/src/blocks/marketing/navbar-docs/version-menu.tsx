'use client'

import type { ElementType } from 'react'
import { ArrowUpRightIcon, ChevronsUpDownIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu'
import type { NavbarDocsCopy, NavbarDocsVersion } from './data'

/* The version menu: the versions this site serves as a radio group (the one
 * shown checked, with its Latest or Pre-release tag), then the archived ones
 * as links that say they leave for another place. Arrow keys move through
 * it; Escape closes it and returns to the button. */

interface VersionMenuProps {
  versions: NavbarDocsVersion[]
  value: string
  onValueChange: (id: string) => void
  copy: NavbarDocsCopy
  Link: ElementType
}

export function VersionMenu({ versions, value, onValueChange, copy, Link }: VersionMenuProps) {
  const shown = versions.find((version) => version.id === value) ?? versions.find((version) => !version.href)
  const here = versions.filter((version) => !version.href)
  const archived = versions.filter((version) => version.href)
  if (!shown) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="xs" aria-label={copy.version(shown.label)} className="gap-1 font-mono tabular-nums" />}>
        {shown.label}
        <ChevronsUpDownIcon size={12} className="text-fg-subtle" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-52">
        <DropdownMenuRadioGroup value={shown.id} onValueChange={(id) => onValueChange(String(id))}>
          <DropdownMenuLabel>{copy.versionsTitle}</DropdownMenuLabel>
          {here.map((version) => (
            <DropdownMenuRadioItem key={version.id} value={version.id} className="font-mono tabular-nums">
              {version.label}
              {version.badge && (
                <Badge variant="secondary" className="font-sans">
                  {version.badge}
                </Badge>
              )}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {archived.length > 0 && <DropdownMenuSeparator />}
        {archived.map((version) => (
          <DropdownMenuItem key={version.id} render={<Link href={version.href} />} className="font-mono tabular-nums">
            {version.label}
            <span className="ms-auto font-sans text-ui-xs text-fg-subtle">{copy.archived}</span>
            <ArrowUpRightIcon size={14} className="text-fg-subtle" />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
