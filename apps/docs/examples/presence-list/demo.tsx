'use client'

import { useId, useState } from 'react'
import { PresenceItem, PresenceList } from '@youj/motion'
import { PinIcon, PlusIcon, TrashIcon } from '@youj/icons'

interface Note {
  id: number
  title: string
  body: string
  pinned: boolean
}

const SEED: Note[] = [
  { id: 1, title: 'Build failed on chore/deps', body: 'Type error in the motion typings.', pinned: false },
  { id: 2, title: 'Priya requested your review', body: 'feat/search: Debounce the query', pinned: false },
  { id: 3, title: 'Domain verified', body: 'acme.dev now serves production.', pinned: false },
]
const INCOMING = [
  { title: 'Usage at 80%', body: 'Image optimizations this month.' },
  { title: 'Kenji commented on #482', body: '“Ship it once the preview is green.”' },
  { title: 'Deploy promoted', body: 'a41f9e2 is live on production.' },
]

const iconButton =
  'grid size-7 shrink-0 place-items-center rounded-md text-fg-muted outline-none transition-colors yj-duration-fast ease-standard hover:bg-raised hover:text-fg focus-visible:ring-2 focus-visible:ring-accent aria-pressed:text-accent'

export default function PresenceListDemo() {
  const addId = useId()
  const [notes, setNotes] = useState(SEED)
  const [next, setNext] = useState(0)
  // Pinned notes sort first, so a pin is a reorder: the row glides over the others (z-1) to its new slot.
  const ordered = [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned))

  // A dismissed row turns inert at once, which would drop focus on the page body.
  // Hand focus to a neighbor's button first, so keyboard users keep their place.
  function dismiss(id: number, button: HTMLElement) {
    const list = button.closest('ul')
    const buttons = [...(list?.querySelectorAll<HTMLElement>('li:not([inert]) [data-action="dismiss"]') ?? [])]
    const i = buttons.indexOf(button)
    ;(buttons[i + 1] ?? buttons[i - 1] ?? document.getElementById(addId))?.focus()
    setNotes((all) => all.filter((n) => n.id !== id))
  }

  function add() {
    const incoming = INCOMING[next % INCOMING.length]!
    setNotes((all) => [{ id: 100 + next, pinned: false, ...incoming }, ...all])
    setNext((n) => n + 1)
  }

  return (
    <div className="flex min-h-[340px] w-full max-w-md flex-col">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-2">
        <div className="flex items-center justify-between px-2 pb-2">
          <p className="text-xs font-medium text-fg-muted">Notifications</p>
          <button
            id={addId}
            type="button"
            onClick={add}
            className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-fg-muted outline-none transition-colors yj-duration-fast ease-standard hover:bg-raised hover:text-fg focus-visible:ring-2 focus-visible:ring-accent"
          >
            <PlusIcon size={13} />
            Simulate one
          </button>
        </div>
        <PresenceList className="flex flex-col gap-1">
          {ordered.map((note) => (
            <PresenceItem key={note.id} className={`flex items-center gap-2 rounded-lg bg-surface px-3 py-2.5 hover:bg-raised ${note.pinned ? 'z-1' : ''}`}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-fg">{note.title}</p>
                <p className="truncate text-xs text-fg-muted">{note.body}</p>
              </div>
              <button
                type="button"
                aria-label={`Pin ${note.title}`}
                aria-pressed={note.pinned}
                onClick={() => setNotes((all) => all.map((n) => (n.id === note.id ? { ...n, pinned: !n.pinned } : n)))}
                className={iconButton}
              >
                <PinIcon size={14} />
              </button>
              <button
                type="button"
                data-action="dismiss"
                aria-label={`Dismiss ${note.title}`}
                onClick={(e) => dismiss(note.id, e.currentTarget)}
                className={iconButton}
              >
                <TrashIcon size={14} />
              </button>
            </PresenceItem>
          ))}
        </PresenceList>
        {notes.length === 0 && <p className="px-3 py-6 text-center text-sm text-fg-muted">You’re all caught up.</p>}
      </div>
    </div>
  )
}
