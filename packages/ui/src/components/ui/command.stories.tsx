import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core'
import { ArrowRightIcon, CheckCircleIcon, CircleDashedIcon, CircleDotIcon, CirclePlusIcon, CircleXIcon, CreditCardIcon, FilePlusIcon, FilterIcon, InboxIcon, SettingsIcon, SignalIcon, UserCheckIcon, UserIcon } from '@youj/icons'
import { Badge } from './badge'
import { Button } from './button'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
  CommandSeparator,
  CommandShortcut,
} from './command'
import { Kbd, KbdGroup } from './kbd'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Separator } from './separator'

const meta: Meta<typeof Command> = {
  title: 'UI/Overlays/Command',
  component: Command,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'cmdk, re-skinned: a flush search row over a list. The active row is one SlidingIndicator that glides as you arrow through (retargeting mid-glide while a key repeats) and holds still while you type, since filtering keeps the first result active. The list eases its height as results change (base token). Use it inline, in a Popover as a filter or picker (`checked` items draw a check), or in CommandDialog. Reduced motion: the highlight jumps and the height snaps.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Command>

function CommandMenu() {
  const [ran, setRan] = useState('')
  return (
    <div className="flex w-[26rem] flex-col gap-3">
      <Command label="Command menu" className="rounded-xl border border-line shadow-md">
        <CommandInput placeholder="Type a command or search…" />
        <CommandList className="[--command-list-max:24rem]">
          <CommandEmpty>No commands match.</CommandEmpty>
          <CommandGroup heading="Issues">
            <CommandItem onSelect={() => setRan('Create issue')}>
              <FilePlusIcon />
              Create issue
              <CommandShortcut>C</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => setRan('Assign to me')}>
              <UserCheckIcon />
              Assign to me
              <CommandShortcut>I</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => setRan('Change status')}>
              <CircleDotIcon />
              Change status
              <CommandShortcut>S</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => setRan('Set priority')}>
              <SignalIcon />
              Set priority
              <CommandShortcut>P</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => setRan('Go to inbox')}>
              <InboxIcon />
              Go to inbox
              <CommandShortcut>G I</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => setRan('Go to my issues')}>
              <ArrowRightIcon />
              Go to my issues
              <CommandShortcut>G M</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem onSelect={() => setRan('Profile')}>
              <UserIcon />
              Profile
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => setRan('Billing')}>
              <CreditCardIcon />
              Billing
              <CommandShortcut>⌘B</CommandShortcut>
            </CommandItem>
            <CommandItem disabled>
              <SettingsIcon />
              Workspace settings
              <CommandShortcut>Admins</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
      <p role="status" className="h-4 text-ui-sm text-fg-muted">
        {ran && `Ran “${ran}”`}
      </p>
    </div>
  )
}

/** An inline command menu. Arrow through it to see the highlight glide; type to filter; Enter runs the row. */
export const Hero: Story = {
  render: () => <CommandMenu />,
}

const statuses = [
  { value: 'backlog', label: 'Backlog', icon: CircleDashedIcon, count: 21 },
  { value: 'todo', label: 'Todo', icon: CircleDotIcon, count: 8 },
  { value: 'in-progress', label: 'In progress', icon: CircleDotIcon, count: 5 },
  { value: 'done', label: 'Done', icon: CheckCircleIcon, count: 64 },
  { value: 'canceled', label: 'Canceled', icon: CircleXIcon, count: 3 },
]

function StatusFilter() {
  const [selected, setSelected] = useState<Set<string>>(new Set(['todo', 'in-progress']))
  const toggle = (value: string) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" className="border-dashed" />}>
        <CirclePlusIcon />
        Status
        {selected.size > 0 && (
          <>
            <Separator orientation="vertical" className="mx-0.5 h-4" />
            <Badge variant="secondary" className="px-1.5">
              {selected.size} selected
            </Badge>
          </>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" aria-label="Filter by status" className="w-56 gap-0 p-0">
        <Command label="Filter by status">
          <CommandInput placeholder="Status" />
          <CommandList>
            <CommandEmpty>No status found.</CommandEmpty>
            <CommandGroup>
              {statuses.map((s) => (
                <CommandItem key={s.value} value={s.label} checked={selected.has(s.value)} onSelect={() => toggle(s.value)}>
                  <s.icon />
                  {s.label}
                  <span className="ms-auto font-mono text-ui-xs text-fg-muted tabular-nums">{s.count}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {selected.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={() => setSelected(new Set())} className="justify-center">
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/** A faceted filter: Command in a Popover, multi-select with drawn checks. The shape a DataTable toolbar uses. */
export const InPopover: Story = {
  render: () => <StatusFilter />,
}

const people = ['Ada Lovelace', 'Alan Turing', 'Barbara Liskov', 'Donald Knuth', 'Edsger Dijkstra', 'Frances Allen', 'Grace Hopper', 'John McCarthy', 'Ken Thompson', 'Margaret Hamilton']

function AsyncPeople() {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!search) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    const t = setTimeout(() => {
      setResults(people.filter((p) => p.toLowerCase().includes(search.toLowerCase())))
      setLoading(false)
    }, 700)
    return () => clearTimeout(t)
  }, [search])
  return (
    <Command label="Assign to" shouldFilter={false} className="w-80 rounded-xl border border-line shadow-md">
      <CommandInput value={search} onValueChange={setSearch} placeholder="Search people (try “a”)…" />
      <CommandList>
        {loading && <CommandLoading label="Searching the directory…" />}
        <CommandEmpty>{search ? `Nobody called “${search}”.` : 'Start typing to search.'}</CommandEmpty>
        {results.length > 0 && !loading && (
          <CommandGroup heading="People">
            {results.map((p) => (
              <CommandItem key={p} value={p}>
                <UserIcon />
                {p}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  )
}

/** Async results: a loading row while the search runs, then results or an empty state (which waits for the loading row to go). The list eases between heights. */
export const AsyncResults: Story = {
  render: () => <AsyncPeople />,
}

function DialogDemo() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="w-64 justify-between text-fg-muted">
        Search commands…
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Type a command or search…" wrapperClassName="h-12 px-4" className="text-ui-lg" />
          <CommandList className="[--command-list-max:22rem]">
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem onSelect={() => setOpen(false)}>
                <FilePlusIcon />
                Create issue
                <CommandShortcut>C</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <FilterIcon />
                Filter issues
                <CommandShortcut>F</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <InboxIcon />
                Go to inbox
                <CommandShortcut>G I</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}

/** CommandDialog: ⌘K / Ctrl+K toggles it. It hangs from the top third, so the input never moves as the list changes. */
export const InDialog: Story = {
  render: () => <DialogDemo />,
}

/**
 * Touch (`YoujProvider device="touch"`, a phone's width): CommandDialog is a tall bottom sheet, not a window in
 * the middle. The search field stays at its top and follows the keyboard, rows are 48px and shortcut hints are
 * gone. Pull it down, tap outside or press Escape to dismiss it.
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
  render: () => <DialogDemo />,
}
