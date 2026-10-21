import type { ReactNode } from 'react'
import { GlobeIcon, GitBranchIcon, RocketIcon, SettingsIcon, ArrowUpRightIcon } from '@youj/icons'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Button } from '../../../components/ui/button'
import { buttonVariants } from '../../../components/ui/button.variants'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip'
import { safeHref } from '../../../lib/safe-href'
import { cn, initials } from '../../../lib/utils'
import type { PreviewListCopy, PreviewListItem, PreviewListLook, PreviewListStatus } from './data'
import { PreviewThumb } from './thumb'

/* One project: its picture, then four quiet lines (name and status, domains,
 * who made it and when, the latest commit), and its actions at the end: one
 * primary button and three icon buttons with tooltips. */

export type PreviewListView = 'details' | 'activity' | 'settings'

const DOT: Record<PreviewListStatus['tone'], string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  neutral: 'bg-fg-subtle',
  accent: 'bg-accent',
  info: 'bg-info',
}

interface RowProps {
  /** The project's name heading, one level under the block's title. */
  Heading: 'h2' | 'h3'
  project: PreviewListItem
  copy: PreviewListCopy
  statuses: PreviewListStatus[]
  looks: PreviewListLook[]
  locationIcon?: ReactNode
  latestIcon?: ReactNode
  /** Relative-time text for a date-time. */
  ago: (iso: string) => string
  onOpen: (project: PreviewListItem, view: PreviewListView) => void
}

function IconAction({ label, children, ...rest }: { label: string; children: React.ReactNode } & React.ComponentProps<typeof Button>) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label={label} {...rest} />}>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function PreviewRow({ Heading, project, copy, statuses, looks, locationIcon, latestIcon, ago, onOpen }: RowProps) {
  const { name, status, locations, createdBy, latest } = project
  const state = statuses.find((s) => s.id === status)
  const link = project.href === undefined ? (locations[0] ? `https://${locations[0]}` : null) : project.href
  const site = link ? safeHref(link) : null
  const shown = locations.slice(0, 2)
  return (
    <li
      data-slot="preview-row"
      data-status={status}
      className="grid grid-cols-[--spacing(28)_minmax(0,1fr)] items-start gap-x-4 gap-y-3 py-4 @2xl:grid-cols-[--spacing(44)_minmax(0,1fr)_auto]"
    >
      <div className="aspect-[176/104] w-full overflow-hidden rounded-lg">{project.thumbnail ?? <PreviewThumb look={project.look} looks={looks} tone={project.tone} />}</div>

      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex min-w-0 items-center gap-3">
          <Heading className="truncate text-ui-lg leading-6 font-medium tracking-tight text-fg">{name}</Heading>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-ui text-fg-muted">
            <span aria-hidden className={cn('size-2 rounded-full', DOT[state?.tone ?? 'neutral'])} />
            {state?.label ?? status}
          </span>
        </div>
        <p className="flex min-w-0 items-center gap-1.5 text-ui text-fg-muted">
          {locationIcon ?? <GlobeIcon aria-hidden size={16} className="shrink-0" />}
          <span className="truncate">{shown.join(' · ')}</span>
          {locations.length > shown.length && <span className="shrink-0 tabular-nums">{copy.more(locations.length - shown.length)}</span>}
        </p>
        <p className="flex min-w-0 items-center gap-2 text-ui text-fg-muted">
          <Avatar size="sm" className="size-5">
            {createdBy.image && <AvatarImage src={createdBy.image} alt="" />}
            <AvatarFallback aria-hidden className="own:text-ui-xs">
              {initials(createdBy.name)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{copy.createdBy(createdBy.name, ago(project.createdAt))}</span>
        </p>
        <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-ui text-fg-muted @lg:flex-nowrap">
          {latestIcon ?? <GitBranchIcon aria-hidden size={16} className="shrink-0" />}
          <span className="max-w-32 shrink-0 truncate text-fg">
            {latest.label}
          </span>
          <span className="shrink-0 font-mono text-ui-sm tabular-nums">
            {latest.ref}
          </span>
          <span className="min-w-0 truncate">
            {latest.message}
          </span>
          <span className="shrink-0 tabular-nums">
            {ago(latest.at)}
          </span>
        </p>
      </div>

      <div className="col-span-2 flex items-center gap-1 @2xl:col-span-1">
        <Button variant="secondary" onClick={() => onOpen(project, 'details')} className="me-1">
          {copy.details}
        </Button>
        {site ? (
          <Tooltip>
            <TooltipTrigger render={<a href={site} target="_blank" rel="noreferrer" aria-label={copy.visit(name)} className={buttonVariants({ variant: 'ghost', size: 'icon' })} />}>
              <ArrowUpRightIcon size={16} className="rtl:-scale-x-100" />
            </TooltipTrigger>
            <TooltipContent>{copy.visit(name)}</TooltipContent>
          </Tooltip>
        ) : null}
        <IconAction label={copy.activity(name)} onClick={() => onOpen(project, 'activity')}>
          <RocketIcon size={16} />
        </IconAction>
        <IconAction label={copy.settings(name)} onClick={() => onOpen(project, 'settings')}>
          <SettingsIcon size={16} />
        </IconAction>
      </div>
    </li>
  )
}

export { PreviewRow }
