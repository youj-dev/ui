'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { demo, type Survey, type SurveyQuestion } from '../question/data'
import { createQuestion, freshId, type QuestionKindKey, type SurveyBuilderCopy } from './data'

/* The builder's state: the survey (the app's, or kept here), which question
 * is selected, the history behind undo and redo, and the autosave. Every
 * change goes through `commit`: it becomes one undo step (typing into one
 * field joins the step of the keystroke before it, a beat apart), resets
 * redo, reaches the app through `onValueChange`, and saves itself a beat
 * after the last change through `onSave`. */

const JOIN = 1200
const SAVE_AFTER = 800

interface BuilderOptions {
  value?: Survey
  defaultValue: Survey
  onValueChange?: (survey: Survey) => void
  selected?: string
  defaultSelected?: string
  onSelectedChange?: (id: string) => void
  onSave?: (survey: Survey) => Promise<unknown> | unknown
  copy: SurveyBuilderCopy
}

export type SaveState = 'saved' | 'saving' | 'failed'

export function useBuilder({
  value,
  defaultValue,
  onValueChange,
  selected: selectedProp,
  defaultSelected,
  onSelectedChange,
  onSave,
  copy,
}: BuilderOptions) {
  const [own, setOwn] = useState(defaultValue)
  const survey = value ?? own
  const [ownSelected, setOwnSelected] = useState<string>(() => defaultSelected ?? survey.questions[0]?.id ?? '')
  const selected = selectedProp ?? ownSelected
  const setSelected = (id: string) => {
    if (selectedProp === undefined) setOwnSelected(id)
    onSelectedChange?.(id)
  }
  const [save, setSave] = useState<SaveState>('saved')
  const [announcement, setAnnouncement] = useState('')
  const [history, setHistory] = useState<{ past: Survey[]; future: Survey[] }>({ past: [], future: [] })
  const last = useRef({ key: '', at: 0 })
  // The survey as last changed, so a save that lands late doesn't call an older one saved.
  const latest = useRef(survey)
  useLayoutEffect(() => {
    latest.current = survey
  })

  // Autosave, a beat after the last change; the timer is cleared on unmount.
  const saver = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(saver.current), [])
  const persist = async (next: Survey) => {
    setSave('saving')
    try {
      await (onSave ? onSave(next) : demo('SurveyBuilder: onSave', 500))
      if (latest.current === next) setSave('saved')
    } catch {
      setSave('failed')
    }
  }
  const schedule = (next: Survey) => {
    clearTimeout(saver.current)
    setSave('saving')
    saver.current = setTimeout(() => persist(next), SAVE_AFTER)
  }

  const apply = (next: Survey) => {
    latest.current = next
    if (value === undefined) setOwn(next)
    onValueChange?.(next)
    schedule(next)
  }

  /** One change. `key` names the field being typed in, so a run of keystrokes is one undo step. */
  const commit = (next: Survey, key?: string) => {
    const now = performance.now()
    const joins = !!key && last.current.key === key && now - last.current.at < JOIN
    last.current = { key: key ?? '', at: now }
    setHistory((h) => ({ past: joins ? h.past : [...h.past.slice(-99), survey], future: [] }))
    apply(next)
  }

  const undo = () => {
    const previous = history.past.at(-1)
    if (!previous) return
    last.current = { key: '', at: 0 }
    setHistory((h) => ({ past: h.past.slice(0, -1), future: [survey, ...h.future] }))
    apply(previous)
    if (!previous.questions.some((q) => q.id === selected) && selected !== 'ending') setSelected(previous.questions[0]?.id ?? '')
    setAnnouncement(copy.undone)
  }

  const redo = () => {
    const next = history.future[0]
    if (!next) return
    last.current = { key: '', at: 0 }
    setHistory((h) => ({ past: [...h.past, survey], future: h.future.slice(1) }))
    apply(next)
    if (!next.questions.some((q) => q.id === selected) && selected !== 'ending') setSelected(next.questions[0]?.id ?? '')
    setAnnouncement(copy.redone)
  }

  const setQuestions = (questions: SurveyQuestion[], key?: string) => commit({ ...survey, questions }, key)

  /** Changes one question; `key` joins a run of typing into one step. */
  const update = (id: string, change: (question: SurveyQuestion) => SurveyQuestion, key?: string) =>
    setQuestions(
      survey.questions.map((q) => (q.id === id ? change(q) : q)),
      key && `${id}:${key}`,
    )

  const add = (kind: QuestionKindKey) => {
    const id = freshId(
      survey.questions.map((q) => q.id),
      kind,
    )
    const question = createQuestion(kind, id, copy)
    const at = survey.questions.findIndex((q) => q.id === selected)
    const questions = [...survey.questions]
    questions.splice(at === -1 ? questions.length : at + 1, 0, question)
    setQuestions(questions)
    setSelected(id)
    return id
  }

  const duplicate = (id: string) => {
    const at = survey.questions.findIndex((q) => q.id === id)
    const source = survey.questions[at]
    if (!source) return
    const copyId = freshId(
      survey.questions.map((q) => q.id),
      `${source.id}-copy`,
    )
    const questions = [...survey.questions]
    questions.splice(at + 1, 0, { ...structuredClone(source), id: copyId })
    setQuestions(questions)
    setSelected(copyId)
  }

  /** Deletes a question (and the conditions that read it); returns it, for the Undo toast. */
  const remove = (id: string) => {
    const at = survey.questions.findIndex((q) => q.id === id)
    const gone = survey.questions[at]
    if (!gone) return undefined
    const questions = survey.questions
      .filter((q) => q.id !== id)
      .map((q) => {
        if (!q.showIf?.conditions.some((c) => c.question === id)) return q
        const conditions = q.showIf.conditions.filter((c) => c.question !== id)
        return { ...q, showIf: conditions.length ? { ...q.showIf, conditions } : undefined }
      })
    setQuestions(questions)
    setSelected(questions[Math.min(at, questions.length - 1)]?.id ?? '')
    return gone
  }

  const reorder = (order: string[]) => {
    const byId = new Map(survey.questions.map((q) => [q.id, q]))
    setQuestions(order.map((id) => byId.get(id)!).filter(Boolean))
  }

  const move = (id: string, by: -1 | 1) => {
    const order = survey.questions.map((q) => q.id)
    const at = order.indexOf(id)
    const to = at + by
    if (at === -1 || to < 0 || to >= order.length) return
    ;[order[at], order[to]] = [order[to]!, order[at]!]
    reorder(order)
  }

  return {
    survey,
    selected,
    select: setSelected,
    commit,
    update,
    add,
    duplicate,
    remove,
    reorder,
    move,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    save,
    retry: () => persist(survey),
    announcement,
    announce: setAnnouncement,
  }
}

export type Builder = ReturnType<typeof useBuilder>
