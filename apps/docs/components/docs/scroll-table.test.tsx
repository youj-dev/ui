import { render, screen } from '@testing-library/react'
import { ScrollTable } from './scroll-table'

function sizes(scrollWidth: number, clientWidth: number) {
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(scrollWidth)
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(clientWidth)
}

const table = (
  <ScrollTable>
    <tbody>
      <tr>
        <td>Radius</td>
      </tr>
    </tbody>
  </ScrollTable>
)

afterEach(() => vi.restoreAllMocks())

it('lets the keyboard reach a table that scrolls sideways, and names it', () => {
  sizes(800, 360)
  render(table)
  const region = screen.getByRole('group', { name: 'Table, scrolls sideways' })
  expect(region).toHaveAttribute('tabindex', '0')
  expect(region.querySelector('table')).toBeInTheDocument()
})

it('fades only the side with more to see', () => {
  sizes(800, 360)
  render(table)
  const region = screen.getByRole('group')
  expect(region).toHaveAttribute('data-more-end')
  expect(region).not.toHaveAttribute('data-more-start')
})

it('keeps a table that fits out of the tab order', () => {
  sizes(360, 360)
  const { container } = render(table)
  expect(screen.queryByRole('group')).toBeNull()
  expect(container.firstElementChild).not.toHaveAttribute('tabindex')
})
