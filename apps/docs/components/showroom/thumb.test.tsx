import { render, screen } from '@testing-library/react'
import { hasThumb, Thumbs } from './thumb'

test('an item that draws its own picture has one, drawn in place of a shot and told its shape', () => {
  const item = { id: 'a', label: 'Alpha', draw: (square: boolean) => <svg data-testid="drawn" data-square={square} /> }
  expect(hasThumb(item)).toBe(true)
  expect(hasThumb({ id: 'b', label: 'Bravo' })).toBe(false)
  render(<Thumbs item={item} eager={false} square />)
  expect(screen.getByTestId('drawn')).toHaveAttribute('data-square', 'true')
  expect(document.querySelector('img')).toBeNull()
})
