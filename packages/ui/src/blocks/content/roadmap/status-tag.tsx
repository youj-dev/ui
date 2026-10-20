import { Badge, BadgeDot } from '../../../components/ui/badge'
import { useRoadmap } from './context'
import { STATUS, type Status } from './data'

/** A status as a soft tinted pill: its dot and word in its tone, never color alone. */
export function StatusTag({ status, className }: { status: Status; className?: string }) {
  const { badge } = STATUS[status]
  const label = useRoadmap().copy.status[status]
  return (
    <Badge data-status={status} variant={badge} className={className}>
      <BadgeDot />
      {label}
    </Badge>
  )
}
