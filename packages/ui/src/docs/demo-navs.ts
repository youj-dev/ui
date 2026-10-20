import {
  ActivityIcon,
  BarChartIcon,
  BookOpenIcon,
  BuildingIcon,
  ClockIcon,
  CodeIcon,
  CompassIcon,
  CreditCardIcon,
  DatabaseIcon,
  FileTextIcon,
  InboxIcon,
  KeyIcon,
  LayersIcon,
  LockIcon,
  PlugIcon,
  RocketIcon,
  SettingsIcon,
  ShieldIcon,
  SparklesIcon,
  TerminalIcon,
  UserIcon,
  UsersIcon,
  WebhookIcon,
  ZapIcon,
} from '@youj/icons'
import type { FrameNavSection, FrameTeam, FrameUser } from '../blocks/frame/shell'

/* Navs other than the frame's sample, for the sidebars' stories: a
 * helpdesk for "With your data", and deeper ones for the sidebars built for
 * depth, a documentation handbook for the tree and an admin console for the
 * drill-down. Stories only; they never ship with a block. */

/** A helpdesk's nav, teams and agent: another product's data in the sidebars' "With your data" stories. */
export const SUPPORT_NAV: FrameNavSection[] = [
  {
    id: 'queues',
    label: 'Queues',
    icon: InboxIcon,
    items: [
      { id: 'all-tickets', label: 'All tickets', icon: InboxIcon, badge: 128, badgeLabel: '128 open' },
      { id: 'mine', label: 'Assigned to me', icon: UserIcon, badge: 9, badgeLabel: '9 assigned to you' },
      { id: 'unassigned', label: 'Unassigned', icon: ZapIcon, badge: 4, badgeLabel: '4 waiting' },
      {
        id: 'views',
        label: 'Views',
        icon: LayersIcon,
        items: [
          { id: 'urgent', label: 'Urgent', badge: 2 },
          { id: 'waiting', label: 'Waiting on customer' },
          { id: 'solved', label: 'Solved this week' },
        ],
      },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: UsersIcon,
    items: [
      { id: 'companies', label: 'Companies', icon: BuildingIcon },
      { id: 'people', label: 'People', icon: UsersIcon },
      { id: 'assistant', label: 'Reply assistant', icon: SparklesIcon, badge: 'Beta' },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: BarChartIcon,
    items: [
      { id: 'satisfaction', label: 'Satisfaction', icon: BarChartIcon },
      { id: 'response-times', label: 'Response times', icon: ClockIcon },
      { id: 'macros', label: 'Macros', icon: SettingsIcon },
    ],
  },
]

export const SUPPORT_TEAMS: FrameTeam[] = [
  { id: 'relay', name: 'Relay Support', detail: 'Business · 24 agents' },
  { id: 'relay-eu', name: 'Relay EU', detail: 'Business · 9 agents' },
]

export const SUPPORT_USER: FrameUser = { name: 'Mateo Rossi', email: 'mateo@relay.help' }

/** A handbook three and four levels deep: the tree's story. */
export const DOCS_NAV: FrameNavSection[] = [
  {
    id: 'start',
    label: 'Get started',
    icon: CompassIcon,
    items: [
      { id: 'introduction', label: 'Introduction', icon: BookOpenIcon },
      {
        id: 'installation',
        label: 'Installation',
        icon: TerminalIcon,
        items: [
          { id: 'install-next', label: 'Next.js' },
          { id: 'install-vite', label: 'Vite' },
          { id: 'install-remix', label: 'Remix' },
        ],
      },
      { id: 'quickstart', label: 'Quickstart', icon: RocketIcon },
    ],
  },
  {
    id: 'guides',
    label: 'Guides',
    icon: LayersIcon,
    items: [
      {
        id: 'deploying',
        label: 'Deploying',
        icon: RocketIcon,
        items: [
          { id: 'environments', label: 'Environments' },
          { id: 'previews', label: 'Preview deployments' },
          {
            id: 'rollbacks',
            label: 'Rollbacks',
            items: [
              { id: 'rollback-instant', label: 'Instant rollback' },
              { id: 'rollback-scheduled', label: 'Scheduled rollback', badge: 'New' },
            ],
          },
          { id: 'domains', label: 'Custom domains' },
        ],
      },
      {
        id: 'data',
        label: 'Data',
        icon: DatabaseIcon,
        items: [
          { id: 'migrations', label: 'Migrations' },
          { id: 'backups', label: 'Backups' },
          { id: 'replication', label: 'Read replicas' },
        ],
      },
      {
        id: 'observability',
        label: 'Observability',
        icon: ActivityIcon,
        items: [
          { id: 'logs', label: 'Logs' },
          { id: 'traces', label: 'Traces' },
          { id: 'alerts', label: 'Alerts', badge: 3, badgeLabel: '3 firing' },
        ],
      },
    ],
  },
  {
    id: 'reference',
    label: 'Reference',
    icon: FileTextIcon,
    items: [
      { id: 'cli', label: 'CLI', icon: TerminalIcon },
      {
        id: 'rest-api',
        label: 'REST API',
        icon: CodeIcon,
        items: [
          { id: 'api-auth', label: 'Authentication' },
          { id: 'api-projects', label: 'Projects' },
          { id: 'api-deployments', label: 'Deployments' },
          { id: 'api-webhooks', label: 'Webhooks' },
        ],
      },
    ],
  },
]

/** An admin console four levels deep: the drill-down's story. */
export const ADMIN_NAV: FrameNavSection[] = [
  {
    id: 'organization',
    label: 'Organization',
    icon: BuildingIcon,
    items: [
      { id: 'org-overview', label: 'Overview', icon: CompassIcon },
      { id: 'org-members', label: 'Members', icon: UsersIcon, badge: 3, badgeLabel: '3 invites pending' },
      {
        id: 'teams',
        label: 'Teams',
        icon: LayersIcon,
        items: [
          {
            id: 'team-design',
            label: 'Design',
            items: [
              { id: 'design-members', label: 'Members' },
              { id: 'design-projects', label: 'Projects', badge: 8 },
              { id: 'design-settings', label: 'Settings' },
            ],
          },
          {
            id: 'team-platform',
            label: 'Platform',
            items: [
              { id: 'platform-members', label: 'Members' },
              { id: 'platform-projects', label: 'Projects', badge: 14 },
              { id: 'platform-on-call', label: 'On-call' },
            ],
          },
          { id: 'team-new', label: 'New team' },
        ],
      },
      {
        id: 'billing',
        label: 'Billing',
        icon: CreditCardIcon,
        items: [
          { id: 'billing-plan', label: 'Plan' },
          { id: 'billing-invoices', label: 'Invoices', badge: 2, badgeLabel: '2 due' },
          { id: 'billing-methods', label: 'Payment methods' },
        ],
      },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    icon: ShieldIcon,
    items: [
      { id: 'sso', label: 'Single sign-on', icon: LockIcon },
      {
        id: 'api-keys',
        label: 'API keys',
        icon: KeyIcon,
        items: [
          { id: 'keys-production', label: 'Production' },
          { id: 'keys-staging', label: 'Staging' },
        ],
      },
      { id: 'audit-log', label: 'Audit log', icon: FileTextIcon },
    ],
  },
  {
    id: 'developers',
    label: 'Developers',
    icon: CodeIcon,
    items: [
      { id: 'webhooks', label: 'Webhooks', icon: WebhookIcon },
      {
        id: 'integrations',
        label: 'Integrations',
        icon: PlugIcon,
        items: [
          { id: 'source-control', label: 'Source control' },
          { id: 'chat', label: 'Chat', badge: 'New' },
          { id: 'issue-tracker', label: 'Issue tracker' },
        ],
      },
    ],
  },
]
