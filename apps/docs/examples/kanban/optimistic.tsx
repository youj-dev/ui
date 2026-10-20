'use client'

import { useState } from 'react'
import { Kanban, Label, Switch, type KanbanCardData, type KanbanColumn, type KanbanMove } from '@youj/react'

const COLUMNS: KanbanColumn[] = [
  { id: 'todo', title: 'To do' },
  { id: 'doing', title: 'In progress' },
  { id: 'done', title: 'Done', tone: 'success' },
]

const CARDS: KanbanCardData[] = [
  { id: 'c1', column: 'todo', title: 'Fix login redirect loop' },
  { id: 'c2', column: 'todo', title: 'Keyboard shortcuts sheet' },
  { id: 'c3', column: 'doing', title: 'Dark mode for charts' },
  { id: 'c4', column: 'done', title: 'Onboarding checklist' },
]

export default function KanbanOptimistic() {
  const [cards, setCards] = useState(CARDS)
  const [fail, setFail] = useState(true)

  // The board shows the move at once. A rejected promise puts the card back, and says so.
  const save = (_move: KanbanMove, next: KanbanCardData[]) =>
    new Promise<void>((resolve, reject) =>
      setTimeout(() => {
        if (fail) reject(new Error('Conflict'))
        else {
          setCards(next)
          resolve()
        }
      }, 700),
    )

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center gap-2 px-3">
        <Switch id="kanban-fail" checked={fail} onCheckedChange={setFail} />
        <Label htmlFor="kanban-fail">Fail saves</Label>
      </div>
      <Kanban
        aria-label="Sprint 24"
        columns={COLUMNS}
        cards={cards}
        renderCard={(card) => <p className="px-(--card-spacing) text-ui leading-snug font-medium text-fg">{card.title}</p>}
        onMove={save}
      />
    </div>
  )
}
