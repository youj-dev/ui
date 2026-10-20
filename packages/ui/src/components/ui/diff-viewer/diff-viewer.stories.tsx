import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { DiffViewer } from './diff-viewer'

const meta: Meta<typeof DiffViewer> = {
  title: 'UI/Display/Diff Viewer',
  component: DiffViewer,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The difference between two versions of a file, as code review reads it. Pass `before` and `after` (a Myers line diff, computed in the component) or a unified `patch`. A sticky header names the file, counts additions and deletions with a five-square stat bar, steps through the changes ("Change 3 of 7"; J/K or Alt+↓/↑ anywhere in the diff), switches between the unified and the split view, wraps long lines and copies the new version. Added and removed lines take the success and danger tints, the words that changed inside a pair of lines a stronger one, and the code keeps CodeBlock’s highlighting. Unchanged runs longer than `context` lines fold into a row that opens in place. It is a table: a changed line reads "Added line 12: …" to a screen reader, and the code stays left to right on a right-to-left page. Reduced motion: stepping jumps to the change instead of gliding.',
      },
    },
  },
  args: { language: 'tsx', context: 3 },
  argTypes: {
    view: { control: 'inline-radio', options: ['unified', 'split'] },
    context: { control: { type: 'range', min: 0, max: 10, step: 1 } },
  },
}
export default meta
type Story = StoryObj<typeof DiffViewer>

const BUTTON_BEFORE = `'use client'

import { useState } from 'react'
import { Button } from '@youj/react'

interface SaveButtonProps {
  onSave: () => Promise<void>
}

export function SaveButton({ onSave }: SaveButtonProps) {
  const [saving, setSaving] = useState(false)
  const handleClick = async () => {
    setSaving(true)
    try {
      await onSave()
    } finally {
      setSaving(false)
    }
  }
  return (
    <Button onClick={handleClick} disabled={saving}>
      {saving ? 'Saving...' : 'Save changes'}
    </Button>
  )
}
`

const BUTTON_AFTER = `'use client'

import { AsyncButton } from '@youj/react'

interface SaveButtonProps {
  onSave: () => Promise<void>
  /** Shown while the save runs. */
  pendingLabel?: string
}

export function SaveButton({ onSave, pendingLabel = 'Saving…' }: SaveButtonProps) {
  // AsyncButton owns the pending state, the check and the error shake.
  return (
    <AsyncButton onAction={onSave} pendingLabel={pendingLabel}>
      Save changes
    </AsyncButton>
  )
}
`

/** Every prop on the controls: switch views, wrap, step with J and K, open a folded run, copy. */
export const Playground: Story = {
  args: { before: BUTTON_BEFORE, after: BUTTON_AFTER, filename: 'components/save-button.tsx' },
  render: (args) => (
    <div className="w-full max-w-[880px]">
      <DiffViewer {...args} />
    </div>
  ),
}

const ROUTE_BEFORE = `import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get('page') ?? 1)
  const limit = 20

  const invoices = await db.invoice.findMany({
    where: { teamId: session.teamId },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  })

  return NextResponse.json({ invoices, page })
}
`

const ROUTE_AFTER = `import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

const query = z.object({
  page: z.coerce.number().int().min(1).default(1),
  status: z.enum(['draft', 'open', 'paid', 'void']).optional(),
})

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const { page, status } = query.parse(Object.fromEntries(searchParams))
  const limit = 25

  const invoices = await db.invoice.findMany({
    where: { teamId: session.teamId, ...(status && { status }) },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  })

  return NextResponse.json({ invoices, page, status })
}
`

/** One file of a pull request, side by side: validation added to an API route, with the words that changed marked inside each pair of lines. */
export const PullRequestFile: Story = {
  name: 'Pull request file',
  args: { before: ROUTE_BEFORE, after: ROUTE_AFTER, filename: 'app/api/invoices/route.ts', language: 'ts', defaultView: 'split' },
  render: (args) => (
    <div className="w-full max-w-[1100px]">
      <DiffViewer {...args} />
    </div>
  ),
}

const CONFIG_BEFORE = `name: deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-22.04
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test
`

const CONFIG_AFTER = `name: deploy
on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-24.04
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test -- --coverage
`

