import { forwardRef } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { graphite } from '@youj/core'
import type { Product } from './product-card'
import { ProductGrid } from './product-grid'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

const make = (id: string, category: string, price: number, extra: Partial<Product> = {}): Product => ({
  id,
  name: id,
  category,
  price,
  rating: 4,
  reviews: 1,
  image: `/${id}.webp`,
  colors: [{ id: 'one', name: 'Chalk', swatch: 'var(--color-band)' }],
  description: `About ${id}.`,
  ...extra,
})
const BOWL = make('Bowl', 'Tableware', 30)
const VASE = make('Vase', 'Home', 90, {
  colors: [
    { id: 'clay', name: 'Clay', swatch: 'var(--color-band)' },
    { id: 'ink', name: 'Ink', swatch: 'var(--color-fg)', image: '/vase-ink.webp' },
  ],
})
const CUP = make('Cup', 'Tableware', 12, { sizes: ['S', 'L'], soldOut: ['S'] })
const PRODUCTS = [BOWL, VASE, CUP]
const names = () => screen.getAllByRole('article').map((a) => within(a).getByRole('heading').textContent)

describe('ProductGrid', () => {
  test('the demo is the photographed shop, with the vases on a wide tile in the Featured order', () => {
    reduced(<ProductGrid />)
    expect(screen.getByRole('heading', { level: 1, name: 'Kitchen & table' })).toBeInTheDocument()
    expect(names()).toEqual(['Bud Vases, set of three', 'Ridge Kettle', 'Ritual Tea Set', 'Hearth Kettle', 'Daily Mug'])
    expect(screen.getAllByRole('article')[0]!.closest('li')).toHaveClass('col-span-2')
    expect(screen.getByText('5 products')).toHaveAttribute('role', 'status')
  })

  test('your products, copy and heading level drive the section; a sort other than Featured keeps every tile the same', () => {
    reduced(
      <ProductGrid
        products={PRODUCTS}
        featured="Bowl"
        defaultSort="price-asc"
        headingLevel={2}
        copy={{ title: 'Ceramics', count: (n) => `${n} pieces` }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Ceramics' })).toBeInTheDocument()
    expect(screen.getByText('3 pieces')).toBeInTheDocument()
    expect(names()).toEqual(['Cup', 'Bowl', 'Vase'])
    expect(document.querySelector('li.col-span-2')).toBeNull()
  })

  test('category tabs carry live counts, filter the grid and report the pick', async () => {
    const user = userEvent.setup()
    const onCategoryChange = vi.fn()
    reduced(<ProductGrid products={PRODUCTS} onCategoryChange={onCategoryChange} />)
    const tabs = screen.getByRole('group', { name: 'Categories' })
    expect(
      within(tabs)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['All3', 'Tableware2', 'Home1'])
    await user.click(within(tabs).getByRole('button', { name: /Tableware/ }))
    expect(onCategoryChange).toHaveBeenCalledWith('Tableware')
    await waitFor(() => expect(names()).toEqual(['Bowl', 'Cup']))
    expect(screen.getByText('2 products')).toBeInTheDocument()
  })

  test('controlled sort reports changes and follows the prop', async () => {
    const user = userEvent.setup()
    const onSortChange = vi.fn()
    const { rerender } = reduced(<ProductGrid products={PRODUCTS} sort="featured" onSortChange={onSortChange} />)
    await user.click(screen.getByRole('combobox', { name: 'Sort by' }))
    await user.click(await screen.findByRole('option', { name: 'Price: high to low' }))
    expect(onSortChange).toHaveBeenCalledWith('price-desc')
    expect(names()).toEqual(['Bowl', 'Vase', 'Cup'])
    rerender(
      <YoujProvider reducedMotion="always">
        <ProductGrid products={PRODUCTS} sort="price-desc" onSortChange={onSortChange} />
      </YoujProvider>,
    )
    expect(names()).toEqual(['Vase', 'Bowl', 'Cup'])
  })

  test('a heart saves a product (a pressed toggle, announced), and the Saved view shows only those', async () => {
    const user = userEvent.setup()
    const onSavedChange = vi.fn()
    reduced(<ProductGrid products={PRODUCTS} onSavedChange={onSavedChange} />)
    const heart = screen.getByRole('button', { name: 'Save Vase' })
    expect(heart).toHaveAttribute('aria-pressed', 'false')
    await user.click(heart)
    expect(onSavedChange).toHaveBeenLastCalledWith(['Vase'])
    expect(heart).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Vase saved')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Saved/ }))
    await waitFor(() => expect(names()).toEqual(['Vase']))
    await user.click(screen.getByRole('button', { name: 'Save Vase' }))
    expect(onSavedChange).toHaveBeenLastCalledWith([])
    expect(await screen.findByText('Nothing saved yet')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Show everything' }))
    await waitFor(() => expect(names()).toHaveLength(3))
  })

  test('filters: a color narrows the grid, leads its products with the colorway that matched, and is a chip you can remove', async () => {
    const user = userEvent.setup()
    const onColorsChange = vi.fn()
    reduced(<ProductGrid products={PRODUCTS} onColorsChange={onColorsChange} />)
    await user.click(screen.getByRole('button', { name: 'Filters' }))
    await user.click(await screen.findByRole('checkbox', { name: /Ink/ }))
    expect(onColorsChange).toHaveBeenLastCalledWith(['Ink'])
    await waitFor(() => expect(names()).toEqual(['Vase']))
    expect(screen.getByRole('button', { name: 'Filters, 1 set' })).toBeInTheDocument()
    expect(screen.getAllByRole('article')[0]!.querySelector('img')).toHaveAttribute('src', '/vase-ink.webp')
    await user.keyboard('{Escape}')
    const chip = screen.getByRole('button', { name: 'Remove Ink' })
    await user.click(chip)
    expect(onColorsChange).toHaveBeenLastCalledWith([])
    await waitFor(() => expect(names()).toHaveLength(3))
    expect(screen.getByText('3 products')).toHaveFocus()
  })

  test('a controlled price range narrows the grid and shows as a chip; the top of the range means "and up"', async () => {
    const user = userEvent.setup()
    const onPriceChange = vi.fn()
    reduced(<ProductGrid products={PRODUCTS} price={[20, 90]} priceMax={90} onPriceChange={onPriceChange} />)
    expect(names()).toEqual(['Bowl', 'Vase'])
    await user.click(screen.getByRole('button', { name: 'Remove $20 – $90+' }))
    expect(onPriceChange).toHaveBeenLastCalledWith([0, 90])
  })

  test('quick view opens on the product, steps with the arrow keys, adds with the chosen size and hands focus back', async () => {
    const user = userEvent.setup()
    const onQuickViewChange = vi.fn()
    const onAdd = vi.fn(async () => {})
    reduced(<ProductGrid products={PRODUCTS} onQuickViewChange={onQuickViewChange} onAdd={onAdd} />)
    const trigger = screen.getByRole('button', { name: 'Quick view: Vase' })
    await user.click(trigger)
    expect(onQuickViewChange).toHaveBeenLastCalledWith('Vase')
    const dialog = await screen.findByRole('dialog', { name: 'Vase' })
    expect(within(dialog).getByText('2 of 3')).toBeInTheDocument()
    await user.keyboard('{ArrowRight}')
    expect(onQuickViewChange).toHaveBeenLastCalledWith('Cup')
    expect(await screen.findByRole('dialog', { name: 'Cup' })).toBeInTheDocument()
    const cup = screen.getByRole('dialog')
    expect(within(cup).getByRole('radio', { name: 'S, sold out' })).toBeDisabled()
    expect(within(cup).getByRole('radio', { name: 'L' })).toBeChecked()
    await user.click(within(cup).getByRole('button', { name: 'Add to bag' }))
    expect(onAdd).toHaveBeenCalledWith(CUP, { color: 'one', size: 'L' })
    await user.click(within(cup).getByRole('button', { name: 'Previous product' }))
    expect(onQuickViewChange).toHaveBeenLastCalledWith('Vase')
    await user.keyboard('{Escape}')
    expect(onQuickViewChange).toHaveBeenLastCalledWith(null)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  test('quick view saves through the same state as the tile', async () => {
    const user = userEvent.setup()
    reduced(<ProductGrid products={PRODUCTS} defaultQuickView="Bowl" />)
    const dialog = await screen.findByRole('dialog', { name: 'Bowl' })
    await user.click(within(dialog).getByRole('button', { name: 'Save Bowl' }))
    expect(within(dialog).getByRole('button', { name: 'Save Bowl' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('under motion the photo flies out of its tile; under reduced motion it never does', async () => {
    const animate = vi.fn(() => ({ finished: new Promise(() => {}), cancel: vi.fn(), reverse: vi.fn(), playState: 'running' }))
    const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 200, 250))
    HTMLElement.prototype.animate = animate as unknown as HTMLElement['animate']
    try {
      const { unmount } = reduced(<ProductGrid products={PRODUCTS} defaultQuickView="Bowl" />)
      await screen.findByRole('dialog', { name: 'Bowl' })
      expect(animate).not.toHaveBeenCalled()
      unmount()
      render(
        <YoujProvider reducedMotion="never" device="pointer">
          <ProductGrid products={PRODUCTS} defaultQuickView="Bowl" />
        </YoujProvider>,
      )
      await screen.findByRole('dialog', { name: 'Bowl' })
      const slot = document.querySelector('[data-slot=quick-view-media]')
      expect(animate.mock.contexts).toContain(slot)
      const [frames] = animate.mock.calls.find((_, i) => animate.mock.contexts[i] === slot) as unknown as [Keyframe[]]
      expect(frames[0]).toMatchObject({ transform: expect.stringContaining('scale(') })
      expect(frames[1]).toMatchObject({ transform: 'none' })
    } finally {
      rect.mockRestore()
      delete (HTMLElement.prototype as { animate?: unknown }).animate
    }
  })

  test('a long catalog shows a page at a time with its progress', async () => {
    const user = userEvent.setup()
    reduced(<ProductGrid products={PRODUCTS} pageSize={2} featured={null} />)
    expect(names()).toHaveLength(2)
    expect(screen.getByText('Showing 2 of 3')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Load more' }))
    await waitFor(() => expect(names()).toHaveLength(3))
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument()
    // Focus carries on at the first product it brought.
    expect(screen.getByRole('link', { name: 'Cup' })).toHaveFocus()
  })

  test('loading keeps the shape and says so; an error offers a retry; the empty slot replaces "no matches"', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const { unmount } = reduced(<ProductGrid products={PRODUCTS} loading />)
    expect(screen.getByText('Loading products')).toHaveAttribute('role', 'status')
    expect(screen.queryByRole('list', { name: 'Products' })).not.toBeInTheDocument()
    unmount()
    const errored = reduced(<ProductGrid products={PRODUCTS} error="The service timed out." onRetry={onRetry} />)
    expect(screen.getByText('The service timed out.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
    errored.unmount()
    reduced(<ProductGrid products={[]} empty={<p>Nothing in the kiln yet.</p>} />)
    expect(screen.getByText('Nothing in the kiln yet.')).toBeInTheDocument()
  })

  test('renderItem draws your own; linkComponent renders the links; theme, embedded and rest props apply', () => {
    const { unmount } = reduced(<ProductGrid products={PRODUCTS} renderItem={(p) => <span>item {p.id}</span>} />)
    expect(screen.getByText('item Bowl')).toBeInTheDocument()
    unmount()
    const RouterLink = forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    reduced(<ProductGrid products={PRODUCTS} linkComponent={RouterLink} theme={graphite} embedded id="shop" />)
    expect(screen.getByRole('link', { name: 'Bowl' })).toHaveAttribute('data-router')
    const section = screen.getByRole('region', { name: 'Kitchen & table' })
    expect(section).toHaveAttribute('id', 'shop')
    expect(section.className).not.toMatch(/py-20/)
    expect(section.closest('[data-yj-theme]')).not.toBeNull()
  })
})
