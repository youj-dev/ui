import { useState, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { FileCodeIcon, FileIcon, FileJsonIcon, GitBranchIcon, SearchIcon, SettingsIcon, TerminalIcon, XIcon } from '@youj/icons'
import { Badge } from './badge'
import { Button } from './button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup, type ResizableLayout } from './resizable'

const meta: Meta<typeof ResizablePanelGroup> = {
  title: 'UI/Layout/Resizable',
  component: ResizablePanelGroup,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "shadcn's resizable on react-resizable-panels 4: horizontal and vertical split groups that nest, with min / max sizes (px, %, rem) and collapsible panels that snap shut past their threshold. The separator is a keyboard control (role=\"separator\" with aria-valuenow; arrows step, Home / End go to the limits, Enter collapses or restores, F6 hops to the next separator, double-click resets). The hairline wakes into a 3px rail after a beat of hover, lights accent while dragged or focused, and `withHandle` adds a grip whose dots fuse while held. Keyboard and imperative resizes glide on the base token; a pointer drag follows the pointer 1:1. Reduced motion makes every resize instant. Persist with `onLayoutChanged`, restore with `defaultLayout`.",
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ResizablePanelGroup>

const CODE = `import { YoujProvider } from '@youj/core'
import { Board } from './board'

export function App({ sprint }: { sprint: Sprint }) {
  const [cards, setCards] = useState(sprint.cards)
  return (
    <YoujProvider>
      <Board cards={cards} onMove={(move, next) => save(next)} />
    </YoujProvider>
  )
}`

function Frame({ children }: { children: ReactNode }) {
  return <div className="h-[560px] w-full bg-canvas p-4 sm:p-6">{children}</div>
}

function Rail({ collapsed }: { collapsed: boolean }) {
  const items = [
    { icon: FileIcon, label: 'Explorer', active: true },
    { icon: SearchIcon, label: 'Search' },
    { icon: GitBranchIcon, label: 'Source control', badge: '3' },
    { icon: SettingsIcon, label: 'Settings' },
  ]
  return (
    <nav aria-label="Workspace" className="flex h-full flex-col gap-0.5 p-1.5">
      {items.map(({ icon: Icon, label, active, badge }) => (
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
  )
}

function Editor() {
  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex h-9 shrink-0 items-end gap-px border-b border-line bg-transparent ps-2">
        <div className="flex h-8 items-center gap-1.5 rounded-t-md border border-b-0 border-line bg-canvas px-2.5 text-ui-sm text-fg">
          <FileCodeIcon className="size-3.5 text-accent-text" />
          app.tsx
          <XIcon className="size-3 text-fg-muted" />
        </div>
        <div className="flex h-8 items-center gap-1.5 px-2.5 text-ui-sm text-fg-muted">
          <FileJsonIcon className="size-3.5" />
          package.json
        </div>
      </div>
      {/* Code reads left to right in every locale. */}
      <pre dir="ltr" className="min-h-0 flex-1 overflow-auto p-4 font-mono text-ui-sm leading-6 text-fg">
        {CODE.split('\n').map((line, i) => (
          <div key={i} className="flex gap-4">
            <span className="w-5 shrink-0 text-end text-fg-subtle tabular-nums select-none">{i + 1}</span>
            <span className="whitespace-pre">{line || ' '}</span>
          </div>
        ))}
      </pre>
    </div>
  )
}

function Terminal() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-8 shrink-0 items-center gap-2 border-b border-line px-3 text-ui-sm text-fg-muted">
        <TerminalIcon className="size-3.5" />
        <span className="font-medium text-fg">Terminal</span>
        <span>pnpm dev</span>
      </div>
      <div dir="ltr" className="min-h-0 flex-1 overflow-auto p-3 font-mono text-ui-sm leading-5 text-fg-muted">
        <p>
          <span className="text-success-text">✓</span> Ready in 412ms
        </p>
        <p>➜ Local: http://localhost:5173/</p>
        <p className="text-fg">▍</p>
      </div>
    </div>
  )
}

/** An editor workspace: a collapsible sidebar that snaps to an icon rail, the editor, and a terminal split below it. Tab to a separator and use the arrows; Enter collapses or restores the sidebar. */
export const Hero: Story = {
  render: function Render() {
    const [collapsed, setCollapsed] = useState(false)
    return (
      <Frame>
        <div className="h-full overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
          <ResizablePanelGroup orientation="horizontal">
            <ResizablePanel
              id="sidebar"
              defaultSize="22%"
              minSize="11rem"
              maxSize="40%"
              collapsible
              collapsedSize="3rem"
              onCollapsedChange={setCollapsed}
              className="bg-transparent"
            >
              <Rail collapsed={collapsed} />
            </ResizablePanel>
            <ResizableHandle aria-label="Resize sidebar" />
            <ResizablePanel id="main" minSize="30%">
              <ResizablePanelGroup orientation="vertical">
                <ResizablePanel id="editor" defaultSize="68%" minSize="25%">
                  <Editor />
                </ResizablePanel>
                <ResizableHandle withHandle aria-label="Resize terminal" />
                <ResizablePanel id="terminal" defaultSize="32%" minSize="4rem" collapsible>
                  <Terminal />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </Frame>
    )
  },
}

const KEY = 'youj:resizable-story'
function readLayout(): ResizableLayout | undefined {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as ResizableLayout) : undefined
  } catch {
    return undefined
  }
}

