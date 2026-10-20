'use client'

import { Fragment } from 'react'
import { LayoutGridIcon, LayoutListIcon, MenuIcon } from '@youj/icons'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../../../components/ui/breadcrumb'
import { Button } from '../../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '../../../components/ui/toggle-group'
import { cn } from '../../../lib/utils'
import { useFileManager } from './context'

export function Toolbar({
  mobile,
  crumbs,
  sort,
  onSort,
  view,
  onView,
  onFolder,
  onFolders,
  home,
}: {
  mobile: boolean
  crumbs: string[]
  sort: string
  onSort: (sort: string) => void
  view: 'grid' | 'list'
  onView: (view: 'grid' | 'list') => void
  onFolder: (id: string) => void
  onFolders: () => void
  /** The folder the brand crumb opens. */
  home: string
}) {
  const { copy, brand, names } = useFileManager()
  const sorts = [
    { value: 'modified', label: copy.sortModified },
    { value: 'name', label: copy.sortName },
    { value: 'size', label: copy.sortSize },
  ]
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
      {mobile && (
        <Button variant="ghost" size="icon-sm" aria-label={copy.folders} onClick={onFolders}>
          <MenuIcon size={16} />
        </Button>
      )}
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList>
          <BreadcrumbItem className="max-sm:hidden">
            <BreadcrumbLink render={<button type="button" onClick={() => onFolder(home)} />}>{brand.name}</BreadcrumbLink>
          </BreadcrumbItem>
          {crumbs.map((id, i) => (
            <Fragment key={id}>
              <BreadcrumbSeparator className="max-sm:hidden" />
              <BreadcrumbItem className={cn(i < crumbs.length - 1 && 'max-sm:hidden')}>
                {i === crumbs.length - 1 ? (
                  <BreadcrumbPage>{names[id]}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<button type="button" onClick={() => onFolder(id)} />}>{names[id]}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <Select items={sorts} value={sort} onValueChange={(v) => onSort(v as string)}>
        <SelectTrigger size="sm" aria-label={copy.sortBy} className="w-36 max-sm:w-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sorts.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ToggleGroup variant="segmented" size="sm" aria-label={copy.view} value={[view]} onValueChange={(next: unknown[]) => next[0] && onView(next[0] as 'grid' | 'list')}>
        <ToggleGroupItem value="grid" aria-label={copy.grid} className="px-2">
          <LayoutGridIcon size={15} />
        </ToggleGroupItem>
        <ToggleGroupItem value="list" aria-label={copy.list} className="px-2">
          <LayoutListIcon size={15} />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
