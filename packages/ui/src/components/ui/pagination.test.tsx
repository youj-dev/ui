import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  paginationRange,
} from './pagination'

function Pager({ pageCount = 20, initial = 1 }: { pageCount?: number; initial?: number }) {
  const [page, setPage] = useState(initial)
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#prev"
            disabled={page === 1}
            onClick={(e) => {
              e.preventDefault()
              setPage(page - 1)
            }}
          />
        </PaginationItem>
        {paginationRange(page, pageCount).map((item) =>
          typeof item === 'number' ? (
            <PaginationItem key={item}>
              <PaginationLink
                href={`#${item}`}
                isActive={item === page}
                aria-label={`Page ${item}`}
                onClick={(e) => {
                  e.preventDefault()
                  setPage(item)
                }}
              >
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
          <PaginationNext
            href="#next"
            disabled={page === pageCount}
            onClick={(e) => {
              e.preventDefault()
              setPage(page + 1)
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

describe('Pagination', () => {
  test('a named nav of real links; the current page is marked', () => {
    render(<Pager initial={3} />)
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument()
    const current = screen.getByRole('link', { name: 'Page 3' })
    expect(current).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Page 4' })).not.toHaveAttribute('aria-current')
    // Links, not buttons: pagination navigates.
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  test('the edges are disabled links: no href, aria-disabled, but still focusable', async () => {
    const user = userEvent.setup()
    render(<Pager initial={1} />)
    const previous = screen.getByRole('link', { name: 'Go to previous page' })
    expect(previous).not.toHaveAttribute('href')
    expect(previous).toHaveAttribute('aria-disabled', 'true')
    await user.tab()
    expect(previous).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Page 1' })).toHaveFocus()
  })

  test('paging onto the last page with Enter keeps focus on Next, which then does nothing', async () => {
    const user = userEvent.setup()
    render(<Pager pageCount={3} initial={2} />)
    const next = screen.getByRole('link', { name: 'Go to next page' })
    next.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('link', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page')
    expect(next).toHaveAttribute('aria-disabled', 'true')
    expect(next).toHaveFocus()
    await user.keyboard('{Enter}')
    // Assistive tech activates with a synthetic click.
    fireEvent.click(next)
    expect(screen.getByRole('link', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page')
  })

  test('keyboard paging: Tab to a page and press Enter', async () => {
    const user = userEvent.setup()
    render(<Pager initial={1} />)
    await user.tab()
    await user.tab()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Page 2' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('link', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByLabelText('Go to previous page')).toHaveAttribute('href', '#prev')
  })

  test('the raised key is one decorative indicator; ellipses are hidden', () => {
    render(<Pager initial={10} />)
    const nav = screen.getByRole('navigation')
    const indicators = nav.querySelectorAll('[data-slot=pagination-indicator]')
    expect(indicators).toHaveLength(1)
    expect(indicators[0]).toHaveAttribute('aria-hidden', 'true')
    for (const gap of nav.querySelectorAll('[data-slot=pagination-ellipsis]')) expect(gap).toHaveAttribute('aria-hidden', 'true')
  })

  test('links mark themselves for reduced motion (no press scale)', () => {
    render(
      <YoujProvider reducedMotion="always">
        <Pager />
      </YoujProvider>,
    )
    expect(screen.getByRole('link', { name: 'Page 2' })).toHaveAttribute('data-reduced-motion')
  })
})

describe('paginationRange', () => {
  test('shows every page when they fit', () => {
    expect(paginationRange(2, 5)).toEqual([1, 2, 3, 4, 5])
    expect(paginationRange(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  test('keeps the first and last pages and a sibling either side of the current one', () => {
    expect(paginationRange(1, 20)).toEqual([1, 2, 3, 4, 5, 'end-ellipsis', 20])
    expect(paginationRange(10, 20)).toEqual([1, 'start-ellipsis', 9, 10, 11, 'end-ellipsis', 20])
    expect(paginationRange(20, 20)).toEqual([1, 'start-ellipsis', 16, 17, 18, 19, 20])
    expect(paginationRange(120, 240, 2)).toEqual([1, 'start-ellipsis', 118, 119, 120, 121, 122, 'end-ellipsis', 240])
  })

  test('always returns the same number of slots, so the control keeps its width', () => {
    for (let page = 1; page <= 30; page++) expect(paginationRange(page, 30)).toHaveLength(7)
    for (let page = 1; page <= 30; page++) expect(paginationRange(page, 30, 2)).toHaveLength(9)
  })

  test('clamps an out-of-range page', () => {
    expect(paginationRange(0, 20)).toEqual(paginationRange(1, 20))
    expect(paginationRange(99, 20)).toEqual(paginationRange(20, 20))
  })
})
