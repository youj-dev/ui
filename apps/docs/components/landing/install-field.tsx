'use client'

import { lazy, Suspense, useState } from 'react'
import { ChevronDownIcon } from '@youj/icons/components/youj/icons/chevron-down'
import { CopyButton } from '@/components/ui/copy-button'
import { cn } from '@/lib/cn'
import type { PackageManager } from '@/lib/package-manager'
import { useAiClient } from '@/lib/ai-client'
import { AI_CLIENTS, type AiClient } from '@/lib/mcp-config'
import { usePackageManager } from '@/lib/use-package-manager'

/** What each manager runs the CLI with, adds packages with, and flags a dev dependency with. */
const MANAGERS: { value: PackageManager; runner: string; add: string; dev: string }[] = [
  { value: 'npm', runner: 'npx', add: 'npm i', dev: '-D' },
  { value: 'pnpm', runner: 'pnpm dlx', add: 'pnpm add', dev: '-D' },
  { value: 'yarn', runner: 'yarn dlx', add: 'yarn add', dev: '--dev' },
  { value: 'bun', runner: 'bunx', add: 'bun add', dev: '-D' },
]

const loadMenu = () => void import('./install-menu')
const InstallMenu = lazy(() => import('./install-menu'))

const TRIGGER = 'focus-ring inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border-0 bg-transparent px-2.5 font-mono text-[13px] text-fg-muted shadow-none transition-colors hover:text-fg'

export type InstallMode = 'package' | 'registry'

/**
 * What the field installs: the CLI (`@youj/cli <run>`), packages from npm, or a command of an AI coding tool, where the
 * menu picks the tool instead of the package manager.
 */
export type Install =
  | { kind: 'cli'; /** What follows `@youj/cli`: `init`, `add button`. */ run: string }
  | { kind: 'package'; /** `@youj/react recharts` */ packages: string; /** A dev dependency: `-D` (`--dev` for yarn). */ dev?: boolean }
  | { kind: 'client'; /** The whole command, for each tool: `claude mcp add …`. */ commands: Partial<Record<AiClient, string>> }

/**
 * The install command as one field: a menu in front (the package manager, and where both apply, Package or Copy in),
 * the command in the docs' shell colors (the program in ink, its arguments in the string color) and its copy button
 * at the end. The manager is shared by every field on the page; the mode is the caller's, so `mode` is passed only
 * where both routes exist.
 */
export function InstallField({
  install,
  run = 'init',
  label = 'Install command',
  mode,
  className,
}: {
  install?: Install
  label?: string
  /** Shorthand for `{ kind: 'cli', run }`. */
  run?: string
  /** Shows the Package | Copy in toggle at the top of the menu. */
  mode?: { value: InstallMode; onChange: (mode: InstallMode) => void }
  className?: string
}) {
  const [manager, setManager] = usePackageManager()
  const [client, setClient] = useAiClient()
  const [open, setOpen] = useState(false)
  const current = MANAGERS.find((m) => m.value === manager) ?? MANAGERS[0]
  const what = install ?? { kind: 'cli', run }
  // The menu picks what the command is worded for: the package manager, or the AI tool.
  const tools = what.kind === 'client' ? AI_CLIENTS.filter((c) => what.commands[c.value]) : []
  const tool = tools.find((c) => c.value === client) ?? tools[0]
  const choice =
    what.kind === 'client'
      ? { value: tool?.value ?? client, label: tool?.label ?? client, options: tools, onChange: (v: string) => setClient(v as AiClient), group: 'AI tool' }
      : { value: current.value, label: current.value, options: MANAGERS.map((m) => ({ value: m.value, label: m.value })), onChange: (v: string) => setManager(v as PackageManager), group: 'Package manager' }
  const command =
    what.kind === 'client'
      ? (what.commands[tool?.value ?? client] ?? '')
      : `${what.kind === 'cli' ? current.runner : current.add} ${what.kind === 'cli' ? `@youj/cli ${what.run}` : `${what.dev ? `${current.dev} ` : ''}${what.packages}`}`
  const [program, ...args] = command.split(' ')
  const rest = args.join(' ')
  // Until it's opened the trigger is a plain button; the menu's code is fetched when it's pointed at or focused, and the first press swaps it in, open.
  const trigger = (
    <button
      type="button"
      aria-label="Install options"
      aria-haspopup="menu"
      aria-expanded={open}
      className={TRIGGER}
      onPointerEnter={loadMenu}
      onFocus={loadMenu}
      onClick={() => setOpen(true)}
      onKeyDown={(event) => event.key === 'ArrowDown' && (event.preventDefault(), setOpen(true))}
    >
      {choice.label}
      <ChevronDownIcon size={14} aria-hidden />
    </button>
  )

  return (
    <div className={cn('code-chip h-11 max-w-full py-1 ps-1 pe-1', className)}>
      {open ? (
        <Suspense fallback={trigger}>
          <InstallMenu value={choice.value} label={choice.label} onValueChange={choice.onChange} options={choice.options} group={choice.group} mode={what.kind === 'client' ? undefined : mode} triggerClass={TRIGGER} />
        </Suspense>
      ) : (
        trigger
      )}
      <span aria-hidden className="h-5 w-px shrink-0 bg-line" />
      <div role="group" aria-label={label} className="min-w-0 flex-1 truncate ps-1.5 whitespace-nowrap">
        <code>
          <span className="text-fg">{program}</span> <span style={{ color: 'var(--code-string)' }}>{rest}</span>
        </code>
      </div>
      <CopyButton value={command} label={what.kind === 'client' ? 'Copy command' : 'Copy install command'} />
    </div>
  )
}
