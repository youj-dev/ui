'use client'

import type { ReactNode } from 'react'
import { CheckIcon, CloudUploadIcon, FileIcon, GitBranchIcon, LineChartIcon, MicIcon, SparklesIcon, SquareIcon, XIcon } from '@youj/icons'
import { Badge } from '@youj/react'
import { cn } from '@/lib/cn'
import type { ContextCopy } from './context-copy'

/* The screens a loader is shown in with the stage's view on In context (./context-copy says which and its words): one
 * screen filling the stage's room where a large loader is what you'd wait on, built from @youj/react's parts in the
 * stage's theme: a deploy's status page (its steps and the commit), an upload's processing card (the drop zone, the
 * file and how far along it is), an assistant thinking (what it was asked, what it's reading), a dashboard's chart
 * while its numbers come (the figures waiting on them) and an app's launch screen. The loader keeps the size it has on
 * its own: each screen gives it the middle of its body and keeps its own words few and quiet around it.
 * The loader isn't drawn here: `slot` keeps its room, and the stage lays the one live loader over it, so it glides in
 * and out as the screen comes and goes without ever restarting; `data-loader-paper` names the surface under it, which
 * a loader that cuts its shapes out of the paper paints with. A picture: hidden from assistive tech (the stage says in
 * words what it shows), still but for the loader. Loaded as a chunk of its own, the first time it's asked for. */

export interface LoaderContextProps {
  copy: ContextCopy
  /** Where the loader goes: an empty box of its size. */
  slot: ReactNode
  /** The screen's own status under the loader, when the loader's label isn't shown. */
  caption: boolean
}

export default function LoaderContext({ copy, slot, caption }: LoaderContextProps) {
  const Screen = SCREENS[copy.kind]
  return (
    <div aria-hidden className="@container mx-auto flex size-full max-w-[56rem]">
      <Screen copy={copy} slot={slot} caption={caption} />
    </div>
  )
}

type ScreenProps = LoaderContextProps

const SCREENS: Record<ContextCopy['kind'], (props: ScreenProps) => ReactNode> = {
  build: BuildScreen,
  upload: UploadScreen,
  assistant: AssistantScreen,
  dashboard: DashboardScreen,
  splash: SplashScreen,
}

const icon = { size: 14, strokeWidth: 1.75 } as const

/** An app's window: its bar (the title and a word at its end) over its body; `bar={false}` for a frameless one (a launch screen). */
function Window({ title, glyph, end, bar = true, className, children }: { title?: ReactNode; glyph?: ReactNode; end?: ReactNode; bar?: boolean; className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'relative flex size-full flex-col overflow-hidden rounded-xl border border-line bg-canvas text-fg shadow-[0_1px_2px_color-mix(in_oklab,var(--color-shadow)_6%,transparent),0_32px_64px_-32px_color-mix(in_oklab,var(--color-shadow)_32%,transparent)]',
        className,
      )}
    >
      {bar && (
        <div className="flex h-10 shrink-0 items-center gap-3 border-b border-line bg-surface px-3.5">
          <span className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-2.5 rounded-full bg-line-strong" />
            ))}
          </span>
          {title && (
            <span className="flex min-w-0 items-center gap-2 text-[13px] font-medium">
              {glyph && <span className="shrink-0 text-fg-muted">{glyph}</span>}
              <span className="truncate">{title}</span>
            </span>
          )}
          {end && <span className="ms-auto flex shrink-0 items-center">{end}</span>}
        </div>
      )}
      {children}
    </div>
  )
}

/** The loader's room, and the screen's status under it when the loader's own label isn't shown. */
function Held({ slot, status, caption, className }: { slot: ReactNode; status: string; caption: boolean; className?: string }) {
  return (
    <div className={cn('relative flex flex-col items-center gap-3', className)}>
      <div className="relative">{slot}</div>
      {caption && <p className="text-[14px] font-medium text-fg-muted">{status}…</p>}
    </div>
  )
}

