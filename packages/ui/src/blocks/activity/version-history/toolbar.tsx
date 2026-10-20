'use client'

import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon, PencilIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Switch } from '../../../components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip'
import type { VersionHistoryCopy, VersionHistoryVersion } from './data'

/* Over the preview: what it's compared to, whether changes show, and a way
 * through them (Alt+↑ and Alt+↓ from anywhere in the block do the same);
 * and the version's name, which can be given or changed in place. */

export function CompareBar({
  copy,
  options,
  compareTo,
  onCompareTo,
  showChanges,
  onShowChanges,
  stop,
  stops,
  onStep,
  switchId,
}: {
  copy: VersionHistoryCopy
  options: { value: string; label: string }[]
  compareTo: string
  onCompareTo: (value: string) => void
  showChanges: boolean
  onShowChanges: (show: boolean) => void
  /** The change on show, 0 for none yet. */
  stop: number
  stops: number
  onStep: (by: 1 | -1) => void
  switchId: string
}) {
  return (
    <div data-slot="version-toolbar" className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-(--card-spacing) py-2.5">
      <div className="flex items-center gap-2">
        <span className="text-ui-sm text-fg-muted max-sm:sr-only">{copy.compareTo}</span>
        <Select items={options} value={compareTo} onValueChange={(next) => next && onCompareTo(next as string)}>
          <SelectTrigger size="sm" aria-label={copy.compareTo} className="min-w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Switch id={switchId} size="sm" checked={showChanges} onCheckedChange={onShowChanges} />
        <Label htmlFor={switchId} className="font-normal text-fg-muted">
          {copy.showChanges}
        </Label>
      </div>
      <div className="ms-auto flex items-center gap-1">
        <span className="me-1 text-ui-sm whitespace-nowrap text-fg-muted tabular-nums">
          {stops === 0 || !showChanges ? copy.noChanges : stop > 0 ? copy.changeOf(stop, stops) : copy.changes(stops)}
        </span>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={copy.previousChange}
                aria-keyshortcuts="Alt+ArrowUp"
                disabled={!showChanges || stops === 0}
                onClick={() => onStep(-1)}
              />
            }
          >
            <ChevronUpIcon size={15} />
          </TooltipTrigger>
          <TooltipContent>{copy.previousChange}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={copy.nextChange}
                aria-keyshortcuts="Alt+ArrowDown"
                disabled={!showChanges || stops === 0}
                onClick={() => onStep(1)}
              />
            }
          >
            <ChevronDownIcon size={15} />
          </TooltipTrigger>
          <TooltipContent>{copy.nextChange}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

export function VersionName({
  version,
  label,
  copy,
  onRename,
}: {
  version: VersionHistoryVersion
  label: string
  copy: VersionHistoryCopy
  onRename: (name: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  if (editing) {
    return (
      <form
        className="flex items-center gap-1.5"
        onSubmit={(event) => {
          event.preventDefault()
          setEditing(false)
          if (value.trim() !== (version.name ?? '')) onRename(value.trim())
        }}
      >
        <Input
          autoFocus
          aria-label={copy.rename}
          placeholder={copy.renamePlaceholder}
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation()
              setEditing(false)
            }
          }}
          className="h-control-sm w-56"
        />
        <Button type="submit" size="sm">
          {copy.save}
        </Button>
      </form>
    )
  }
  return (
    <span className="flex min-w-0 items-center gap-1">
      <span className="truncate font-medium text-fg">{label}</span>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={copy.rename}
              onClick={() => {
                setValue(version.name ?? '')
                setEditing(true)
              }}
            />
          }
        >
          <PencilIcon size={13} />
        </TooltipTrigger>
        <TooltipContent>{copy.rename}</TooltipContent>
      </Tooltip>
    </span>
  )
}
