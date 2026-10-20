'use client'

import { useId, type ComponentProps, type ReactNode } from 'react'
import { PresenceItem, PresenceList } from '@youj/motion'
import { cn } from '../../lib/utils'

/* Things to act on, one per row: a tile with the row's icon in its tone, a
 * title and one line of detail, an optional chip with the date, amount or
 * state that makes it urgent, and the row's own action at the end. A header
 * names the list, counts what is in it and holds a "view all" link. One row
 * can stand out (`emphasis`) as the thing to do first.
 * - Layout: on a wide list the chip and the action sit at the row's end; below
 *   20rem of the list's own width they wrap under the text, so nothing
 *   truncates the action.
 * - Motion: rows are a PresenceList, so a row the app removes (it was done)
 *   fades out and the rest close the gap on the smooth spring; a new row
 *   drops in. Reduced motion: rows come and go at once.
 * - Semantics: a `section` named by its title, holding a list; the tile is
 *   decorative, and the chip is text. */

type ActionListTone = 'neutral' | 'accent' | 'info' | 'success' | 'warning' | 'danger'

const TILE: Record<ActionListTone, string> = {
  neutral: 'own:bg-band own:text-fg-muted',
  accent: 'own:bg-accent-subtle own:text-accent-text',
  info: 'own:bg-info-subtle own:text-info-text',
  success: 'own:bg-success-subtle own:text-success-text',
  warning: 'own:bg-warning-subtle own:text-warning-text',
  danger: 'own:bg-danger-subtle own:text-danger-text',
}

const EMPHASIS: Record<ActionListTone, string> = {
  neutral: 'own:bg-band',
  accent: 'own:bg-accent-subtle own:ring-accent-line',
  info: 'own:bg-info-subtle own:ring-info-line',
  success: 'own:bg-success-subtle own:ring-success-line',
  warning: 'own:bg-warning-subtle own:ring-warning-line',
  danger: 'own:bg-danger-subtle own:ring-danger-line',
}

type Heading = 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

interface ActionListProps extends Omit<ComponentProps<'section'>, 'title'> {
  /** What the list is: "Waiting on you". Names the section. */
  title?: ReactNode
  /** A muted line under the title: where the rows came from, how they're sorted. */
  description?: ReactNode
  /** How many there are, in a chip beside the title. It can be more than the rows shown. */
  count?: number
  /** At the end of the header: a "View all" link or button. */
  action?: ReactNode
  /** The title's heading level. Default 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6
  /** ActionListItems, each keyed by a stable id. */
  children?: ReactNode
}

function ActionList({ title, description, count, action, headingLevel = 3, className, children, ...props }: ActionListProps) {
  const titleId = useId()
  const H = `h${headingLevel}` as Heading
  const header = title != null || action != null
  return (
    <section
      data-slot="action-list"
      aria-labelledby={title != null ? titleId : undefined}
      className={cn('@container own:flex min-w-0 flex-col own:gap-3', className)}
      {...props}
    >
      {header && (
        <header data-slot="action-list-header" className="own:flex min-w-0 items-start justify-between own:gap-3">
          <div className="own:flex min-w-0 flex-col own:gap-0.5">
            {title != null && (
              <div className="own:flex min-w-0 items-center own:gap-2">
                <H id={titleId} data-slot="action-list-title" className="truncate own:text-ui-lg own:font-semibold own:text-fg">
                  {title}
                </H>
                {count !== undefined && (
                  <span
                    data-slot="action-list-count"
                    className="own:inline-flex own:h-5 min-w-5 shrink-0 items-center justify-center own:rounded-full own:bg-band own:px-1.5 own:text-ui-sm own:font-medium own:text-fg-muted own:tabular-nums"
                  >
                    {count}
                  </span>
                )}
              </div>
            )}
            {description != null && (
              <p data-slot="action-list-description" className="own:text-ui-sm own:text-fg-muted">
                {description}
              </p>
            )}
          </div>
          {action != null && (
            <div data-slot="action-list-action" className="own:flex shrink-0 items-center own:gap-2">
              {action}
            </div>
          )}
        </header>
      )}
      <PresenceList data-slot="action-list-items" className="own:flex min-w-0 flex-col">
        {children}
      </PresenceList>
    </section>
  )
}

