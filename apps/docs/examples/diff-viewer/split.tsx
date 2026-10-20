'use client'

import { DiffViewer } from '@youj/react'

const BEFORE = `export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get('page') ?? 1)
  const limit = 20

  const invoices = await db.invoice.findMany({
    where: { teamId: session.teamId },
    skip: (page - 1) * limit,
    take: limit,
  })
  return NextResponse.json({ invoices, page })
}
`

const AFTER = `const query = z.object({
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
    skip: (page - 1) * limit,
    take: limit,
  })
  return NextResponse.json({ invoices, page, status })
}
`

export default function DiffViewerSplit() {
  return (
    <div className="w-full max-w-4xl">
      <DiffViewer before={BEFORE} after={AFTER} filename="app/api/invoices/route.ts" language="ts" defaultView="split" />
    </div>
  )
}
