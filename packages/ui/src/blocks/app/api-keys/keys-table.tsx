'use client'

import { useMemo } from 'react'
import { useYouj } from '@youj/core'
import { PresenceItem, PresenceList } from '@youj/motion'
import { CopyIcon, MoreHorizontalIcon, RefreshIcon, TrashIcon } from '@youj/icons'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Table, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu'
import { Sparkline } from '../../../components/ui/sparkline'
import { cn, numberFormat } from '../../../lib/utils'
import { initials, lastUsed, scopeSummary, type ApiKey, type ApiKeyExpiry, type ApiKeysCopy } from './data'

export function KeysTable({
  keys,
  onRoll,
  onRevoke,
  copy,
  resources,
  expiries,
  now,
  peak,
  locale,
}: {
  keys: ApiKey[]
  onRoll: (key: ApiKey) => void
  onRevoke: (key: ApiKey) => void
  copy: ApiKeysCopy
  resources: string[]
  expiries: ApiKeyExpiry[]
  now: number
  /** The busiest day across every key, so sparklines share a scale. */
  peak: number
  locale: string
}) {
  const k = useYouj()
  const ago = useMemo(() => new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' }), [locale])
  const count = useMemo(() => numberFormat(locale), [locale])
  const cell = 'border-b border-line py-2 [tr:last-child>&]:border-b-0'
  return (
    <Table className="table-fixed border-separate border-spacing-0" aria-label={copy.table}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[52%] ps-4 sm:w-[34%] md:w-[20%]">{copy.name}</TableHead>
          <TableHead className="sm:w-[36%] md:w-[17%]">{copy.key}</TableHead>
          <TableHead className="w-[29%] max-lg:hidden">{copy.scopes}</TableHead>
          <TableHead className="w-32 max-md:hidden">{copy.createdBy}</TableHead>
          <TableHead className="w-24 max-sm:hidden">{copy.lastUsed}</TableHead>
          <TableHead className="w-24 max-md:hidden">{copy.traffic}</TableHead>
          <TableHead className="w-12 pe-4">
            <span className="sr-only">{copy.actions}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <PresenceList as="tbody">
        {keys.map((key) => {
          const scopes = scopeSummary(key.scopes, resources, copy.fullAccess)
          const idle = key.lastUsed === null
          return (
            <PresenceItem as="tr" key={key.id} className="bg-surface">
              <TableCell className={cn(cell, 'ps-4')}>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium text-fg">{key.name}</span>
                  <span className="truncate text-ui-xs text-fg-muted">{key.expires === 'never' ? copy.noExpiry : copy.expiresIn(expiries.find((e) => e.value === key.expires)?.label ?? key.expires)}</span>
                </div>
              </TableCell>
              <TableCell className={cell}>
                <code className="block truncate font-mono text-ui-sm text-fg-muted">
                  sk_{key.env}_<span aria-hidden>••••</span>
                  <span className="sr-only">{copy.ending}</span>
                  <span className="text-fg">{key.last4}</span>
                </code>
              </TableCell>
              <TableCell className={cn(cell, 'max-lg:hidden')}>
                <div className="flex flex-wrap gap-1">
                  {scopes.slice(0, 2).map((s) => (
                    <Badge key={s.label} variant={s.tone} className="font-mono">
                      {s.label}
                    </Badge>
                  ))}
                  {scopes.length > 2 && <Badge variant="outline">+{scopes.length - 2}</Badge>}
                </div>
              </TableCell>
              <TableCell className={cn(cell, 'max-md:hidden')}>
                <span className="flex min-w-0 items-center gap-2 text-fg-muted">
                  <Avatar size="sm" className="size-5">
                    <AvatarFallback className="text-ui-xs">{initials(key.createdBy)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{key.createdBy}</span>
                </span>
              </TableCell>
              <TableCell className={cn(cell, 'text-ui-sm tabular-nums max-sm:hidden', idle ? 'text-warning-text' : 'text-fg-muted')}>{lastUsed(key.lastUsed, now, ago, copy)}</TableCell>
              <TableCell className={cn(cell, 'max-md:hidden')}>
                <Sparkline
                  data={key.traffic}
                  color={idle ? 'var(--color-fg-subtle)' : 'var(--color-accent)'}
                  domain={[0, peak]}
                  label={copy.trafficLabel(key.name, count.format(key.traffic.reduce((a, b) => a + b, 0)))}
                  className="h-6 w-20"
                />
              </TableCell>
              <TableCell className={cn(cell, 'pe-4 text-end')}>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={copy.actionsFor(key.name)} />}>
                    <MoreHorizontalIcon size={16} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigator.clipboard?.writeText(key.id).catch(() => {})}>
                      <CopyIcon size={14} /> {copy.copyId}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimeout(() => onRoll(key), k.ms('fast'))}>
                      <RefreshIcon size={14} /> {copy.roll}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="danger" onClick={() => onRevoke(key)}>
                      <TrashIcon size={14} /> {copy.revoke}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </PresenceItem>
          )
        })}
      </PresenceList>
    </Table>
  )
}