/** A small config change read top to bottom: a CI workflow moved to a newer runner and Node, and run on pull requests too. */
export const ConfigChange: Story = {
  name: 'Config change',
  args: { before: CONFIG_BEFORE, after: CONFIG_AFTER, filename: '.github/workflows/deploy.yml', language: 'yaml', defaultView: 'unified' },
  render: (args) => (
    <div className="w-full max-w-[720px]">
      <DiffViewer {...args} />
    </div>
  ),
}

const handlers = Array.from({ length: 120 }, (_, i) => {
  const name = `handler${String(i).padStart(3, '0')}`
  return `export function ${name}(event: AppEvent): Result {\n  const payload = parse(event.body)\n  return { ok: true, id: '${name}', size: payload.length }\n}\n`
})
const LONG_BEFORE = `import { parse, type AppEvent, type Result } from './runtime'\n\n${handlers.join('\n')}`
const LONG_AFTER = `import { parse, validate, type AppEvent, type Result } from './runtime'\n\n${handlers
  .map((h, i) =>
    i === 40
      ? h.replace('const payload = parse(event.body)', 'const payload = validate(parse(event.body))')
      : i === 97
        ? `${h}\n/** Retries a handler once on a transient failure. */\nexport const retry = (fn: typeof handler000) => (event: AppEvent) => {\n  const first = fn(event)\n  return first.ok ? first : fn(event)\n}\n`
        : h,
  )
  .join('\n')}`

/** A 600-line file with three changes: only the changes and three lines around each show, and each long unchanged run folds into a row that opens in place. Step through with J and K. */
export const LongFileWithCollapsedRegions: Story = {
  name: 'Long file with collapsed regions',
  args: { before: LONG_BEFORE, after: LONG_AFTER, filename: 'src/handlers.ts', language: 'ts' },
  render: (args) => (
    <div className="w-full max-w-[880px]">
      <DiffViewer {...args} />
    </div>
  ),
}

const PATCH = `diff --git a/packages/ui/src/lib/format.ts b/packages/ui/src/lib/format.ts
index 4c1d2e8..9a7f3b1 100644
--- a/packages/ui/src/lib/format.ts
+++ b/packages/ui/src/lib/format.ts
@@ -12,9 +12,10 @@ const units = ['B', 'KB', 'MB', 'GB', 'TB']
 export function formatBytes(bytes: number, locale?: string) {
   if (bytes === 0) return '0 B'
-  const i = Math.floor(Math.log(bytes) / Math.log(1024))
-  const value = bytes / Math.pow(1024, i)
-  return value.toFixed(1) + ' ' + units[i]
+  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
+  const value = bytes / 1024 ** i
+  const digits = value < 10 && i > 0 ? 1 : 0
+  return \`\${numberFormat(locale, { maximumFractionDigits: digits }).format(value)} \${units[i]}\`
 }

 export function formatDuration(ms: number) {
@@ -48,7 +49,7 @@ export function formatRelative(date: Date, now: Date) {
   const seconds = Math.round((date.getTime() - now.getTime()) / 1000)
   const unit = pickUnit(seconds)
-  return new Intl.RelativeTimeFormat('en').format(seconds / UNIT_SECONDS[unit], unit)
+  return relativeTimeFormat(locale).format(Math.round(seconds / UNIT_SECONDS[unit]), unit)
 }

 export const percent = (value: number) => \`\${Math.round(value * 100)}%\`
`

/** A unified diff as \`git diff\` prints it: each hunk opens on its \`@@\` header, and the file name comes from the patch. */
export const PatchInput: Story = {
  name: 'Patch input',
  args: { patch: PATCH, language: 'ts' },
  render: (args) => (
    <div className="w-full max-w-[880px]">
      <DiffViewer {...args} />
    </div>
  ),
}

/** Reduced motion: J and K jump to each change instead of gliding, and the view switch’s indicator moves at once. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  args: { before: CONFIG_BEFORE, after: CONFIG_AFTER, filename: '.github/workflows/deploy.yml', language: 'yaml' },
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <div className="w-full max-w-[720px]">
        <DiffViewer {...args} />
      </div>
    </YoujProvider>
  ),
}
