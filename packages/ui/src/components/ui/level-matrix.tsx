'use client'

import { useId, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent } from 'react'
import { Collapse } from '@youj/motion'
import { LockIcon } from '@youj/icons'
import { levelMatrixLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { Button } from './button'
import { Checkbox } from './checkbox'

/* Who can do what: roles down the side, resources across the top, and in
 * every cell an access level (none, read, write, admin) drawn as three
 * segments lit to the level, so a column or a row reads at a glance.
 * - Pending changes show in the cell itself until they're applied: segments
 *   gained light in the success tone, segments lost stay as a hollow danger
 *   outline, and the level's word takes the same ink. `diffPermissions`
 *   lists them for a summary.
 * - Bulk: a row header's box selects the role's cells, a column header's box
 *   the resource for every role, the corner box everything; the bar that
 *   opens sets every selected cell to one level. Locked roles sit out.
 * - Keyboard: one tab stop, then the ARIA grid pattern: arrow keys move
 *   between cells (the header boxes included), Home and End to a row's ends,
 *   Ctrl+Home and Ctrl+End to the grid's; Space or Enter steps a cell up a
 *   level and Shift steps it down. Every change is announced.
 * - Motion: segments light one after another on the fast token; a bulk set
 *   runs as a wave across the grid. Reduced motion: levels change in place.
 * - Narrow screens scroll the grid sideways with the roles held in place. */

type PermissionLevel = 'none' | 'read' | 'write' | 'admin'
const LEVELS: PermissionLevel[] = ['none', 'read', 'write', 'admin']

interface PermissionRole {
  id: string
  name: string
  /** A second line under the name: "3 members". */
  detail?: string
  /** Its cells can't change (an owner role). */
  locked?: boolean
}

interface PermissionResource {
  id: string
  name: string
}

/** Levels by role id, then resource id. A missing cell is `none`. */
type PermissionValue = Record<string, Record<string, PermissionLevel>>

interface PermissionChange {
  role: PermissionRole
  resource: PermissionResource
  from: PermissionLevel
  to: PermissionLevel
}

interface LevelMatrixProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange' | 'children'> {
  roles: readonly PermissionRole[]
  resources: readonly PermissionResource[]
  value?: PermissionValue
  defaultValue?: PermissionValue
  onValueChange?: (value: PermissionValue) => void
  /** The saved levels: cells that differ from it show their pending gain or loss. Default: the value it opened with. */
  baseline?: PermissionValue
  /** Accessible name of the grid. Default: the labels' "Permissions". */
  label?: string
}

const rank = (level: PermissionLevel) => LEVELS.indexOf(level)
const levelOf = (value: PermissionValue | undefined, role: string, resource: string): PermissionLevel => value?.[role]?.[resource] ?? 'none'
const cellKey = (role: string, resource: string) => `${role}\u0000${resource}`

/** Every cell whose level differs between `baseline` and `value`, in grid order. */
function diffPermissions(baseline: PermissionValue, value: PermissionValue, roles: readonly PermissionRole[], resources: readonly PermissionResource[]): PermissionChange[] {
  return roles.flatMap((role) =>
    resources.flatMap((resource) => {
      const from = levelOf(baseline, role.id, resource.id)
      const to = levelOf(value, role.id, resource.id)
      return from === to ? [] : [{ role, resource, from, to }]
    }),
  )
}

