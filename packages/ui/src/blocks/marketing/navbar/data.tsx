import type { MouseEventHandler, ReactNode } from 'react'
import {
  BarChartIcon,
  BookOpenIcon,
  BriefcaseIcon,
  BuildingIcon,
  CodeIcon,
  CreditCardIcon,
  DatabaseIcon,
  GitBranchIcon,
  GlobeIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  MegaphoneIcon,
  RocketIcon,
  SettingsIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  SparklesIcon,
  TerminalIcon,
  UsersIcon,
} from '@youj/icons'
import { ChartPreview, StatusPreview, TerminalPreview, TilesPreview } from './previews'

/** The card a mega menu shows beside its links while one is hovered or focused. Decorative: the link says the same in words. */
export interface MarketingNavbarPreview {
  /** A picture of the thing; default a tinted wash. */
  media?: ReactNode
  /** Default: the link's label. */
  title?: string
  /** Default: the link's description. */
  description?: string
}

/** A link inside a mega menu (or the small-screen drawer). */
export interface MarketingNavbarLink {
  label: string
  href: string
  /** A 16px glyph. */
  icon?: ReactNode
  /** One line under the label. */
  description?: string
  /** A small tag after the label ("New", "Beta"). */
  badge?: string
  /** What the menu's preview card shows while this link is hovered or focused. */
  preview?: MarketingNavbarPreview
}

/** A media card in a mega menu's last column: a post, a guide, a customer story. */
export interface MarketingNavbarCard {
  href: string
  title: string
  /** A small line above the title ("Blog"). */
  eyebrow?: string
  /** A line under the title ("6 min read"). */
  meta?: string
  /** The card's picture. Decorative. Default: a tinted wash. */
  media?: ReactNode
}

/** A titled column of mega-menu links. */
export interface MarketingNavbarGroup {
  title: string
  links: MarketingNavbarLink[]
}

/** A top-level entry: a plain link (`href`) or a mega menu (`groups`). */
export interface MarketingNavbarItem {
  label: string
  /** A plain link's target. */
  href?: string
  /** A mega menu's columns. */
  groups?: MarketingNavbarGroup[]
  /** A strip under the mega menu's columns: a launch, a case study, "See everything". */
  featured?: { href: string; title: string; eyebrow?: string; description?: string }
  /** Media cards in the menu's last column, in place of the preview. */
  cards?: MarketingNavbarCard[]
  /** A plain link's glyph in the drawer. */
  icon?: ReactNode
  /** A plain link's tag in the drawer. */
  badge?: string
}

