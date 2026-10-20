import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ProductCard, type Product } from './product-card'
import { Bookshop } from './product-card.stories'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

const vase: Product = {
  id: 'vase',
  name: 'Bud Vase',
  image: 'https://example.com/vase.jpg',
  href: '/products/bud-vase',
  category: 'Home',
  price: 1250,
  compareAt: 1500,
  rating: 4.4,
  reviews: 1234,
  colors: [
    { id: 'bone', name: 'Bone', swatch: 'var(--color-band)' },
    { id: 'ink', name: 'Ink', swatch: 'var(--color-fg)' },
  ],
  description: 'A vase.',
}

describe('product card with your data', () => {
  test('a product href that is a javascript: URL falls back to the card\'s own anchor', () => {
    reduced(<ProductCard product={{ ...vase, href: 'javascript:alert(1)' }} />)
    expect(screen.getByRole('link', { name: 'Bud Vase' })).toHaveAttribute('href', '#vase')
  })

  test('your product, photo, link, currency and locale drive the card', () => {
    const RouterLink = (props: React.ComponentProps<'a'>) => <a data-router="" {...props} />
    const { container } = reduced(<ProductCard product={vase} currency="EUR" locale="de-DE" linkComponent={RouterLink} className="custom" data-testid="card" />)
    const link = screen.getByRole('link', { name: 'Bud Vase' })
    expect(link).toHaveAttribute('href', '/products/bud-vase')
    expect(link).toHaveAttribute('data-router')
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/vase.jpg')
    expect(screen.getByTestId('card')).toHaveClass('custom')
    expect(screen.getByTestId('card')).toHaveTextContent('1.250 €')
    expect(screen.getByTestId('card')).toHaveTextContent('(1.234)')
    expect(screen.getByRole('radio', { name: 'Ink' })).toBeInTheDocument()
  })

  test('copy rewrites the labels; onAdd hears the product and colour', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn().mockResolvedValue(undefined)
    reduced(<ProductCard product={vase} onAdd={onAdd} copy={{ addToCart: (name) => `${name} in den Korb`, quickAdd: 'In den Korb' }} />)
    await user.click(screen.getByRole('radio', { name: 'Ink' }))
    await user.click(screen.getByRole('button', { name: 'Bud Vase in den Korb' }))
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith(vase, { color: 'ink', size: undefined }))
  })
})

describe('product card: Bookshop story', () => {
  test('a book is the product: its formats, prices and wording come from props', () => {
    reduced(<div>{Bookshop.render!({ ...Bookshop.args } as never, {} as never)}</div>)
    const card = screen.getByRole('article', { name: 'The Salt Tide' })
    expect(card).toHaveTextContent('$18.50')
    expect(card).toHaveTextContent('$24')
    expect(card).toHaveTextContent('Staff pick')
    expect(card).toHaveTextContent('Fiction')
    expect(screen.getAllByRole('radio', { name: 'Hardcover' })).toHaveLength(1)
    expect(screen.getAllByRole('group', { name: 'Format' })).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Add The Salt Tide to your basket' })).toHaveTextContent('Add to basket')
  })

  test('sizes read from copy.sizeLabel on the button, the full size for assistive technology', async () => {
    const user = userEvent.setup()
    reduced(<ProductCard product={{ ...vase, sizes: ['EU 41', 'EU 42'] }} copy={{ sizeLabel: (size) => size.replace('EU ', '') + ' (EU)' }} />)
    await user.click(screen.getByRole('button', { name: 'Choose a size of Bud Vase' }))
    expect(screen.getByRole('button', { name: 'Add EU 41' })).toHaveTextContent('41 (EU)')
  })
})
