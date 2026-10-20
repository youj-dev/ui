import { IN_APP_SCREENS } from './screens.generated'

/* What a frame is made of, as data: the choices Create offers, the frame
 * block each one installs and the component it renders, the screens it holds,
 * and the frame's place in a URL. Plain TypeScript with no React, so the docs
 * page, the preview, the code export, the stories and the CLI all read the
 * same list. A new variant is a row here plus its block in src/blocks/frame; a
 * new screen is `inApp` in taxonomy.json (screens.generated.ts lists them). */

export const SIDEBARS = ['classic', 'workspace', 'rail-panel', 'icon-rail', 'glass'] as const
export const TOPBARS = ['breadcrumb', 'tabs', 'search', 'minimal'] as const
export const ACCOUNTS = ['card', 'menu', 'status'] as const
export const SEARCHES = ['palette', 'field', 'none'] as const
export const BRANDS = ['workspace', 'logo'] as const
export const MOBILE_NAVS = ['sheet', 'tabs'] as const

export type SidebarKind = (typeof SIDEBARS)[number]
export type TopbarKind = (typeof TOPBARS)[number]
export type AccountKind = (typeof ACCOUNTS)[number]
export type SearchKind = (typeof SEARCHES)[number]
export type BrandKind = (typeof BRANDS)[number]
export type MobileNavKind = (typeof MOBILE_NAVS)[number]

export interface FrameConfig {
  sidebar: SidebarKind
  topbar: TopbarKind
  account: AccountKind
  search: SearchKind
  /** The sidebar's header: the workspace switcher or the product's logo. */
  brand: BrandKind
  /** Below `md`: the sidebar as a sheet, or a bottom tab bar as well. */
  mobile: MobileNavKind
  /** A bell in the top bar. */
  notifications: boolean
  /** A plan card above the sidebar's footer. */
  upgrade: boolean
  /** The screens in the frame, by registry name, in nav order (screensInNavOrder): each is an item in the nav and a route in the export, and the first is home. None is the frame alone. */
  screens: string[]
}

/** The frame Create opens on: the one most apps start from. */
export const DEFAULT_FRAME: FrameConfig = {
  sidebar: 'classic',
  topbar: 'breadcrumb',
  account: 'card',
  search: 'palette',
  brand: 'workspace',
  mobile: 'sheet',
  notifications: true,
  upgrade: true,
  screens: ['app-analytics-overview', 'app-task-board', 'app-settings'],
}

export interface Part {
  /** The file in src/blocks/frame, and so the registry item `frame-<file>`. */
  file: string
  /** The component it exports. */
  component: string
  label: string
  /** One line for Create's option. */
  description: string
}

export const SIDEBAR_PARTS: Record<SidebarKind, Part> = {
  classic: { file: 'sidebar-classic', component: 'FrameSidebarClassic', label: 'Classic', description: 'Labeled groups, icons and counts; resizes, and folds to icons.' },
  workspace: { file: 'sidebar-workspace', component: 'FrameSidebarWorkspace', label: 'Workspace', description: 'Raised rows on the gray chrome, a command field, spaces and live state.' },
  'rail-panel': { file: 'sidebar-rail-panel', component: 'FrameSidebarRailPanel', label: 'Rail + panel', description: 'Round keys for sections beside a panel of their pages as a tree.' },
  'icon-rail': { file: 'sidebar-icon-rail', component: 'FrameSidebarIconRail', label: 'Icon rail', description: 'A slim rail of icons; a bottom tab bar on phones.' },
  glass: { file: 'sidebar-glass', component: 'FrameSidebarGlass', label: 'Glass explorer', description: 'Frosted nav and an explorer tree over a backdrop.' },
}

/** Sidebars merged into another before launch, by the choice an older link names: a link to one opens the one that took it in. */
export const SIDEBAR_ALIASES: Record<string, SidebarKind> = {
  floating: 'classic',
  editorial: 'classic',
  dual: 'rail-panel',
  rail: 'rail-panel',
  flyout: 'rail-panel',
  drill: 'rail-panel',
  tree: 'glass',
  command: 'workspace',
  minimal: 'workspace',
  spaces: 'workspace',
  pulse: 'workspace',
}

export const TOPBAR_PARTS: Record<TopbarKind, Part> = {
  breadcrumb: { file: 'topbar-breadcrumb', component: 'FrameTopbarBreadcrumb', label: 'Breadcrumb', description: 'Where you are, then search and account.' },
  tabs: { file: 'topbar-tabs', component: 'FrameTopbarTabs', label: 'Tabs', description: 'The page title over its views as tabs.' },
  search: { file: 'topbar-search', component: 'FrameTopbarSearch', label: 'Centered search', description: 'Search in the middle, where it’s the point.' },
  minimal: { file: 'topbar-minimal', component: 'FrameTopbarMinimal', label: 'Minimal', description: 'The title, one action and the bell.' },
}

