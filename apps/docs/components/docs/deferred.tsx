'use client'

import { deferHydration } from '@/components/ui/defer-hydration'

/* A docs page's chrome that can answer a moment after the page arrives. The
 * server draws each in full; its code (the menus and popovers it opens, the
 * rail's scroll tracking) comes in once the page is idle, or as soon as it's
 * pointed at or focused. */

/** Copy page and its menu. */
export const PageActions = deferHydration(() => import('@/components/docs/page-actions').then((m) => m.PageActions), { idle: true, intent: true })

/** The "On this page" popover, in the page's header below the rail's breakpoint. */
export const TocPopover = deferHydration(() => import('@/components/docs/toc').then((m) => m.TocPopover), { idle: true, intent: true })

/** The rail beside the column, shown from `toc:` (86rem) only: a phone never loads it. */
export const DocsToc = deferHydration(() => import('@/components/docs/toc').then((m) => m.DocsToc), { idle: true, intent: true, media: '(min-width: 86rem)' })

