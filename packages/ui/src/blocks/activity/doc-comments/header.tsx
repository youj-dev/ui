'use client'

import { CheckCircleIcon, MessagePlusIcon } from '@youj/icons'
import { AvatarStack, type AvatarStackUser } from '../../../components/ui/avatar-stack'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Toggle } from '../../../components/ui/toggle'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip'
import type { DocCommentsCopy } from './data'
import type { DocSelection } from './use-selection'

/** The document's title and counts, who has it open, and whether resolved threads show (the count of them, pressed to show). */
export function DocHeader({
  title,
  titleId,
  level,
  copy,
  demo,
  open,
  resolved,
  viewers,
  showResolved,
  onShowResolvedChange,
}: {
  title: string
  titleId: string
  level: 1 | 2 | 3
  copy: DocCommentsCopy
  demo: boolean
  open: number
  resolved: number
  viewers: AvatarStackUser[]
  showResolved: boolean
  onShowResolvedChange: (show: boolean) => void
}) {
  const Title = (['h1', 'h2', 'h3'] as const)[level - 1]!
  return (
    <div data-slot="doc-header" className="flex items-center gap-3 border-b border-line px-(--card-spacing) py-4">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Title id={titleId} className="truncate text-ui-lg font-semibold tracking-tight text-fg">
            {title}
          </Title>
          {demo && (
            <Badge variant="outline" data-slot="demo-marker" className="border-dashed border-line-strong">
              {copy.demoData}
            </Badge>
          )}
        </div>
        <p className="text-ui-sm text-fg-muted tabular-nums">{copy.counts(open, resolved)}</p>
      </div>
      {viewers.length > 0 && <AvatarStack users={viewers} max={3} size="sm" label={copy.viewers} />}
      <Tooltip>
        <TooltipTrigger
          render={
            <Toggle
              variant="outline"
              size="sm"
              aria-label={copy.showResolved}
              pressed={showResolved}
              onPressedChange={onShowResolvedChange}
              className="gap-1 px-2 tabular-nums"
            />
          }
        >
          <CheckCircleIcon size={14} />
          {resolved}
        </TooltipTrigger>
        <TooltipContent>{copy.showResolved}</TooltipContent>
      </Tooltip>
    </div>
  )
}

/** The Comment button under a selection: a press keeps the selection, and makes it a new thread's words. */
export function AddComment({ selection, label, shortcut, onAdd }: { selection: DocSelection; label: string; shortcut: string; onAdd: () => void }) {
  return (
    <Button
      size="xs"
      variant="outline"
      data-slot="add-comment"
      aria-keyshortcuts={shortcut}
      onPointerDown={(event) => event.preventDefault()}
      onClick={onAdd}
      // Just under the selection's last line, ending about where it ends.
      style={{
        top: `calc(${selection.bottom}px + var(--spacing) * 7.5)`,
        insetInlineStart: `calc(var(--card-spacing) + max(0px, ${selection.end}px - var(--spacing) * 24))`,
      }}
      className="absolute z-10 bg-overlay shadow-md"
    >
      <MessagePlusIcon size={14} />
      {label}
    </Button>
  )
}
