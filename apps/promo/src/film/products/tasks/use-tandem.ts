import { useEffect, useMemo, useRef, useState } from 'react'
import type { TimelineEvent } from '@youj/react/components/ui/timeline'
import { toast } from '@youj/react/components/ui/toast'
import { useAnnouncer } from '@youj/react/hooks/use-announcer'
import { celebrate } from './components/celebrate'
import { makeProjects, ME, PERSON, ready, slipping, type Status, type Task } from './data'
import { dayLabel, rangeLabel, startOfToday } from './days'
import { criticalChain, knockOn, schedule, verdict, type Schedule, type Trial } from './schedule'

export type View = 'runway' | 'board'
export type Scenario = 'on-track' | 'slipping' | 'ready'

export interface TandemOptions {
  defaultView: View
  defaultProject: string
  scenario: Scenario
}

const STATUS_NAMES: Record<Status, string> = { todo: 'To do', doing: 'Doing', done: 'Done' }

/**
 * Tandem's state and verbs. Every change to the plan goes through `plan`,
 * which records it in the task's activity, says what it pushed (and whether
 * anything now lands after launch), and offers an undo. A drag in progress is
 * a `trial`: the runway shows its knock-on effects before anything is made.
 */
export function useTandem({ defaultView, defaultProject, scenario }: TandemOptions) {
  const [now] = useState(() => Date.now())
  const today = startOfToday(now)
  const [projects, setProjects] = useState(() =>
    makeProjects(now).map((p) => (p.id !== 'first-flush' ? p : scenario === 'slipping' ? slipping(p) : scenario === 'ready' ? ready(p) : p)),
  )
  const [projectId, setProjectId] = useState(defaultProject)
  const [view, setView] = useState<View>(defaultView)
  const [openId, setOpenId] = useState<string | null>(null)
  const [trial, setTrial] = useState<Trial | null>(null)
  const { announce, announcer } = useAnnouncer()
  const undo = useRef<(() => void) | null>(null)

  const project = projects.find((p) => p.id === projectId) ?? projects[0]!
  const placed = useMemo(() => schedule(project.tasks, project.launch, trial), [project, trial])
  const settled = useMemo(() => schedule(project.tasks, project.launch), [project])
  const chain = useMemo(() => criticalChain(placed), [placed])
  const state = useMemo(() => verdict(placed, project.launch), [placed, project.launch])

  const event = (task: Task, type: string, title: string): TimelineEvent => ({ id: `${task.id}-${type}-${Date.now()}`, type, title, actor: { name: PERSON[ME].name }, time: Date.now() })
  const replace = (tasks: Task[]) => setProjects((list) => list.map((p) => (p.id === project.id ? { ...p, tasks } : p)))

  /** Makes a change to one task, then says what it did to the rest of the runway. */
  const plan = (id: string, change: Partial<Task>, record: (task: Task) => TimelineEvent | null, verb: (task: Task, placedAfter: Schedule) => string) => {
    const before = project.tasks
    const task = before.find((t) => t.id === id)
    if (!task) return
    const next = before.map((t) => {
      if (t.id !== id) return t
      const updated = { ...t, ...change }
      const entry = record(updated)
      return entry ? { ...updated, activity: [...t.activity, entry] } : updated
    })
    replace(next)
    const after = schedule(next, project.launch)
    const moved = knockOn(settled, after, id)
    const late = [...after.values()].filter((p) => p.late && !settled.get(p.task.id)?.late)
    const message = verb({ ...task, ...change }, after)
    const effects = [
      moved.length > 0 && `Pushes ${moved.map((p) => `${p.task.title} to ${rangeLabel(today, p.start, p.end)}`).join(', ')}.`,
      late.length > 0 && `${late.map((p) => p.task.title).join(' and ')} now ${late.length === 1 ? 'lands' : 'land'} after launch.`,
    ].filter(Boolean) as string[]
    const nowReady = verdict(after, project.launch).kind === 'ready' && verdict(settled, project.launch).kind !== 'ready'
    announce([message, ...effects, nowReady && 'Everything is handed off: ready for launch.'].filter(Boolean).join(' '))
    const restore = () => {
      replace(before)
      undo.current = null
      announce(`Undone. ${task.title} is back to ${rangeLabel(today, settled.get(id)!.start, settled.get(id)!.end)}.`)
    }
    undo.current = restore
    if (nowReady) celebrate(project.name)
    else toast(message, { description: effects.join(' ') || undefined, action: { label: 'Undo', onClick: restore } })
  }

  const actions = {
    move: (id: string, start: number) =>
      plan(
        id,
        { start },
        (t) => event(t, 'move', `Moved to ${dayLabel(today, start)}`),
        (t, s) => `${t.title}: ${rangeLabel(today, s.get(id)!.start, s.get(id)!.end)}`,
      ),
    resize: (id: string, days: number) =>
      plan(
        id,
        { days: Math.max(1, days) },
        (t) => event(t, 'move', `Now takes ${t.days} ${t.days === 1 ? 'day' : 'days'}`),
        (t, s) => `${t.title}: ${t.days} ${t.days === 1 ? 'day' : 'days'}, ${rangeLabel(today, s.get(id)!.start, s.get(id)!.end)}`,
      ),
    setStatus: (id: string, status: Status) =>
      plan(
        id,
        { status, progress: status === 'doing' ? 0 : undefined },
        (t) => event(t, status === 'done' ? 'ship' : 'move', status === 'done' ? 'Handed off' : `Moved to ${STATUS_NAMES[status]}`),
        (t) => (status === 'done' ? `Handed off “${t.title}”` : `${t.title}: ${STATUS_NAMES[status]}`),
      ),
    save: (id: string, values: Pick<Task, 'title' | 'owner' | 'status' | 'start' | 'days' | 'brief'>) =>
      plan(
        id,
        values,
        (t) => event(t, 'move', 'Edited the task'),
        () => 'Task saved',
      ),
    create: () => {
      const task: Task = { id: `new-${Date.now()}`, title: 'Untitled task', owner: ME, status: 'todo', start: 0, days: 2, after: [], brief: '', activity: [] }
      replace([...project.tasks, { ...task, activity: [event(task, 'create', 'Put it on the runway')] }])
      setOpenId(task.id)
    },
  }

  // N puts a new task on the runway, from anywhere but a field or a dialog.
  const latest = useRef(actions.create)
  latest.current = actions.create
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const el = event.target as HTMLElement | null
      if (event.key !== 'n' || event.metaKey || event.ctrlKey || event.altKey || el?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el?.tagName ?? '')) return
      if (el?.closest?.('[role=dialog],[role=menu],[role=listbox]')) return
      event.preventDefault()
      latest.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return {
    now,
    today,
    projects,
    project,
    setProjectId: (id: string) => {
      setProjectId(id)
      setTrial(null)
    },
    view,
    setView,
    placed,
    settled,
    chain,
    verdict: state,
    trial,
    setTrial,
    openId,
    setOpenId,
    undo,
    announce,
    announcer,
    ...actions,
  }
}

export type Tandem = ReturnType<typeof useTandem>