function LevelMatrix({ roles, resources, value: valueProp, defaultValue = {}, onValueChange, baseline: baselineProp, label, className, ...props }: LevelMatrixProps) {
  const k = useYouj()
  const labels = useComponentLabels(levelMatrixLabels)
  const hintId = useId()
  const { announce, announcer } = useAnnouncer()
  const [value, setValue] = useControllableState(valueProp, defaultValue)
  const [opened] = useState(() => valueProp ?? defaultValue)
  const baseline = baselineProp ?? opened
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [focus, setFocus] = useState<[number, number]>([1, 1])
  // A bulk set runs as a wave; a single cell answers at once.
  const [wave, setWave] = useState(false)
  const gridRef = useRef<HTMLTableElement>(null)

  const names: Record<PermissionLevel, string> = {
    none: labels.permissionNone,
    read: labels.permissionRead,
    write: labels.permissionWrite,
    admin: labels.permissionAdmin,
  }
  const editable = useMemo(() => roles.filter((r) => !r.locked), [roles])
  const keysOf = (rs: readonly PermissionRole[], cs: readonly PermissionResource[]) => rs.filter((r) => !r.locked).flatMap((r) => cs.map((c) => cellKey(r.id, c.id)))
  const all = keysOf(editable, resources)

  const commit = (next: PermissionValue) => {
    setValue(next)
    onValueChange?.(next)
  }
  const withLevel = (base: PermissionValue, keys: readonly string[], level: PermissionLevel) => {
    const next: PermissionValue = { ...base }
    for (const key of keys) {
      const [role, resource] = key.split('\u0000') as [string, string]
      next[role] = { ...next[role], [resource]: level }
    }
    return next
  }

  const cycle = (role: PermissionRole, resource: PermissionResource, step: 1 | -1) => {
    if (role.locked) return
    const level = LEVELS[(rank(levelOf(value, role.id, resource.id)) + step + LEVELS.length) % LEVELS.length]!
    setWave(false)
    commit(withLevel(value, [cellKey(role.id, resource.id)], level))
    announce(labels.permissionChanged(role.name, resource.name, names[level]))
  }
  const setSelectedTo = (level: PermissionLevel) => {
    setWave(true)
    commit(withLevel(value, [...selected], level))
    announce(labels.permissionBulkSet(selected.size, names[level]))
  }
  const toggle = (keys: string[], on: boolean) =>
    setSelected((current) => {
      const next = new Set(current)
      for (const key of keys) {
        if (on) next.add(key)
        else next.delete(key)
      }
      return next
    })
  const boxState = (keys: string[]) => {
    const count = keys.filter((key) => selected.has(key)).length
    return { checked: count > 0 && count === keys.length, indeterminate: count > 0 && count < keys.length, disabled: keys.length === 0 }
  }

  // The grid's cells as [row, column]: row 0 and column 0 are the headers.
  const rows = roles.length
  const cols = resources.length
  const onKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    const cell = (event.target as HTMLElement).closest<HTMLElement>('[data-cell]')
    if (!cell) return
    const [r, c] = [Number(cell.dataset.row), Number(cell.dataset.col)]
    let next: [number, number] | null = null
    if (event.key === 'ArrowRight') next = [r, Math.min(cols, c + 1)]
    else if (event.key === 'ArrowLeft') next = [r, Math.max(0, c - 1)]
    else if (event.key === 'ArrowDown') next = [Math.min(rows, r + 1), c]
    else if (event.key === 'ArrowUp') next = [Math.max(0, r - 1), c]
    else if (event.key === 'Home') next = event.ctrlKey || event.metaKey ? [0, 0] : [r, 0]
    else if (event.key === 'End') next = event.ctrlKey || event.metaKey ? [rows, cols] : [r, cols]
    else if ((event.key === ' ' || event.key === 'Enter') && r > 0 && c > 0) {
      event.preventDefault()
      cycle(roles[r - 1]!, resources[c - 1]!, event.shiftKey ? -1 : 1)
      return
    } else return
    event.preventDefault()
    // In an RTL grid the arrows follow the reading direction.
    if (getComputedStyle(event.currentTarget).direction === 'rtl' && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
      next = [r, event.key === 'ArrowRight' ? Math.max(0, c - 1) : Math.min(cols, c + 1)]
    }
    setFocus(next)
    const target = gridRef.current?.querySelector<HTMLElement>(`[data-cell][data-row="${next[0]}"][data-col="${next[1]}"]`)
    const focusable = target?.matches('[tabindex]') ? target : target?.querySelector<HTMLElement>('[role=checkbox]')
    focusable?.focus()
  }
  const stop = (r: number, c: number) => (focus[0] === r && focus[1] === c ? 0 : -1)
  const inherit = 'own:bg-[inherit]'

  const box = (keys: string[], name: string, r: number, c: number) => {
    const state = boxState(keys)
    return (
      <Checkbox
        aria-label={name}
        tabIndex={stop(r, c)}
        checked={state.checked}
        indeterminate={state.indeterminate}
        disabled={state.disabled}
        onFocus={() => setFocus([r, c])}
        onCheckedChange={(on) => toggle(keys, Boolean(on))}
      />
    )
  }

  return (
    <div data-slot="level-matrix" data-reduced-motion={k.reduced || undefined} className={cn('own:flex own:min-w-0 flex-col', inherit, className)} {...props}>
      <Collapse open={selected.size > 0}>
        <div
          data-slot="level-matrix-bulk"
          role="toolbar"
          aria-label={labels.permissionSetSelected}
          className="own:flex flex-wrap items-center gap-2 border-b border-line own:px-5 own:py-2.5 own:sm:px-6"
        >
          <span className="own:me-auto own:font-mono own:text-ui-sm own:text-fg-muted own:tabular-nums">{labels.permissionSelected(selected.size)}</span>
          {LEVELS.map((level) => (
            <Button key={level} variant="secondary" size="xs" onClick={() => setSelectedTo(level)} className="gap-1.5">
              <Segments level={level} size="xs" />
              {names[level]}
            </Button>
          ))}
          <Button variant="ghost" size="xs" onClick={() => setSelected(new Set())}>
            {labels.clearSelection}
          </Button>
        </div>
      </Collapse>
      <div className={cn('overflow-x-auto yj-scrollbar', inherit)}>
        <table
          ref={gridRef}
          role="grid"
          aria-label={label ?? labels.permissions}
          aria-describedby={hintId}
          aria-multiselectable
          data-slot="level-matrix-grid"
          onKeyDown={onKeyDown}
          className={cn('own:w-full border-separate border-spacing-0 own:text-ui', inherit)}
        >
          <thead className={inherit}>
            <tr className={inherit}>
              <td data-cell data-row={0} data-col={0} className={cn('sticky start-0 z-10 border-b border-line py-2.5 ps-5 pe-3 sm:ps-6', inherit)}>
                {box(all, labels.permissionSelectAll, 0, 0)}
              </td>
              {resources.map((resource, c) => (
                <th
                  key={resource.id}
                  scope="col"
                  data-cell
                  data-row={0}
                  data-col={c + 1}
                  className="border-b border-line px-3 py-2.5 text-start own:font-normal last:pe-5 sm:last:pe-6"
                >
                  <span className="own:flex items-center gap-2">
                    {box(keysOf(roles, [resource]), labels.permissionSelectColumn(resource.name), 0, c + 1)}
                    <span
                      data-slot="level-matrix-resource"
                      className="truncate own:text-ui-sm whitespace-nowrap own:text-fg-muted own:font-(family-name:--yj-label-font) own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]"
                    >
                      {resource.name}
                    </span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={inherit}>
            {roles.map((role, r) => (
              <tr key={role.id} data-locked={role.locked || undefined} className={cn('group/row', inherit)}>
                <th scope="row" data-cell data-row={r + 1} data-col={0} className={cn('sticky start-0 z-10 border-b border-line py-2 ps-5 pe-3 text-start own:font-normal sm:ps-6', inherit)}>
                  <span className="own:flex items-center gap-3">
                    {role.locked ? (
                      <span role="img" aria-label={labels.permissionLocked} data-slot="level-matrix-lock" className="own:grid own:size-4.5 shrink-0 place-items-center own:text-fg-muted">
                        <LockIcon size={13} />
                      </span>
                    ) : (
                      box(keysOf([role], resources), labels.permissionSelectRow(role.name), r + 1, 0)
                    )}
                    <span className="own:flex min-w-0 flex-col">
                      <span data-slot="level-matrix-role" className="truncate own:text-ui own:text-fg">
                        {role.name}
                      </span>
                      {role.detail && <span className="truncate own:text-ui-sm own:text-fg-muted">{role.detail}</span>}
                    </span>
                  </span>
                </th>
                {resources.map((resource, c) => {
                  const level = levelOf(value, role.id, resource.id)
                  const was = levelOf(baseline, role.id, resource.id)
                  const key = cellKey(role.id, resource.id)
                  const on = selected.has(key)
                  const change = rank(level) > rank(was) ? 'gain' : rank(level) < rank(was) ? 'loss' : undefined
                  return (
                    <td
                      key={resource.id}
                      role="gridcell"
                      data-cell
                      data-row={r + 1}
                      data-col={c + 1}
                      data-slot="level-matrix-cell"
                      data-level={level}
                      data-change={change}
                      data-selected={on || undefined}
                      aria-selected={role.locked ? undefined : on}
                      aria-readonly={role.locked || undefined}
                      tabIndex={stop(r + 1, c + 1)}
                      onFocus={() => setFocus([r + 1, c + 1])}
                      onClick={(event) => {
                        setFocus([r + 1, c + 1])
                        cycle(role, resource, event.shiftKey ? -1 : 1)
                      }}
                      className={cn(
                        'relative cursor-pointer border-b border-line own:px-3 own:py-2 outline-none select-none own:last:pe-5 own:sm:last:pe-6',
                        'transition-[background-color] yj-duration-fast ease-standard own:hover:bg-hover',
                        'focus-visible:z-20 own:focus-visible:shadow-[inset_0_0_0_2px_var(--color-focus)]',
                        'own:data-selected:bg-[color-mix(in_oklab,var(--color-accent)_10%,transparent)] own:data-selected:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-accent)_45%,transparent)]',
                        role.locked && 'cursor-default opacity-60 own:hover:bg-transparent',
                      )}
                    >
                      <span className="own:flex items-center gap-2.5 whitespace-nowrap">
                        <Segments level={level} was={was} delay={wave && !k.reduced ? (r + c) * k.stagger('tight') : 0} />
                        <span className="own:flex flex-col">
                          <span
                            data-slot="level-matrix-level"
                            className={cn(
                              'own:font-mono own:text-ui-sm transition-colors yj-duration-fast ease-standard',
                              change === 'gain' ? 'own:text-success-text' : change === 'loss' ? 'own:text-danger-text' : level === 'none' ? 'own:text-fg-muted' : 'own:text-fg',
                            )}
                          >
                            {level === 'none' ? <span aria-hidden>—</span> : names[level]}
                            {level === 'none' && <span className="sr-only">{names.none}</span>}
                          </span>
                          {/* A pending change keeps the level it had in view, struck through, under the new one. */}
                          {change && (
                            <s aria-hidden data-slot="level-matrix-was" className="own:font-mono own:text-ui-xs own:leading-tight own:text-fg-muted decoration-line-strong">
                              {names[was]}
                            </s>
                          )}
                        </span>
                        {change && <span className="sr-only">{`, ${labels.permissionWas(names[was])}`}</span>}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p id={hintId} className="sr-only">
        {labels.permissionHint}
      </p>
      {announcer}
    </div>
  )
}

/** A level as three segments lit to it; against `was`, gains light in success and losses stay as a hollow danger outline. */
function Segments({ level, was = level, size = 'sm', delay = 0 }: { level: PermissionLevel; was?: PermissionLevel; size?: 'sm' | 'xs'; delay?: number }) {
  const k = useYouj()
  const [now, before] = [rank(level), rank(was)]
  return (
    <span aria-hidden data-slot="level-matrix-segments" className={cn('own:flex shrink-0', size === 'xs' ? 'gap-0.5' : 'gap-[3px]')}>
      {[1, 2, 3].map((i) => {
        const state = i <= Math.min(now, before) ? 'on' : i <= now ? 'gain' : i <= before ? 'loss' : 'off'
        return (
          <span
            key={i}
            data-slot="level-matrix-segment"
            data-state={state}
            className={cn(
              'own:rounded-[2px] transition-[background-color,box-shadow] yj-duration-fast ease-standard reduced:transition-none',
              size === 'xs' ? 'own:h-2 own:w-1.5' : 'own:h-2.5 own:w-2.5',
              state === 'on' && 'own:bg-fg',
              state === 'gain' && 'own:bg-success',
              state === 'loss' && 'own:bg-transparent own:shadow-[inset_0_0_0_1.5px_var(--color-danger)]',
              state === 'off' && 'own:bg-[color-mix(in_oklab,var(--color-canvas)_calc(100%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_10%,transparent))]',
            )}
            style={k.reduced ? undefined : { transitionDelay: `${delay + (i - 1) * k.stagger('tight')}s` }}
          />
        )
      })}
    </span>
  )
}

export { diffPermissions, LevelMatrix, type PermissionChange, type PermissionLevel, type LevelMatrixProps, type PermissionResource, type PermissionRole, type PermissionValue }