export const ACCOUNT_PARTS: Record<AccountKind, Part> = {
  card: { file: 'account-card', component: 'FrameAccountCard', label: 'Sidebar card', description: 'Name and email at the foot of the sidebar.' },
  menu: { file: 'account-menu', component: 'FrameAccountMenu', label: 'Avatar menu', description: 'An avatar in the top bar that opens the menu.' },
  status: { file: 'account-status', component: 'FrameAccountStatus', label: 'Status', description: 'A compact pill with your presence.' },
}

export const SEARCH_PARTS: Record<Exclude<SearchKind, 'none'>, Part> = {
  palette: { file: 'search-palette', component: 'FrameSearchPalette', label: '⌘K palette', description: 'A search button that opens the command palette.' },
  field: { file: 'search-field', component: 'FrameSearchField', label: 'Inline field', description: 'A field in the bar that suggests pages as you type.' },
}

export const BRAND_PARTS: Record<BrandKind, Part> = {
  workspace: { file: 'workspace', component: 'FrameWorkspace', label: 'Workspace', description: 'Switch between teams from the top of the sidebar.' },
  logo: { file: 'shell', component: 'FrameLogo', label: 'Logo', description: 'Your mark and name.' },
}

export const NOTIFICATIONS_PART: Part = { file: 'notifications', component: 'FrameNotifications', label: 'Notifications', description: 'A bell with an unread count.' }
export const UPGRADE_PART: Part = { file: 'upgrade-card', component: 'FrameUpgradeCard', label: 'Upgrade card', description: 'The plan’s usage and an upgrade.' }
export const FRAME_PART: Part = { file: 'shell', component: 'AppFrame', label: 'Shell', description: 'The layout every part fits into.' }

export const MOBILE_LABELS: Record<MobileNavKind, string> = { sheet: 'Sheet', tabs: 'Tab bar' }

/* ── The screens ─────────────────────────────────────────────────────── */

/** Where a screen's nav item sits: the groups an app's nav has. */
export type NavGroup = 'general' | 'workspace' | 'admin'

/** A screen Create offers: a screen block that lives in an app's content area (taxonomy.json's inApp). */
export interface ScreenPart {
  /** Its registry item, which the export installs: `app-task-board`. */
  name: string
  label: string
  description: string
  /** Its category on the Screens level, which the picker groups by. */
  category: string
  categoryLabel: string
  /** Where the block installs, without the extension: `blocks/app/task-board`. */
  file: string
  /** The component it exports. */
  component: string
  /** The export's route for it, `app/(app)/<route>/page.tsx`, and its id in a link: `task-board`. */
  route: string
  /** Its nav item's group. */
  group: NavGroup
  /** Its nav item's icon, by component name in @youj/icons. */
  icon: string
}

/** Each category's group in the nav: what you look at first, what you work in, and the admin at the bottom. */
const CATEGORY_GROUPS: Record<string, NavGroup> = {
  dashboards: 'general',
  'data-and-lists': 'general',
  'workspaces-and-tools': 'workspace',
  'content-and-docs': 'workspace',
  'settings-and-account': 'admin',
}

/** A screen's nav icon; one not named here takes its category's. */
const SCREEN_ICONS: Record<string, string> = {
  'app-ai-workspace': 'SparklesIcon',
  'app-analytics-overview': 'LineChartIcon',
  'app-api-keys': 'KeyIcon',
  'app-billing': 'CreditCardIcon',
  'app-collaborative-canvas': 'PenToolIcon',
  'app-customers': 'ContactIcon',
  'app-file-manager': 'FolderIcon',
  'app-logistics': 'RouteIcon',
  'app-funnel-report': 'FunnelIcon',
  'app-integrations': 'PlugIcon',
  'app-list-detail': 'LayoutListIcon',
  'app-money-overview': 'WalletIcon',
  'app-music-studio': 'MusicIcon',
  'app-notification-inbox': 'InboxIcon',
  'app-profile': 'UserIcon',
  'app-record-drawer': 'PanelRightIcon',
  'app-records-grid': 'TableIcon',
  'app-search-results': 'SearchIcon',
  'app-settings': 'SettingsIcon',
  'app-spend-overview': 'PieChartIcon',
  'app-task-board': 'KanbanIcon',
  'app-team-members': 'UsersIcon',
  'app-usage-charges': 'ReceiptIcon',
  'app-usage-overview': 'GaugeIcon',
  'app-webhooks': 'WebhookIcon',
  'app-week-calendar': 'CalendarIcon',
  'content-changelog': 'MegaphoneIcon',
  'content-help-center': 'LifeBuoyIcon',
  'content-roadmap': 'SignpostIcon',
}

