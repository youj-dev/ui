'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { motion } from 'motion/react'
import { ScrollProvider, TOCItem, useActiveAnchors, type TOCItemType } from 'fumadocs-core/toc'
import { useDevice, useYouj } from '@youj/core'
import { ArrowUpIcon, ChevronDownIcon } from '@youj/icons'
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger, Popover, PopoverContent, PopoverTrigger } from '@youj/react'
import { cn } from '@/lib/cn'
import { useScrolledPast } from '@/lib/use-scrolled-past'
import { revealTarget } from './reveal'

/* On this page. The headings in view are marked by an accent thumb on the
 * list's hairline rail: it spans exactly the visible range and glides as you
 * read (it jumps under reduced motion). Where the rail would squeeze the
 * page's column, the list folds into a popover opened from the article's
 * header. */

const indent: Record<number, string> = { 2: 'ps-3', 3: 'ps-6', 4: 'ps-9' }

const length: Record<number, string> = { 2: 'w-3.5', 3: 'w-2.5', 4: 'w-1.5' }

function TocList({ items, onNavigate, timeline }: { items: TOCItemType[]; onNavigate?: (id: string) => void; timeline?: boolean }) {
  const k = useYouj()
  const active = useActiveAnchors()
  const list = useRef<HTMLUListElement>(null)
  const [thumb, setThumb] = useState<{ top: number; height: number } | null>(null)
  const [ticks, setTicks] = useState<{ id: string; depth: number; top: number }[]>([])

  useLayoutEffect(() => {
    const el = list.current
    if (!el) return
    const rows = active
      .map((id) => el.querySelector<HTMLElement>(`a[href="#${CSS.escape(id)}"]`))
      .filter((row): row is HTMLElement => row !== null)
    if (rows.length === 0) return setThumb(null)
    const first = rows[0]!
    const last = rows[rows.length - 1]!
    setThumb({ top: first.offsetTop, height: last.offsetTop + last.offsetHeight - first.offsetTop })
  }, [active])

  // The timeline beside the list: a tick level with every row, long for a section, shorter for a sub-section, short for a group.
  useLayoutEffect(() => {
    const el = list.current
    if (!timeline || !el) return
    const measure = () =>
      setTicks(
        items.flatMap((item) => {
          const row = el.querySelector<HTMLElement>(`a[href="${CSS.escape(item.url)}"]`)
          return row ? [{ id: decodeURIComponent(item.url.slice(1)), depth: item.depth, top: Math.round(row.offsetTop + row.offsetHeight / 2) }] : []
        }),
      )
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [items, timeline])

  const current = ticks.find((t) => t.id === active[0])
  const start = ticks[0]?.top ?? 0
  const end = ticks[ticks.length - 1]?.top ?? 0

  if (timeline)
    return (
      <div className="relative ps-3.5">
        <div aria-hidden className="pointer-events-none absolute inset-y-0 start-0 w-3.5">
          <span className="docs-timeline-minor absolute end-0 w-1" style={{ top: start, height: end - start }} />
          {ticks.map((t) => (
            <span
              key={t.id}
              data-active={t.id === current?.id || undefined}
              className={cn(
                'absolute end-0 h-px transition-colors yj-duration-fast ease-standard data-active:bg-accent',
                length[t.depth] ?? 'w-1.5',
                t.depth === 2 ? 'h-0.5 -translate-y-px bg-fg-subtle' : 'bg-line-strong',
              )}
              style={{ top: t.top }}
            />
          ))}
          {current && (
            <span
              className={cn('docs-timeline-marker absolute end-0 top-0 h-0.5 rounded-full bg-accent', length[current.depth] ?? 'w-1.5')}
              style={{ translate: `0 ${current.top - 1}px` }}
            />
          )}
        </div>
        <Rows items={items} list={list} onNavigate={onNavigate} />
      </div>
    )

  return (
    <div className="relative">
      <span aria-hidden className="absolute inset-y-0 start-0 w-px bg-line" />
      {thumb && (
        <motion.span
          aria-hidden
          className="absolute start-0 top-0 h-px w-0.5 -translate-x-[0.5px] origin-top bg-accent rtl:translate-x-[0.5px]"
          initial={false}
          animate={{ y: thumb.top, scaleY: thumb.height }}
          transition={k.reduced ? { duration: 0 } : k.spring('smooth')}
        />
      )}
      <Rows items={items} list={list} onNavigate={onNavigate} />
    </div>
  )
}

function Rows({ items, list, onNavigate }: { items: TOCItemType[]; list: RefObject<HTMLUListElement | null>; onNavigate?: (id: string) => void }) {
  return (
    <ul ref={list} className="flex flex-col">
      {items.map((item) => (
        <li key={item.url}>
          <TOCItem
            href={item.url}
            onClick={onNavigate && (() => onNavigate(item.url.slice(1)))}
            className={cn(
              'block rounded-sm py-1 pe-2 text-ui leading-snug text-fg-muted transition-colors yj-duration-fast ease-standard hover:text-fg focus-ring data-[active=true]:text-fg',
              // In a sheet (a thumb): 48px rows, the type a phone reads at, a press that shows, and the heading in view set apart.
              'touch:flex touch:min-h-12 touch:items-center touch:rounded-lg touch:py-0 touch:pe-3 touch:text-base touch:active:bg-hover touch:data-[active=true]:bg-selected touch:data-[active=true]:font-medium',
              indent[item.depth] ?? 'ps-3',
            )}
          >
            {item.title}
          </TOCItem>
        </li>
      ))}
    </ul>
  )
}

/** Shows once the reader is a screen down, and takes them back up. */
function BackToTop() {
  const k = useYouj()
  const shown = useScrolledPast('100vh')
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: k.reduced ? 'auto' : 'smooth' })}
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown || undefined}
      className={cn(
        'mt-5 inline-flex items-center gap-1.5 rounded-sm text-[12.5px] text-fg-muted transition-[opacity,color] yj-duration-base ease-standard hover:text-fg focus-ring',
        shown ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <ArrowUpIcon size={14} strokeWidth={1.75} active={false} />
      Back to top
    </button>
  )
}

