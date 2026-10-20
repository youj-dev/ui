import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core'
import { ClipboardIcon, CopyPlusIcon, DownloadIcon, FileCodeIcon, FileIcon, FileImageIcon, FolderInputIcon, MoreHorizontalIcon, PencilIcon, TrashIcon } from '@youj/icons'
import { Button } from './button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuGroup,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from './context-menu'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './dropdown-menu'

const meta: Meta<typeof ContextMenuContent> = {
  title: 'UI/Overlays/Context Menu',
  component: ContextMenuContent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Base UI context menu: right click, long press, or the Menu key / Shift+F10 on a focused row. It is DropdownMenu’s popup and rows, so it grows out of the exact point it was opened at (yj-pop from --transform-origin) and one SlidingIndicator glides between rows, lingering across separators. Use it as an enhancement: the same actions stay reachable from a visible control. Reduced motion: instant popup, the highlight jumps.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ContextMenuContent>

const files = [
  { name: 'middleware.ts', icon: FileCodeIcon, size: '2.1 KB', updated: '2m ago' },
  { name: 'og-image.png', icon: FileImageIcon, size: '184 KB', updated: '1h ago' },
  { name: 'vercel.json', icon: FileIcon, size: '412 B', updated: 'Yesterday' },
  { name: 'next.config.ts', icon: FileCodeIcon, size: '1.3 KB', updated: '3d ago' },
]
const folders = ['app', 'components', 'lib', 'public']

/** One set of rows for both menus: the context menu and the visible ⋯ menu offer the same actions. */
function FileActions({ name, onAction }: { name: string; onAction: (action: string) => void }) {
  return (
    <>
      <ContextMenuGroup>
        <ContextMenuLabel className="font-mono tracking-normal normal-case">{name}</ContextMenuLabel>
        <ContextMenuItem onClick={() => onAction(`Renaming ${name}`)}>
          <PencilIcon />
          Rename
          <ContextMenuShortcut>F2</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onAction(`Duplicated ${name}`)}>
          <CopyPlusIcon />
          Duplicate
          <ContextMenuShortcut>⌘D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onAction(`Copied path of ${name}`)}>
          <ClipboardIcon />
          Copy path
          <ContextMenuShortcut>⌘⇧C</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuGroup>
      <ContextMenuSeparator />
      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <FolderInputIcon />
          Move to
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          {folders.map((folder) => (
            <ContextMenuItem key={folder} onClick={() => onAction(`Moved ${name} to /${folder}`)} className="font-mono text-ui-sm">
              /{folder}
            </ContextMenuItem>
          ))}
        </ContextMenuSubContent>
      </ContextMenuSub>
      <ContextMenuItem onClick={() => onAction(`Downloading ${name}`)}>
        <DownloadIcon />
        Download
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem variant="danger" onClick={() => onAction(`Deleted ${name}`)}>
        <TrashIcon />
        Delete
        <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
      </ContextMenuItem>
    </>
  )
}

function FileBrowser({ hint = 'Right-click a file, or focus one and press Shift+F10.' }: { hint?: string }) {
  const [log, setLog] = useState(hint)
  return (
    <div className="flex w-[min(30rem,calc(100vw-2rem))] flex-col gap-3">
      <ul aria-label="Files" className="overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
        {files.map((file) => (
          <li key={file.name} className="border-b border-line last:border-b-0">
            <ContextMenu>
              <ContextMenuTrigger className="group/row flex h-11 items-center gap-3 px-3 transition-[background-color] yj-duration-fast ease-standard hover:bg-hover data-popup-open:bg-hover">
                <file.icon className="size-4 shrink-0 text-fg-muted" />
                <a
                  href={`#${file.name}`}
                  onClick={(e) => {
                    e.preventDefault()
                    setLog(`Opened ${file.name}`)
                  }}
                  className="min-w-0 flex-1 truncate rounded-sm font-mono text-ui-sm text-fg focus-ring"
                >
                  {file.name}
                </a>
                <span className="w-16 text-end text-ui-sm text-fg-muted tabular-nums">{file.size}</span>
                <span className="w-20 text-end text-ui-sm text-fg-muted">{file.updated}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${file.name}`} />}
                  >
                    <MoreHorizontalIcon />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <FileActions name={file.name} onAction={setLog} />
                  </DropdownMenuContent>
                </DropdownMenu>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-56">
                <FileActions name={file.name} onAction={setLog} />
              </ContextMenuContent>
            </ContextMenu>
          </li>
        ))}
      </ul>
      <p role="status" className="text-ui-sm text-fg-muted">
        {log}
      </p>
    </div>
  )
}

/** A file browser: right-click a row (or focus its name and press Shift+F10) for the same actions its ⋯ button offers. */
export const Hero: Story = {
  render: () => <FileBrowser />,
}

/**
 * Touch (`YoujProvider device="touch"`, a phone's width): press and hold a row for half a second and the same
 * menu rises as an action sheet with 48px rows and no shortcut hints. Moving the finger first scrolls instead.
 * Pull the sheet down, tap outside or press Escape to dismiss it.
 */
export const Touch: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  decorators: [
    (Story) => (
      <YoujProvider device="touch">
        <Story />
      </YoujProvider>
    ),
  ],
  render: () => <FileBrowser hint="Press and hold a file for its actions." />,
}
