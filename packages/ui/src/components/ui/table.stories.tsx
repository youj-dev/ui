import { useState, type MouseEvent } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { MoreHorizontalIcon, PlusIcon, SearchIcon } from '@youj/icons'
import { initials } from '../../lib/utils'
import { Avatar, AvatarFallback } from './avatar'
import { Badge, BadgeDot } from './badge'
import { Button } from './button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from './card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupInput } from './input-group'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, paginationRange } from './pagination'
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './table'

const meta: Meta<typeof Table> = {
  title: 'UI/Data/Table',
  component: Table,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The plain table parts: header, body, footer, row, head, cell and caption. Dividers sit on the cells (the table is border-separate) so a row can move without leaving a border behind, and every side is logical so RTL mirrors. A table wider than its frame scrolls and becomes a named, keyboard-reachable region. For sorting, filtering and paging, use DataTable.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Table>

const invoices = [
  { id: 'INV-1041', status: 'Paid', method: 'Card', amount: '$250.00' },
  { id: 'INV-1042', status: 'Pending', method: 'Bank transfer', amount: '$150.00' },
  { id: 'INV-1043', status: 'Unpaid', method: 'Card', amount: '$350.00' },
  { id: 'INV-1044', status: 'Paid', method: 'Wire', amount: '$450.00' },
]

export const Hero: Story = {
  render: () => (
    <div className="w-full max-w-[520px] rounded-xl border border-line bg-surface">
      <Table>
        <TableCaption>Recent invoices</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="text-end">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">{invoice.id}</TableCell>
              <TableCell>
                <Badge>{invoice.status}</Badge>
              </TableCell>
              <TableCell>{invoice.method}</TableCell>
              <TableCell className="text-end tabular-nums">{invoice.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
}

export const WithFooter: Story = {
  render: () => (
    <div className="w-full max-w-[520px] rounded-xl border border-line bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead className="text-end">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>{invoice.id}</TableCell>
              <TableCell className="text-end tabular-nums">{invoice.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
            <TableCell className="text-end tabular-nums">$1,200.00</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  ),
}

export const SelectedRow: Story = {
  render: () => (
    <div className="w-full max-w-[520px] rounded-xl border border-line bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice, i) => (
            <TableRow key={invoice.id} data-state={i === 1 ? 'selected' : undefined}>
              <TableCell>{invoice.id}</TableCell>
              <TableCell>{invoice.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
}

const DEPLOY_STATUS = {
  ready: { label: 'Ready', variant: 'success' },
  building: { label: 'Building', variant: 'warning' },
  canceled: { label: 'Canceled', variant: 'secondary' },
  failed: { label: 'Failed', variant: 'danger' },
} as const

const deploys = [
  { id: 'DP-7712', author: 'Noor Haddad', branch: 'main', status: 'ready', duration: '1m 42s' },
  { id: 'DP-7711', author: 'Tomás Reyes', branch: 'feat/search-index', status: 'building', duration: '0m 58s' },
  { id: 'DP-7710', author: 'Wen Li', branch: 'fix/token-refresh', status: 'ready', duration: '2m 07s' },
  { id: 'DP-7709', author: 'Ada Okoye', branch: 'chore/deps', status: 'canceled', duration: '0m 12s' },
  { id: 'DP-7708', author: 'Noor Haddad', branch: 'feat/billing-export', status: 'failed', duration: '3m 31s' },
] as const

function RowMenu({ label }: { label: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="icon-xs" aria-label={label} />}>
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>View logs</DropdownMenuItem>
        <DropdownMenuItem>Redeploy</DropdownMenuItem>
        <DropdownMenuItem variant="danger">Cancel</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * A deployments panel composed from the parts: a Card panel whose head is a toolbar (title, search, a New
 * button, a menu), status Badges with a dot, avatar-initial cells, a menu per row, and paging with gaps.
 * Search filters the rows on this page; the pager keeps its width while you page.
 */
export const ToolbarAndPaging: Story = {
  render: function Render() {
    const [query, setQuery] = useState('')
    const [page, setPage] = useState(1)
    const pageCount = 42
    const rows = deploys.filter((d) => `${d.id} ${d.author} ${d.branch}`.toLowerCase().includes(query.trim().toLowerCase()))
    const go = (next: number) => (event: MouseEvent) => {
      event.preventDefault()
      setPage(Math.min(Math.max(next, 1), pageCount))
    }
    return (
      <Card variant="panel" className="w-full max-w-[760px]">
        <CardHeader>
          <CardTitle>Deployments</CardTitle>
          <CardAction>
            <InputGroup className="w-48">
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput aria-label="Search deployments" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </InputGroup>
            <Button size="sm" variant="outline">
              <PlusIcon />
              New deploy
            </Button>
            <RowMenu label="Deployment list options" />
          </CardAction>
        </CardHeader>
        <CardContent className="px-0 py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-4">ID</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-end">Duration</TableHead>
                <TableHead className="w-12 pe-4">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((d) => {
                const status = DEPLOY_STATUS[d.status]
                return (
                  <TableRow key={d.id}>
                    <TableCell className="ps-4 font-mono text-ui-sm text-fg-muted">{d.id}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <Avatar size="sm">
                          <AvatarFallback>{initials(d.author)}</AvatarFallback>
                        </Avatar>
                        {d.author}
                      </span>
                    </TableCell>
                    <TableCell className="text-fg-muted">{d.branch}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>
                        <BadgeDot />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end font-mono tabular-nums">{d.duration}</TableCell>
                    <TableCell className="pe-4 text-end">
                      <RowMenu label={`Actions for ${d.id}`} />
                    </TableCell>
                  </TableRow>
                )
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-fg-muted">
                    No deployments match “{query}” on this page.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-2.5">
            <span className="text-ui-sm text-fg-muted">Showing {rows.length} of 208 deployments</span>
            <Pagination aria-label="Deployment pages" className="mx-0 w-auto">
              <PaginationContent>
                {paginationRange(page, pageCount).map((item) =>
                  typeof item === 'number' ? (
                    <PaginationItem key={item}>
                      <PaginationLink href={`?page=${item}`} isActive={item === page} aria-label={`Page ${item}`} onClick={go(item)}>
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext href={`?page=${page + 1}`} disabled={page === pageCount} onClick={go(page + 1)} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    )
  },
}

export const ScrollsWhenNarrow: Story = {
  render: () => (
    <div className="w-[280px] rounded-xl border border-line bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="text-end">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>{invoice.id}</TableCell>
              <TableCell>{invoice.status}</TableCell>
              <TableCell>{invoice.method}</TableCell>
              <TableCell className="text-end tabular-nums">{invoice.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
}
