import { render, screen } from '@testing-library/react'
import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area'
import { ScrollArea, ScrollBar } from './scroll-area'

describe('ScrollArea', () => {
  test('a labelled scroll area names its viewport, the tab stop, as a region', () => {
    render(
      <ScrollArea aria-label="Activity" className="h-40">
        <p>First entry</p>
      </ScrollArea>,
    )
    const region = screen.getByRole('region', { name: 'Activity' })
    expect(region).toHaveAttribute('data-slot', 'scroll-area-viewport')
    expect(region).toHaveTextContent('First entry')
    // The root, a plain div, carries no ARIA of its own.
    expect(region.closest('[data-slot=scroll-area]')).not.toHaveAttribute('aria-label')
  })

  test('aria-labelledby is routed to the viewport too', () => {
    render(
      <>
        <h2 id="log-title">Build log</h2>
        <ScrollArea aria-labelledby="log-title">
          <pre>…</pre>
        </ScrollArea>
      </>,
    )
    expect(screen.getByRole('region', { name: 'Build log' })).toBeInTheDocument()
  })

  test('an unlabelled scroll area adds no landmark', () => {
    render(
      <ScrollArea>
        <p>Plain</p>
      </ScrollArea>,
    )
    expect(screen.queryByRole('region')).not.toBeInTheDocument()
    expect(document.querySelector('[data-slot=scroll-area-viewport]')).toHaveTextContent('Plain')
  })

  test('the root draws the viewport\'s focus ring, so the edge fade cannot hide it', () => {
    render(
      <ScrollArea aria-label="Feed">
        <p>Item</p>
      </ScrollArea>,
    )
    const root = document.querySelector('[data-slot=scroll-area]')!
    expect(root.className).toContain('own:[&:has(>[data-slot=scroll-area-viewport]:focus-visible)]:outline-2')
    expect(screen.getByRole('region')).toHaveClass('outline-none')
  })

  test('the thumb uses the scrollbar tokens native bars share, and widens by a clip rather than a resize', () => {
    render(
      <ScrollAreaPrimitive.Root>
        <ScrollAreaPrimitive.Viewport />
        <ScrollBar keepMounted />
      </ScrollAreaPrimitive.Root>,
    )
    const thumb = document.querySelector('[data-slot=scroll-area-thumb]')!
    const classes = thumb.className.split(/\s+/)
    // Quiet while the bar shows, the 3:1 boundary with the pointer on the bar, firmest on the thumb.
    expect(classes).toContain('bg-(--ui-scrollbar-thumb)')
    expect(classes).toContain('group-hover/scrollbar:bg-(--ui-scrollbar-thumb-hover)')
    expect(classes).toContain('hover:bg-(--ui-scrollbar-thumb-active)')
    expect(thumb.className).toContain('[clip-path:inset(1px_round_999px)]')
    expect(thumb.className).toContain('group-hover/scrollbar:[clip-path:inset(0_round_999px)]')
  })
})
