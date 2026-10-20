'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useLocale, useYouj } from '@youj/core'
import {
  answered,
  asked,
  demo,
  otherText,
  problem,
  wait,
  type AnswerFormat,
  type QuestionCopy,
  type Survey,
  type SurveyAnswer,
  type SurveyAnswers,
} from './data'
import { dateTimeFormat } from '../../../lib/utils'

/* The walk through a survey one question at a time, shared by every block
 * that asks one at a time (the conversational page, the widget, the deck):
 * the answers (the app's, or kept here), the path the answers lead to, which
 * view is showing (the welcome, a question, the review, the thanks), the way
 * it last travelled, and going on, back, to the review and to the send. A
 * question the answers no longer lead to gives way to the first one still
 * open. Going on checks the answer first; a pick on a single-answer question
 * goes on after a beat, long enough to see what was picked. */

/** Where the walk is: the welcome, a question's id, the review or the thanks. */
export type FlowView = 'welcome' | 'review' | 'done' | (string & {})

interface FlowOptions {
  survey: Survey
  value?: SurveyAnswers
  defaultValue?: SurveyAnswers
  onValueChange?: (answers: SurveyAnswers) => void
  onSubmit?: (answers: SurveyAnswers) => Promise<unknown> | unknown
  /** The demo's name for the send, "Block: onSubmit", warned about when it isn't wired. */
  action: string
  /** Opens on a welcome before the first question. */
  welcome?: boolean
  /** Ends on a review of every answer before the send. */
  review?: boolean
  autoAdvance?: boolean
  copy: QuestionCopy & { failedDescription: string }
  locale?: string
  /** A respondent's id, so randomized options keep their order. Default: an order of this visit's own. */
  seed?: string
}

const subscribeNothing = () => () => {}
let visit: string | undefined
const visitSeed = () => (visit ??= Array.from(crypto.getRandomValues(new Uint8Array(6)), (n) => n.toString(36)).join(''))
const serverSeed = () => ''

/** A seed for randomized options: the app's (a respondent's id), else one per visit (none while rendering on the server). */
export function useSeed(seed?: string) {
  const own = useSyncExternalStore(subscribeNothing, visitSeed, serverSeed)
  return seed ?? own
}

/** The formatters answers are read with, in the locale. */
export function useAnswerFormat(locale?: string): AnswerFormat {
  const lang = useLocale(locale)
  return useMemo(
    () => ({ list: new Intl.ListFormat(lang, { type: 'conjunction' }), date: dateTimeFormat(lang, { dateStyle: 'long' }) }),
    [lang],
  )
}

