'use client'

import { MilestoneRuler, type Milestone } from '@youj/react'

/** A made-up app's year: two big releases, a few features, one at risk and two a day apart. */
const MILESTONES: Milestone[] = [
  { id: 'offline', date: '2026-02-09', title: 'Offline mode', description: 'Edits sync when you reconnect' },
  { id: 'folders', date: '2026-04-01', title: 'Shared folders', description: 'Invite a team to a folder' },
  { id: 'v1-5', date: '2026-06-04', title: 'Version 1.5', description: 'New editor, faster search', major: true },
  { id: 'mobile', date: '2026-08-31', title: 'Mobile beta' },
  { id: 'api', date: '2026-09-02', title: 'Public API' },
  { id: 'sso', date: '2026-10-28', title: 'SSO and audit log', description: 'Waiting on the security review', status: 'at-risk' },
  { id: 'v2', date: '2026-11-26', title: 'Version 2', description: 'Rebuilt sync engine', major: true },
]

export default function MilestoneRulerDemo() {
  return (
    <div className="w-full max-w-md">
      <MilestoneRuler milestones={MILESTONES} today="2026-10-13" label="Milestones in 2026" />
    </div>
  )
}
