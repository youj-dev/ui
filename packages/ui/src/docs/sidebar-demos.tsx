'use client'

import {
  BarChartIcon,
  BellIcon,
  BookOpenIcon,
  BriefcaseIcon,
  CalendarIcon,
  ClipboardListIcon,
  ClockIcon,
  CompassIcon,
  DatabaseIcon,
  FileTextIcon,
  FolderIcon,
  GaugeIcon,
  HomeIcon,
  InboxIcon,
  LayersIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  LineChartIcon,
  ListChecksIcon,
  PieChartIcon,
  PlayIcon,
  RepeatIcon,
  SendIcon,
  SparklesIcon,
  TableIcon,
  UsersIcon,
  WorkflowIcon,
} from '@youj/icons'
import { useFrame, type FrameNavSection, type FrameTeam, type FrameUser } from '../blocks/frame/shell'
import { AppPage } from '../components/ui/app-page'
import { cn } from '../lib/utils'

/* Each sidebar's own sample product for its stories and the docs: a nav, a
 * team and a person, and a page that reads like that product. Fictional
 * names throughout. Stories and docs only; nothing here ships. */

/* Classic: a sales CRM ("Fieldnote"). */
export const CLASSIC_NAV: FrameNavSection[] = [
  {
    id: 'main',
    items: [
      { id: 'inbox', label: 'Inbox', icon: InboxIcon, badge: 3, badgeLabel: '3 unread', badgeTone: 'danger' },
      { id: 'deals', label: 'Deals', icon: BriefcaseIcon, badge: 24, badgeLabel: '24 open' },
      { id: 'people', label: 'People', icon: UsersIcon },
      { id: 'tasks', label: 'Tasks', icon: ListChecksIcon, badge: 7, badgeLabel: '7 due' },
      { id: 'reports', label: 'Reports', icon: LineChartIcon },
      {
        id: 'automations',
        label: 'Automations',
        icon: PlayIcon,
        items: [
          { id: 'workflows', label: 'Workflows', icon: WorkflowIcon },
          { id: 'sequences', label: 'Sequences', icon: SendIcon },
        ],
      },
      { id: 'schedule', label: 'Schedule', icon: CalendarIcon },
    ],
  },
  {
    id: 'favorites',
    label: 'Favorites',
    collapsible: true,
    items: [
      { id: 'q4-budget', label: 'Q4 budget', icon: FileTextIcon },
      { id: 'harbor-renewal', label: 'Harbor renewal', icon: FolderIcon },
    ],
  },
]
export const CLASSIC_LINKS = [
  { id: 'settings', label: 'Settings', icon: LayersIcon, href: '#settings' },
  { id: 'help', label: 'Help center', icon: BookOpenIcon, href: '#help' },
]
export const CLASSIC_TEAMS: FrameTeam[] = [{ id: 'fieldnote', name: 'Fieldnote', detail: 'Growth · 18 seats' }]
export const CLASSIC_USER: FrameUser = { name: 'Priya Lindqvist', email: 'priya@fieldnote.app' }

/* Workspace: home-care operations ("Tidewell"). */
export const WORKSPACE_NAV: FrameNavSection[] = [
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboardIcon },
      { id: 'schedule', label: 'Schedule', icon: CalendarIcon },
      { id: 'visits', label: 'Visits', icon: ClipboardListIcon, badge: 18, badgeLabel: '18 today' },
      { id: 'alerts', label: 'Alerts', icon: BellIcon, badge: 3, badgeLabel: '3 need a swap', badgeTone: 'danger' },
    ],
  },
  {
    id: 'people',
    label: 'People',
    items: [
      { id: 'staff', label: 'Staff', icon: UsersIcon },
      { id: 'clients', label: 'Clients', icon: HomeIcon, badge: 214, badgeLabel: '214 clients' },
    ],
  },
  {
    id: 'regions',
    label: 'Regions',
    collapsible: true,
    items: [
      { id: 'eastbank', label: 'Eastbank', badge: 14 },
      { id: 'millbrook', label: 'Millbrook', badge: 9 },
      { id: 'southgate', label: 'Southgate', badge: 12 },
      { id: 'riverside', label: 'Riverside', badge: 6 },
    ],
  },
]
export const WORKSPACE_LINKS = [
  { id: 'settings', label: 'Settings', icon: LayersIcon, href: '#settings' },
  { id: 'help', label: 'Help and support', icon: BookOpenIcon, href: '#help' },
]
export const WORKSPACE_TEAMS: FrameTeam[] = [{ id: 'tidewell', name: 'Tidewell', detail: 'Northgate Clinics' }]
export const WORKSPACE_USER: FrameUser = { name: 'Ines Varga', email: 'ines@tidewell.care' }

