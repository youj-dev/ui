'use client'

import { useEffect, useId, useRef, useState, type HTMLAttributes, type MouseEvent } from 'react'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'

type Phase = 'idle' | 'holding' | 'release' | 'done'
type Handlers = Pick<HTMLAttributes<HTMLButtonElement>, 'onPointerDown' | 'onPointerUp' | 'onPointerLeave' | 'onPointerCancel' | 'onKeyDown' | 'onKeyUp' | 'onBlur' | 'onContextMenu' | 'aria-describedby'>
const RELEASES = ['onPointerUp', 'onPointerLeave', 'onPointerCancel', 'onBlur'] as const

/* Hold to confirm for AsyncButton. A press (pointer, or Space or Enter held)
 * fills the button from its inline start through --ui--hold, per frame and
 * without re-rendering. Letting go early springs the fill back; a full hold
 * clicks the button (so the action runs), and every other click it gets is
 * swallowed. Under reduced motion the fill stays still and a count stands in
 * the label's place. `true` holds for twice the deliberate token. */
export function useHold(hold: boolean | number | undefined, { variant, disabled, label, handlers }: { variant: string; disabled: boolean; label: string; handlers: Handlers }) {
  const k = useYouj()
  const id = useId()
  const [phase, setPhase] = useState<Phase>('idle')
  const el = useRef<HTMLElement | null>(null)
  const count = useRef<HTMLSpanElement | null>(null)
  const frame = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const clicking = useRef(false)
  useEffect(() => () => (cancelAnimationFrame(frame.current), clearTimeout(timer.current)), [])
  if (hold === undefined || hold === false) return null
  const ms = typeof hold === 'number' ? hold : k.ms('deliberate') * 2

  // The phase goes on the element at once, ahead of the re-render, so a release meets its spring.
  const go = (next: Phase, progress: number) => {
    el.current?.setAttribute('data-yj-hold', next)
    el.current?.style.setProperty('--ui--hold', String(progress))
    if (count.current) count.current.textContent = `${Math.round(progress * 100)}%`
    if (next !== phase) setPhase(next)
  }
  const start = (target: HTMLElement) => {
    if (disabled || frame.current) return
    clearTimeout(timer.current)
    el.current = target
    go('holding', 0)
    const begin = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - begin) / Math.max(ms, 1))
      el.current?.style.setProperty('--ui--hold', String(progress))
      if (count.current) count.current.textContent = `${Math.round(progress * 100)}%`
      if (progress < 1) return void (frame.current = requestAnimationFrame(tick))
      frame.current = 0
      go('done', 1)
      clicking.current = true
      target.click()
      clicking.current = false
      // The fill fades as the action takes over, then empties for the next hold.
      timer.current = setTimeout(() => go('idle', 0), k.ms('base'))
    }
    frame.current = requestAnimationFrame(tick)
  }
  const release = () => {
    if (!frame.current) return
    cancelAnimationFrame(frame.current)
    frame.current = 0
    go('release', 0)
  }
  const isKey = (key: string) => key === ' ' || key === 'Enter'

  return {
    // The fill sits under the label, clipped to the corners; a long touch opens no callout.
    className: 'own:isolate own:touch-manipulation own:[-webkit-touch-callout:none]',
    props: {
      'data-yj-hold': phase,
      'aria-describedby': cn(handlers['aria-describedby'], id) || undefined,
      ...Object.fromEntries(RELEASES.map((name) => [name, (event: never) => (handlers[name]?.(event), release())])),
      onPointerDown: (event) => {
        handlers.onPointerDown?.(event)
        if (event.button === 0 && !event.defaultPrevented) start(event.currentTarget)
      },
      onKeyDown: (event) => {
        handlers.onKeyDown?.(event)
        if (isKey(event.key) && !event.repeat && !event.defaultPrevented) start(event.currentTarget)
      },
      onKeyUp: (event) => {
        handlers.onKeyUp?.(event)
        if (isKey(event.key)) release()
      },
      onContextMenu: (event) => {
        handlers.onContextMenu?.(event)
        if (frame.current) event.preventDefault()
      },
    } satisfies Handlers & Record<string, unknown>,
    /** True for the one click a completed hold makes; any other click is swallowed. */
    confirms: (event: MouseEvent) => clicking.current || (event.preventDefault(), false),
    fill: (
      <span
        aria-hidden
        data-slot="button-hold"
        className={cn(
          'pointer-events-none absolute inset-0 -z-1 origin-left rtl:origin-right scale-x-(--ui--hold,0) own:reduced:hidden',
          // A filled button lightens under its label's ink; the others take the accent's wash.
          variant === 'default' || variant === 'danger' ? 'bg-current opacity-20' : 'bg-accent-subtle',
          // Per frame while held; a release springs back, a completed hold fades.
          'transition-[scale,opacity] [transition-duration:calc(var(--yj-duration-spring)*var(--yj-motion,1)),calc(var(--yj-duration-fast)*var(--yj-motion,1))] [transition-timing-function:var(--ease-spring),var(--ease-standard)]',
          'group-data-[yj-hold=holding]/button:transition-none group-data-[yj-hold=done]/button:opacity-0',
        )}
      />
    ),
    count:
      k.reduced && phase === 'holding' ? (
        <span aria-hidden ref={count} className="absolute inset-0 own:grid place-items-center own:tabular-nums">
          0%
        </span>
      ) : null,
    description: (
      <span id={id} hidden>
        {label}
      </span>
    ),
  }
}
