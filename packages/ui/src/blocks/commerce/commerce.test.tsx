import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { CartDrawer } from './cart-drawer'
import { Checkout } from './checkout'
import { ProductCard, productById } from './product-card'
import { ProductDetail } from './product-detail'
import { ProductGrid } from './product-grid'

// jsdom has no scrolling; the carousel thumbnails scroll themselves into view.
beforeAll(() => {
  Element.prototype.scrollTo ??= () => {}
})

const count = () => screen.getByText(/^\d+ products?$/)
const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
/** The photos shown (the top layer of each studio shot), by file name. */
const photos = (scope: HTMLElement) => [...scope.querySelectorAll('[data-slot="product-render"] img:not([aria-hidden])')].map((img) => img.getAttribute('src')!.split('/').pop())

describe('commerce blocks', () => {
  test('product card: an article named by its link, a sale read as was / now, and quick add with the chosen colour', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn().mockResolvedValue(undefined)
    const kettle = productById('hearth-kettle')
    reduced(<ProductCard product={kettle} onAdd={onAdd} />)
    const card = screen.getByRole('article', { name: 'Hearth Kettle' })
    expect(within(card).getByRole('link', { name: 'Hearth Kettle' })).toHaveAttribute('href', '#hearth-kettle')
    expect(card).toHaveTextContent('Was $118now $98')
    // Both shots (the front, and the other side shown on hover) are decorative: the link names the product.
    expect(photos(card)).toEqual(['kettle-cream.webp', 'kettle-cream-side.webp'])
    expect([...card.querySelectorAll('img')].every((img) => img.getAttribute('alt') === '')).toBe(true)
    // One colorway: nothing to pick, so no swatches.
    expect(within(card).queryByRole('group', { name: 'Color' })).not.toBeInTheDocument()
    await user.click(within(card).getByRole('button', { name: 'Add Hearth Kettle to cart' }))
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith(kettle, { color: 'cream', size: undefined }))
  })

  test('product card: swatches are one radio group; hovering previews a colourway’s photos, leaving restores the pick', async () => {
    const user = userEvent.setup()
    reduced(<ProductCard product={productById('ridge-kettle')} />)
    const card = screen.getByRole('article', { name: 'Ridge Kettle' })
    const group = within(card).getByRole('group', { name: 'Color' })
    expect(within(group).getAllByRole('radio').map((r) => r.getAttribute('aria-label'))).toEqual(['Sage', 'Rose', 'Sky'])
    expect(within(group).getByRole('radio', { name: 'Sage' })).toBeChecked()
    expect(photos(card)).toEqual(['kettle-sage.webp', 'kettle-sage-side.webp'])

    fireEvent.pointerEnter(within(group).getByRole('radio', { name: 'Rose' }).closest('label')!)
    expect(photos(card)).toEqual(['kettle-rose.webp', 'kettle-rose-side.webp'])
    expect(card).toHaveTextContent('Rose')
    fireEvent.pointerLeave(group)
    expect(photos(card)).toEqual(['kettle-sage.webp', 'kettle-sage-side.webp'])

    // Arrow keys move the pick, as in any radio group.
    within(group).getByRole('radio', { name: 'Sage' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(within(group).getByRole('radio', { name: 'Rose' })).toBeChecked()
    expect(photos(card)).toEqual(['kettle-rose.webp', 'kettle-rose-side.webp'])
  })

  test('product card: quick add on a sized product asks for the size first; Escape backs out and focus returns', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn().mockResolvedValue(undefined)
    const kettle = productById('ridge-kettle')
    reduced(<ProductCard product={kettle} onAdd={onAdd} />)
    const card = screen.getByRole('article', { name: 'Ridge Kettle' })
    const quick = within(card).getByRole('button', { name: 'Choose a size of Ridge Kettle' })
    expect(quick).toHaveAttribute('aria-expanded', 'false')

    await user.click(quick)
    const sizes = within(card).getByRole('group', { name: 'Sizes for Ridge Kettle' })
    await waitFor(() => expect(within(sizes).getByRole('button', { name: 'Add 1.2 l' })).toHaveFocus())
    expect(within(sizes).getByRole('button', { name: '1.8 l, sold out' })).toBeDisabled()
    await user.keyboard('{Escape}')
    expect(within(card).queryByRole('group', { name: 'Sizes for Ridge Kettle' })).not.toBeInTheDocument()
    await waitFor(() => expect(within(card).getByRole('button', { name: 'Choose a size of Ridge Kettle' })).toHaveFocus())

    await user.click(within(card).getByRole('button', { name: 'Choose a size of Ridge Kettle' }))
    await user.click(within(card).getByRole('button', { name: 'Add 1.2 l' }))
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith(kettle, { color: 'sage', size: '1.2 l' }))
    await waitFor(() => expect(within(card).getByRole('button', { name: 'Choose a size of Ridge Kettle' })).toHaveTextContent('Added · 1.2 l'))
  })

  test('product grid: the tabs narrow the grid, the count is announced, and no matches offers a way out', async () => {
    const user = userEvent.setup()
    reduced(<ProductGrid />)
    expect(screen.getByRole('heading', { level: 1, name: 'Kitchen & table' })).toBeInTheDocument()
    // Product names sit one level under the page title.
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(5)
    expect(count()).toHaveTextContent('5 products')

    await user.click(within(screen.getByRole('group', { name: 'Categories' })).getByRole('button', { name: /Kettles/ }))
    await waitFor(() => expect(count()).toHaveTextContent('2 products'))
    const list = screen.getByRole('list', { name: 'Products' })
    expect(within(list).getAllByRole('article').map((a) => a.getAttribute('aria-labelledby'))).toEqual(['product-ridge-kettle', 'product-hearth-kettle'])

    // The price range lives in the Filters popover; jsdom can't measure the thumbs, so they count as hidden.
    await user.click(screen.getByRole('button', { name: 'Filters' }))
    const max = (await screen.findAllByRole('slider', { hidden: true })).find((el) => el.getAttribute('aria-label') === 'Maximum price')!
    max.focus()
    await user.keyboard('{Home}')
    await waitFor(() => expect(count()).toHaveTextContent('0 products'))
    await user.keyboard('{Escape}')
    expect(screen.getByText('Nothing matches those filters')).toBeInTheDocument()
    // Once the popover has gone, the one left is the empty state's.
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Clear filters' })).toHaveLength(1))
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(count()).toHaveTextContent('5 products')
  })

  test('product grid: sorting by price reorders the cards', async () => {
    const user = userEvent.setup()
    reduced(<ProductGrid />)
    await user.click(screen.getByRole('combobox', { name: 'Sort by' }))
    await user.click(await screen.findByRole('option', { name: 'Price: low to high' }))
    const names = within(screen.getByRole('list', { name: 'Products' }))
      .getAllByRole('article')
      .map((a) => a.getAttribute('aria-labelledby'))
    expect(names[0]).toBe('product-daily-mug')
    expect(names.at(-1)).toBe('product-ritual-tea-set')
  })

  test('product detail: a colour swaps every angle’s photo, sizes skip what’s sold out, add to cart gets the line', async () => {
    const user = userEvent.setup()
    const onAddToCart = vi.fn().mockResolvedValue(undefined)
    reduced(<ProductDetail onAddToCart={onAddToCart} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Ridge Kettle' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Details', 'Shipping', 'Returns'])
    const gallery = screen.getByRole('region', { name: 'Ridge Kettle photos' })
    expect(gallery).toHaveAttribute('aria-roledescription', 'carousel')
    // Three angles, each with its thumbnail.
    expect(within(gallery).getByRole('group', { name: /in Sage, close up, 3 of 3/ })).toBeInTheDocument()
    expect(photos(gallery)).toContain('kettle-sage.webp')
    expect(photos(gallery)).toContain('kettle-sage-side.webp')

    await user.click(screen.getByRole('radio', { name: 'Rose' }))
    expect(screen.getByRole('radio', { name: 'Rose' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Sage' })).not.toBeChecked()
    expect(photos(gallery)).toContain('kettle-rose.webp')
    expect(photos(gallery)).toContain('kettle-rose-side.webp')
    expect(within(gallery).getByRole('group', { name: /in Rose, from the front, 1 of 3/ })).toBeInTheDocument()

    const sizes = screen.getByRole('group', { name: 'Size' })
    expect(within(sizes).getByRole('radio', { name: '1.2 l' })).toBeChecked()
    expect(within(sizes).getByRole('radio', { name: '1.8 l, sold out' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Increase' }))
    expect(document.querySelector('[data-slot="price"]')).toHaveTextContent('$258')
    expect(screen.getByText('$129 each')).toBeInTheDocument()
    expect(screen.getByText('Free delivery')).toBeInTheDocument()
    expect(screen.getByText(/^Arrives by \w+day, \w{3} \d+$/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Add to cart/ }))
    await waitFor(() => expect(onAddToCart).toHaveBeenCalledWith({ product: productById('ridge-kettle'), color: 'rose', size: '1.2 l', quantity: 2 }))
  })

  test('cart drawer: a named dialog; removing a line and changing a quantity update the count and subtotal', async () => {
    const user = userEvent.setup()
    reduced(<CartDrawer />)
    await user.click(screen.getByRole('button', { name: 'Cart, 4 items' }))
    const dialog = await screen.findByRole('dialog', { name: 'Your cart' })
    const items = within(dialog).getByRole('list', { name: 'Cart items' })
    expect(within(items).getAllByRole('listitem')).toHaveLength(3)

    // Each line shows its product in the colorway that was picked.
    expect(photos(items)).toEqual(['kettle-rose.webp', 'mug.webp', 'bud-vases.webp'])
    expect(items).toHaveTextContent('Rose · 1.2 l')
    expect(within(dialog).getByText('Free shipping unlocked')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Remove Ridge Kettle' }))
    await waitFor(() => expect(within(items).getAllByRole('listitem')).toHaveLength(2))
    expect(within(dialog).getByText('3 items')).toBeInTheDocument()
    expect(dialog).toHaveTextContent('Subtotal$92')
    expect(within(dialog).getByText(/away from free shipping/)).toHaveTextContent('$58')

    const vases = within(dialog).getByRole('textbox', { name: 'Quantity of Bud Vases, set of three' })
    await user.clear(vases)
    await user.type(vases, '3{Enter}')
    await waitFor(() => expect(within(dialog).getByText('5 items')).toBeInTheDocument())
  })

  test('cart drawer: an empty cart says so and links back to the shop', async () => {
    reduced(<CartDrawer defaultOpen defaultLines={[]} />)
    const dialog = await screen.findByRole('dialog', { name: 'Your cart' })
    expect(within(dialog).getByText('Your cart is empty')).toBeInTheDocument()
    expect(within(dialog).getByRole('link', { name: 'Continue shopping' })).toHaveAttribute('href', '#shop')
    expect(within(dialog).queryByRole('button', { name: 'Check out' })).not.toBeInTheDocument()
  })

  test('checkout: Enter in a field advances the step', async () => {
    const user = userEvent.setup()
    reduced(<Checkout />)
    await user.type(screen.getByRole('textbox', { name: /Email/ }), 'ada@northwind.dev{Enter}')
    expect(await screen.findByRole('heading', { name: 'Shipping' })).toBeInTheDocument()
  })

  test('checkout: each step validates itself, review reads it back, and paying confirms the order', async () => {
    const user = userEvent.setup()
    const onPlaceOrder = vi.fn().mockResolvedValue('NW-1')
    reduced(<Checkout onPlaceOrder={onPlaceOrder} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Checkout' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Order summary' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Contact' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByText('Enter your email.')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: /Email/ }), 'ada@northwind.dev')
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(await screen.findByRole('heading', { name: 'Shipping' })).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: /Full name/ }), 'Ada Lovelace')
    await user.type(screen.getByRole('textbox', { name: /Street address/ }), '1 Main St')
    await user.type(screen.getByRole('textbox', { name: /City/ }), 'Boston')
    await user.type(screen.getByRole('textbox', { name: /Postal code/ }), '02110')
    await user.type(screen.getByRole('textbox', { name: /Phone/ }), '6175550123')
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(await screen.findByRole('heading', { name: 'Payment' })).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: /Card number/ }), '4242 4242 4242 4242')
    await user.type(screen.getByRole('textbox', { name: /Expiry/ }), '8/28')
    await user.type(screen.getByRole('textbox', { name: /Security code/ }), '123')
    await user.type(screen.getByRole('textbox', { name: /Name on card/ }), 'Ada Lovelace')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByText('Use MM/YY, like 08/28.')).toBeInTheDocument()
    const expiry = screen.getByRole('textbox', { name: /Expiry/ })
    await user.clear(expiry)
    await user.type(expiry, '08/28')
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(await screen.findByRole('heading', { name: 'Review' })).toBeInTheDocument()
    expect(screen.getByText('ada@northwind.dev')).toBeInTheDocument()
    expect(screen.getByText(/Card ending 4242/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Pay \$/ }))
    await waitFor(() => expect(onPlaceOrder).toHaveBeenCalled())
    expect(onPlaceOrder.mock.calls[0]![0].shipping).toMatchObject({ city: 'Boston', country: 'US', phone: '+16175550123' })
    const done = await screen.findByRole('heading', { name: 'Order confirmed' })
    await waitFor(() => expect(done).toHaveFocus())
    expect(screen.getByText('NW-1')).toBeInTheDocument()
  })
})
