'use client'

import { Badge } from '../../../../components/ui/badge'
import type { ShipmentStatus } from '../data'

export function StatusBadge({ status }: { status: ShipmentStatus }) {
  if (status === 'delayed') return <Badge variant="warning">Holding</Badge>
  if (status === 'rerouted') return <Badge>Rerouted</Badge>
  if (status === 'arrived') return <Badge variant="secondary">In port</Badge>
  return <Badge variant="success">On time</Badge>
}
