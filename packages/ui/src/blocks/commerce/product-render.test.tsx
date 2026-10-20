import { fireEvent, render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ProductRender } from './product-render'

describe('ProductRender', () => {
  const shot = (scope: ParentNode = document) => scope.querySelector('[data-slot="product-render"]')!
  const top = () => shot().querySelector('img:not([aria-hidden])') as HTMLImageElement
  const under = () => shot().querySelector('img[aria-hidden]') as HTMLImageElement | null

  test('is decorative unless labelled; it loads lazily, or straight away with priority', () => {
    const { rerender } = render(<ProductRender src="/a.webp" />)
    expect(top()).toHaveAttribute('alt', '')
    expect(top()).toHaveAttribute('loading', 'lazy')
    rerender(<ProductRender src="/a.webp" label="Ridge Kettle in Sage" priority />)
    expect(screen.getByRole('img', { name: 'Ridge Kettle in Sage' })).toBe(top())
    expect(top()).toHaveAttribute('loading', 'eager')
    expect(top()).toHaveAttribute('fetchpriority', 'high')
  })

  test('the photo fades up once it has loaded; until then the band holds its place', () => {
    render(<ProductRender src="/a.webp" />)
    expect(shot()).toHaveAttribute('data-state', 'loading')
    expect(top()).toHaveClass('opacity-0')
    fireEvent.load(top())
    expect(shot()).toHaveAttribute('data-state', 'loaded')
    expect(top()).toHaveClass('opacity-100')
    expect(top().className).toContain('yj-duration-slow')
  })

  test('a new src crossfades over the last photo that loaded, which goes once the fade is done', () => {
    const { rerender } = render(<ProductRender src="/sage.webp" />)
    fireEvent.load(top())
    rerender(<ProductRender src="/rose.webp" />)
    expect(top()).toHaveAttribute('src', '/rose.webp')
    expect(top()).toHaveClass('opacity-0')
    expect(under()).toHaveAttribute('src', '/sage.webp')
    // A second change before the first has loaded still fades over the photo on screen.
    rerender(<ProductRender src="/sky.webp" />)
    expect(under()).toHaveAttribute('src', '/sage.webp')
    fireEvent.load(top())
    expect(top()).toHaveClass('opacity-100')
    fireEvent.transitionEnd(top())
    expect(under()).toBeNull()
  })

  test('under reduced motion the old photo goes as soon as the new one is ready', () => {
    const ui = (src: string) => (
      <YoujProvider reducedMotion="always">
        <ProductRender src={src} />
      </YoujProvider>
    )
    const { rerender } = render(ui('/sage.webp'))
    fireEvent.load(top())
    rerender(ui('/rose.webp'))
    expect(under()).not.toBeNull()
    fireEvent.load(top())
    expect(under()).toBeNull()
    expect(shot()).toHaveAttribute('data-reduced-motion')
  })

  test('crops around focus, and detail closes in on it', () => {
    const { rerender } = render(<ProductRender src="/a.webp" focus={[30, 70]} />)
    const zoom = () => top().parentElement!
    expect(top().style.objectPosition).toBe('30% 70%')
    expect(zoom().style.transformOrigin).toBe('30% 70%')
    expect(zoom().style.scale).toBe('1')
    rerender(<ProductRender src="/a.webp" focus={[30, 70]} view="detail" />)
    expect(shot()).toHaveAttribute('data-yj-view', 'detail')
    expect(Number(zoom().style.scale)).toBeGreaterThan(1.5)
    rerender(<ProductRender src="/a.webp" fit="contain" />)
    expect(top()).toHaveClass('object-contain')
  })

  test('a photo that fails shows the fallback, labelled when the photo was', () => {
    const { rerender } = render(<ProductRender src="/missing.webp" label="Bud Vases" />)
    fireEvent.error(top())
    expect(shot()).toHaveAttribute('data-state', 'error')
    expect(screen.getByRole('img', { name: 'Bud Vases' })).not.toHaveAttribute('src')
    rerender(<ProductRender src="/missing.webp" fallback={<span>No photo</span>} />)
    expect(screen.getByText('No photo')).toBeInTheDocument()
    // A new src tries again.
    rerender(<ProductRender src="/b.webp" />)
    expect(shot()).toHaveAttribute('data-state', 'loading')
  })
})
