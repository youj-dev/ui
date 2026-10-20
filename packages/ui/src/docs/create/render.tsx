'use client'

import { createElement, Suspense, useMemo, useState, type ComponentType, type ReactElement, type ReactNode } from 'react'
import { FrameAccountCard } from '../../blocks/frame/account-card'
import { FrameAccountMenu } from '../../blocks/frame/account-menu'
import { FrameAccountStatus } from '../../blocks/frame/account-status'
import { AppFrame, FrameLogo, type AppFrameProps } from '../../blocks/frame/shell'
import { NAV, TEAMS, USER } from '../../blocks/frame/shell/data'
import { FrameNotifications } from '../../blocks/frame/notifications'
import { FrameSearchField } from '../../blocks/frame/search-field'
import { FrameSearchPalette } from '../../blocks/frame/search-palette'
import { FrameSidebarClassic } from '../../blocks/frame/sidebar-classic'
import { FrameSidebarGlass } from '../../blocks/frame/sidebar-glass'
import { FrameSidebarIconRail } from '../../blocks/frame/sidebar-icon-rail'
import { FrameSidebarRailPanel } from '../../blocks/frame/sidebar-rail-panel'
import { FrameSidebarWorkspace } from '../../blocks/frame/sidebar-workspace'
import { FrameTopbarBreadcrumb } from '../../blocks/frame/topbar-breadcrumb'
import { FrameTopbarMinimal } from '../../blocks/frame/topbar-minimal'
import { FrameTopbarSearch } from '../../blocks/frame/topbar-search'
import { FrameTopbarTabs } from '../../blocks/frame/topbar-tabs'
import { FrameUpgradeCard } from '../../blocks/frame/upgrade-card'
import { FrameWorkspace } from '../../blocks/frame/workspace'
import { AppPage } from '../../components/ui/app-page'
import type { FrameNavSection } from '../../blocks/frame/shell/model'
import { framePlan, type PlanElement, type PlanValue } from './codegen'
import { DEFAULT_FRAME, frameScreens, screensNav, type FrameConfig } from './config'
import { SCREEN_LOADERS } from './screen-loaders.generated'
import { NAV_ICONS } from './screen-icons'

/* A frame from its config, rendered from the same plan the code export
 * prints (codegen.ts), so the preview is the code. Its nav is the frame's
 * screens, and following it shows each one in the frame, so the preview reads
 * as a product you can click through. Stories and Create's preview both use it. */

// Every part's component by the name the plan and the exported code use.
const COMPONENTS: Record<string, ComponentType<Record<string, unknown>>> = {
  AppFrame,
  FrameLogo,
  FrameSidebarClassic,
  FrameSidebarWorkspace,
  FrameSidebarRailPanel,
  FrameSidebarIconRail,
  FrameSidebarGlass,
  FrameTopbarBreadcrumb,
  FrameTopbarTabs,
  FrameTopbarSearch,
  FrameTopbarMinimal,
  FrameAccountCard,
  FrameAccountMenu,
  FrameAccountStatus,
  FrameSearchPalette,
  FrameSearchField,
  FrameWorkspace,
  FrameNotifications,
  FrameUpgradeCard,
} as unknown as Record<string, ComponentType<Record<string, unknown>>>

/** The frame's nav: its screens, in the groups the config gives them. */
const navSections = (config: FrameConfig): FrameNavSection[] =>
  screensNav(config).map((section) => ({
    id: section.id,
    label: section.label,
    icon: NAV_ICONS[section.icon],
    items: section.items.map((item) => ({ id: item.id, label: item.label, icon: NAV_ICONS[item.icon] })),
  }))

const REFS = { NAV, USER, TEAMS }

function value(v: PlanValue): unknown {
  if (Array.isArray(v)) return v.map((node, i) => element(node, undefined, String(i)))
  if (typeof v === 'object' && 'ref' in v) return REFS[v.ref]
  if (typeof v === 'object') return element(v)
  return v
}

function element(node: PlanElement, extra?: Record<string, unknown>, key?: string, children?: ReactNode): ReactElement {
  const Component = COMPONENTS[node.part.component]
  if (!Component) throw new Error(`No component for ${node.part.component}`)
  const props = Object.fromEntries(Object.entries(node.props).map(([k, v]) => [k, value(v)]))
  return createElement(Component, { key, ...props, ...extra }, node.page ? children : undefined)
}

/** A frame with no screens: the frame alone, with room marked out for them, in the AppPage an app's own page would use. */
function NoScreens() {
  return (
    <AppPage data-page="blank" title="Your app" className="min-h-[calc(100dvh-4rem)]" classNames={{ body: 'flex-1 gap-6' }}>
      <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-line-control p-8 text-center">
        <div className="flex max-w-xs flex-col items-center gap-1.5">
          <p className="text-ui font-medium text-fg">No screens yet</p>
          <p className="text-ui text-fg-muted text-pretty">The frame is ready: its nav, its search and its account. Add screens and each one becomes a page in the nav.</p>
        </div>
      </div>
    </AppPage>
  )
}

/** While a screen's code loads: the content area, quiet. */
function Loading() {
  return <div aria-busy className="min-h-[calc(100dvh-4rem)]" />
}

export interface FramePreviewProps {
  /** The parts and the screens, as Create's options. Default: the frame Create opens on. */
  config?: FrameConfig
  /** More AppFrame props, e.g. `defaultCollapsed` or `defaultActive` for a story. */
  frame?: Partial<AppFrameProps>
  /** A page of your own, in place of the config's screens. */
  children?: ReactNode
}

export function FramePreview({ config = DEFAULT_FRAME, frame, children }: FramePreviewProps) {
  const plan = useMemo(() => framePlan(config), [config])
  const screens = frameScreens(config)
  const nav = useMemo(() => navSections(config), [config])
  const [active, setActive] = useState(() => frame?.defaultActive ?? screens[0]?.route)
  // A screen just added opens; one removed gives way to the first.
  const key = screens.map((s) => s.route).join()
  const [seen, setSeen] = useState(key)
  if (seen !== key) {
    const before = seen.split(',')
    const added = screens.filter((s) => !before.includes(s.route)).at(-1)
    setSeen(key)
    setActive(added?.route ?? (screens.some((s) => s.route === active) ? active : screens[0]?.route))
  }
  const onNavigate: AppFrameProps['onNavigate'] = (item, event) => {
    frame?.onNavigate?.(item, event)
    if (event?.defaultPrevented) return
    setActive(item.id)
  }
  // Collapse is held here too, so choosing another sidebar swaps only the
  // sidebar: the screen stays as it was, and the new sidebar opens, gliding
  // there from the last one's width.
  const [collapsed, setCollapsed] = useState(frame?.defaultCollapsed ?? false)
  const [sidebar, setSidebar] = useState(config.sidebar)
  if (sidebar !== config.sidebar) {
    setSidebar(config.sidebar)
    setCollapsed(false)
  }
  const current = frame?.active ?? active
  const screen = screens.find((s) => s.route === current)
  const Screen = screen ? SCREEN_LOADERS[screen.name] : undefined
  return element(
    plan,
    { ...frame, nav, active: current, onNavigate, collapsed: frame?.collapsed ?? collapsed, onCollapsedChange: setCollapsed },
    undefined,
    children ?? (Screen ? <Suspense key={screen!.name} fallback={<Loading />}><Screen /></Suspense> : <NoScreens />),
  )
}
