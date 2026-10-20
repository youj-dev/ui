'use client'

import type { KeyboardEvent, RefObject } from 'react'
import { SearchIcon, XIcon } from '@youj/icons'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '../../../components/ui/input-group'
import type { FaqCopy } from './data'

/* The search: a field that filters as you type, with the count of answers it leaves at its end and a clear button;
 * Escape clears it and ↓ goes to the first question. `Marked` marks every word of the query in a text, matching the
 * way the search does (any case, any accent). */

/** Each character's folded form, and where it came from: so a match in the folded text maps back to the original. */
function foldMap(text: string) {
  let folded = ''
  const from: number[] = []
  for (let i = 0; i < text.length; i++) {
    const f = text[i]!.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    for (let j = 0; j < f.length; j++) from.push(i)
    folded += f
  }
  return { folded, from }
}

/** The ranges of `text` that match any of `terms` (already folded), merged where they touch. */
function ranges(text: string, terms: string[]) {
  const { folded, from } = foldMap(text)
  const found: [number, number][] = []
  for (const term of terms) {
    for (let at = folded.indexOf(term); at !== -1 && term; at = folded.indexOf(term, at + term.length)) {
      found.push([from[at]!, from[at + term.length - 1]! + 1])
    }
  }
  found.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const r of found) {
    const last = merged.at(-1)
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1])
    else merged.push([...r])
  }
  return merged
}

export function Marked({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return text
  const parts: React.ReactNode[] = []
  let at = 0
  for (const [start, end] of ranges(text, terms)) {
    if (start > at) parts.push(text.slice(at, start))
    parts.push(
      <mark key={start} className="rounded-xs bg-accent-line text-fg">
        {text.slice(start, end)}
      </mark>,
    )
    at = end
  }
  if (at < text.length) parts.push(text.slice(at))
  return parts
}

interface SearchProps {
  copy: FaqCopy
  value: string
  onValueChange: (value: string) => void
  /** How many answers the query leaves, shown while there is one. */
  count: number
  /** Where ↓ takes focus: the list of questions. */
  list: RefObject<HTMLElement | null>
}

export function Search({ copy, value, onValueChange, count, list }: SearchProps) {
  const keys = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && value) {
      event.preventDefault()
      onValueChange('')
    } else if (event.key === 'ArrowDown') {
      const first = list.current?.querySelector<HTMLElement>('[data-slot=accordion-trigger]')
      if (!first) return
      event.preventDefault()
      first.focus()
    }
  }
  return (
    <InputGroup className="h-control-lg rounded-field-lg">
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        aria-label={copy.search}
        placeholder={copy.searchPlaceholder}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={keys}
        // Its own clear button, not the browser's.
        className="[&::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <InputGroupAddon align="inline-end">
          <span className="font-mono text-ui-xs text-fg-subtle tabular-nums">{copy.results(count)}</span>
          <InputGroupButton size="icon-xs" aria-label={copy.clearSearch} onClick={() => onValueChange('')}>
            <XIcon />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}
