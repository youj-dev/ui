'use client'

import { DownloadIcon, FileTextIcon } from '@youj/icons'
import { Badge } from '../../../../components/ui/badge'
import { Button } from '../../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { cn } from '../../../../lib/utils'
import type { ShipmentDetailDocument } from '../data'

const STATUS = {
  signed: { label: 'Signed', variant: 'success' },
  filed: { label: 'Filed', variant: 'secondary' },
  pending: { label: 'Pending', variant: 'warning' },
} as const

/** The shipment's paperwork, each with its state and a download. */
export function Documents({
  documents,
  onDownload,
  compact = false,
}: {
  documents: ShipmentDetailDocument[]
  onDownload: (document: ShipmentDetailDocument) => void
  compact?: boolean
}) {
  return (
    <Card role="region" aria-labelledby="shipment-documents" size="sm" className="min-w-0">
      <CardHeader>
        <CardTitle>
          <h2 id="shipment-documents">Documents</h2>
        </CardTitle>
        <CardDescription>{documents.length} on file</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className={cn('grid grid-cols-1 gap-x-6', !compact && 'sm:grid-cols-2')}>
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 border-t border-line py-2.5 first:border-t-0 first:pt-0">
              <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-band text-fg-muted">
                <FileTextIcon size={16} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-ui-sm font-medium text-fg">{doc.name}</span>
                <span className="truncate text-ui-xs text-fg-muted">{doc.detail}</span>
              </span>
              <Badge variant={STATUS[doc.status].variant}>{STATUS[doc.status].label}</Badge>
              {doc.status !== 'pending' && (
                <Button size="icon-sm" variant="ghost" aria-label={`Download ${doc.name}`} onClick={() => onDownload(doc)}>
                  <DownloadIcon size={14} />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
