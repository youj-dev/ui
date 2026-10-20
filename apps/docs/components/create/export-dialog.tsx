'use client'

import { useEffect, useId, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { DEFAULT_LOOK, useSoundCue, useYouj } from '@youj/core'
import { Collapse } from '@youj/motion'
import { themeErrors } from '@youj/core/lib/youj/theme'
import { ArchiveIcon, CheckCircleIcon, CircleAlertIcon, CodeIcon, CopyIcon, DownloadIcon, ListOrderedIcon, TerminalIcon } from '@youj/icons'
import { Button, Switch } from '@youj/react'
import { frameItems, frameScreens, SCREENS, type FrameConfig } from '@youj/react/docs/create/config'
import { createItems, youjAddCommand, type InstallMode } from '@youj/react/docs/create/codegen'
import { DEFAULT_SIZE, sameSize } from '@youj/react/docs/create/size-url'
import { lookStylesheet } from '@youj/react/docs/create/look-url'
import { ScrollFrame } from '@/components/docs/scroll-table'
import { CodePanel, type CodeFile } from '@/components/showcase/code-panel'
import { CodeExportDialog, ExportCommand, type CodeExportSection } from '@/components/ui/code-export-dialog'
import { CopyButton } from '@/components/ui/copy-button'
import { Segmented, TabList } from '@/components/ui/controls'
import { cn } from '@/lib/cn'
import type { CreateState } from '@/lib/create'
import { zip } from '@/lib/zip'
import {
  createCommand,
  FONTS_PATH,
  loadParts,
  readme,
  SHELL_PATH,
  THEME_CSS_PATH,
  THEME_PATH,
  themeCssFile,
  writtenFiles,
  type ExportFile,
} from './export-files'
import { highlightTsx } from './highlight'
import { copyToast } from '@/lib/copy-toast'

/* Create's "Get the code", in the site's large code modal, one section at a
 * time. Command, where it opens: the one line that does it all, its copy,
 * the theme's contrast check (a theme that misses WCAG AA blocks both
 * exports, as youj create refuses it, until it's fixed in the Theme step),
 * what to export (the frame, with or without its screens) and the link to share. Code browses every file as installed.
 * Download packs them into a .zip with a README. Instructions does it by
 * hand: the install command, then the shell and screens, then the theme (as
 * the package's or copied source's TypeScript, or plain CSS) and its
 * typefaces. */

/** Copies the command: the one big button. */
function CopyCommand({ command, disabled }: { command: string; disabled?: boolean }) {
  const k = useYouj()
  const cue = useSoundCue()
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <Button
      className="min-w-36 shrink-0 @max-xl:h-control-lg @max-xl:w-full"
      data-yj-trigger=""
      disabled={disabled}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(command)
        } catch {
          cue('error')
          return
        }
        cue('success')
        copyToast('Command copied', command.length <= 80 ? command : undefined)
        setCopied(true)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), k.ms('deliberate') * 3)
      }}
    >
      <CopyIcon size={16} strokeWidth={1.75} active={copied} />
      {copied ? 'Copied' : 'Copy command'}
      <span role="status" className="sr-only">
        {copied ? 'Command copied' : ''}
      </span>
    </Button>
  )
}

/** The command, as the section's hero: in a well with its copy at the end, or over a full-width copy where the section is narrow. */
function CommandLine({ command, disabled }: { command: string; disabled?: boolean }) {
  return (
    <div className="flex flex-col gap-2.5 @xl:flex-row @xl:items-center @xl:gap-3 @xl:rounded-xl @xl:border @xl:border-line @xl:bg-canvas @xl:py-1.5 @xl:ps-4 @xl:pe-1.5">
      <ScrollFrame
        label="Create command"
        group
        className="min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3.5 pt-2 pb-2.5 yj-scrollbar focus-ring @xl:rounded-sm @xl:border-0 @xl:bg-transparent @xl:p-0 @xl:pb-0.5"
      >
        {/* A command reads left to right in any language: the `$` and the quotes stay where the shell puts them. */}
        <p dir="ltr" className={cn('w-fit code-text leading-7 whitespace-nowrap', disabled ? 'text-fg-muted' : 'text-fg')}>
          <span aria-hidden className="me-2.5 text-fg-subtle select-none">
            $
          </span>
          {command}
        </p>
      </ScrollFrame>
      <CopyCommand command={command} disabled={disabled} />
    </div>
  )
}

