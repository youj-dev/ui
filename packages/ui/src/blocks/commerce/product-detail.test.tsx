import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TruckIcon } from '@youj/icons'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import type { Product } from './product-card'
import { ProductDetail } from './product-detail'

beforeAll(() => {
  Element.prototype.scrollTo ??= () => {}
})

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

const vase: Product = {
  id: 'vase',
  name: 'Bud Vase',
  image: 'https://example.com/vase.jpg',
  category: 'Home',
  price: 1250,
  rating: 4.4,
  reviews: 1234,
  colors: [{ id: 'bone', name: 'Bone', swatch: 'var(--color-band)' }],
  description: 'A vase.',
}

describe('product detail with your data', () => {
  test('your product, perks, sections, trail, currency and copy drive the page', () => {
    const { container } = reduced(
      <ProductDetail
        product={vase}
        currency="EUR"
        locale="de-DE"
        breadcrumbs={[{ label: 'Shop', href: '/shop' }]}
        sizeGuideHref={null}
        perks={[{ icon: TruckIcon, title: 'Ships tomorrow', detail: 'Free over €100' }]}
        sections={[{ id: 'care', title: 'Care', body: 'Wipe dry.' }]}
        copy={{ addToCart: 'In den Warenkorb' }}
        className="custom"
        data-testid="page"
      />,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Bud Vase' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Shop' })).toHaveAttribute('href', '/shop')
    expect(screen.getByText('Ships tomorrow')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Care' })).toBeInTheDocument()
    expect(screen.getByText('Wipe dry.')).toBeInTheDocument()
    expect(screen.getByTestId('page')).toHaveTextContent('1.250 €')
    expect(screen.getByTestId('page')).toHaveClass('custom')
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/vase.jpg')
    expect(screen.getByRole('button', { name: 'In den Warenkorb' })).toBeInTheDocument()
  })

  test('the delivery day counts from today, not the clock', () => {
    reduced(<ProductDetail today={new Date(2026, 0, 5)} />)
    expect(screen.getByText('Arrives by Thursday, Jan 8')).toBeInTheDocument()
  })

  test('add to cart and save report their payloads', async () => {
    const user = userEvent.setup()
    const onAddToCart = vi.fn().mockResolvedValue(undefined)
    const onSave = vi.fn()
    reduced(<ProductDetail product={vase} onAddToCart={onAddToCart} onSave={onSave} />)
    await user.click(screen.getByRole('button', { name: 'Add to cart' }))
    await waitFor(() => expect(onAddToCart).toHaveBeenCalledWith({ product: vase, color: 'bone', size: undefined, quantity: 1 }))
    await user.click(screen.getByRole('button', { name: 'Save for later' }))
    expect(onSave).toHaveBeenCalledWith(vase, true)
  })
})
