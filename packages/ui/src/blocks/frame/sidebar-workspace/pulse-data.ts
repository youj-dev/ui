/* Live state for Workspace, as data: signals are what needs you, each
 * pointing at a page of the nav; activity is who's on a page, whether
 * something is running there, and whether it has news for you. Both are
 * optional: pass them to light the sidebar up. */

export interface FrameSignal {
  id: string
  /** The nav page it's about. */
  page: string
  /** What happened, as a line: "Mira mentioned you". */
  title: string
  /** `urgent` is red, `high` amber, `normal` quiet ink. */
  priority: 'urgent' | 'high' | 'normal'
  /** When, short: "2m", "1h". */
  time: string
}

export interface FramePerson {
  id: string
  name: string
}

export interface FramePageActivity {
  /** Who's on the page now. */
  people?: FramePerson[]
  /** Something is running there (a sync, an export, a deploy). */
  live?: boolean
  /** It has something you haven't seen. */
  unread?: boolean
}

export const PULSE_COPY = {
  needsYou: 'Needs you',
  /** The folded sidebar's bell. */
  needsYouCount: (count: number) => `Needs you: ${count}`,
  clear: (title: string) => `Clear: ${title}`,
  caughtUp: 'You’re all caught up',
  /** Read after a page's name when it has something you haven't seen. */
  unread: 'new',
  /** Read after a page's name while something runs there. */
  live: 'live',
  /** Who's on a page, read after its name. */
  people: (names: string[]) => `${names.length > 2 ? `${names[0]} and ${names.length - 1} others` : names.join(' and ')} here`,
}

export type FramePulseCopy = typeof PULSE_COPY
