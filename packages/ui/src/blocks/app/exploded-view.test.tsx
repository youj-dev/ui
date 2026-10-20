import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ExplodedView } from './exploded-view'
import { DEFAULT_COPY, PARTS, SPECS } from './exploded-view/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const layer = (id: string) => document.querySelector(`[data-layer=${id}]`)!

describe('ExplodedView', () => {
  test('is a section named by an h2 by default, or a page named by its h1 with embedded={false}; the drawing is a named image', () => {
    const { unmount } = reduced(<ExplodedView embedded={false} />)
    expect(screen.getByRole('main', { name: 'Relay R4' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Relay R4' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: DEFAULT_COPY.headline })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: DEFAULT_COPY.drawing })).toBeInTheDocument()
    unmount()

    reduced(<ExplodedView />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Relay R4' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Relay R4' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: DEFAULT_COPY.headline })).toBeInTheDocument()
  })

  test('opens taken apart, with every part named on the rail; Assembled puts it back together', async () => {
    const user = userEvent.setup()
    reduced(<ExplodedView />)
    const view = screen.getByRole('group', { name: 'View' })
    const exploded = within(view).getByRole('button', { name: 'Exploded' })
    const assembled = within(view).getByRole('button', { name: 'Assembled' })
    expect(exploded).toHaveAttribute('aria-pressed', 'true')
    expect(assembled).toHaveAttribute('aria-pressed', 'false')
    const labels = [...document.querySelectorAll('[data-slot=iso-callout] text')].map((t) => t.textContent)
    expect(labels).toEqual(expect.arrayContaining(['chassis', 'mainboard', 'compute module', 'heat spreader', 'lid']))
    // Reduced motion applies the separation at once: the lid, four layers up, is lifted.
    expect((layer('lid') as SVGGElement).style.transform).toMatch(/translateY\(-\d/)

    await user.click(assembled)
    expect(assembled).toHaveAttribute('aria-pressed', 'true')
    expect((layer('lid') as SVGGElement).style.transform).not.toMatch(/translateY\(-\d/)
  })

  test('lights the compute module by default, and the part a figure is about when it’s focused or hovered', async () => {
    const user = userEvent.setup()
    reduced(<ExplodedView />)
    expect(layer('compute')).toHaveAttribute('data-lit', 'true')
    const thermal = screen.getByRole('button', { name: /Thermal/ })
    expect(thermal).toHaveAccessibleDescription('Shows the heat spreader in the drawing')

    // Focus the thermal figure: the heat spreader lights, and the compute module steps down.
    act(() => thermal.focus())
    expect(layer('spreader')).toHaveAttribute('data-lit', 'true')
    expect(layer('compute')).not.toHaveAttribute('data-lit')
    expect(thermal).toHaveAttribute('data-lit', 'true')
    act(() => thermal.blur())
    expect(layer('compute')).toHaveAttribute('data-lit', 'true')

    // A mouse over the power figure lights the chassis until it leaves.
    const power = screen.getByRole('button', { name: /Power/ })
    await user.hover(power)
    expect(layer('chassis')).toHaveAttribute('data-lit', 'true')
    await user.unhover(power)
    expect(layer('compute')).toHaveAttribute('data-lit', 'true')
  })

  test('every string passes through copy: the parts and the figures included', () => {
    reduced(
      <ExplodedView
        copy={{
          title: 'Relais R4',
          lights: (part) => `Zeigt ${part} in der Zeichnung`,
        }}
        parts={PARTS.map((part) => (part.id === 'lid' ? { ...part, name: 'Deckel', detail: 'vier Schrauben' } : part))}
        specs={SPECS.map((spec) => (spec.id === 'ingress' ? { ...spec, label: 'Schutzart' } : spec))}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Relais R4' })).toBeInTheDocument()
    expect([...document.querySelectorAll('[data-slot=iso-callout] text')].map((t) => t.textContent)).toContain('Deckel')
    expect(screen.getByRole('button', { name: /Schutzart/ })).toHaveAccessibleDescription('Zeigt Deckel in der Zeichnung')
  })

  test('ordering runs the caller’s action and says so', async () => {
    const user = userEvent.setup()
    const onOrder = vi.fn(() => Promise.resolve())
    reduced(<ExplodedView onOrder={onOrder} />)
    await user.click(screen.getByRole('button', { name: 'Order module' }))
    expect(onOrder).toHaveBeenCalledTimes(1)
    expect(await screen.findByText(DEFAULT_COPY.orderedAnnounce)).toBeInTheDocument()
  })

  test('your specs and parts drive the spec sheet, the rail and which layer a figure lights', async () => {
    const user = userEvent.setup()
    reduced(
      <ExplodedView
        parts={PARTS.map((part) => (part.id === 'compute' ? { ...part, name: 'compute module Pro', detail: 'swappable, 40 TOPS' } : part))}
        specs={[
          { id: 'npu', label: 'NPU', figures: [['40', 'TOPS']], part: 'compute' },
          { id: 'ports', label: 'Ports', figures: [['4 × 2.5', 'GbE']], part: 'mainboard' },
        ]}
      />,
    )
    expect(screen.getAllByRole('button', { name: /TOPS|GbE/ })).toHaveLength(2)
    expect(screen.queryByRole('button', { name: /Thermal/ })).not.toBeInTheDocument()
    expect([...document.querySelectorAll('[data-slot=iso-callout] text')].map((t) => t.textContent)).toContain('compute module Pro')
    expect(screen.getAllByText('compute module Pro').length).toBeGreaterThan(0)
    const ports = screen.getByRole('button', { name: /Ports/ })
    expect(ports).toHaveAccessibleDescription('Shows the mainboard in the drawing')
    await user.hover(ports)
    expect(layer('mainboard')).toHaveAttribute('data-lit', 'true')
  })
})
