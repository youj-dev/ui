'use client'

import { useState } from 'react'
import { FileCode2, Files, GitBranch, Search, Settings, TerminalSquare } from 'lucide-react'
import { Badge, Button, ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@youj/react'

const NAV = [
  { icon: Files, label: 'Explorer', active: true },
  { icon: Search, label: 'Search' },
  { icon: GitBranch, label: 'Source control', badge: '3' },
  { icon: Settings, label: 'Settings' },
]

const CODE = `export function App({ sprint }: Props) {
  const [cards, setCards] = useState(sprint.cards)
  return (
    <YoujProvider>
      <Board cards={cards} onMove={save} />
    </YoujProvider>
  )
}`

export default function ResizableDemo() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="h-[400px] w-full max-w-2xl overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <ResizablePanelGroup orientation="horizontal">
        {/* Dragged past its minimum, the sidebar snaps shut to an icon rail. */}
        <ResizablePanel
          id="sidebar"
          defaultSize="28%"
          minSize="10rem"
          maxSize="45%"
          collapsible
          collapsedSize="3rem"
          onCollapsedChange={setCollapsed}
          className="bg-transparent"
        >
          <nav aria-label="Workspace" className="flex h-full flex-col gap-0.5 p-1.5">
            {NAV.map(({ icon: Icon, label, active, badge }) => (
              <Button
                key={label}
                variant="ghost"
                size={collapsed ? 'icon-sm' : 'sm'}
                aria-label={collapsed ? label : undefined}
                aria-current={active ? 'page' : undefined}
                className={collapsed ? 'mx-auto' : 'justify-start aria-[current=page]:bg-hover aria-[current=page]:text-fg'}
              >
                <Icon />
                {!collapsed && <span className="truncate">{label}</span>}
                {!collapsed && badge && (
                  <Badge variant="secondary" className="ms-auto">
                    {badge}
                  </Badge>
                )}
              </Button>
            ))}
          </nav>
        </ResizablePanel>
        <ResizableHandle aria-label="Resize sidebar" />
        <ResizablePanel id="main" minSize="40%">
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel id="editor" defaultSize="66%" minSize="25%">
              <div className="flex h-full min-w-0 flex-col">
                <div className="flex h-9 shrink-0 items-center gap-1.5 border-b border-line px-3 text-ui-sm text-fg">
                  <FileCode2 className="size-3.5 text-accent-text" />
                  app.tsx
                </div>
                <pre className="min-h-0 flex-1 overflow-auto p-3 font-mono text-ui-sm leading-6 whitespace-pre text-fg">{CODE}</pre>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle aria-label="Resize terminal" />
            <ResizablePanel id="terminal" defaultSize="34%" minSize="4rem" collapsible>
              <div className="flex h-full min-h-0 flex-col">
                <div className="flex h-8 shrink-0 items-center gap-2 border-b border-line px-3 text-ui-sm text-fg-muted">
                  <TerminalSquare className="size-3.5" />
                  <span className="font-medium text-fg">Terminal</span>
                  pnpm dev
                </div>
                <p className="p-3 font-mono text-ui-sm text-fg-muted">
                  <span className="text-success-text">✓</span> Ready in 412ms
                </p>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
