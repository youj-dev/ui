'use client'

import { type ComponentProps, useId, useState } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { MoreHorizontalIcon } from '@youj/icons'
import { Badge, BadgeDot } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { diffPermissions, LevelMatrix, type PermissionLevel, type PermissionValue } from '../../components/ui/level-matrix'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Eyebrow } from '../../components/ui/typography'
import { cn } from '../../lib/utils'
import { DEFAULT_COPY, DRAFT, RESOURCES, ROLES, SAVED, demo, type PermissionMatrixCopy, type PermissionMatrixResource, type PermissionMatrixRole } from './permission-matrix/data'
import { ReviewDialog } from './permission-matrix/review-dialog'
import { RoleView } from './permission-matrix/role-view'

/* Who can do what, in a workspace, a school, a clinic: two ways over one draft. The roles view
 * (the default) reads it one role at a time, like a sharing dialog: the roles
 * down the side, and for the chosen one each area of the workspace with a
 * "Can view / Can edit" picker (permission-matrix/role-view). The grid view shows
 * it all at once: roles down the side, resources
 * across, and in each cell an access level drawn as three lit segments
 * (LevelMatrix). Click a cell or press Space on it to step its level;
 * tick a row, a column or the corner to change many at once from the bar
 * that opens. Changes wait in the grid, a gain lit in success and a loss left
 * as a hollow danger outline, and the footer counts them as soft pills,
 * added and removed. Review lists them as a diff in a dialog; Apply saves
 * them (Button onAction; swap the demo `wait` with `onApply`). The owner role
 * is locked. It is built for the compact layout density (ui.css), taken from the page;
 * embedded, it keeps its natural width unless `fill`. Reduced motion: levels
 * change in place. */

type PermissionMatrixView = 'roles' | 'grid'

interface PermissionMatrixProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (832px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<PermissionMatrixCopy>
  roles?: PermissionMatrixRole[]
  resources?: PermissionMatrixResource[]
  /** The view shown: one role at a time (`roles`) or the whole grid (`grid`). Controlled; pair with `onViewChange`. */
  view?: PermissionMatrixView
  /** The view it opens on, uncontrolled. Default `roles`. */
  defaultView?: PermissionMatrixView
  /** Called when someone switches the view in the header. */
  onViewChange?: (view: PermissionMatrixView) => void
  /** The levels as saved. Default: a demo workspace. */
  saved?: PermissionValue
  /** The draft it opens on. Default: the demo's four pending changes. */
  draft?: PermissionValue
  /** Saves the draft; resolve when it's live. Default: a short demo wait. */
  onApply?: (value: PermissionValue) => Promise<unknown> | unknown
  /** Formats its numbers and dates (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
}

/** The theme's label voice (mono capitals in Bezel) for Classic; Bezel sets its own. */
const VOICE = 'font-(family-name:--yj-label-font) tracking-(--yj-label-tracking) [text-transform:var(--yj-label-case)]'
const RANK: Record<PermissionLevel, number> = { none: 0, read: 1, write: 2, admin: 3 }

function PermissionMatrix({ theme, embedded = true, fill = false, copy: copyProp, roles = ROLES, resources = RESOURCES, view: viewProp, defaultView = 'roles', onViewChange, saved: initialSaved = SAVED, draft = DRAFT, onApply, locale, className, ...rest }: PermissionMatrixProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const [saved, setSaved] = useState(initialSaved)
  const [value, setValue] = useState(draft)
  const [ownView, setOwnView] = useState(defaultView)
  const shown = viewProp ?? ownView
  const changeView = (next: PermissionMatrixView) => {
    setOwnView(next)
    onViewChange?.(next)
  }
  const changes = diffPermissions(saved, value, roles, resources)
  const added = changes.filter((c) => RANK[c.to] > RANK[c.from]).length
  const removed = changes.length - added
  const names = copy.levels

  const apply = async () => {
    await (onApply ? onApply(value) : demo('PermissionMatrix: onApply', 900))
    setSaved(value)
  }

  const card = (
    <Card className={cn('w-full gap-0 overflow-hidden py-0 text-fg', !embedded && !fill && 'max-w-208')}>
      <CardHeader className="border-b border-line py-[calc(var(--card-spacing)-var(--spacing))]">
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>
          {copy.scope} · {copy.roles(roles.length)}
        </CardDescription>
        <CardAction className="flex items-center gap-2">
          <SegmentedControl variant="pill" size="sm" aria-label={copy.view} value={shown} onValueChange={(next) => next && changeView(next as PermissionMatrixView)}>
            {(['roles', 'grid'] as const).map((v) => (
              <SegmentedControlItem key={v} value={v}>
                {copy.views[v]}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={copy.more} />}>
              <MoreHorizontalIcon size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>{copy.exportCsv}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard?.writeText(JSON.stringify(value, null, 2))}>{copy.copyJson}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      {/* Both views take the roles view's height at 100%: switching never resizes the card. */}
      <div className="flex h-106 flex-col overflow-y-auto yj-scrollbar">
        {shown === 'roles' ? (
          <CardContent className="px-0 py-0">
            <RoleView roles={roles} resources={resources} value={value} saved={saved} onValueChange={setValue} copy={copy} />
          </CardContent>
        ) : (
          <>
        <CardContent className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-[calc(var(--card-spacing)-var(--spacing))]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Eyebrow className={VOICE}>{copy.access}</Eyebrow>
            {/* The legend: each level as the cells draw it. */}
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-ui-sm text-fg-muted">
              {(['read', 'write', 'admin'] as const).map((level) => (
                <li key={level} className="flex items-center gap-1.5">
                  <span aria-hidden className="flex gap-[3px]">
                    {[1, 2, 3].map((i) => (
                      <span key={i} className={cn('size-2 rounded-[2px]', i <= RANK[level] ? 'bg-fg' : 'bg-well')} />
                    ))}
                  </span>
                  {names[level]}
                </li>
              ))}
            </ul>
          </div>
          <Eyebrow className={cn('tabular-nums', VOICE)}>{copy.shape(roles.length, resources.length)}</Eyebrow>
        </CardContent>

        <CardContent className="flex-1 border-t border-line px-0 py-0">
          <LevelMatrix label={copy.grid} roles={roles} resources={resources} value={value} baseline={saved} onValueChange={setValue} />
        </CardContent>
          </>
        )}
      </div>

      <CardFooter className={cn('flex-wrap justify-between gap-3 py-[calc(var(--card-spacing)-var(--spacing))]', shown === 'roles' && 'border-t border-line')}>
        <div aria-live="polite" className={cn('text-ui-sm tabular-nums', changes.length ? 'text-fg' : 'text-fg-muted')}>
          {changes.length ? copy.pending(changes.length) : copy.upToDate}
        </div>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          {added > 0 && (
            <Badge variant="success" className="tabular-nums">
              <BadgeDot />
              {copy.added(added)}
            </Badge>
          )}
          {removed > 0 && (
            <Badge variant="danger" className="tabular-nums">
              <BadgeDot />
              {copy.removed(removed)}
            </Badge>
          )}
          <ReviewDialog changes={changes} names={names} copy={copy} onDiscard={() => setValue(saved)} onApply={apply} />
          <AsyncButton disabled={!changes.length} pendingLabel={copy.applying} successLabel={copy.applied} onAction={apply}>
            {copy.apply}
          </AsyncButton>
        </div>
      </CardFooter>
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-208', className)}>
      {card}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { PermissionMatrix, type PermissionMatrixProps, type PermissionMatrixView, type PermissionMatrixCopy, type PermissionMatrixRole, type PermissionMatrixResource }