const CATEGORY_ICONS: Record<string, string> = {
  dashboards: 'LayoutDashboardIcon',
  'data-and-lists': 'TableIcon',
  'workspaces-and-tools': 'LayoutGridIcon',
  'content-and-docs': 'FileTextIcon',
  'settings-and-account': 'SettingsIcon',
}

/** The categories in the order the picker lists them: as the nav's groups run, then by name. */
const CATEGORY_ORDER = Object.keys(CATEGORY_GROUPS)
const categoryRank = (category: string) => (CATEGORY_ORDER.includes(category) ? CATEGORY_ORDER.indexOf(category) : CATEGORY_ORDER.length)

/** Every screen Create offers, by registry name, in the order the picker lists them: by category, then by name. */
export const SCREENS: Record<string, ScreenPart> = Object.fromEntries(
  [...IN_APP_SCREENS]
    .sort((a, b) => categoryRank(a.category) - categoryRank(b.category) || a.categoryLabel.localeCompare(b.categoryLabel) || a.label.localeCompare(b.label))
    .map((s) => [
      s.name,
      {
        ...s,
        route: s.name.replace(/^[a-z]+-/, ''),
        group: CATEGORY_GROUPS[s.category] ?? 'workspace',
        icon: SCREEN_ICONS[s.name] ?? CATEGORY_ICONS[s.category] ?? 'SquareIcon',
      },
    ]),
)

/** A screen by its registry name or its id in a link (`app-task-board` or `task-board`). */
export function screenOf(id: string): ScreenPart | undefined {
  return SCREENS[id] ?? Object.values(SCREENS).find((s) => s.route === id)
}

/** The groups an app's nav sorts its screens into, in order. */
export const NAV_GROUPS: Record<NavGroup, { label: string; icon: string }> = {
  general: { label: 'General', icon: 'HomeIcon' },
  workspace: { label: 'Workspace', icon: 'LayoutGridIcon' },
  admin: { label: 'Admin', icon: 'SettingsIcon' },
}
const GROUP_ORDER = Object.keys(NAV_GROUPS) as NavGroup[]

/** Screens in the order the nav shows them: each group's together, General, Workspace then Admin, in the order they were added within it. Unknown names drop out. */
export function screensInNavOrder(screens: readonly string[]): string[] {
  const known = [...new Set(screens)].filter((name) => SCREENS[name])
  return GROUP_ORDER.flatMap((group) => known.filter((name) => SCREENS[name]!.group === group))
}

/** The screens a frame holds, as parts, in nav order: the first is home. */
export function frameScreens(config: Pick<FrameConfig, 'screens'>): ScreenPart[] {
  return screensInNavOrder(config.screens).map((name) => SCREENS[name]!)
}

export interface ScreenNavSection {
  id: NavGroup
  label: string
  /** An icon, by component name in @youj/icons. */
  icon: string
  items: { id: string; label: string; icon: string; screen: string; href: string }[]
}

/**
 * The frame's nav: one item per screen, in its group (groups with none leave out). An item's id is the screen's route,
 * so the preview and the export agree on which item is on which screen; its href is the export's route.
 */
export function screensNav(config: Pick<FrameConfig, 'screens'>): ScreenNavSection[] {
  const screens = frameScreens(config)
  return GROUP_ORDER.map((group) => ({
    id: group,
    ...NAV_GROUPS[group],
    items: screens.filter((s) => s.group === group).map((s) => ({ id: s.route, label: s.label, icon: s.icon, screen: s.name, href: `/${s.route}` })),
  })).filter((section) => section.items.length > 0)
}

/** The account sits in the sidebar (the card) or in the top bar (the rest). */
export function accountInSidebar(config: FrameConfig): boolean {
  return config.account === 'card'
}

/** Every part a frame uses, the frame itself first: with its screens, what `youj add` installs. */
export function framePartsOf(config: FrameConfig): Part[] {
  const parts = [
    FRAME_PART,
    SIDEBAR_PARTS[config.sidebar],
    TOPBAR_PARTS[config.topbar],
    ACCOUNT_PARTS[config.account],
    config.search === 'none' ? null : SEARCH_PARTS[config.search],
    config.brand === 'workspace' ? BRAND_PARTS.workspace : null,
    config.notifications ? NOTIFICATIONS_PART : null,
    config.upgrade ? UPGRADE_PART : null,
  ]
  return parts.filter((p): p is Part => p !== null)
}

/** The registry items to install, one per block: the frame's parts (`frame-sidebar-classic`), then its screens (`app-task-board`). */
export function frameItems(config: FrameConfig): string[] {
  return [...new Set([...framePartsOf(config).map((p) => `frame-${p.file}`), ...frameScreens(config).map((s) => s.name)])]
}

