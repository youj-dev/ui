'use client'

import { useId, useMemo, useState, type ComponentProps, type ElementType } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { ChevronDownIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../../../components/ui/breadcrumb'
import { Button } from '../../../components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu'
import { Field, FieldContent, FieldDescription, FieldLabel } from '../../../components/ui/field'
import { Switch } from '../../../components/ui/switch'
import { cn, dateTimeFormat } from '../../../lib/utils'
import type { App } from './data'
import {
  DETAIL_APP,
  DETAIL_CONNECTION,
  DETAIL_COPY,
  DETAIL_PERMISSIONS,
  DETAIL_PREVIEW,
  type ConnectionStatus,
  type IntegrationConnection,
  type IntegrationDetailCopy,
  type IntegrationPermission,
  type IntegrationPreview,
} from './detail-data'
import { Monogram } from './monogram'

/* One connected integration, read as a page: where you are, who it is, a
 * sample of what it posts, the facts of the connection with a status menu
 * (pause, reconnect, disconnect) and a switch for each permission it holds.
 * A permission switches at once and is put back with the reason if
 * `onPermissionChange` rejects; a status change waits on `onStatusChange`
 * (default: a short demo wait). Swap the demo `app`, `connection`, `preview`
 * and `permissions` for your own. Sits in a page, as the integrations'
 * detail route; the grid above it is the Integrations block. */

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

const DOT: Record<ConnectionStatus, string> = { connected: 'bg-success', paused: 'bg-warning', disconnected: 'bg-fg-subtle' }

interface IntegrationDetailProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** A theme to force on the view. Default: none, so it inherits the app's. */
  theme?: ThemeInput
  /** The integration. Default: the demo's Parley. */
  app?: App
  /** Its connection. Default: the demo's, connected to Northwind. */
  connection?: IntegrationConnection
  /** A sample of what it posts. Default: a failed-deploy message. */
  preview?: IntegrationPreview
  /** What it may do, each with a switch. Default: the demo's three. */
  permissions?: IntegrationPermission[]
  /** Where the first crumb goes. Default "#". */
  backHref?: string
  /** The crumb's link element, for client-side routing. Default 'a'. */
  linkComponent?: ElementType
  /** Formats dates. Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The title's level. Default 2. */
  headingLevel?: 1 | 2 | 3
  /** Takes a permission away or gives it back; resolve when saved, throw to put the switch back and show why. */
  onPermissionChange?: (permission: IntegrationPermission, on: boolean) => Promise<unknown> | unknown
  /** Pauses, resumes, reconnects or disconnects; resolve when done, throw to keep the old status and show why. Default: a short demo wait. */
  onStatusChange?: (status: ConnectionStatus) => Promise<unknown> | unknown
  /** Any of the view's strings, to rewrite or translate. */
  copy?: Partial<IntegrationDetailCopy>
}