interface ActionListItemProps extends Omit<ComponentProps<'li'>, 'title' | 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  /** The row's icon, drawn in a tile in the row's tone. */
  icon?: ReactNode
  /** The tile's (and, with `emphasis`, the row's) tone. Default `neutral`. */
  tone?: ActionListTone
  /** What to act on: "Contract renews in 12 days". */
  title: ReactNode
  /** One line of why: who, how much, by when. */
  detail?: ReactNode
  /** A chip before the action: the date, amount or state that makes it urgent. Text, optionally led by a small icon. */
  meta?: ReactNode
  /** The chip's tone. Default: the row's. */
  metaTone?: ActionListTone
  /** At the row's end: the row's own action, usually a small Button. */
  action?: ReactNode
  /** Sets this row apart as the one to do first: a tinted panel in its tone. */
  emphasis?: boolean
}

function ActionListItem({ icon, tone = 'neutral', title, detail, meta, metaTone, action, emphasis = false, className, ...props }: ActionListItemProps) {
  const chip = metaTone ?? tone
  return (
    <PresenceItem
      data-slot="action-list-item"
      data-tone={tone}
      data-variant={emphasis ? 'emphasis' : 'default'}
      className={cn(
        'own:flex min-w-0 flex-wrap items-center own:gap-x-3 own:gap-y-2 own:py-3',
        // Hairlines between plain rows; an emphasised row is a panel and draws none.
        emphasis
          ? cn('own:my-1 own:rounded-lg own:px-3 own:ring-1 own:ring-transparent', EMPHASIS[tone])
          : 'own:border-t own:border-line first:border-t-0 [[data-variant=emphasis]+&]:border-t-0',
        className,
      )}
      {...(props as object)}
    >
      <div className="own:flex min-w-0 flex-1 basis-56 items-start own:gap-3">
        {icon != null && (
          <span
            aria-hidden
            data-slot="action-list-icon"
            className={cn(
              'own:flex size-9 shrink-0 items-center justify-center own:rounded-lg [&_svg]:size-4',
              emphasis && tone !== 'neutral' ? 'own:bg-surface own:text-fg' : TILE[tone],
            )}
          >
            {icon}
          </span>
        )}
        <div className="own:flex min-w-0 flex-col own:gap-0.5 self-center">
          <span data-slot="action-list-item-title" className="own:text-ui own:font-medium own:text-fg">
            {title}
          </span>
          {detail != null && (
            <span data-slot="action-list-item-detail" className="truncate own:text-ui-sm own:text-fg-muted">
              {detail}
            </span>
          )}
        </div>
      </div>
      {(meta != null || action != null) && (
        <div className={cn('own:flex shrink-0 items-center own:gap-2 ms-auto @max-xs:w-full @max-xs:justify-between', icon != null && '@max-xs:ps-12')}>
          {meta != null && (
            <span
              data-slot="action-list-meta"
              data-tone={chip}
              className={cn('own:inline-flex own:h-6 shrink-0 items-center own:gap-1 own:rounded-full own:px-2 own:text-ui-sm own:font-medium whitespace-nowrap own:tabular-nums [&_svg]:size-3.5', TILE[chip])}
            >
              {meta}
            </span>
          )}
          {action != null && (
            <div data-slot="action-list-item-action" className="own:flex shrink-0 items-center own:gap-2 own:@max-xs:ms-auto">
              {action}
            </div>
          )}
        </div>
      )}
    </PresenceItem>
  )
}

export { ActionList, ActionListItem, type ActionListItemProps, type ActionListProps, type ActionListTone }
