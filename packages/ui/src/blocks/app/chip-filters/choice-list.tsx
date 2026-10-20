import { useId } from 'react'
import { Counter } from '@youj/motion'
import { Checkbox } from '../../../components/ui/checkbox'
import { Field, FieldLabel } from '../../../components/ui/field'
import { cn } from '../../../lib/utils'
import { WHOLE, type ChipFiltersCopy, type ChipFiltersOption } from './data'
import { SectionLabel } from './section'

interface ChoiceListProps {
  options: ChipFiltersOption[]
  /** Records of each group inside the range, in the same order. */
  counts: number[]
  selected: string[]
  onSelectedChange: (selected: string[]) => void
  copy: ChipFiltersCopy
}

/* The groups as a two-column checklist: a tri-state "all" box over
 * them, and a counts column headed like a table's, each count the records of
 * that group inside the range, right-aligned in mono. A group that's
 * off dims, count and all, so the ones in the search read first. Counts tween
 * to their new value when the range moves (Counter). */
export function ChoiceList({ options, counts, selected, onSelectedChange, copy }: ChoiceListProps) {
  const labelId = useId()
  const summaryId = useId()
  const all = selected.length === options.length
  const some = selected.length > 0 && !all

  return (
    <div role="group" aria-labelledby={labelId} aria-describedby={summaryId} className="flex flex-col gap-1">
      <div className="flex h-8 items-center gap-2.5 border-b border-line-subtle pb-1">
        <Checkbox
          checked={all}
          indeterminate={some}
          aria-label={copy.allOptions}
          onCheckedChange={(next) => onSelectedChange(next ? options.map((s) => s.id) : [])}
        />
        <SectionLabel id={labelId}>{copy.choiceLabel}</SectionLabel>
        <SectionLabel aria-hidden className="ms-auto">
          {copy.countColumn}
        </SectionLabel>
        <span id={summaryId} className="sr-only">
          {copy.selectedOf(selected.length, options.length)}
        </span>
      </div>
      <ul className="flex flex-col">
        {options.map((option, i) => {
          const on = selected.includes(option.id)
          return (
            <li key={option.id}>
              <Field orientation="horizontal" className="h-8">
                <Checkbox
                  checked={on}
                  onCheckedChange={(next) => onSelectedChange(next ? [...selected, option.id] : selected.filter((id) => id !== option.id))}
                />
                <FieldLabel
                  className={cn(
                    'min-w-0 gap-3 font-mono font-normal transition-colors yj-duration-fast ease-standard',
                    on ? 'text-fg' : 'text-fg-muted',
                  )}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  <Counter value={counts[i] ?? 0} from={counts[i] ?? 0} locale={copy.locale} format={WHOLE} duration="slow" className="ms-auto" />
                </FieldLabel>
              </Field>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
