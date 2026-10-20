'use client'

import { CalendarClockIcon, KanbanIcon, PlusIcon } from '@youj/icons'
import { AvatarStack } from '@youj/react/components/ui/avatar-stack'
import { Button } from '@youj/react/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@youj/react/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@youj/react/components/ui/toggle-group'
import { cn } from '@youj/react/lib/utils'
import { PEOPLE } from '../data'
import type { Tandem, View } from '../use-tandem'
import { Countdown } from './countdown'
import { Verdict } from './verdict'

const TEAM = PEOPLE.map((p) => ({ id: p.id, name: p.name, presence: p.presence, description: p.role }))
const DAY = 86_400_000

function TandemMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" aria-hidden className={cn('text-accent', className)}>
      <circle cx="10.5" cy="14" r="7.5" fill="currentColor" />
      <circle cx="17.5" cy="14" r="7.5" fill="currentColor" fillOpacity="0.4" />
    </svg>
  )
}

/**
 * The top of the plan: the studio and the project (a switch between them),
 * the views, the team and New task; then the project itself, with the
 * countdown and the one line that says how the launch stands.
 */
export function Header({ tandem, compact }: { tandem: Tandem; compact: boolean }) {
  const { project, projects, today } = tandem
  const done = project.tasks.filter((t) => t.status === 'done').length
  const items = Object.fromEntries(projects.map((p) => [p.id, p.name]))
  return (
    <header className="shrink-0">
      <div className="flex h-14 items-center gap-2 px-4 md:gap-3 md:px-6">
        <span className="flex items-center gap-2">
          <TandemMark className="size-6" />
          <span className="text-ui-lg font-semibold tracking-tight max-sm:sr-only">Tandem</span>
        </span>
        <span aria-hidden className="text-fg-subtle max-md:hidden">
          /
        </span>
        <span className="text-ui text-fg-muted max-md:hidden">Brightwater Studio</span>
        <span aria-hidden className="text-fg-subtle max-sm:hidden">
          /
        </span>
        <Select items={items} value={project.id} onValueChange={(id) => id && tandem.setProjectId(id)}>
          <SelectTrigger aria-label="Project" size="sm" variant="ghost" className="w-auto px-2 font-medium shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ms-auto flex items-center gap-2 md:gap-3">
          <AvatarStack users={TEAM} max={4} label="Studio" size="sm" className="-space-x-0.5 max-lg:hidden" />
          <ToggleGroup variant="segmented" size="sm" value={[tandem.view]} onValueChange={(v) => v[0] && tandem.setView(v[0] as View)} aria-label="View">
            <ToggleGroupItem value="runway" aria-label={compact ? 'Runway' : undefined}>
              <CalendarClockIcon size={15} />
              <span className="max-sm:sr-only">Runway</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="board" aria-label={compact ? 'Board' : undefined}>
              <KanbanIcon size={15} />
              <span className="max-sm:sr-only">Board</span>
            </ToggleGroupItem>
          </ToggleGroup>
          <Button size={compact ? 'icon-sm' : 'sm'} aria-label={compact ? 'New task' : undefined} aria-keyshortcuts="N" onClick={tandem.create} data-yj-trigger="">
            <PlusIcon size={15} />
            {!compact && 'New task'}
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-x-8 gap-y-4 border-b border-line px-4 pt-3 pb-5 md:px-6">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight text-balance text-fg">{project.name}</h1>
          <p className="text-ui text-fg-muted">
            For {project.client} · {project.tasks.length} {project.tasks.length === 1 ? 'task' : 'tasks'}, {done} handed off
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:ms-auto">
          <Verdict verdict={tandem.verdict} />
          <div className="flex items-baseline gap-2">
            <span className="text-ui-xs font-medium tracking-[0.14em] text-fg-muted uppercase">Launch in</span>
            <Countdown to={today + project.launch * DAY + 9 * 3_600_000} className="text-xl leading-none" />
          </div>
        </div>
      </div>
    </header>
  )
}