/* Rail + panel: contract management ("Quillmark"). */
export const RAIL_PANEL_NAV: FrameNavSection[] = [
  { id: 'home', label: 'Home', icon: HomeIcon, items: [{ id: 'today', label: 'Today', icon: GaugeIcon }] },
  {
    id: 'contracts',
    label: 'Contracts',
    icon: RepeatIcon,
    items: [
      { id: 'all', label: 'All contracts', icon: RepeatIcon, badge: 52 },
      {
        id: 'due',
        label: 'Due in 60 days',
        icon: CalendarIcon,
        items: [
          { id: 'lumen', label: 'Lumen Print', badge: '21d', badgeLabel: 'due in 21 days' },
          { id: 'fairhaven', label: 'Fairhaven Labs', badge: '34d', badgeLabel: 'due in 34 days' },
          { id: 'okra', label: 'Okra Freight', badge: '38d', badgeLabel: 'due in 38 days, notice late', badgeTone: 'danger' },
          { id: 'quill', label: 'Quill Studio', badge: '48d', badgeLabel: 'due in 48 days' },
          { id: 'marrow', label: 'Marrow & Finch', badge: '56d', badgeLabel: 'due in 56 days' },
        ],
      },
      {
        id: 'later',
        label: 'Later',
        icon: ClockIcon,
        items: [
          { id: 'birch', label: 'Birchway Mills' },
          { id: 'corvid', label: 'Corvid Analytics' },
        ],
      },
    ],
  },
  { id: 'docs', label: 'Documents', icon: FileTextIcon, items: [{ id: 'templates', label: 'Templates', icon: FileTextIcon }, { id: 'clauses', label: 'Clause library', icon: BookOpenIcon }] },
  { id: 'vendors', label: 'Vendors', icon: DatabaseIcon, items: [{ id: 'directory', label: 'Directory', icon: DatabaseIcon, badge: 86 }] },
  { id: 'reports', label: 'Reports', icon: BarChartIcon, items: [{ id: 'spend', label: 'Spend', icon: PieChartIcon }, { id: 'renewals', label: 'Renewals', icon: LineChartIcon }] },
]
export const RAIL_PANEL_TEAMS: FrameTeam[] = [{ id: 'quillmark', name: 'Quillmark', detail: 'Legal ops' }]
export const RAIL_PANEL_USER: FrameUser = { name: 'Marta Okafor', email: 'marta@quillmark.co' }

/* Icon rail: an AI research desk ("Lattice"). */
export const ICON_RAIL_NAV: FrameNavSection[] = [
  {
    id: 'work',
    items: [
      { id: 'recent', label: 'Recent', icon: ClockIcon },
      { id: 'accounts', label: 'Accounts', icon: LayersIcon, badge: 3, badgeLabel: '3 updates' },
      { id: 'playbooks', label: 'Playbooks', icon: BookOpenIcon },
      { id: 'explore', label: 'Explore', icon: CompassIcon },
    ],
  },
  {
    id: 'agents',
    items: [
      { id: 'agents', label: 'Agents', icon: SparklesIcon, items: [{ id: 'scout', label: 'Scout' }, { id: 'brief', label: 'Brief writer' }] },
      { id: 'library', label: 'Library', icon: FolderIcon },
    ],
  },
]
export const ICON_RAIL_TEAMS: FrameTeam[] = [{ id: 'lattice', name: 'Lattice', detail: 'Research' }]
export const ICON_RAIL_USER: FrameUser = { name: 'Rafael Achebe', email: 'rafael@lattice.ai' }

