'use client'

import { useEffect, useRef, type ComponentProps, type KeyboardEvent } from 'react'
import { useLocale } from '@youj/core'
import { itemPagerLabels, useComponentLabels } from '@youj/core/labels'
import { ChevronDownIcon } from '@youj/icons/components/youj/icons/chevron-down'
import { ChevronUpIcon } from '@youj/icons/components/youj/icons/chevron-up'
import { cn, numberFormat } from '../../lib/utils'
import { Button } from './button'
import { Kbd } from './kbd'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

/* Steps through the records of a list without going back to it: the ↓ and ↑
 * of a detail panel ("5 of 48"), where ↓ is the next row down. J and K (or
 * the arrow keys) step while focus is in it; `shortcuts="global"` listens on
 * the whole page instead, as an open record drawer wants, skipping keys typed
 * into a field. The ends disable their button but keep it focusable, so a
 * keyboard that steps onto the last record stays where it was. The position
 * is announced politely as it changes. */

interface ItemPagerProps extends Omit<ComponentProps<'div'>, 'onChange'> {
  /** The open record's index in the list, from 0. */
  index: number
  /** How many records the list has. */
  total: number
  /** Called with the index to open: one up or one down. */
  onIndexChange: (index: number) => void
  /** Where the keys step: `focus`, J, K, ↓ and ↑ while focus is in the stepper; `global`, also J and K anywhere on the page but a field; `none`, never. Default `focus`. */
  shortcuts?: 'focus' | 'global' | 'none'
  /** Formats the position. Default: the app's locale (YoujProvider's `locale`). */
  locale?: string
}

const NEXT_KEYS = ['j', 'ArrowDown']
const PREVIOUS_KEYS = ['k', 'ArrowUp']

/** Whether a key press belongs to a field (or anything else that takes typing), not to the page. */
function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || !!target.closest('input, textarea, select, [role=combobox], [role=textbox]'))
}

/** The step a key asks for: 1, -1, or 0 when it isn't one of ours (modifiers excluded). */
function stepFor(event: { key: string; metaKey: boolean; ctrlKey: boolean; altKey: boolean }) {
  if (event.metaKey || event.ctrlKey || event.altKey) return 0
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
  return NEXT_KEYS.includes(key) ? 1 : PREVIOUS_KEYS.includes(key) ? -1 : 0
}

function ItemPager({ index, total, onIndexChange, shortcuts = 'focus', locale: localeProp, className, ...props }: ItemPagerProps) {
  const labels = useComponentLabels(itemPagerLabels)
  const locale = useLocale(localeProp)
  const format = numberFormat(locale)
  const hasPrevious = index > 0
  const hasNext = index < total - 1
  const step = (by: number) => {
    const to = index + by
    if (to >= 0 && to < total) onIndexChange(to)
  }
  // The page-wide listener reads the latest props without re-subscribing.
  const latest = useRef(step)
  latest.current = step

  useEffect(() => {
    if (shortcuts !== 'global') return
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || isTyping(event.target)) return
      // Arrows scroll the page and move through lists: page-wide, only J and K step.
      if (event.key.startsWith('Arrow')) return
      const by = stepFor(event)
      if (!by) return
      event.preventDefault()
      latest.current(by)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [shortcuts])

  // In the capture phase: a disabled end button (still focusable) swallows its own keys, and the page's listener must not step twice.
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (shortcuts === 'none') return
    const by = stepFor(event)
    if (!by) return
    event.preventDefault()
    step(by)
  }

  const position = labels.recordOf(format.format(Math.min(index + 1, total)), format.format(total))
  const button = (by: 1 | -1) => {
    const next = by === 1
    const label = next ? labels.nextRecord : labels.previousRecord
    const Icon = next ? ChevronDownIcon : ChevronUpIcon
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="icon-xs"
              aria-label={label}
              aria-keyshortcuts={shortcuts === 'none' ? undefined : next ? 'J' : 'K'}
              data-slot={next ? 'item-pager-next' : 'item-pager-previous'}
              disabled={next ? !hasNext : !hasPrevious}
              focusableWhenDisabled
              onClick={() => step(by)}
            />
          }
        >
          {/* Still: the chevron-down's own motion turns it over, which would point it the wrong way. */}
          <Icon size={14} trigger="none" />
        </TooltipTrigger>
        <TooltipContent>
          {label}
          {shortcuts !== 'none' && <Kbd>{next ? 'J' : 'K'}</Kbd>}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div
      role="group"
      aria-label={labels.records}
      data-slot="item-pager"
      className={cn('own:inline-flex items-center own:gap-1', className)}
      onKeyDownCapture={keyDown}
      {...props}
    >
      {button(1)}
      {button(-1)}
      <span
        aria-live="polite"
        aria-atomic
        data-slot="item-pager-position"
        className="own:ms-1.5 own:text-ui-sm own:text-fg-muted own:tabular-nums whitespace-nowrap"
      >
        {total > 0 ? position : null}
      </span>
    </div>
  )
}

export { ItemPager, type ItemPagerProps }
