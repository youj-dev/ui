import { useLayoutEffect, useState, type ComponentProps, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChevronsUpDownIcon, FolderIcon, LifeBuoyIcon, MoreHorizontalIcon, PlusIcon } from '@youj/icons'
import { BarChartIcon } from '@youj/icons/components/youj/icons/bar-chart'
import { HomeIcon } from '@youj/icons/components/youj/icons/home'
import { InboxIcon } from '@youj/icons/components/youj/icons/inbox'
import { LayersIcon } from '@youj/icons/components/youj/icons/layers'
import { SearchIcon } from '@youj/icons/components/youj/icons/search'
import { SendIcon } from '@youj/icons/components/youj/icons/send'
import { SettingsIcon } from '@youj/icons/components/youj/icons/settings'
import { TerminalIcon } from '@youj/icons/components/youj/icons/terminal'
import { YoujProvider, ThemeScope } from '@youj/core/lib/youj/provider'
import { Avatar, AvatarFallback } from './avatar'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './breadcrumb'
import { Collapsible, CollapsibleChevron, CollapsibleContent, CollapsibleTrigger } from './collapsible'
import { Kbd, KbdGroup } from './kbd'
import { Separator } from './separator'
import { Button } from './button'
import { Progress, ProgressLabel, ProgressValue } from './progress'
import {
  Sidebar,
  SidebarCard,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from './sidebar'

type SidebarProps = ComponentProps<typeof Sidebar>

const meta: Meta<SidebarProps> = {
  title: 'UI/Navigation/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'shadcn\'s sidebar, re-skinned. It collapses to icons with a width animation on the slow token: labels, badges and actions fade out before the width goes and back in after it returns, group labels fold away and nested lists close their height, so nothing squashes or truncates on the way. The current page wears a raised key, one motion SlidingIndicator for the whole content that glides across groups; when the page sits in a closed nested group, or the sidebar is down to icons, the key moves to that group\'s own item. Collapsed items show their label in the shared Tooltip on the inline-end side. ⌘B / Ctrl+B toggles (never while typing). Below `md` the sidebar becomes the shared Sheet, sliding in from its own edge: focus is trapped inside, Escape or the scrim closes it, and following a link should too (call `setOpenMobile(false)` from `useSidebar()`). `side="left"` is the inline-start edge and mirrors under RTL.',
      },
    },
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['sidebar', 'floating', 'inset'] },
    collapsible: { control: 'inline-radio', options: ['icon', 'offcanvas', 'none'] },
    side: { control: 'inline-radio', options: ['left', 'right'] },
  },
  args: { variant: 'sidebar', collapsible: 'icon', side: 'left' },
}
export default meta
type Story = StoryObj<SidebarProps>

const ICON = { size: 16, strokeWidth: 1.75 }

const PLATFORM = [
  { id: 'home', label: 'Home', icon: <HomeIcon {...ICON} /> },
  { id: 'inbox', label: 'Inbox', icon: <InboxIcon {...ICON} />, badge: 3 },
  { id: 'deployments', label: 'Deployments', icon: <SendIcon {...ICON} /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChartIcon {...ICON} /> },
  { id: 'logs', label: 'Logs', icon: <TerminalIcon {...ICON} /> },
]

const PROJECTS = [
  { id: 'web', label: 'web', pages: ['Overview', 'Deployments', 'Settings'] },
  { id: 'docs', label: 'docs', pages: ['Overview', 'Deployments'] },
  { id: 'api', label: 'api-gateway-production-eu-west', pages: ['Overview', 'Logs'] },
]

function WorkspaceSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" tooltip="Acme, Pro plan">
          <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-md bg-fg text-ui-sm font-semibold text-canvas">
            A
          </span>
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate font-semibold text-fg">Acme</span>
            <span className="truncate text-ui-sm text-fg-muted">Pro plan</span>
          </span>
          <ChevronsUpDownIcon className="ms-auto text-fg-muted" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function AppSidebar({ page, onNavigate, ...props }: SidebarProps & { page: string; onNavigate: (page: string) => void }) {
  const { isMobile, setOpenMobile } = useSidebar()
  const go = (next: string) => (event: { preventDefault: () => void }) => {
    event.preventDefault()
    onNavigate(next)
    if (isMobile) setOpenMobile(false)
  }
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Search ⌘K">
              <SearchIcon {...ICON} />
              <span>Search</span>
            </SidebarMenuButton>
            <SidebarMenuBadge>
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            </SidebarMenuBadge>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {PLATFORM.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={page === item.id}
                    tooltip={item.label}
                    render={<a href={`#${item.id}`} aria-current={page === item.id ? 'page' : undefined} onClick={go(item.id)} />}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                  {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupAction aria-label="New project">
            <PlusIcon />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {PROJECTS.map((project, index) => (
                <Collapsible key={project.id} defaultOpen={index === 0} render={<SidebarMenuItem />}>
                  <CollapsibleTrigger render={<SidebarMenuButton tooltip={project.label} />}>
                    <FolderIcon />
                    <span>{project.label}</span>
                    <CollapsibleChevron size={14} className="ms-auto text-fg-muted" />
                  </CollapsibleTrigger>
                  {/* Kept mounted so the current page's key can find its group while it is closed. */}
                  <CollapsibleContent keepMounted>
                    <SidebarMenuSub>
                      {project.pages.map((p) => {
                        const id = `${project.id}/${p.toLowerCase()}`
                        return (
                          <SidebarMenuSubItem key={id}>
                            <SidebarMenuSubButton href={`#${id}`} isActive={page === id} aria-current={page === id ? 'page' : undefined} onClick={go(id)}>
                              <span>{p}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={page === 'settings'}
                  tooltip="Settings"
                  render={<a href="#settings" aria-current={page === 'settings' ? 'page' : undefined} onClick={go('settings')} />}
                >
                  <SettingsIcon {...ICON} />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Help & support" render={<a href="#support" onClick={go('support')} />}>
                  <LifeBuoyIcon />
                  <span>Help & support</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Ada Lovelace">
              <Avatar size="sm" className="size-8">
                <AvatarFallback>AL</AvatarFallback>
              </Avatar>
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate font-medium text-fg">Ada Lovelace</span>
                <span className="truncate text-ui-sm text-fg-muted">ada@acme.com</span>
              </span>
            </SidebarMenuButton>
            <SidebarMenuAction aria-label="Account options" showOnHover>
              <MoreHorizontalIcon />
            </SidebarMenuAction>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

const TITLES: Record<string, string> = {
  home: 'Home',
  inbox: 'Inbox',
  deployments: 'Deployments',
  analytics: 'Analytics',
  logs: 'Logs',
  settings: 'Settings',
  support: 'Help & support',
}

function Shell({ defaultOpen = true, initialPage = 'deployments', ...props }: SidebarProps & { defaultOpen?: boolean; initialPage?: string }) {
  const [page, setPage] = useState(initialPage)
  const [project, sub] = page.split('/')
  const title = sub ? `${PROJECTS.find((p) => p.id === project)?.label} · ${sub[0]!.toUpperCase()}${sub.slice(1)}` : (TITLES[page] ?? page)
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar page={page} onNavigate={setPage} {...props} />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="me-1 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#acme">Acme</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <span className="ms-auto hidden items-center gap-1.5 text-ui-sm text-fg-muted sm:inline-flex">
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>B</Kbd>
            </KbdGroup>
            toggles the sidebar
          </span>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <h1 className="text-[22px] font-semibold tracking-tight text-fg">{title}</h1>
          <div className="grid gap-3 sm:grid-cols-3">
            {['Requests', 'Errors', 'p95 latency'].map((label, i) => (
              <div key={label} className="rounded-xl border border-line bg-surface p-4">
                <p className="text-ui-sm text-fg-muted">{label}</p>
                <p dir="auto" className="mt-1 text-[20px] font-semibold tracking-tight text-fg tabular-nums">{['1.28M', '0.02%', '82 ms'][i]}</p>
              </div>
            ))}
          </div>
          <div className="flex-1 rounded-xl border border-dashed border-line" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

/** Pick pages: the key glides between them, across groups. Collapse with the trigger or ⌘B: labels fade, then the width closes. */
export const Hero: Story = {
  render: (args) => <Shell {...args} />,
}

/** Starts collapsed to icons. Hover an item for its tooltip; the current page (inside the web project) shows its key on the project's item. */
export const Collapsed: Story = {
  render: (args) => <Shell {...args} defaultOpen={false} initialPage="web/deployments" />,
}

/** Floating and inset variants. */
export const Floating: Story = {
  args: { variant: 'floating' },
  render: (args) => <Shell {...args} />,
}

export const Inset: Story = {
  args: { variant: 'inset' },
  render: (args) => <Shell {...args} />,
}

/** Off-canvas: the whole panel slides out while the page takes its space. */
export const OffCanvas: Story = {
  args: { collapsible: 'offcanvas' },
  render: (args) => <Shell {...args} />,
}

/** On the other side. */
export const RightSide: Story = {
  args: { side: 'right' },
  render: (args) => <Shell {...args} />,
}

/** The document in right-to-left, as an RTL app sets it: portaled overlays (the phone sheet) follow it too. */
function RightToLeftDocument({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    const html = document.documentElement
    const previous = html.dir
    html.dir = 'rtl'
    return () => {
      html.dir = previous
    }
  }, [])
  return (
    <ThemeScope dir="rtl">
      <div dir="rtl">{children}</div>
    </ThemeScope>
  )
}

/** dir="rtl": the sidebar sits on the right, collapses toward it, tooltips open to its left, and on a phone the sheet slides in from the right. */
export const RightToLeft: Story = {
  render: (args) => (
    <RightToLeftDocument>
      <Shell {...args} />
    </RightToLeftDocument>
  ),
}

/** Reduced motion: collapsing, the key and the tooltips change at once. */
export const ReducedMotion: Story = {
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <Shell {...args} />
    </YoujProvider>
  ),
}

/** One sidebar's rows for the parts below: a raised switcher tile, counts plain or as pills (danger is loud), and a card at the foot. */
function Parts({ indicator, label }: { indicator: 'raised' | 'fill' | 'mark'; label: string }) {
  const [page, setPage] = useState('inbox')
  const counts = indicator === 'mark' ? 'pill' : 'plain'
  return (
    <SidebarProvider className="min-h-0 w-auto">
      <Sidebar collapsible="none" className="h-[34rem] rounded-surface ring-1 ring-line">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton variant="raised" size="lg">
                <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-md bg-accent text-ui-sm font-semibold text-on-accent">
                  A
                </span>
                <span className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="truncate font-semibold">Acme</span>
                  <span className="truncate text-ui-sm text-fg-muted">indicator="{indicator}"</span>
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent indicator={indicator}>
          <SidebarGroup>
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarMenu>
              {PLATFORM.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton isActive={page === item.id} onClick={() => setPage(item.id)}>
                    {item.icon}
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                  {item.id === 'inbox' && (
                    <SidebarMenuBadge variant={counts} tone="danger">
                      3
                    </SidebarMenuBadge>
                  )}
                  {item.id === 'deployments' && <SidebarMenuBadge variant={counts}>24</SidebarMenuBadge>}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarCard>
            <Progress value={810} max={3100} className="gap-y-1.5">
              <ProgressLabel className="text-ui-sm font-normal text-fg-muted">Credits used</ProgressLabel>
              <ProgressValue className="text-ui-sm tabular-nums">{() => '810 / 3,100'}</ProgressValue>
            </Progress>
            <Button size="sm" variant="outline">
              Buy credits
            </Button>
          </SidebarCard>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  )
}

/**
 * The current page three ways, `SidebarContent indicator`: a raised key (default), a quiet fill (shadcn's look) and an
 * accent mark on the edge. Also: `SidebarMenuButton variant="raised"` (the switcher), `SidebarMenuBadge` `tone="danger"`
 * and `variant="pill"`, and `SidebarCard` at the foot.
 */
export const IndicatorsAndParts: Story = {
  name: 'Indicators, counts and the card',
  render: () => (
    <div className="flex flex-wrap gap-6 bg-canvas p-6">
      <Parts indicator="raised" label="Raised" />
      <Parts indicator="fill" label="Fill" />
      <Parts indicator="mark" label="Mark" />
    </div>
  ),
}

/** `surface="glass"`: the sidebar frosts whatever is behind it (the phone's sheet too). */
export const Glass: Story = {
  render: (args) => (
    <div className="bg-[linear-gradient(135deg,var(--color-chart-1),var(--color-chart-3),var(--color-chart-4))]">
      <Shell {...args} variant="floating" surface="glass" />
    </div>
  ),
}

/** Loading: skeleton rows in place of the projects. */
export const Loading: Story = {
  render: (args) => (
    <SidebarProvider>
      <Sidebar {...args}>
        <SidebarHeader>
          <WorkspaceSwitcher />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>
              <LayersIcon {...ICON} className="me-2" />
              Projects
            </SidebarGroupLabel>
            <SidebarMenu aria-busy>
              {Array.from({ length: 5 }, (_, i) => (
                <SidebarMenuItem key={i}>
                  <SidebarMenuSkeleton showIcon />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset />
    </SidebarProvider>
  ),
}
