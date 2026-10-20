'use client'

import type { ReactNode } from 'react'
import { MoreHorizontalIcon } from '@youj/icons/components/youj/icons/more-horizontal'
import { Button } from '../../../components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip'
import { cn } from '../../../lib/utils'
import type { DataGridRowAction } from './body'

/**
 * The row's actions, in their own pinned column at the end, sized for them,
 * so nothing ever moves or sits under them. The "…" menu holds all of them
 * and always shows, quietly; the inline ones are icon buttons that fade in
 * beside it (with a 4px glide from the end) on hover or focus. On touch they
 * always show.
 */
export function RowActions<TData>({ row, actions, label }: { row: TData; actions: DataGridRowAction<TData>[]; label: string }) {
  const inline = actions.filter((action) => action.inline && action.icon)
  return (
    <span data-slot="data-grid-row-actions" className="own:flex items-center justify-end gap-0.5 own:pe-2.5">
      {inline.length > 0 && (
        <span
          className={cn(
            'own:flex items-center gap-0.5 opacity-0 translate-x-1 rtl:-translate-x-1 transition-[opacity,translate] yj-duration-fast ease-standard reduced:translate-x-0',
            'group-hover/row:translate-x-0 group-hover/row:opacity-100 group-focus-within/row:translate-x-0 group-focus-within/row:opacity-100',
            'group-data-selected/row:translate-x-0 group-data-selected/row:opacity-100 touch:translate-x-0 touch:opacity-100',
          )}
        >
          {inline.map((action) => {
            const Icon = action.icon!
            return (
              <Tooltip key={action.label}>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      data-dg-focus=""
                      tabIndex={-1}
                      aria-label={action.label}
                      disabled={action.disabled}
                      onClick={() => action.onSelect(row)}
                      className={cn('own:hover:text-fg', action.destructive && 'own:hover:bg-danger-subtle own:hover:text-danger-text')}
                    />
                  }
                >
                  <Icon />
                </TooltipTrigger>
                <TooltipContent>{action.label}</TooltipContent>
              </Tooltip>
            )
          })}
        </span>
      )}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              data-dg-focus=""
              tabIndex={-1}
              aria-label={label}
              className="own:text-fg-subtle own:group-hover/row:text-fg-muted own:hover:text-fg own:data-popup-open:text-fg"
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <MenuAction key={action.label} separated={action.separated}>
                <DropdownMenuItem variant={action.destructive ? 'danger' : 'default'} disabled={action.disabled} onClick={() => action.onSelect(row)}>
                  {Icon && <Icon />}
                  {action.label}
                  {action.shortcut && <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut>}
                </DropdownMenuItem>
              </MenuAction>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  )
}

function MenuAction({ separated, children }: { separated?: boolean; children: ReactNode }) {
  return (
    <>
      {separated && <DropdownMenuSeparator />}
      {children}
    </>
  )
}
