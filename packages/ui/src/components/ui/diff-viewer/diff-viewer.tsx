'use client'

import { useId, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react'
import { AsyncAnnouncer } from '@youj/motion'
import { ChevronDownIcon } from '@youj/icons/components/youj/icons/chevron-down'
import { ChevronUpIcon } from '@youj/icons/components/youj/icons/chevron-up'
import { CopyIcon } from '@youj/icons/components/youj/icons/copy'
import { FileCodeIcon } from '@youj/icons/components/youj/icons/file-code'
import { WrapTextIcon } from '@youj/icons/components/youj/icons/wrap-text'
import { useYouj } from '@youj/core/lib/youj/provider'
import { diffViewerLabels, useComponentLabels } from '@youj/core/labels'
import { useControllableState } from '../../../hooks/use-controllable-state'
import { cn } from '../../../lib/utils'
import { Button } from '../button'
import { useCopyText } from '../code-block/code-block'
import { SegmentedControl, SegmentedControlItem } from '../segmented-control'
import { Toggle } from '../toggle'
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip'
import { diffText, parsePatch, type DiffLine } from './diff-viewer-diff'
import { buildItems, FoldRow, highlightRows, LineCode, type DiffItem, type DiffView } from './diff-viewer-rows'

/* The difference between two versions of a file, as code review reads it.
 * Give it `before` and `after` (a Myers line diff, computed here) or a
 * unified `patch`. A sticky header names the file and counts what was added
 * and removed, steps through the changes ("Change 3 of 7", also J/K or
 * Alt+↓/↑ anywhere in the diff), switches between the unified and the split
 * view, wraps long lines and copies the new version. Added and removed lines
 * take the success and danger tints, the words that changed inside a pair
 * of lines a stronger one, and the code keeps CodeBlock's highlighting.
 * Unchanged runs longer than `context` lines around a change fold into a
 * "12 unchanged lines" row that opens in place. It is a table: each changed
 * line reads "Added line 12: …" to a screen reader, and the code stays
 * left-to-right on a right-to-left page, as code does. Stepping glides the
 * change into view; under reduced motion it jumps. */

interface DiffViewerProps extends Omit<ComponentProps<'figure'>, 'children'> {
  /** The old version of the file. With `after`; leave both out to pass a `patch`. */
  before?: string
  /** The new version of the file. */
  after?: string
  /** A unified diff (`git diff` output) to show instead of `before`/`after`. Only its first file is shown, and the lines between hunks can't be opened. */
  patch?: string
  /** Language for highlighting, as CodeBlock takes it: `ts`, `tsx`, `json`, `css`, `py`, `go`, `yaml`… Anything else is plain text. */
  language?: string
  /** The file's path for the header. A patch names its own when this is left out. */
  filename?: string
  /** `unified` (one column, removals over additions) or `split` (before and after side by side), controlled. */
  view?: DiffView
  /** The view at first, uncontrolled. Default 'unified'. */
  defaultView?: DiffView
  onViewChange?: (view: DiffView) => void
  /** Wrap long lines instead of scrolling sideways, controlled. The split view always wraps. */
  wrap?: boolean
  /** Wrap at first, uncontrolled. Default false. */
  defaultWrap?: boolean
  onWrapChange?: (wrap: boolean) => void
  /** Unchanged lines kept on each side of a change; longer runs fold. `Infinity` shows every line. Default 3. */
  context?: number
  /** With sound on (`YoujProvider`’s `sound`), the view switch, wrap toggle and copy sound as the rest of the kit does. `false` keeps it silent. Default true. */
  sound?: boolean
}

const EMPTY: ReadonlySet<number> = new Set()

function DiffViewer({
  before,
  after,
  patch,
  language = '',
  filename,
  view: viewProp,
  defaultView = 'unified',
  onViewChange,
  wrap: wrapProp,
  defaultWrap = false,
  onWrapChange,
  context = 3,
  sound = true,
  className,
  onKeyDown,
  ...props
}: DiffViewerProps) {
  const k = useYouj()
  const labels = useComponentLabels(diffViewerLabels)
  const hintId = useId()
  const nameId = useId()
  const [view, setView] = useControllableState(viewProp, defaultView)
  const [wrap, setWrap] = useControllableState(wrapProp, defaultWrap)
  const diff = useMemo(() => (patch !== undefined ? parsePatch(patch) : diffText(before ?? '', after ?? '')), [patch, before, after])
  const tokens = useMemo(() => highlightRows(diff.rows, language), [diff, language])
  // Opened folds and the current change belong to one diff; new input starts fresh.
  const [opened, setOpened] = useState<{ for: unknown; starts: Set<number> }>()
  const open = opened?.for === diff ? opened.starts : EMPTY
  const [current, setCurrentState] = useState<{ for: unknown; index: number }>()
  const index = current?.for === diff ? current.index : -1
  const { items, changes } = useMemo(() => buildItems(diff.rows, view, context, open), [diff, view, context, open])
  const changeRows = useRef<(HTMLTableRowElement | null)[]>([])
  const region = useRef<HTMLDivElement>(null)
  const name = filename ?? diff.filename

  const go = (to: number) => {
    if (changes === 0) return
    const next = Math.min(changes - 1, Math.max(0, to))
    setCurrentState({ for: diff, index: next })
    changeRows.current[next]?.scrollIntoView({ block: 'center', behavior: k.reduced ? 'auto' : 'smooth' })
  }
  const step = (by: 1 | -1) => go(index === -1 ? (by === 1 ? 0 : changes - 1) : index + by)

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event)
    const target = event.target as HTMLElement
    if (event.defaultPrevented || target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
    const plain = !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey
    const by = plain && event.key === 'j' ? 1 : plain && event.key === 'k' ? -1 : event.altKey && event.key === 'ArrowDown' ? 1 : event.altKey && event.key === 'ArrowUp' ? -1 : 0
    if (!by) return
    event.preventDefault()
    step(by)
  }

  const openFold = (start: number) => {
    setOpened({ for: diff, starts: new Set(open).add(start) })
    // The fold's button goes away with it: keep focus in the diff.
    region.current?.focus({ preventScroll: true })
  }

  const split = view === 'split'
  const lastNumber = diff.rows.reduce((max, r) => (r.type === 'gap' ? max : Math.max(max, r.oldNumber ?? 0, r.newNumber ?? 0)), 0)
  const longest = diff.rows.reduce((max, r) => (r.type === 'gap' ? max : Math.max(max, r.text.replace(/\t/g, '    ').length)), 0)
  const numberWidth = `calc(${String(lastNumber).length}ch + 1.25rem)`
  const columns = split ? 6 : 4
  // The split view always wraps, so both sides stay in view. Unwrapped, the code column is as wide as the longest line and the table scrolls sideways.
  const wraps = wrap || split
  const tableWidth = wraps ? '100%' : `max(100%, calc(2 * ${numberWidth} + 1.5rem + ${longest}ch + 1.5rem))`

  const lineCells = (line: DiffLine | undefined, side: 'old' | 'new' | 'both', change: boolean) => {
    if (!line) return <td colSpan={split ? 3 : 4} aria-hidden className="own:bg-band" />
    const tone = line.type === 'add' ? 'add' : line.type === 'del' ? 'del' : undefined
    const number = side === 'old' ? line.oldNumber : side === 'new' ? line.newNumber : undefined
    const tint = tone === 'add' ? 'own:bg-success-subtle' : tone === 'del' ? 'own:bg-danger-subtle' : undefined
    const gutter = cn(
      'own:px-2.5 own:text-end own:align-top own:text-fg-subtle own:tabular-nums select-none',
      tint,
      tone === 'add' && 'own:text-success-text',
      tone === 'del' && 'own:text-danger-text',
    )
    return (
      <>
        {side === 'both' ? (
          <>
            <td aria-hidden className={cn(gutter, change && 'own:shadow-[inset_2px_0_0_var(--color-accent)]')}>
              {line.oldNumber}
            </td>
            <td aria-hidden className={gutter}>
              {line.newNumber}
            </td>
          </>
        ) : (
          <td aria-hidden className={cn(gutter, change && side === 'old' && 'own:shadow-[inset_2px_0_0_var(--color-accent)]')}>
            {number}
          </td>
        )}
        <td aria-hidden className={cn('own:w-6 own:text-center own:align-top select-none', tint, tone === 'add' ? 'own:text-success-text' : 'own:text-danger-text')}>
          {tone === 'add' ? '+' : tone === 'del' ? '−' : ''}
        </td>
        <td data-yj-line={line.type} className={cn('h-5 own:pe-4 own:align-top', wraps ? 'whitespace-pre-wrap [overflow-wrap:anywhere]' : 'whitespace-pre', tint)}>
          {tone && <span className="sr-only">{`${tone === 'add' ? labels.diffAddedLine(line.newNumber!) : labels.diffRemovedLine(line.oldNumber!)}: `}</span>}
          <LineCode tokens={tokens.get(line) ?? [{ text: line.text }]} marks={line.marks} tone={tone ?? 'add'} tinted={!!tone} />
          {line.noNewline && tone && (
            <span className="own:ms-2 own:rounded-sm border own:border-line own:px-1 own:font-sans own:text-ui-xs own:text-fg-subtle">{labels.diffNoNewline}</span>
          )}
        </td>
      </>
    )
  }

  const renderItem = (item: DiffItem, i: number) => {
    if (item.kind === 'fold') return <FoldRow key={`f${item.start}`} label={labels.diffUnchanged(item.count)} colSpan={columns} onOpen={() => openFold(item.start)} />
    if (item.kind === 'gap')
      return (
        <tr key={`g${i}`} data-slot="diff-viewer-hunk">
          <td colSpan={columns} className="h-7 own:bg-band own:px-3 own:text-fg-muted">
            {item.header}
          </td>
        </tr>
      )
    const change = item.change
    const ref = change === undefined ? undefined : (el: HTMLTableRowElement | null) => void (changeRows.current[change] = el)
    const isCurrent = change !== undefined && change === index
    return (
      <tr key={i} ref={ref} data-yj-current={isCurrent || undefined} className="scroll-mt-20">
        {item.kind === 'line' ? lineCells(item.line, 'both', isCurrent) : (
          <>
            {lineCells(item.before, 'old', isCurrent)}
            {lineCells(item.after, 'new', false)}
          </>
        )}
      </tr>
    )
  }

  const { state: copyState, copy } = useCopyText(undefined, sound)
  const copyText = patch ?? after ?? ''
  const blocks = barBlocks(diff.additions, diff.deletions)

  return (
    <figure
      data-slot="diff-viewer"
      data-yj-view={view}
      data-yj-wrap={wraps || undefined}
      aria-labelledby={nameId}
      className={cn('min-w-0 own:overflow-clip own:rounded-lg border own:border-line own:bg-surface own:text-fg', className)}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <div
        data-slot="diff-viewer-header"
        className="sticky top-0 z-[1] own:flex min-h-11 flex-wrap items-center own:gap-x-3 own:gap-y-1 border-b own:border-line own:bg-surface own:py-1.5 own:ps-3 own:pe-1.5"
      >
        <span className="own:flex min-w-0 flex-1 items-center gap-2">
          <FileCodeIcon size={15} strokeWidth={1.75} className="shrink-0 own:text-fg-muted" />
          <span id={nameId} data-slot="diff-viewer-filename" className="truncate own:font-mono own:text-ui-sm">
            {name ?? labels.diffViewer}
          </span>
          <span data-slot="diff-viewer-stats" className="own:flex shrink-0 items-center gap-1.5 own:font-mono own:text-ui-xs own:tabular-nums">
            <span aria-hidden className="own:text-success-text">{`+${diff.additions}`}</span>
            <span aria-hidden className="own:text-danger-text">{`−${diff.deletions}`}</span>
            <span aria-hidden className="own:flex gap-px">
              {blocks.map((tone, b) => (
                <span
                  key={b}
                  className={cn('size-2 own:rounded-[1px]', tone === 'add' ? 'own:bg-success' : tone === 'del' ? 'own:bg-danger' : 'own:bg-line')}
                />
              ))}
            </span>
            <span className="sr-only">{labels.diffSummary(diff.additions, diff.deletions)}</span>
          </span>
        </span>
        <span className="own:flex items-center gap-1">
          <span aria-live="polite" className="own:px-1 own:text-ui-xs own:text-fg-muted own:tabular-nums whitespace-nowrap" data-slot="diff-viewer-position">
            {changes === 0 ? labels.diffNoChanges : index === -1 ? labels.diffChanges(changes) : labels.diffChange(index + 1, changes)}
          </span>
          <HeaderButton label={labels.diffPreviousChange} keys="K" disabled={changes === 0 || index === 0} onClick={() => step(-1)} sound={sound}>
            <ChevronUpIcon size={15} strokeWidth={1.75} />
          </HeaderButton>
          <HeaderButton label={labels.diffNextChange} keys="J" disabled={changes === 0 || index === changes - 1} onClick={() => step(1)} sound={sound}>
            <ChevronDownIcon size={15} strokeWidth={1.75} />
          </HeaderButton>
        </span>
        <span className="own:flex items-center gap-1">
          <SegmentedControl
            variant="pill"
            size="sm"
            aria-label={labels.diffView}
            value={view}
            onValueChange={(next) => {
              setView(next as DiffView)
              onViewChange?.(next as DiffView)
            }}
            sound={sound}
          >
            <SegmentedControlItem value="unified" className="own:px-2.5 own:text-ui-sm">
              {labels.diffUnified}
            </SegmentedControlItem>
            <SegmentedControlItem value="split" className="own:px-2.5 own:text-ui-sm">
              {labels.diffSplit}
            </SegmentedControlItem>
          </SegmentedControl>
          <Tooltip>
            <TooltipTrigger
              render={
                <Toggle
                  size="sm"
                  pressed={wraps}
                  disabled={split}
                  onPressedChange={(next) => {
                    setWrap(next)
                    onWrapChange?.(next)
                  }}
                  sound={sound}
                />
              }
              aria-label={labels.diffWrap}
              data-slot="diff-viewer-wrap"
            >
              <WrapTextIcon size={15} strokeWidth={1.75} />
            </TooltipTrigger>
            <TooltipContent>{labels.diffWrap}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={<Button variant="ghost" size="icon-sm" sound={sound} />}
              closeOnClick={false}
              aria-label={labels.copyCode}
              data-slot="diff-viewer-copy"
              onClick={() => copy(copyText)}
            >
              <CopyIcon active={copyState === 'copied'} size={15} strokeWidth={1.75} />
            </TooltipTrigger>
            <TooltipContent>{copyState === 'copied' ? labels.copied : copyState === 'error' ? labels.copyFailed : labels.copyCode}</TooltipContent>
          </Tooltip>
          <AsyncAnnouncer state={copyState === 'copied' ? 'success' : copyState === 'error' ? 'error' : 'idle'} successLabel={labels.copied} errorLabel={labels.copyFailed} />
        </span>
      </div>
      <div
        ref={region}
        role="region"
        tabIndex={0}
        aria-labelledby={nameId}
        aria-describedby={hintId}
        aria-keyshortcuts="J K Alt+ArrowDown Alt+ArrowUp"
        data-slot="diff-viewer-body"
        dir="ltr"
        className="overflow-x-auto yj-scrollbar focus-ring own:rounded-b-lg"
      >
        <span id={hintId} hidden>
          {labels.diffHint}
        </span>
        <table className="table-fixed border-collapse own:font-mono own:text-[length:var(--text-ui)] own:leading-5" style={{ width: tableWidth }}>
          <caption className="sr-only">{`${name ?? labels.diffViewer}: ${labels.diffSummary(diff.additions, diff.deletions)}`}</caption>
          <colgroup>
            {split ? (
              <>
                <col style={{ width: numberWidth }} />
                <col className="w-6" />
                <col />
                <col style={{ width: numberWidth }} />
                <col className="w-6" />
                <col />
              </>
            ) : (
              <>
                <col style={{ width: numberWidth }} />
                <col style={{ width: numberWidth }} />
                <col className="w-6" />
                <col />
              </>
            )}
          </colgroup>
          {split && (
            <thead className="sr-only">
              <tr>
                <th colSpan={3}>{labels.diffBefore}</th>
                <th colSpan={3}>{labels.diffAfter}</th>
              </tr>
            </thead>
          )}
          <tbody>{items.map(renderItem)}</tbody>
        </table>
      </div>
    </figure>
  )
}

/** Five squares in the header, shared out between additions and deletions as git's stat bar does. */
function barBlocks(additions: number, deletions: number): ('add' | 'del' | 'none')[] {
  const total = additions + deletions
  if (total === 0) return Array(5).fill('none')
  const filled = Math.min(5, total)
  const adds = Math.round((additions / total) * filled)
  return [...Array(adds).fill('add'), ...Array(filled - adds).fill('del'), ...Array(5 - filled).fill('none')]
}

function HeaderButton({ label, keys, disabled, onClick, sound, children }: { label: string; keys: string; disabled: boolean; onClick: () => void; sound: boolean; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon-sm" sound={sound} disabled={disabled} />} aria-label={label} aria-keyshortcuts={keys} onClick={onClick}>
        {children}
      </TooltipTrigger>
      <TooltipContent>{`${label} (${keys})`}</TooltipContent>
    </Tooltip>
  )
}

export { DiffViewer, type DiffViewerProps }
