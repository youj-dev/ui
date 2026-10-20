'use client'

import { useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { toast, Toaster } from '../../components/ui/toast'
import { cn, numberFormat } from '../../lib/utils'
import {
  DEFAULT_COPY,
  SEGMENTS,
  type QuestionKindKey,
  type SurveyBuilderCopy,
  type SurveyChannel,
  type SurveyDeployment,
  type SurveyPublished,
  type SurveySegment,
} from './builder/data'
import { Editor } from './builder/editor'
import { Outline } from './builder/outline'
import { Preview } from './builder/preview'
import { PublishDialog, type PublishStep } from './builder/publish'
import { TestRun } from './builder/test-run'
import { TopBar } from './builder/top-bar'
import { useBuilder } from './builder/use-builder'
import { demo, SURVEY, type Survey, type SurveyAnswers, type SurveyQuestion } from './question/data'

/* The admin's side of a survey: build it, then put it in front of people.
 * The outline on the start side holds every question in order, dragged or
 * moved from the keyboard, with Add question's palette of fourteen kinds; the
 * middle edits the selected one in place (its kind, its words, its answers,
 * whether it's required, and show-if logic on earlier answers); the end side
 * previews it live, on a phone or a desktop, in the survey's design. Every
 * change is one step of undo (⌘Z, ⇧⌘Z) and saves itself a beat later; a
 * deleted question offers Undo. Design sets the accent, corners, the titles'
 * type and the layout its link opens in; Preview runs the whole survey in that
 * layout; Publish chooses the channel (a link, an embed, in-app with its
 * audience), when it opens and closes, and ends on the live link with a share
 * card. The screen holds still: each pane scrolls on its own. On a phone the
 * outline and the editor take turns. Reduced motion: everything moves in place.
 *
 * Keep the survey with `value`/`onValueChange` or `onSave`, publish it through
 * `onPublish`, and render it with any of the respondent blocks of this family. */

interface SurveyBuilderProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'defaultValue'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Hosted inside another page: a panel of fixed height instead of the whole screen. Default false. */
  embedded?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<SurveyBuilderCopy>
  /** Formats the reach and dates (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The survey being built, controlled: pair it with `onValueChange`. */
  value?: Survey
  /** The survey to start from, when the block owns it. Default: Tern's product survey. */
  defaultValue?: Survey
  /** Called with the survey on every change. */
  onValueChange?: (survey: Survey) => void
  /** The question being edited (its id, or `'ending'`), controlled: pair it with `onSelectedChange`, to give each question a route. */
  selected?: string
  /** The question selected at first, when the block owns it. Default: the first. */
  defaultSelected?: string
  /** Called when another question is selected. */
  onSelectedChange?: (id: string) => void
  /** Saves the survey, a beat after the last change; reject to show "Couldn’t save" with Retry. Default: a short demo wait. */
  onSave?: (survey: Survey) => Promise<unknown> | unknown
  /** Publishes it; resolve with its `url` to show that link. Reject to stay on the step and say why. Default: a demo wait and a demo link. */
  onPublish?: (deployment: SurveyDeployment) => Promise<SurveyPublished | void> | SurveyPublished | void
  /** The groups an in-app survey can be shown to. Default: the demo product's four. */
  segments?: SurveySegment[]
  /** Starts already published at this link (to edit a live survey). Default: a draft. */
  publishedUrl?: string
  /** A real QR code for the share card, from your QR library. Default: QR-like art. */
  qrCode?: (url: string) => ReactNode
}

const subscribeNothing = () => () => {}
const isApple = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
const slugify = (title: string) =>
  title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'survey'

