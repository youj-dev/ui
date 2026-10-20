'use client'

import { useId, useState } from 'react'
import { YoujProvider, themes } from '@youj/core'
import { PresenceItem, PresenceList } from '@youj/motion'
import { PlusIcon, RocketIcon } from '@youj/icons'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { Checkbox } from '../../../components/ui/checkbox'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Switch } from '../../../components/ui/switch'
import { cn } from '../../../lib/utils'
import type { HeroMotionCopy, HeroMotionTask } from './data'

/* The motion contract, in the visitor's hands. Three controls (Speed, Reduced
 * motion, Theme) drive a nested YoujProvider around a small release checklist,
 * so the same components the hero is selling answer them live: ticking a task,
 * adding one (it slides in, the rest glide), switching the filter, pressing
 * Ship it. Nothing here is faked: it is the provider's `timeScale`,
 * `reducedMotion` and `theme`, which is all an app sets. */

const SPEEDS = [0.5, 1, 2]

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

type Filter = 'all' | 'open' | 'done'

function Checklist({ copy, initial, more, onShip }: { copy: HeroMotionCopy; initial: HeroMotionTask[]; more: string[]; onShip?: () => Promise<unknown> | unknown }) {
  const [tasks, setTasks] = useState<HeroMotionTask[]>(initial)
  const [filter, setFilter] = useState<Filter>('all')
  const [added, setAdded] = useState(0)
  const shown = tasks.filter((task) => filter === 'all' || (filter === 'done') === task.done)
  const counts = { all: tasks.length, open: tasks.filter((t) => !t.done).length, done: tasks.filter((t) => t.done).length }
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4 text-fg shadow-lg shadow-fg/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 text-ui-lg font-semibold">
          <RocketIcon size={16} className="text-accent" />
          {copy.demoTitle}
        </h3>
        <SegmentedControl value={filter} onValueChange={(next) => setFilter(next as Filter)} aria-label={copy.filterLabel} size="sm" sound={false}>
          {(['all', 'open', 'done'] as const).map((id) => (
            <SegmentedControlItem key={id} value={id}>
              {copy[id]} <span className="text-fg-muted tabular-nums">{counts[id]}</span>
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </div>
      <div className="relative min-h-36">
      <PresenceList aria-label={copy.tasksLabel} className="flex flex-col">
        {shown.map((task) => (
          <PresenceItem key={task.id} className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0">
            <Checkbox
              checked={task.done}
              aria-label={task.label}
              sound={false}
              onCheckedChange={(checked) => setTasks((all) => all.map((t) => (t.id === task.id ? { ...t, done: checked === true } : t)))}
            />
            <span className={cn('min-w-0 flex-1 truncate text-ui transition-colors yj-duration-base ease-standard', task.done ? 'text-fg-muted line-through' : 'text-fg')}>
              {task.label}
            </span>
            <Avatar size="sm">
              <AvatarFallback>{task.label.slice(0, 2)}</AvatarFallback>
            </Avatar>
          </PresenceItem>
        ))}
      </PresenceList>
      {shown.length === 0 && <p className="absolute inset-0 grid place-items-center text-ui-sm text-fg-muted">{copy.nothingHere}</p>}
      </div>
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={added >= more.length}
          onClick={() => {
            setTasks((all) => [...all, { id: `more-${added}`, label: more[added]!, done: false }])
            setAdded((n) => n + 1)
          }}
        >
          <PlusIcon size={14} />
          {copy.addTask}
        </Button>
        <AsyncButton size="sm" onAction={() => (onShip ? onShip() : demo('HeroMotion: onShip', 1400))}>
          {copy.ship}
        </AsyncButton>
      </div>
    </div>
  )
}

export function Tuner({ copy, tasks, moreTasks, onShip }: { copy: HeroMotionCopy; tasks: HeroMotionTask[]; moreTasks: string[]; onShip?: () => Promise<unknown> | unknown }) {
  const id = useId()
  const [speed, setSpeed] = useState(1)
  const [calm, setCalm] = useState(false)
  const [themeId, setThemeId] = useState('own')
  const theme = themes.find((t) => t.id === themeId)
  const themeItems: Record<string, string> = { own: copy.ownTheme, ...Object.fromEntries(themes.map((t) => [t.id, t.name])) }
  return (
    <section aria-label={copy.tunerTitle} className="flex flex-col gap-4 rounded-2xl border border-line bg-canvas p-4 shadow-xl shadow-fg/5 sm:p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-ui font-semibold text-fg">{copy.tunerTitle}</h2>
        <p className="text-ui-sm text-fg-muted">{copy.tunerHint}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl bg-band p-3">
        <div className="flex items-center gap-2">
          <span id={`${id}-speed`} className="text-ui-sm font-medium text-fg-muted">
            {copy.speed}
          </span>
          <SegmentedControl value={String(speed)} onValueChange={(next) => setSpeed(Number(next))} aria-labelledby={`${id}-speed`} size="sm">
            {SPEEDS.map((factor) => (
              <SegmentedControlItem key={factor} value={String(factor)}>
                {copy.speedOption(factor)}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </div>
        <label className="flex items-center gap-2 text-ui-sm font-medium text-fg-muted">
          <Switch checked={calm} onCheckedChange={setCalm} size="sm" />
          {copy.reducedMotion}
        </label>
        <div className="flex items-center gap-2">
          <span id={`${id}-theme`} className="text-ui-sm font-medium text-fg-muted">
            {copy.theme}
          </span>
          <Select items={themeItems} value={themeId} onValueChange={(next) => next && setThemeId(next)}>
            <SelectTrigger size="sm" aria-labelledby={`${id}-theme`} className="min-w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(themeItems).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <YoujProvider timeScale={1 / speed} reducedMotion={calm ? 'always' : 'user'} theme={theme}>
        <div className="rounded-xl bg-canvas" data-slot="motion-stage">
          <Checklist copy={copy} initial={tasks} more={moreTasks} onShip={onShip} />
        </div>
      </YoujProvider>
    </section>
  )
}
