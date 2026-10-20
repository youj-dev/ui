'use client'

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDownIcon } from '@youj/icons/components/youj/icons/chevron-down'
import { cn } from '../../../lib/utils'
import { Button } from '../button'
import { Kbd, KbdGroup } from '../kbd'
import { Popover } from '../popover'
import { useFieldControl } from '../field'
import { SegmentedControl, SegmentedControlItem } from '../segmented-control'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../tooltip'
import type { LocaleInfo } from './multi-language-input-locales'
import { needsWork, statusName, type TranslationStatus } from './multi-language-input-model'
import { keyClass, PickerTrigger, triggerClass, usePicker, usePickerList } from './multi-language-input-picker'
import { useMultiLanguageContext } from './multi-language-input-provider'
import { MultiLanguageProgress, StatusGlyph } from './multi-language-input-status'

/* The locale switcher. Pinned locales are one-press keys in a segmented track
 * (the raised key glides between them); every other locale is a search away
 * in the picker, whose trigger is the track's last key and becomes the
 * selected one while the locale being edited isn't pinned. The track never
 * overflows: it measures how many pinned keys fit beside the trigger and
 * folds the rest into the picker (the source always stays). Up and down step
 * to the previous or next locale that needs work (Mod+Alt+↑ / ↓ from anywhere
 * inside). Reduced motion: the key jumps. */

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

function useIsApple() {
  const [apple, setApple] = useState(true)
  useEffect(() => {
    setApple(/mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent))
  }, [])
  return apple
}

function ChipContent({ locale, status, sr }: { locale: LocaleInfo; status: TranslationStatus; sr?: string }) {
  return (
    <>
      <span aria-hidden className="own:uppercase">
        {locale.code}
      </span>
      {needsWork(status) && <StatusGlyph status={status} />}
      {sr !== undefined && <span className="sr-only">{sr}</span>}
    </>
  )
}