/** A theme that misses AA blocks the export: which pairs, and a way to the fix. */
function ContrastIssues({ issues, onTheme }: { issues: ReturnType<typeof themeErrors>; onTheme: () => void }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-danger-line bg-danger-subtle px-3.5 py-3 text-[12.5px] leading-snug text-fg">
      <CircleAlertIcon size={15} strokeWidth={1.75} className="mt-px shrink-0 text-danger" />
      <span>
        {issues.length} {issues.length === 1 ? 'pair misses' : 'pairs miss'} WCAG AA contrast, so the export is blocked.{' '}
        <button type="button" onClick={onTheme} className="rounded-sm font-medium text-accent underline-offset-2 hover:underline focus-ring">
          Review the theme
        </button>
        {/* Which pairs, so the fix doesn't start with a hunt. */}
        <span className="mt-1.5 flex flex-col gap-0.5 code-text text-fg-muted">
          {issues.slice(0, 4).map((issue, i) => (
            <span key={i}>
              {issue.token}
              {issue.against && ` on ${issue.against}`}
              {issue.mode && ` (${issue.mode})`}
              {issue.ratio !== undefined && issue.min !== undefined && `: ${issue.ratio.toFixed(2)}:1, needs ${issue.min}:1`}
            </span>
          ))}
          {issues.length > 4 && <span>and {issues.length - 4} more</span>}
        </span>
      </span>
    </div>
  )
}

/** A titled group in a section, under a small label. */
function Group({ id, title, children, className }: { id: string; title: string; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={cn('flex flex-col gap-3', className)}>
      <h3 id={id} className="type-label leading-4">
        {title}
      </h3>
      {children}
    </section>
  )
}

/** What a written file is, in a word, for its tab: the path is under it. */
const FILE_NAMES: Record<string, string> = { 'app-shell.tsx': 'Shell', 'nav.ts': 'Nav', 'layout.tsx': 'Layout', 'theme.ts': 'Theme', 'fonts.ts': 'Fonts', 'theme.css': 'CSS' }

/** A written file's tab: what it is in a word (a screen's route by its name; the root route, which redirects to the home screen, is `Home`). */
function fileLabel(path: string): string {
  if (path === 'app/page.tsx') return 'Home'
  const parts = path.split('/')
  const file = parts.at(-1)!
  if (file !== 'page.tsx') return FILE_NAMES[file] ?? file
  const route = parts.at(-2)
  return Object.values(SCREENS).find((s) => s.route === route)?.label ?? 'Page'
}

/** A few files as tabs, the open one highlighted in place with its own copy. */
function Files({ files, label }: { files: ExportFile[]; label: string }) {
  const id = useId()
  const [path, setPath] = useState(files[0]!.path)
  const active = files.find((f) => f.path === path) ?? files[0]!
  const code = useMemo(() => highlightTsx(active.code), [active.code])
  const name = (p: string) => p.split('/').at(-1)!
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-canvas">
      <div className="flex items-center gap-1 border-b border-line pe-1">
        <TabList
          idBase={id}
          label={label}
          value={active.path}
          onChange={setPath}
          tabs={files.map((f) => ({ value: f.path, label: fileLabel(f.path), title: f.path }))}
          className="min-w-0 flex-1 px-1"
        />
        <CopyButton value={active.code} label={`Copy ${name(active.path)}`} />
      </div>
      <div role="tabpanel" id={`${id}-panel-${active.path}`} aria-labelledby={`${id}-tab-${active.path}`} className="flex flex-col">
        <p className="truncate px-4 pt-2.5 type-small text-fg-subtle">{active.path}</p>
        <div dir="ltr" tabIndex={0} aria-label={`${active.path} source`} className="code-panel max-h-[26rem] overflow-auto focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:ring-inset [&_pre]:pt-2">
          {code}
        </div>
      </div>
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: ReactNode; children: ReactNode }) {
  return (
    <li className="flex gap-4">
      <span aria-hidden className="mt-px grid size-6 shrink-0 place-items-center rounded-mark border border-line bg-surface font-sans text-[11px] text-fg-muted tabular-nums">
        {n}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <h3 className="text-[13.5px] leading-6 font-medium text-fg">{title}</h3>
        {children}
      </div>
    </li>
  )
}

const Mono = ({ children }: { children: ReactNode }) => <code className="code-inline">{children}</code>

const ZIP_NAME = 'youj-frame.zip'

export interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The button that opens it. */
  trigger?: ReactElement
  /** What the export writes: the frame and theme, with no screens when the screens stay behind. */
  state: CreateState
  /** The frame as designed, its screens included whether or not they're exported. */
  designed: FrameConfig
  includeScreens: boolean
  onIncludeScreensChange: (include: boolean) => void
  /** The link the export writes (the frame alone when the screens stay behind). */
  link: string
  /** The link to share: the frame as designed. */
  shareLink: string
  /** Every file the frame export writes, with the parts as installed once they've loaded. */
  files: CodeFile[]
  /** Go to the Theme step, to fix a contrast issue. */
  onTheme: () => void
}

