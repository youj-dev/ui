'use client'

import { useId, type ReactNode } from 'react'
import { Counter } from '@youj/motion'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Checkbox } from '../../../components/ui/checkbox'
import { Field, FieldLabel, FieldLegend, FieldSet } from '../../../components/ui/field'
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group'
import { Toggle } from '../../../components/ui/toggle'
import { cn } from '../../../lib/utils'
import { personOf, useSearchConfig } from './copy'
import { TYPES, UPDATED, type Updated } from './data'
import type { FacetCounts, SearchState } from './model'
import { Eyebrow } from '../../../components/ui/typography'

/* The facets: type, owner, last updated and tags. Every option carries the
 * number of results picking it would give (the facet's own choices left out,
 * so ticking Documents doesn't zero People), and the numbers tween to their
 * new values as the query and other facets change. Options at zero dim but
 * stay reachable. Which owners and tags are listed, and their order, come
 * from the query alone, so options never jump under the pointer. The same
 * panel sits in the sidebar and, on small screens, in a Sheet. */

type Patch = (patch: Partial<SearchState>) => void

const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

// Whole numbers all the way through the tween.
const WHOLE = { maximumFractionDigits: 0 }

function Count({ value }: { value: number }) {
  return <Counter value={value} from={value} format={WHOLE} inView={false} duration="base" ease="standard" className="ms-auto ps-2 text-ui-sm text-fg-muted" />
}

function Group({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <FieldSet className="gap-2.5 border-t border-line pt-4 first:border-t-0 first:pt-0">
      <FieldLegend variant="label" className="text-ui-sm text-fg-muted">
        {/* The legend's label variant sets it at text-ui; the Eyebrow matches it, so only a style changes it. */}
        <Eyebrow className="text-ui text-fg-muted">{legend}</Eyebrow>
      </FieldLegend>
      {children}
    </FieldSet>
  )
}

const optionLabel = (count: number) => cn('flex items-center gap-2 font-normal', count === 0 && 'text-fg-muted')

function CheckOption({ checked, count, onChange, children }: { checked: boolean; count: number; onChange: () => void; children: ReactNode }) {
  return (
    <Field orientation="horizontal" className="min-h-7">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <FieldLabel className={optionLabel(count)}>
        {children}
        <Count value={count} />
      </FieldLabel>
    </Field>
  )
}

interface FacetsProps {
  state: SearchState
  counts: FacetCounts
  /** Counts for the query alone: they pick and order the owners and tags, so options hold still while filtering. */
  base: FacetCounts
  onChange: Patch
}

export function Facets({ state, counts, base, onChange }: FacetsProps) {
  const tagsId = useId()
  const { copy, people } = useSearchConfig()
  const byBase = (bucket: Record<string, number>) => (a: string, b: string) => (bucket[b] ?? 0) - (bucket[a] ?? 0) || a.localeCompare(b)
  // Every owner the query finds, listed or not in `people`.
  const owners = [...new Set([...Object.keys(people), ...Object.keys(base.owners)])]
    .filter((id) => base.owners[id] || state.owners.includes(id))
    .sort(byBase(base.owners))
  const tags = [...new Set([...Object.keys(base.tags), ...state.tags])].sort(byBase(base.tags))

  return (
    <div className="flex flex-col gap-4">
      <Group legend={copy.facetType}>
        {TYPES.map((t) => (
          <CheckOption key={t.value} checked={state.types.includes(t.value)} count={counts.types[t.value] ?? 0} onChange={() => onChange({ types: toggle(state.types, t.value) })}>
            {copy.types[t.value]}
          </CheckOption>
        ))}
      </Group>

      <Group legend={copy.facetUpdated}>
        <RadioGroup value={state.updated} onValueChange={(value) => onChange({ updated: value as Updated })} className="gap-2.5">
          {UPDATED.map((u) => {
            const count = counts.updated[u.value] ?? 0
            return (
              <Field key={u.value} orientation="horizontal" className="min-h-7">
                <RadioGroupItem value={u.value} />
                <FieldLabel className={optionLabel(count)}>
                  {copy.updatedOptions[u.value]}
                  <Count value={count} />
                </FieldLabel>
              </Field>
            )
          })}
        </RadioGroup>
      </Group>

      <Group legend={copy.facetOwner}>
        {owners.length ? (
          owners.map((id) => (
            <CheckOption key={id} checked={state.owners.includes(id)} count={counts.owners[id] ?? 0} onChange={() => onChange({ owners: toggle(state.owners, id) })}>
              <Avatar size="sm" aria-hidden>
                <AvatarFallback>{personOf(people, id).initials}</AvatarFallback>
              </Avatar>
              <span className="truncate">{personOf(people, id).name}</span>
            </CheckOption>
          ))
        ) : (
          <p className="text-ui-sm text-fg-muted">{copy.noOwners}</p>
        )}
      </Group>

      <div role="group" aria-labelledby={tagsId} className="flex flex-col gap-2.5 border-t border-line pt-4">
        <Eyebrow id={tagsId} className="text-ui-sm font-medium text-fg-muted">
          {copy.facetTags}
        </Eyebrow>
        {tags.length === 0 && <p className="text-ui-sm text-fg-muted">{copy.noTags}</p>}
        <div className="flex flex-wrap gap-1.5 empty:hidden">
          {tags.map((t) => (
            <Toggle
              key={t}
              size="sm"
              variant="outline"
              pressed={state.tags.includes(t)}
              onPressedChange={() => onChange({ tags: toggle(state.tags, t) })}
              className="rounded-chip px-2.5 font-normal"
            >
              {t}
              <Count value={counts.tags[t] ?? 0} />
            </Toggle>
          ))}
        </div>
      </div>
    </div>
  )
}
