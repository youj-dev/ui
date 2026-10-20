'use client'

import { useState, type CSSProperties, type MouseEvent } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  ToggleGroup,
  ToggleGroupItem,
} from '@youj/react'
import { BarChartIcon, HomeIcon, SendIcon, SettingsIcon } from '@youj/icons'

type Variant = 'sidebar' | 'floating' | 'inset'
type CollapseMode = 'icon' | 'offcanvas'

const PAGES = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'deployments', label: 'Deployments', Icon: SendIcon },
  { id: 'analytics', label: 'Analytics', Icon: BarChartIcon },
  { id: 'settings', label: 'Settings', Icon: SettingsIcon },
]

// SidebarInset's classes: the inset variant raises the page into a panel beside the sidebar.
const inset =
  'relative flex w-full min-w-0 flex-1 flex-col bg-canvas md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ms-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:border md:peer-data-[variant=inset]:border-line md:peer-data-[variant=inset]:bg-surface md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ms-2'

export default function SidebarVariants() {
  const [variant, setVariant] = useState<Variant>('floating')
  const [collapsible, setCollapsible] = useState<CollapseMode>('icon')
  const [page, setPage] = useState('deployments')
  const go = (next: string) => (event: MouseEvent) => {
    event.preventDefault()
    setPage(next)
  }

  return (
    <SidebarProvider className="h-[400px] min-h-0" style={{ '--sidebar-height': '400px' } as CSSProperties}>
      <Sidebar variant={variant} collapsible={collapsible}>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Acme</SidebarGroupLabel>
            <SidebarMenu>
              {PAGES.map(({ id, label, Icon }) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton
                    isActive={page === id}
                    tooltip={label}
                    render={<a href={`/${id}`} aria-current={page === id ? 'page' : undefined} onClick={go(id)} />}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      {/* In an app this is <SidebarInset>. The docs page already has a <main>, so this div wears its classes. */}
      <div className={inset}>
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3">
          <SidebarTrigger />
          <span className="text-ui font-medium text-fg">Layout</span>
        </div>
        <div className="flex flex-1 flex-col gap-4 p-5">
          <ToggleGroup
            variant="segmented"
            aria-label="Variant"
            value={[variant]}
            onValueChange={(value) => value[0] && setVariant(value[0] as Variant)}
          >
            <ToggleGroupItem value="sidebar">Sidebar</ToggleGroupItem>
            <ToggleGroupItem value="floating">Floating</ToggleGroupItem>
            <ToggleGroupItem value="inset">Inset</ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup
            variant="segmented"
            aria-label="Collapses to"
            value={[collapsible]}
            onValueChange={(value) => value[0] && setCollapsible(value[0] as CollapseMode)}
          >
            <ToggleGroupItem value="icon">Icons</ToggleGroupItem>
            <ToggleGroupItem value="offcanvas">Off-canvas</ToggleGroupItem>
          </ToggleGroup>
          <p className="max-w-xs text-ui text-fg-muted">Pick a look, then collapse the sidebar with the button above.</p>
        </div>
      </div>
    </SidebarProvider>
  )
}