export function ExportDialog({ open, onOpenChange, trigger, state, designed, includeScreens, onIncludeScreensChange, link, shareLink, files, onTheme }: ExportDialogProps) {
  const id = useId()
  const k = useYouj()
  const command = createCommand(link)
  const [mode, setMode] = useState<InstallMode>('package')
  const written = useMemo(() => writtenFiles(state, link, mode), [state, link, mode])
  // Errors only: AA failures (and unusable inputs) block the export; Create never sets allowLowContrast.
  const issues = useMemo(() => themeErrors(state.theme), [state.theme])
  const blocked = issues.length > 0
  const [saving, setSaving] = useState<'idle' | 'busy' | 'done' | 'failed'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const themeFiles = [...written.filter((f) => f.path === THEME_PATH || f.path === FONTS_PATH), themeCssFile(state)]
  const frameFiles = written.filter((f) => f.path !== THEME_PATH && f.path !== FONTS_PATH)
  const parts = frameItems(state.frame).length
  const stylesheet = lookStylesheet(state.style)
  const designedScreens = frameScreens(designed)
  // "the task board screen", "the 3 screens"
  const screensLabel = designedScreens.length ? (designedScreens.length > 1 ? `${designedScreens.length} screens` : `${designedScreens[0]!.label.toLowerCase()} screen`) : null
  const exported = includeScreens && screensLabel !== null
  const routeList = designedScreens.map((s) => `${s.route}/page.tsx`).join(', ')

  const download = async () => {
    setSaving('busy')
    try {
      const contents = [readme(state, link), ...writtenFiles(state, link, 'package'), ...(await loadParts(createItems(state.frame, state.style)))]
      const bytes = zip(contents.map((f) => ({ path: f.path, content: `${f.code}\n` })))
      const url = URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: 'application/zip' }))
      const a = Object.assign(document.createElement('a'), { href: url, download: ZIP_NAME })
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 0)
      setSaving('done')
    } catch {
      setSaving('failed')
    }
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setSaving('idle'), k.ms('deliberate') * 3)
  }

  const commandSection = (
    <div className="flex flex-col">
      <CommandLine command={command} disabled={blocked} />
      <div className="mt-3">
        {/* A pass is a quiet line; issues get a box, and a way to them. */}
        {blocked ? (
          <ContrastIssues issues={issues} onTheme={onTheme} />
        ) : (
          <p className="flex items-center gap-2 text-[12.5px] text-fg-muted">
            <CheckCircleIcon size={14} strokeWidth={1.75} className="shrink-0 text-success" />
            Passes WCAG AA contrast in light and dark
          </p>
        )}
      </div>

      <Group id={`${id}-options`} title="Options" className="mt-10">
        <div className="flex flex-col rounded-xl border border-line">
          {/* With no screens designed the row folds away (and back) rather than snapping, and the share link rides up with it. */}
          <Collapse open={screensLabel !== null}>
            {screensLabel && (
              <label className="flex cursor-pointer items-center justify-between gap-6 px-4 py-3.5">
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[13px] leading-5 font-medium text-fg">Include the {screensLabel}</span>
                  <span className="text-[12.5px] leading-snug text-fg-muted">
                    {includeScreens ? `As routes (${routeList}), linked from the sidebar; / goes to the first` : 'The frame alone: bring your own pages'}
                  </span>
                </span>
                <Switch checked={includeScreens} onCheckedChange={(next) => onIncludeScreensChange(next)} />
              </label>
            )}
          </Collapse>
        </div>
      </Group>

      <Group id={`${id}-share`} title="Share link" className="mt-10">
        <ExportCommand command={shareLink} label="Share link" prompt={false} />
        <p className="text-[12.5px] leading-snug text-fg-muted">Opens this frame in Create as you designed it, screens and all.</p>
      </Group>
    </div>
  )

  const fileBrowser = (list: CodeFile[], download: string) =>
    list.length ? (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-line bg-canvas light:bg-surface">
        <CodePanel idBase={`${id}-${download}`} files={list} download={download} height="100%" />
      </div>
    ) : (
      <p aria-busy className="loading-in text-[12.5px] text-fg-muted">
        Reading the files…
      </p>
    )

  const downloadSection = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-4 rounded-xl border border-line p-4 @lg:flex-row @lg:items-center @lg:gap-5 @lg:py-3.5 @lg:ps-4 @lg:pe-3.5">
        <div className="flex min-w-0 flex-1 items-center gap-3.5">
          <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-canvas text-fg-muted">
            <ArchiveIcon size={18} strokeWidth={1.6} />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate type-small font-medium text-fg">{ZIP_NAME}</span>
            <span className="text-[12.5px] leading-snug text-fg-muted">README.md and every file, each at its path in your app</span>
          </span>
        </div>
        <Button size="lg" className="shrink-0 @max-lg:w-full" data-yj-trigger="" onClick={download} disabled={saving === 'busy' || blocked}>
          <DownloadIcon size={16} strokeWidth={1.75} active={saving === 'done'} />
          {saving === 'busy' ? 'Packing…' : saving === 'failed' ? 'Couldn’t pack it. Try again' : 'Download .zip'}
        </Button>
        <span role="status" className="sr-only">
          {saving === 'done' ? `Saved ${ZIP_NAME}` : saving === 'failed' ? 'The download failed' : ''}
        </span>
      </div>
      {blocked && <ContrastIssues issues={issues} onTheme={onTheme} />}
    </div>
  )

  const byHand = (
    <ol className="flex max-w-[60rem] flex-col gap-9">
      <Step n={1} title={`Add the ${parts} parts, with the components they use${stylesheet ? `, and the ${state.style} style` : ''}`}>
        <ExportCommand command={youjAddCommand(state.frame, state.style)} label="Install command" />
        {stylesheet && (
          <p className="text-[12.5px] leading-relaxed text-fg-muted">
            The style&rsquo;s recipes land in <Mono>{stylesheet}</Mono>: import it right after <Mono>ui.css</Mono>. The package&rsquo;s stylesheet has them already.
          </p>
        )}
      </Step>
      <Step n={2} title={exported ? 'Add the shell, the nav and the screens' : 'Add the shell and the nav'}>
        <Files files={frameFiles} label="Shell files" />
        <p className="text-[12.5px] leading-relaxed text-fg-muted">
          <Mono>{SHELL_PATH}</Mono> composes the parts.{' '}
          {exported ? 'The route group’s layout wraps its screens in it, and each route renders a screen block you can change. lib/nav.ts is the sidebar’s links to them.' : 'Wrap your pages in it, e.g. in a route group’s layout, and give each an item in lib/nav.ts.'}
        </p>
      </Step>
      <Step n={3} title="Add the theme">
        <Segmented
          label="Youj in your app"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'package', label: 'From the package' },
            { value: 'registry', label: 'Copied source' },
          ]}
          className="w-fit"
        />
        <Files key={mode} files={themeFiles} label="Theme files" />
        <p className="text-[12.5px] leading-relaxed text-fg-muted">
          Give your root <Mono>YoujProvider</Mono> the theme
          {state.style !== DEFAULT_LOOK && (
            <>
              {' '}
              and <Mono>look=&quot;{state.style}&quot;</Mono>
            </>
          )}{' '}
          {sameSize(state.size, DEFAULT_SIZE) ? (
            <> at the standard size (the provider&rsquo;s own, so no size props)</>
          ) : (
            <>
              {' '}
              at your size,{' '}
              <Mono>
                density=&quot;{state.size.density}&quot; scaling=&quot;{state.size.scaling}&quot;
              </Mono>
            </>
          )}
          {themeFiles.some((f) => f.path === FONTS_PATH) && (
            <>
              , and put <Mono>fontVariables</Mono> on <Mono>{'<html>'}</Mono>
            </>
          )}
          . Without a provider, <Mono>{THEME_CSS_PATH}</Mono> sets the same theme as CSS variables.
        </p>
      </Step>
    </ol>
  )

  const icon = { size: 16, strokeWidth: 1.75 }
  const sections: CodeExportSection[] = [
    {
      value: 'command',
      label: 'Command',
      icon: <TerminalIcon {...icon} />,
      description: `Run it in your app’s folder. It sets Youj up if it isn’t there yet, applies your theme and typefaces, and adds the frame${exported ? ` and the ${screensLabel}` : ''}.`,
      content: commandSection,
    },
    {
      value: 'code',
      label: 'Code',
      icon: <CodeIcon {...icon} />,
      description: 'Every file it writes, and the parts as youj add installs them.',
      content: fileBrowser(files, 'youj-frame'),
      fill: true,
    },
    {
      value: 'download',
      label: 'Download',
      icon: <DownloadIcon {...icon} />,
      description: 'Every file in one .zip, with a README on where each one goes.',
      content: downloadSection,
    },
    {
      value: 'steps',
      label: 'Instructions',
      icon: <ListOrderedIcon {...icon} />,
      description: 'The same by hand: add the parts, then the shell and the screens, then the theme and its typefaces.',
      content: byHand,
    },
  ]

  return (
    <CodeExportDialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      title="Get the code"
      description="Your frame and theme, as code for your app."
      sections={sections}
      navLabel="The code"
    />
  )
}
