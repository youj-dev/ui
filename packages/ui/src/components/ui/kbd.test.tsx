import { render, screen } from '@testing-library/react'
import { Kbd, KbdGroup } from './kbd'

describe('Kbd', () => {
  test('a combination is nested kbd elements', () => {
    render(
      <KbdGroup data-testid="combo">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>,
    )
    const combo = screen.getByTestId('combo')
    expect(combo.tagName).toBe('KBD')
    expect(combo.querySelectorAll('kbd')).toHaveLength(2)
  })

  // Layout needs a browser (measured: a 20px line stays 20px); this guards the rule that does it.
  test('in running text the keycap and a combination trim their block margins, so the line keeps its height', () => {
    render(
      <p>
        Press <Kbd data-testid="key">K</Kbd> or{' '}
        <KbdGroup data-testid="combo">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </p>,
    )
    for (const id of ['key', 'combo']) expect(screen.getByTestId(id).className).toContain('[:where(p,li,dd,td,blockquote,figcaption)>&]:-my-0.5')
  })
})