/* ── The frame in a URL ──────────────────────────────────────────────── */

const CHOICES = {
  sidebar: SIDEBARS,
  topbar: TOPBARS,
  account: ACCOUNTS,
  search: SEARCHES,
  brand: BRANDS,
  mobile: MOBILE_NAVS,
} as const satisfies Record<string, readonly string[]>

type ChoiceKey = keyof typeof CHOICES
const TOGGLES = ['notifications', 'upgrade'] as const

/** The URL's `screens` parameter: the frame's screens in nav order by their ids (`screens=analytics-overview,task-board`), empty for none. */
export const SCREENS_PARAM = 'screens'

/**
 * Older links named Create's own pages (`page=board`, `pages=dashboard,table`): each opens as the screen closest to it,
 * `blank` as no screens, and the article (no in-app screen is like it) is left out.
 */
const LEGACY_PAGES: Record<string, string | null> = {
  dashboard: 'app-analytics-overview',
  inbox: 'app-list-detail',
  board: 'app-task-board',
  table: 'app-customers',
  calendar: 'app-week-calendar',
  settings: 'app-settings',
  assistant: 'app-ai-workspace',
  article: null,
  blank: null,
}

/** A choice as a link names it, with a merged sidebar read as the one that took it in. */
const choiceOf = (params: URLSearchParams, key: ChoiceKey) => {
  const value = params.get(key)
  return key === 'sidebar' && value ? (SIDEBAR_ALIASES[value] ?? value) : value
}

const listOf = (value: string | null) => (value ?? '').split(',').filter(Boolean)

/** The choices and screens a link names that Create doesn't offer (`sidebar=nonsense`, `screens=…,nonsense`), as `name=value`: readFrame ignores them. */
export function unknownChoices(params: URLSearchParams): string[] {
  const choices = (Object.keys(CHOICES) as ChoiceKey[]).flatMap((key) => {
    const value = choiceOf(params, key)
    return value && !(CHOICES[key] as readonly string[]).includes(value) ? [`${key}=${params.get(key)}`] : []
  })
  const screens = listOf(params.get(SCREENS_PARAM)).filter((id) => !screenOf(id)).map((id) => `${SCREENS_PARAM}=${id}`)
  return [...choices, ...screens]
}

/** The screens a link names: `screens`, or an older link's `page` and `pages`; undefined when it names none (the default's). */
function readScreens(params: URLSearchParams): string[] | undefined {
  if (params.has(SCREENS_PARAM)) return listOf(params.get(SCREENS_PARAM)).flatMap((id) => screenOf(id)?.name ?? [])
  const page = params.get('page')
  const pages = listOf(params.get('pages'))
  if (!page && !pages.length) return undefined
  const legacy = [...(page ? [page] : []), ...pages].flatMap((p) => LEGACY_PAGES[p] ?? [])
  // An older link of unknown pages alone keeps the default, as an unknown choice does.
  return legacy.length || [page, ...pages].some((p) => p && p in LEGACY_PAGES) ? legacy : undefined
}

/** The frame from URL parameters; anything missing or unknown keeps the default. */
export function readFrame(params: URLSearchParams): FrameConfig {
  const config: FrameConfig = { ...DEFAULT_FRAME }
  for (const key of Object.keys(CHOICES) as ChoiceKey[]) {
    const value = choiceOf(params, key)
    if (value && (CHOICES[key] as readonly string[]).includes(value)) (config as unknown as Record<string, string>)[key] = value
  }
  for (const key of TOGGLES) {
    const value = params.get(key)
    if (value === '1' || value === '0') config[key] = value === '1'
  }
  const screens = readScreens(params)
  config.screens = screensInNavOrder(screens ?? DEFAULT_FRAME.screens)
  return config
}

/** The frame as URL parameters: only what differs from the default, so the link stays short. */
export function writeFrame(config: FrameConfig, params = new URLSearchParams()): URLSearchParams {
  for (const key of Object.keys(CHOICES) as ChoiceKey[]) {
    if (config[key] !== DEFAULT_FRAME[key]) params.set(key, config[key])
    else params.delete(key)
  }
  for (const key of TOGGLES) {
    if (config[key] !== DEFAULT_FRAME[key]) params.set(key, config[key] ? '1' : '0')
    else params.delete(key)
  }
  params.delete('page')
  params.delete('pages')
  const screens = frameScreens(config).map((s) => s.route)
  if (screens.join() !== frameScreens(DEFAULT_FRAME).map((s) => s.route).join()) params.set(SCREENS_PARAM, screens.join(','))
  else params.delete(SCREENS_PARAM)
  return params
}
