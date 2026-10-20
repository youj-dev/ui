import { useState, type KeyboardEvent, type MouseEvent } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowRightIcon, CopyIcon, TrashIcon } from '@youj/icons'
import { AvatarGroup, Avatar, AvatarFallback } from '../avatar'
import { Badge } from '../badge'
import { ContextMenuItem, ContextMenuSeparator } from '../context-menu'
import { Label } from '../label'
import { Progress } from '../progress'
import { Switch } from '../switch'
import { Kanban, type KanbanLane, type KanbanMove } from './index'
import { IssueCard, SPRINT_CARDS, SPRINT_COLUMNS, SPRINT_LANES, type Issue } from './kanban.fixtures'

const meta: Meta<typeof Kanban> = {
  title: 'UI/Display/Kanban',
  component: Kanban,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "A kanban board composed from Card, Badge, Button, Input and ContextMenu. Drag a card (touch: press and hold) and it lifts into a tilted preview while a gap opens where it will land, the cards around it gliding aside on motion `layout`; the board and its columns scroll near their edges; release settles it into the gap. From the keyboard, cards are one Tab stop: arrows walk them, Space picks one up, arrows move it between positions, columns and lanes, Space drops and Escape cancels, each step announced (\"Picked up Fix login. To do, position 2 of 5.\"). Columns carry counts, WIP limits that turn the header warning when exceeded (live while you hover), collapse to a rail and an add-card composer. `onMove` can return a promise: the move shows at once and rolls back, announced, if it rejects. Swimlanes are optional. Reduced motion: no lift, no glide, instant placement.",
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Kanban>

function SprintHeader({ cards }: { cards: Issue[] }) {
  const done = cards.filter((c) => c.column === 'done').reduce((n, c) => n + c.points, 0)
  const total = cards.reduce((n, c) => n + c.points, 0)
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
      <div className="me-auto">
        <h1 className="text-ui-lg font-semibold text-fg">Sprint 24</h1>
        <p className="text-ui-sm text-fg-muted">Sep 22 – Oct 3 · Web and Platform</p>
      </div>
      <div className="flex w-48 flex-col gap-1">
        <div className="flex justify-between text-ui-sm text-fg-muted tabular-nums">
          <span>
            {done} of {total} points
          </span>
          <span>{Math.round((done / total) * 100)}%</span>
        </div>
        <Progress value={(done / total) * 100} aria-label="Sprint progress" />
      </div>
      <AvatarGroup>
        {['LH', 'MK', 'AR', 'JO'].map((a) => (
          <Avatar key={a} size="sm">
            <AvatarFallback className="text-[10px]">{a}</AvatarFallback>
          </Avatar>
        ))}
      </AvatarGroup>
    </div>
  )
}

function useSprint() {
  const [cards, setCards] = useState(SPRINT_CARDS)
  const add = ({ column, lane }: { column: string; lane?: string }, title: string) =>
    setCards((cs) => {
      const key = `ENG-${230 + cs.length}`
      return [...cs, { id: key, key, column, lane: lane ?? 'web', title, priority: 'medium' as const, labels: [], assignee: 'LH', points: 1 }]
    })
  return { cards, setCards, add }
}

const menu = (setCards: (fn: (cs: Issue[]) => Issue[]) => void) => (card: Issue) => (
  <>
    <ContextMenuItem onClick={() => setCards((cs) => [...cs.filter((c) => c.id !== card.id), { ...card, column: 'done' }])}>
      <ArrowRightIcon /> Move to Done
    </ContextMenuItem>
    <ContextMenuItem onClick={() => setCards((cs) => [...cs, { ...card, id: `${card.id}-copy`, key: `${card.key}-copy` }])}>
      <CopyIcon /> Duplicate
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="danger" onClick={() => setCards((cs) => cs.filter((c) => c.id !== card.id))}>
      <TrashIcon /> Delete
    </ContextMenuItem>
  </>
)

/** A product sprint board. Drag cards between and within columns, or Tab to a card and use Space and the arrows. In progress has a WIP limit of 3: take a fourth card over it and the header warns. Right-click a card for its menu. */
export const Hero: Story = {
  render: function Render() {
    const { cards, setCards, add } = useSprint()
    return (
      <div className="flex h-screen flex-col gap-4 bg-canvas p-4 sm:p-6">
        <SprintHeader cards={cards} />
        <Kanban
          aria-label="Sprint 24"
          columns={SPRINT_COLUMNS}
          cards={cards}
          renderCard={(card) => <IssueCard issue={card} />}
          onMove={(_, next) => setCards(next)}
          onAddCard={add}
          cardMenu={menu(setCards)}
          defaultCollapsed={['backlog']}
          className="min-h-0 flex-1"
        />
      </div>
    )
  },
}

