'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@youj/react'

const STATUSES = [
  { value: 'todo', label: 'To do' },
  { value: 'doing', label: 'In progress' },
  { value: 'done', label: 'Done' },
]

const ISSUES = [
  { id: 'ENG-188', title: 'Fix login redirect loop', status: 'doing' },
  { id: 'ENG-192', title: 'Keyboard shortcuts cheat sheet', status: 'todo' },
  { id: 'ENG-163', title: 'Onboarding checklist', status: 'done' },
]

export default function SelectDense() {
  return (
    <ul className="flex w-full max-w-md flex-col divide-y divide-line-subtle">
      {ISSUES.map((issue) => (
        <li key={issue.id} className="flex items-center gap-3 py-1.5">
          <span className="font-mono text-ui-sm text-fg-muted">{issue.id}</span>
          <span className="min-w-0 flex-1 truncate text-ui">{issue.title}</span>
          <Select items={STATUSES} defaultValue={issue.status}>
            <SelectTrigger variant="ghost" size="sm" hideIcon aria-label={`Status of ${issue.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="end">
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </li>
      ))}
    </ul>
  )
}
