import { useEffect, useState, type ComponentType } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core'
import { ArrowRightIcon, CircleDotIcon, ClockIcon, CopyIcon, FilePlusIcon, InboxIcon, KanbanIcon, LaptopIcon, MoonIcon, RocketIcon, SearchIcon, SettingsIcon, SunIcon, ThemeIcon, UserIcon, UserPlusIcon } from '@youj/icons'
import { Button } from './button'
import { CommandEmpty, CommandGroup, CommandItem, CommandLoading, CommandSeparator, CommandShortcut } from './command'
import { CommandPalette, useCommandPalette } from './command-palette'
import { Kbd, KbdGroup } from './kbd'
import { toast, Toaster } from './toast'

const meta: Meta<typeof CommandPalette> = {
  title: 'UI/Overlays/Command Palette',
  component: CommandPalette,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A ⌘K palette on CommandDialog: groups, nested pages with a breadcrumb back stack (Backspace on an empty search or Escape steps back; the last Escape closes), recent items, results loaded as you type, and a footer that spells out the keys. The active row is Command’s SlidingIndicator; the list eases between heights as pages and results change. Rows read and change the page stack with useCommandPalette(). Reduced motion: the highlight jumps and heights snap.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof CommandPalette>

type Icon = ComponentType<{ className?: string }>
interface Action {
  id: string
  label: string
  icon: Icon
  shortcut?: string
  keywords?: string[]
}

const projects = [
  { id: 'orion', name: 'orion', meta: 'orion.acme.dev' },
  { id: 'andromeda', name: 'andromeda', meta: 'andromeda.acme.dev' },
  { id: 'lyra', name: 'lyra', meta: 'docs.acme.dev' },
  { id: 'vela', name: 'vela', meta: 'status.acme.dev' },
]
const people = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Barbara Liskov', 'Margaret Hamilton']
const issues = [
  { id: 'ORI-812', title: 'Stream search results from the edge' },
  { id: 'ORI-815', title: 'Search: highlight matches in titles' },
  { id: 'ORI-821', title: 'Preview comments sync with the tracker' },
  { id: 'ORI-830', title: 'Cold starts regress on the edge runtime' },
  { id: 'ORI-844', title: 'Audit log filter for deployments' },
]

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Fetches a page's rows the first time it opens, then keeps them, as an app's data cache would. */
function useLoaded<T>(cache: { data?: T }, load: () => Promise<T>) {
  const [data, setData] = useState(cache.data)
  useEffect(() => {
    if (cache.data) return
    let live = true
    void load().then((value) => {
      cache.data = value
      if (live) setData(value)
    })
    return () => {
      live = false
    }
  }, [cache, load])
  return data
}

const projectsCache: { data?: typeof projects } = {}
const loadProjects = () => wait(650).then(() => projects)

/**
 * Issues matching the search, fetched as you type (debounced), with a loading
 * row meanwhile. It also owns the empty state, which waits for the search to
 * settle: "no results" while results are still coming would be a lie.
 */
function IssueResults({ search, onRun }: { search: string; onRun: (label: string) => void }) {
  const query = search.trim().toLowerCase()
  const [results, setResults] = useState<typeof issues | null>(null)
  useEffect(() => {
    if (query.length < 2) {
      setResults(null)
      return
    }
    setResults(null)
    const t = setTimeout(() => setResults(issues.filter((i) => `${i.id} ${i.title}`.toLowerCase().includes(query))), 550)
    return () => clearTimeout(t)
  }, [query])
  const empty = <CommandEmpty>Nothing matches “{search}”.</CommandEmpty>
  if (query.length < 2) return empty
  if (!results) return <CommandLoading label="Searching issues…" />
  if (results.length === 0) return empty
  return (
    <CommandGroup heading="Issues">
      {results.map((issue) => (
        <CommandItem
          key={issue.id}
          value={`${issue.id} ${issue.title}`}
          onSelect={() => onRun(`Opened ${issue.id}`)}
        >
          <CircleDotIcon />
          <span className="font-mono text-ui-sm text-fg-muted">{issue.id}</span>
          <span className="truncate">{issue.title}</span>
        </CommandItem>
      ))}
    </CommandGroup>
  )
}

function ProjectsPage() {
  const { push } = useCommandPalette()
  const list = useLoaded(projectsCache, loadProjects)
  if (!list) return <CommandLoading label="Loading projects…" />
  return (
    <CommandGroup heading="Projects">
      {list.map((project) => (
        <CommandItem
          key={project.id}
          value={project.name}
          onSelect={() => push({ id: `project:${project.id}`, label: project.name, placeholder: `Do something in ${project.name}…` })}
        >
          <KanbanIcon />
          {project.name}
          <span className="ms-auto font-mono text-ui-xs text-fg-muted">{project.meta}</span>
          <ArrowRightIcon className="size-3.5" />
        </CommandItem>
      ))}
    </CommandGroup>
  )
}

function ProjectPage({ project, onRun }: { project: string; onRun: (label: string) => void }) {
  const actions: Action[] = [
    { id: 'open', label: `Open ${project}`, icon: ArrowRightIcon, shortcut: '↵' },
    { id: 'deploy', label: 'Deploy to production', icon: RocketIcon, shortcut: '⌘⇧D' },
    { id: 'copy', label: 'Copy production URL', icon: CopyIcon, shortcut: '⌘⇧C' },
    { id: 'settings', label: 'Project settings', icon: SettingsIcon },
  ]
  return (
    <CommandGroup heading={project}>
      {actions.map((a) => (
        <CommandItem key={a.id} value={a.label} onSelect={() => onRun(`${a.label} · ${project}`)}>
          <a.icon />
          {a.label}
          {a.shortcut && <CommandShortcut>{a.shortcut}</CommandShortcut>}
        </CommandItem>
      ))}
    </CommandGroup>
  )
}

function PeoplePage({ onRun }: { onRun: (label: string) => void }) {
  return (
    <CommandGroup heading="Assign to">
      {people.map((name) => (
        <CommandItem key={name} value={name} onSelect={() => onRun(`Assigned ORI-830 to ${name}`)}>
          <UserIcon />
          {name}
        </CommandItem>
      ))}
    </CommandGroup>
  )
}

function ThemePage({ theme, onTheme }: { theme: string; onTheme: (theme: string) => void }) {
  const themes: [string, Icon][] = [
    ['Light', SunIcon],
    ['Dark', MoonIcon],
    ['System', LaptopIcon],
  ]
  return (
    <CommandGroup heading="Theme">
      {themes.map(([name, Icon]) => (
        <CommandItem key={name} value={name} checked={theme === name} onSelect={() => onTheme(name)}>
          <Icon />
          {name}
        </CommandItem>
      ))}
    </CommandGroup>
  )
}

const suggestions: Action[] = [
  { id: 'create', label: 'Create issue', icon: FilePlusIcon, shortcut: 'C', keywords: ['new', 'ticket'] },
  { id: 'assign', label: 'Assign to…', icon: UserPlusIcon, shortcut: 'A' },
  { id: 'projects', label: 'Switch project…', icon: KanbanIcon, shortcut: '⌘P' },
]
const navigation: Action[] = [
  { id: 'inbox', label: 'Go to inbox', icon: InboxIcon, shortcut: 'G I' },
  { id: 'mine', label: 'Go to my issues', icon: CircleDotIcon, shortcut: 'G M' },
  { id: 'settings', label: 'Go to settings', icon: SettingsIcon, shortcut: 'G S' },
]

function PaletteDemo({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const [recent, setRecent] = useState<Action[]>([navigation[1]!, suggestions[0]!])
  const [theme, setTheme] = useState('System')
  useEffect(() => () => toast.dismiss(), [])

  const run = (label: string, action?: Action) => {
    if (action) setRecent((list) => [action, ...list.filter((a) => a.id !== action.id)].slice(0, 3))
    setOpen(false)
    toast.success(label)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="flex h-14 items-center justify-between gap-4 border-b border-line px-5">
        <span className="text-ui font-semibold">acme</span>
        <Button variant="outline" onClick={() => setOpen(true)} className="w-72 justify-between text-fg-muted">
          <span className="flex items-center gap-2">
            <SearchIcon />
            Search or run a command…
          </span>
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </Button>
        <span className="w-12" />
      </header>
      <main className="grid flex-1 place-items-center p-8 text-ui text-fg-muted">
        Press ⌘K (Ctrl+K), or use the search button.
      </main>
      <CommandPalette open={open} onOpenChange={setOpen}>
        {({ page, push, search }) => {
          if (page?.id === 'projects') return <ProjectsPage />
          if (page?.id.startsWith('project:')) return <ProjectPage project={page.label} onRun={(l) => run(l)} />
          if (page?.id === 'people') return <PeoplePage onRun={(l) => run(l)} />
          if (page?.id === 'theme')
            return (
              <ThemePage
                theme={theme}
                onTheme={(t) => {
                  setTheme(t)
                  run(`Theme set to ${t}`)
                }}
              />
            )
          const select = (action: Action) => {
            if (action.id === 'projects') push({ id: 'projects', label: 'Projects', placeholder: 'Search projects…' })
            else if (action.id === 'assign') push({ id: 'people', label: 'Assign to', placeholder: 'Search people…' })
            else run(action.label, action)
          }
          const row = (action: Action, group: string) => (
            <CommandItem
              key={`${group}-${action.id}`}
              value={`${group} ${action.label}`}
              keywords={action.keywords}
              onSelect={() => select(action)}
            >
              <action.icon />
              {action.label}
              {action.shortcut && <CommandShortcut>{action.shortcut}</CommandShortcut>}
            </CommandItem>
          )
          return (
            <>
              {!search && recent.length > 0 && (
                <CommandGroup heading="Recent">
                  {recent.map((action) => (
                    <CommandItem key={`recent-${action.id}`} value={`recent ${action.label}`} onSelect={() => select(action)}>
                      <ClockIcon />
                      {action.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              <CommandGroup heading="Suggestions">{suggestions.map((a) => row(a, 'suggestions'))}</CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Navigation">{navigation.map((a) => row(a, 'navigation'))}</CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Preferences">
                <CommandItem
                  value="preferences Change theme"
                  onSelect={() => push({ id: 'theme', label: 'Theme', placeholder: 'Choose a theme…' })}
                >
                  <ThemeIcon />
                  Change theme…
                  <span className="ms-auto text-ui-sm text-fg-muted">{theme}</span>
                </CommandItem>
              </CommandGroup>
              <IssueResults search={search} onRun={(l) => run(l)} />
            </>
          )
        }}
      </CommandPalette>
      <Toaster />
    </div>
  )
}

/** An app header with ⌘K: recent items, three levels of pages (Projects → a project → its actions), results fetched as you type (try “search”), and a toast when a command runs. */
export const Hero: Story = {
  render: () => <PaletteDemo />,
}

/** Open from the start, for looking at the palette itself. */
export const Open: Story = {
  tags: ['!autodocs'],
  render: () => <PaletteDemo defaultOpen />,
}

/**
 * Touch (`YoujProvider device="touch"`, a phone's width): the palette is a tall bottom sheet. The key footer is
 * gone, the breadcrumb is the way back from a page, and pulling the sheet down closes it from any page.
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
  render: () => <PaletteDemo />,
}
