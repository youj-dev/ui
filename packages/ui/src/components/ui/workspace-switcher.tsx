'use client'

import { useState, type ReactNode } from 'react'
import { useComponentLabels } from '@youj/core/labels'
import { workspaceSwitcherLabels } from '@youj/core/labels'
import { ChevronsUpDownIcon, PlusIcon } from '@youj/icons'
import { cn, initials } from '../../lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from './command'
import { Popover, PopoverContent, PopoverTrigger, type PopoverContentProps } from './popover'

/* Switch between workspaces (teams, orgs, projects): a trigger showing the
 * current one, and a Popover holding a searchable Command list. Each row has
 * the workspace's logo or initials and its plan; the current one wears a check
 * that draws in. "Create workspace" sits under the list and carries the search
 * text with it, so typing a name that isn't there and pressing Enter on it
 * starts creating that one.
 *
 * Keyboard: the trigger opens it with Enter / Space / ↓ and focus lands in the
 * search; ↑ ↓ move the active row (the list's sliding highlight follows), Enter
 * chooses, Escape closes and returns focus to the trigger. */

interface Workspace {
  id: string
  name: string
  /** Image URL for the logo. The initials show until it loads, and if it fails. */
  logo?: string
  /** A short line under the name, e.g. the plan or member count. */
  detail?: ReactNode
}

interface WorkspaceSwitcherProps {
  workspaces: Workspace[]
  value?: string
  defaultValue?: string
  onValueChange?: (id: string) => void
  /** Adds the "Create workspace" row. Receives what was typed in the search. */
  onCreate?: (name: string) => void
  createLabel?: string
  searchPlaceholder?: string
  /** Only the logo: for a sidebar collapsed to icons. */
  compact?: boolean
  align?: PopoverContentProps['align']
  side?: PopoverContentProps['side']
  /** The trigger's class. */
  className?: string
}

function WorkspaceLogo({ workspace, size = 'default' }: { workspace: Workspace; size?: 'sm' | 'default' }) {
  return (
    <Avatar aria-hidden size={size} className="rounded-md after:rounded-md">
      {workspace.logo && <AvatarImage src={workspace.logo} alt="" className="rounded-md" />}
      <AvatarFallback className="rounded-md bg-accent-subtle font-semibold text-accent-text">{initials(workspace.name)}</AvatarFallback>
    </Avatar>
  )
}

function WorkspaceSwitcher({
  workspaces,
  value: valueProp,
  defaultValue,
  onValueChange,
  onCreate,
  createLabel,
  searchPlaceholder,
  compact = false,
  align = 'start',
  side,
  className,
}: WorkspaceSwitcherProps) {
  const labels = useComponentLabels(workspaceSwitcherLabels)
  createLabel ??= labels.workspaceCreate
  searchPlaceholder ??= labels.workspaceSearch
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? workspaces[0]?.id)
  const value = valueProp ?? uncontrolled
  const current = workspaces.find((w) => w.id === value) ?? workspaces[0]

  const choose = (id: string) => {
    if (valueProp === undefined) setUncontrolled(id)
    onValueChange?.(id)
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) setSearch('')
      }}
    >
      <PopoverTrigger
        data-slot="workspace-switcher-trigger"
        data-compact={compact || undefined}
        aria-label={current ? labels.workspaceSwitch(current.name) : labels.workspaceChoose}
        className={cn(
          'group/workspace-trigger flex h-control-lg min-w-0 items-center gap-2 own:rounded-md own:px-1.5 text-start text-ui text-fg focus-ring',
          'transition-[background-color] yj-duration-fast ease-standard hover:bg-hover own:data-popup-open:bg-hover',
          compact && 'size-control-lg justify-center own:px-0',
          className,
        )}
        data-yj-trigger=""
      >
        {current && <WorkspaceLogo workspace={current} />}
        <span className={cn('own:flex min-w-0 flex-1 flex-col own:leading-tight', compact && 'sr-only')}>
          <span className="truncate own:font-medium">{current?.name ?? labels.workspaceChoose}</span>
          {current?.detail && <span className="truncate own:text-ui-sm own:text-fg-muted">{current.detail}</span>}
        </span>
        {!compact && <ChevronsUpDownIcon active={open} size={14} strokeWidth={1.75} className="shrink-0 own:text-fg-muted" />}
      </PopoverTrigger>
      <PopoverContent align={align} side={side} data-slot="workspace-switcher" className="max-h-(--available-height) w-64 gap-0 overflow-hidden own:p-0">
        {/* Plain substring matching: a new name shouldn't fuzzily match an existing one. */}
        <Command label={labels.workspaces} filter={(value, query) => (value.toLowerCase().includes(query.trim().toLowerCase()) ? 1 : 0)}>
          <CommandInput value={search} onValueChange={setSearch} placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{labels.workspaceNoMatch}</CommandEmpty>
            <CommandGroup heading={labels.workspaces}>
              {workspaces.map((w) => (
                <CommandItem
                  key={w.id}
                  value={`${w.name} ${w.id}`}
                  onSelect={() => choose(w.id)}
                  checked={w.id === current?.id}
                  className="own:py-1.5"
                >
                  <WorkspaceLogo workspace={w} size="sm" />
                  <span className="own:flex min-w-0 flex-col own:leading-tight">
                    <span className="truncate">{w.name}</span>
                    {w.detail && (
                      <span className="truncate own:text-ui-xs own:text-fg-muted">
                        <span className="sr-only">, </span>
                        {w.detail}
                      </span>
                    )}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            {onCreate && (
              <>
                <CommandSeparator alwaysRender />
                <CommandGroup forceMount>
                  <CommandItem
                    value={`create ${search}`}
                    forceMount
                    onSelect={() => {
                      onCreate(search.trim())
                      setOpen(false)
                    }}
                    data-yj-trigger=""
                  >
                    <PlusIcon size={16} strokeWidth={1.75} />
                    <span className="truncate">{search.trim() ? labels.workspaceCreateNamed(createLabel, search.trim()) : createLabel}</span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { WorkspaceSwitcher }
export type { Workspace, WorkspaceSwitcherProps }
