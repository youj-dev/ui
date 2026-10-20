import { useEffect, useState, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useYouj } from '@youj/core'
import { cn } from '@youj/core'
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  AtSignIcon,
  BarChartIcon,
  BatteryIcon,
  BellIcon,
  CameraIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  CompassIcon,
  CopyIcon,
  DatabaseIcon,
  DownloadIcon,
  EyeIcon,
  FilterIcon,
  FingerprintIcon,
  GitBranchIcon,
  HeartIcon,
  HomeIcon,
  ImageIcon,
  InboxIcon,
  InfoIcon,
  LayersIcon,
  LayoutGridIcon,
  LineChartIcon,
  LinkIcon,
  LoaderDotsIcon,
  LoaderRingIcon,
  LockIcon,
  MailIcon,
  MenuIcon,
  MessageIcon,
  MicIcon,
  MusicIcon,
  PencilIcon,
  PhoneIcon,
  PieChartIcon,
  PlayIcon,
  PlusIcon,
  PowerIcon,
  RefreshIcon,
  SearchIcon,
  SendIcon,
  SettingsIcon,
  ShareIcon,
  ShieldCheckIcon,
  SkipForwardIcon,
  SparklesIcon,
  StarIcon,
  TerminalIcon,
  ThemeIcon,
  TrashIcon,
  TrendingUpIcon,
  UploadIcon,
  VolumeIcon,
  WifiIcon,
} from './index'
import { Button, ease, focusRing, IconButton, Panel, useFlash } from './story-kit'

const meta = {
  title: 'Icons/In context',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The set inside real UI, one story per category. Icons inside a button, link or `data-yj-trigger` group animate when that parent is hovered or keyboard-focused, so the whole control is the hit area. State icons are driven by the same state as the control (menu open, playing, muted, copied…).',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/* ── Shared UI ───────────────────────────────────────────────────────────── */


function Stage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex min-h-screen items-center justify-center bg-canvas p-6 md:p-10', className)}>{children}</div>
}

/* ── Navigation ──────────────────────────────────────────────────────────── */

