'use client'

import { BuildingIcon, MailIcon, MapPinIcon, PhoneIcon, UserIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import type { RecordsTableRecord, RecordsTableCopy, RecordsTableOwner } from './data'

/** A record's detail, under its row: how to reach them, where they are, who owns them, and a way to write. */
export function RecordDetail({
  record,
  owners,
  copy,
  onEmail,
}: {
  record: RecordsTableRecord
  owners: RecordsTableOwner[]
  copy: RecordsTableCopy
  onEmail: (record: RecordsTableRecord) => void
}) {
  const owner = owners.find((o) => o.id === record.owner)
  const fields = [
    { icon: BuildingIcon, label: copy.detail.org, value: record.title ? `${record.title}, ${record.org}` : record.org },
    { icon: PhoneIcon, label: copy.detail.phone, value: record.phone },
    { icon: MapPinIcon, label: copy.detail.location, value: record.location },
    { icon: UserIcon, label: copy.detail.owner, value: owner?.name ?? copy.detail.noOwner },
  ].filter((field) => field.value)
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(--spacing(44),1fr))] gap-x-8 gap-y-3 text-ui-sm sm:min-w-128">
        {fields.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex min-w-0 flex-col gap-1">
            <dt className="flex items-center gap-1.5 text-ui-xs font-medium text-fg-muted">
              <Icon aria-hidden size={13} />
              {label}
            </dt>
            <dd className="truncate text-fg">{value}</dd>
          </div>
        ))}
      </dl>
      <Button size="sm" variant="outline" onClick={() => onEmail(record)}>
        <MailIcon />
        {copy.detail.email}
      </Button>
    </div>
  )
}
