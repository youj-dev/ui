import type { ReactNode } from 'react'
import { Alert, AlertAction, AlertDescription } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { CardContent } from '../../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../../components/ui/empty'
import { Skeleton } from '../../../components/ui/skeleton'
import type { SlotBookingCopy } from './data'

/** The body's room for each view, so loading, an error and an empty list keep the card's size. */
const ROOM = { calendar: 'min-h-120', grid: 'min-h-128' } as const

/** The body while the timetable loads: the service track, then the month and a day's rows (or the week's grid). */
function SlotBookingLoading({ variant, copy }: { variant: 'calendar' | 'grid'; copy: SlotBookingCopy }) {
  return (
    <CardContent className={`flex flex-col gap-6 ${ROOM[variant]}`}>
      <span className="sr-only">{copy.loadingLabel}</span>
      <Skeleton className="h-9 w-72 max-w-full rounded-lg" />
      {variant === 'calendar' ? (
        <div className="grid gap-x-10 gap-y-8 md:grid-cols-[auto_minmax(0,1fr)]">
          <div className="grid grid-cols-7 content-start gap-1.5 max-md:max-w-xs">
            {Array.from({ length: 35 }, (_, i) => (
              <Skeleton key={i} className="size-10 rounded-full" />
            ))}
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            <Skeleton className="h-10 w-40" />
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 42 }, (_, i) => (
            <Skeleton key={i} className="h-8 rounded-md" />
          ))}
        </div>
      )}
    </CardContent>
  )
}

/** The body when it fails to load or has nothing to offer, centered in the same room. */
function SlotBookingNotice({ variant, children }: { variant: 'calendar' | 'grid'; children: ReactNode }) {
  return <CardContent className={`grid place-items-center ${ROOM[variant]}`}>{children}</CardContent>
}

function SlotBookingError({ variant, message, onRetry, copy }: { variant: 'calendar' | 'grid'; message: string; onRetry?: () => void; copy: SlotBookingCopy }) {
  return (
    <SlotBookingNotice variant={variant}>
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
    </SlotBookingNotice>
  )
}

function SlotBookingEmpty({ variant, empty, copy }: { variant: 'calendar' | 'grid'; empty?: ReactNode; copy: SlotBookingCopy }) {
  return (
    <SlotBookingNotice variant={variant}>
      {empty ?? (
        <Empty className="w-full rounded-lg border border-dashed border-line">
          <EmptyHeader>
            <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
            <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </SlotBookingNotice>
  )
}

export { SlotBookingEmpty, SlotBookingError, SlotBookingLoading }
