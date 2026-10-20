import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { defineTheme } from '@youj/core/lib/youj/theme/contract'
import { graphite } from '@youj/core/lib/youj/theme/themes'
import { fontById } from './create/fonts'
import { ThemeBuilder } from './theme-builder'

type User = ReturnType<typeof userEvent.setup>

/** Opens a menu by its label and picks an option by name. */
async function choose(user: User, menu: string, option: string | RegExp) {
  await user.click(screen.getByRole('combobox', { name: menu }))
  await user.click(await screen.findByRole('option', { name: option }))
}

describe('ThemeBuilder', () => {
  afterEach(() => document.head.querySelectorAll('link[data-yj-font], link[rel=preconnect]').forEach((l) => l.remove()))

  test('a style brings its character and keeps the palette, in the previews and the export', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always">
        <ThemeBuilder />
      </YoujProvider>,
    )
    await choose(user, 'Style', /^Brutal/)
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Style' })).toHaveTextContent('Brutal'))
    expect(screen.getByRole('combobox', { name: 'Palette' })).toHaveTextContent('Youj')
    const css = (await screen.findByLabelText('CSS export')).textContent!
    expect(css).toContain('--yj-stroke-width: 2px;')
    expect(css).toContain('--yj-shadow-hard: 1;')
    expect(css).toContain('--yj-label-case: uppercase;')

    await user.click(screen.getByRole('tab', { name: 'JS' }))
    const js = screen.getByLabelText('JS export').textContent!
    expect(js).toContain('stroke: { width: 2, ink: 1, icons: 1.3 },')
    expect(js).toContain("shadow: 'hard',")
    expect(js).toContain("labels: { case: 'upper', font: 'mono', tracking: 0.02 },")

    // Back to Clean: the character returns to the defaults, which the export leaves out.
    await choose(user, 'Style', /^Clean/)
    await waitFor(() => expect(screen.getByLabelText('JS export').textContent).not.toContain('shadow:'))
  })

  test('a two-tone chrome travels to both exports', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always">
        <ThemeBuilder />
      </YoujProvider>,
    )
    await choose(user, 'Chrome', /^Dark/)
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Chrome' })).toHaveTextContent('Dark'))
    const css = (await screen.findByLabelText('CSS export')).textContent!
    expect(css).toContain('--yj-tone-chrome-fixed: 1;')
    expect(css).toContain('--yj-tone-chrome-dark: 1;')
    await user.click(screen.getByRole('tab', { name: 'JS' }))
    expect(screen.getByLabelText('JS export').textContent).toContain("tone: { chrome: 'dark' },")
  })

  test('opens on Basalt in Clean, and its export leaves out the neutral ramp, the lift and the accent actions, which are the defaults', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always">
        <ThemeBuilder />
      </YoujProvider>,
    )
    expect(screen.getByRole('combobox', { name: 'Palette' })).toHaveTextContent('Youj')
    expect(screen.getByRole('combobox', { name: 'Style' })).toHaveTextContent('Clean')
    // The CSS panel first: once the JS tab is chosen, the CSS panel may already be gone.
    expect((await screen.findByLabelText('CSS export')).textContent).toContain('--yj-action-ink: 0;')
    await user.click(screen.getByRole('tab', { name: 'JS' }))
    const js = (await screen.findByLabelText('JS export')).textContent!
    expect(js).not.toContain('neutral:')
    expect(js).not.toContain('actions:')
  })

  test('a colour a preset tunes per mode gets a picker per mode, and the export keeps the pair', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <YoujProvider reducedMotion="always">
        <ThemeBuilder onChange={onChange} />
      </YoujProvider>,
    )
    // Youj's accent: an ultramarine in light, amber in dark.
    expect(screen.getByLabelText(/^Accent color in light mode, #/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Accent color in dark mode, #fdaa1c/i)).toBeInTheDocument()
    expect((await screen.findByLabelText('CSS export')).textContent).toContain('--yj-accent-light: oklch(0.54 0.25 268);')
    await user.click(screen.getByRole('tab', { name: 'JS' }))
    expect(screen.getByLabelText('JS export').textContent).toContain("accent: { light: 'oklch(0.54 0.25 268)', dark: 'oklch(0.8 0.165 73)' },")
  })

  test('an edit marks the style as edited, and Reset brings it back', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always">
        <ThemeBuilder initial={graphite} controlsOnly />
      </YoujProvider>,
    )
    // Graphite is the Youj palette in the Clean style.
    expect(screen.getByRole('combobox', { name: 'Palette' })).toHaveTextContent('Youj')
    expect(screen.queryByRole('button', { name: 'Reset to the Clean style' })).not.toBeInTheDocument()
    await choose(user, 'Radius', /^Medium/)
    expect(screen.getByRole('combobox', { name: 'Style' })).toHaveTextContent(/Clean.*Edited/)
    expect(screen.getByRole('combobox', { name: 'Palette' })).not.toHaveTextContent('Edited')
    await user.click(screen.getByRole('button', { name: 'Reset to the Clean style' }))
    expect(screen.getByRole('combobox', { name: 'Radius' })).toHaveTextContent('Larger')
    expect(screen.getByRole('combobox', { name: 'Style' })).not.toHaveTextContent('Edited')
  })

  test('the character is editable: shadow, label voice and title face reach the theme it reports', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <YoujProvider reducedMotion="always">
        <ThemeBuilder initial={graphite} controlsOnly onChange={onChange} />
      </YoujProvider>,
    )
    // Controls only: no previews, checks or export.
    expect(screen.queryByLabelText('CSS export')).not.toBeInTheDocument()

    await choose(user, 'Shadow', /^Hard/)
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ shadow: 'hard' }))

    // The fine-tuning waits under Advanced.
    expect(screen.queryByRole('switch', { name: 'Capitals' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Advanced/ }))
    await user.click(screen.getByRole('switch', { name: 'Capitals' }))
    expect(onChange.mock.lastCall![0].labels).toMatchObject({ case: 'upper' })
    // Label tracking reads what capitals fall back to until it's set.
    expect(screen.getAllByRole('combobox', { name: 'Tracking' }).at(-1)).toHaveTextContent('0.06em')

    await choose(user, 'Titles', /^Charter/)
    expect(onChange.mock.lastCall![0].fonts.display).toContain('Charter')
  })

  test('a typeface sets the text, title and mono faces, and loads them', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <YoujProvider reducedMotion="always">
        <ThemeBuilder initial={graphite} controlsOnly onChange={onChange} />
      </YoujProvider>,
    )
    await choose(user, 'Typeface', /^Geist/)
    expect(onChange.mock.lastCall![0].fonts).toEqual({ sans: fontById('geist')!.stack, mono: fontById('geist-mono')!.stack })
    // Opening the menu fetched the faces it shows; Inter and the system faces load nothing.
    const links = [...document.head.querySelectorAll<HTMLLinkElement>('link[data-yj-font]')].map((l) => l.dataset.yjFont)
    expect(links).toContain('geist')
    expect(links).toContain('instrument-serif')
    expect(links).not.toContain('inter')
    expect(links).not.toContain('charter')
    expect(new Set(links).size).toBe(links.length)
  })

  test('titles in a single-weight face take its weight, and give it back when they move on', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <YoujProvider reducedMotion="always">
        <ThemeBuilder initial={graphite} controlsOnly onChange={onChange} />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: /^Advanced/ }))
    await choose(user, 'Titles', /^Instrument Serif/)
    expect(onChange.mock.lastCall![0].headings.weight).toBe(400)
    await choose(user, 'Titles', /^Fraunces/)
    expect(onChange.mock.lastCall![0].headings.weight).toBe(600)
    // A new typeface replaces the titles too, and hands the weight back the same way.
    await choose(user, 'Titles', /^Instrument Serif/)
    await choose(user, 'Typeface', /^Geist/)
    expect(onChange.mock.lastCall![0].fonts.display).toBeUndefined()
    expect(onChange.mock.lastCall![0].headings.weight).toBe(600)
  })

  test('a chart palette: own colours give five series to pick, checked at 3:1 and exported; drawing from the accent takes them away', async () => {
    const user = userEvent.setup()
    const { chart: _, ...plain } = graphite
    render(
      <YoujProvider reducedMotion="always">
        <ThemeBuilder initial={defineTheme(plain)} />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: /^Advanced/ }))
    const charts = screen.getByRole('group', { name: 'Charts' })
    expect(within(charts).getByRole('combobox', { name: 'Series colors' })).toHaveTextContent('From the accent')
    expect(within(charts).queryByLabelText(/^Series 1 color/)).not.toBeInTheDocument()
    expect(screen.queryByRole('rowheader', { name: 'Chart series' })).not.toBeInTheDocument()

    // The starter is the closest palette's chart, Youj's, tuned per mode: each series has a color for light and one for dark.
    await choose(user, 'Series colors', /^Own colors/)
    for (let i = 1; i <= 5; i++) {
      expect(within(charts).getByLabelText(new RegExp(`^Series ${i} color in light mode`))).toBeInTheDocument()
      expect(within(charts).getByLabelText(new RegExp(`^Series ${i} color in dark mode`))).toBeInTheDocument()
    }
    expect(screen.getByRole('rowheader', { name: 'Chart series' })).toBeInTheDocument()
    expect((await screen.findByLabelText('CSS export')).textContent).toContain('--yj-chart-1-light: oklch(0.54 0.22 266);')
    expect((await screen.findByLabelText('CSS export')).textContent).toContain('--yj-chart-1-dark: oklch(0.9 0.2 129);')
    await user.click(screen.getByRole('tab', { name: 'JS' }))
    expect(screen.getByLabelText('JS export').textContent).toContain("chart: { light: ['oklch(0.54 0.22 266)', ")

    await choose(user, 'Series colors', /^From the accent/)
    expect(within(charts).queryByLabelText(/^Series 1 color/)).not.toBeInTheDocument()
    expect(screen.getByLabelText('JS export').textContent).not.toContain('chart:')
  })

  test('controlled, it shows the theme it is given', async () => {
    const user = userEvent.setup()
    const value = { id: 'acme', name: 'Acme', accent: '#e5484d', shadow: 'none', stroke: { width: 2 } } as const
    render(
      <YoujProvider reducedMotion="always">
        <ThemeBuilder controlsOnly value={value} onChange={() => {}} />
      </YoujProvider>,
    )
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Acme')
    expect(screen.getByRole('combobox', { name: 'Shadow' })).toHaveTextContent('None')
    await user.click(screen.getByRole('button', { name: /^Advanced/ }))
    const lines = screen.getByRole('group', { name: 'Lines' })
    expect(within(lines).getByRole('combobox', { name: 'Width' })).toHaveTextContent('2px')
  })
})
