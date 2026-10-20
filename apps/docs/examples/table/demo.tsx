'use client'

import { Badge, Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@youj/react'

const INVOICES = [
  { id: 'INV-2041', customer: 'Northwind Traders', status: 'Paid', amount: 4200 },
  { id: 'INV-2040', customer: 'Brightline Health', status: 'Pending', amount: 1180 },
  { id: 'INV-2039', customer: 'Kestrel Labs', status: 'Paid', amount: 760 },
  { id: 'INV-2038', customer: 'Lattice Freight', status: 'Overdue', amount: 2950 },
] as const

const VARIANT = { Paid: 'success', Pending: 'secondary', Overdue: 'danger' } as const
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export default function TableDemo() {
  const total = INVOICES.reduce((sum, invoice) => sum + invoice.amount, 0)
  return (
    <div className="w-full max-w-2xl rounded-xl border border-line bg-surface">
      <Table aria-label="Invoices">
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-end">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {INVOICES.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-mono text-ui-sm text-fg-muted">{invoice.id}</TableCell>
              <TableCell className="font-medium">{invoice.customer}</TableCell>
              <TableCell>
                <Badge variant={VARIANT[invoice.status]}>{invoice.status}</Badge>
              </TableCell>
              <TableCell className="text-end tabular-nums">{usd.format(invoice.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total</TableCell>
            <TableCell className="text-end tabular-nums">{usd.format(total)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