/** A call to action link. */
export interface MarketingNavbarCta {
  label: string
  href: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

/** The product's name, mark and home link. */
export interface MarketingNavbarBrand {
  name: string
  logo?: ReactNode
  href?: string
}

/** The bar above the header. */
export interface MarketingNavbarAnnouncement {
  /** The message: "Northwind 2.0 is here". */
  label: string
  href: string
  /** A pill before the message ("New"). */
  badge?: string
  /** The link's own words after the message ("Read the launch post"). */
  cta?: string
}

/** The signed-in person. */
export interface MarketingNavbarUser {
  name: string
  email?: string
  /** A photo's URL; initials otherwise. */
  avatar?: string
}

/** A row in the account menu (and the signed-in drawer). */
export interface MarketingNavbarAccountLink {
  label: string
  href: string
  icon?: ReactNode
}

/** A page the search finds. Every mega-menu link is searchable without being listed here. */
export interface MarketingNavbarSearchItem {
  id: string
  label: string
  href: string
  /** The palette group it sits under. */
  group?: string
  /** More words it's found by. */
  keywords?: string[]
}

const PRODUCT: MarketingNavbarGroup[] = [
  {
    title: 'Build',
    links: [
      {
        href: '#deployments',
        icon: <RocketIcon size={16} />,
        label: 'Deployments',
        description: 'Push to preview, promote to production.',
        preview: {
          description: 'Every push gets a live URL. Promote the one that looks right, roll back in a click.',
          media: (
            <StatusPreview
              title="Deployments"
              rows={[
                { label: 'main · 3f9c2a1', meta: 'Production', tone: 'ok' },
                { label: 'fix-checkout · 81be07d', meta: 'Preview', tone: 'ok' },
                { label: 'new-pricing · c4410e9', meta: 'Building', tone: 'warn' },
              ]}
            />
          ),
        },
      },
      {
        href: '#functions',
        icon: <TerminalIcon size={16} />,
        label: 'Functions',
        description: 'Server code that scales to zero.',
        preview: {
          description: 'Write a handler, deploy it next to your pages. It wakes in milliseconds and sleeps when idle.',
          media: <TerminalPreview lines={['northwind deploy api/checkout.ts', 'Built in under 2 seconds', 'Live in 38 regions']} />,
        },
      },
      {
        href: '#storage',
        icon: <DatabaseIcon size={16} />,
        label: 'Storage',
        description: 'Blobs, key-value and Postgres.',
        badge: 'Beta',
        preview: {
          description: 'Postgres, a key-value store and blob storage, each one environment variable away.',
          media: (
            <StatusPreview
              title="Storage"
              rows={[
                { label: 'orders-db · Postgres', meta: '12 GB', tone: 'ok' },
                { label: 'sessions · KV', meta: '3.1M keys', tone: 'ok' },
                { label: 'uploads · Blob', meta: '240 GB', tone: 'idle' },
              ]}
            />
          ),
        },
      },
    ],
  },
  {
    title: 'Observe',
    links: [
      {
        href: '#analytics',
        icon: <BarChartIcon size={16} />,
        label: 'Analytics',
        description: 'Real traffic, no cookies, no sampling.',
        preview: {
          description: 'Visitors, vitals and conversions per route and per deploy, without a consent banner.',
          media: <ChartPreview title="Visitors, last 7 days" value="84.2k" delta="+12.4%" data={[38, 44, 41, 52, 49, 61, 66, 63, 74, 84]} />,
        },
      },
      {
        href: '#firewall',
        icon: <ShieldCheckIcon size={16} />,
        label: 'Firewall',
        description: 'Rules that deploy with your code.',
        preview: {
          description: 'Block, challenge or rate-limit at the edge. Rules are versioned and roll back with the deploy.',
          media: (
            <StatusPreview
              title="Firewall · last hour"
              rows={[
                { label: 'Bad bots', meta: '18.2k blocked', tone: 'bad' },
                { label: 'Rate limit /api', meta: '640 limited', tone: 'warn' },
                { label: 'Allow partners', meta: 'Active', tone: 'ok' },
              ]}
            />
          ),
        },
      },
      {
        href: '#edge',
        icon: <GlobeIcon size={16} />,
        label: 'Edge network',
        description: 'Cached close to every visitor.',
        preview: {
          description: '38 regions, one deploy. Pages are served from the closest, and purged everywhere in under a second.',
          media: <TilesPreview lit={[1, 4, 7, 8, 12, 15, 16]} />,
        },
      },
    ],
  },
]

const SOLUTIONS: MarketingNavbarGroup[] = [
  {
    title: 'By team',
    links: [
      {
        href: '#platform',
        icon: <UsersIcon size={16} />,
        label: 'Platform teams',
        description: 'Guardrails without the tickets.',
        preview: {
          description: 'Policies, approvals and audit logs that developers never have to think about.',
          media: <StatusPreview title="Policies" rows={[{ label: 'Require review on prod', meta: 'On', tone: 'ok' }, { label: 'Block unsigned builds', meta: 'On', tone: 'ok' }, { label: 'Audit log export', meta: 'Daily', tone: 'idle' }]} />,
        },
      },
      {
        href: '#agencies',
        icon: <BriefcaseIcon size={16} />,
        label: 'Agencies',
        description: 'Client previews that need no login.',
        preview: {
          description: 'Share a preview with comments pinned to the pixels. Clients approve in the page.',
          media: <StatusPreview title="Client reviews" rows={[{ label: 'Fernhill · homepage', meta: 'Approved', tone: 'ok' }, { label: 'Marlowe · pricing', meta: '3 comments', tone: 'warn' }]} />,
        },
      },
    ],
  },
  {
    title: 'By industry',
    links: [
      {
        href: '#commerce',
        icon: <ShoppingBagIcon size={16} />,
        label: 'Commerce',
        description: 'Storefronts that stay fast on sale day.',
        preview: {
          description: 'Cache the catalog, never the cart. Traffic spikes on launch day become a non-event.',
          media: <ChartPreview title="Checkout p95" value="212 ms" delta="-38%" data={[88, 82, 90, 70, 64, 58, 52, 49, 44, 40]} />,
        },
      },
      {
        href: '#saas',
        icon: <CreditCardIcon size={16} />,
        label: 'SaaS',
        description: 'Per-team previews for multi-tenant apps.',
        preview: {
          description: 'Preview any tenant against any branch, with its own data and its own domain.',
          media: <TerminalPreview lines={['northwind preview --tenant acme', 'acme.preview.app is ready', '2 migrations applied']} />,
        },
      },
      {
        href: '#enterprise',
        icon: <BuildingIcon size={16} />,
        label: 'Enterprise',
        description: 'SSO, audit logs and a 99.99% SLA.',
        preview: {
          description: 'SAML, SCIM, private networking and a named engineer who knows your setup.',
          media: <TilesPreview lit={[0, 1, 2, 6, 7, 8, 12, 13, 14]} cols={6} rows={3} />,
        },
      },
    ],
  },
]

const RESOURCES: MarketingNavbarGroup[] = [
  {
    title: 'Learn',
    links: [
      { href: '#docs', icon: <BookOpenIcon size={16} />, label: 'Documentation', description: 'Guides and the full API reference.' },
      { href: '#templates', icon: <SparklesIcon size={16} />, label: 'Templates', description: 'Start from something that works.' },
      { href: '#changelog', icon: <HistoryIcon size={16} />, label: 'Changelog', description: 'What shipped this week.', badge: 'New' },
    ],
  },
  {
    title: 'Tools',
    links: [
      { href: '#cli', icon: <CodeIcon size={16} />, label: 'CLI', description: 'Deploy from your terminal.' },
      { href: '#git', icon: <GitBranchIcon size={16} />, label: 'Git integration', description: 'Previews for every branch.' },
      { href: '#status', icon: <MegaphoneIcon size={16} />, label: 'System status', description: 'Live uptime for every region.' },
      { href: '#support', icon: <LifeBuoyIcon size={16} />, label: 'Support', description: 'Talk to someone who ships.' },
    ],
  },
]

export const LINKS: MarketingNavbarItem[] = [
  {
    label: 'Product',
    groups: PRODUCT,
    featured: { href: '#launch', eyebrow: 'New', title: 'Northwind 2.0', description: 'Instant rollbacks, preview comments and a faster edge.' },
  },
  { label: 'Solutions', groups: SOLUTIONS, featured: { href: '#customers', eyebrow: 'Customer story', title: 'How Fernhill cut checkout time by 38%' } },
  {
    label: 'Resources',
    groups: RESOURCES,
    cards: [
      {
        href: '#blog/cold-starts',
        eyebrow: 'Blog',
        title: 'How we cut cold starts to 40 ms',
        meta: '6 min read',
        media: <ChartPreview title="Cold start, p50" value="40 ms" delta="-71%" data={[140, 132, 118, 120, 96, 84, 70, 58, 46, 40]} />,
      },
      {
        href: '#guides/rollbacks',
        eyebrow: 'Guide',
        title: 'Rollbacks without the 3 a.m. page',
        meta: 'Deployments · 4 steps',
        media: <TerminalPreview lines={['northwind rollback web', 'Promoted 3f9c2a1 to production', 'Rolled back in 1.2 s']} />,
      },
    ],
  },
  { label: 'Customers', href: '#customers', icon: <UsersIcon size={16} /> },
  { label: 'Pricing', href: '#pricing', icon: <CreditCardIcon size={16} />, badge: 'Save 20%' },
]

export function Logo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="text-accent">
      <path d="M4 5h4l4 7-4 7H4l4-7z" fill="currentColor" />
      <path d="M12 5h4l4 7-4 7h-4l4-7z" fill="currentColor" opacity={0.45} />
    </svg>
  )
}

