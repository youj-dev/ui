'use client'

import { useRef, useState } from 'react'
import { SearchIcon } from '@youj/icons'
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@youj/react'

const ISSUES = [
  { id: 'KIN-214', title: 'Preview URLs expire too early' },
  { id: 'KIN-209', title: 'Build cache misses in monorepos' },
  { id: 'KIN-198', title: 'Invite emails land in spam' },
  { id: 'KIN-187', title: 'Usage chart skips the last day' },
]

export default function EmptyStateNoResults() {
  const [query, setQuery] = useState('webhook retries')
  const input = useRef<HTMLInputElement>(null)
  const term = query.trim().toLowerCase()
  const matches = ISSUES.filter((issue) => issue.title.toLowerCase().includes(term))

  const clear = () => {
    setQuery('')
    // The button leaves with the empty state, so hand focus back to the search.
    input.current?.focus()
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-line bg-surface">
      <div className="border-b border-line p-3">
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput ref={input} value={query} onValueChange={setQuery} aria-label="Search issues" placeholder="Search issues" />
        </InputGroup>
      </div>
      {/* The count is announced; the list and the empty state themselves stay out of the live region. */}
      <p role="status" className="sr-only">
        {matches.length ? `${matches.length} ${matches.length === 1 ? 'issue' : 'issues'}` : `No issues match ${query.trim()}`}
      </p>
      {matches.length ? (
        <ul className="py-1">
          {matches.map((issue) => (
            <li key={issue.id} className="flex items-center gap-3 px-4 py-2 text-ui">
              <span className="font-mono text-ui-sm text-fg-muted">{issue.id}</span>
              <span className="truncate text-fg">{issue.title}</span>
            </li>
          ))}
        </ul>
      ) : (
        <Empty className="py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon />
            </EmptyMedia>
            <EmptyTitle>No issues match “{query.trim()}”</EmptyTitle>
            <EmptyDescription>Check the spelling, or clear the search to see every open issue.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={clear}>
              Clear search
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </div>
  )
}
