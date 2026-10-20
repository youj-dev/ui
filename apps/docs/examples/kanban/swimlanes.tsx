'use client'

import { useState } from 'react'
import { Badge, Kanban, type KanbanCardData, type KanbanColumn, type KanbanLane } from '@youj/react'

interface Task extends KanbanCardData {
  points: number
}

const COLUMNS: KanbanColumn[] = [
  { id: 'todo', title: 'To do' },
  { id: 'doing', title: 'In progress', limit: 2 },
  { id: 'done', title: 'Done', tone: 'success' },
]

const LANES: KanbanLane[] = [
  { id: 'web', title: 'Web' },
  { id: 'platform', title: 'Platform' },
]

const TASKS: Task[] = [
  { id: 't1', column: 'todo', lane: 'web', title: 'Empty states for settings', points: 3 },
  { id: 't2', column: 'doing', lane: 'web', title: 'Inline title editing', points: 2 },
  { id: 't3', column: 'done', lane: 'web', title: 'Onboarding checklist', points: 3 },
  { id: 't4', column: 'todo', lane: 'platform', title: 'Rate-limit search API', points: 5 },
  { id: 't5', column: 'doing', lane: 'platform', title: 'Stream deploy logs', points: 8 },
  { id: 't6', column: 'done', lane: 'platform', title: 'Postgres 17 upgrade', points: 5 },
]

export default function KanbanSwimlanes() {
  const [cards, setCards] = useState(TASKS)
  return (
    <div className="w-full">
      <Kanban
        aria-label="Sprint 24 by team"
        columns={COLUMNS}
        lanes={LANES}
        cards={cards}
        renderCard={(card) => (
          <div className="flex items-start gap-2 px-(--card-spacing)">
            <p className="flex-1 text-ui leading-snug font-medium text-fg">{card.title}</p>
            <Badge variant="secondary" className="tabular-nums" aria-label={`${card.points} points`}>
              {card.points}
            </Badge>
          </div>
        )}
        onMove={(_, next) => setCards(next)}
      />
    </div>
  )
}
