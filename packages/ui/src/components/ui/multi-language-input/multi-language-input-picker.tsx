'use client'

import { useEffect, useRef, useState, useSyncExternalStore, type ComponentType, type KeyboardEvent, type RefObject } from 'react'
import { ChevronDownIcon } from '@youj/icons/components/youj/icons/chevron-down'
import { cn } from '../../../lib/utils'
import { PopoverTrigger } from '../popover'
import { needsWork } from './multi-language-input-model'
import { useMultiLanguageContext } from './multi-language-input-provider'
import { StatusGlyph } from './multi-language-input-status'

/* The picker's trigger and state. Its list is a chunk of its own, loaded
 * on demand (as Button loads its async half): the switcher asks for it as
 * soon as it has locales to pick from, so it has arrived before anyone opens
 * the picker, and an app whose fields never overflow never loads it. */

function usePicker() {
  const { active } = useMultiLanguageContext()
  const [open, setOpenState] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState<string | null>(null)
  const picked = useRef(false)
  const setOpen = (next: boolean, search = '') => {
    setOpenState(next)
    setQuery(search)
    if (next) {
      picked.current = false
      setHighlight(search ? null : active)
    }
  }
  return { open, setOpen, query, setQuery, highlight, setHighlight, picked }
}

type Picker = ReturnType<typeof usePicker>

const keyClass = 'gap-1.5 own:px-2 text-ui-sm font-medium tracking-wide'
const triggerClass = cn(
  'relative inline-flex h-full shrink-0 cursor-default items-center own:rounded-choice-key whitespace-nowrap select-none',
  'text-fg-muted transition-[color] yj-duration-fast ease-standard hover:text-fg focus-ring',
  'data-pressed:text-fg data-popup-open:text-fg',
)

function PickerTrigger({ picker, hidden, activeHidden }: { picker: Picker; hidden: number; activeHidden: boolean }) {
  const { byCode, active, summaries, labels } = useMultiLanguageContext()
  const current = byCode.get(active)!
  const status = summaries[active]?.status ?? 'missing'
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    // Typing on the trigger opens the picker with that letter searched.
    if (event.key.length === 1 && event.key !== ' ' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault()
      picker.setOpen(true, event.key)
    }
  }
  return (
    <PopoverTrigger
      data-pressed={activeHidden ? '' : undefined}
      aria-label={activeHidden ? `${current.label}, ${labels.allLanguages}` : `${labels.allLanguages}, ${labels.moreLanguages(hidden)}`}
      onKeyDown={onKeyDown}
      className={cn(triggerClass, keyClass)}
    >
      {activeHidden ? (
        <>
          <span aria-hidden className="own:uppercase">
            {active}
          </span>
          {needsWork(status) && <StatusGlyph status={status} />}
        </>
      ) : (
        <span aria-hidden className="own:tabular-nums">
          +{hidden}
        </span>
      )}
      <ChevronDownIcon size={14} strokeWidth={1.75} active={picker.open} className="own:-me-0.5 own:text-fg-muted" />
    </PopoverTrigger>
  )
}

function onDemand<T>(load: () => Promise<T>) {
  let loaded: T | undefined
  let pending: Promise<void> | undefined
  const listeners = new Set<() => void>()
  const fetch = () =>
    (pending ??= load().then(
      (value) => {
        loaded = value
        listeners.forEach((listener) => listener())
      },
      // A failed chunk (offline, a deploy in between) is fetched again by the next switcher.
      () => {
        pending = undefined
      },
    ))
  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => void listeners.delete(listener)
  }
  return function useOnDemand(wanted: boolean): T | undefined {
    const value = useSyncExternalStore(subscribe, () => loaded, () => undefined)
    useEffect(() => {
      if (wanted) void fetch()
    }, [wanted])
    return value
  }
}

type PickerListProps = { picker: Picker; anchor: RefObject<HTMLElement | null> }

/** The picker's list, once its chunk has arrived. */
const usePickerList = onDemand(() => import('./multi-language-input-picker-list').then((mod) => mod.PickerContent as ComponentType<PickerListProps>))

export { keyClass, PickerTrigger, triggerClass, usePicker, usePickerList }
export type { Picker }
