'use client'

import { useId, type ReactNode } from 'react'
import { ArrowDownIcon, ArrowUpIcon, ChevronLeftIcon, CopyPlusIcon, MoreHorizontalIcon, TrashIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../../components/ui/empty'
import { Field, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Textarea } from '../../../components/ui/textarea'
import type { SurveyQuestion } from '../question/data'
import { AnswersEditor } from './answers'
import { createQuestion, KINDS, kindOf, type QuestionKindKey, type SurveyBuilderCopy } from './data'
import { SettingRow } from './fields'
import { LogicEditor } from './logic'
import { KindChip } from './outline'
import type { Builder } from './use-builder'

/* The selected question, edited in place: its kind (switching keeps the
 * title, the options where they fit, and the logic), the question and its
 * description in large type, its answers, whether it's required, and when
 * it's shown. Its menu duplicates, moves and deletes it. The ending edits the
 * thanks. With no questions yet, the kinds themselves are the way in. */

interface EditorProps {
  builder: Builder
  copy: SurveyBuilderCopy
  onDelete: (question: SurveyQuestion) => void
  /** On a phone: back to the outline. */
  onBack?: () => void
}

/** A question turned into another kind: its words and logic stay, and its options where the new kind has options. */
function convert(question: SurveyQuestion, kind: QuestionKindKey, copy: SurveyBuilderCopy): SurveyQuestion {
  const fresh = createQuestion(kind, question.id, copy)
  const kept = { title: question.title, description: question.description, required: question.required, showIf: question.showIf }
  const options = 'options' in question ? question.options : undefined
  return { ...fresh, ...kept, ...(options && 'options' in fresh ? { options } : null) } as SurveyQuestion
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4 border-t border-line pt-6">
      <h3 id={id} className="text-ui-sm font-medium tracking-wide text-fg-muted uppercase">
        {title}
      </h3>
      {children}
    </section>
  )
}

export function Editor({ builder, copy, onDelete, onBack }: EditorProps) {
  const { survey, selected } = builder
  const back = onBack && (
    <Button variant="ghost" size="sm" className="-ms-2 gap-1 @3xl/builder:hidden" onClick={onBack}>
      <ChevronLeftIcon size={15} className="rtl:-scale-x-100" />
      {copy.backToQuestions}
    </Button>
  )

  if (selected === 'ending') {
    const ending = survey.ending ?? { title: '', description: '' }
    return (
      <div className="@container mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-6">
        {back}
        <h2 className="text-xl font-semibold tracking-tight">{copy.ending}</h2>
        <Field>
          <FieldLabel>{copy.endingTitle}</FieldLabel>
          <Input
            value={ending.title}
            placeholder={copy.respondent.doneTitle}
            onChange={(e) => builder.commit({ ...survey, ending: { ...ending, title: e.target.value } }, 'ending:title')}
          />
        </Field>
        <Field>
          <FieldLabel>{copy.endingDescription}</FieldLabel>
          <Textarea
            rows={3}
            value={ending.description ?? ''}
            onChange={(e) => builder.commit({ ...survey, ending: { ...ending, description: e.target.value } }, 'ending:description')}
          />
        </Field>
      </div>
    )
  }

  const index = survey.questions.findIndex((q) => q.id === selected)
  const question = survey.questions[index]
  if (!question) {
    return (
      <div className="@container mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
        <Empty className="border-0 p-0">
          <EmptyHeader>
            <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
            <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
        <ul className="grid grid-cols-2 gap-2 @md:grid-cols-3">
          {KINDS.map((kind) => {
            return (
              <li key={kind.key}>
                <button
                  type="button"
                  onClick={() => builder.add(kind.key)}
                  className="flex w-full items-center gap-2.5 rounded-lg border border-line bg-surface p-2.5 text-start transition-colors yj-duration-fast ease-standard hover:bg-hover focus-ring"
                >
                  <KindChip kind={kind} size="lg" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-ui font-medium">{copy.kinds[kind.key]}</span>
                    <span className="truncate text-ui-sm text-fg-muted">{copy.hints[kind.key]}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  const kind = kindOf(question)
  const update = (change: (q: SurveyQuestion) => SurveyQuestion, key?: string) => builder.update(question.id, change, key)
  return (
    <div className="@container mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {back}
          <span className="hidden font-mono text-ui-sm text-fg-subtle tabular-nums @3xl/builder:inline">
            {copy.questionOf(index + 1, survey.questions.length)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Select
            items={KINDS.map((k) => ({ value: k.key, label: copy.kinds[k.key] }))}
            value={kind.key}
            onValueChange={(key) => update((q) => convert(q, key as QuestionKindKey, copy))}
          >
            <SelectTrigger size="sm" aria-label={copy.type} className="w-auto gap-2">
              <KindChip kind={kind} size="sm" className="-ms-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KINDS.map((k) => (
                <SelectItem key={k.key} value={k.key}>
                  {copy.kinds[k.key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={copy.more} />}>
              <MoreHorizontalIcon size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => builder.duplicate(question.id)}>
                <CopyPlusIcon size={14} /> {copy.duplicate}
              </DropdownMenuItem>
              <DropdownMenuItem disabled={index === 0} onClick={() => builder.move(question.id, -1)}>
                <ArrowUpIcon size={14} /> {copy.moveUp}
              </DropdownMenuItem>
              <DropdownMenuItem disabled={index === survey.questions.length - 1} onClick={() => builder.move(question.id, 1)}>
                <ArrowDownIcon size={14} /> {copy.moveDown}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="danger" onClick={() => onDelete(question)}>
                <TrashIcon size={14} /> {copy.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <textarea
          aria-label={copy.title}
          rows={1}
          value={question.title}
          placeholder={copy.titlePlaceholder}
          onChange={(e) => update((q) => ({ ...q, title: e.target.value }), 'title')}
          className="field-sizing-content -mx-2 min-h-control-lg resize-none rounded-md bg-transparent px-2 py-1 text-2xl leading-snug font-semibold tracking-tight text-fg outline-none placeholder:text-fg-subtle hover:bg-hover focus-visible:bg-transparent focus-field"
        />
        <input
          aria-label={copy.description}
          value={question.description ?? ''}
          placeholder={copy.descriptionPlaceholder}
          onChange={(e) => update((q) => ({ ...q, description: e.target.value || undefined }), 'description')}
          className="-mx-2 h-control rounded-md bg-transparent px-2 text-ui-lg text-fg-muted outline-none placeholder:text-fg-subtle hover:bg-hover focus-visible:bg-transparent focus-field"
        />
      </div>

      <Section title={copy.answers}>
        <AnswersEditor question={question} update={update} copy={copy} />
      </Section>
      <Section title={copy.settings}>
        <SettingRow
          label={copy.required}
          hint={copy.requiredHint}
          checked={question.required !== false}
          onChange={(on) => update((q) => ({ ...q, required: on ? undefined : false }))}
        />
      </Section>
      <Section title={copy.logic}>
        <LogicEditor question={question} questions={survey.questions} onChange={(showIf) => update((q) => ({ ...q, showIf }))} copy={copy} />
      </Section>
    </div>
  )
}
