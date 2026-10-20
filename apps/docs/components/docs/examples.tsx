'use client'

import { Children, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { useYouj } from '@youj/core/lib/youj/provider'
import { TabList } from '@/components/ui/controls'
import { useReveal } from './reveal'
import { tween } from './waapi'

/* A page's examples, one at a time: <Examples><Example id="variants" label="Variants">…</Example>…</Examples>.
 * Each tab holds an example's preview and its explanation. The panels stay in
 * the page, hidden until found, so find-in-page opens the one that matches and
 * a link to an id inside (put the `###` heading first, it is read, not drawn)
 * selects its tab. The Markdown version (lib/markdown.ts) has them all.
 * A change crossfades with a small slide in the direction of travel, and the
 * stage's height follows. The outgoing panel is lifted out of flow for the
 * moment and goes back to `until-found` after; nothing is remounted, so a
 * live preview keeps its state. Reduced motion swaps at once. */

const SLIDE = 14

interface ExampleProps {
  /** The tab's value, the id of its heading. */
  id: string
  label: string
  children: ReactNode
}

export function Example({ children }: ExampleProps) {
  return <>{children}</>
}

export function Examples({ children, label = 'Examples', buttons = false }: { children: ReactNode; label?: string; /** Borderless button tabs (a story page's Get started) instead of the underline. */ buttons?: boolean }) {
  const base = useId()
  const root = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const k = useYouj()
  const shown = useRef('')
  const rest = useRef<number | null>(null)
  const settle = useRef<(() => void) | null>(null)
  const tabs = Children.toArray(children).filter((child): child is ReactElement<ExampleProps> => isValidElement(child))
  const [value, setValue] = useState(tabs[0]?.props.id ?? '')

  const select = (target: HTMLElement) => {
    const panel = target.closest<HTMLElement>('[data-example-panel]')
    if (!panel || !root.current?.contains(panel) || panel.dataset.examplePanel === value) return
    setValue(panel.dataset.examplePanel!)
    requestAnimationFrame(() => requestAnimationFrame(() => target.scrollIntoView()))
  }
  useReveal(select)

  // A match found in a hidden panel (Ctrl+F) fires `beforematch`, which bubbles up from it.
  useEffect(() => {
    const el = root.current
    if (!el) return
    const onMatch = (event: Event) => {
      const panel = (event.target as HTMLElement).closest<HTMLElement>('[data-example-panel]')
      if (panel) setValue(panel.dataset.examplePanel!)
    }
    el.addEventListener('beforematch', onMatch)
    return () => el.removeEventListener('beforematch', onMatch)
  }, [])

  // Remember the stage's resting height, so a change knows where it starts.
  useLayoutEffect(() => {
    const el = stage.current
    if (!el) return
    const remember = () => {
      if (!settle.current) rest.current = el.offsetHeight
    }
    remember()
    const ro = new ResizeObserver(remember)
    ro.observe(el)
    return () => {
      ro.disconnect()
      settle.current?.()
    }
  }, [])

  // Before paint: lift the outgoing panel out of flow, then fade and slide the incoming one in while the height follows.
  useLayoutEffect(() => {
    const el = stage.current
    const previous = shown.current
    shown.current = value
    if (!el || !previous || previous === value) return
    const running = settle.current
    const from = running ? el.offsetHeight : rest.current
    running?.()
    const panel = (id: string) => el.querySelector<HTMLElement>(`:scope > [data-example-panel="${CSS.escape(id)}"]`)
    const out = panel(previous)
    const into = panel(value)
    if (!out || !into) return
    if (k.reduced || from === null) {
      rest.current = el.offsetHeight
      return
    }
    const order = tabs.map((tab) => tab.props.id)
    const way = (order.indexOf(value) > order.indexOf(previous) ? 1 : -1) * (getComputedStyle(el).direction === 'rtl' ? -1 : 1)

    out.removeAttribute('hidden')
    out.inert = true
    out.style.cssText = 'position:absolute;top:0;left:0;right:0'
    const to = el.offsetHeight
    el.style.overflow = 'hidden'
    const moves = [
      tween(into, [{ opacity: 0, transform: `translateX(${way * SLIDE}px)` }, { opacity: 1, transform: 'translateX(0)' }], k, 'base', 'enter'),
      tween(out, [{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: `translateX(${-way * SLIDE}px)` }], k, 'fast', 'exit'),
    ]
    if (Math.abs(to - from) >= 1) moves.push(tween(el, [{ height: `${from}px` }, { height: `${to}px` }], k, 'base', 'standard'))

    const finish = () => {
      moves.forEach((move) => move.cancel())
      out.style.cssText = ''
      out.inert = false
      out.setAttribute('hidden', 'until-found')
      into.style.opacity = ''
      into.style.transform = ''
      el.style.height = ''
      el.style.overflow = ''
      rest.current = el.offsetHeight
      settle.current = null
    }
    settle.current = finish
    Promise.all(moves.map((move) => move.done)).then((done) => done.every(Boolean) && settle.current === finish && finish())
  }, [value])

  return (
    <div ref={root} className="my-6">
      <div className={buttons ? 'button-tabs' : undefined}>
        <TabList
          idBase={base}
          label={label}
          value={value}
          onChange={setValue}
          variant={buttons ? 'pill' : 'underline'}
          tabs={tabs.map((tab) => ({
            value: tab.props.id,
            label: tab.props.label,
          }))}
        />
      </div>
      <div ref={stage} className="relative">
        {tabs.map((tab) => (
          <div
            key={tab.props.id}
            role="tabpanel"
            id={`${base}-panel-${tab.props.id}`}
            aria-labelledby={`${base}-tab-${tab.props.id}`}
            data-example-panel={tab.props.id}
            // Server-rendered as plain `hidden`; React has no `until-found`, so a hidden panel is upgraded here, where find-in-page can open it.
            hidden={tab.props.id !== value}
            ref={(el) => {
              if (el?.hidden) el.setAttribute('hidden', 'until-found')
            }}
            className="pt-2 [&>h2:first-child]:sr-only [&>h2:first-child+*]:mt-4 [&>h3:first-child]:sr-only [&>h3:first-child+*]:mt-4"
          >
            {tab.props.children}
          </div>
        ))}
      </div>
    </div>
  )
}
