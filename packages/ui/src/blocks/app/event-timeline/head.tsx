import { MoreHorizontalIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { CardAction, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu'
import type { EventTimelineCopy, EventTimelineEvent } from './data'

export const BADGE = { accent: 'default', neutral: 'secondary', success: 'success', warning: 'warning', danger: 'danger' } as const
const pad = (n: number) => String(n).padStart(2, '0')
export const clock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}

interface HeadProps {
  Title: 'h1' | 'h2' | 'h3'
  titleId: string
  event: EventTimelineEvent
  /** Shows the dashed "Demo data" badge. */
  demoMarker: boolean
  copy: EventTimelineCopy
  onCopyLink?: () => void
  onOpenRunbook?: () => void
}

/** The card's head: the title, the demo marker, the subtitle and the menu. */
export function Head({ Title, titleId, event, demoMarker, copy, onCopyLink, onOpenRunbook }: HeadProps) {
  return (
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Title id={titleId}>{event.title}</Title>
          {demoMarker && (
            <Badge variant="outline" data-slot="demo-marker" className="border-dashed border-line-strong">
              {copy.demoData}
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="font-mono">{copy.subtitle(event)}</CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={copy.more} />}>
              <MoreHorizontalIcon size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onCopyLink}>{copy.copyLink}</DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenRunbook}>{copy.runbook}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
  )
}
