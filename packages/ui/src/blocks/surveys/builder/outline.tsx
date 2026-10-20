'use client'

import { useId } from 'react'
import { FlagIcon, GitBranchIcon, PlusIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu'
import { SortableList, SortableListHandle, SortableListItem } from '../../../components/ui/sortable-list'
import { cn } from '../../../lib/utils'
import { KINDS, kindOf, type QuestionKind, type QuestionKindKey, type SurveyBuilderCopy } from './data'
import type { Builder } from './use-builder'

/* The outline: every question in order, numbered, with its kind's mark on a
 * chip tinted by its group (choices, text, scales) and a branch where logic
 * decides whether it's asked. Drag a row by its grip, or Tab to the grips and
 * press Space, then the arrows (each step announced); the rows glide aside.
 * Add question, at the foot of the list, opens the palette of kinds, grouped,
 * each with what it asks for; the new question lands after the selected one.
 * The ending is the last row and doesn't move. */

/** A kind's mark on a neutral recessed chip: the icon tells the kinds apart, not a colour. */
export function KindChip({ kind, size = 'default', className }: { kind: QuestionKind; size?: 'sm' | 'default' | 'lg'; className?: string }) {
  const Icon = kind.icon
  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-md bg-band text-fg-muted',
        size === 'sm' ? 'size-5' : size === 'lg' ? 'size-8' : 'size-6',
        className,
      )}
    >
      <Icon size={size === 'sm' ? 12 : size === 'lg' ? 15 : 13} />
    </span>
  )
}

interface OutlineProps {
  builder: Builder
  copy: SurveyBuilderCopy
  /** A row was chosen (on a phone, the editor opens). */
  onOpen: (id: string) => void
  className?: string
}

export function Outline({ builder, copy, onOpen, className }: OutlineProps) {
  const { survey, selected } = builder
  const order = survey.questions.map((q) => q.id)
  const headingId = useId()

  return (
    <nav aria-labelledby={headingId} className={cn('flex min-h-0 flex-col', className)}>
      <div className="flex h-12 shrink-0 items-center gap-2 px-4">
        <h2 id={headingId} className="flex items-baseline gap-2 text-ui font-semibold text-fg">
          {copy.questions}
          <span className="font-mono text-ui-xs font-normal text-fg-subtle tabular-nums">{survey.questions.length}</span>
        </h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto yj-scrollbar px-2 pb-2">
        <SortableList aria-labelledby={headingId} value={order} onValueChange={builder.reorder} className="gap-0.5">
          {survey.questions.map((question, index) => {
            const kind = kindOf(question)
            const title = question.title.trim() || copy.untitled
            const logic = !!question.showIf?.conditions.length
            return (
              <SortableListItem
                key={question.id}
                value={question.id}
                textValue={title}
                className="group/row min-h-0 gap-0.5 border-transparent bg-transparent px-1 py-0.5 has-[[aria-pressed=true]]:bg-surface"
              >
                {/* The grip shows on hover and focus; on touch it's always there. */}
                <SortableListHandle className="opacity-0 transition-opacity yj-duration-fast ease-standard group-hover/row:opacity-100 focus-visible:opacity-100 aria-pressed:opacity-100 touch:opacity-100" />
                <button
                  type="button"
                  aria-current={question.id === selected || undefined}
                  aria-label={copy.rowLabel(index + 1, title, copy.kinds[kind.key], logic)}
                  onClick={() => onOpen(question.id)}
                  className={cn(
                    'flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1.5 text-start text-ui focus-ring',
                    'text-fg-muted transition-colors yj-duration-fast ease-standard hover:bg-hover hover:text-fg aria-[current]:bg-selected aria-[current]:text-fg',
                  )}
                >
                  <span aria-hidden className="w-4 shrink-0 text-end font-mono text-ui-xs text-fg-subtle tabular-nums">
                    {index + 1}
                  </span>
                  <KindChip kind={kind} size="sm" />
                  <span className="min-w-0 flex-1 truncate">{title}</span>
                  {logic && <GitBranchIcon size={13} aria-hidden className="shrink-0 text-accent-text" />}
                </button>
              </SortableListItem>
            )
          })}
        </SortableList>
      </div>
      {/* The way to a new question, at the foot of the list, as wide as the panel. */}
      <div className="shrink-0 px-2 pt-1 pb-2">
        <TypeMenu
          copy={copy}
          side="top"
          onPick={(kind) => onOpen(builder.add(kind))}
          trigger={
            <Button variant="outline" className="w-full gap-1.5">
              <PlusIcon size={14} />
              {copy.addQuestion}
            </Button>
          }
        />
      </div>
      <div className="shrink-0 border-t border-line p-2">
        <button
          type="button"
          aria-current={selected === 'ending' || undefined}
          onClick={() => onOpen('ending')}
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-start text-ui text-fg-muted transition-colors yj-duration-fast ease-standard hover:bg-hover hover:text-fg focus-ring aria-[current]:bg-selected aria-[current]:text-fg"
        >
          <FlagIcon size={14} aria-hidden className="shrink-0" />
          <span className="flex min-w-0 flex-col">
            <span className="font-medium">{copy.ending}</span>
            <span className="truncate text-ui-sm text-fg-subtle">{copy.endingHint}</span>
          </span>
        </button>
      </div>
    </nav>
  )
}

interface TypeMenuProps {
  copy: SurveyBuilderCopy
  onPick: (kind: QuestionKindKey) => void
  trigger: React.ReactElement
  /** Where the palette opens from its trigger. Default 'bottom'. */
  side?: 'top' | 'bottom'
}

/** The palette of kinds, grouped: each item its mark, its name and what it asks for. */
export function TypeMenu({ copy, onPick, trigger, side = 'bottom' }: TypeMenuProps) {
  const groups = (['choice', 'text', 'scale'] as const).map((group) => ({ group, kinds: KINDS.filter((k) => k.group === group) }))
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent side={side} align="start" className="w-(--anchor-width) min-w-64">
        {groups.map(({ group, kinds }, i) => (
          <DropdownMenuGroup key={group}>
            {i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel>{copy.groups[group]}</DropdownMenuLabel>
            {kinds.map((kind) => {
              return (
                <DropdownMenuItem key={kind.key} onClick={() => onPick(kind.key)} className="gap-2.5">
                  <KindChip kind={kind} />
                  <span className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
                    <span className="truncate">{copy.kinds[kind.key]}</span>
                    <span className="truncate text-ui-sm text-fg-subtle">{copy.hints[kind.key]}</span>
                  </span>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
