'use client'

import { useState, type KeyboardEvent, type MouseEvent } from 'react'
import { Avatar, AvatarFallback, Kanban, type KanbanCardData, type KanbanColumn, type KanbanLane } from '@youj/react'

const COLUMNS: KanbanColumn[] = [
  { id: 'todo', title: 'To do' },
  { id: 'doing', title: 'In progress', limit: 2 },
  { id: 'done', title: 'Done', tone: 'success' },
]

const PEOPLE = [
  { id: 'mk', name: 'Mira Kovac', initials: 'MK' },
  { id: 'jo', name: 'Jonas Ortiz', initials: 'JO' },
  { id: 'sn', name: 'Sana Noor', initials: 'SN' },
]

// A lane per person: an avatar and a name, with `label` naming it in words.
const LANES: KanbanLane[] = PEOPLE.map((person) => ({
  id: person.id,
  label: person.name,
  title: (
    <span className="flex items-center gap-2">
      <Avatar size="sm">
        <AvatarFallback>{person.initials}</AvatarFallback>
      </Avatar>
      {person.name}
    </span>
  ),
}))

// Sana has nothing assigned, so `hideEmptyLanes` leaves her lane out.
const TASKS: KanbanCardData[] = [
  { id: 't1', column: 'todo', lane: 'mk', title: 'Empty states for settings' },
  { id: 't2', column: 'doing', lane: 'mk', title: 'Inline title editing' },
  { id: 't3', column: 'done', lane: 'mk', title: 'Onboarding checklist' },
  { id: 't4', column: 'todo', lane: 'jo', title: 'Rate-limit search API' },
  { id: 't5', column: 'doing', lane: 'jo', title: 'Stream deploy logs' },
]

export default function KanbanSelection() {
  const [cards, setCards] = useState(TASKS)
  const [selected, setSelected] = useState<string[]>([])
  // Click or Enter selects one card; with Shift, ⌘ or Ctrl it adds or removes one.
  const select = (card: KanbanCardData, event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => {
    const adding = event.shiftKey || event.metaKey || event.ctrlKey
    setSelected((ids) => (adding ? (ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id]) : [card.id]))
  }
  return (
    <div className="flex w-full flex-col gap-2">
      <p className="text-ui-sm text-fg-muted" aria-live="polite">
        {selected.length} selected
      </p>
      <Kanban
        aria-label="Assignments"
        columns={COLUMNS}
        lanes={LANES}
        hideEmptyLanes
        snap
        cards={cards}
        selectedIds={selected}
        onCardAction={select}
        renderCard={(card) => <p className="px-(--card-spacing) text-ui leading-snug font-medium text-fg">{card.title}</p>}
        onMove={(_, next) => setCards(next)}
      />
    </div>
  )
}
