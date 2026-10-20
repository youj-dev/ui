import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SpotlightGroup } from '@youj/motion'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card'

function Usage(props: Parameters<typeof Card>[0]) {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Usage</CardTitle>
        <CardDescription>Resets in 12 days.</CardDescription>
        <CardAction>
          <button type="button">Options</button>
        </CardAction>
      </CardHeader>
      <CardContent>7.4 of 10 GB</CardContent>
      <CardFooter>Pro plan</CardFooter>
    </Card>
  )
}

const card = () => document.querySelector<HTMLElement>('[data-slot=card]')!

describe('Card', () => {
  test('renders its slots in order', () => {
    render(<Usage />)
    const slots = [...card().querySelectorAll('[data-slot]')].map((el) => el.getAttribute('data-slot'))
    expect(slots).toEqual(['card-header', 'card-title', 'card-description', 'card-action', 'card-content', 'card-footer'])
    expect(screen.getByRole('button', { name: 'Options' })).toBeInTheDocument()
  })

  test('size and lift are exposed for styling', () => {
    render(<Usage size="sm" lift />)
    expect(card()).toHaveAttribute('data-size', 'sm')
    expect(card()).toHaveAttribute('data-lift')
    expect(card()).toHaveClass('focus-ring-within')
  })

  test('a plain card does not lift and is not lit', () => {
    render(<Usage />)
    expect(card()).not.toHaveAttribute('data-lift')
    expect(card()).not.toHaveAttribute('data-yj-spot-card')
  })

  test('spotlight wears motion\'s Spotlight surface: decorative light layers, content untouched', async () => {
    const user = userEvent.setup()
    render(<Usage spotlight />)
    expect(card()).toHaveAttribute('data-yj-spot-card')
    expect(card()).toHaveClass('yj-spot')
    for (const layer of card().querySelectorAll('.yj-spot__surface, .yj-spot__edge')) expect(layer).toHaveAttribute('aria-hidden', 'true')
    // Still reachable and in order for the keyboard.
    await user.tab()
    expect(screen.getByRole('button', { name: 'Options' })).toHaveFocus()
  })

  test('cards in a SpotlightGroup share its light', () => {
    render(
      <SpotlightGroup>
        <Usage spotlight />
        <Usage spotlight />
      </SpotlightGroup>,
    )
    expect(document.querySelectorAll('[data-yj-spot-card]')).toHaveLength(2)
  })

  test('reduced motion is marked so the lift drops its travel', () => {
    render(
      <YoujProvider reducedMotion="always">
        <Usage lift spotlight />
      </YoujProvider>,
    )
    expect(card()).toHaveAttribute('data-reduced-motion')
    // Spotlight's own reduced mode: a static border instead of tracking.
    expect(card()).toHaveAttribute('data-reduced')
  })
})

describe('Card variant', () => {
  test('inset marks the card for the style to build, and default writes nothing', () => {
    render(
      <>
        <Card data-testid="inset" variant="inset" />
        <Card data-testid="plain" />
      </>,
    )
    expect(screen.getByTestId('inset')).toHaveAttribute('data-variant', 'inset')
    expect(screen.getByTestId('plain')).not.toHaveAttribute('data-variant')
  })

  test('panel marks the card and keeps the header parts in order', () => {
    render(
      <Card data-testid="panel" variant="panel">
        <CardHeader>
          <CardTitle>Build minutes</CardTitle>
          <CardAction>
            <button type="button">Options</button>
          </CardAction>
        </CardHeader>
        <CardContent>2,795</CardContent>
      </Card>,
    )
    const panel = screen.getByTestId('panel')
    expect(panel).toHaveAttribute('data-variant', 'panel')
    expect(panel.firstElementChild).toHaveAttribute('data-slot', 'card-header')
    expect(screen.getByRole('button', { name: 'Options' }).closest('[data-slot=card-action]')).toBeInTheDocument()
  })
})

describe('Card around a form', () => {
  /** Bezel's card recipe for a part (styles/bezel.css), its selector with the style gate (`&`) left off. */
  const bezel = readFileSync(resolve(__dirname, '../../styles/bezel.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  const recipe = (slot: string) => {
    const rule = bezel.split('\n').find((line) => line.trim().startsWith(":is([data-slot='card']") && line.trim().endsWith(`> [data-slot='${slot}']& {`))
    if (!rule) throw new Error(`no Bezel card rule for ${slot}`)
    return rule.trim().replace(/& \{$/, '')
  }

  test('a form that wraps the parts lays out as if it were not there, and the Bezel sections still find them', () => {
    render(
      <Card>
        <form aria-label="Rename">
          <CardHeader>
            <CardTitle>Project name</CardTitle>
          </CardHeader>
          <CardContent>
            <input aria-label="Name" />
          </CardContent>
          <CardFooter>
            <button type="submit">Save</button>
          </CardFooter>
        </form>
      </Card>,
    )
    expect(card()).toHaveClass('own:[&>form]:contents')
    for (const slot of ['card-header', 'card-content', 'card-footer']) expect(document.querySelector(`[data-slot=${slot}]`)!.matches(recipe(slot)), slot).toBe(true)
    // Only a form right inside the card counts: a part nested deeper isn't one of its sections.
    const nested = document.createElement('div')
    nested.dataset.slot = 'card-content'
    document.querySelector('input')!.parentElement!.append(nested)
    expect(nested.matches(recipe('card-content'))).toBe(false)
  })
})