function SurveyBuilder({
  theme,
  embedded = false,
  copy: copyProp,
  locale,
  value,
  defaultValue = SURVEY,
  onValueChange,
  selected,
  defaultSelected,
  onSelectedChange,
  onSave,
  onPublish,
  segments = SEGMENTS,
  publishedUrl,
  qrCode,
  className,
  ...rest
}: SurveyBuilderProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const lang = useLocale(locale)
  const number = useMemo(() => numberFormat(lang), [lang])
  const builder = useBuilder({ value, defaultValue, onValueChange, selected, defaultSelected, onSelectedChange, onSave, copy })
  const { survey } = builder
  const apple = useSyncExternalStore(subscribeNothing, isApple, () => true)
  // On a phone the outline and the editor take turns.
  const [pane, setPane] = useState<'outline' | 'editor'>('outline')
  const [testing, setTesting] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [step, setStep] = useState<PublishStep>(publishedUrl ? 'live' : 'where')
  const [url, setUrl] = useState<string | null>(publishedUrl ?? null)
  // The survey as it was published, to tell whether there's anything new to publish.
  const [live, setLive] = useState<Survey | null>(publishedUrl ? (value ?? defaultValue) : null)
  const [deployment, setDeployment] = useState<SurveyDeployment>(() => ({
    survey,
    channel: 'link' as SurveyChannel,
    slug: slugify(survey.title),
    audience: 'anyone',
    segment: segments[0]?.id ?? '',
    sample: 20,
    trigger: 'idle',
    once: true,
    start: null,
    close: { kind: 'never' },
  }))
  const status = live ? (deployment.start ? 'scheduled' : 'live') : 'draft'
  const changed = !!live && live !== survey

  const openPublish = () => {
    setDeployment((d) => ({ ...d, survey }))
    setStep(live && !changed ? 'live' : 'where')
    setPublishing(true)
  }

  const publish = async () => {
    const sent = { ...deployment, survey: { ...survey, design: deployment.survey.design ?? survey.design } }
    const result = await (onPublish ? onPublish(sent) : demo('SurveyBuilder: onPublish', 900).then(() => undefined))
    setUrl((result && typeof result === 'object' && result.url) || `https://${copy.linkBase}${deployment.slug}`)
    setLive(survey)
    setStep('live')
  }

  // Undo points at the latest history when a toast's Undo is pressed later.
  const undo = useRef(builder.undo)
  useLayoutEffect(() => {
    undo.current = builder.undo
  })
  const remove = (question: SurveyQuestion) => {
    const gone = builder.remove(question.id)
    if (gone) toast(copy.deleted(gone.title || copy.untitled), { action: { label: copy.undo, onClick: () => undo.current() } })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!(event.metaKey || event.ctrlKey) || event.altKey || event.defaultPrevented) return
    // In a text field, ⌘Z is the field's own.
    if ((event.target as HTMLElement).matches('input, textarea, [contenteditable]')) return
    const key = event.key.toLowerCase()
    if (key === 'z' || key === 'y') {
      event.preventDefault()
      if (key === 'y' || event.shiftKey) builder.redo()
      else builder.undo()
    }
  }

  const open = (id: string) => {
    builder.select(id)
    setPane('editor')
  }

  const Root = embedded ? 'section' : 'main'
  const screen = (
    <Root
      aria-label={copy.surveys}
      {...rest}
      onKeyDown={onKeyDown}
      className={cn(
        '@container/builder flex flex-col overflow-hidden bg-surface text-fg',
        embedded ? 'h-200 w-full rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line shadow-sm' : 'h-dvh',
        className,
      )}
    >
      <TopBar
        builder={builder}
        copy={copy}
        status={status}
        changed={changed}
        mod={apple ? '⌘' : 'Ctrl'}
        onTest={() => setTesting(true)}
        onPublish={openPublish}
      />
      <div className="flex min-h-0 flex-1">
        <Outline
          builder={builder}
          copy={copy}
          onOpen={open}
          className={cn(
            'w-full shrink-0 bg-surface @3xl/builder:flex @3xl/builder:w-72 @3xl/builder:border-e @3xl/builder:border-line',
            pane === 'outline' ? 'flex' : 'hidden',
          )}
        />
        <div className={cn('min-w-0 flex-1 overflow-y-auto yj-scrollbar @3xl/builder:block', pane === 'editor' ? 'block' : 'hidden')}>
          <Editor builder={builder} copy={copy} onDelete={remove} onBack={() => setPane('outline')} />
        </div>
        <Preview
          builder={builder}
          copy={copy}
          onTest={() => setTesting(true)}
          className="hidden w-88 shrink-0 border-s border-line @6xl/builder:flex"
        />
      </div>
      <span role="status" className="sr-only">
        {builder.announcement}
      </span>
      <TestRun open={testing} onOpenChange={setTesting} survey={survey} copy={copy} />
      <PublishDialog
        open={publishing}
        onOpenChange={setPublishing}
        step={step}
        onStepChange={setStep}
        deployment={deployment}
        onDeploymentChange={setDeployment}
        onPublish={publish}
        url={url}
        segments={segments}
        number={number}
        qrCode={qrCode}
        copy={copy}
      />
      <Toaster />
    </Root>
  )
  return theme ? <ThemeScope theme={theme}>{screen}</ThemeScope> : screen
}

export { SurveyBuilder, DEFAULT_COPY as SURVEY_BUILDER_COPY }
export type {
  QuestionKindKey,
  Survey,
  SurveyAnswers,
  SurveyBuilderCopy,
  SurveyBuilderProps,
  SurveyChannel,
  SurveyDeployment,
  SurveyPublished,
  SurveyQuestion,
  SurveySegment,
}
