import { render, screen } from '@testing-library/react'
import { Button } from './button'
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from './button-group'
import { Input } from './input'

describe('ButtonGroup', () => {
  test('is a named group that states its orientation', () => {
    render(
      <ButtonGroup aria-label="Zoom" orientation="vertical">
        <Button>In</Button>
        <Button>Out</Button>
      </ButtonGroup>,
    )
    const group = screen.getByRole('group', { name: 'Zoom' })
    expect(group).toHaveAttribute('data-orientation', 'vertical')
    expect(group).toHaveClass('flex-col')
  })

  test('defaults to horizontal, with logical (RTL-safe) joins', () => {
    render(
      <ButtonGroup aria-label="Pages">
        <Button>Prev</Button>
        <Button>Next</Button>
      </ButtonGroup>,
    )
    const group = screen.getByRole('group', { name: 'Pages' })
    expect(group).toHaveAttribute('data-orientation', 'horizontal')
    expect(group.className).toMatch(/rounded-s-none/)
    expect(group.className).not.toMatch(/rounded-l-none|rounded-r-none/)
  })

  test('text renders as any element, so it can label the joined input', () => {
    render(
      <ButtonGroup>
        <ButtonGroupText render={<label htmlFor="url" />}>https://</ButtonGroupText>
        <Input id="url" />
      </ButtonGroup>,
    )
    expect(screen.getByLabelText('https://')).toHaveAttribute('id', 'url')
  })

  test('the separator is a vertical separator by default', () => {
    render(
      <ButtonGroup>
        <Button>Merge</Button>
        <ButtonGroupSeparator />
        <Button aria-label="More">▾</Button>
      </ButtonGroup>,
    )
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical')
  })
})