/** Persistence by callback: `onLayoutChanged` fires once a drag or key press settles, so the layout is written once per change, not per pointer move. Reload the story and it comes back from `defaultLayout`. */
export const Persisted: Story = {
  render: function Render() {
    const [layout, setLayout] = useState<ResizableLayout | undefined>(readLayout)
    return (
      <Frame>
        <div className="flex h-full flex-col gap-3">
          <div className="flex items-center gap-2 text-ui-sm text-fg-muted">
            <span>Saved layout</span>
            <code className="rounded-sm bg-band px-1.5 py-0.5 font-mono text-fg">
              {layout ? Object.entries(layout).map(([id, size]) => `${id} ${size.toFixed(0)}%`).join(' · ') : 'none yet'}
            </code>
            <Button
              variant="ghost"
              size="xs"
              className="ms-auto"
              onClick={() => {
                try {
                  localStorage.removeItem(KEY)
                } catch {
                  /* storage blocked: nothing to clear */
                }
                setLayout(undefined)
              }}
            >
              Forget
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-line bg-surface">
            <ResizablePanelGroup
              orientation="horizontal"
              defaultLayout={layout}
              onLayoutChanged={(next) => {
                setLayout(next)
                try {
                  localStorage.setItem(KEY, JSON.stringify(next))
                } catch {
                  /* storage blocked: the layout just isn't remembered */
                }
              }}
            >
              {(['inbox', 'thread', 'details'] as const).map((id, i) => (
                <Fragment key={id} last={i === 2}>
                  <ResizablePanel id={id} minSize="15%">
                    <div className="grid h-full place-items-center text-ui text-fg-muted capitalize">{id}</div>
                  </ResizablePanel>
                </Fragment>
              ))}
            </ResizablePanelGroup>
          </div>
        </div>
      </Frame>
    )
  },
}

function Fragment({ children, last }: { children: ReactNode; last: boolean }) {
  return (
    <>
      {children}
      {!last && <ResizableHandle withHandle />}
    </>
  )
}

/** A vertical group with a max-sized preview and a grip. */
export const Vertical: Story = {
  render: () => (
    <Frame>
      <div className="h-full overflow-hidden rounded-xl border border-line bg-surface">
        <ResizablePanelGroup orientation="vertical">
          <ResizablePanel defaultSize="60%" minSize="20%" maxSize="80%">
            <div className="grid h-full place-items-center text-ui text-fg-muted">Preview</div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel minSize="20%">
            <div className="grid h-full place-items-center text-ui text-fg-muted">Console</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </Frame>
  ),
}
