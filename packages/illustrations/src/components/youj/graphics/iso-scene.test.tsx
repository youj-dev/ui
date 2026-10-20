import { fireEvent, render } from '@testing-library/react'
import { YoujProvider } from '@youj/core'
import { installObservers, liveObservers, renderFull, renderReduced } from '@youj/core/test-utils'
import { IsoBox } from './iso-box'
import { IsoCylinder } from './iso-cylinder'
import { IsoPlatform } from './iso-platform'
import { IsoScene } from './iso-scene'
import { IsoStack } from './iso-stack'
import { DotGrid, IsoFloor, IsoGrid, LineGrid } from './grids'
import { KIT_CSS } from './tones'

beforeAll(installObservers)

const LAYERS = [
  { id: 'base', h: 0.5, label: 'base' },
  { id: 'core', h: 0.5, label: 'core', detail: 'the part that matters', lit: true },
  { id: 'lid', h: 0.5, label: 'lid', variant: 'wire' as const },
]

describe('IsoScene', () => {
  test('is decorative by default: aria-hidden, no role', () => {
    const { container } = renderReduced(
      <IsoScene>
        <IsoBox x={0} y={0} w={1} d={1} h={1} />
      </IsoScene>,
    )
    const svg = container.querySelector('svg[data-slot=iso-scene]')!
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).not.toHaveAttribute('role')
  })

  test('a title makes it a named image, with a description', () => {
    const { getByRole } = renderReduced(
      <IsoScene title="An empty bay" description="Nothing is stored here yet">
        <IsoBox x={0} y={0} w={1} d={1} h={0} variant="ghost" />
      </IsoScene>,
    )
    const img = getByRole('img', { name: 'An empty bay' })
    expect(img).toHaveAccessibleDescription('Nothing is stored here yet')
    expect(img).not.toHaveAttribute('aria-hidden')
  })

  test('draws its shapes far to near whatever order they’re written in, and keeps other children in place', () => {
    const { container } = renderReduced(
      <IsoScene>
        <IsoFloor w={6} d={6} />
        <IsoBox x={4} y={4} w={1} d={1} h={1} data-testid="near" />
        <IsoCylinder x={0} y={0} r={0.5} h={3} data-testid="far" />
        <IsoBox x={2} y={2} w={1} d={1} h={1} data-testid="middle" />
      </IsoScene>,
    )
    const order = [...container.querySelectorAll('[data-slot=iso-floor], [data-testid]')].map((el) => el.getAttribute('data-testid') ?? 'floor')
    expect(order).toEqual(['floor', 'far', 'middle', 'near'])
  })

  test('frames the exploded extent, so a stack apart is never clipped', () => {
    const heights = (explodeGap: number) => {
      const { container, unmount } = renderReduced(
        <IsoScene pad={0} rail={false}>
          <IsoStack x={0} y={0} w={2} d={2} gap={explodeGap} layers={LAYERS} />
        </IsoScene>,
      )
      const [, , , h] = container.querySelector('svg')!.getAttribute('viewBox')!.split(' ').map(Number)
      unmount()
      return h!
    }
    // Two gaps of travel for three layers: 2 × (2 - 1) grid units at 24 px.
    expect(heights(2) - heights(1)).toBeCloseTo(48, 0)
  })

  test('keeps a rail for callouts beside the drawing, on the side text reads toward', () => {
    const { container } = renderReduced(
      <IsoScene pad={0} explode={1}>
        <IsoStack x={0} y={0} w={2} d={2} layers={LAYERS} />
      </IsoScene>,
    )
    const [x, , width] = container.querySelector('svg')!.getAttribute('viewBox')!.split(' ').map(Number)
    const labels = [...container.querySelectorAll('[data-slot=iso-callout] text')]
    expect(labels.map((t) => t.textContent)).toEqual(['base', 'core', 'the part that matters', 'lid'])
    // Every leader ends at the drawing's edge, where the rail begins, and the rail is inside the viewBox.
    const ends = [...container.querySelectorAll('[data-slot=iso-callout] line')].map((l) => Number(l.getAttribute('x2')))
    expect(new Set(ends).size).toBe(1)
    expect(ends[0]).toBeLessThan(x! + width!)
  })

  test('under reduced motion, nothing starts raised or hidden, and the separation is applied at once', () => {
    const { container } = renderReduced(
      <IsoScene assemble explode={1}>
        <IsoStack x={0} y={0} w={2} d={2} gap={1} layers={LAYERS} />
      </IsoScene>,
    )
    for (const g of container.querySelectorAll('g')) {
      expect((g as SVGGElement).style.opacity).not.toBe('0')
    }
    const lid = container.querySelector('[data-layer=lid]') as SVGGElement
    // Two layers below it, one gap each, 24 px a gap: straight up by 48.
    expect(lid.style.transform).toContain('translateY(-48px)')
  })

  test('with motion, assembling shapes wait out of sight until the scene is seen', () => {
    // Observers report nothing, so the scene is never in view.
    const saved = globalThis.IntersectionObserver
    globalThis.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    } as never
    const { container } = renderFull(
      <IsoScene assemble>
        <IsoBox x={0} y={0} w={1} d={1} h={1} />
      </IsoScene>,
    )
    const piece = container.querySelector('[data-slot=iso-scene] > g') as SVGGElement
    expect(piece.style.opacity).toBe('0')
    globalThis.IntersectionObserver = saved
  })

  test('a scene that stops assembling after mount (reduced motion read late) stands finished, not hidden', async () => {
    const saved = globalThis.IntersectionObserver
    globalThis.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    } as never
    const scene = (assemble: boolean) => (
      <YoujProvider reducedMotion="never">
        <IsoScene assemble={assemble}>
          <IsoBox x={0} y={0} w={1} d={1} h={1} />
        </IsoScene>
      </YoujProvider>
    )
    const { container, rerender } = render(scene(true))
    const piece = container.querySelector('[data-slot=iso-scene] > g') as SVGGElement
    expect(piece.style.opacity).toBe('0')
    rerender(scene(false))
    await vi.waitFor(() => {
      for (const g of container.querySelectorAll('g')) expect((g as SVGGElement).style.opacity).not.toBe('0')
    })
    expect(container.querySelector('[data-slot=iso-box]')).toBeInTheDocument()
    globalThis.IntersectionObserver = saved
  })

  describe('at rest it is static SVG', () => {
    // Motion's groups are the only <g>s it styles with a fill-box transform origin.
    const motionGroups = (root: Element) => [...root.querySelectorAll('g')].filter((g) => (g as SVGGElement).style.transformBox === 'fill-box')
    const neverInView = () => {
      const saved = globalThis.IntersectionObserver
      globalThis.IntersectionObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() {
          return []
        }
      } as never
      return () => void (globalThis.IntersectionObserver = saved)
    }
    const resting = (
      <IsoScene explode="hover">
        <IsoPlatform x={0} y={0} w={4} d={4} grid={1} />
        <IsoBox x={1} y={1} z={0.7} w={1} d={1} h={1} float lift={1} tone="accent" />
        <IsoBox x={3} y={0} w={1} d={1} h={1} color="var(--color-chart-2)" variant="wire" />
        <IsoCylinder x={0} y={3} r={0.5} h={1} lift={0.5} />
        <IsoStack x={5} y={0} w={2} d={2} layers={LAYERS} />
      </IsoScene>
    )

    test('a resting scene renders no motion elements, and its colours are classes', () => {
      const restore = neverInView()
      const { container } = renderFull(resting)
      restore()
      const shapes = [...container.querySelectorAll('[data-slot=iso-box], [data-slot=iso-cylinder]')]
      expect(shapes.length).toBeGreaterThan(0)
      expect(motionGroups(container)).toEqual([])
      // Faces and hairlines carry classes from the kit's one sheet, not a style string each.
      for (const shape of shapes) {
        expect(shape.outerHTML).not.toContain('color-mix')
        expect(shape.outerHTML).not.toContain('vector-effect')
      }
      expect(container.querySelector('[data-slot=iso-box].kg-accent')).toHaveClass('kg-solid', 'kg-ink')
      expect(container.querySelector('[data-slot=iso-box].kg-wire')).toHaveStyle({ '--kg-ink': 'var(--color-chart-2)' })
      expect(document.head.querySelectorAll('style[data-href="youj-iso-kit"]')).toHaveLength(1)
    })

    test('two scenes share the one stylesheet', () => {
      render(
        <>
          {resting}
          {resting}
        </>,
      )
      expect(document.head.querySelectorAll('style[data-href="youj-iso-kit"]')).toHaveLength(1)
    })

    test('a hover mounts the rise on the shapes that lift, and keeps it for the way back down', async () => {
      const restore = neverInView()
      const { container } = renderFull(resting)
      restore()
      const svg = container.querySelector('svg')!
      fireEvent.pointerEnter(svg, { pointerType: 'mouse' })
      // The lifting box, the lifting cylinder and the stack's two upper layers (the first doesn't travel, but follows).
      await vi.waitFor(() => expect(motionGroups(container).length).toBeGreaterThanOrEqual(4))
      expect(container.querySelectorAll('[data-slot=iso-callout]').length).toBe(3)
      const moving = motionGroups(container).length
      fireEvent.pointerLeave(svg)
      await vi.waitFor(() => expect(motionGroups(container).length).toBe(moving))
    })

    test('once in view, a floating shape bobs in CSS (no script per frame) and assembling shapes drop in', async () => {
      const { container } = renderFull(
        <IsoScene assemble>
          <IsoBox x={0} y={0} w={1} d={1} h={1} float />
          <IsoBox x={2} y={0} w={1} d={1} h={1} />
        </IsoScene>,
      )
      // Both drop in (two motion groups); the floating one bobs inside its drop on a CSS animation, which a script never ticks.
      await vi.waitFor(() => expect(motionGroups(container)).toHaveLength(2))
      const bob = container.querySelector('.kg-bob')!
      expect(bob).toBeInTheDocument()
      expect(container.querySelector('svg')).not.toHaveAttribute('data-idle')
      expect(KIT_CSS).toMatch(/\[data-idle\] \.kg-bob\{animation-play-state:paused\}/)
    })

    test('a floating scene that is off screen pauses its bob', () => {
      const restore = neverInView()
      const { container } = renderFull(
        <IsoScene>
          <IsoBox x={0} y={0} w={1} d={1} h={1} float />
        </IsoScene>,
      )
      restore()
      expect(container.querySelector('svg')).toHaveAttribute('data-idle')
    })
  })

  describe('colour', () => {
    test('a hue is classes on a neutral tone, so the theme repaints it and a scene without colors keeps the tone', () => {
      const { container } = renderReduced(
        <IsoScene>
          <IsoBox x={0} y={0} w={1} d={1} h={1} tone="raised" hue={2} />
          <IsoBox x={2} y={0} w={1} d={1} h={1} tone="accent" hue={1} />
        </IsoScene>,
      )
      const [hued, accent] = container.querySelectorAll('[data-slot=iso-box]')
      expect(hued).toHaveClass('kg-solid', 'kg-raised', 'kg-hue', 'kg-h2')
      expect(hued!.getAttribute('style')).toBeNull()
      // The accent stays the accent: a hue never colours an inked tone.
      expect(accent).toHaveClass('kg-accent')
      expect(accent).not.toHaveClass('kg-hue')
      expect(KIT_CSS).toContain('[data-yj-colors] .kg-solid.kg-hue{')
      expect(KIT_CSS).toMatch(/--kg-hue-1:color-mix\(in oklab, var\(--kg-c1, oklch\(from var\(--color-accent\)/)
    })

    test('colors turns colour on, and a list names the hues; an empty entry takes the theme', () => {
      const { container, rerender } = renderReduced(
        <IsoScene colors={['tomato', '', 'var(--brand)']}>
          <IsoBox x={0} y={0} w={1} d={1} h={1} hue={1} />
        </IsoScene>,
      )
      const svg = container.querySelector('svg')!
      expect(svg).toHaveAttribute('data-yj-colors')
      expect(svg).toHaveStyle({ '--kg-c1': 'tomato', '--kg-c3': 'var(--brand)' })
      expect(svg.style.getPropertyValue('--kg-c2')).toBe('')
      rerender(
        <IsoScene colors="theme">
          <IsoBox x={0} y={0} w={1} d={1} h={1} hue={1} />
        </IsoScene>,
      )
      expect(container.querySelector('svg')).toHaveAttribute('data-yj-colors')
      expect(container.querySelector('svg')!.style.getPropertyValue('--kg-c1')).toBe('')
    })

    test('a scene is gray by default', () => {
      const { container } = renderReduced(
        <IsoScene>
          <IsoBox x={0} y={0} w={1} d={1} h={1} hue={1} />
        </IsoScene>,
      )
      expect(container.querySelector('svg')).not.toHaveAttribute('data-yj-colors')
    })
  })

  test('stops observing on unmount', () => {
    const before = liveObservers.size
    const { unmount } = render(
      <YoujProvider reducedMotion="never">
        <IsoScene>
          <IsoPlatform x={0} y={0} w={4} d={4} grid={1} />
          <IsoBox x={1} y={1} z={0.7} w={1} d={1} h={1} float />
        </IsoScene>
      </YoujProvider>,
    )
    expect(liveObservers.size).toBeGreaterThan(before)
    unmount()
    expect(liveObservers.size).toBe(before)
  })

  test('shapes outside a scene say so', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<IsoBox x={0} y={0} w={1} d={1} h={1} />)).toThrow(/inside <IsoScene>/)
    spy.mockRestore()
  })
})

describe('grid backdrops', () => {
  test('are decorative, ignore the pointer and fill their container', () => {
    const { container } = render(
      <div>
        <DotGrid />
        <LineGrid />
        <IsoGrid fade="none" />
      </div>,
    )
    const grids = container.querySelectorAll('svg')
    expect(grids).toHaveLength(3)
    for (const svg of grids) {
      expect(svg).toHaveAttribute('aria-hidden', 'true')
      expect(svg.getAttribute('class')).toContain('pointer-events-none')
    }
    // Each pattern gets its own id, so two grids on a page don't share one.
    const ids = [...container.querySelectorAll('pattern')].map((p) => p.id)
    expect(new Set(ids).size).toBe(3)
  })
})
