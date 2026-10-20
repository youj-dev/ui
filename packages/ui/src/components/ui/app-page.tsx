import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../../lib/utils'

/* A page inside an app's frame: its header and its sections on one gutter,
 * so every page of the app starts at the same place and reads the same.
 * - It takes the page's layout density (an app's is compact) and is a
 *   container (@container), so what's inside lays out by the page's width,
 *   not the window's. A container's queries reach only what's inside it, so
 *   the gutter (16px, 24px from a 48rem page, 32px from 72rem) sits on the
 *   body within.
 * - `width`: `page` stops the body at the page width (80rem of content,
 *   1280px at 100% scale) and centers it, so a wide screen gets margins
 *   rather than stretched cards; at 1440 and below nothing changes. `fill`
 *   takes the whole width: a dashboard, a table, a board, a canvas.
 *   `readable` stops at 64rem and centers, for a page that is one form
 *   (settings), whose lines get hard to follow when they stretch; pages of
 *   tables, cards and lists fill.
 * - The header sets the title, a line under it and the actions at the end.
 *   Under a top bar that already names the page, the title folds to screen
 *   readers and the header centers what's left (AppFrame). */

const WIDTH = {
  page: 'own:mx-auto max-w-[calc(var(--container-7xl)+--spacing(16))]',
  fill: '',
  readable: 'own:mx-auto max-w-[calc(var(--container-5xl)+--spacing(16))]',
}

interface AppPageProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** The page's heading. */
  title?: ReactNode
  /** A line under the title. */
  description?: ReactNode
  /** The header's buttons, at its end: a primary action, a range control, a menu. */
  actions?: ReactNode
  /** The title's heading level; your sections' titles sit one below it. Default 1. */
  headingLevel?: 1 | 2 | 3
  /** How wide the body runs: `page` (1280px at 100% scale, centered), `fill` (all of it) or `readable` (1024px, centered, for a page that is one form). Default `page`. */
  width?: 'page' | 'fill' | 'readable'
  /** Extra classes for the header and for the body (the padded column that holds the header and your sections). */
  classNames?: Partial<Record<'header' | 'body', string>>
  /** The page's sections, stacked on the page's gutter. */
  children?: ReactNode
}

function AppPage({ title, description, actions, headingLevel = 1, width = 'page', className, classNames, children, ...rest }: AppPageProps) {
  const Title = `h${headingLevel}` as const
  const header = title != null || description != null || actions != null
  return (
    <div data-slot="app-page" {...rest} className={cn('@container own:flex min-w-0 flex-col', className)}>
      <div data-slot="app-page-body" className={cn('own:flex w-full min-w-0 flex-col gap-4 p-4 @3xl:gap-5 @3xl:p-6 @6xl:p-8', WIDTH[width], classNames?.body)}>
        {header && (
          <header data-slot="app-page-header" className={cn('own:flex flex-wrap items-end justify-between gap-x-4 gap-y-3', classNames?.header)}>
            <div className="own:flex min-w-0 flex-col gap-1">
              {title != null && (
                <Title data-slot="app-page-title" className="own:text-2xl own:font-semibold own:tracking-tight own:text-fg">
                  {title}
                </Title>
              )}
              {description != null && (
                <p data-slot="app-page-description" className="own:text-ui own:text-fg-muted">
                  {description}
                </p>
              )}
            </div>
            {actions != null && (
              <div data-slot="app-page-actions" className="own:flex min-w-0 flex-wrap items-center gap-2">
                {actions}
              </div>
            )}
          </header>
        )}
        {children}
      </div>
    </div>
  )
}

export { AppPage }
export type { AppPageProps }
