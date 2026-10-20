'use client'

import { memo, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import Link from 'next/link'
import { getIllustration } from '@youj/illustrations'
import { ArrowUpRightIcon, ChevronsUpDownIcon, ImageIcon } from '@youj/icons'
import { Button, Popover, PopoverContent, PopoverTrigger } from '@youj/react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@youj/react/command'
import { cn } from '@/lib/cn'

/* The preview toolbar's Illustration menu, for a block with an illustration
 * slot. The trigger is the chosen scene in miniature and its name; it opens a
 * search over every scene, grouped by category, each a thumbnail in a grid,
 * so fifty scenes are a glance and a few letters rather than a long list.
 * Arrows move through the grid in two dimensions (left and right along it,
 * up and down to the nearest scene in the next row), Enter picks, Escape
 * closes and focus goes back to the trigger. The highlighted scene takes
 * itself apart; the chosen one wears the accent. "Default" hands the slot
 * back to the block's own scene. */

export interface PickerScene {
  id: string
  name: string
  category: string
}

/** The block's own scene: no `illustration` at all, so its row needs an id of its own in the list. */
const DEFAULT = ''
const DEFAULT_ROW = 'default-scene'

const title = (category: string) => category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ')

/**
 * Every word of the search is in the scene's id, name or category, names that
 * start with it first. Stricter than cmdk's fuzzy match, which across fifty
 * short names finds letters in order almost anywhere ("clo" in "Load balancer").
 */
export function matchScene(value: string, search: string, keywords: string[] = []): number {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return 1
  const hay = [value, ...keywords].join(' ').toLowerCase().replace(/-/g, ' ')
  if (!words.every((w) => hay.includes(w))) return 0
  const name = (keywords[0] ?? value).toLowerCase()
  return name.startsWith(words[0]!) ? 1 : hay.split(' ').some((part) => part.startsWith(words[0]!)) ? 0.75 : 0.5
}

/**
 * The scenes a search finds, as groups: with no search, every category in the
 * registry's order; with one, best first, and each category where its best
 * scene ranks. The list is ordered here rather than by cmdk, whose sort
 * reorders the rows but not the groups.
 */
export function rankScenes(scenes: PickerScene[], search: string): { category: string; scenes: PickerScene[] }[] {
  const found = scenes
    .map((scene) => ({ scene, score: matchScene(scene.id, search, [scene.name, scene.category]) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
  const order = search.trim() ? found.map((r) => r.scene.category) : scenes.map((s) => s.category)
  return [...new Set(order)].map((category) => ({ category, scenes: found.filter((r) => r.scene.category === category).map((r) => r.scene) })).filter((g) => g.scenes.length)
}

/**
 * A scene drawn small and still: no drop, no bob; apart while it's `open`.
 * Memoised, so moving the highlight redraws two. `size-auto` keeps it out of
 * the rule that sizes a menu row's icons (any svg without a `size-` class).
 */
const Thumb = memo(function Thumb({ id, unit, open = false }: { id: string; unit: number; open?: boolean }) {
  const scene = getIllustration(id)
  if (!scene) return <ImageIcon size={14} strokeWidth={1.75} className="text-fg-subtle" />
  const { Component } = scene
  return <Component assemble={false} float={false} unit={unit} explode={open ? 1 : 0} className="size-auto" />
})

/** Draws its scene only once it scrolls near view, so opening the picker never draws every scene at once. */
function LazyThumb({ id, open }: { id: string; open: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    const io = new IntersectionObserver(([entry]) => entry?.isIntersecting && setSeen(true), { rootMargin: '200px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [seen])
  return <span ref={ref} className="grid size-full place-items-center">{seen && <Thumb id={id} unit={9} open={open} />}</span>
}

export function IllustrationPicker({ scenes, value, onChange, className }: { scenes: PickerScene[]; value: string; onChange: (id: string) => void; className?: string }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(value || DEFAULT_ROW)
  const [search, setSearch] = useState('')
  const list = useRef<HTMLDivElement>(null)
  const chosen = scenes.find((s) => s.id === value)
  const groups = useMemo(() => rankScenes(scenes, search), [scenes, search])
  const searching = search.trim() !== ''

  const openChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      setSearch('')
      setActive(value || DEFAULT_ROW)
    }
  }
  const pick = (id: string) => {
    onChange(id)
    setOpen(false)
  }

  // The grid in two dimensions: along it, and to the scene nearest in the next row up or down.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const horizontal = e.key === 'ArrowLeft' || e.key === 'ArrowRight'
    if (!horizontal && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    const items = [...(list.current?.querySelectorAll<HTMLElement>('[cmdk-item]:not([aria-disabled="true"])') ?? [])]
    if (!items.length) return
    e.preventDefault()
    const at = Math.max(0, items.findIndex((el) => el.getAttribute('aria-selected') === 'true'))
    const here = items[at]!.getBoundingClientRect()
    let next: HTMLElement | undefined
    if (horizontal) {
      const rtl = getComputedStyle(e.currentTarget).direction === 'rtl'
      const step = (e.key === 'ArrowRight') !== rtl ? 1 : -1
      next = items[(at + step + items.length) % items.length]
    } else {
      const down = e.key === 'ArrowDown'
      const centre = here.left + here.width / 2
      const rows = items
        .map((el) => ({ el, box: el.getBoundingClientRect() }))
        .filter(({ box }) => (down ? box.top >= here.bottom - 1 : box.bottom <= here.top + 1))
      // The nearest row, then the scene in it closest to this one's center; past the last row, round to the first.
      const edge = down ? Math.min(...rows.map((r) => r.box.top)) : Math.max(...rows.map((r) => r.box.top))
      const row = rows.filter((r) => Math.abs(r.box.top - edge) < 2)
      next = row.length
        ? row.reduce((a, b) => (Math.abs(b.box.left + b.box.width / 2 - centre) < Math.abs(a.box.left + a.box.width / 2 - centre) ? b : a)).el
        : items[down ? 0 : items.length - 1]
    }
    const id = next?.getAttribute('data-value')
    if (id === null || id === undefined) return
    setActive(id)
    next!.scrollIntoView({ block: 'nearest' })
  }

  return (
    <Popover open={open} onOpenChange={openChange}>
      <PopoverTrigger
        render={
          // The toolbar's size, and a well like the menus beside it (Story, Zoom, Motion): one row of controls.
          // shape: the picker button sits in the toolbar row: `!` trims the start padding for the thumbnail and drops the shadow
          <Button
            variant="outline"
            size="xs"
            aria-label={`Illustration: ${chosen?.name ?? 'Default'}`}
            title={chosen ? `${chosen.name} (${chosen.id})` : 'The block’s own scene'}
            className={cn(
              'min-w-0 justify-start gap-2 ps-1! pe-2! text-ui-sm font-normal text-fg shadow-none',
              className,
            )}
          />
        }
      >
        <span aria-hidden className="grid h-5 w-6.5 shrink-0 place-items-center overflow-hidden rounded-full bg-canvas ring-1 ring-line">
          {chosen ? <Thumb id={chosen.id} unit={5} /> : <ImageIcon size={12} strokeWidth={1.75} className="text-fg-subtle" />}
        </span>
        <span className="text-fg-subtle max-lg:hidden">Illustration</span>
        <span className="min-w-0 truncate">{chosen?.name ?? 'Default'}</span>
        <ChevronsUpDownIcon size={13} strokeWidth={1.75} active={open} className="ms-auto shrink-0 text-fg-muted" />
      </PopoverTrigger>
      {/* The search takes focus from a keyboard or a mouse, so the arrows reach the grid; a tap leaves it, so no keyboard springs up over it. */}
      <PopoverContent
        aria-label="Illustration"
        align="start"
        initialFocus={(type) => type !== 'touch'}
        className="w-[min(27rem,calc(100vw-1.5rem))] gap-0 overflow-hidden p-0"
      >
        {/* Filtered and ordered here (rankScenes); cmdk moves the highlight to the first row as the search changes. */}
        <Command label="Find an illustration" value={active} onValueChange={setActive} shouldFilter={false} onKeyDown={onKeyDown}>
          <CommandInput value={search} onValueChange={setSearch} placeholder={`Find one of ${scenes.length} scenes…`} />
          <CommandList ref={list} className="[--command-list-max:min(26rem,55dvh)]">
            {/* The block's own scene, while nothing is searched for. */}
            {!searching && (
              <CommandGroup>
                <CommandItem value={DEFAULT_ROW} onSelect={() => pick(DEFAULT)} checked={value === DEFAULT} className="gap-2.5 py-1.5">
                  <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-md bg-canvas ring-1 ring-line">
                    <ImageIcon size={14} strokeWidth={1.75} className="text-fg-muted" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-fg">Default</span>
                    <span className="truncate text-[11.5px] text-fg-muted">The block’s own scene</span>
                  </span>
                </CommandItem>
              </CommandGroup>
            )}
            {groups.map(({ category, scenes: found }) => (
              <CommandGroup
                key={category}
                heading={title(category)}
                className="[&_[cmdk-group-items]]:grid [&_[cmdk-group-items]]:grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] [&_[cmdk-group-items]]:gap-1"
              >
                {found.map((s) => {
                  const current = s.id === value
                  return (
                    <CommandItem
                      key={s.id}
                      value={s.id}
                      onSelect={() => pick(s.id)}
                      checked={current}
                      className={cn(
                        'min-h-0 flex-col items-stretch gap-1 p-1 pe-1 pb-1.5',
                        // The chosen scene's check sits on its thumbnail's corner, in the accent.
                        '[&>span.absolute]:end-2 [&>span.absolute]:top-2 [&>span.absolute]:size-4 [&>span.absolute]:rounded-full [&>span.absolute]:bg-accent [&>span.absolute]:text-on-accent [&>span.absolute_svg]:size-3',
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'grid aspect-[4/3] place-items-center overflow-hidden rounded-md bg-canvas px-1.5 ring-1 transition-shadow yj-duration-fast ease-standard',
                          current ? 'ring-accent' : 'ring-line',
                        )}
                      >
                        <LazyThumb id={s.id} open={active === s.id} />
                      </span>
                      <span className="truncate px-0.5 text-[11.5px] leading-tight text-fg">{s.name}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
            <CommandEmpty>No scene by that name.</CommandEmpty>
          </CommandList>
        </Command>
        <div className="flex items-center gap-3 border-t border-line px-3 py-2">
          <span className="type-small text-fg-subtle max-sm:hidden">↑↓←→ move · ↵ choose</span>
          <Link prefetch={false}
            href="/illustrations"
            className="ms-auto inline-flex items-center gap-1 rounded-sm text-[12px] font-medium text-fg-muted transition-colors yj-duration-fast ease-standard hover:text-fg focus-ring"
          >
            Every scene
            <ArrowUpRightIcon size={12} strokeWidth={1.9} className="rtl:-scale-x-100" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
