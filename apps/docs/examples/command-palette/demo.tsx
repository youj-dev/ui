'use client'

import { useState } from 'react'
import {
  ArrowRightIcon,
  CopyIcon,
  FolderIcon,
  GlobeIcon,
  LayersIcon,
  RocketIcon,
  SearchIcon,
  SettingsIcon,
  UserPlusIcon,
} from '@youj/icons'
import { Button, Kbd, KbdGroup } from '@youj/react'
import {
  CommandGroup,
  CommandItem,
  CommandPalette,
  CommandSeparator,
  CommandShortcut,
  useCommandPalette,
} from '@youj/react/command'

const PROJECTS = [
  { id: 'youj-web', domain: 'youj.io' },
  { id: 'docs', domain: 'docs.youj.io' },
  { id: 'status', domain: 'status.youj.io' },
  { id: 'api', domain: 'api.youj.io' },
]

/* Rows can live in their own components: useCommandPalette() reaches the page stack from anywhere inside. */
function ProjectRows() {
  const { push } = useCommandPalette()
  return (
    <CommandGroup heading="Projects">
      {PROJECTS.map((project) => (
        <CommandItem
          key={project.id}
          value={project.id}
          onSelect={() => push({ id: `project:${project.id}`, label: project.id, placeholder: `Do something in ${project.id}…` })}
        >
          <FolderIcon />
          {project.id}
          <span className="ms-auto font-mono text-ui-xs text-fg-muted">{project.domain}</span>
          <ArrowRightIcon className="size-3.5" />
        </CommandItem>
      ))}
    </CommandGroup>
  )
}

export default function CommandPaletteDemo() {
  const [open, setOpen] = useState(false)
  const [ran, setRan] = useState('')
  const run = (label: string) => {
    setRan(label)
    setOpen(false)
  }

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <div className="flex h-12 items-center justify-between gap-4 rounded-xl border border-line bg-surface px-3 shadow-xs">
        <span className="text-ui font-semibold text-fg">youj</span>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="w-72 min-w-0 shrink justify-between text-fg-muted">
          <span className="flex min-w-0 items-center gap-2">
            <SearchIcon />
            <span className="truncate">Search or run a command…</span>
          </span>
          <KbdGroup className="max-sm:hidden">
            <Kbd>⌘</Kbd>
            <Kbd>/</Kbd>
          </KbdGroup>
        </Button>
      </div>
      <p role="status" className="h-5 px-1 text-ui-sm text-fg-muted">
        {ran ? `Ran “${ran}”` : 'Press ⌘/ (Ctrl+/ elsewhere), or use the button.'}
      </p>
      {/* ⌘K is taken by this site's search, so this palette listens for ⌘/. */}
      <CommandPalette open={open} onOpenChange={setOpen} shortcut="/">
        {({ page, push }) => {
          if (page?.id === 'projects') return <ProjectRows />
          if (page?.id.startsWith('project:')) {
            return (
              <CommandGroup heading={page.label}>
                <CommandItem onSelect={() => run(`Open ${page.label}`)}>
                  <ArrowRightIcon />
                  Open {page.label}
                </CommandItem>
                <CommandItem onSelect={() => run(`Deploy ${page.label}`)}>
                  <RocketIcon />
                  Deploy to production
                  <CommandShortcut>⌘⇧D</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => run(`Copy the URL of ${page.label}`)}>
                  <CopyIcon />
                  Copy production URL
                </CommandItem>
              </CommandGroup>
            )
          }
          return (
            <>
              <CommandGroup heading="Suggestions">
                <CommandItem onSelect={() => push({ id: 'projects', label: 'Projects', placeholder: 'Search projects…' })}>
                  <LayersIcon />
                  Switch project…
                  <CommandShortcut>⌘P</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => run('Deploy youj-web')}>
                  <RocketIcon />
                  Deploy to production
                </CommandItem>
                <CommandItem onSelect={() => run('Invite a teammate')}>
                  <UserPlusIcon />
                  Invite a teammate
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Go to">
                <CommandItem onSelect={() => run('Go to domains')}>
                  <GlobeIcon />
                  Domains
                  <CommandShortcut>G D</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => run('Go to settings')}>
                  <SettingsIcon />
                  Settings
                  <CommandShortcut>G S</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </>
          )
        }}
      </CommandPalette>
    </div>
  )
}
