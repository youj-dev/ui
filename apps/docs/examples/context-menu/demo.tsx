'use client'

import { useState } from 'react'
import {
  ClipboardIcon,
  CodeXmlIcon,
  CopyIcon,
  DownloadIcon,
  FileTextIcon,
  FolderIcon,
  ImageIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
  type YoujIconComponent,
} from '@youj/icons'
import {
  Button,
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@youj/react'

const FILES: { name: string; Icon: YoujIconComponent; size: string }[] = [
  { name: 'middleware.ts', Icon: CodeXmlIcon, size: '2.1 KB' },
  { name: 'og-image.png', Icon: ImageIcon, size: '184 KB' },
  { name: 'youj.config.ts', Icon: CodeXmlIcon, size: '412 B' },
  { name: 'CHANGELOG.md', Icon: FileTextIcon, size: '9.8 KB' },
]
const FOLDERS = ['app', 'components', 'lib', 'public']

/* One set of rows for both menus: the context menu and the visible ⋯ button offer the same actions. */
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
          <CopyIcon />
          Duplicate
          <ContextMenuShortcut>⌘D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onAction(`Copied the path of ${name}`)}>
          <ClipboardIcon />
          Copy path
        </ContextMenuItem>
      </ContextMenuGroup>
      <ContextMenuSeparator />
      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <FolderIcon />
          Move to
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          {FOLDERS.map((folder) => (
            <ContextMenuItem key={folder} className="font-mono text-ui-sm" onClick={() => onAction(`Moved ${name} to /${folder}`)}>
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

function FileRow({ file, onAction }: { file: (typeof FILES)[number]; onAction: (action: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-11 items-center gap-3 px-3 transition-[background-color] yj-duration-fast ease-standard hover:bg-hover data-popup-open:bg-hover">
        <file.Icon size={16} className="text-fg-muted" />
        {/* Something focusable inside the trigger: Shift+F10 or the Menu key opens the menu from it. */}
        <a
          href={`#${file.name}`}
          onClick={(event) => {
            event.preventDefault()
            onAction(`Opened ${file.name}`)
          }}
          className="min-w-0 flex-1 truncate rounded-sm font-mono text-ui-sm text-fg focus-ring"
        >
          {file.name}
        </a>
        <span className="w-16 text-end text-ui-sm text-fg-muted tabular-nums">{file.size}</span>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${file.name}`} />}>
            <MoreHorizontalIcon active={open} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <FileActions name={file.name} onAction={onAction} />
          </DropdownMenuContent>
        </DropdownMenu>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <FileActions name={file.name} onAction={onAction} />
      </ContextMenuContent>
    </ContextMenu>
  )
}

export default function ContextMenuDemo() {
  const [log, setLog] = useState('Right-click a file, or focus its name and press Shift+F10.')
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ul aria-label="Files" className="overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
        {FILES.map((file) => (
          <li key={file.name} className="border-b border-line last:border-b-0">
            <FileRow file={file} onAction={setLog} />
          </li>
        ))}
      </ul>
      <p role="status" className="px-1 text-ui-sm text-fg-muted">
        {log}
      </p>
    </div>
  )
}