// The rail is the page's: a navigation crossfades it with the rest of the page (components/docs/pending-page.tsx).
export function DocsToc({ items }: { items: TOCItemType[] }) {
  return (
    <nav aria-labelledby="toc-title" className="flex flex-col">
      <p id="toc-title" className="type-label mb-3">
        On this page
      </p>
      <TocList items={items} timeline />
      <BackToTop />
    </nav>
  )
}

/**
 * The TOC where there's no room for the rail: a compact trigger in the
 * article's header, and the list in a popover under a pointer or a bottom
 * sheet under a thumb (a finger would cover an anchored popover). It opens on
 * the section in view, scrolled to it when the list is long. Following a link
 * closes it and puts focus on that heading (opening a folded Reference
 * first), so the keyboard carries on from where the page went, not from the
 * top.
 */
export function TocPopover({ items, className }: { items: TOCItemType[]; className?: string }) {
  const id = useId()
  const sheet = useDevice() === 'touch'
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const landing = useRef<HTMLElement | null>(null)

  // Widened past the rail's breakpoint while open: the trigger hides, and the popover goes with it.
  useEffect(() => {
    const el = trigger.current
    if (!open || !el) return
    const observer = new ResizeObserver(() => el.offsetParent === null && setOpen(false))
    observer.observe(el)
    return () => observer.disconnect()
  }, [open])

  const navigate = (target: string) => {
    const heading = document.getElementById(target)
    const fold = heading?.closest('details')
    if (fold && !fold.open) fold.open = true
    revealTarget(heading)
    // The heading's own link (components/docs/blocks.tsx), the one focusable thing in it.
    landing.current = heading?.querySelector<HTMLElement>('a[href^="#"]') ?? null
    setOpen(false)
  }
  const finalFocus = () => {
    const heading = landing.current
    landing.current = null
    return heading ?? true
  }

  const triggerClass = cn(
    'inline-flex h-7 items-center gap-1 rounded-md border border-line bg-surface ps-2.5 pe-1.5 text-fg-muted transition-colors yj-duration-fast ease-standard hover:border-line-strong hover:text-fg focus-ring data-popup-open:border-line-strong data-popup-open:text-fg touch:h-11 touch:ps-3.5 touch:pe-2.5 touch:active:bg-hover',
    className,
  )
  const label = (
    <>
      <span className="type-label leading-none text-current">On this page</span>
      <ChevronDownIcon size={14} strokeWidth={1.75} active={open} />
    </>
  )

  if (sheet) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger ref={trigger} className={triggerClass}>
          {label}
        </DrawerTrigger>
        <DrawerContent finalFocus={finalFocus} className="max-h-[80dvh]">
          <DrawerTitle className="type-label px-5 pt-3 pb-1">On this page</DrawerTitle>
          {/* The sheet is the scroller; the row in view is brought to the middle once it's up. */}
          <div
            ref={(el) => {
              list.current = el
              el?.querySelector('a[data-active=true]')?.scrollIntoView({ block: 'center' })
            }}
            className="px-[max(0.75rem,env(safe-area-inset-left))] pb-2"
          >
            <TocList items={items} onNavigate={navigate} />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger ref={trigger} className={triggerClass}>
        {label}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        aria-labelledby={`${id}-title`}
        initialFocus={(type) => (type !== 'touch' && list.current?.querySelector<HTMLElement>('a[data-active=true]')) || true}
        finalFocus={finalFocus}
        className="w-72 gap-2 p-2"
      >
        <p id={`${id}-title`} className="type-label px-2 pt-1.5">
          On this page
        </p>
        <div ref={list} className="max-h-[min(26rem,calc(var(--available-height)-3.5rem))] overflow-y-auto px-2 pb-1.5 yj-scrollbar [&_a]:py-1.5">
          <ScrollProvider containerRef={list}>
            <TocList items={items} onNavigate={navigate} />
          </ScrollProvider>
        </div>
      </PopoverContent>
    </Popover>
  )
}
