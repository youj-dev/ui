'use client'

import { useId, useState } from 'react'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, PlusIcon, SearchIcon, XIcon } from '@youj/icons'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@youj/react'
import { frameScreens, NAV_GROUPS, SCREENS, screensInNavOrder, type FrameConfig, type ScreenPart } from '@youj/react/docs/create/config'
import { NAV_ICONS } from '@youj/react/docs/create/screen-icons'
import { InspectorSection } from '@youj/react/docs/inspector'
import { cn } from '@/lib/cn'

/* The Screens step: the screens the frame holds, then the catalog to add
 * more from. Each added screen is a page in the frame's nav, in its group
 * (General, Workspace, Admin) and in the order it was added there, which the
 * arrows change; the first is home. The catalog is every screen that lives in
 * an app's content area (taxonomy.json's inApp), by category, with search.
 * None is a valid frame: the frame alone. */

const ALL = Object.values(SCREENS)

/** A screen's nav icon on a small tile: the picker's thumbnail. */
function ScreenGlyph({ screen, size = 'md' }: { screen: ScreenPart; size?: 'sm' | 'md' }) {
  const Icon = NAV_ICONS[screen.icon] ?? NAV_ICONS.SquareIcon!
  return (
    <span aria-hidden className={cn('grid shrink-0 place-items-center rounded-md bg-subtle text-fg-muted ring-1 ring-line', size === 'md' ? 'size-8' : 'size-6')}>
      <Icon size={size === 'md' ? 15 : 13} strokeWidth={1.75} />
    </span>
  )
}

const iconButton =
  'grid size-7 touch:size-11 shrink-0 place-items-center rounded-md text-fg-muted transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-hover hover:text-fg focus-ring disabled:pointer-events-none disabled:opacity-35'

