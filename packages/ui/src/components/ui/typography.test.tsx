import { render, screen } from '@testing-library/react'
import {
  Eyebrow,
  TypographyBlockquote,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyInlineCode,
  TypographyLead,
  TypographyList,
  TypographyMuted,
  TypographyP,
} from './typography'

describe('Typography', () => {
  test('each piece is the element it names, so the outline and semantics hold', () => {
    const { container } = render(
      <article>
        <TypographyH1>The Joke Tax</TypographyH1>
        <TypographyLead>A modern tale.</TypographyLead>
        <TypographyH2>The King’s Plan</TypographyH2>
        <TypographyH3>The Joke Tax</TypographyH3>
        <TypographyH4>People stopped telling jokes</TypographyH4>
        <TypographyP>
          Run <TypographyInlineCode>pnpm dev</TypographyInlineCode> and read <a href="#docs">the docs</a>.
        </TypographyP>
        <TypographyBlockquote>After all, everyone enjoys a good joke.</TypographyBlockquote>
        <TypographyMuted>Updated today.</TypographyMuted>
      </article>,
    )
    for (const level of [1, 2, 3, 4]) expect(screen.getAllByRole('heading', { level })).toHaveLength(1)
    expect(screen.getByText('pnpm dev').tagName).toBe('CODE')
    expect(container.querySelector('blockquote')).toHaveTextContent('everyone enjoys')
    expect(screen.getByRole('link', { name: 'the docs' })).toBeInTheDocument()
  })

  test('a list is bulleted by default and numbered when ordered', () => {
    render(
      <>
        <TypographyList aria-label="Bulleted">
          <li>One</li>
          <li>Two</li>
        </TypographyList>
        <TypographyList ordered aria-label="Numbered">
          <li>First</li>
        </TypographyList>
      </>,
    )
    expect(screen.getByRole('list', { name: 'Bulleted' }).tagName).toBe('UL')
    expect(screen.getByRole('list', { name: 'Numbered' }).tagName).toBe('OL')
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    // Explicit, since list-none drops the implicit role in Safari.
    for (const name of ['Bulleted', 'Numbered']) expect(screen.getByRole('list', { name })).toHaveAttribute('role', 'list')
  })

  test('className merges over the defaults and props pass through', () => {
    render(
      <TypographyP className="text-fg-muted" id="intro">
        Hello
      </TypographyP>,
    )
    const p = screen.getByText('Hello')
    expect(p).toHaveAttribute('id', 'intro')
    expect(p).toHaveClass('text-fg-muted')
    expect(p).not.toHaveClass('text-fg')
    expect(p).toHaveAttribute('data-slot', 'typography-p')
  })
})

describe('Eyebrow', () => {
  test('is a small muted span by default, named for a style to restyle', () => {
    render(<Eyebrow>Month-to-date spend</Eyebrow>)
    const label = screen.getByText('Month-to-date spend')
    expect(label.tagName).toBe('SPAN')
    expect(label).toHaveAttribute('data-slot', 'eyebrow')
    expect(label).toHaveClass('own:text-ui-sm', 'own:text-fg-muted')
  })

  test("keeps the element and classes a block gives it, so its look doesn't change", () => {
    render(
      <Eyebrow render={<h2 id="meters" />} className="text-ui-lg font-semibold text-fg">
        Included usage
      </Eyebrow>,
    )
    const heading = screen.getByRole('heading', { name: 'Included usage', level: 2 })
    expect(heading).toHaveAttribute('id', 'meters')
    expect(heading).toHaveAttribute('data-slot', 'eyebrow')
    expect(heading).toHaveClass('text-ui-lg', 'font-semibold', 'text-fg')
    // Its own size and color sit in the own layer (ui.css), under the block's classes.
    expect(heading.className).not.toMatch(/(^|\s)(text-ui-sm|text-muted-foreground)(\s|$)/)
  })
})
