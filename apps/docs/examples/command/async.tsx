'use client'

import { useEffect, useState } from 'react'
import { UserIcon } from '@youj/icons'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandLoading } from '@youj/react/command'

const DIRECTORY = ['Ana Lima', 'Amara Okafor', 'Jonas Weber', 'Kenji Sato', 'Lucía Torres', 'Mateo Rossi', 'Priya Raman', 'Sara Lindqvist']

/* Stands in for a request to your API. */
function searchPeople(query: string) {
  return new Promise<string[]>((resolve) =>
    setTimeout(() => resolve(DIRECTORY.filter((name) => name.toLowerCase().includes(query.toLowerCase()))), 600),
  )
}

export default function CommandAsync() {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [assigned, setAssigned] = useState('')

  useEffect(() => {
    if (!search) {
      setResults([])
      setLoading(false)
      return
    }
    let live = true
    setLoading(true)
    searchPeople(search).then((found) => {
      if (!live) return
      setResults(found)
      setLoading(false)
    })
    return () => {
      live = false
    }
  }, [search])

  return (
    <div className="flex min-h-80 w-full max-w-xs flex-col gap-3">
      {/* The results arrive already matched, so cmdk's own filtering is off. */}
      <Command label="Assign to" shouldFilter={false} className="rounded-xl border border-line shadow-md">
        <CommandInput value={search} onValueChange={setSearch} placeholder="Search people (try “a”)…" />
        <CommandList>
          {loading && <CommandLoading label="Searching the directory…" />}
          <CommandEmpty>{search ? `Nobody called “${search}”.` : 'Start typing to search.'}</CommandEmpty>
          {!loading && results.length > 0 && (
            <CommandGroup heading="People">
              {results.map((name) => (
                <CommandItem key={name} value={name} onSelect={() => setAssigned(name)}>
                  <UserIcon />
                  {name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
      <p role="status" className="h-5 px-1 text-ui-sm text-fg-muted">
        {assigned && `Assigned KIN-830 to ${assigned}`}
      </p>
    </div>
  )
}