function IntegrationDetail({
  theme,
  app = DETAIL_APP,
  connection = DETAIL_CONNECTION,
  preview = DETAIL_PREVIEW,
  permissions = DETAIL_PERMISSIONS,
  backHref = '#',
  linkComponent: Link = 'a',
  locale: localeProp,
  headingLevel = 2,
  onPermissionChange,
  onStatusChange,
  copy: copyProp,
  className,
  ...rest
}: IntegrationDetailProps) {
  const copy = { ...DETAIL_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = `h${headingLevel}` as const
  const date = useMemo(() => dateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format, [locale])
  const [status, setStatus] = useState(connection.status)
  const [busy, setBusy] = useState(false)
  const [on, setOn] = useState(() => Object.fromEntries(permissions.map((p) => [p.id, p.on])))
  const [failure, setFailure] = useState<string>()
  const reason = (failed: unknown) => (failed instanceof Error && failed.message ? failed.message : copy.failed)

  const change = async (next: ConnectionStatus) => {
    setFailure(undefined)
    setBusy(true)
    try {
      await (onStatusChange ? onStatusChange(next) : demo('IntegrationDetail: onStatusChange', 600))
      setStatus(next)
    } catch (failed) {
      setFailure(reason(failed))
    } finally {
      setBusy(false)
    }
  }
  const toggle = async (permission: IntegrationPermission, next: boolean) => {
    setFailure(undefined)
    setOn((was) => ({ ...was, [permission.id]: next }))
    try {
      await onPermissionChange?.(permission, next)
    } catch (failed) {
      setOn((was) => ({ ...was, [permission.id]: !next }))
      setFailure(reason(failed))
    }
  }

  const label = copy.statuses[status]
  const row = 'flex min-h-11 items-center justify-between gap-4 py-2 text-ui'
  const sectionHeading = 'pb-2 text-ui font-medium text-fg'
  const view = (
    <section {...rest} aria-labelledby={titleId} className={cn('mx-auto flex w-full max-w-2xl min-w-0 flex-col gap-8 text-fg', className)}>
      <Breadcrumb aria-label={copy.breadcrumbs}>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={backHref} />}>{copy.back}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{app.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex items-center gap-4">
        <Monogram app={app} size="lg" />
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Title id={titleId} className="text-2xl font-semibold tracking-tight">
              {app.name}
            </Title>
            {app.verified && <Badge variant="outline">{copy.verified}</Badge>}
          </div>
          <p className="text-ui text-fg-muted">
            {copy.by(app.vendor)} · {app.blurb}
          </p>
        </div>
      </header>

      <section aria-label={copy.previewTitle}>
        <figure aria-label={copy.previewLabel(preview.from)} className="flex justify-center rounded-xl bg-band p-5">
          <div className="flex w-full max-w-md gap-3 rounded-lg bg-surface p-4 shadow-xs">
            <Monogram app={app} />
            <div className="flex min-w-0 flex-col gap-1">
              <figcaption className="text-ui font-semibold">{preview.from}</figcaption>
              <p className="text-ui font-medium">{preview.title}</p>
              <p className="text-ui text-fg-muted">{preview.body}</p>
              {preview.action && <span className="mt-1 text-ui-sm font-medium text-accent-text">{preview.action}</span>}
            </div>
          </div>
        </figure>
      </section>

      <section aria-labelledby={`${titleId}-details`} className="flex flex-col gap-1">
        <h3 id={`${titleId}-details`} className={sectionHeading}>
          {copy.detailsTitle}
        </h3>
        <dl className="divide-y divide-line-subtle">
          <div className={row}>
            <dt className="text-fg-muted">{copy.status}</dt>
            <dd>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="secondary" size="sm" disabled={busy} aria-label={copy.statusMenu(label)} />}>
                  <span aria-hidden className={cn('size-1.5 rounded-full', DOT[status])} />
                  {label}
                  <ChevronDownIcon size={14} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {status === 'disconnected' ? (
                    <DropdownMenuItem onClick={() => change('connected')}>{copy.reconnect}</DropdownMenuItem>
                  ) : (
                    <>
                      <DropdownMenuItem onClick={() => change(status === 'paused' ? 'connected' : 'paused')}>{status === 'paused' ? copy.resume : copy.pause}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => change('connected')}>{copy.reconnect}</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="danger" onClick={() => change('disconnected')}>
                        {copy.disconnect}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </dd>
          </div>
          <div className={row}>
            <dt className="text-fg-muted">{copy.workspace}</dt>
            <dd>{connection.workspace}</dd>
          </div>
          <div className={row}>
            <dt className="text-fg-muted">{copy.connected}</dt>
            <dd>{date(connection.connectedAt)}</dd>
          </div>
          <div className={row}>
            <dt className="text-fg-muted">{copy.lastUsed}</dt>
            <dd>{connection.lastUsed === null ? copy.never : date(connection.lastUsed)}</dd>
          </div>
        </dl>
        <p aria-live="polite" className="sr-only">
          {label}
        </p>
      </section>

      <section aria-labelledby={`${titleId}-permissions`} className="flex flex-col gap-1">
        <h3 id={`${titleId}-permissions`} className={sectionHeading}>
          {copy.permissionsTitle}
        </h3>
        <p className="py-1 text-ui-sm text-fg-muted">{copy.permissionsDescription}</p>
        <div className="flex flex-col divide-y divide-line-subtle">
          {permissions.map((p) => (
            <Field key={p.id} orientation="horizontal" className="items-center py-3">
              <FieldContent>
                <FieldLabel>{p.label}</FieldLabel>
                <FieldDescription>{p.description}</FieldDescription>
              </FieldContent>
              <Switch checked={!!on[p.id]} disabled={status === 'disconnected'} onCheckedChange={(next) => toggle(p, next)} />
            </Field>
          ))}
        </div>
      </section>

      {failure && (
        <p role="alert" className="text-ui-sm text-danger-text">
          {failure}
        </p>
      )}
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { IntegrationDetail, type IntegrationDetailProps }
