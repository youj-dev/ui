'use client'

import { useState, type MouseEvent } from 'react'
import {
  Avatar,
  AvatarFallback,
  Badge,
  BadgeDot,
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  paginationRange,
} from '@youj/react'
import { MoreHorizontalIcon, PlusIcon, SearchIcon } from '@youj/icons'

const STATUS = {
  ready: { label: 'Ready', variant: 'success' },
  building: { label: 'Building', variant: 'warning' },
  canceled: { label: 'Canceled', variant: 'secondary' },
  failed: { label: 'Failed', variant: 'danger' },
} as const

const DEPLOYS = [
  { id: 'DP-7712', author: 'Noor Haddad', branch: 'main', status: 'ready', duration: '1m 42s' },
  { id: 'DP-7711', author: 'Tomás Reyes', branch: 'feat/search-index', status: 'building', duration: '0m 58s' },
  { id: 'DP-7710', author: 'Wen Li', branch: 'fix/token-refresh', status: 'ready', duration: '2m 07s' },
  { id: 'DP-7709', author: 'Ada Okoye', branch: 'chore/deps', status: 'canceled', duration: '0m 12s' },
  { id: 'DP-7708', author: 'Noor Haddad', branch: 'feat/billing-export', status: 'failed', duration: '3m 31s' },
] as const

const PAGES = 42

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

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

export default function TableToolbar() {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const rows = DEPLOYS.filter((d) => `${d.id} ${d.author} ${d.branch}`.toLowerCase().includes(query.trim().toLowerCase()))
  const go = (next: number) => (event: MouseEvent) => {
    event.preventDefault()
    setPage(Math.min(Math.max(next, 1), PAGES))
  }
  return (
    <Card variant="panel" className="w-full max-w-3xl">
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
            {rows.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="ps-4 font-mono text-ui-sm text-fg-muted">{d.id}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <Avatar size="sm">
                      <AvatarFallback>{initialsOf(d.author)}</AvatarFallback>
                    </Avatar>
                    {d.author}
                  </span>
                </TableCell>
                <TableCell className="text-fg-muted">{d.branch}</TableCell>
                <TableCell>
                  <Badge variant={STATUS[d.status].variant}>
                    <BadgeDot />
                    {STATUS[d.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-end font-mono tabular-nums">{d.duration}</TableCell>
                <TableCell className="pe-4 text-end">
                  <RowMenu label={`Actions for ${d.id}`} />
                </TableCell>
              </TableRow>
            ))}
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
              {paginationRange(page, PAGES).map((item) =>
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
                <PaginationNext href={`?page=${page + 1}`} disabled={page === PAGES} onClick={go(page + 1)} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
    </Card>
  )
}