export function useSurveyFlow({
  survey,
  value,
  defaultValue,
  onValueChange,
  onSubmit,
  action,
  welcome = false,
  review = true,
  autoAdvance = true,
  copy,
  locale,
  seed: seedProp,
}: FlowOptions) {
  const k = useYouj()
  const format = useAnswerFormat(locale)
  const seed = useSeed(seedProp)
  const { questions } = survey
  const [ownAnswers, setOwnAnswers] = useState<SurveyAnswers>(defaultValue ?? {})
  const answers = value ?? ownAnswers
  const path = asked(questions, answers)
  const firstOpen = (all: SurveyAnswers) => asked(questions, all).find((q) => q.required !== false && !answered(all[q.id]))?.id
  // A fresh start opens on the welcome; resumed from saved answers, on the first question still needing one (or the review).
  const [view, setView] = useState<FlowView>(() => {
    const saved = value ?? defaultValue ?? {}
    if (welcome && Object.keys(saved).length === 0) return 'welcome'
    return firstOpen(saved) ?? (review ? 'review' : (path[0]?.id ?? 'review'))
  })
  const [direction, setDirection] = useState<1 | -1>(1)
  // Editing from the review: going on returns to it once nothing is missing.
  const [returning, setReturning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  // "Other" chosen, per question (it can be chosen before anything is typed).
  const [others, setOthers] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(questions.flatMap((q) => (q.type === 'choice' && q.other ? [[q.id, !!otherText(q, (value ?? defaultValue)?.[q.id])]] : []))),
  )

  const fixed = view === 'welcome' || view === 'review' || view === 'done'
  const current = fixed ? undefined : (path.find((q) => q.id === view) ?? path.find((q) => !answered(answers[q.id])) ?? path[0])
  const index = current ? path.indexOf(current) + 1 : view === 'welcome' ? 0 : path.length
  const missing = path.find((q) => q.required !== false && !answered(answers[q.id]) && q.id !== current?.id)

  const answer = (id: string, next: SurveyAnswer | undefined, otherOpen?: boolean) => {
    const all = { ...answers }
    if (next === undefined) delete all[id]
    else all[id] = next
    if (value === undefined) setOwnAnswers(all)
    onValueChange?.(all)
    if (otherOpen !== undefined) setOthers((open) => ({ ...open, [id]: otherOpen }))
    setError(null)
  }

  const go = (to: FlowView, travel: 1 | -1) => {
    setDirection(travel)
    setView(to)
    setError(null)
  }

  const start = () => go(path[0]?.id ?? 'review', 1)

  const submit = async () => {
    setFailure(null)
    const sent = Object.fromEntries(path.filter((q) => answered(answers[q.id])).map((q) => [q.id, answers[q.id]!]))
    try {
      await (onSubmit ? onSubmit(sent) : demo(action, 1100))
    } catch (cause) {
      setFailure(cause instanceof Error && cause.message ? cause.message : copy.failedDescription)
      throw cause
    }
    await wait(k.ms('slow')) // lint-blocks-allow: lets Send show its check before the thanks replaces it
    go('done', 1)
  }

  /** Goes on from the current question, or says what stops it; true when it moved. */
  const next = () => {
    if (!current) return false
    const message = problem(current, answers[current.id], copy, !!others[current.id])
    if (message) {
      setError(message)
      return false
    }
    if (returning) {
      if (missing) go(missing.id, 1)
      else {
        setReturning(false)
        go('review', 1)
      }
      return true
    }
    const following = path[path.indexOf(current) + 1]
    if (following) go(following.id, 1)
    else if (review) go('review', 1)
    else return false
    return true
  }

  const back = () => {
    if (view === 'review') return go(path[path.length - 1]?.id ?? view, -1)
    const previous = current && path[path.indexOf(current) - 1]
    if (previous) go(previous.id, -1)
    else if (current && welcome) go('welcome', -1)
  }

  const edit = (id: string) => {
    setReturning(true)
    go(id, -1)
  }

  const restart = () => {
    if (value === undefined) setOwnAnswers({})
    onValueChange?.({})
    setOthers({})
    setReturning(false)
    go(welcome ? 'welcome' : (asked(questions, {})[0]?.id ?? 'review'), -1)
  }

  // A pick goes on after a beat. The timer reads the latest answers, and a view change cancels it.
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const latestNext = useRef(next)
  useLayoutEffect(() => {
    latestNext.current = next
  })
  useEffect(() => () => clearTimeout(timer.current), [view])
  const onPicked = () => {
    if (!autoAdvance) return
    clearTimeout(timer.current)
    timer.current = setTimeout(() => latestNext.current(), k.ms('slow') + k.ms('fast'))
  }

  // The last question on the path, unless a later one waits on an answer not given yet (it may still be asked).
  // Questions after this one that wait on an answer not given yet: one of them may still be asked.
  const waiting = current
    ? questions
        .slice(questions.indexOf(current) + 1)
        .filter((q) => !path.includes(q) && q.showIf?.conditions.some((c) => !answered(answers[c.question])))
    : []
  const last = !!current && path.indexOf(current) === path.length - 1 && waiting.length === 0
  /** The primary action sends rather than going on. */
  const sends = view === 'review' || (!review && last && !returning)
  const progress = view === 'done' || view === 'review' ? 100 : view === 'welcome' ? 0 : ((index - 1) / Math.max(1, path.length)) * 100

  return {
    answers,
    path,
    view,
    current,
    index,
    total: path.length,
    direction,
    returning,
    missing,
    error,
    failure,
    others,
    seed,
    format,
    sends,
    last,
    /** 1 when a question may still join the path (it waits on an answer not given yet). */
    pending: waiting.length ? 1 : 0,
    progress,
    answer,
    go,
    start,
    next,
    back,
    edit,
    submit,
    restart,
    onPicked,
  }
}

export type SurveyFlow = ReturnType<typeof useSurveyFlow>
