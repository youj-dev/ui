'use client'

import { useState, type CSSProperties, type MouseEvent } from 'react'
import {
  Avatar,
  AvatarFallback,
  Collapsible,
  CollapsibleChevron,
  CollapsibleContent,
  CollapsibleTrigger,
  Kbd,
  KbdGroup,
  Separator,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@youj/react'
import { BarChartIcon, FolderIcon, HomeIcon, InboxIcon, MoreHorizontalIcon, PlusIcon, SendIcon, TerminalIcon } from '@youj/icons'

const PLATFORM = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'inbox', label: 'Inbox', Icon: InboxIcon, badge: 3 },
  { id: 'deployments', label: 'Deployments', Icon: SendIcon },
  { id: 'analytics', label: 'Analytics', Icon: BarChartIcon },
  { id: 'logs', label: 'Logs', Icon: TerminalIcon },
]

const PROJECTS = [
  { id: 'web', pages: ['Overview', 'Deployments', 'Settings'] },
  { id: 'docs', pages: ['Overview', 'Deployments'] },
]

export default function SidebarDemo() {
  const [page, setPage] = useState('deployments')
  // In an app these are router links. Here they switch the page in place.
  const go = (next: string) => (event: MouseEvent) => {
    event.preventDefault()
    setPage(next)
  }
  const title = PLATFORM.find((item) => item.id === page)?.label ?? page.replace('/', ' · ')

  return (
    // Contained for the preview: in an app, the provider fills the viewport.
    <SidebarProvider className="h-[480px] min-h-0" style={{ '--sidebar-height': '480px' } as CSSProperties}>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" tooltip="Acme, Pro plan">
                <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-md bg-fg text-ui-sm font-semibold text-canvas">
                  A
                </span>
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate font-semibold text-fg">Acme</span>
                  <span className="truncate text-ui-sm text-fg-muted">Pro plan</span>
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
              {PLATFORM.map(({ id, label, Icon, badge }) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton
                    isActive={page === id}
                    tooltip={label}
                    render={<a href={`/${id}`} aria-current={page === id ? 'page' : undefined} onClick={go(id)} />}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </SidebarMenuButton>
                  {badge && <SidebarMenuBadge>{badge}</SidebarMenuBadge>}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
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
                    <CollapsibleTrigger render={<SidebarMenuButton tooltip={project.id} />}>
                      <FolderIcon size={16} />
                      <span>{project.id}</span>
                      <CollapsibleChevron size={14} className="ms-auto text-fg-muted" />
                    </CollapsibleTrigger>
                    {/* Kept mounted, so the current page's key can find its group while it's closed. */}
                    <CollapsibleContent keepMounted>
                      <SidebarMenuSub>
                        {project.pages.map((name) => {
                          const id = `${project.id}/${name.toLowerCase()}`
                          return (
                            <SidebarMenuSubItem key={id}>
                              <SidebarMenuSubButton href={`/${id}`} isActive={page === id} aria-current={page === id ? 'page' : undefined} onClick={go(id)}>
                                <span>{name}</span>
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
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" tooltip="Ada Lovelace">
                <Avatar size="sm" className="size-8" aria-hidden>
                  <AvatarFallback>AL</AvatarFallback>
                </Avatar>
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate font-medium text-fg">Ada Lovelace</span>
                  <span className="truncate text-ui-sm text-fg-muted">ada@acme.dev</span>
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
      {/* In an app this is <SidebarInset>, your page's <main>. The docs page already has one, so this is a div. */}
      <div className="relative flex min-w-0 flex-1 flex-col bg-canvas">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="me-1 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center" />
          <p className="truncate text-ui font-medium text-fg capitalize">{title}</p>
          <span className="ms-auto hidden items-center gap-1.5 text-ui-sm text-fg-muted sm:inline-flex">
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>B</Kbd>
            </KbdGroup>
            toggles the sidebar
          </span>
        </header>
        <div className="grid flex-1 content-start gap-3 p-5 sm:grid-cols-2">
          {['Requests', 'Error rate', 'p95 latency', 'Bandwidth'].map((label, i) => (
            <div key={label} className="rounded-xl border border-line bg-surface p-4">
              <p className="text-ui-sm text-fg-muted">{label}</p>
              <p className="mt-1 text-xl font-semibold tracking-tight text-fg tabular-nums">{['1.28M', '0.02%', '82 ms', '48 GB'][i]}</p>
            </div>
          ))}
        </div>
      </div>
    </SidebarProvider>
  )
}
