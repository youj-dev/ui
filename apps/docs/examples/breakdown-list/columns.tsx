'use client'

import { useState } from 'react'
import { BreakdownList, ShareBar, type BreakdownItem } from '@youj/react'

const ACCOUNTS: BreakdownItem[] = [
  { label: 'Money market', detail: 'Northbank ·· 4410', value: 1_920_000, tone: 'success' },
  { label: 'Operating', detail: 'Ledgerline ·· 0182', value: 486_000, tone: 'chart-2' },
  { label: 'Reserve', detail: 'Northbank ·· 7731', value: 702_000, tone: 'chart-4' },
  { label: 'Payroll', detail: 'Ledgerline ·· 2209', value: 268_000, tone: 'warning' },
  { label: 'EU operating', detail: 'Kantor ·· 5520', value: 421_000, tone: 'danger' },
  { label: 'Collections', detail: 'Northbank ·· 9034', value: 133_000, tone: 'neutral' },
]

export default function BreakdownListColumns() {
  const [active, setActive] = useState<number | null>(null)
  return (
    <section className="flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums">$3.93M</span>
        <span className="text-ui-sm text-fg-muted">across six accounts</span>
      </div>
      <ShareBar parts={ACCOUNTS.map((a) => ({ value: a.value, tone: a.tone }))} active={active} className="h-2.5" />
      <BreakdownList
        items={ACCOUNTS}
        format={{ style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 }}
        marker="bar"
        columns={2}
        active={active}
        onActiveChange={setActive}
        aria-label="Cash by account"
      />
    </section>
  )
}