/** Swimlanes: one row of cells per team. Arrows cross lanes at the top and bottom of a cell. */
export const Swimlanes: Story = {
  render: function Render() {
    const { cards, setCards, add } = useSprint()
    return (
      <div className="flex h-screen flex-col gap-4 overflow-auto bg-canvas p-4 sm:p-6">
        <SprintHeader cards={cards} />
        <Kanban
          aria-label="Sprint 24 by team"
          columns={SPRINT_COLUMNS}
          lanes={SPRINT_LANES}
          cards={cards}
          renderCard={(card) => <IssueCard issue={card} />}
          onMove={(_, next) => setCards(next)}
          onAddCard={add}
        />
      </div>
    )
  },
}

/** Optimistic moves: the board shows every move at once and `onMove` saves it. Turn on "Fail saves" and a moved card goes back to where it was after the server says no, and the board says so. */
export const OptimisticRollback: Story = {
  render: function Render() {
    const [fail, setFail] = useState(true)
    const [log, setLog] = useState<string[]>([])
    const save = (move: KanbanMove<Issue>) =>
      new Promise((resolve, reject) =>
        setTimeout(() => {
          const line = `${move.card.key} → ${move.to.column} #${move.to.index + 1}`
          setLog((l) => [`${fail ? '✕' : '✓'} ${line}`, ...l].slice(0, 5))
          if (fail) reject(new Error('conflict'))
          else resolve(null)
        }, 700),
      )
    return (
      <div className="flex h-screen flex-col gap-4 bg-canvas p-4 sm:p-6">
        <div className="flex items-center gap-3 px-1">
          <Switch id="fail" checked={fail} onCheckedChange={setFail} />
          <Label htmlFor="fail">Fail saves</Label>
          <div className="ms-auto flex gap-1.5">
            {log.map((l, i) => (
              <Badge key={i} variant={l.startsWith('✕') ? 'danger' : 'success'} className="font-mono">
                {l}
              </Badge>
            ))}
          </div>
        </div>
        <Kanban aria-label="Sprint 24" columns={SPRINT_COLUMNS.slice(1, 4)} cards={SPRINT_CARDS} renderCard={(card) => <IssueCard issue={card} />} onMove={save} className="min-h-0 flex-1" />
      </div>
    )
  },
}

const PEOPLE: KanbanLane[] = [
  { id: 'LH', name: 'Lena Hart' },
  { id: 'MK', name: 'Mira Kovac' },
  { id: 'AR', name: 'Ari Reyes' },
  { id: 'JO', name: 'Jonas Ortiz' },
  { id: 'TB', name: 'Theo Brandt' },
].map(({ id, name }) => ({
  id,
  label: name,
  title: (
    <span className="flex items-center gap-2 text-fg">
      <Avatar size="sm">
        <AvatarFallback>{id}</AvatarFallback>
      </Avatar>
      {name}
    </span>
  ),
}))

/** A lane per person (an avatar and a name; `label` names it in words), with `hideEmptyLanes` leaving out Theo, who has nothing assigned. Click or Enter selects a card, Shift, ⌘ or Ctrl adds to the selection: the app keeps `selectedIds` and the board draws them. `snap` stops a phone's sideways swipe at each column. */
export const SelectionAndPeople: Story = {
  render: function Render() {
    const [cards, setCards] = useState(() => SPRINT_CARDS.map((card) => ({ ...card, lane: card.assignee })))
    const [selected, setSelected] = useState<string[]>([])
    const select = (card: Issue, event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => {
      const adding = event.shiftKey || event.metaKey || event.ctrlKey
      setSelected((ids) => (adding ? (ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id]) : [card.id]))
    }
    return (
      <div className="flex h-screen flex-col gap-4 overflow-auto bg-canvas p-4 sm:p-6">
        <p className="px-1 text-ui-sm text-fg-muted" aria-live="polite">
          {selected.length} selected
        </p>
        <Kanban
          aria-label="Sprint 24 by person"
          columns={SPRINT_COLUMNS}
          lanes={PEOPLE}
          hideEmptyLanes
          snap
          cards={cards}
          selectedIds={selected}
          onCardAction={select}
          renderCard={(card) => <IssueCard issue={card} />}
          onMove={(_, next) => setCards(next)}
        />
      </div>
    )
  },
}