function NavigationDemo() {
  const [open, setOpen] = useState(() => typeof window === 'undefined' || window.matchMedia('(min-width: 768px)').matches)
  const [menu, setMenu] = useState(false)
  const [current, setCurrent] = useState('Home')
  const items = [
    { label: 'Home', Icon: HomeIcon },
    { label: 'Search', Icon: SearchIcon },
    { label: 'Explore', Icon: CompassIcon },
    { label: 'Apps', Icon: LayoutGridIcon },
  ]
  return (
    <Stage>
      <Panel className="flex h-[480px] w-full max-w-[860px] overflow-hidden">
        <nav aria-label="Primary" className={cn('flex shrink-0 flex-col gap-1 border-r border-line bg-canvas p-3', open ? 'w-52' : 'w-[60px]')}>
          <div className="mb-3 flex h-9 items-center gap-2 px-1.5">
            <span className="size-6 shrink-0 rounded-md bg-accent" />
            {open && <span className="text-sm font-semibold tracking-tight text-fg">Northwind</span>}
          </div>
          {items.map(({ label, Icon }) => (
            <a
              key={label}
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setCurrent(label)
              }}
              aria-current={current === label ? 'page' : undefined}
              className={cn(
                'flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm',
                ease,
                focusRing,
                current === label ? 'bg-selected text-fg' : 'text-fg-muted hover:bg-hover hover:text-fg',
              )}
            >
              <Icon size={18} />
              {open && label}
            </a>
          ))}
        </nav>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center gap-2 border-b border-line px-3">
            <IconButton label={open ? 'Collapse sidebar' : 'Expand sidebar'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
              <MenuIcon size={18} active={!open} />
            </IconButton>
            <div className="relative">
              <Button variant="ghost" aria-expanded={menu} aria-haspopup="menu" onClick={() => setMenu((m) => !m)}>
                Acme Studio
                <ChevronDownIcon size={16} active={menu} />
              </Button>
              {menu && (
                <div role="menu" className="absolute top-10 left-0 z-10 w-48 rounded-xl border border-line bg-surface p-1 shadow-lg">
                  {['Acme Studio', 'Personal', 'Create workspace…'].map((w) => (
                    <button key={w} role="menuitem" type="button" onClick={() => setMenu(false)} className={cn('flex h-8 w-full items-center rounded-md px-2.5 text-left text-sm text-fg-muted hover:bg-hover hover:text-fg', ease, focusRing)}>
                      {w}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </header>
          <main className="flex flex-1 flex-col justify-center gap-5 p-10">
            <p className="font-mono text-[11px] tracking-[0.18em] text-fg-subtle uppercase">{current}</p>
            <h2 className="text-2xl font-semibold tracking-tight text-fg">Finish setting up your workspace</h2>
            <p className="max-w-md text-sm leading-relaxed text-fg-muted">Two steps left: invite your team and connect a repository. It takes about a minute.</p>
            <div className="flex items-center gap-3">
              <Button variant="primary">
                Continue
                <ArrowRightIcon size={16} strokeWidth={1.75} />
              </Button>
              <a href="#" className={cn('inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm text-fg-muted hover:text-fg', ease, focusRing)}>
                Read the guide
                <ArrowUpRightIcon size={15} strokeWidth={1.75} />
              </a>
            </div>
          </main>
        </div>
      </Panel>
    </Stage>
  )
}

export const Navigation: Story = {
  parameters: { docs: { description: { story: 'Sidebar links (hover the whole row), menu ↔ close collapsing the sidebar, a disclosure chevron, and arrow CTAs.' } } },
  render: () => <NavigationDemo />,
}

/* ── Actions ─────────────────────────────────────────────────────────────── */

function ActionsDemo() {
  const [copied, copy] = useFlash()
  const [saved, save] = useFlash(4)
  const [adding, setAdding] = useState(false)
  const files = [
    { name: 'brand-guidelines.pdf', size: '4.2 MB', when: '2m ago' },
    { name: 'launch-deck.key', size: '18.9 MB', when: '1h ago' },
    { name: 'hero-video.mp4', size: '212 MB', when: 'Yesterday' },
  ]
  return (
    <Stage>
      <Panel className="w-full max-w-[720px]">
        <div className="flex flex-wrap items-center gap-1 border-b border-line p-2">
          <IconButton label="Filter">
            <FilterIcon size={18} />
          </IconButton>
          <IconButton label="Refresh">
            <RefreshIcon size={18} />
          </IconButton>
          <span className="mx-1 h-5 w-px bg-line" />
          <IconButton label="Upload">
            <UploadIcon size={18} />
          </IconButton>
          <IconButton label="Download">
            <DownloadIcon size={18} />
          </IconButton>
          <IconButton label="Copy link" onClick={copy}>
            <LinkIcon size={18} />
          </IconButton>
          <div className="ml-auto flex items-center gap-2">
            <Button onClick={copy} className="min-w-[112px]">
              <CopyIcon size={16} active={copied} />
              {copied ? 'Copied' : 'Copy path'}
            </Button>
            <Button variant="primary" aria-expanded={adding} onClick={() => setAdding((a) => !a)}>
              <PlusIcon size={16} strokeWidth={1.75} active={adding} />
              {adding ? 'Cancel' : 'New file'}
            </Button>
          </div>
        </div>
        <ul>
          {files.map((f) => (
            <li key={f.name} className={cn('group flex items-center gap-4 border-b border-line px-4 py-3 last:border-0 hover:bg-hover', ease)}>
              <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-fg">{f.name}</span>
              <span className="w-16 text-right text-xs text-fg-subtle">{f.size}</span>
              <span className="w-20 text-right text-xs text-fg-subtle">{f.when}</span>
              <div className="flex">
                <IconButton label={`Rename ${f.name}`}>
                  <PencilIcon size={16} />
                </IconButton>
                <IconButton label={`Delete ${f.name}`} variant="danger">
                  <TrashIcon size={16} />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-end gap-3 border-t border-line p-3">
          <span className="text-xs text-fg-subtle">{saved ? 'All changes saved' : '3 unsaved changes'}</span>
          <Button variant={saved ? 'secondary' : 'primary'} onClick={save} className="min-w-[132px] justify-center">
            {saved ? (
              <>
                <span className="text-success">
                  <CheckIcon size={16} strokeWidth={2} trigger="mount" />
                </span>
                Saved
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </div>
      </Panel>
    </Stage>
  )
}

export const Actions: Story = {
  parameters: { docs: { description: { story: 'A file toolbar. Copy morphs to copied and back on its own; Save draws a check on mount; New file turns its plus into a close.' } } },
  render: () => <ActionsDemo />,
}

/* ── Status ──────────────────────────────────────────────────────────────── */

function StatusDemo() {
  const k = useYouj()
  const [liked, setLiked] = useState(false)
  const [deploy, setDeploy] = useState<'idle' | 'running' | 'done'>('idle')
  useEffect(() => {
    if (deploy !== 'running') return
    const t = setTimeout(() => setDeploy('done'), k.ms('deliberate') * 4)
    return () => clearTimeout(t)
  }, [deploy, k])

  const toasts = [
    { Icon: CheckCircleIcon, tone: 'text-success', title: 'Invoice sent', body: 'INV-2041 is on its way to billing@acme.co.' },
    { Icon: AlertTriangleIcon, tone: 'text-warning', title: 'Usage at 90%', body: 'You’ll hit the build-minutes limit in about 3 days.' },
    { Icon: InfoIcon, tone: 'text-accent', title: 'New in 2.4', body: 'Preview deployments now keep their own env vars.' },
  ]

  return (
    <Stage className="gap-8 max-lg:flex-col">
      <div className="flex w-full max-w-[360px] flex-col gap-2.5">
        {toasts.map(({ Icon, tone, title, body }) => (
          <div key={title} role="status" data-yj-trigger className="flex gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-sm">
            <span className={cn('mt-0.5', tone)}>
              <Icon size={18} strokeWidth={1.75} trigger="mount" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-fg">{title}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-fg-muted">{body}</p>
            </div>
          </div>
        ))}
      </div>
      <Panel className="flex w-full max-w-[380px] flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-fg">Release 2.4.0</p>
          <div className="relative">
            <IconButton label="Notifications, 3 unread">
              <BellIcon size={18} />
            </IconButton>
            <span className="pointer-events-none absolute top-1.5 right-1.5 size-2 rounded-full bg-accent ring-2 ring-surface" />
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-well px-3 py-2.5 text-[13px] text-fg-muted">
          <LoaderDotsIcon size={18} aria-label="Thinking" />
          Assistant is drafting the changelog
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={deploy === 'done' ? 'secondary' : 'primary'} disabled={deploy === 'running'} onClick={() => setDeploy('running')} className="min-w-[128px] disabled:opacity-80">
            {deploy === 'idle' && 'Deploy'}
            {deploy === 'running' && (
              <>
                <LoaderRingIcon size={16} strokeWidth={2} aria-label="Deploying" />
                Deploying…
              </>
            )}
            {deploy === 'done' && (
              <>
                <span className="text-success">
                  <CheckCircleIcon size={16} strokeWidth={1.75} trigger="mount" />
                </span>
                Deployed
              </>
            )}
          </Button>
          <Button>
            <SparklesIcon size={16} />
            Summarize
          </Button>
        </div>
        <div className="flex items-center gap-1 border-t border-line pt-3">
          <Button variant="ghost" aria-pressed={liked} onClick={() => setLiked((l) => !l)} className={liked ? 'text-danger hover:text-danger' : undefined}>
            <HeartIcon size={16} active={liked} />
            {liked ? 25 : 24}
          </Button>
          <Button variant="ghost">
            <StarIcon size={16} />
            Star
          </Button>
        </div>
      </Panel>
    </Stage>
  )
}

export const Status: Story = {
  parameters: { docs: { description: { story: 'Toasts draw their status icon on mount; a deploy button swaps a spinner for a drawn check; the like button pops the heart (the one earned bounce).' } } },
  render: () => <StatusDemo />,
}

/* ── Media ───────────────────────────────────────────────────────────────── */

function MediaDemo() {
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [micOff, setMicOff] = useState(true)
  return (
    <Stage className="gap-8 max-lg:flex-col">
      <Panel className="w-full max-w-[340px] p-4">
        <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-well text-fg-subtle" data-yj-trigger>
          <MusicIcon size={56} strokeWidth={1.25} trigger={playing ? 'loop' : 'hover'} />
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-fg">Low Orbit</p>
            <p className="text-[13px] text-fg-muted">Mira Sol · Satellites</p>
          </div>
          <span className="font-mono text-[11px] text-fg-subtle">1:12 / 3:48</span>
        </div>
        <div className="mt-3 h-1 rounded-full bg-well">
          <div className="h-full w-[32%] rounded-full bg-fg" />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <IconButton label={muted ? 'Unmute' : 'Mute'} aria-pressed={muted} onClick={() => setMuted((m) => !m)}>
            <VolumeIcon size={18} active={muted} />
          </IconButton>
          <button
            type="button"
            aria-label={playing ? 'Pause' : 'Play'}
            onClick={() => setPlaying((p) => !p)}
            className={cn('flex size-12 items-center justify-center rounded-full bg-fg text-canvas', focusRing)}
          >
            <PlayIcon size={20} strokeWidth={1.75} active={playing} />
          </button>
          <IconButton label="Next track">
            <SkipForwardIcon size={18} />
          </IconButton>
        </div>
      </Panel>

      <Panel className="flex items-center gap-2 rounded-full p-2">
        <IconButton label={micOff ? 'Unmute microphone' : 'Mute microphone'} aria-pressed={micOff} onClick={() => setMicOff((m) => !m)} className={cn('size-11 rounded-full', micOff && 'text-danger hover:text-danger')}>
          <MicIcon size={20} active={micOff} />
        </IconButton>
        <IconButton label="Take snapshot" className="size-11 rounded-full">
          <CameraIcon size={20} />
        </IconButton>
        <IconButton label="Share an image" className="size-11 rounded-full">
          <ImageIcon size={20} />
        </IconButton>
      </Panel>
    </Stage>
  )
}

export const Media: Story = {
  parameters: { docs: { description: { story: 'A player: play ↔ pause and volume ↔ muted follow the control state; the artwork note dances while playing. A call bar with mic ↔ muted.' } } },
  render: () => <MediaDemo />,
}

/* ── Communication ───────────────────────────────────────────────────────── */

function CommunicationDemo() {
  const [tab, setTab] = useState<'inbox' | 'mentions'>('inbox')
  const [sent, send] = useFlash()
  const threads = [
    { from: 'Ana Ruiz', text: 'Pushed the new onboarding copy, can you take a look?', time: '09:41', unread: true },
    { from: 'Deploy bot', text: 'Preview for #482 is ready.', time: '09:12', unread: false },
    { from: 'Kenji Mori', text: '@you the pricing table still shows last year’s tiers', time: 'Tue', unread: false },
  ]
  return (
    <Stage>
      <Panel className="flex w-full max-w-[520px] flex-col">
        <div className="flex items-center gap-1 border-b border-line p-2">
          {(
            [
              ['inbox', 'Inbox', InboxIcon],
              ['mentions', 'Mentions', AtSignIcon],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn('inline-flex h-8 items-center gap-2 rounded-md px-2.5 text-sm', ease, focusRing, tab === id ? 'bg-selected text-fg' : 'text-fg-muted hover:text-fg')}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
          <div className="ml-auto flex">
            <IconButton label="Start a call">
              <PhoneIcon size={17} />
            </IconButton>
            <IconButton label="Share conversation">
              <ShareIcon size={17} />
            </IconButton>
            <IconButton label="Email a copy">
              <MailIcon size={17} />
            </IconButton>
          </div>
        </div>
        <ul>
          {threads.map((t) => (
            <li key={t.from} className="flex gap-3 border-b border-line px-4 py-3">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ background: t.unread ? 'var(--color-accent)' : 'transparent' }} />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-fg">{t.from}</p>
                  <span className="text-xs text-fg-subtle">{t.time}</span>
                </div>
                <p className="truncate text-[13px] text-fg-muted">{t.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2 px-4 pt-3 text-xs text-fg-subtle">
          <MessageIcon size={15} trigger="loop" />
          Ana is typing…
        </div>
        <div className="m-3 flex items-center gap-2 rounded-xl border border-line bg-canvas p-1.5 pl-3.5">
          <input aria-label="Reply" placeholder="Reply to Ana…" className="h-8 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle" />
          <Button variant="primary" onClick={send} className="h-8">
            {sent ? 'Sent' : 'Send'}
            <SendIcon size={15} strokeWidth={1.75} active={sent || undefined} />
          </Button>
        </div>
      </Panel>
    </Stage>
  )
}

export const Communication: Story = {
  parameters: { docs: { description: { story: 'An inbox: tabs, header actions, a looping typing indicator, and a send button whose plane flies out on hover and again on send.' } } },
  render: () => <CommunicationDemo />,
}

/* ── Data ────────────────────────────────────────────────────────────────── */

function Metric({ Icon, label, value, delta, children }: { Icon: (p: { size?: number }) => ReactNode; label: string; value: string; delta?: string; children?: ReactNode }) {
  return (
    <div data-yj-trigger tabIndex={0} className={cn('flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 hover:border-line-strong', ease, focusRing)}>
      <div className="flex items-center justify-between text-fg-muted">
        <span className="text-[13px]">{label}</span>
        <Icon size={18} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-fg tabular-nums">{value}</span>
        {delta && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
            <TrendingUpIcon size={14} strokeWidth={1.75} />
            {delta}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function DataDemo() {
  return (
    <Stage>
      <div className="grid w-full max-w-[860px] gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric Icon={BarChartIcon} label="Revenue" value="$48.2k" delta="12.4%" />
        <Metric Icon={LineChartIcon} label="Sessions" value="182k" delta="3.1%" />
        <Metric Icon={ActivityIcon} label="Uptime" value="99.98%" />
        <Metric Icon={PieChartIcon} label="Plan mix" value="64% Pro" />
        <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-2 sm:col-span-2 lg:col-span-4">
          {[
            { Icon: DatabaseIcon, name: 'postgres-main', meta: '12.4 GB · 3 replicas' },
            { Icon: LayersIcon, name: 'Environments', meta: 'production · staging · preview' },
          ].map(({ Icon, name, meta: m }) => (
            <a key={name} href="#" className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-fg-muted hover:bg-hover hover:text-fg', ease, focusRing)}>
              <Icon size={18} />
              <span className="text-sm text-fg">{name}</span>
              <span className="ml-auto font-mono text-xs text-fg-subtle">{m}</span>
            </a>
          ))}
        </div>
      </div>
    </Stage>
  )
}

export const Data: Story = {
  parameters: { docs: { description: { story: 'Metric cards are `data-yj-trigger` groups: hovering or focusing a card plays its chart icon. The growth delta draws its trend line too.' } } },
  render: () => <DataDemo />,
}

/* ── System ──────────────────────────────────────────────────────────────── */

function Row({ Icon, title, detail, children }: { Icon: ReactNode; title: string; detail: string; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-line px-5 py-3.5 last:border-0">
      <span className="text-fg-muted">{Icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-fg">{title}</p>
        <p className="text-xs text-fg-subtle">{detail}</p>
      </div>
      {children}
    </div>
  )
}

function Toggle({ on, onChange, label, children }: { on: boolean; onChange: () => void; label: string; children: ReactNode }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onChange} className={cn('inline-flex h-8 items-center gap-2 rounded-lg border border-line px-2.5 text-xs text-fg-muted hover:bg-hover hover:text-fg', ease, focusRing)}>
      {children}
    </button>
  )
}

function SystemDemo() {
  const [dark, setDark] = useState(true)
  const [reveal, setReveal] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  return (
    <Stage>
      <Panel className="w-full max-w-[520px]">
        <div className="flex items-center gap-2.5 border-b border-line px-5 py-4" data-yj-trigger>
          <SettingsIcon size={18} trigger="mount" />
          <h2 className="text-sm font-semibold text-fg">Settings</h2>
          <span className="ml-auto flex items-center gap-2 text-fg-subtle">
            <WifiIcon size={16} aria-label="Connected" />
            <BatteryIcon size={18} aria-label="Battery 82%" />
          </span>
        </div>
        <Row Icon={<ThemeIcon size={18} active={dark} />} title="Appearance" detail={dark ? 'Dark' : 'Light'}>
          <Toggle on={dark} onChange={() => setDark((d) => !d)} label="Dark mode">
            <ThemeIcon size={15} active={dark} />
            {dark ? 'Dark' : 'Light'}
          </Toggle>
        </Row>
        <Row Icon={<LockIcon size={18} active={unlocked} />} title="Vault" detail={unlocked ? 'Unlocked for 15 minutes' : 'Locked'}>
          <Toggle on={unlocked} onChange={() => setUnlocked((u) => !u)} label="Unlock vault">
            {unlocked ? 'Lock' : 'Unlock'}
          </Toggle>
        </Row>
        <div className="border-b border-line px-5 py-3.5">
          <label className="text-xs text-fg-subtle" htmlFor="api-key">
            API key
          </label>
          <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-line bg-canvas pr-1 pl-3 focus-within:ring-2 focus-within:ring-accent">
            <input id="api-key" readOnly type={reveal ? 'text' : 'password'} value="sk_demo_51Hx9QkT2" className="h-9 flex-1 bg-transparent font-mono text-[13px] text-fg outline-none" />
            <IconButton label={reveal ? 'Hide key' : 'Show key'} aria-pressed={reveal} onClick={() => setReveal((r) => !r)} className="size-7">
              <EyeIcon size={16} active={!reveal} />
            </IconButton>
          </div>
        </div>
        <Row Icon={<ShieldCheckIcon size={18} />} title="Two-factor authentication" detail="Enabled with passkey" />
        <Row Icon={<GitBranchIcon size={18} />} title="Production branch" detail="main">
          <Button variant="ghost" className="h-8 text-xs">
            Change
          </Button>
        </Row>
        <div className="flex flex-wrap items-center gap-2 px-5 py-4">
          <Button>
            <FingerprintIcon size={16} />
            Add passkey
          </Button>
          <Button>
            <TerminalIcon size={16} />
            Console
          </Button>
          <Button variant="danger" className="ml-auto">
            <PowerIcon size={16} />
            Restart
          </Button>
        </div>
      </Panel>
    </Stage>
  )
}

export const System: Story = {
  parameters: { docs: { description: { story: 'A settings panel: sun ↔ moon, lock ↔ unlock and eye ↔ eye-off follow their controls; the gear turns one tooth on mount.' } } },
  render: () => <SystemDemo />,
}
