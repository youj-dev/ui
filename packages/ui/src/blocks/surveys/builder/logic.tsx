'use client'

import { CircleAlertIcon, PlusIcon, XIcon } from '@youj/icons'
import { PresenceItem, PresenceList } from '@youj/motion'
import { Button } from '../../../components/ui/button'
import { NumberInput } from '../../../components/ui/number-input'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import type { SurveyCondition, SurveyOperator, SurveyQuestion } from '../question/data'
import type { SurveyBuilderCopy } from './data'

/* "Show this question": always, or only if earlier answers say so. Each
 * condition picks an earlier question, a comparison that fits its type (a
 * choice is or isn't an option, a multiple choice includes one, a score is at
 * most or at least a number, anything is answered or skipped) and the answer
 * to compare with. Several conditions match all or any. A condition on a
 * question that's been moved below this one is flagged: it never holds. */

/** The comparisons a question's type can be read with. */
export function operatorsFor(question: SurveyQuestion | undefined): SurveyOperator[] {
  if (!question) return ['answered', 'skipped']
  switch (question.type) {
    case 'choice':
      return question.multiple ? ['includes', 'excludes', 'answered', 'skipped'] : ['is', 'isNot', 'answered', 'skipped']
    case 'yesno':
      return ['is', 'answered', 'skipped']
    case 'nps':
    case 'scale':
    case 'rating':
    case 'emoji':
    case 'slider':
      return ['lte', 'gte', 'is', 'answered', 'skipped']
    default:
      return ['answered', 'skipped']
  }
}

/** A sensible first condition on a question: its first comparison and answer. */
export function startingCondition(question: SurveyQuestion): SurveyCondition {
  const op = operatorsFor(question)[0]!
  const value =
    question.type === 'choice'
      ? question.options[0]?.value
      : question.type === 'yesno'
        ? true
        : question.type === 'nps'
          ? 6
          : question.type === 'scale' || question.type === 'rating' || question.type === 'emoji' || question.type === 'slider'
            ? 3
            : undefined
  return { question: question.id, op, value }
}

interface LogicEditorProps {
  question: SurveyQuestion
  /** Every question, in order. */
  questions: SurveyQuestion[]
  onChange: (showIf: SurveyQuestion['showIf']) => void
  copy: SurveyBuilderCopy
}

export function LogicEditor({ question, questions, onChange, copy }: LogicEditorProps) {
  const at = questions.findIndex((q) => q.id === question.id)
  const earlier = questions.slice(0, at)
  const logic = question.showIf
  const conditions = logic?.conditions ?? []
  const set = (next: SurveyCondition[], match = logic?.match) => onChange(next.length ? { match, conditions: next } : undefined)

  if (!earlier.length) return <p className="text-ui text-fg-muted">{copy.noEarlier}</p>

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-ui text-fg">{copy.show}</span>
        <SegmentedControl
          variant="pill"
          aria-label={copy.show}
          value={conditions.length ? 'when' : 'always'}
          onValueChange={(v) => set(v === 'always' ? [] : [startingCondition(earlier[earlier.length - 1]!)])}
        >
          <SegmentedControlItem value="always" className="px-3">
            {copy.always}
          </SegmentedControlItem>
          <SegmentedControlItem value="when" className="px-3">
            {copy.when}
          </SegmentedControlItem>
        </SegmentedControl>
      </div>
      {conditions.length > 1 && (
        <SegmentedControl
          aria-label={copy.logic}
          value={logic?.match ?? 'all'}
          onValueChange={(v) => set(conditions, v as 'all' | 'any')}
          className="w-fit"
        >
          <SegmentedControlItem value="all">{copy.matchAll}</SegmentedControlItem>
          <SegmentedControlItem value="any">{copy.matchAny}</SegmentedControlItem>
        </SegmentedControl>
      )}
      {conditions.length > 0 && (
        <PresenceList as="ul" className="flex flex-col gap-2">
          {conditions.map((condition, index) => {
            const source = questions.find((q) => q.id === condition.question)
            const later = !earlier.some((q) => q.id === condition.question)
            const replace = (next: SurveyCondition) => set(conditions.map((c, i) => (i === index ? next : c)))
            return (
              <PresenceItem key={`${condition.question}-${index}`} className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    items={earlier.map((q, i) => ({ value: q.id, label: `${i + 1}. ${q.title || copy.untitled}` }))}
                    value={later ? null : condition.question}
                    onValueChange={(id) => {
                      const q = questions.find((x) => x.id === id)
                      if (q) replace(startingCondition(q))
                    }}
                  >
                    <SelectTrigger size="sm" aria-label={copy.conditionQuestion} className="min-w-0 flex-1 basis-48">
                      <SelectValue placeholder={copy.conditionQuestion} />
                    </SelectTrigger>
                    <SelectContent>
                      {earlier.map((q, i) => (
                        <SelectItem key={q.id} value={q.id}>
                          {i + 1}. {q.title || copy.untitled}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    items={operatorsFor(source).map((op) => ({ value: op, label: copy.ops[op] }))}
                    value={condition.op}
                    onValueChange={(op) => replace({ ...condition, op: op as SurveyOperator })}
                  >
                    <SelectTrigger size="sm" aria-label={copy.conditionOp} className="w-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {operatorsFor(source).map((op) => (
                        <SelectItem key={op} value={op}>
                          {copy.ops[op]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ValueField condition={condition} source={source} onChange={(value) => replace({ ...condition, value })} copy={copy} />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={copy.removeCondition}
                    onClick={() => set(conditions.filter((_, i) => i !== index))}
                    className="ms-auto"
                  >
                    <XIcon size={14} />
                  </Button>
                </div>
                {later && (
                  <p className="flex items-center gap-1.5 text-ui-sm text-warning-text">
                    <CircleAlertIcon size={13} aria-hidden />
                    {copy.later}
                  </p>
                )}
              </PresenceItem>
            )
          })}
        </PresenceList>
      )}
      {conditions.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="-ms-2 w-fit gap-1"
          onClick={() => set([...conditions, startingCondition(earlier[earlier.length - 1]!)])}
        >
          <PlusIcon size={14} />
          {copy.addCondition}
        </Button>
      )}
    </div>
  )
}

/** The answer a condition compares with: an option, yes or no, or a number. Nothing for answered and skipped. */
function ValueField({
  condition,
  source,
  onChange,
  copy,
}: {
  condition: SurveyCondition
  source?: SurveyQuestion
  onChange: (value: SurveyCondition['value']) => void
  copy: SurveyBuilderCopy
}) {
  if (!source || condition.op === 'answered' || condition.op === 'skipped') return null
  if (source.type === 'choice' || source.type === 'yesno') {
    const items =
      source.type === 'choice'
        ? source.options.map((o) => ({ value: o.value, label: o.label }))
        : [
            { value: 'true', label: source.labels?.[0] ?? copy.yesLabel },
            { value: 'false', label: source.labels?.[1] ?? copy.noLabel },
          ]
    return (
      <Select
        items={items}
        value={condition.value === undefined ? null : String(condition.value)}
        onValueChange={(v) => onChange(source.type === 'yesno' ? v === 'true' : (v as string))}
      >
        <SelectTrigger size="sm" aria-label={copy.conditionValue} className="min-w-0 flex-1 basis-32">
          <SelectValue placeholder={copy.conditionValue} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }
  return (
    <NumberInput
      aria-label={copy.conditionValue}
      value={typeof condition.value === 'number' ? condition.value : null}
      onValueChange={(n) => onChange(n ?? undefined)}
      steppers={false}
      className="w-20"
    />
  )
}
