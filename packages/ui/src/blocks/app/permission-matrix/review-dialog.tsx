'use client'

import { ArrowRightIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog'
import type { PermissionChange, PermissionLevel } from '../../../components/ui/level-matrix'
import { cn } from '../../../lib/utils'
import type { PermissionMatrixCopy } from './data'

interface ReviewDialogProps {
  changes: PermissionChange[]
  names: Record<PermissionLevel, string>
  copy: PermissionMatrixCopy
  onDiscard: () => void
  onApply: () => Promise<unknown> | unknown
}

const RANK: Record<PermissionLevel, number> = { none: 0, read: 1, write: 2, admin: 3 }

/* The pending changes as a diff before they're applied: one line per cell,
 * a plus or a minus in the success or danger ink, the role and resource, and
 * the level it had and the level it gets. Discard all and Apply close it. */
function ReviewDialog({ changes, names, copy, onDiscard, onApply }: ReviewDialogProps) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="secondary" disabled={!changes.length} />}>{copy.review}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.reviewTitle}</DialogTitle>
          <DialogDescription>{copy.reviewDescription(changes.length, copy.scope)}</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-1 font-mono text-ui">
          {changes.map((change) => {
            const gain = RANK[change.to] > RANK[change.from]
            return (
              <li
                key={`${change.role.id}:${change.resource.id}`}
                className={cn(
                  'flex items-center gap-3 rounded-[min(var(--radius-md),8px)] px-3 py-2',
                  gain ? 'bg-[color-mix(in_oklab,var(--color-success)_9%,transparent)]' : 'bg-[color-mix(in_oklab,var(--color-danger)_9%,transparent)]',
                )}
              >
                <span aria-hidden className={cn('w-3 shrink-0 text-center', gain ? 'text-success-text' : 'text-danger-text')}>
                  {gain ? '+' : '−'}
                </span>
                <span className="min-w-0 flex-1 truncate text-fg">{copy.change(change.role.name, change.resource.name)}</span>
                <span className="flex shrink-0 items-center gap-1.5 text-ui-sm">
                  <span className="text-fg-muted line-through decoration-line-strong">{names[change.from]}</span>
                  <ArrowRightIcon size={12} className="text-fg-muted rtl:-scale-x-100" />
                  <span className={gain ? 'text-success-text' : 'text-danger-text'}>{names[change.to]}</span>
                </span>
              </li>
            )
          })}
        </ul>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" onClick={onDiscard} />}>{copy.discard}</DialogClose>
          <DialogClose render={<Button onClick={() => onApply()} />}>{copy.apply}</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ReviewDialog }
