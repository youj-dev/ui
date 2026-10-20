import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { CartDrawer, type CartLine } from './cart-drawer'
import type { Product } from './product-card'
import { CourseBundle, GroceryOrder } from './cart-drawer.stories'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

const tote: Product = {
  id: 'tote',
  name: 'Canvas Tote',
  image: 'https://example.com/tote.jpg',
  category: 'Bags',
  price: 40,
  rating: 4.5,
  reviews: 12,
  colors: [{ id: 'sand', name: 'Sand', swatch: 'var(--color-band)' }],
  description: 'A tote.',
}
const LINES: CartLine[] = [{ id: 'a', product: tote, color: 'sand', quantity: 2 }]

describe('cart drawer with your data', () => {
  test('your lines, photo, currency and locale drive the cart', async () => {
    reduced(<CartDrawer defaultOpen lines={LINES} currency="EUR" locale="de-DE" freeShippingAt={null} />)
    const dialog = await screen.findByRole('dialog', { name: 'Your cart' })
    expect(within(dialog).getByText('Canvas Tote')).toBeInTheDocument()
    expect(within(dialog).getByText('Sand')).toBeInTheDocument()
    expect(dialog.querySelector('img')).toHaveAttribute('src', 'https://example.com/tote.jpg')
    expect(dialog).toHaveTextContent('80 €')
    expect(within(dialog).queryByText(/free shipping/)).not.toBeInTheDocument()
  })

  test('controlled: a change is reported, not applied, until the app passes the new lines', async () => {
    const user = userEvent.setup()
    const onLinesChange = vi.fn()
    const onRemove = vi.fn()
    reduced(<CartDrawer defaultOpen lines={LINES} onLinesChange={onLinesChange} onRemove={onRemove} />)
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Remove Canvas Tote' }))
    expect(onRemove).toHaveBeenCalledWith(LINES[0])
    expect(onLinesChange).toHaveBeenCalledWith([])
    expect(within(dialog).getByText('Canvas Tote')).toBeInTheDocument()
  })

  test('controlled by app state: quantity changes flow through onQuantityChange and onLinesChange', async () => {
    const user = userEvent.setup()
    const onQuantityChange = vi.fn()
    function Shop() {
      const [lines, setLines] = useState(LINES)
      return <CartDrawer defaultOpen lines={lines} onLinesChange={setLines} onQuantityChange={onQuantityChange} />
    }
    reduced(<Shop />)
    const dialog = await screen.findByRole('dialog')
    const quantity = within(dialog).getByRole('textbox', { name: 'Quantity of Canvas Tote' })
    await user.clear(quantity)
    await user.type(quantity, '3{Enter}')
    await waitFor(() => expect(within(dialog).getByText('3 items')).toBeInTheDocument())
    expect(onQuantityChange).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'a' }), 3)
  })

  test('copy, the shop link and checkout take your values', async () => {
    const user = userEvent.setup()
    const onCheckout = vi.fn().mockResolvedValue(undefined)
    const { unmount } = reduced(<CartDrawer defaultOpen lines={LINES} onCheckout={onCheckout} copy={{ title: 'Warenkorb', checkout: 'Zur Kasse' }} />)
    const dialog = await screen.findByRole('dialog', { name: 'Warenkorb' })
    await user.click(within(dialog).getByRole('button', { name: 'Zur Kasse' }))
    await waitFor(() => expect(onCheckout).toHaveBeenCalledWith(LINES))
    unmount()
    reduced(<CartDrawer defaultOpen defaultLines={[]} shopHref="/shop" copy={{ continueShopping: 'Browse the shop' }} />)
    expect(await screen.findByRole('link', { name: 'Browse the shop' })).toHaveAttribute('href', '/shop')
  })
})

describe('cart drawer: other worlds', () => {
  test('grocery order: packs, cents, a delivery threshold and wording come from props', async () => {
    reduced(<CartDrawer {...GroceryOrder.args} defaultOpen />)
    const dialog = await screen.findByRole('dialog', { name: 'Your order' })
    expect(within(dialog).getByText('Roma tomatoes')).toBeInTheDocument()
    expect(within(dialog).getByText('Vine-ripened · 2 lb bag')).toBeInTheDocument()
    expect(within(dialog).getByRole('textbox', { name: 'Packs of Whole milk' })).toHaveValue('3')
    expect(dialog).toHaveTextContent('$13.26')
    expect(dialog).toHaveTextContent('away from free delivery')
    expect(dialog).toHaveTextContent('$21.74')
    expect(within(dialog).getByText('Delivery')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Choose a delivery window' })).toBeInTheDocument()
  })

  test('course bundle: seats instead of quantities', async () => {
    reduced(<CartDrawer {...CourseBundle.args} defaultOpen />)
    const dialog = await screen.findByRole('dialog', { name: 'Team enrollment' })
    expect(within(dialog).getByRole('textbox', { name: 'Seats in Statistics for Analysts' })).toHaveValue('4')
    expect(dialog).toHaveTextContent('8 seats')
    expect(dialog).toHaveTextContent('more for the 10% team discount')
    expect(within(dialog).getByRole('button', { name: 'Enroll the team' })).toBeInTheDocument()
  })
})
