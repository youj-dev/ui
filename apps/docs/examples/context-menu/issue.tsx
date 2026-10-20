'use client'

import { useState } from 'react'
import { FlagIcon, TagIcon, UserIcon } from '@youj/icons'
import {
  Badge,
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@youj/react'

const STATUSES = ['Backlog', 'Todo', 'In progress', 'Done']
const PEOPLE = ['Ana Lima', 'Kenji Sato', 'Priya Raman']
const LABELS = ['Bug', 'Performance', 'Edge runtime']

export default function ContextMenuIssue() {
  const [status, setStatus] = useState('In progress')
  const [assignee, setAssignee] = useState('Priya Raman')
  const [labels, setLabels] = useState(['Performance'])
  const toggle = (label: string) => (on: boolean) =>
    setLabels((list) => (on ? [...list, label] : list.filter((l) => l !== label)))

  return (
    <ContextMenu>
      <ContextMenuTrigger className="w-full max-w-xs">
        <a
          href="#KIN-830"
          className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3.5 shadow-xs transition-[border-color] yj-duration-fast ease-standard hover:border-line-control focus-ring"
        >
          <span className="font-mono text-ui-sm text-fg-muted">KIN-830</span>
          <span className="text-ui font-medium text-fg">Cold starts regress on the edge runtime</span>
          <span className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline">{status}</Badge>
            {labels.map((label) => (
              <Badge key={label} variant="secondary">
                {label}
              </Badge>
            ))}
            <span className="ms-auto text-ui-sm text-fg-muted">{assignee}</span>
          </span>
        </a>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FlagIcon />
            Status
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuRadioGroup value={status} onValueChange={setStatus}>
              {STATUSES.map((s) => (
                <ContextMenuRadioItem key={s} value={s}>
                  {s}
                </ContextMenuRadioItem>
              ))}
            </ContextMenuRadioGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <UserIcon />
            Assignee
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuRadioGroup value={assignee} onValueChange={setAssignee}>
              {PEOPLE.map((person) => (
                <ContextMenuRadioItem key={person} value={person}>
                  {person}
                </ContextMenuRadioItem>
              ))}
            </ContextMenuRadioGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <TagIcon />
            Labels
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {LABELS.map((label) => (
              <ContextMenuCheckboxItem key={label} checked={labels.includes(label)} onCheckedChange={toggle(label)}>
                {label}
              </ContextMenuCheckboxItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  )
}
