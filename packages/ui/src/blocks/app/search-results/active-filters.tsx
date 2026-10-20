'use client'

import { useRef, type RefObject } from 'react'
import { PresenceItem, PresenceList } from '@youj/motion'
import { Badge, BadgeRemove } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { personOf, useSearchConfig, type SearchCopy } from './copy'
import type { Person } from './data'
import type { SearchState } from './model'

/* The filters in force, as chips you can take off one by one, plus Clear
 * all. Chips enter and leave through PresenceList (the rest close ranks).
 * Removing one moves focus to its neighbor, or back to the search field
 * when it was the last, so a keyboard user never lands on nothing. */

interface Chip {
  key: string
  facet: string
  label: string
  patch: Partial<SearchState>
}

function chipsFor(state: SearchState, copy: SearchCopy, people: Record<string, Person>): Chip[] {
  return [
    ...state.types.map((t) => ({ key: `type:${t}`, facet: copy.facetType, label: copy.types[t], patch: { types: state.types.filter((x) => x !== t) } })),
    ...state.owners.map((o) => ({ key: `owner:${o}`, facet: copy.facetOwner, label: personOf(people, o).name, patch: { owners: state.owners.filter((x) => x !== o) } })),
    ...(state.updated === 'any' ? [] : [{ key: 'updated', facet: copy.facetUpdated, label: copy.updatedOptions[state.updated].toLowerCase(), patch: { updated: 'any' as const } }]),
    ...state.tags.map((t) => ({ key: `tag:${t}`, facet: copy.facetTag, label: t, patch: { tags: state.tags.filter((x) => x !== t) } })),
  ]
}

export const filterCount = (state: SearchState) => state.types.length + state.owners.length + state.tags.length + (state.updated === 'any' ? 0 : 1)

interface ActiveFiltersProps {
  state: SearchState
  onChange: (patch: Partial<SearchState>) => void
  onClear: () => void
  /** Where focus goes when no chip is left. */
  fallback: RefObject<HTMLInputElement | null>
}

export function ActiveFilters({ state, onChange, onClear, fallback }: ActiveFiltersProps) {
  const list = useRef<HTMLDivElement>(null)
  const { copy, people } = useSearchConfig()
  const chips = chipsFor(state, copy, people)

  const refocus = (index: number) =>
    requestAnimationFrame(() => {
      const removes = list.current?.querySelectorAll<HTMLButtonElement>('li:not([inert]) [data-slot=badge-remove]') ?? []
      const next = removes[Math.min(index, removes.length - 1)]
      ;(next ?? fallback.current)?.focus()
    })

  return (
    <div ref={list} className="flex flex-wrap items-center gap-1.5">
      <PresenceList aria-label={copy.activeFilters} className="flex flex-wrap items-center gap-1.5">
        {chips.map((chip, i) => (
          <PresenceItem key={chip.key}>
            <Badge variant="outline" size="lg" className="gap-1 pe-1.5 text-fg focus-ring-within">
              <span className="text-fg-muted">{chip.facet}:</span>
              {chip.label}
              <BadgeRemove
                aria-label={copy.removeFilter(chip.facet, chip.label)}
                onClick={() => {
                  onChange(chip.patch)
                  refocus(i)
                }}
              />
            </Badge>
          </PresenceItem>
        ))}
      </PresenceList>
      {chips.length > 1 && (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => {
            onClear()
            fallback.current?.focus()
          }}
        >
          {copy.clearAll}
        </Button>
      )}
    </div>
  )
}
