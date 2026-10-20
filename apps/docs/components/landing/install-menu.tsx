'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@youj/react/components/ui/dropdown-menu'
import { ChevronDownIcon } from '@youj/icons/components/youj/icons/chevron-down'
import { cn } from '@/lib/cn'
import type { InstallMode } from './install-field'

/** The island menus' picked row (preview-island's PICKED): the accent, no check. Copied so the landing doesn't load that module. */
const PICKED = 'own:pe-2 [&>[data-slot=dropdown-menu-radio-item-indicator]]:hidden data-checked:text-accent-text data-checked:[&>svg]:text-accent-text!'

const MODES: { value: InstallMode; label: string }[] = [
  { value: 'package', label: 'Package' },
  { value: 'registry', label: 'Copy in' },
]

/** The install field's menu, loaded the first time it's opened (the field draws a plain trigger until then) and open on arrival. */
export default function InstallMenu({
  value,
  label,
  onValueChange,
  options,
  group,
  mode,
  triggerClass,
}: {
  value: string
  /** The trigger's text: the picked row's name. */
  label: string
  onValueChange: (value: string) => void
  /** The rows: the package managers, or the AI tools. */
  options: { value: string; label: string }[]
  /** The rows' accessible name: "Package manager". */
  group: string
  mode?: { value: InstallMode; onChange: (mode: InstallMode) => void }
  triggerClass: string
}) {
  return (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger aria-label="Install options" className={triggerClass}>
        {label}
        <ChevronDownIcon size={14} aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-auto min-w-40">
        {mode && (
          <>
            <DropdownMenuRadioGroup value={mode.value} onValueChange={(v) => mode.onChange(v as InstallMode)} aria-label="Install method" className="grid grid-cols-2 gap-1 rounded-md bg-band p-0.5">
              {MODES.map((m) => (
                <DropdownMenuRadioItem key={m.value} value={m.value} closeOnClick={false} className={cn(PICKED, 'justify-center text-[12.5px] data-checked:bg-overlay data-checked:shadow-xs')}>
                  {m.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange} aria-label={group}>
          {options.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value} className={cn(PICKED, 'font-mono')}>
              {o.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
