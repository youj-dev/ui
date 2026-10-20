import type { ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { CodeBlock, InstallBlock } from './code'

/** A part of a page: a heading in "On this page" (`depth` 1 for a subheading) and its content. */
export type Section = { id: string; title: string; depth?: number; body: ReactNode }
/** A docs page. */
export interface Page {
  id: string
  /** The nav group it sits in; groups show in the order their first page appears. */
  group: string
  title: string
  /** The line under the title. */
  lead: string
  /** As it should read: "Sep 12, 2026". */
  updated?: string
  sections: Section[]
}

export const DOCS_COPY = {
  openNavigation: 'Open navigation',
  search: 'Search docs…',
  searchTitle: 'Search documentation',
  searchPlaceholder: 'Search pages and sections…',
  navigation: 'Documentation',
  menuTitle: (brand: string) => `${brand} docs`,
  onThisPage: 'On this page',
  updated: (date: string) => `Updated ${date}`,
  editPage: 'Edit this page',
  pagination: 'Pagination',
  previous: 'Previous',
  next: 'Next',
  helpful: 'Was this page helpful?',
  yes: 'Yes',
  no: 'No',
  thanksYes: 'Thanks, glad it helped.',
  thanksNo: 'Thanks. We’ll make this page clearer.',
  feedbackSent: 'Feedback sent. Thank you.',
}
export type DocsCopy = typeof DOCS_COPY

const OPTIONS = [
  { name: 'writeKey', type: 'string', fallback: '—', description: 'Your project’s public write key. Required.' },
  { name: 'flushAt', type: 'number', fallback: '20', description: 'Events to batch before sending.' },
  { name: 'flushInterval', type: 'number', fallback: '5000', description: 'Longest wait before a batch is sent, in ms.' },
  { name: 'retries', type: 'number', fallback: '3', description: 'Attempts for a failed batch, with backoff.' },
  { name: 'debug', type: 'boolean', fallback: 'false', description: 'Log every event to the console.' },
]

const P = ({ children }: { children: ReactNode }) => <p className="leading-7 text-fg">{children}</p>
const C = ({ children }: { children: ReactNode }) => <code className="rounded-sm bg-band px-1 py-0.5 font-mono text-[0.875em] text-fg">{children}</code>

export const PAGES: Page[] = [
  {
    id: 'introduction',
    group: 'Getting started',
    title: 'Introduction',
    lead: 'Northstar is a typed analytics SDK: define your events once and get autocomplete, validation and batching everywhere you track them.',
    updated: 'Sep 3, 2026',
    sections: [
      { id: 'why-northstar', title: 'Why Northstar', body: <P>Most analytics bugs are typos: an event named <C>signup_completed</C> in one place and <C>signUpCompleted</C> in another. Northstar generates a client from your tracking plan, so a misspelled event is a compile error, not a broken dashboard.</P> },
      { id: 'how-it-works', title: 'How it works', body: <P>You describe events in a schema file. The CLI turns it into a typed client; the client batches events in memory, retries on failure and sends them to any destination you connect.</P> },
    ],
  },
  {
    id: 'installation',
    group: 'Getting started',
    title: 'Installation',
    lead: 'Add the SDK to a Node or browser project, create a client with your write key, and confirm that events arrive.',
    updated: 'Sep 12, 2026',
    sections: [
      {
        id: 'requirements',
        title: 'Requirements',
        body: (
          <>
            <P>Northstar runs anywhere modern JavaScript does: Node 20 or later, Bun, Deno and every evergreen browser. It ships ES modules with types included.</P>
            <Alert>
              <AlertTitle>Using an edge runtime?</AlertTitle>
              <AlertDescription>
                Import from <C>@northstar/sdk/edge</C>. It swaps the timer-based flush for one that runs at the end of each request.
              </AlertDescription>
            </Alert>
          </>
        ),
      },
      { id: 'install-the-package', title: 'Install the package', body: <InstallBlock /> },
      {
        id: 'create-a-client',
        title: 'Create a client',
        body: (
          <>
            <P>Create one client per process and share it. It holds the event queue, so creating one per request would lose batching.</P>
            <CodeBlock
              title="lib/analytics.ts"
              code={"import { Northstar } from '@northstar/sdk'\n\nexport const analytics = new Northstar({\n  writeKey: process.env.NORTHSTAR_WRITE_KEY, // public, safe to ship\n  flushAt: 20,\n})"}
            />
          </>
        ),
      },
      {
        id: 'environment-variables',
        title: 'Environment variables',
        depth: 1,
        body: (
          <Alert variant="warning">
            <AlertTitle>Keep the secret key on the server</AlertTitle>
            <AlertDescription>
              The write key is public. The <C>NORTHSTAR_SECRET</C> used by the admin API is not: never prefix it with <C>NEXT_PUBLIC_</C> or bundle it.
            </AlertDescription>
          </Alert>
        ),
      },
      {
        id: 'options',
        title: 'Options',
        body: (
          <div className="overflow-x-auto rounded-lg border border-line">
            <Table className="min-w-lg">
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-4">Option</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead className="pe-4">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {OPTIONS.map((o) => (
                  <TableRow key={o.name}>
                    <TableCell className="ps-4 font-mono text-ui-sm text-fg">{o.name}</TableCell>
                    <TableCell className="font-mono text-ui-sm text-accent-text">{o.type}</TableCell>
                    <TableCell className="font-mono text-ui-sm text-fg-muted">{o.fallback}</TableCell>
                    <TableCell className="pe-4 whitespace-normal text-fg-muted">{o.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ),
      },
      {
        id: 'verify',
        title: 'Verify the install',
        body: (
          <>
            <P>Send a test event and open the Live view in your dashboard. It should appear within a second or two.</P>
            <CodeBlock title="scripts/ping.ts" code={"import { analytics } from '../lib/analytics'\n\nanalytics.track('sdk_installed', { version: '2.4.0' })\nawait analytics.flush() // send now, don’t wait for the batch"} />
          </>
        ),
      },
    ],
  },
  {
    id: 'quickstart',
    group: 'Getting started',
    title: 'Quickstart',
    lead: 'From an empty schema to your first typed event in five minutes.',
    updated: 'Aug 28, 2026',
    sections: [
      { id: 'define-an-event', title: 'Define an event', body: <CodeBlock title="northstar.schema.ts" code={"export const events = {\n  checkout_started: { cartValue: 'number', items: 'number' },\n}"} /> },
      { id: 'generate-the-client', title: 'Generate the client', body: <P>Run <C>npx northstar generate</C>. It writes a typed client next to your schema; commit it with your code.</P> },
    ],
  },
  {
    id: 'clients',
    group: 'Core concepts',
    title: 'Clients',
    lead: 'A client owns a queue, a transport and a set of destinations. Most apps need exactly one.',
    updated: 'Aug 19, 2026',
    sections: [
      { id: 'lifecycle', title: 'Lifecycle', body: <P>Clients start lazily on the first event and flush on <C>beforeunload</C> in browsers and on <C>SIGTERM</C> in Node. Call <C>shutdown()</C> in tests to flush and release timers.</P> },
      { id: 'multiple-clients', title: 'Multiple clients', body: <P>Use a second client only for a second project. Destinations are cheaper: one client can fan out to many.</P> },
    ],
  },
  {
    id: 'events',
    group: 'Core concepts',
    title: 'Events',
    lead: 'Events are facts about what a user did, named in the past tense and validated against your schema.',
    updated: 'Aug 11, 2026',
    sections: [
      { id: 'naming', title: 'Naming', body: <P>Use <C>object_action</C> in the past tense: <C>invoice_paid</C>, <C>seat_added</C>. The CLI warns about names that break the pattern.</P> },
      { id: 'properties', title: 'Properties', body: <P>Properties are typed and optional unless marked required. Unknown properties are dropped in production and reported in development.</P> },
    ],
  },
  {
    id: 'retries',
    group: 'Core concepts',
    title: 'Retries',
    lead: 'Failed batches are retried with exponential backoff and jitter, then parked on disk until the network returns.',
    updated: 'Jul 30, 2026',
    sections: [{ id: 'backoff', title: 'Backoff', body: <P>Retries wait 1, 4 and 16 seconds by default, each with up to 20% jitter, and honor <C>Retry-After</C> from the ingest API.</P> }],
  },
  {
    id: 'track',
    group: 'API reference',
    title: 'track()',
    lead: 'Records an event. Returns immediately; the event is queued and sent with the next batch.',
    updated: 'Sep 1, 2026',
    sections: [{ id: 'signature', title: 'Signature', body: <CodeBlock title="track.d.ts" code={"track<E extends EventName>(event: E, properties: Props<E>): void"} /> }],
  },
  {
    id: 'identify',
    group: 'API reference',
    title: 'identify()',
    lead: 'Ties the current anonymous visitor to a known user, merging their history.',
    updated: 'Sep 1, 2026',
    sections: [{ id: 'signature', title: 'Signature', body: <CodeBlock title="identify.d.ts" code={"identify(userId: string, traits?: Traits): void"} /> }],
  },
]

/** The nav groups, in the order their first page appears. */
export const groupsOf = (pages: Page[]) => [...new Set(pages.map((p) => p.group))]
