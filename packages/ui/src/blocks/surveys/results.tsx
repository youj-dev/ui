'use client'

import { useId, useMemo, useState, type HTMLAttributes } from 'react'
import { MotionFeatures, ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Counter } from '@youj/motion'
import { Badge } from '../../components/ui/badge'
import { Card } from '../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Skeleton } from '../../components/ui/skeleton'
import { cn, numberFormat } from '../../lib/utils'
import { QUESTION_COPY, SURVEY, type Survey, type SurveyQuestion } from './question/data'
import { answering, demoResponses, median, share, type SurveyResponse } from './results/data'
import { QuestionSummary } from './results/summary'

/* What a survey heard, at a glance: how many answered, how many finished
 * and how long it took them, then one question's answers in the shape its
 * type calls for (NPS first when there's one: its score and the split of
 * detractors, passives and promoters). Pick another question and its answers
 * replace the last in the same space: the card keeps its size, and a long
 * summary scrolls inside it. The summaries are computed from the raw
 * responses, so pass yours as they're stored. Reduced motion: the counts and
 * bars are drawn at their values. */

const DEFAULT_COPY = {
  ...QUESTION_COPY,
  title: 'Results',
  live: 'Live',
  responses: 'Responses',
  completion: 'Completed',
  time: 'Median time',
  /** "2 min 40 s". */
  duration: (minutes: number, seconds: number) => (minutes ? `${minutes} min ${seconds} s` : `${seconds} s`),
  question: 'Question',
  /** Under the question: "Answered by 271". */
  answeredBy: (count: string) => `Answered by ${count}`,
  promoters: 'Promoters',
  passives: 'Passives',
  detractors: 'Detractors',
  npsLabel: 'Net Promoter Score',
  average: 'Median',
  range: (low: string, high: string) => `From ${low} to ${high}`,
  amount: (value: string, unit?: string) => (unit ? `${value} ${unit}` : value),
  points: 'Points',
  latest: 'Latest answers',
  noAnswers: 'No one has answered this yet.',
  emptyTitle: 'No responses yet',
  emptyDescription: 'Share the survey and answers will appear here as they arrive.',
  loading: 'Loading results',
}

type SurveyResultsCopy = typeof DEFAULT_COPY

interface SurveyResultsProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** The card alone, its title an `h2`. Default true; `false` draws its own page around it. */
  embedded?: boolean
  /** Take the whole width it's given instead of its natural width (576px at 100% scale). Default false. */
  fill?: boolean
  copy?: Partial<SurveyResultsCopy>
  /** Formats counts and shares (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The survey the responses answer. Default: Tern's product survey. */
  survey?: Survey
  /** Every response, as stored. Default: 312 demo responses. */
  responses?: SurveyResponse[]
  /** The question shown (its id), controlled: pair it with `onQuestionChange`. */
  question?: string
  /** The question shown at first, when the block owns it. Default: the NPS question, else the first. */
  defaultQuestion?: string
  onQuestionChange?: (id: string) => void
  /** Responses are on their way: the card keeps its shape with placeholders. */
  loading?: boolean
}

function SurveyResults({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale,
  survey = SURVEY,
  responses: responsesProp,
  question: questionProp,
  defaultQuestion,
  onQuestionChange,
  loading = false,
  className,
  ...rest
}: SurveyResultsProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const lang = useLocale(locale)
  const number = useMemo(() => numberFormat(lang), [lang])
  const percent = useMemo(() => numberFormat(lang, { style: 'percent' }), [lang])
  const responses = useMemo(() => responsesProp ?? demoResponses(), [responsesProp])
  const titleId = useId()
  const first = survey.questions.find((q) => q.type === 'nps')?.id ?? survey.questions[0]?.id ?? ''
  const [own, setOwn] = useState(defaultQuestion ?? first)
  const shown: SurveyQuestion | undefined = survey.questions.find((q) => q.id === (questionProp ?? own))
  const choose = (id: string) => {
    if (questionProp === undefined) setOwn(id)
    onQuestionChange?.(id)
  }
  const completed = responses.filter((r) => r.completed).length
  const seconds = Math.round(median(responses.flatMap((r) => (r.completed && r.seconds ? [r.seconds] : []))))
  const Title = embedded ? 'h2' : 'h1'

  const kpis = [
    { key: 'responses', label: copy.responses, value: <Counter value={responses.length} inView={false} locale={lang} /> },
    {
      key: 'completion',
      label: copy.completion,
      value: <Counter value={share(completed, responses.length)} format={{ style: 'percent' }} inView={false} locale={lang} />,
    },
    { key: 'time', label: copy.time, value: copy.duration(Math.floor(seconds / 60), seconds % 60) },
  ]

  const card = (
    <Card
      role="region"
      aria-labelledby={titleId}
      aria-busy={loading || undefined}
      {...(embedded ? rest : null)}
      className={cn(
        '@container w-full gap-0 overflow-hidden py-0 text-fg',
        embedded ? 'shadow-sm' : 'shadow-lg',
        !fill && 'max-w-xl',
        embedded && className,
      )}
    >
      <div className="flex items-start justify-between gap-4 px-(--ui--panel-x) pt-(--ui--panel-head-y) pb-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Title id={titleId} className="truncate text-ui-lg font-semibold tracking-tight">
            {survey.title}
          </Title>
          <span className="text-ui-sm text-fg-muted">{copy.title}</span>
        </div>
        <Badge variant="success">{copy.live}</Badge>
      </div>
      <dl className="grid grid-cols-3 border-y border-line">
        {kpis.map((kpi, i) => (
          <div key={kpi.key} className={cn('flex flex-col gap-1 px-(--ui--panel-x) py-3', i > 0 && 'border-s border-line')}>
            <dt className="text-ui-sm text-fg-muted">{kpi.label}</dt>
            <dd className="text-lg font-semibold tracking-tight tabular-nums @md:text-xl">
              {loading ? <Skeleton className="h-7 w-16" /> : kpi.value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-3 px-(--ui--panel-x) pt-4 pb-(--ui--panel-foot-y)">
        <Select
          items={survey.questions.map((q, i) => ({ value: q.id, label: `${i + 1}. ${q.title}` }))}
          value={shown?.id ?? null}
          onValueChange={(id) => choose(id as string)}
        >
          <SelectTrigger aria-label={copy.question} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {survey.questions.map((q, i) => (
              <SelectItem key={q.id} value={q.id}>
                {i + 1}. {q.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* One height for every question's summary; a long one scrolls inside it. */}
        <div className="h-72 overflow-y-auto yj-scrollbar pe-1">
          {loading ? (
            <div className="flex flex-col gap-3">
              <span className="sr-only">{copy.loading}</span>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : !responses.length ? (
            <Empty className="h-full border-0 p-0">
              <EmptyHeader>
                <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
                <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : shown ? (
            <MotionFeatures key={shown.id}>
              <p className="pb-3 text-ui-sm text-fg-muted">{copy.answeredBy(number.format(answering(shown, responses).length))}</p>
              <QuestionSummary question={shown} responses={responses} copy={copy} number={number} percent={percent} />
            </MotionFeatures>
          ) : null}
        </div>
      </div>
    </Card>
  )

  const shell = embedded ? (
    card
  ) : (
    <main {...rest} className={cn('grid min-h-dvh w-full place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{shell}</ThemeScope> : shell
}

export { SurveyResults, DEFAULT_COPY as SURVEY_RESULTS_COPY }
export type { Survey, SurveyResponse, SurveyResultsCopy, SurveyResultsProps }