export const BRAND: MarketingNavbarBrand = { name: 'Northwind', logo: <Logo />, href: '#home' }

export const ANNOUNCEMENT: MarketingNavbarAnnouncement = { badge: 'New', label: 'Northwind 2.0 ships instant rollbacks.', cta: 'Read the launch post', href: '#launch' }

export const SEARCH_ITEMS: MarketingNavbarSearchItem[] = [
  { id: 'pricing', label: 'Pricing', href: '#pricing', group: 'Pages', keywords: ['plans', 'cost', 'billing'] },
  { id: 'customers', label: 'Customers', href: '#customers', group: 'Pages', keywords: ['stories', 'case studies'] },
  { id: 'security', label: 'Security and trust', href: '#security', group: 'Pages', keywords: ['soc 2', 'compliance', 'gdpr'] },
  { id: 'contact', label: 'Contact sales', href: '#contact', group: 'Pages', keywords: ['demo', 'talk', 'enterprise'] },
]

export const ACCOUNT_LINKS: MarketingNavbarAccountLink[] = [
  { label: 'Dashboard', href: '#dashboard', icon: <LayoutDashboardIcon size={16} /> },
  { label: 'Billing', href: '#billing', icon: <CreditCardIcon size={16} /> },
  { label: 'Settings', href: '#settings', icon: <SettingsIcon size={16} /> },
]

export const DEFAULT_COPY = {
  navLabel: 'Main',
  /** The drawer's title; empty uses the shared "Menu" label. */
  menu: '',
  searchLabel: 'Search the site',
  searchPlaceholder: 'Search…',
  searchTitle: 'Search the site',
  searchPages: 'Pages',
  signIn: 'Sign in',
  signUp: 'Start free',
  dashboard: 'Dashboard',
  signOut: 'Sign out',
  /** The account menu button's name, given the person's name. */
  account: (name: string) => `Account menu, ${name}`,
  dismissAnnouncement: 'Dismiss announcement',
  announcementLabel: 'Announcement',
  /** Names the drawer's section list. */
  sections: 'Site sections',
}

export type MarketingNavbarCopy = typeof DEFAULT_COPY