/* Glass explorer: a data catalog ("Northlake"). */
export const GLASS_NAV: FrameNavSection[] = [
  {
    id: 'main',
    items: [
      { id: 'workspace', label: 'Workspace', icon: LayoutGridIcon },
      { id: 'recents', label: 'Recents', icon: ClockIcon },
      {
        id: 'catalog',
        label: 'Catalog',
        icon: DatabaseIcon,
        items: [
          {
            id: 'our-org',
            label: 'Our organization',
            items: [
              {
                id: 'sales-db',
                label: 'sales',
                icon: DatabaseIcon,
                items: [
                  { id: 'orders', label: 'orders_2026', icon: TableIcon, badge: 12 },
                  { id: 'customers', label: 'customers', icon: TableIcon },
                  { id: 'refunds', label: 'refunds', icon: TableIcon },
                ],
              },
              { id: 'archive-db', label: 'archive', icon: DatabaseIcon, items: [{ id: 'orders-2025', label: 'orders_2025', icon: TableIcon }] },
            ],
          },
          { id: 'shared', label: 'Shared with us', items: [{ id: 'samples', label: 'samples', icon: FolderIcon, items: [{ id: 'weather', label: 'weather_daily', icon: TableIcon }] }] },
        ],
      },
      { id: 'pipelines', label: 'Pipelines', icon: WorkflowIcon, badge: 2, badgeTone: 'danger', badgeLabel: '2 failing' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    items: [
      { id: 'editor', label: 'Editor', icon: FileTextIcon },
      { id: 'dashboards', label: 'Dashboards', icon: BarChartIcon },
      { id: 'alerts', label: 'Alerts', icon: BellIcon },
    ],
  },
]
export const GLASS_TEAMS: FrameTeam[] = [{ id: 'northlake', name: 'Northlake', detail: 'Data platform' }]
export const GLASS_USER: FrameUser = { name: 'Sun-hee Moreau', email: 'sunhee@northlake.io' }

export interface DemoPageData {
  lead: string
  stats: [string, string, string][]
  rows: [string, string, string, 'ok' | 'warn'][]
}

/* A page that reads like its product: a line, three figures and a short list, under the frame's title. */
export function SidebarDemoPage({ data }: { data: DemoPageData }) {
  const { trail } = useFrame()
  const title = (trail?.child ?? trail?.item)?.label
  return (
    <AppPage title={title} description={data.lead} className="min-h-[calc(100dvh-4rem)]">
      <div className="grid gap-4 @3xl:grid-cols-3">
        {data.stats.map(([label, value, note]) => (
          <div key={label} className="flex flex-col gap-1 rounded-surface bg-surface p-4 shadow-xs ring-1 ring-line">
            <span className="text-ui-sm text-fg-muted">{label}</span>
            <span className="text-2xl font-semibold text-fg tabular-nums">{value}</span>
            <span className="text-ui-xs text-fg-subtle">{note}</span>
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-surface bg-surface shadow-xs ring-1 ring-line">
        {data.rows.map(([time, name, meta, tone]) => (
          <div key={time} className="flex items-center gap-4 border-b border-line-subtle px-4 py-3 last:border-0">
            <span className="w-24 shrink-0 truncate font-mono text-ui-sm text-fg-muted tabular-nums">{time}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-ui text-fg">{name}</span>
              <span className="block truncate text-ui-xs text-fg-muted">{meta}</span>
            </span>
            <span className={cn('size-2 shrink-0 rounded-full', tone === 'ok' ? 'bg-success' : 'bg-warning')} />
          </div>
        ))}
      </div>
    </AppPage>
  )
}

export const CLASSIC_PAGE: DemoPageData = {
  lead: 'Three replies are waiting on you before the Thursday forecast.',
  stats: [
    ['Pipeline', '$1.42M', '24 open deals'],
    ['Won this month', '$318k', '+12% on September'],
    ['Reply time', '3h 10m', 'Median, last 7 days'],
  ],
  rows: [
    ['09:12', 'Harbor & Vale', 'Renewal · reply needed', 'warn'],
    ['10:40', 'Okonkwo Supply', 'Proposal opened twice', 'ok'],
    ['13:05', 'Brightwater Co-op', 'Pricing question', 'warn'],
    ['16:30', 'Lindgren Freight', 'Signed, onboarding', 'ok'],
  ],
}

export const WORKSPACE_PAGE: DemoPageData = {
  lead: '3 visits need a replacement before noon.',
  stats: [
    ['Open visits', '48', '+6 since 9 AM'],
    ['Covered', '45 of 48', '3 need a swap'],
    ['On time', '96%', 'Last 7 days'],
  ],
  rows: [
    ['08:30', 'Rosalind Achterberg', 'Home care · Eastbank', 'ok'],
    ['10:00', 'Tobias Wennerholm', 'Check-in · Millbrook', 'ok'],
    ['13:15', 'Odile Marchetti', 'Follow-up · Southgate', 'warn'],
    ['15:40', 'Kasimir Duval', 'Home care · Riverside', 'ok'],
  ],
}

export const RAIL_PANEL_PAGE: DemoPageData = {
  lead: 'Renews Jan 1, 2027 unless notice is sent by Nov 1.',
  stats: [
    ['Annual value', '$84,000', 'Billed quarterly'],
    ['Notice period', '60 days', 'Opens Nov 1'],
    ['Owner', 'Marta O.', 'Legal ops'],
  ],
  rows: [
    ['Nov 1', 'Send notice or renew', 'Owner · Marta Okafor', 'warn'],
    ['Oct 14', 'Pricing review', 'Finance · done', 'ok'],
    ['Sep 30', 'Usage report received', 'Vendor · Quill Studio', 'ok'],
  ],
}

export const ICON_RAIL_PAGE: DemoPageData = {
  lead: '3 agents are working on 128 accounts.',
  stats: [
    ['Accounts', '128', '14 new this week'],
    ['Briefs ready', '36', 'Waiting for review'],
    ['Signals', '212', 'Last 24 hours'],
  ],
  rows: [
    ['2m', 'Halvorsen Marine', 'Scout · new hiring signal', 'ok'],
    ['18m', 'Amberline Health', 'Brief writer · draft ready', 'ok'],
    ['1h', 'Kestrel Robotics', 'Scout · source blocked', 'warn'],
  ],
}

export const GLASS_PAGE: DemoPageData = {
  lead: 'Orders placed this year, one row per order line.',
  stats: [
    ['Rows', '4.8M', '+41k today'],
    ['Size', '2.1 GB', 'Parquet, 64 files'],
    ['Freshness', '6 min', 'Synced from sales_db'],
  ],
  rows: [
    ['order_id', 'BIGINT', 'Primary key', 'ok'],
    ['customer_id', 'BIGINT', 'References customers', 'ok'],
    ['amount', 'DECIMAL(12,2)', '12 nulls this week', 'warn'],
    ['placed_at', 'TIMESTAMP', 'UTC', 'ok'],
  ],
}
