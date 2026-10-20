'use client'

import { useEffect, useState } from 'react'
import { Field, FieldDescription, FieldLabel } from '@youj/react'
import { Combobox, type ComboboxOption } from '@youj/react/command'

const DIRECTORY: ComboboxOption[] = [
  { value: 'ada', label: 'Ada Lovelace', description: 'ada@orion.dev' },
  { value: 'barbara', label: 'Barbara Liskov', description: 'barbara@orion.dev' },
  { value: 'donald', label: 'Donald Knuth', description: 'don@orion.dev' },
  { value: 'edsger', label: 'Edsger Dijkstra', description: 'edsger@orion.dev' },
  { value: 'frances', label: 'Frances Allen', description: 'frances@orion.dev' },
  { value: 'john', label: 'John Backus', description: 'john@orion.dev' },
  { value: 'ken', label: 'Ken Thompson', description: 'ken@orion.dev' },
  { value: 'radia', label: 'Radia Perlman', description: 'radia@orion.dev' },
]

// Stands in for a request to your API.
function searchDirectory(query: string): Promise<ComboboxOption[]> {
  const q = query.trim().toLowerCase()
  return new Promise((resolve) =>
    setTimeout(() => resolve(DIRECTORY.filter((person) => person.label.toLowerCase().includes(q))), 650),
  )
}

export default function ComboboxAsync() {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<ComboboxOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let live = true
    setLoading(true)
    searchDirectory(search).then((people) => {
      // A slower, older request never overwrites a newer one.
      if (!live) return
      setResults(people)
      setLoading(false)
    })
    return () => {
      live = false
    }
  }, [search])

  return (
    <Field className="w-full max-w-xs">
      <FieldLabel>Reviewer</FieldLabel>
      <Combobox
        options={results}
        onSearchChange={setSearch}
        loading={loading}
        loadingLabel="Searching the directory…"
        placeholder="Find a reviewer"
        searchPlaceholder="Search the directory…"
        emptyMessage={`Nobody called “${search}”.`}
      />
      <FieldDescription>Results come from the company directory.</FieldDescription>
    </Field>
  )
}
