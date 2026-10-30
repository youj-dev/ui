import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArchiveIcon, ArrowUpRightIcon, CopyIcon, FolderInputIcon, KeyboardIcon, LinkIcon, LogOutIcon, MoreHorizontalIcon, PencilIcon, PinIcon, SettingsIcon, ShareIcon, SlidersIcon, StarIcon, TrashIcon, UserIcon } from '@youj/icons'
import { Avatar, AvatarFallback } from './avatar'
import { Badge } from './badge'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './dropdown-menu'

const meta: Meta<typeof DropdownMenuContent> = {
  title: 'UI/Overlays/Dropdown Menu',
  component: DropdownMenuContent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Base UI menu. The popup grows out of its trigger (yj-pop). One highlight per popup, motion’s SlidingIndicator, glides between rows on the smooth spring and holds for a beat when the pointer crosses a separator or a label, so it glides on instead of blinking. Submenus open beside their row with the first item level with it (→ / Enter, or hover; ← closes; mirrored in RTL). Checks draw in; destructive rows wash red. Keyboard: arrows, Home/End, typeahead, Escape returns focus to the trigger. Reduced motion: instant popup, the highlight jumps, checks appear drawn.',
      },
    },
  },
  argTypes: {
    side: { control: 'inline-radio', options: ['top', 'right', 'bottom', 'left'] },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
  },
  args: { side: 'bottom', align: 'end' },
}
export default meta
type Story = StoryObj<typeof DropdownMenuContent>

const teams = ['Design', 'Platform', 'Growth', 'Infrastructure']

function ProjectCard(args: Story['args']) {
  const [pinned, setPinned] = useState(true)
  const [log, setLog] = useState('')
  return (
    <div className="flex w-80 flex-col gap-3">
      <div className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4 shadow-xs">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-subtle font-mono text-ui-sm font-semibold text-accent-text">
          OR
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="truncate text-ui font-semibold">Orion</span>
            {pinned && <Badge variant="secondary">Pinned</Badge>}
          </div>
          <span className="truncate text-ui-sm text-fg-muted">orion.acme.dev · updated 2h ago</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" className="-me-1.5 -mt-1" aria-label="Project actions" />}
          >
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent {...args} className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setLog('Opened Orion')}>
                <ArrowUpRightIcon />
                Open
                <DropdownMenuShortcut>⌘O</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLog('Renaming Orion')}>
                <PencilIcon />
                Rename
                <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLog('Duplicated Orion')}>
                <CopyIcon />
                Duplicate
                <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLog('Copied link')}>
                <LinkIcon />
                Copy link
                <DropdownMenuShortcut>⌘⇧C</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FolderInputIcon />
                Move to
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuLabel>Teams</DropdownMenuLabel>
                {teams.map((team) => (
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
            <DropdownMenuCheckboxItem checked={pinned} onCheckedChange={setPinned}>
              <PinIcon />
              Pin to sidebar
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLog('Archived Orion')}>
              <ArchiveIcon />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem variant="danger" onClick={() => setLog('Deleted Orion')}>
              <TrashIcon />
              Delete project
              <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p role="status" className="h-4 text-ui-sm text-fg-muted">
        {log}
      </p>
    </div>
  )
}

/** The actions menu on a project card: shortcuts, two submenus, a checkbox item and a destructive action. */
export const Hero: Story = {
  render: (args) => <ProjectCard {...args} />,
}

function ViewOptions(args: Story['args']) {
  const [sort, setSort] = useState('updated')
  const [show, setShow] = useState({ archived: false, descriptions: true, compact: false })
  const toggle = (key: keyof typeof show) => (checked: boolean) => setShow((s) => ({ ...s, [key]: checked }))
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <SlidersIcon />
        Display
      </DropdownMenuTrigger>
      <DropdownMenuContent {...args} className="w-52">
        <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="updated">Last updated</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="created">Date created</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Show</DropdownMenuLabel>
          <DropdownMenuCheckboxItem checked={show.archived} onCheckedChange={toggle('archived')}>
            Archived projects
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={show.descriptions} onCheckedChange={toggle('descriptions')}>
            Descriptions
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={show.compact} onCheckedChange={toggle('compact')}>
            Compact rows
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** View options: a radio group and checkbox items that keep the menu open while you toggle them. */
export const CheckboxAndRadio: Story = {
  render: (args) => <ViewOptions {...args} />,
}

function AccountMenu(args: Story['args']) {
  const [theme, setTheme] = useState('system')
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" className="h-auto gap-2 py-1 ps-1 pe-2" aria-label="Ada Lovelace, account menu" />}
      >
        <Avatar aria-hidden size="sm">
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <span className="text-ui font-medium text-fg">Ada Lovelace</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent {...args} className="w-60">
        <div className="flex flex-col px-2 pt-1.5 pb-2">
          <span className="text-ui font-medium">Ada Lovelace</span>
          <span className="text-ui-sm text-fg-muted">ada@acme.com</span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <UserIcon />
          Profile
          <DropdownMenuShortcut>⌘⇧P</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <SettingsIcon />
          Settings
          <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <KeyboardIcon />
          Keyboard shortcuts
          <DropdownMenuShortcut>?</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <StarIcon />
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** An account menu with a header, shortcuts and a radio submenu. */
export const Account: Story = {
  render: (args) => <AccountMenu {...args} />,
}

const branches = Array.from({ length: 30 }, (_, i) => `feature/${['search', 'billing', 'onboarding', 'audit-log', 'sso'][i % 5]}-${i + 1}`)

/** A menu taller than the space available scrolls inside the popup; the highlight scrolls with the rows. */
export const LongList: Story = {
  render: (args) => (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>Checkout branch</DropdownMenuTrigger>
      <DropdownMenuContent {...args} className="max-h-72 w-64">
        <DropdownMenuLabel>Recent branches</DropdownMenuLabel>
        {branches.map((b) => (
          <DropdownMenuItem key={b} className="font-mono text-ui-sm">
            {b}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}
