'use client'

import { useMemo } from 'react'
import type { RowData } from '@tanstack/react-table'
import { ChevronLeftIcon } from '@youj/icons/components/youj/icons/chevron-left'
import { ChevronRightIcon } from '@youj/icons/components/youj/icons/chevron-right'
import { ChevronsLeftIcon } from '@youj/icons/components/youj/icons/chevrons-left'
import { ChevronsRightIcon } from '@youj/icons/components/youj/icons/chevrons-right'
import { useLocale } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/labels'
import { dataTablePaginationLabels } from '@youj/core/labels'
import { cn, numberFormat } from '../../../lib/utils'
import { Button } from '../button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select'
import type { DataTableInstance } from './data-table-model'

export interface DataTablePaginationProps<TData extends RowData = any> {
  /** The table to page: its page, page count, row count and setters. Or pass the values below yourself. */
  table?: DataTableInstance<TData>
  pageIndex?: number
  pageSize?: number
  pageCount?: number
  /** Rows behind every page: the range line's total. */
  rowCount?: number
  /** The rows-per-page choices. Default 10, 25, 50 and 100. */
  pageSizeOptions?: readonly number[]
  onPageChange?: (pageIndex: number) => void
  onPageSizeChange?: (pageSize: number) => void
  /** What the rows are, for the range line: "orders". */
  noun?: string
  className?: string
}

/** A marker the labels place a number at, so the page can style that number on its own. */
const SLOT = '\u0000'
const PAGE_SIZES = [10, 25, 50, 100] as const

/**
 * The footer strip: the range in view, rows per page, and page steps. Give
 * it a TanStack `table` (with `dataTableFeatures`), or the values and the two
 * setters. The step buttons stay focusable at the ends (disabled, not
 * removed), so a keyboard user stepping to the last page is not dropped onto
 * the page.
 */
export function DataTablePagination<TData extends RowData = any>({
  table,
  pageIndex = table?.atoms.pagination?.get()?.pageIndex ?? 0,
  pageSize = table?.atoms.pagination?.get()?.pageSize ?? 10,
  pageCount = table?.getPageCount() ?? 1,
  rowCount = table?.getRowCount() ?? 0,
  pageSizeOptions = PAGE_SIZES,
  onPageChange = (index) => table?.setPageIndex(index),
  onPageSizeChange = (size) => table?.setPageSize(size),
  noun,
  className,
}: DataTablePaginationProps<TData>) {
  const locale = useLocale()
  const labels = useComponentLabels(dataTablePaginationLabels)
  noun ??= labels.rowsNoun
  const number = useMemo(() => numberFormat(locale), [locale])
  const first = rowCount === 0 ? 0 : pageIndex * pageSize + 1
  const last = Math.min(rowCount, (pageIndex + 1) * pageSize)
  const pages = Math.max(1, pageCount)
  const canPrev = pageIndex > 0
  const canNext = pageIndex < pages - 1
  const sizes = pageSizeOptions.includes(pageSize) ? pageSizeOptions : [...pageSizeOptions, pageSize].sort((a, b) => a - b)
  const items = Object.fromEntries(sizes.map((size) => [String(size), String(size)]))
  // The labels place the numbers; the emphasized one is cut back in where its slot lands.
  const [rangeBefore, rangeAfter = ''] = labels.rangeOf(SLOT, number.format(rowCount), noun).split(SLOT)
  const [pageBefore, pageAfter = ''] = labels.pageOf(SLOT, number.format(pages)).split(SLOT)

  return (
    <div
      data-slot="data-table-pagination"
      className={cn('own:flex flex-wrap items-center justify-between gap-x-6 gap-y-2 own:px-3 own:py-2 own:text-ui-sm own:text-fg-muted', className)}
    >
      <p className="own:tabular-nums">
        {rowCount === 0 ? (
          labels.noItems(noun)
        ) : (
          <>
            {rangeBefore}
            <span className="own:text-fg">
              {number.format(first)}–{number.format(last)}
            </span>
            {rangeAfter}
          </>
        )}
      </p>
      <div className="own:flex items-center gap-x-5 gap-y-2">
        <div className="own:flex items-center gap-2">
          <span aria-hidden className="own:hidden own:sm:inline">
            {labels.rowsPerPage}
          </span>
          <Select items={items} value={String(pageSize)} onValueChange={(value) => value && onPageSizeChange(Number(value))}>
            <SelectTrigger size="sm" aria-label={labels.rowsPerPage} className="min-w-16 own:tabular-nums">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sizes.map((size) => (
                <SelectItem key={size} value={String(size)} className="own:tabular-nums">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="own:tabular-nums">
          {pageBefore}
          <span className="own:text-fg">{number.format(pageIndex + 1)}</span>
          {pageAfter}
        </span>
        <nav aria-label={labels.pagination} className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon-sm" aria-label={labels.firstPage} disabled={!canPrev} focusableWhenDisabled onClick={() => onPageChange(0)}>
            <ChevronsLeftIcon className="rtl:-scale-x-100" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={labels.previousPage}
            disabled={!canPrev}
            focusableWhenDisabled
            onClick={() => onPageChange(pageIndex - 1)}
          >
            <ChevronLeftIcon trigger="none" className="rtl:-scale-x-100" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={labels.nextPage}
            disabled={!canNext}
            focusableWhenDisabled
            onClick={() => onPageChange(pageIndex + 1)}
          >
            <ChevronRightIcon trigger="none" className="rtl:-scale-x-100" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={labels.lastPage}
            disabled={!canNext}
            focusableWhenDisabled
            onClick={() => onPageChange(pages - 1)}
          >
            <ChevronsRightIcon className="rtl:-scale-x-100" />
          </Button>
        </nav>
      </div>
    </div>
  )
}
