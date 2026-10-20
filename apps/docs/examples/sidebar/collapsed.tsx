'use client'

import { useState, type CSSProperties, type MouseEvent } from 'react'
import {
  Collapsible,
  CollapsibleChevron,
  CollapsibleContent,
  CollapsibleTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@youj/react'
import { FolderIcon, HomeIcon, SendIcon, SettingsIcon } from '@youj/icons'

const PLATFORM = [
  { label: 'Home', Icon: HomeIcon },
  { label: 'Deployments', Icon: SendIcon },
  { label: 'Settings', Icon: SettingsIcon },
]
const PAGES = ['Overview', 'Deployments', 'Logs']
const REQUESTS = [
  ['12:04:11', 'GET', 200, '/api/pricing', '38ms'],
  ['12:04:12', 'GET', 200, '/', '12ms'],
  ['12:04:15', 'POST', 201, '/api/checkout', '211ms'],
  ['12:04:19', 'GET', 404, '/old-pricing', '4ms'],
  ['12:04:22', 'GET', 200, '/dashboard', '52ms'],
  ['12:04:25', 'POST', 500, '/api/webhooks/stripe', '1.2s'],
  ['12:04:31', 'GET', 200, '/dashboard/usage', '64ms'],
  ['12:04:36', 'GET', 304, '/_next/static/chunks/app.js', '2ms'],
] as const

export default function SidebarCollapsed() {
  const [page, setPage] = useState('web/Logs')
  const go = (next: string) => (event: MouseEvent) => {
    event.preventDefault()
    setPage(next)
  }

  return (
    // defaultOpen={false} starts it collapsed to icons. Contained for the preview: in an app, the provider fills the viewport.
    <SidebarProvider defaultOpen={false} className="h-[360px] min-h-0" style={{ '--sidebar-height': '360px' } as CSSProperties}>
      <Sidebar collapsible="icon">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
              {PLATFORM.map(({ label, Icon }) => (
                <SidebarMenuItem key={label}>
                  {/* Collapsed, the tooltip shows the label on hover and focus. */}
                  <SidebarMenuButton
                    isActive={page === label}
                    tooltip={label}
                    render={<a href={`/${label.toLowerCase()}`} aria-current={page === label ? 'page' : undefined} onClick={go(label)} />}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarMenu>
              <Collapsible defaultOpen render={<SidebarMenuItem />}>
                {/* Collapsed, the key for a page in this group sits on the group's own item. */}
                <CollapsibleTrigger render={<SidebarMenuButton tooltip="web" />}>
                  <FolderIcon size={16} />
                  <span>web</span>
                  <CollapsibleChevron size={14} className="ms-auto text-fg-muted" />
                </CollapsibleTrigger>
                <CollapsibleContent keepMounted>
                  <SidebarMenuSub>
                    {PAGES.map((name) => (
                      <SidebarMenuSubItem key={name}>
                        <SidebarMenuSubButton
                          href={`/web/${name.toLowerCase()}`}
                          isActive={page === `web/${name}`}
                          aria-current={page === `web/${name}` ? 'page' : undefined}
                          onClick={go(`web/${name}`)}
                        >
                          <span>{name}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      {/* In an app this is <SidebarInset>, your page's <main>. The docs page already has one, so this is a div. */}
      <div className="relative flex min-w-0 flex-1 flex-col bg-canvas">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3">
          <SidebarTrigger />
          <p className="truncate text-ui font-medium text-fg">{page.replace('/', ' · ')}</p>
        </header>
        <ul className="divide-y divide-line font-mono text-ui-sm">
          {REQUESTS.map(([time, method, status, path, duration]) => (
            <li key={time} className="flex items-center gap-3 px-4 py-2">
              <span className="text-fg-muted tabular-nums">{time}</span>
              <span className="w-9 text-fg">{method}</span>
              <span className={status >= 500 ? 'text-danger-text' : status >= 400 ? 'text-warning-text' : 'text-fg-muted'}>{status}</span>
              <span className="min-w-0 flex-1 truncate text-fg">{path}</span>
              <span className="text-fg-muted tabular-nums">{duration}</span>
            </li>
          ))}
        </ul>
      </div>
    </SidebarProvider>
  )
}
