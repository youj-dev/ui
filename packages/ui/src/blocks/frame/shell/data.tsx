import {
  BarChartIcon,
  CalendarIcon,
  FileTextIcon,
  FolderIcon,
  HomeIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  ListChecksIcon,
  SettingsIcon,
  SparklesIcon,
  UsersIcon,
} from '@youj/icons'
import type { FrameNavSection, FrameTeam, FrameUser } from './model'

/* Sample data for a frame: replace it with your own. Every part reads NAV
 * through AppFrame; the account parts take USER, the workspace switcher
 * TEAMS. Give items an `href` to route with links, and pass `active` from
 * your router to AppFrame. */

export const NAV: FrameNavSection[] = [
  {
    id: 'general',
    label: 'General',
    icon: HomeIcon,
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboardIcon },
      { id: 'inbox', label: 'Inbox', icon: InboxIcon, badge: 4, badgeLabel: '4 unread' },
      { id: 'tasks', label: 'My tasks', icon: ListChecksIcon, badge: 12, badgeLabel: '12 open' },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    icon: LayoutGridIcon,
    items: [
      {
        id: 'projects',
        label: 'Projects',
        icon: FolderIcon,
        items: [
          { id: 'atlas', label: 'Atlas' },
          { id: 'borealis', label: 'Borealis', badge: 'New' },
          { id: 'cirrus', label: 'Cirrus' },
        ],
      },
      { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
      { id: 'documents', label: 'Documents', icon: FileTextIcon },
      { id: 'assistant', label: 'Assistant', icon: SparklesIcon },
      { id: 'reports', label: 'Reports', icon: BarChartIcon },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: SettingsIcon,
    items: [
      { id: 'members', label: 'Members', icon: UsersIcon },
      { id: 'settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
]

export const USER: FrameUser = { name: 'Ada Lovelace', email: 'ada@northwind.dev' }

export const TEAMS: FrameTeam[] = [
  { id: 'northwind', name: 'Northwind Labs', detail: 'Pro · 12 members' },
  { id: 'acme', name: 'Acme Corp', detail: 'Enterprise' },
  { id: 'personal', name: 'Personal', detail: 'Free' },
]
