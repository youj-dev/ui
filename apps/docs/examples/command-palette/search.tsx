'use client'

import { useEffect, useState } from 'react'
import { ClockIcon, FlagIcon } from '@youj/icons'
import { Button } from '@youj/react'
import { CommandEmpty, CommandGroup, CommandItem, CommandLoading, CommandPalette } from '@youj/react/command'

const ISSUES = [
  { id: 'KIN-812', title: 'Stream search results from the edge' },
  { id: 'KIN-815', title: 'Highlight matches in search titles' },
  { id: 'KIN-821', title: 'Preview comments sync with the tracker' },
  { id: 'KIN-830', title: 'Cold starts regress on the edge runtime' },
  { id: 'KIN-844', title: 'Audit log filter for deployments' },
]

/* Stands in for a search request to your API. */
const searchIssues = (query: string) =>
  new Promise<typeof ISSUES>((resolve) =>
    setTimeout(() => resolve(ISSUES.filter((i) => `${i.id} ${i.title}`.toLowerCase().includes(query))), 550),
  )

function IssueResults({ search, onOpen }: { search: string; onOpen: (id: string) => void }) {
  const query = search.trim().toLowerCase()
  const [results, setResults] = useState<typeof ISSUES | null>(null)
  useEffect(() => {
    setResults(null)
    if (query.length < 2) return
    let live = true
    searchIssues(query).then((found) => live && setResults(found))
    return () => {
      live = false
    }
  }, [query])

  if (query.length < 2) {
    return (
      <CommandGroup heading="Recent">
        {ISSUES.slice(3).map((issue) => (
          <CommandItem key={issue.id} value={issue.id} onSelect={() => onOpen(issue.id)}>
            <ClockIcon />
            <span className="shrink-0 font-mono text-ui-sm whitespace-nowrap text-fg-muted">{issue.id}</span>
            <span className="truncate">{issue.title}</span>
          </CommandItem>
        ))}
      </CommandGroup>
    )
  }
  // "No results" only once the answer is in: nothing having arrived yet isn't the same as nothing found.
  if (!results) return <CommandLoading label="Searching issues…" />
  if (results.length === 0) return <CommandEmpty>Nothing matches “{search}”.</CommandEmpty>
  return (
    <CommandGroup heading="Issues">
      {results.map((issue) => (
        <CommandItem key={issue.id} value={issue.id} onSelect={() => onOpen(issue.id)}>
          <FlagIcon />
          <span className="shrink-0 font-mono text-ui-sm whitespace-nowrap text-fg-muted">{issue.id}</span>
          <span className="truncate">{issue.title}</span>
        </CommandItem>
      ))}
    </CommandGroup>
  )
}

export default function CommandPaletteSearch() {
  const [open, setOpen] = useState(false)
  const [opened, setOpened] = useState('')

  return (
    <div className="flex flex-col items-center gap-3">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Search issues
      </Button>
      <p role="status" className="h-5 text-ui-sm text-fg-muted">
        {opened && `Opened ${opened}`}
      </p>
      {/* One palette per page should own a shortcut. This one opens from its button only. */}
      <CommandPalette open={open} onOpenChange={setOpen} shortcut={false} shouldFilter={false} placeholder="Search issues (try “edge”)…">
        {({ search, close }) => (
          <IssueResults
            search={search}
            onOpen={(id) => {
              setOpened(id)
              close()
            }}
          />
        )}
      </CommandPalette>
    </div>
  )
}