/** How many pinned keys fit, measured on a hidden replica of the full track. */
function useFit(pinnedCount: number, everyLocalePinned: boolean) {
  const row = useRef<HTMLDivElement>(null)
  const tools = useRef<HTMLDivElement>(null)
  const ghost = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(pinnedCount)
  // The narrowest the row may get: one key beside the trigger, then the tools. Below it the keys were a sliver under the tools.
  const [minRow, setMinRow] = useState<number>()
  useIsomorphicLayoutEffect(() => {
    const measure = () => {
      const rowEl = row.current
      const track = ghost.current?.firstElementChild as HTMLElement | null
      // Not laid out (a hidden tab, a test DOM): keep every key.
      if (!rowEl?.clientWidth || !track) return setFit(pinnedCount)
      const style = getComputedStyle(track)
      const gap = parseFloat(style.columnGap) || 0
      const padding = (parseFloat(style.paddingInlineStart) || 0) + (parseFloat(style.paddingInlineEnd) || 0) + 2
      const chips = [...track.querySelectorAll<HTMLElement>('[data-chip]')].map((el) => el.getBoundingClientRect().width)
      const trigger = Math.max(0, ...[...track.querySelectorAll<HTMLElement>('[data-trigger]')].map((el) => el.getBoundingClientRect().width))
      const toolsWidth = tools.current?.getBoundingClientRect().width ?? 0
      const available = rowEl.clientWidth - (toolsWidth ? toolsWidth + (parseFloat(getComputedStyle(rowEl).columnGap) || 0) : 0)
      const width = (n: number, withTrigger: boolean) =>
        padding + chips.slice(0, n).reduce((a, b) => a + b, 0) + gap * Math.max(0, n - 1 + Number(withTrigger)) + (withTrigger ? trigger : 0)
      const rowGap = toolsWidth ? toolsWidth + (parseFloat(getComputedStyle(rowEl).columnGap) || 0) : 0
      setMinRow(Math.ceil(width(1, chips.length > 1 || !everyLocalePinned) + rowGap))
      if (everyLocalePinned && width(chips.length, false) <= available) return setFit(chips.length)
      let n = chips.length
      while (n > 1 && width(n, true) > available) n--
      setFit(n)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    if (row.current) observer.observe(row.current)
    if (tools.current) observer.observe(tools.current)
    return () => observer.disconnect()
  }, [pinnedCount, everyLocalePinned])
  return { row, tools, ghost, fit, minRow }
}

interface MultiLanguageSwitcherProps {
  className?: string
  /** Up and down buttons to the previous and next locale that needs work. Default: with more than three locales. */
  stepper?: boolean
  /** The progress ring and count. Default true. */
  progress?: boolean
}

/** Pinned locales as one-press keys, every other locale a search away, and a way to the next one that needs work. */
function MultiLanguageSwitcher({ className, stepper, progress = true }: MultiLanguageSwitcherProps) {
  const c = useMultiLanguageContext()
  const fieldDisabled = useFieldControl(undefined, { labelable: false }).disabled
  const { locales, byCode, pinned, active, setActive, summaries, labels } = c
  const statusOf = (code: string) => summaries[code]?.status ?? 'missing'
  const everyLocalePinned = pinned.length === locales.length
  const { row, tools, ghost, fit, minRow } = useFit(pinned.length, everyLocalePinned)
  const picker = usePicker()
  const track = useRef<HTMLDivElement>(null)

  // The first `fit` pinned keys, with the active one swapped in if it was folded away.
  let visible = pinned.slice(0, fit)
  if (pinned.includes(active) && !visible.includes(active)) visible = [...visible.slice(0, -1), active]
  const hidden = locales.length - visible.length
  const activeHidden = !visible.includes(active)
  const PickerList = usePickerList(hidden > 0)
  const describe = (code: string) => {
    const status = statusOf(code)
    const label = byCode.get(code)!.label
    return needsWork(status) || status === 'source' ? `${label}, ${statusName(labels, status)}` : label
  }
  const chip = (code: string, replica = false) => (
    <SegmentedControlItem key={code} value={code} data-chip="" aria-disabled={fieldDisabled || undefined} className={keyClass}>
      <ChipContent locale={byCode.get(code)!} status={statusOf(code)} sr={replica ? undefined : describe(code)} />
    </SegmentedControlItem>
  )

  return (
    <div
      ref={row}
      data-slot="multi-language-switcher"
      className={cn('relative own:flex own:w-full own:min-w-0 items-center own:gap-2', className)}
      // A toolbar around it wraps, or squeezes something else, before the keys turn to a sliver.
      style={minRow ? { minWidth: minRow } : undefined}
      onKeyDown={c.onKeyDown}
    >
      {/* The popover's root sits outside the track, so the popup isn't part of the key group. */}
      <Popover open={picker.open} onOpenChange={(open) => picker.setOpen(open)}>
        <SegmentedControl
          ref={track}
          size="sm"
          aria-label={labels.language}
          value={activeHidden ? '' : active}
          onValueChange={(code) => setActive(code)}
          className="min-w-0 shrink overflow-hidden"
        >
          {visible.map((code) => chip(code))}
          {hidden > 0 && <PickerTrigger picker={picker} hidden={hidden} activeHidden={activeHidden} />}
        </SegmentedControl>
        {hidden > 0 && PickerList && <PickerList picker={picker} anchor={track} />}
      </Popover>
      <div ref={tools} className="ms-auto own:flex shrink-0 items-center gap-1.5">
        {(stepper ?? locales.length > 3) && <Stepper />}
        {progress && <MultiLanguageProgress />}
      </div>
      {/* The full track, invisible and inert: what the fit is measured on. */}
      <div aria-hidden inert className="pointer-events-none invisible absolute inset-0 overflow-hidden">
        <div ref={ghost} className="absolute start-0 top-0 own:flex">
          <SegmentedControl size="sm" value="">
            {pinned.map((code) => chip(code, true))}
            <TriggerLook>+{locales.length}</TriggerLook>
            <TriggerLook>
              <ChipContent locale={byCode.get(active)!} status={statusOf(active)} />
            </TriggerLook>
          </SegmentedControl>
        </div>
      </div>
    </div>
  )
}

function TriggerLook({ children }: { children: ReactNode }) {
  return (
    <span data-trigger="" className={cn(triggerClass, keyClass)}>
      {children}
      <ChevronDownIcon size={14} strokeWidth={1.75} className="own:-me-0.5 own:text-fg-muted" />
    </span>
  )
}

/* ── Previous / next to translate ─────────────────────────────────────── */

function Stepper() {
  const { neighbour, step, labels } = useMultiLanguageContext()
  const apple = useIsApple()
  const buttons = [
    { direction: -1 as const, label: labels.previousToTranslate, arrow: '↑', key: 'ArrowUp', turn: 'rotate-180' },
    { direction: 1 as const, label: labels.nextToTranslate, arrow: '↓', key: 'ArrowDown', turn: '' },
  ]
  return (
    <TooltipProvider>
      <div className="own:flex items-center">
        {buttons.map(({ direction, label, arrow, key, turn }) => (
          <Tooltip key={key}>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={label}
                  aria-keyshortcuts={`${apple ? 'Meta' : 'Control'}+Alt+${key}`}
                  disabled={!neighbour(direction)}
                  onClick={() => step(direction)}
                />
              }
            >
              <ChevronDownIcon size={14} strokeWidth={1.75} className={turn} />
            </TooltipTrigger>
            <TooltipContent>
              {label}
              <KbdGroup>
                <Kbd>{apple ? '⌥' : 'Alt'}</Kbd>
                <Kbd>{apple ? '⌘' : 'Ctrl'}</Kbd>
                <Kbd>{arrow}</Kbd>
              </KbdGroup>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}

export { MultiLanguageSwitcher, type MultiLanguageSwitcherProps }
