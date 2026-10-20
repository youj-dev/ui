'use client'

import { useState } from 'react'
import { LockIcon } from '@youj/icons'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import type { PermissionLevel, PermissionValue } from '../../../components/ui/level-matrix'
import { cn } from '../../../lib/utils'
import type { PermissionMatrixCopy, PermissionMatrixResource, PermissionMatrixRole } from './data'

interface RoleViewProps {
  roles: PermissionMatrixRole[]
  resources: PermissionMatrixResource[]
  value: PermissionValue
  saved: PermissionValue
  onValueChange: (value: PermissionValue) => void
  copy: PermissionMatrixCopy
}

const LEVELS: PermissionLevel[] = ['none', 'read', 'write', 'admin']
const RANK: Record<PermissionLevel, number> = { none: 0, read: 1, write: 2, admin: 3 }
const level = (value: PermissionValue, role: string, area: string): PermissionLevel => value[role]?.[area] ?? 'none'

/* The same draft as the grid, read one role at a time, the way a sharing
 * dialog reads: the roles down the side (vertical Tabs: arrow keys move and
 * select, the panel glides to its new height), and for the chosen role each
 * area of the workspace as a sentence with a "Can edit" picker. A changed
 * area says what it was and carries a dot, in the success ink for a gain or
 * the danger ink for a loss; a role with changes shows how many. The owner's
 * pickers are locked. Reduced motion: the panel swaps at once. */
function RoleView({ roles, resources, value, saved, onValueChange, copy }: RoleViewProps) {
  const changesIn = (role: string) => resources.filter((r) => level(value, role, r.id) !== level(saved, role, r.id)).length
  // Opens on the first role with changes waiting, else the first that can change.
  const [roleId, setRoleId] = useState(() => (roles.find((r) => changesIn(r.id) > 0) ?? roles.find((r) => !r.locked) ?? roles[0])?.id)
  const items = LEVELS.map((l) => ({ value: l, label: copy.abilities[l] }))
  const set = (role: string, area: string, next: PermissionLevel) => onValueChange({ ...value, [role]: { ...value[role], [area]: next } })

  return (
    <Tabs orientation="vertical" value={roleId} onValueChange={(next) => setRoleId(next as string)} className="items-stretch gap-0 max-sm:flex-col">
      <TabsList
        variant="pill"
        aria-label={copy.roleList}
        // shape: the list is the screen's side pane, edge to edge and divided off by a hairline, not a floating track
        className="w-full flex-1 shrink-0 rounded-none border-line max-sm:border-b sm:w-56 sm:border-e sm:p-2"
      >
        {roles.map((role) => {
          const count = changesIn(role.id)
          return (
            <TabsTrigger
              key={role.id}
              value={role.id}
              className="h-auto w-full gap-3 py-2 font-sans tracking-normal normal-case text-fg-muted"
            >
              <span className="min-w-0 flex-1 text-start">
                <span className="flex items-center gap-1.5 truncate text-ui text-fg">
                  {role.name}
                  {role.locked && <LockIcon size={12} trigger="none" className="shrink-0 text-fg-subtle" />}
                </span>
                {role.detail && <span className="block truncate text-ui-sm font-normal text-fg-muted">{role.detail}</span>}
              </span>
              {count > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent-subtle px-1.5 text-ui-xs text-accent-text tabular-nums">
                  {count}
                  <span className="sr-only">{copy.pending(count)}</span>
                </span>
              )}
            </TabsTrigger>
          )
        })}
      </TabsList>

      {roles.map((role) => (
        <TabsContent key={role.id} value={role.id} className="w-full self-stretch px-[var(--card-spacing)] py-4">
          <header className="flex flex-col gap-0.5 pb-3">
            <h3 className="text-ui-lg font-medium text-fg">{role.name}</h3>
            {(role.locked || role.description) && (
              <p className="flex items-center gap-1.5 text-ui-sm text-fg-muted">
                {role.locked && <LockIcon size={12} trigger="none" className="shrink-0" />}
                {role.locked ? copy.locked : role.description}
              </p>
            )}
          </header>
          <ul className="flex flex-col divide-y divide-line-subtle">
            {resources.map((area) => {
              const now = level(value, role.id, area.id)
              const was = level(saved, role.id, area.id)
              const changed = now !== was
              const Icon = area.icon
              return (
                <li key={area.id} data-yj-change={changed ? (RANK[now] > RANK[was] ? 'gain' : 'loss') : undefined} className="flex items-center gap-3 py-2.5">
                  {Icon && (
                    <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-well text-fg-muted">
                      <Icon size={15} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-ui text-fg">
                      {area.name}
                      {changed && <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', RANK[now] > RANK[was] ? 'bg-success' : 'bg-danger')} />}
                    </p>
                    <p className="truncate text-ui-sm text-fg-muted">{changed ? copy.was(copy.abilities[was]) : area.description}</p>
                  </div>
                  <Select items={items} value={now} disabled={role.locked} onValueChange={(next) => next && set(role.id, area.id, next as PermissionLevel)}>
                    <SelectTrigger size="sm" aria-label={copy.areaAccess(area.name, role.name)} variant="ghost" className="w-34 shrink-0 shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end" className="min-w-64">
                      {LEVELS.map((l) => (
                        <SelectItem key={l} value={l} className="py-1.5">
                          <span className="flex min-w-0 flex-col">
                            {copy.abilities[l]}
                            <span className="truncate text-ui-sm text-fg-muted">{copy.abilityHints[l]}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </li>
              )
            })}
          </ul>
        </TabsContent>
      ))}
    </Tabs>
  )
}

export { RoleView }
