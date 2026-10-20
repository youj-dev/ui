'use client'

import { Input } from '../../../components/ui/input'
import { NumberInput } from '../../../components/ui/number-input'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { QUESTION_COPY, type SurveyQuestion, type SurveyQuestionOf } from '../question/data'
import type { SurveyBuilderCopy } from './data'
import { EndLabels, Labelled, SettingRow } from './fields'
import { OptionsEditor } from './options'

/* What a question's answers are, by its type: the options of a choice or a
 * ranking (with several answers, "Other" and shuffling), a matrix's
 * statements and columns, a scale's range and the words at its ends, a
 * rating's stars, the faces, a slider's range, step and unit, the two words
 * of a yes or no, a text's length and limit. Every change is one undo step;
 * typing into one field is one step until it pauses. */

type Change = (change: (question: SurveyQuestion) => SurveyQuestion, key?: string) => void

interface AnswersEditorProps {
  question: SurveyQuestion
  update: Change
  copy: SurveyBuilderCopy
}

export function AnswersEditor({ question, update, copy }: AnswersEditorProps) {
  const set = <T extends SurveyQuestion['type']>(patch: Partial<SurveyQuestionOf<T>>, key?: string) =>
    update((q) => ({ ...q, ...patch }) as SurveyQuestion, key)

  switch (question.type) {
    case 'choice':
      return (
        <div className="flex flex-col gap-5">
          <OptionsEditor
            label={copy.options}
            options={question.options}
            onChange={(options, key) => set<'choice'>({ options }, key)}
            copy={copy}
            next={copy.option}
            prefix="option"
            addLabel={copy.addOption}
          />
          <div className="flex flex-col gap-4">
            <SettingRow
              label={copy.multipleAnswers}
              checked={!!question.multiple}
              onChange={(on) => set<'choice'>({ multiple: on || undefined, max: undefined })}
            >
              {question.multiple && (
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-ui-sm text-fg-muted">{copy.maxAnswers}</span>
                  <NumberInput
                    aria-label={copy.maxAnswers}
                    value={question.max ?? null}
                    placeholder={copy.noLimit}
                    min={1}
                    max={question.options.length}
                    onValueChange={(max) => set<'choice'>({ max: max ?? undefined })}
                    className="w-32"
                  />
                </div>
              )}
            </SettingRow>
            <SettingRow
              label={copy.otherOption}
              hint={copy.otherHint}
              checked={!!question.other}
              onChange={(on) => set<'choice'>({ other: on || undefined })}
            />
            <SettingRow
              label={copy.randomize}
              hint={copy.randomizeHint}
              checked={!!question.randomize}
              onChange={(on) => set<'choice'>({ randomize: on || undefined })}
            />
          </div>
        </div>
      )
    case 'ranking':
      return (
        <div className="flex flex-col gap-5">
          <OptionsEditor
            label={copy.options}
            options={question.options}
            onChange={(options, key) => set<'ranking'>({ options }, key)}
            copy={copy}
            next={copy.option}
            prefix="option"
            addLabel={copy.addOption}
            letters={false}
          />
          <SettingRow
            label={copy.randomize}
            hint={copy.randomizeHint}
            checked={!!question.randomize}
            onChange={(on) => set<'ranking'>({ randomize: on || undefined })}
          />
        </div>
      )
    case 'matrix':
      return (
        <div className="grid gap-6 @2xl:grid-cols-2">
          <Labelled label={copy.rows}>
            <OptionsEditor
              label={copy.rows}
              options={question.rows}
              onChange={(rows, key) => set<'matrix'>({ rows }, key)}
              copy={copy}
              next={copy.row}
              prefix="row"
              addLabel={copy.addRow}
              letters={false}
            />
          </Labelled>
          <Labelled label={copy.columns}>
            <OptionsEditor
              label={copy.columns}
              options={question.columns}
              onChange={(columns, key) => set<'matrix'>({ columns }, key)}
              copy={copy}
              next={(n) => copy.option(n)}
              prefix="column"
              addLabel={copy.addColumn}
              letters={false}
            />
          </Labelled>
        </div>
      )
    case 'nps':
      return (
        <EndLabels labels={question.labels} fallback={QUESTION_COPY.npsLabels} onChange={(labels, key) => set<'nps'>({ labels }, key)} copy={copy} />
      )
    case 'scale':
      return (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <Labelled label={copy.from}>
              <SegmentedControl variant="pill" value={String(question.min ?? 1)} onValueChange={(v) => set<'scale'>({ min: Number(v) })}>
                {['0', '1'].map((v) => (
                  <SegmentedControlItem key={v} value={v} className="px-3 tabular-nums">
                    {v}
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
            </Labelled>
            <Labelled label={copy.to}>
              <SegmentedControl variant="pill" value={String(question.max ?? 5)} onValueChange={(v) => set<'scale'>({ max: Number(v) })}>
                {['3', '5', '7', '10'].map((v) => (
                  <SegmentedControlItem key={v} value={v} className="px-3 tabular-nums">
                    {v}
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
            </Labelled>
          </div>
          <EndLabels
            labels={question.labels}
            fallback={[copy.scaleLow, copy.scaleHigh]}
            onChange={(labels, key) => set<'scale'>({ labels }, key)}
            copy={copy}
          />
        </div>
      )
    case 'rating':
      return (
        <Labelled label={copy.stars}>
          <SegmentedControl
            variant="pill"
            value={String(question.max ?? 5)}
            onValueChange={(v) => set<'rating'>({ max: Number(v) })}
            className="w-fit"
          >
            {['3', '4', '5', '7', '10'].map((v) => (
              <SegmentedControlItem key={v} value={v} className="px-3 tabular-nums">
                {v}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </Labelled>
      )
    case 'emoji':
      return (
        <Labelled label={copy.faces}>
          <SegmentedControl
            variant="pill"
            value={String(question.points ?? 5)}
            onValueChange={(v) => set<'emoji'>({ points: Number(v) as 3 | 5 })}
            className="w-fit"
          >
            {['3', '5'].map((v) => (
              <SegmentedControlItem key={v} value={v} className="px-4 tabular-nums">
                {v}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </Labelled>
      )
    case 'slider':
      return (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 @md:grid-cols-4">
            <Labelled label={copy.from}>
              <NumberInput value={question.min ?? 0} onValueChange={(min) => set<'slider'>({ min: min ?? 0 })} />
            </Labelled>
            <Labelled label={copy.to}>
              <NumberInput value={question.max ?? 100} onValueChange={(max) => set<'slider'>({ max: max ?? 100 })} />
            </Labelled>
            <Labelled label={copy.step}>
              <NumberInput value={question.step ?? 1} min={1} onValueChange={(step) => set<'slider'>({ step: step ?? 1 })} />
            </Labelled>
            <Labelled label={copy.unit}>
              <Input
                value={question.unit ?? ''}
                placeholder={copy.unitPlaceholder}
                onChange={(e) => set<'slider'>({ unit: e.target.value || undefined }, 'unit')}
              />
            </Labelled>
          </div>
          <EndLabels
            labels={question.labels}
            fallback={[String(question.min ?? 0), String(question.max ?? 100)]}
            onChange={(labels, key) => set<'slider'>({ labels }, key)}
            copy={copy}
          />
        </div>
      )
    case 'yesno':
      return (
        <EndLabels
          labels={question.labels}
          fallback={[QUESTION_COPY.yes, QUESTION_COPY.no]}
          onChange={(labels, key) => set<'yesno'>({ labels }, key)}
          copy={{ ...copy, lowLabel: copy.yesLabel, highLabel: copy.noLabel }}
        />
      )
    case 'text':
      return (
        <div className="flex flex-col gap-4">
          <SettingRow label={copy.longAnswer} checked={!!question.long} onChange={(on) => set<'text'>({ long: on || undefined })} />
          <div className="flex flex-col gap-3 @md:flex-row">
            <Labelled label={copy.placeholder}>
              <Input
                value={question.placeholder ?? ''}
                placeholder={QUESTION_COPY.textPlaceholder}
                onChange={(e) => set<'text'>({ placeholder: e.target.value || undefined }, 'placeholder')}
              />
            </Labelled>
            <Labelled label={copy.maxLength}>
              <NumberInput
                value={question.maxLength ?? null}
                placeholder={copy.noLimit}
                min={1}
                step={50}
                onValueChange={(n) => set<'text'>({ maxLength: n ?? undefined })}
              />
            </Labelled>
          </div>
        </div>
      )
    case 'email':
      return (
        <Labelled label={copy.placeholder}>
          <Input
            value={question.placeholder ?? ''}
            placeholder={QUESTION_COPY.emailPlaceholder}
            onChange={(e) => set<'email'>({ placeholder: e.target.value || undefined }, 'placeholder')}
          />
        </Labelled>
      )
    case 'date':
      return (
        <div className="flex flex-col gap-3 @md:flex-row">
          <Labelled label={copy.from}>
            <Input type="date" value={question.min ?? ''} onChange={(e) => set<'date'>({ min: e.target.value || undefined })} />
          </Labelled>
          <Labelled label={copy.to}>
            <Input type="date" value={question.max ?? ''} onChange={(e) => set<'date'>({ max: e.target.value || undefined })} />
          </Labelled>
        </div>
      )
  }
}