export function ScreenOptions({ frame, onChange }: { frame: FrameConfig; onChange: (patch: Partial<FrameConfig>) => void }) {
  const id = useId()
  const screens = frameScreens(frame)
  const names = screens.map((s) => s.name)
  const [query, setQuery] = useState('')
  const [said, setSaid] = useState('')
  const set = (next: string[]) => onChange({ screens: screensInNavOrder(next) })
  const focus = (target: string) => requestAnimationFrame(() => document.getElementById(target)?.focus())

  const toggle = (screen: ScreenPart) => {
    const on = names.includes(screen.name)
    set(on ? names.filter((n) => n !== screen.name) : [...names, screen.name])
    setSaid(`${screen.label} ${on ? 'removed' : 'added'}`)
  }
  const remove = (screen: ScreenPart, at: number) => {
    const rest = names.filter((n) => n !== screen.name)
    set(rest)
    setSaid(`${screen.label} removed`)
    // Focus stays in the list: on the row that took this one's place, else the search.
    const next = rest[Math.min(at, rest.length - 1)]
    focus(next ? `${id}-remove-${next}` : `${id}-search`)
  }
  // Within its group: the nav keeps each group together.
  const move = (screen: ScreenPart, by: -1 | 1) => {
    const at = names.indexOf(screen.name)
    const other = screens[at + by]
    if (!other || other.group !== screen.group) return
    const next = [...names]
    next[at] = other.name
    next[at + by] = screen.name
    set(next)
    setSaid(`${screen.label} moved ${by < 0 ? 'up' : 'down'}`)
    focus(`${id}-${by < 0 ? 'up' : 'down'}-${screen.name}`)
  }

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const found = ALL.filter((s) => words.every((w) => `${s.label} ${s.description} ${s.categoryLabel}`.toLowerCase().includes(w)))
  const categories = [...new Set(found.map((s) => s.categoryLabel))]

  return (
    <div className="flex flex-col gap-6">
      <InspectorSection
        title={screens.length ? `In your app (${screens.length})` : 'In your app'}
        action={
          screens.length > 0 && (
            <button type="button" onClick={() => {
                set([])
                setSaid('All screens removed')
              }} className="rounded-sm px-1 text-[11.5px] text-fg-muted hover:text-fg focus-ring">
              Remove all
            </button>
          )
        }
      >
        {screens.length ? (
          <>
            <p className="text-ui-sm text-pretty text-fg-muted">Each screen is a page in the sidebar. The first is home.</p>
            <ol aria-label="Screens in your app" className="flex flex-col">
              {screens.map((screen, i) => {
                const head = screens[i - 1]?.group !== screen.group
                const last = screens[i + 1]?.group !== screen.group
                return (
                  <li key={screen.name} className="flex flex-col">
                    {head && <span className="px-1.5 pt-2 pb-1 text-[11px] leading-none text-fg-muted first:pt-0.5">{NAV_GROUPS[screen.group].label}</span>}
                    <div className="flex min-h-control-sm items-center gap-2 rounded-lg ps-1.5 pe-0.5 py-0.5 transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-hover">
                      <ScreenGlyph screen={screen} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-ui-sm text-fg">{screen.label}</span>
                      {i === 0 && <span className="shrink-0 rounded-sm border border-line px-1.5 py-0.5 text-[10.5px] leading-none text-fg-muted">Home</span>}
                      <button id={`${id}-up-${screen.name}`} type="button" aria-label={`Move ${screen.label} up`} disabled={head} onClick={() => move(screen, -1)} className={iconButton}>
                        <ChevronUpIcon size={14} strokeWidth={1.9} />
                      </button>
                      <button id={`${id}-down-${screen.name}`} type="button" aria-label={`Move ${screen.label} down`} disabled={last} onClick={() => move(screen, 1)} className={iconButton}>
                        <ChevronDownIcon size={14} strokeWidth={1.9} />
                      </button>
                      <button id={`${id}-remove-${screen.name}`} type="button" aria-label={`Remove ${screen.label}`} onClick={() => remove(screen, i)} className={iconButton}>
                        <XIcon size={14} strokeWidth={1.9} />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ol>
          </>
        ) : (
          <p className="rounded-lg border border-dashed border-line-control px-3 py-3 text-ui-sm text-pretty text-fg-muted">
            No screens: the frame alone, for pages of your own. Add screens below and each one becomes a page in the sidebar.
          </p>
        )}
      </InspectorSection>
      <InspectorSection title="Add screens">
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput id={`${id}-search`} type="search" aria-label="Search screens" placeholder={`Search ${ALL.length} screens`} value={query} onChange={(event) => setQuery(event.target.value)} />
        </InputGroup>
        {categories.length ? (
          categories.map((category) => (
            <div key={category} role="group" aria-labelledby={`${id}-${category}`} className="flex flex-col">
              <span id={`${id}-${category}`} className="px-1.5 pt-2 pb-1 text-[11px] leading-none text-fg-muted">
                {category}
              </span>
              <ul className="flex flex-col">
                {found
                  .filter((s) => s.categoryLabel === category)
                  .map((screen) => {
                    const on = names.includes(screen.name)
                    return (
                      <li key={screen.name}>
                        <button
                          type="button"
                          aria-pressed={on}
                          aria-label={`${screen.label}: ${screen.description}`}
                          onClick={() => toggle(screen)}
                          className="group/screen flex w-full min-w-0 items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-start transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-hover focus-ring"
                        >
                          <ScreenGlyph screen={screen} />
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-ui-sm leading-5 text-fg">{screen.label}</span>
                            <span className="truncate text-ui-xs text-fg-muted">{screen.description}</span>
                          </span>
                          <span
                            aria-hidden
                            className={cn(
                              'grid size-6 shrink-0 place-items-center rounded-full transition-colors duration-(--yj-duration-fast) ease-standard',
                              on ? 'bg-accent text-on-accent' : 'text-fg-muted ring-1 ring-line group-hover/screen:text-fg group-hover/screen:ring-line-strong',
                            )}
                          >
                            {on ? <CheckIcon size={13} strokeWidth={2.2} /> : <PlusIcon size={13} strokeWidth={2} />}
                          </span>
                        </button>
                      </li>
                    )
                  })}
              </ul>
            </div>
          ))
        ) : (
          <p className="px-1.5 py-2 text-ui-sm text-fg-muted">No screens match “{query.trim()}”.</p>
        )}
      </InspectorSection>
      <span role="status" className="sr-only">
        {said}
      </span>
    </div>
  )
}
