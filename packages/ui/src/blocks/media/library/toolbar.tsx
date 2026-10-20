'use client'

import { FolderIcon, LayoutGridIcon, LayoutListIcon, SearchIcon, XIcon } from '@youj/icons'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../../../components/ui/breadcrumb'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '../../../components/ui/input-group'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '../../../components/ui/toggle-group'
import { cn } from '../../../lib/utils'
import type { MediaLibraryAsset, MediaLibraryCopy, MediaLibraryFilter, MediaLibraryFolder, MediaLibrarySort } from './data'

/* How to narrow the library: a search over names and descriptions (the
 * count of what it finds is read out), the file type, the order, grid or
 * list; under it where you are (All media › a folder) and the folders, each
 * with how many files it holds. */

interface ToolbarProps {
  copy: MediaLibraryCopy
  query: string
  onQuery: (query: string) => void
  filter: MediaLibraryFilter
  onFilter: (filter: MediaLibraryFilter) => void
  kinds: MediaLibraryFilter[]
  sort: MediaLibrarySort
  onSort: (sort: MediaLibrarySort) => void
  view: 'grid' | 'list'
  onView: (view: 'grid' | 'list') => void
  folders: MediaLibraryFolder[]
  folder: string | null
  onFolder: (folder: string | null) => void
  items: MediaLibraryAsset[]
}

export function Toolbar({
  copy,
  query,
  onQuery,
  filter,
  onFilter,
  kinds,
  sort,
  onSort,
  view,
  onView,
  folders,
  folder,
  onFolder,
  items,
}: ToolbarProps) {
  const open = folders.find((f) => f.id === folder)
  const sorts = Object.entries(copy.sorts).map(([value, label]) => ({ value, label }))
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="min-w-48 flex-1">
          <InputGroupAddon>
            <SearchIcon size={15} />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            aria-label={copy.searchLabel}
            placeholder={copy.search}
            value={query}
            onChange={(event) => onQuery(event.target.value)}
          />
          {query && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" aria-label={copy.clearSearch} onClick={() => onQuery('')}>
                <XIcon />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
        {kinds.length > 2 && (
          <SegmentedControl variant="pill" size="sm" aria-label={copy.filter} value={filter} onValueChange={(v) => onFilter(v as MediaLibraryFilter)}>
            {kinds.map((kind) => (
              <SegmentedControlItem key={kind} value={kind} className="px-2.5">
                {copy.filters[kind]}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        )}
        <Select items={sorts} value={sort} onValueChange={(v) => v && onSort(v as MediaLibrarySort)}>
          <SelectTrigger size="sm" aria-label={copy.sort} className="w-28">
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
        <ToggleGroup
          variant="segmented"
          size="sm"
          aria-label={copy.view}
          value={[view]}
          onValueChange={(next: unknown[]) => next[0] && onView(next[0] as 'grid' | 'list')}
        >
          <ToggleGroupItem value="grid" aria-label={copy.grid} className="px-2">
            <LayoutGridIcon size={15} />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label={copy.list} className="px-2">
            <LayoutListIcon size={15} />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      {/* As tall with the folders as with the breadcrumb alone, so opening a folder moves nothing. */}
      <div className="flex min-h-control-xs flex-wrap items-center gap-x-4 gap-y-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              {open ? (
                <BreadcrumbLink render={<button type="button" onClick={() => onFolder(null)} />}>{copy.root}</BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{copy.root}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {open && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{open.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
        {!open && folders.length > 0 && (
          <nav aria-label={copy.folders} className="flex flex-wrap gap-1.5">
            {folders.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onFolder(f.id)}
                className={cn(
                  'flex h-control-xs items-center gap-1.5 rounded-full border border-line bg-surface ps-2 pe-2.5 text-ui-sm text-fg',
                  'transition-colors yj-duration-fast ease-standard hover:bg-hover focus-ring',
                )}
              >
                <FolderIcon size={13} className="text-fg-muted" />
                {f.name}
                <span className="text-fg-subtle tabular-nums">{copy.inFolder(items.filter((a) => a.folder === f.id).length)}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  )
}
