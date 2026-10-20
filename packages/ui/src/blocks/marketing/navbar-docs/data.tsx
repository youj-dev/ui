import type { MouseEventHandler, ReactNode } from 'react'

/** A page of the docs, in a section's tree; `pages` nests more under it. */
export interface NavbarDocsPage {
  label: string
  href: string
  /** A small tag after the label ("New", "Beta"). */
  badge?: string
  pages?: NavbarDocsPage[]
}

/** A titled run of pages in a section's tree. */
export interface NavbarDocsGroup {
  title: string
  pages: NavbarDocsPage[]
}

/** A part of the docs, shown as a tab under the bar; its tree fills the phone drawer. */
export interface NavbarDocsSection {
  id: string
  label: string
  href: string
  groups?: NavbarDocsGroup[]
}

/** A version of the docs. One with `href` lives elsewhere (an archive): choosing it follows the link. */
export interface NavbarDocsVersion {
  id: string
  label: string
  /** A tag beside it in the menu: "Latest", "Pre-release". */
  badge?: string
  /** The current release: shown first when the app doesn't say which. */
  latest?: boolean
  href?: string
}

/** A link on the bar: Blog, Changelog. */
export interface NavbarDocsLink {
  label: string
  href: string
}

/** The repository: a link with its star count. */
export interface NavbarDocsRepository {
  href: string
  /** Shown compact ("12.4k"), in the block's locale. */
  stars?: number
}

/** The product's name, mark and home link; the bar adds "Docs" after it. */
export interface NavbarDocsBrand {
  name: string
  logo?: ReactNode
  href?: string
}

/** A call to action link. */
export interface NavbarDocsCta {
  label: string
  href: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

/** A page the search finds: every page of every section, with where it sits. */
export interface NavbarDocsResult {
  label: string
  href: string
  /** Its section, as the palette groups it. */
  section: string
  /** The group it sits in. */
  group: string
}

const page = (label: string, href: string, badge?: string): NavbarDocsPage => ({ label, href, ...(badge ? { badge } : {}) })

export const SECTIONS: NavbarDocsSection[] = [
  {
    id: 'start',
    label: 'Get started',
    href: '#start',
    groups: [
      { title: 'Introduction', pages: [page('Overview', '#start/overview'), page('Installation', '#start/installation'), page('Quickstart', '#start/quickstart')] },
      { title: 'Concepts', pages: [page('Projects', '#start/projects'), page('Environments', '#start/environments'), page('Secrets', '#start/secrets', 'New')] },
    ],
  },
  {
    id: 'guides',
    label: 'Guides',
    href: '#guides',
    groups: [
      {
        title: 'Deploying',
        pages: [
          page('From Git', '#guides/git'),
          { label: 'Rollbacks', href: '#guides/rollbacks', pages: [page('Instant rollback', '#guides/rollbacks/instant'), page('Pinned versions', '#guides/rollbacks/pinned')] },
          page('Preview links', '#guides/previews'),
        ],
      },
      { title: 'Data', pages: [page('Postgres', '#guides/postgres'), page('Caching', '#guides/caching'), page('Queues', '#guides/queues', 'Beta')] },
    ],
  },
  {
    id: 'api',
    label: 'API reference',
    href: '#api',
    groups: [
      { title: 'REST', pages: [page('Authentication', '#api/auth'), page('Deployments', '#api/deployments'), page('Domains', '#api/domains')] },
      { title: 'Webhooks', pages: [page('Events', '#api/events'), page('Signatures', '#api/signatures')] },
    ],
  },
  {
    id: 'cli',
    label: 'CLI',
    href: '#cli',
    groups: [{ title: 'Commands', pages: [page('atlas deploy', '#cli/deploy'), page('atlas env', '#cli/env'), page('atlas logs', '#cli/logs')] }],
  },
  { id: 'examples', label: 'Examples', href: '#examples', groups: [{ title: 'Starters', pages: [page('Next.js', '#examples/next'), page('Astro', '#examples/astro'), page('Remix', '#examples/remix')] }] },
]

export const VERSIONS: NavbarDocsVersion[] = [
  { id: 'v4.3', label: 'v4.3', badge: 'Pre-release' },
  { id: 'v4.2', label: 'v4.2', badge: 'Latest', latest: true },
  { id: 'v3', label: 'v3.x', href: '#archive/v3' },
  { id: 'v2', label: 'v2.x', href: '#archive/v2' },
]

export const LINKS: NavbarDocsLink[] = [
  { label: 'Blog', href: '#blog' },
  { label: 'Changelog', href: '#changelog' },
]

export function Logo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="text-accent">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" />
      <path d="M8 16 L12 7 L16 16 M9.6 13 H14.4" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="stroke-on-accent" />
    </svg>
  )
}

export const BRAND: NavbarDocsBrand = { name: 'Atlas', logo: <Logo />, href: '#home' }

export const REPOSITORY: NavbarDocsRepository = { href: 'https://github.com', stars: 12480 }

export const CTA: NavbarDocsCta = { label: 'Dashboard', href: '#dashboard' }

export const DEFAULT_COPY = {
  /** After the product's name. */
  docs: 'Docs',
  /** Names the bar's links and the section tabs. */
  navLabel: 'Docs',
  sectionsLabel: 'Sections',
  /** The version menu's button, given the version shown. */
  version: (label: string) => `Version ${label}, change version`,
  versionsTitle: 'Versions',
  /** Said after a version that lives elsewhere. */
  archived: 'Archived',
  searchLabel: 'Search docs',
  searchPlaceholder: 'Search docs…',
  searchTitle: 'Search the docs',
  recent: 'Recent',
  /** The repository link's name, given its formatted star count (empty when unknown). */
  repository: (stars: string) => (stars ? `GitHub, ${stars} stars` : 'GitHub'),
  /** The phone drawer's button and title. */
  menu: 'Menu',
  openMenu: 'Open menu',
  /** The first stop for the keyboard: jumps past the bar to the page's content. */
  skipLink: 'Skip to content',
  /** The drawer's toggle for a page with pages under it. */
  showPages: (label: string) => `Show pages in ${label}`,
}

export type NavbarDocsCopy = typeof DEFAULT_COPY
