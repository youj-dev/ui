export type ChangelogKind = 'new' | 'improved' | 'fixed'
export type ChangelogFilter = 'all' | ChangelogKind

export const KIND_TONE: Record<ChangelogKind, 'default' | 'success' | 'secondary'> = { new: 'default', improved: 'success', fixed: 'secondary' }

/** One version's write-up. */
export interface ChangelogRelease {
  /** "3.4"; also the entry's anchor (`#v3-4`). */
  version: string
  /** As it should read: "Sep 24, 2026". */
  date: string
  title: string
  /** What it brings; the filter reads these. */
  kinds: ChangelogKind[]
  /** Paragraphs. */
  body: string[]
  /** A snippet, or a headline number that counts up. */
  media?: { type: 'code'; lines: string[] } | { type: 'metric'; value: number; suffix: string; caption: string }
  /** Smaller fixes, folded away. */
  fixes?: string[]
}

export const RELEASES: ChangelogRelease[] = [
  {
    version: '3.4',
    date: 'Sep 24, 2026',
    title: 'Presence channels',
    kinds: ['new', 'fixed'],
    body: [
      'Every channel now knows who is in it. Subscribe to presence and Relay streams joins, leaves and cursor state with the same ordering guarantees as your messages, so avatars and live cursors never disagree with the document.',
      'Presence state is ephemeral by design: it lives for the length of a connection plus a 30-second grace window, which covers a tab going to sleep or a train tunnel.',
    ],
    media: {
      type: 'code',
      lines: ["const room = relay.channel('doc:42')", "room.presence.enter({ name: 'Ada', color })", "room.presence.on('update', render)"],
    },
    fixes: ['Reconnects no longer replay the last message twice on Safari 18.', 'Channel names with a trailing slash are rejected with a clear error.'],
  },
  {
    version: '3.3',
    date: 'Sep 2, 2026',
    title: 'Delta sync, 38% lighter',
    kinds: ['improved'],
    body: [
      'We rewrote the wire format for document updates. Instead of whole records, Relay now ships binary deltas and batches bursts that land inside one frame. Busy rooms feel the same and cost far less to run.',
      'Nothing to change on your side: clients on 3.x negotiate the new format automatically and fall back when a peer is older.',
    ],
    media: { type: 'metric', value: 38, suffix: '%', caption: 'less bandwidth per active room, median across the beta' },
  },
  {
    version: '3.2',
    date: 'Aug 12, 2026',
    title: 'Webhooks you can replay',
    kinds: ['new', 'improved'],
    body: [
      'Every webhook delivery is now kept for 14 days with its request, response and timing. Replay one from the dashboard or the CLI, and filter by status to find the ones your endpoint dropped.',
    ],
    fixes: ['Signature timestamps use the delivery time, not the event time.', 'The retry schedule honors Retry-After headers.', 'Long payloads no longer truncate in the delivery log.'],
  },
  {
    version: '3.1.4',
    date: 'Jul 30, 2026',
    title: 'Offline queue fixes',
    kinds: ['fixed'],
    body: ['A maintenance release for the offline queue. Writes made while offline now keep their original order across app restarts, and the queue survives storage quota errors by trimming its oldest snapshots first.'],
    fixes: ['Queued writes kept their order only within one session.', 'IndexedDB quota errors emptied the queue.', 'The online event fired twice on Android WebView.'],
  },
]

export const CHANGELOG_COPY = {
  section: '/ changelog',
  rss: 'RSS feed',
  readingProgress: 'Reading progress',
  eyebrow: 'Changelog',
  title: 'What’s new in Relay',
  description: 'New features, improvements and fixes to the realtime sync API, written up by the people who shipped them.',
  filter: 'Filter releases',
  filters: { all: 'All', new: 'New', improved: 'Improved', fixed: 'Fixed' } as Record<ChangelogFilter, string>,
  count: (shown: number, total: number) => `${shown} of ${total} releases`,
  list: 'Releases',
  smallerFixes: (n: number) => `${n} smaller fixes`,
  archiveBefore: 'Older releases live in the ',
  archiveLink: 'archive',
  archiveAfter: '.',
  empty: 'No releases match.',
  loading: 'Loading releases',
  subscribe: 'Subscribe',
  subscribeTitle: 'Get releases by email',
  subscribeDescription: 'One short note when a version ships. No marketing.',
  email: 'Email',
  emailPlaceholder: 'you@company.com',
  emailInvalid: 'Enter an email like you@company.com.',
  subscribing: 'Subscribing…',
  subscribed: 'You’re on the list',
  subscribeError: 'Check the email',
}
export type ChangelogCopy = typeof CHANGELOG_COPY

/** A release's anchor id. */
export const releaseId = (release: ChangelogRelease) => `v${release.version.replace(/\./g, '-')}`
