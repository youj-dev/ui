'use client'

import { CheckIcon, CloudOffIcon, PaletteIcon, PlayIcon, RedoIcon, RocketIcon, UndoIcon } from '@youj/icons'
import { MorphLabel } from '@youj/motion'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Kbd, KbdGroup } from '../../../components/ui/kbd'
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from '../../../components/ui/popover'
import { Spinner } from '../../../components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip'
import type { SurveyBuilderCopy } from './data'
import { DesignPanel } from './design'
import type { Builder } from './use-builder'

/* The builder's bar: where you are (Surveys / the survey's title, edited in
 * place), its state (draft, live or scheduled, and whether it has changes the
 * live one doesn't), the autosave (saving, saved, or a failure with Retry),
 * then undo and redo, Design, Preview and Publish. On a phone the words fold
 * into their marks. */

interface TopBarProps {
  builder: Builder
  copy: SurveyBuilderCopy
  status: 'draft' | 'live' | 'scheduled'
  /** Live, with edits the live one doesn't have. */
  changed: boolean
  /** ⌘ on Apple keyboards, Ctrl elsewhere. */
  mod: string
  onTest: () => void
  onPublish: () => void
}

const muted = 'aria-disabled:cursor-default aria-disabled:opacity-50 aria-disabled:hover:bg-transparent'

function ShortcutTip({ label, keys, children }: { label: string; keys: string[]; children: React.ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent className="flex items-center gap-2">
        {label}
        <KbdGroup dir="ltr">
          {keys.map((key) => (
            <Kbd key={key}>{key}</Kbd>
          ))}
        </KbdGroup>
      </TooltipContent>
    </Tooltip>
  )
}

export function TopBar({ builder, copy, status, changed, mod, onTest, onPublish }: TopBarProps) {
  const { survey, save } = builder
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-3 @3xl/builder:gap-3 @3xl/builder:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className="hidden shrink-0 text-ui text-fg-muted @3xl/builder:inline">{copy.surveys}</span>
        <span aria-hidden className="hidden text-fg-subtle @3xl/builder:inline">
          /
        </span>
        <input
          aria-label={copy.titleLabel}
          value={survey.title}
          onChange={(e) => builder.commit({ ...survey, title: e.target.value }, 'survey:title')}
          className="field-sizing-content min-w-0 max-w-full truncate rounded-md bg-transparent px-1.5 py-1 text-ui-lg font-semibold text-fg outline-none hover:bg-hover focus-visible:bg-transparent focus-field"
        />
        <Badge variant={status === 'draft' ? 'outline' : 'success'} className="hidden shrink-0 @4xl/builder:inline-flex">
          {status === 'live' ? copy.live : status === 'scheduled' ? copy.scheduled : copy.draft}
        </Badge>
        {changed && <span className="hidden shrink-0 text-ui-sm text-warning-text @5xl/builder:inline">{copy.changes}</span>}
        <span className="ms-1 hidden shrink-0 items-center gap-1.5 text-ui-sm text-fg-muted @4xl/builder:flex">
          <MorphLabel value={save} contentClassName="gap-1.5">
            {save === 'saving' ? (
              <>
                <Spinner className="size-3" />
                {copy.saving}
              </>
            ) : save === 'failed' ? (
              <>
                <CloudOffIcon size={13} aria-hidden className="text-danger-text" />
                {copy.saveFailed}
              </>
            ) : (
              <>
                <CheckIcon size={13} aria-hidden />
                {copy.saved}
              </>
            )}
          </MorphLabel>
          {save === 'failed' && (
            <Button variant="link" size="sm" className="h-auto px-0" onClick={builder.retry}>
              {copy.retry}
            </Button>
          )}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <ShortcutTip label={copy.undo} keys={[mod, 'Z']}>
          {/* Unavailable but still focusable, so focus stays put when the last step is undone. */}
          <Button variant="ghost" size="icon-sm" aria-label={copy.undo} aria-disabled={!builder.canUndo} onClick={builder.undo} className={muted}>
            <UndoIcon size={15} className="rtl:-scale-x-100" />
          </Button>
        </ShortcutTip>
        <ShortcutTip label={copy.redo} keys={[mod, '⇧', 'Z']}>
          <Button variant="ghost" size="icon-sm" aria-label={copy.redo} aria-disabled={!builder.canRedo} onClick={builder.redo} className={muted}>
            <RedoIcon size={15} className="rtl:-scale-x-100" />
          </Button>
        </ShortcutTip>
        <span aria-hidden className="mx-1 hidden h-5 w-px bg-line @3xl/builder:block" />
        <Popover>
          <PopoverTrigger
            render={<Button variant="ghost" size="sm" aria-label={copy.design} className="@max-3xl/builder:size-control-sm @max-3xl/builder:px-0" />}
          >
            <PaletteIcon size={15} />
            <span className="hidden @3xl/builder:inline">{copy.design}</span>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <PopoverHeader>
              <PopoverTitle>{copy.designTitle}</PopoverTitle>
            </PopoverHeader>
            <DesignPanel design={survey.design} onChange={(design) => builder.commit({ ...survey, design })} copy={copy} />
          </PopoverContent>
        </Popover>
        <Button
          variant="outline"
          size="sm"
          aria-label={copy.preview}
          onClick={onTest}
          className="@max-3xl/builder:size-control-sm @max-3xl/builder:px-0"
        >
          <PlayIcon size={14} />
          <span className="hidden @3xl/builder:inline">{copy.preview}</span>
        </Button>
        <Button size="sm" variant={status !== 'draft' && !changed ? 'outline' : 'default'} onClick={onPublish} className="ms-1">
          <RocketIcon size={14} />
          {status === 'draft' ? copy.publish : changed ? copy.publishChanges : copy.share}
        </Button>
      </div>
    </header>
  )
}
