import type { ReactNode } from 'react'
import { Alert, AlertAction, AlertDescription } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../../components/ui/empty'
import { Skeleton } from '../../../components/ui/skeleton'
import type { SeatPlanCopy } from './data'

/** The plan's room: about the height of the stage, ten rows and the key, so the card keeps its size. */
const ROOM = 'min-h-112'

/** Seats drawn as skeletons: a stage bar, then rows bending the way the plan does, with an aisle in each. */
function SeatPlanLoading({ copy }: { copy: SeatPlanCopy }) {
  return (
    <div className={`flex flex-col items-center gap-5 ${ROOM}`}>
      <span className="sr-only">{copy.loadingLabel}</span>
      <Skeleton className="h-7 w-2/3 rounded-t-full rounded-b-md" />
      <div aria-hidden className="flex flex-col items-center gap-2">
        {Array.from({ length: 10 }, (_, r) => (
          <div key={r} className="flex gap-9">
            {[3, 8, 3].map((n, g) => (
              <div key={g} className="flex gap-1">
                {Array.from({ length: n }, (_, i) => (
                  <Skeleton key={i} className="h-7 w-7 rounded-t-[42%] rounded-b-[22%]" />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
      <Skeleton aria-hidden className="h-4 w-72 max-w-full" />
    </div>
  )
}

function SeatPlanError({ message, onRetry, copy }: { message: string; onRetry?: () => void; copy: SeatPlanCopy }) {
  return (
    <div className={`grid place-items-center ${ROOM}`}>
      <Alert variant="danger">
        <AlertDescription>{message}</AlertDescription>
        {onRetry && (
          <AlertAction>
            <Button size="sm" variant="outline" onClick={onRetry}>
              {copy.retry}
            </Button>
          </AlertAction>
        )}
      </Alert>
    </div>
  )
}

function SeatPlanEmpty({ empty, copy }: { empty?: ReactNode; copy: SeatPlanCopy }) {
  return (
    <div className={`grid ${ROOM}`}>
      {empty ?? (
        <Empty className="rounded-lg border border-dashed border-line">
          <EmptyHeader>
            <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
            <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}

export { SeatPlanEmpty, SeatPlanError, SeatPlanLoading }
