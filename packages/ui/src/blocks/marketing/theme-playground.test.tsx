import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { basalt, cinnabarPalette, graphite, type ThemeInput } from '@youj/core'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ThemePlayground, type ThemePlaygroundProps } from './theme-playground'

const reduced = (props: ThemePlaygroundProps = {}, theme: ThemeInput = graphite) =>
  render(
    <YoujProvider reducedMotion="always" theme={theme}>
      <ThemePlayground {...props} />
    </YoujProvider>,
  )

/** The scope the preview page wears. */
const scope = () => screen.getByRole('navigation', { name: 'Lumen (preview)' }).closest('[data-yj-theme]') as HTMLElement
const caption = () => screen.getByText(/^Preview:/)
const controls = () => within(screen.getByRole('group', { name: 'Theme controls' }))

describe('theme playground', () => {
  test('starts from the page’s own palette and style, and names the recipe', () => {
    reduced({ defaultMode: 'dark' }, basalt)
    expect(screen.getByRole('heading', { level: 1, name: 'Make it yours, live' })).toBeInTheDocument()
    // Basalt is the Youj palette in the Clean style.
    expect(controls().getByRole('radio', { name: 'Youj' })).toBeChecked()
    expect(controls().getByRole('button', { name: 'Clean' })).toHaveAttribute('aria-pressed', 'true')
    expect(scope()).toHaveAttribute('data-yj-palette', 'youj')
    expect(caption()).toHaveTextContent('Preview: Youj, Clean, dark')
  })

  test('a palette re-colours the page and keeps the style; a style brings its corners, control size and look', async () => {
    const user = userEvent.setup()
    reduced({ defaultMode: 'light' })
    await user.click(controls().getByRole('radio', { name: 'Meadow' }))
    expect(scope()).toHaveAttribute('data-yj-palette', 'meadow')
    // The page around it wears Graphite: the Youj palette in the Clean style, which the pick keeps.
    expect(scope()).toHaveAttribute('data-yj-style', 'clean')
    for (const [name, id, look, radius, density] of [
      ['Terminal', 'terminal', 'bezel', 'None', 'Compact'],
      ['Brutal', 'brutal', 'classic', 'None', 'Default'],
      ['Classic', 'classic', 'classic', 'Small', 'Default'],
      ['Clean', 'clean', 'classic', 'Larger', 'Default'],
      ['Bezel', 'bezel', 'bezel', 'Large', 'Roomy'],
    ] as const) {
      await user.click(controls().getByRole('button', { name }))
      expect(scope()).toHaveAttribute('data-yj-style', id)
      expect(scope()).toHaveAttribute('data-yj-palette', 'meadow')
      expect(scope()).toHaveAttribute('data-yj-look', look)
      expect(controls().getByRole('button', { name: radius })).toHaveAttribute('aria-pressed', 'true')
      expect(controls().getByRole('button', { name: density })).toHaveAttribute('aria-pressed', 'true')
    }
  })

  test('accent, corners, control size and mode tune on top of the pair', async () => {
    const user = userEvent.setup()
    reduced({ defaultPalette: 'youj', defaultStyle: 'bezel', defaultMode: 'light' })
    await user.click(controls().getByRole('radio', { name: 'Cinnabar accent' }))
    expect(scope().style.getPropertyValue('--yj-accent-light')).toBe((cinnabarPalette.accent as { light: string }).light)
    await user.click(controls().getByRole('button', { name: 'Full' }))
    expect(scope().style.getPropertyValue('--yj-radius')).not.toBe('')
    await user.click(controls().getByRole('button', { name: 'Compact' }))
    await user.click(controls().getByRole('button', { name: 'Dark' }))
    expect(caption()).toHaveTextContent('Preview: Youj, Bezel, dark')
    expect(scope().querySelector('[data-theme]')).toHaveAttribute('data-theme', 'dark')

    // Reset returns to the pair as it started, keeping the mode.
    await user.click(controls().getByRole('button', { name: 'Reset' }))
    expect(controls().getByRole('radio', { name: 'Youj accent' })).toBeChecked()
    expect(controls().getByRole('button', { name: 'Large' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('Copy puts the recipe on the clipboard as code', async () => {
    const user = userEvent.setup()
    reduced({ defaultPalette: 'seaglass', defaultStyle: 'terminal', defaultMode: 'dark' })
    await user.click(controls().getByRole('button', { name: 'Roomy' }))
    await user.click(controls().getByRole('button', { name: 'Copy theme' }))
    const text = await navigator.clipboard.readText()
    expect(text).toContain("import { seaglassPalette, terminalStyle } from '@youj/core'")
    expect(text).toContain("<YoujProvider palette={seaglassPalette} style={terminalStyle} theme={{ controlSize: 'comfortable' }}>")
  })

  test('embedded, it is a section named by an h2', () => {
    reduced({ embedded: true })
    expect(screen.getByRole('region', { name: 'Make it yours, live' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })
})
