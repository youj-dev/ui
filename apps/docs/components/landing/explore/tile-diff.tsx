'use client'

import { DiffViewer } from '@youj/react'
import { Demo } from './demo'

const BEFORE = `export async function getInvoice(id: string) {
  const res = await fetch(\`/api/invoices/\${id}\`)
  const invoice = await res.json()
  return invoice
}
`

const AFTER = `export async function getInvoice(id: string, signal?: AbortSignal) {
  const res = await fetch(\`/api/invoices/\${id}\`, { signal })
  if (!res.ok) throw new Error(\`Invoice \${id}: \${res.status}\`)
  return (await res.json()) as Invoice
}
`

/** A short fix to a fetch: its added check and its cancelable request marked in the lines. */
export default function DiffTile() {
  return (
    <Demo>
      <div className="w-full max-w-xl">
        <DiffViewer before={BEFORE} after={AFTER} filename="src/invoices.ts" language="ts" defaultWrap />
      </div>
    </Demo>
  )
}
