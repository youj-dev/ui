import { useEffect, useState, type RefObject } from 'react'
import { useYouj } from '@youj/core'
import { observeOnScreen } from '@youj/core/lib/youj/on-screen'

export type IconTrigger = 'hover' | 'mount' | 'loop' | 'none'

/** How an icon behaves under `trigger="loop"`: replay its choreography, or hold a continuous animation. */
export type IconLoop = 'cycle' | 'continuous'

export interface IconTriggerOptions {
  trigger: IconTrigger
  /** Controlled state. When defined it wins over the trigger. */
  active?: boolean
  loop?: IconLoop
}

/** An explicit group wins; otherwise the nearest interactive ancestor; otherwise the icon itself. */
const GROUP = '[data-yj-trigger]'
const INTERACTIVE = 'button, a[href], summary, label, [role="button"], [role="link"], [role="menuitem"], [role="tab"], [role="switch"], [role="option"]'

export function findTriggerTarget(el: Element): Element {
  return el.closest(GROUP) ?? el.closest(INTERACTIVE) ?? el
}

function isFocusVisible(el: Element) {
  try {
    return el.matches(':focus-visible')
  } catch {
    return true
  }
}

/**
 * Resolves whether an icon is in its `active` phase. Hover listens on the trigger
 * target (so a hovered or keyboard-focused parent button animates its icon), loop
 * pauses offscreen and in hidden tabs, and reduced motion pins uncontrolled icons
 * to rest. Controlled `active` always wins.
 */
export function useIconTrigger(ref: RefObject<Element | null>, { trigger, active, loop = 'cycle' }: IconTriggerOptions): boolean {
  const k = useYouj()
  const [on, setOn] = useState(false)
  const controlled = active !== undefined
  const enabled = !controlled && !k.reduced && trigger !== 'none'
  const cycleOn = k.ms('deliberate') * 2
  const cycleOff = k.ms('deliberate')

  useEffect(() => {
    const node = ref.current
    if (!enabled || !node) return

    if (trigger === 'mount') {
      setOn(true)
      return () => setOn(false)
    }

    if (trigger === 'hover') {
      const target = findTriggerTarget(node)
      let hovered = false
      let focused = false
      const sync = () => setOn(hovered || focused)
      const enter = () => {
        hovered = true
        sync()
      }
      const leave = () => {
        hovered = false
        sync()
      }
      const focusIn = (e: Event) => {
        focused = isFocusVisible(e.target as Element)
        sync()
      }
      const focusOut = (e: FocusEvent) => {
        if (target.contains(e.relatedTarget as Node | null)) return
        focused = false
        sync()
      }
      // A standalone icon has nothing to focus. Chromium makes an SVG with
      // focus listeners a Tab stop (an unnamed, aria-hidden one), so focus is
      // only watched on a real control or group around the icon.
      const watchFocus = target !== node
      target.addEventListener('pointerenter', enter)
      target.addEventListener('pointerleave', leave)
      if (watchFocus) {
        target.addEventListener('focusin', focusIn)
        target.addEventListener('focusout', focusOut as EventListener)
      }
      return () => {
        target.removeEventListener('pointerenter', enter)
        target.removeEventListener('pointerleave', leave)
        target.removeEventListener('focusin', focusIn)
        target.removeEventListener('focusout', focusOut as EventListener)
        setOn(false)
      }
    }

    // loop: only while on screen and the tab is visible.
    let timer: ReturnType<typeof setTimeout> | undefined
    const stop = () => {
      clearTimeout(timer)
      timer = undefined
    }
    const tick = (next: boolean) => {
      setOn(next)
      if (loop === 'cycle') timer = setTimeout(() => tick(!next), next ? cycleOn : cycleOff)
    }
    const stopWatching = observeOnScreen(
      node,
      (running) => {
        if (running && timer === undefined) {
          if (loop === 'continuous') setOn(true)
          else tick(true)
        } else if (!running) {
          stop()
          setOn(false)
        }
      },
      { immediate: true },
    )
    return () => {
      stopWatching()
      stop()
      setOn(false)
    }
  }, [ref, enabled, trigger, loop, cycleOn, cycleOff])

  return controlled ? active : enabled && on
}
