'use client'

import { useState } from 'react'
import {
  ArchiveIcon,
  ArrowUpRightIcon,
  CopyIcon,
  FolderIcon,
  LinkIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PinIcon,
  ShareIcon,
  TrashIcon,
} from '@youj/icons'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@youj/react'

const TEAMS = ['Design', 'Platform', 'Growth', 'Infrastructure']

export default function DropdownMenuDemo() {
  const [pinned, setPinned] = useState(true)
  const [log, setLog] = useState('')
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-[25rem] w-full max-w-sm flex-col gap-3">
      <div className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4 shadow-xs">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-subtle font-mono text-ui-sm font-semibold text-accent-text">
          KW
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-center gap-2">
            <span className="truncate text-ui font-semibold text-fg">youj-web</span>
            {pinned && <Badge variant="secondary">Pinned</Badge>}
          </span>
          <span className="truncate text-ui-sm text-fg-muted">youj.io · updated 2h ago</span>
        </div>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="-me-1.5 -mt-1" aria-label="Project actions" />}>
            {/* A state icon: its dots become a close mark while the menu is open. */}
            <MoreHorizontalIcon active={open} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setLog('Opened youj-web')}>
                <ArrowUpRightIcon />
                Open
                <DropdownMenuShortcut>⌘O</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLog('Renaming youj-web')}>
                <PencilIcon />
                Rename
                <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLog('Duplicated youj-web')}>
                <CopyIcon />
                Duplicate
                <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLog('Copied the project link')}>
                <LinkIcon />
                Copy link
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FolderIcon />
                Move to
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuLabel>Teams</DropdownMenuLabel>
                {TEAMS.map((team) => (
                  <DropdownMenuItem key={team} onClick={() => setLog(`Moved to ${team}`)}>
                    {team}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ShareIcon />
                Share
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setLog('Invite sent')}>Invite people…</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLog('Embed code copied')}>Copy embed code</DropdownMenuItem>
                <DropdownMenuItem disabled>Publish to web</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            {/* Checkbox and radio items keep the menu open while you toggle them. */}
            <DropdownMenuCheckboxItem checked={pinned} onCheckedChange={setPinned}>
              <PinIcon />
              Pin to sidebar
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLog('Archived youj-web')}>
              <ArchiveIcon />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem variant="danger" onClick={() => setLog('Deleted youj-web')}>
              <TrashIcon />
              Delete project
              <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p role="status" className="h-5 px-1 text-ui-sm text-fg-muted">
        {log}
      </p>
    </div>
  )
}
