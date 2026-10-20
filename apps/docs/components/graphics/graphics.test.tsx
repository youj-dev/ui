import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { useMotionValue } from 'motion/react'
import { YoujProvider } from '@youj/core'
import { IconLayers, LayerStack, ThemeLayers, type StackLayer } from '@/components/graphics'

/* jsdom has neither observer. The stack measures in a ResizeObserver's first callback (after layout, as a browser
 * delivers it once observing starts), so this one delivers that callback; the IntersectionObserver only needs to exist. */
class Sizes {
  private watched = new Set<Element>()
  constructor(private callback: ResizeObserverCallback) {}
  observe(target: Element) {
    this.watched.add(target)
    setTimeout(() => {
      if (this.watched.has(target)) this.callback([{ target } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver)
    })
  }
  unobserve(target: Element) {
    this.watched.delete(target)
  }
  disconnect() {
    this.watched.clear()
  }
}
class Observer {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
beforeAll(() => {
  globalThis.ResizeObserver = Sizes as unknown as typeof ResizeObserver
  globalThis.IntersectionObserver ??= Observer as unknown as typeof IntersectionObserver
})

const frames = () => act(() => new Promise((resolve) => setTimeout(resolve, 60)))

const LAYERS: StackLayer[] = [
  { id: 'base', name: 'Base', content: <p>base plane</p> },
  { id: 'top', name: 'Top', detail: 'what it adds', content: <p>top plane</p> },
]

function Stack({ e }: { e: number }) {
  const explode = useMotionValue(e)
  return <LayerStack layers={LAYERS} explode={explode} width={200} height={120} assembled={<button type="button">Working</button>} />
}

describe('LayerStack', () => {
  it('keeps the planes and labels out of the accessibility tree, and the working thing in it', () => {
    const { container } = render(<Stack e={0} />)
    expect(screen.getByRole('button', { name: 'Working' })).toBeInTheDocument()
    for (const plane of container.querySelectorAll('[data-stack-layer]')) {
      expect(plane.closest('[aria-hidden="true"]')).not.toBeNull()
      expect(plane.querySelector('[inert]')).not.toBeNull()
    }
    expect(screen.getByText('Top').closest('[aria-hidden="true"]')).not.toBeNull()
  })

  it('makes the working thing inert once the stack comes apart, and live again when it assembles', async () => {
    function Driven() {
      const explode = useMotionValue(0)
      return (
        <>
          <button type="button" onClick={() => explode.set(1)}>
            apart
          </button>
          <button type="button" onClick={() => explode.set(0)}>
            together
          </button>
          <LayerStack layers={LAYERS} explode={explode} width={200} height={120} assembled={<button type="button">Working</button>} />
        </>
      )
    }
    render(<Driven />)
    const working = () => screen.getByText('Working').parentElement!
    await frames()
    expect(working().inert).toBeFalsy()
    fireEvent.click(screen.getByText('apart'))
    await frames()
    expect(working().inert).toBe(true)
    fireEvent.click(screen.getByText('together'))
    await frames()
    expect(working().inert).toBe(false)
  })

  it('stops painting once it unmounts', async () => {
    let explode: ReturnType<typeof useMotionValue<number>> | undefined
    function Probe() {
      explode = useMotionValue(0)
      return <LayerStack layers={LAYERS} explode={explode} width={200} height={120} />
    }
    const { unmount } = render(<Probe />)
    unmount()
    expect(() => explode!.set(1)).not.toThrow()
    await frames()
  })
})

describe('IconLayers', () => {
  it('describes the icon it has pulled apart, and follows the picker', () => {
    render(<IconLayers />)
    expect(screen.getByRole('figure')).toHaveAccessibleName(/light and dark icon pulled apart/)
    fireEvent.click(within(screen.getByRole('group', { name: 'Icon' })).getByRole('button', { name: 'Lock' }))
    expect(screen.getByRole('figure')).toHaveAccessibleName(/lock icon pulled apart.*locked state.*unlocked state/)
  })

  it('assembles into a key that switches the icon between its states', () => {
    render(<IconLayers />)
    const key = screen.getByRole('button', { name: 'light or dark' })
    expect(key).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(key)
    expect(key).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('ThemeLayers', () => {
  /** jsdom lays nothing out: the viewport is as tall as a test says. */
  const viewport = (height: number) => Object.defineProperty(document.documentElement, 'clientHeight', { value: height, configurable: true })
  const scene = (figure: HTMLElement) => figure.querySelector('[data-stack-layer]')!.closest('.isolate')!.parentElement!
  afterEach(() => viewport(0))

  it('arrives apart, the diagram, and folds into the working card from the toggle', async () => {
    viewport(900)
    render(<ThemeLayers />)
    const view = screen.getByRole('group', { name: 'View' })
    expect(within(view).getByRole('button', { name: 'Layers' })).toHaveAttribute('aria-pressed', 'true')
    await frames()
    // Apart, the planes are pictures and the working card is out of reach.
    expect(screen.queryByRole('button', { name: 'Invite' })).toBeNull()

    fireEvent.click(within(view).getByRole('button', { name: 'Assembled' }))
    expect(within(view).getByRole('button', { name: 'Assembled' })).toHaveAttribute('aria-pressed', 'true')
    expect(await screen.findByRole('button', { name: 'Invite' }, { timeout: 2000 })).toBeInTheDocument()
  })

  it('pins while the viewport has room for the whole scene, and scrolls by where it has none or under reduced motion', () => {
    viewport(900)
    const { unmount } = render(<ThemeLayers />)
    expect(scene(screen.getByRole('figure'))).toHaveClass('sticky')
    unmount()

    viewport(300)
    const short = render(<ThemeLayers />)
    expect(scene(screen.getByRole('figure'))).not.toHaveClass('sticky')
    short.unmount()

    viewport(900)
    render(
      <YoujProvider reducedMotion="always">
        <ThemeLayers />
      </YoujProvider>,
    )
    expect(scene(screen.getByRole('figure'))).not.toHaveClass('sticky')
  })

  it('lets go of the viewport when it unmounts', () => {
    viewport(900)
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<ThemeLayers />)
    const resize = add.mock.calls.filter(([type]) => type === 'resize').map(([, listener]) => listener)
    expect(resize.length).toBeGreaterThan(0)
    unmount()
    for (const listener of resize) expect(remove).toHaveBeenCalledWith('resize', listener)
    add.mockRestore()
    remove.mockRestore()
  })

  it('marks the swatch the card is headed for, so a change of mind mid-trip always counts', () => {
    viewport(900)
    render(<ThemeLayers />)
    const theme = within(screen.getByRole('group', { name: 'Theme' }))
    fireEvent.click(theme.getByRole('button', { name: 'Basalt' }))
    // On its way, still in Graphite, but headed for Basalt.
    expect(screen.getByRole('figure')).toHaveAccessibleName(/It is in Graphite now/)
    expect(theme.getByRole('button', { name: 'Basalt' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(theme.getByRole('button', { name: 'Terminal' }))
    expect(theme.getByRole('button', { name: 'Terminal' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('sends the card to a preset from a swatch: instantly under reduced motion', () => {
    render(
      <YoujProvider reducedMotion="always">
        <ThemeLayers />
      </YoujProvider>,
    )
    expect(screen.getByRole('figure')).toHaveAccessibleName(/It is in Graphite now/)
    fireEvent.click(within(screen.getByRole('group', { name: 'Theme' })).getByRole('button', { name: 'Basalt' }))
    expect(screen.getByRole('figure')).toHaveAccessibleName(/It is in Basalt now/)
  })
})
