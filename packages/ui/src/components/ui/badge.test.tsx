import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Badge, BadgeDot, BadgeRemove } from './badge'

describe('Badge', () => {
  test('is a span by default and can render as a link', () => {
    render(
      <>
        <Badge variant="success">Ready</Badge>
        <Badge render={<a href="#log" />}>Changelog</Badge>
      </>,
    )
    expect(screen.getByText('Ready').tagName).toBe('SPAN')
    expect(screen.getByRole('link', { name: 'Changelog' })).toHaveAttribute('href', '#log')
  })

  test('neutral is a quiet status of its own, beside success, warning and danger', () => {
    render(<Badge variant="neutral">Draft</Badge>)
    const badge = screen.getByText('Draft')
    expect(badge).toHaveAttribute('data-variant', 'neutral')
    expect(badge).toHaveClass('own:bg-band', 'own:text-fg-muted')
  })

  test('BadgeRemove is a named button that is not a submit button', async () => {
    const onClick = vi.fn()
    render(
      <form onSubmit={() => onClick('submitted')}>
        <Badge>
          design
          <BadgeRemove aria-label="Remove design" onClick={() => onClick('removed')} />
        </Badge>
      </form>,
    )
    const remove = screen.getByRole('button', { name: 'Remove design' })
    expect(remove).toHaveAttribute('type', 'button')
    await userEvent.setup().click(remove)
    expect(onClick).toHaveBeenCalledExactlyOnceWith('removed')
  })
})

describe('BadgeDot', () => {
  test('is a decorative dot in the badge colour, so the text carries the meaning', () => {
    render(
      <Badge variant="success">
        <BadgeDot data-testid="dot" />
        Live
      </Badge>,
    )
    const dot = screen.getByTestId('dot')
    expect(dot).toHaveAttribute('aria-hidden')
    expect(dot).toHaveAttribute('data-slot', 'badge-dot')
    expect(dot).toHaveClass('own:bg-current')
    expect(dot.parentElement).toHaveTextContent(/^Live$/)
  })

  test('color tints a chip with a theme colour by name or any CSS colour, and colours a dot alone', () => {
    render(
      <>
        <Badge color="chart-3">Design</Badge>
        <Badge color="var(--brand)">Brand</Badge>
        <Badge variant="outline">
          <BadgeDot color="success" data-testid="dot" />
          Shipped
        </Badge>
      </>,
    )
    const design = screen.getByText('Design')
    expect(design.style.getPropertyValue('--ui--badge-color')).toBe('var(--color-chart-3)')
    expect(design.className).toContain('--ui--badge-color')
    expect(design.className).not.toContain('own:bg-accent-subtle')
    expect(screen.getByText('Brand').style.getPropertyValue('--ui--badge-color')).toBe('var(--brand)')
    expect(screen.getByTestId('dot').style.backgroundColor).toBe('var(--color-success)')
  })
})

