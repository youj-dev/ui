'use client'

import { m } from 'motion/react'
import { MotionFeatures, useDirection, useYouj } from '@youj/core'
import { Counter } from '@youj/motion'
import { cn } from '../../../lib/utils'
import { faceLabels, type QuestionCopy, type SurveyQuestion } from '../question/data'
import { answering, median, nps, share, tally, type SurveyResponse } from './data'

/* One question's answers at a glance, in the shape its type calls for:
 * bars for choices, faces, stars and points (each with its share and count),
 * the average place for a ranking, NPS as its score over the split of
 * detractors, passives and promoters, a matrix row by row, the middle and the
 * spread of a slider, and the latest words of a text answer. Bars grow from
 * the reading start, a step apart; reduced motion draws them at length. */

export interface SummaryCopy extends QuestionCopy {
  answeredBy: (count: string) => string
  promoters: string
  passives: string
  detractors: string
  npsLabel: string
  average: string
  range: (low: string, high: string) => string
  /** A number with its unit: "12 h a week". */
  amount: (value: string, unit?: string) => string
  points: string
  latest: string
  noAnswers: string
}

interface SummaryProps {
  question: SurveyQuestion
  responses: SurveyResponse[]
  copy: SummaryCopy
  number: Intl.NumberFormat
  percent: Intl.NumberFormat
}

function Bar({ value, index, tone = 'bg-accent' }: { value: number; index: number; tone?: string }) {
  const k = useYouj()
  const rtl = useDirection() === 'rtl'
  return (
    <span aria-hidden className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-well">
      <m.span
        className={cn('absolute inset-0 rounded-full', tone)}
        style={{ originX: rtl ? 1 : 0 }}
        initial={k.reduced ? false : { scaleX: 0 }}
        animate={{ scaleX: value }}
        transition={{ ...k.spring('smooth'), delay: index * k.stagger('tight') }}
      />
    </span>
  )
}

function Bars({
  rows,
  total,
  number,
  percent,
}: {
  rows: { key: string; label: string; count: number }[]
  total: number
  number: Intl.NumberFormat
  percent: Intl.NumberFormat
}) {
  const most = Math.max(...rows.map((r) => r.count), 1)
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((row, index) => (
        <li key={row.key} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] items-center gap-3 text-ui">
          <span className="truncate text-fg">{row.label}</span>
          <Bar value={row.count / most} index={index} />
          <span className="w-20 text-end text-fg-muted tabular-nums">
            {percent.format(share(row.count, total))} <span className="text-fg-subtle">· {number.format(row.count)}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

export function QuestionSummary({ question, responses, copy, number, percent }: SummaryProps) {
  const k = useYouj()
  const answers = answering(question, responses)
  if (!answers.length) return <p className="text-ui text-fg-muted">{copy.noAnswers}</p>

  if (question.type === 'nps') {
    const result = nps(answers.map((r) => r.answers[question.id] as number))
    const parts = [
      { key: 'detractors', label: copy.detractors, count: result.detractors, tone: 'bg-danger' },
      { key: 'passives', label: copy.passives, count: result.passives, tone: 'bg-warning' },
      { key: 'promoters', label: copy.promoters, count: result.promoters, tone: 'bg-success' },
    ]
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline gap-2">
          <Counter value={result.score} format={{ signDisplay: 'exceptZero' }} inView={false} className="text-4xl font-semibold tracking-tight" />
          <span className="text-ui text-fg-muted">{copy.npsLabel}</span>
        </div>
        <MotionFeatures>
          <div aria-hidden className="flex h-3 gap-0.5 overflow-hidden rounded-full">
            {parts.map((part, index) => (
              <m.span
                key={part.key}
                className={part.tone}
                style={{ flexGrow: part.count, originX: 0 }}
                initial={k.reduced ? false : { scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ ...k.spring('smooth'), delay: index * k.stagger('base') }}
              />
            ))}
          </div>
        </MotionFeatures>
        <ul className="grid grid-cols-3 gap-3">
          {parts.map((part) => (
            <li key={part.key} className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1.5 text-ui-sm text-fg-muted">
                <span aria-hidden className={cn('size-2 rounded-full', part.tone)} />
                {part.label}
              </span>
              <span className="text-ui-lg font-medium tabular-nums">{percent.format(share(part.count, result.total))}</span>
            </li>
          ))}
        </ul>
        {/* Every score's count, 0 to 10, in its band's colour: the split above, drawn out. */}
        <MotionFeatures>
          <div aria-hidden className="flex flex-col gap-1 pt-1">
            <div className="grid h-14 grid-cols-11 items-end gap-1">
              {result.counts.map((count, score) => (
                <m.span
                  key={score}
                  className={cn('rounded-sm', score <= 6 ? 'bg-danger' : score <= 8 ? 'bg-warning' : 'bg-success')}
                  style={{ height: `${Math.max(4, (count / Math.max(...result.counts, 1)) * 100)}%`, originY: 1 }}
                  initial={k.reduced ? false : { scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ ...k.spring('smooth'), delay: score * k.stagger('tight') }}
                />
              ))}
            </div>
            <div className="grid grid-cols-11 gap-1 text-center font-mono text-ui-xs text-fg-subtle tabular-nums">
              {result.counts.map((_, score) => (
                <span key={score}>{score}</span>
              ))}
            </div>
          </div>
        </MotionFeatures>
      </div>
    )
  }

  if (question.type === 'matrix') {
    return (
      <ul className="flex flex-col gap-3">
        {question.rows.map((row) => {
          const picks = answers.map((r) => (r.answers[question.id] as Record<string, string>)[row.value]).filter(Boolean)
          const rows = question.columns.map((c) => ({ key: c.value, label: c.label, count: picks.filter((p) => p === c.value).length }))
          const top = rows.reduce((a, b) => (b.count > a.count ? b : a))
          return (
            <li key={row.value} className="flex flex-col gap-1.5">
              <span className="flex justify-between gap-3 text-ui">
                <span className="text-fg">{row.label}</span>
                <span className="text-fg-muted">
                  {top.label} · {percent.format(share(top.count, picks.length))}
                </span>
              </span>
              <Bar value={share(top.count, picks.length)} index={0} />
            </li>
          )
        })}
      </ul>
    )
  }

  if (question.type === 'slider') {
    const values = answers.map((r) => r.answers[question.id] as number)
    const fmt = (n: number) => copy.amount(number.format(n), question.unit)
    return (
      <div className="flex flex-col gap-1">
        <span className="text-ui text-fg-muted">{copy.average}</span>
        <span className="text-4xl font-semibold tracking-tight tabular-nums">{fmt(Math.round(median(values)))}</span>
        <span className="text-ui text-fg-muted">{copy.range(fmt(Math.min(...values)), fmt(Math.max(...values)))}</span>
      </div>
    )
  }

  if (question.type === 'text' || question.type === 'email' || question.type === 'date') {
    const latest = answers.slice(-3).reverse()
    return (
      <div className="flex flex-col gap-3">
        <span className="text-ui-sm text-fg-muted">{copy.latest}</span>
        <ul className="flex flex-col gap-2">
          {latest.map((r) => (
            <li key={r.id} className="rounded-lg border border-line bg-well px-3 py-2 text-ui text-pretty text-fg">
              {String(r.answers[question.id])}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const faces = faceLabels(question.type === 'emoji' ? (question.points ?? 5) : 5, copy)
  const rows = tally(question, responses, faces, [copy.yes, copy.no])
  const total = question.type === 'ranking' ? rows.reduce((sum, r) => sum + r.count, 0) : answers.length
  return <Bars rows={rows} total={total} number={number} percent={percent} />
}
