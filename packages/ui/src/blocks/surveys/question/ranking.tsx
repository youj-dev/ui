'use client'

import { Button } from '../../../components/ui/button'
import { SortableList, SortableListHandle, SortableListItem } from '../../../components/ui/sortable-list'
import { cn } from '../../../lib/utils'
import { answered, ordered } from './data'
import type { AnswerProps } from './shared'

/* A ranking: the kit's SortableList, so it's dragged by the grip or picked up
 * from the keyboard (Space, then the arrows, each step announced), and the
 * rows glide aside as one moves. The order on screen isn't an answer until
 * it's touched: moving anything answers with the whole order, and "Keep this
 * order" answers with it as it stands. */

export function RankingAnswer({ question, answer, onAnswer, labelledBy, describedBy, copy, size, seed }: AnswerProps<'ranking'> & { seed: string }) {
  const shown = ordered(question.options, question.randomize, `${seed}:${question.id}`).map((o) => o.value)
  // The answer's order, holding any option it doesn't name (one added since) at the end.
  const order = Array.isArray(answer) ? [...answer.filter((v) => shown.includes(v)), ...shown.filter((v) => !answer.includes(v))] : shown
  const labels = new Map(question.options.map((o) => [o.value, o.label]))

  return (
    <div className="flex flex-col items-start gap-2 @md:mx-auto @md:w-full @md:max-w-lg">
      <SortableList
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        value={order}
        onValueChange={(next) => onAnswer(next)}
        className="w-full [counter-reset:rank]"
      >
        {order.map((value) => (
          <SortableListItem
            key={value}
            value={value}
            textValue={labels.get(value)}
            className={cn('[counter-increment:rank] gap-3', size === 'lg' ? 'min-h-control-lg text-ui-lg' : 'min-h-control')}
          >
            <SortableListHandle />
            {/* A CSS counter, so the rank follows the row while it's lifted. */}
            <span
              aria-hidden
              className={cn(
                'grid size-5 shrink-0 place-items-center rounded-full font-mono text-ui-xs tabular-nums before:content-[counter(rank)]',
                answered(answer) ? 'bg-accent text-on-accent' : 'bg-well text-fg-muted',
              )}
            />
            <span className="min-w-0 flex-1 truncate">{labels.get(value)}</span>
          </SortableListItem>
        ))}
      </SortableList>
      {!answered(answer) && (
        <Button variant="link" size="sm" className="h-auto px-0" onClick={() => onAnswer(order)}>
          {copy.rankKeep}
        </Button>
      )}
    </div>
  )
}
