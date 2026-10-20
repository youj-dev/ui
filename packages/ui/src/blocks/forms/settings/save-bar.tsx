'use client'

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react'
import { useYouj } from '@youj/core'
import { AlertTriangleIcon, CheckIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { FormSubmit } from '../../../components/ui/form'
import { Kbd } from '../../../components/ui/kbd'
import { cn } from '../../../lib/utils'
import type { SettingsFormCopy } from './data'

/* The card's foot, which turns into the save bar. At rest it says where
 * changes apply (or that they're saved). With changes, the same band holds
 * the count, Discard and Save, and sticks to the bottom of the window while
 * the card's own end is out of view, rising into it from below. A link that
 * would leave turns it amber and shakes it once, with the buttons saying
 * they'll continue; Escape stays. Discarding leaves Undo for a few seconds.
 * Reduced motion: no rise and no shake; the color and the words still change. */

export type BarMode = 'idle' | 'dirty' | 'nudge' | 'discarded'

interface SaveBarProps {
  mode: BarMode
  count: number
  discardedCount: number
  /** A save went through this visit: the foot says so. */
  saved: boolean
  /** Why the last save failed, said in the bar. */
  failure: string | null
  /** Bumped on every held link: each one shakes the bar. */
  nudges: number
  /** Picks the counts' plural category. */
  plural: Intl.PluralRules
  copy: SettingsFormCopy
  saveRef: RefObject<HTMLButtonElement | null>
  onDiscard: () => void
  onUndo: () => void
  onStay: () => void
}

const subscribeNothing = () => () => {}
const isApple = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

export function SaveBar({ mode, count, discardedCount, saved, failure, nudges, plural, copy, saveRef, onDiscard, onUndo, onStay }: SaveBarProps) {
  const k = useYouj()
  const bar = useRef<HTMLElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const end = useRef<HTMLSpanElement>(null)
  const apple = useSyncExternalStore(subscribeNothing, isApple, () => true)
  const active = mode !== 'idle'
  // Whether the card's own end is on screen: while it isn't, an active bar sticks to the window.
  const [endInView, setEndInView] = useState(true)
  // Bumped when the bar appears while the card's end is out of view: it rises into the window.
  const [entrances, setEntrances] = useState(0)
  // After a save it stays stuck a moment, then slides back out of the window.
  const [leaving, setLeaving] = useState(false)
  const [wasActive, setWasActive] = useState(active)
  if (wasActive !== active) {
    setWasActive(active)
    setLeaving(!active && !endInView && !k.reduced)
    if (active && !endInView) setEntrances((n) => n + 1)
  }
  if (leaving && endInView) setLeaving(false)
  const stuck = (active || leaving) && !endInView

  useEffect(() => {
    const node = end.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setEndInView(entry?.isIntersecting ?? true))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!entrances || k.reduced) return
    const rise = bar.current?.animate?.([{ transform: 'translateY(100%)' }, { transform: 'none' }], {
      duration: k.ms('base'),
      easing: `cubic-bezier(${k.ease('enter').join(',')})`, // youj-allow: the enter token's own curve, for a Web Animation
    })
    return () => rise?.cancel()
  }, [entrances, k])

  useEffect(() => {
    if (!leaving) return
    const fall = bar.current?.animate?.([{ transform: 'none' }, { transform: 'translateY(100%)' }], {
      duration: k.ms('base'),
      // Long enough to read that it's saved.
      delay: k.ms('deliberate') * 2,
      easing: `cubic-bezier(${k.ease('exit').join(',')})`, // youj-allow: the exit token's own curve, for a Web Animation
      fill: 'forwards',
    })
    fall?.finished.then(
      () => setLeaving(false),
      () => {},
    )
    return () => fall?.cancel()
  }, [leaving, k])

  // Each held link shakes the bar once, on a decaying swing.
  useEffect(() => {
    if (!nudges || k.reduced) return
    content.current?.animate?.(
      [0, -4, 4, -3, 3, -2, 2, 0].map((x) => ({ transform: `translateX(${x}px)` })),
      { duration: k.ms('slow') * 1.4, easing: 'linear' },
    )
  }, [nudges, k])

  const message =
    mode === 'discarded'
      ? copy.discarded(discardedCount, plural.select(discardedCount))
      : mode === 'nudge'
        ? copy.leave
        : (failure ?? copy.changes(count, plural.select(count)))
  return (
    <>
      <footer
        ref={bar}
        data-slot="settings-bar"
        data-state={mode}
        data-yj-stuck={stuck || undefined}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && mode === 'nudge') {
            event.stopPropagation()
            onStay()
          }
        }}
        className={cn(
          'z-10 grid border-t border-line bg-surface px-(--ui--panel-x) py-(--ui--panel-foot-y)',
          'transition-[background-color,border-color,box-shadow] yj-duration-base ease-standard',
          stuck && 'sticky bottom-0 shadow-[0_-18px_32px_-28px_color-mix(in_oklab,var(--yj-shade)_55%,transparent)]',
          mode === 'nudge' && 'border-warning-line bg-warning-subtle',
        )}
      >
        <p
          aria-hidden={active || undefined}
          className={cn(
            'flex min-h-control items-center gap-2 text-ui-sm text-fg-muted [grid-area:1/1]',
            'transition-[opacity,translate,visibility] yj-duration-fast ease-standard',
            active && 'invisible -translate-y-1 opacity-0',
          )}
        >
          {saved && <CheckIcon size={14} className="text-success-text" />}
          {saved ? copy.saved : copy.footer}
        </p>
        <div
          ref={content}
          inert={!active || undefined}
          className={cn(
            'flex flex-wrap items-center justify-between gap-x-4 gap-y-2 [grid-area:1/1]',
            'transition-[opacity,translate,visibility] yj-duration-base ease-enter',
            !active && 'invisible translate-y-1 opacity-0',
          )}
        >
          <p
            aria-hidden
            className={cn(
              'flex min-w-0 items-center gap-2 text-ui font-medium',
              mode === 'nudge' ? 'text-warning-text' : failure && mode === 'dirty' ? 'text-danger-text' : 'text-fg',
            )}
          >
            {mode === 'nudge' ? (
              <AlertTriangleIcon size={15} className="shrink-0" />
            ) : mode === 'dirty' && !failure ? (
              <span className="size-1.5 shrink-0 rounded-full bg-accent" />
            ) : null}
            <span className="min-w-0 text-pretty">{message}</span>
          </p>
          <div className="ms-auto flex shrink-0 items-center gap-2">
            {mode === 'discarded' ? (
              <Button type="button" variant="secondary" onClick={onUndo}>
                {copy.undo}
              </Button>
            ) : (
              <>
                <Button type="button" variant="ghost" onClick={onDiscard}>
                  {mode === 'nudge' ? copy.discardAndLeave : copy.discard}
                </Button>
                <FormSubmit
                  ref={saveRef}
                  aria-keyshortcuts={apple ? 'Meta+S' : 'Control+S'}
                  pendingLabel={copy.saving}
                  successLabel={copy.savedLabel}
                  errorLabel={copy.saveFailed}
                  invalidLabel={copy.invalid}
                >
                  {mode === 'nudge' ? copy.saveAndLeave : copy.save}
                  {/* shape: the shortcut rides inside the Save button, in its lettering, not as a key of its own */}
                  <Kbd aria-hidden dir="ltr" className="-me-1 border-transparent bg-transparent font-mono text-current opacity-70 shadow-none touch:hidden">
                    {apple ? '⌘S' : 'Ctrl S'}
                  </Kbd>
                </FormSubmit>
              </>
            )}
          </div>
        </div>
      </footer>
      <span role="status" data-slot="settings-status" className="sr-only">
        {active ? message : ''}
      </span>
      {/* The card's own end: while it's out of view, an active bar sticks to the window. */}
      <span ref={end} aria-hidden className="block h-0" />
    </>
  )
}
