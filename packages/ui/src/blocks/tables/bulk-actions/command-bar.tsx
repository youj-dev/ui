'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CommandIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '../../../components/ui/command'
import { DataTableConfirmAction } from '../../../components/ui/data-table'
import { Kbd } from '../../../components/ui/kbd'
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover'
import type { BulkActionsTableAction, BulkActionsTableCopy } from './data'

/** Where a key press belongs to what has focus, not to the selection. */
const typing = (target: EventTarget | null) => target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable=true], [role=combobox], [role=menu], [role=dialog], [role=alertdialog]') !== null

/**
 * The bar a selection raises becomes a command bar: the primary actions as
 * buttons with their keys, each action that asks first behind a
 * confirmation that names the count, and every action in a menu you can
 * search, each with its key. While the bar is up (rows are selected) a
 * letter runs its action from anywhere but a text field or an open menu,
 * ⌘K (Ctrl+K) opens the menu, and a key for an action that asks opens its
 * confirmation.
 */
export function CommandBar({
  count,
  noun,
  copy,
  actions,
  onAction,
}: {
  count: number
  noun: string
  copy: BulkActionsTableCopy
  actions: BulkActionsTableAction[]
  onAction: (action: string) => Promise<unknown> | void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const asking = useRef(new Map<string, HTMLSpanElement | null>())
  // An action that asks first does it through its own button: so focus returns to it when the confirmation closes.
  const ask = (id: string) => asking.current.get(id)?.querySelector('button')?.click()
  const latest = useRef({ onAction, ask, actions })
  useLayoutEffect(() => {
    latest.current = { onAction, ask, actions }
  })
  const buttons = actions.filter((a) => a.primary && !a.confirm)
  const asks = actions.filter((a) => a.confirm)
  const menu = actions.filter((a) => !a.confirm)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || typing(event.target)) return
      if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setMenuOpen(true)
        return
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const action = latest.current.actions.find((a) => a.shortcut?.toUpperCase() === event.key.toUpperCase())
      if (!action) return
      event.preventDefault()
      if (action.confirm) latest.current.ask(action.id)
      else void latest.current.onAction(action.id)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      {buttons.map((action) => {
        const Icon = action.icon
        return (
          <Button key={action.id} variant="ghost" size="sm" onClick={() => onAction(action.id)} aria-keyshortcuts={action.shortcut}>
            {Icon && <Icon />}
            {action.label}
            {action.shortcut && (
              <Kbd aria-hidden className="ms-0.5">
                {action.shortcut}
              </Kbd>
            )}
          </Button>
        )
      })}
      {asks.map((action) => {
        const Icon = action.icon
        return (
          <span key={action.id} ref={(node) => void asking.current.set(action.id, node)} className="contents">
            <DataTableConfirmAction label={action.label} icon={Icon && <Icon />} count={count} noun={noun} description={action.confirm!} onConfirm={() => onAction(action.id)} />
          </span>
        )
      })}
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger render={<Button variant="ghost" size="sm" aria-label={copy.more} aria-keyshortcuts="Meta+K Control+K" />}>
          <CommandIcon />
          <Kbd aria-hidden>K</Kbd>
        </PopoverTrigger>
        <PopoverContent align="end" side="top" className="w-72 gap-0 p-0">
          <Command label={copy.more}>
            <CommandInput placeholder={copy.commandPlaceholder} />
            <CommandList>
              <CommandEmpty>{copy.commandEmpty}</CommandEmpty>
              <CommandGroup heading={copy.more}>
                {menu.map((action) => {
                  const Icon = action.icon
                  return (
                    <CommandItem
                      key={action.id}
                      value={action.label}
                      onSelect={() => {
                        setMenuOpen(false)
                        void onAction(action.id)
                      }}
                    >
                      {Icon && <Icon />}
                      {action.label}
                      {action.shortcut && <CommandShortcut>{action.shortcut}</CommandShortcut>}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
              {asks.length > 0 && <CommandSeparator />}
              <CommandGroup>
                {asks.map((action) => {
                  const Icon = action.icon
                  return (
                    <CommandItem
                      key={action.id}
                      value={action.label}
                      onSelect={() => {
                        setMenuOpen(false)
                        // After the menu has closed and handed focus back.
                        requestAnimationFrame(() => ask(action.id))
                      }}
                      className={action.destructive ? 'text-danger-text' : undefined}
                    >
                      {Icon && <Icon />}
                      {action.label}
                      {action.shortcut && <CommandShortcut>{action.shortcut}</CommandShortcut>}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
            <p className="border-t border-line px-3 py-2 text-ui-xs text-fg-muted">{copy.shortcutsHint}</p>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  )
}
