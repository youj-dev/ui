'use client'

import { useState } from 'react'
import { ArrowRightIcon, SearchIcon, TrendingUpIcon } from '@youj/icons'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../../components/ui/command'
import { Sheet, SheetContent, SheetTitle } from '../../../components/ui/sheet'
import type { NavbarStoreCopy, NavbarStoreProduct, NavbarStoreSearchResult } from './data'

/* The store's search drops from the top as a floating panel (a bottom sheet
 * on touch), its field focused: before a word is typed it offers popular
 * searches and the products of the moment; as you type, the products narrow
 * to those that match, each with its picture and price in the region's
 * currency, and the first row opens every result for the words. Arrow keys
 * move, Enter picks, Escape closes and returns to the search button. */

interface StoreSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: NavbarStoreProduct[]
  popular: string[]
  /** A price in the region's currency. */
  price: (value: number) => string
  /** The results page for a query. */
  resultsHref: (query: string) => string
  onSelect: (result: NavbarStoreSearchResult) => void
  copy: NavbarStoreCopy
}

export function StoreSearch({ open, onOpenChange, products, popular, price, resultsHref, onSelect, copy }: StoreSearchProps) {
  const [query, setQuery] = useState('')
  const change = (next: boolean) => {
    if (!next) setQuery('')
    onOpenChange(next)
  }
  const choose = (result: NavbarStoreSearchResult) => {
    change(false)
    onSelect(result)
  }
  const words = query.trim()
  return (
    <Sheet open={open} onOpenChange={change}>
      <SheetContent side="top" variant="floating" showCloseButton={false} data-slot="navbar-store-search" className="max-w-xl gap-0 p-0">
        <SheetTitle className="sr-only">{copy.searchLabel}</SheetTitle>
        <Command label={copy.searchLabel} className="bg-transparent">
          <CommandInput value={query} onValueChange={setQuery} placeholder={copy.searchPlaceholder} autoFocus />
          <CommandList className="max-h-[min(--spacing(112),60dvh)] p-1.5">
            <CommandEmpty>{copy.noResults}</CommandEmpty>
            {words && (
              <CommandGroup forceMount>
                <CommandItem forceMount value={`all ${words}`} onSelect={() => choose({ kind: 'query', query: words, href: resultsHref(words) })}>
                  <SearchIcon size={16} />
                  <span className="min-w-0 truncate">{copy.allResults(words)}</span>
                  <ArrowRightIcon size={14} className="ms-auto rtl:-scale-x-100" />
                </CommandItem>
              </CommandGroup>
            )}
            {!words && popular.length > 0 && (
              <CommandGroup heading={copy.popular}>
                {popular.map((term) => (
                  <CommandItem key={term} value={`popular ${term}`} onSelect={() => setQuery(term)}>
                    <TrendingUpIcon size={16} />
                    {term}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandGroup heading={copy.products}>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={`${product.name} ${product.category ?? ''} ${product.id}`}
                  onSelect={() => choose({ kind: 'product', product, href: product.href })}
                  className="min-h-14 gap-3 py-1.5"
                >
                  <span aria-hidden className="size-10 shrink-0 overflow-hidden rounded-md border border-line">
                    {product.media}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{product.name}</span>
                    {product.category && <span className="truncate text-ui-sm text-fg-muted">{product.category}</span>}
                  </span>
                  <span className="ms-auto ps-3 tabular-nums">{price(product.price)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </SheetContent>
    </Sheet>
  )
}
