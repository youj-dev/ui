import type { ReactNode } from 'react'
import type { ThemeInput } from '@youj/core'
import { AnalyticsExample } from './products/analytics/analytics'
import { MailExample } from './products/mail/mail'
import { TasksExample } from './products/tasks/tasks'
import type { HeroId } from './beats'

/* The products the film ends on: the three hero examples, exactly as the
 * docs ship them, each in the window the Security block becomes (chapter 5,
 * scenes/themes.tsx, which also works each one's moment). A product is laid
 * out at a laptop's viewport (PRODUCT in themes.tsx) and wears whichever
 * preset the picker is on. */

export interface Hero {
  /** What the window's address bar reads. */
  address: string
  render: (theme: ThemeInput) => ReactNode
  /** The part of the page scrolled to the top of the window (under its header), so what moves is in view in every preset. */
  scroll?: { to: string; below: number }
}

export const HEROES: Record<HeroId, Hero> = {
  tandem: { address: 'tandem.studio/brightwater/first-flush', render: (theme) => <TasksExample theme={theme} /> },
  folio: { address: 'folio.email/inbox', render: (theme) => <MailExample theme={theme} /> },
  // The memo's figures: the running total and the bridge, side by side, just under the masthead.
  ledger: { address: 'ledger.meadowtea.co/revenue', render: (theme) => <AnalyticsExample theme={theme} />, scroll: { to: 'section[aria-label="What happened"]', below: 60 } },
}
