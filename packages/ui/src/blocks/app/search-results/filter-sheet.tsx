'use client'

import { Button } from '../../../components/ui/button'
import { Sheet, SheetBody, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '../../../components/ui/sheet'
import { useSearchConfig } from './copy'
import { Facets } from './facets'
import type { FacetCounts, SearchState } from './model'

/* The facets on small screens: a bottom Sheet with the same panel, Clear
 * all, and a button that closes it on the results it would show. */

interface FilterSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  state: SearchState
  counts: FacetCounts
  base: FacetCounts
  total: number
  filters: number
  onChange: (patch: Partial<SearchState>) => void
  onClear: () => void
}

export function FilterSheet({ open, onOpenChange, state, counts, base, total, filters, onChange, onClear }: FilterSheetProps) {
  const { copy } = useSearchConfig()
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh]">
        <SheetHeader>
          <SheetTitle>{copy.filters}</SheetTitle>
          <SheetDescription>{state.q ? copy.sheetDescription(total, state.q) : copy.sheetEmpty}</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <Facets state={state} counts={counts} base={base} onChange={onChange} />
        </SheetBody>
        <SheetFooter className="flex-row">
          <Button variant="ghost" onClick={onClear} disabled={!filters} className="me-auto">
            {copy.clearAll}
          </Button>
          <SheetClose render={<Button />}>{copy.showResults(total)}</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