/** A deploy's status page: the loader over its steps (done, under way, to come), the commit and how far along it is. */
function BuildScreen({ copy, slot, caption }: ScreenProps) {
  const steps = copy.steps ?? []
  const at = Math.min(steps.length - 1, Math.floor(((copy.progress ?? 0) / 100) * steps.length))
  return (
    <Window title={copy.title} glyph={<GitBranchIcon {...icon} />} end={copy.badge && <Badge variant="outline">{copy.badge}</Badge>}>
      <div data-loader-paper="var(--color-canvas)" className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-6 pb-14">
        <Held slot={slot} status={copy.status} caption={caption} />
        {steps.length > 0 && (
          <ol className="flex items-center gap-2 max-sm:hidden">
            {steps.map((step, i) => (
              <li key={step} className="flex items-center gap-2">
                {i > 0 && <span className={cn('h-px w-10 @lg:w-16', i <= at ? 'bg-line-strong' : 'bg-line')} />}
                <span
                  className={cn(
                    'grid size-5 place-items-center rounded-full border',
                    i < at && 'border-transparent bg-fg text-canvas',
                    i === at && 'border-accent bg-accent-subtle',
                    i > at && 'border-line',
                  )}
                >
                  {i < at && <CheckIcon size={11} strokeWidth={2.5} />}
                  {i === at && <span className="size-1.5 rounded-full bg-accent" />}
                </span>
                <span className={cn('text-[12.5px]', i <= at ? 'font-medium text-fg' : 'text-fg-muted')}>{step}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
      <p className="absolute inset-x-5 bottom-4 flex items-center justify-between gap-4 font-mono text-[11.5px] text-fg-muted">
        <span className="truncate">{copy.detail}</span>
        {copy.progress !== undefined && <span className="shrink-0 tabular-nums">{copy.progress}%</span>}
      </p>
      {copy.progress !== undefined && (
        <span className="absolute inset-x-0 bottom-0 h-[3px] bg-hover">
          <span className="block h-full bg-accent" style={{ width: `${copy.progress}%` }} />
        </span>
      )}
    </Window>
  )
}

/** An upload's card: the loader in the drop zone while the file is processed, the file and its progress under it. */
function UploadScreen({ copy, slot, caption }: ScreenProps) {
  return (
    <div className="flex size-full items-center justify-center">
      <div className="relative flex w-full max-w-[34rem] flex-col overflow-hidden rounded-xl border border-line bg-surface text-fg shadow-[0_1px_2px_color-mix(in_oklab,var(--color-shadow)_6%,transparent),0_32px_64px_-32px_color-mix(in_oklab,var(--color-shadow)_32%,transparent)]">
        <div className="flex h-11 shrink-0 items-center gap-2.5 border-b border-line px-4">
          <CloudUploadIcon {...icon} className="text-fg-muted" />
          <span className="text-[13px] font-medium">{copy.title}</span>
          <XIcon size={15} strokeWidth={1.75} className="ms-auto text-fg-muted" />
        </div>
        <div className="flex flex-col gap-3 p-3 max-sm:pb-4">
          <div data-loader-paper="var(--color-surface)" className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line px-4 py-5 max-sm:py-3">
            <Held slot={slot} status={copy.status} caption={caption} />
          </div>
          {/* On a phone's small stage the file's row gives way, its progress kept on the card's edge. */}
          {copy.file && (
            <div className="flex items-center gap-3 rounded-lg border border-line bg-canvas px-3 py-2.5 max-sm:hidden">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-band text-fg-muted">
                <FileIcon {...icon} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="flex items-center justify-between gap-3 text-[12.5px]">
                  <span className="truncate font-medium">{copy.file}</span>
                  {copy.progress !== undefined && <span className="shrink-0 font-mono text-[11.5px] text-fg-muted tabular-nums">{copy.progress}%</span>}
                </span>
                {copy.progress !== undefined && (
                  <span className="h-1 overflow-hidden rounded-full bg-band">
                    <span className="block h-full rounded-full bg-accent" style={{ width: `${copy.progress}%` }} />
                  </span>
                )}
                <span className="truncate text-[11.5px] text-fg-muted max-sm:hidden">{copy.detail}</span>
              </span>
            </div>
          )}
        </div>
        {copy.progress !== undefined && (
          <span className="absolute inset-x-0 bottom-0 h-[3px] bg-hover sm:hidden">
            <span className="block h-full bg-accent" style={{ width: `${copy.progress}%` }} />
          </span>
        )}
      </div>
    </div>
  )
}

/** An assistant at work: what it was asked over it, the loader as its thinking, what it's reading, and its two controls. */
function AssistantScreen({ copy, slot, caption }: ScreenProps) {
  return (
    <Window title={copy.title} glyph={<SparklesIcon {...icon} />} end={copy.badge && <Badge variant="outline">{copy.badge}</Badge>}>
      <div
        data-loader-paper="color-mix(in oklab, var(--color-accent) 9%, var(--color-canvas))"
        className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-6 bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-accent)_9%,transparent),transparent)]"
      >
        {copy.prompt && (
          <p className="max-w-[26rem] rounded-2xl rounded-ee-md bg-band px-3.5 py-2 text-center text-[13px] text-fg max-sm:hidden">{copy.prompt}</p>
        )}
        <Held slot={slot} status={copy.status} caption={caption} />
        <p className="truncate font-mono text-[11.5px] text-fg-muted max-sm:hidden">{copy.detail}</p>
      </div>
      <div className="flex shrink-0 items-center justify-center gap-3 pb-4 max-sm:hidden">
        <span className="grid size-10 place-items-center rounded-full border border-line bg-surface text-fg-muted">
          <MicIcon size={16} strokeWidth={1.75} />
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-fg text-canvas">
          <SquareIcon size={13} strokeWidth={2} className="fill-current" />
        </span>
      </div>
    </Window>
  )
}

/** A dashboard while its numbers come: the figures, each a bar held for its number, and the loader in the chart. */
function DashboardScreen({ copy, slot, caption }: ScreenProps) {
  return (
    <Window title={copy.title} glyph={<LineChartIcon {...icon} />} end={copy.badge && <Badge variant="outline">{copy.badge}</Badge>}>
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 @md:p-4">
        {copy.figures && (
          <div className="grid shrink-0 grid-cols-3 gap-3 max-sm:hidden">
            {copy.figures.map((figure, i) => (
              <div key={figure} className="flex flex-col gap-2.5 rounded-lg border border-line bg-surface px-3.5 py-3">
                <span className="truncate text-[12px] text-fg-muted">{figure}</span>
                <span className="h-4 rounded bg-band" style={{ width: `${[58, 72, 44][i % 3]}%` }} />
              </div>
            ))}
          </div>
        )}
        <div data-loader-paper="var(--color-surface)" className="relative flex min-h-0 flex-1 flex-col items-center justify-center rounded-lg border border-line bg-surface">
          <span className="absolute start-3.5 top-3 text-[12px] font-medium text-fg-muted max-sm:hidden">{copy.detail}</span>
          {/* The chart the numbers will fill: its rules alone, faint, while they come. */}
          <div className="pointer-events-none absolute inset-x-4 top-11 bottom-5 flex flex-col justify-between opacity-80">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="h-px bg-line" />
            ))}
          </div>
          <Held slot={slot} status={copy.status} caption={caption} />
        </div>
      </div>
    </Window>
  )
}

/** An app's launch screen: the loader in the middle of an empty window, the app's name and what it's doing under it. */
function SplashScreen({ copy, slot, caption }: ScreenProps) {
  return (
    <Window bar={false}>
      <div
        data-loader-paper="color-mix(in oklab, var(--color-accent) 8%, var(--color-canvas))"
        className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 pb-8 bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-accent)_8%,transparent),transparent)]"
      >
        <div className="relative">{slot}</div>
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-[15px] font-semibold tracking-tight">{copy.title}</span>
          {caption && <span className="text-[13px] text-fg-muted">{copy.status}…</span>}
        </div>
      </div>
      <p className="absolute inset-x-6 bottom-4 truncate text-center font-mono text-[11px] tracking-wide text-fg-muted">{copy.detail}</p>
    </Window>
  )
}
