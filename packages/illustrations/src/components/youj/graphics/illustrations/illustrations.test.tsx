import { render } from '@testing-library/react'
import { YoujProvider } from '@youj/core'
import { installObservers, liveObservers, renderReduced } from '@youj/core/test-utils'
import { IsoScene } from '../iso-scene'
import { Lathe, Prism, rect } from './kit'
import { getIllustration, Illustration, illustrationCategories, illustrations, isIllustrationId } from './registry'

beforeAll(installObservers)

const sceneOf = (container: HTMLElement) => container.querySelector('svg[data-slot=iso-scene]')

describe('illustrations', () => {
  test('lists each scene once, each in a listed category, and every category has at least three', () => {
    const ids = illustrations.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.length).toBeGreaterThanOrEqual(52)
    const categories = illustrationCategories.map((c) => c.id)
    expect(new Set(categories).size).toBe(categories.length)
    for (const { category } of illustrations) expect(categories).toContain(category)
    for (const category of categories) expect(illustrations.filter((i) => i.category === category).length).toBeGreaterThanOrEqual(3)
  })

  test('entries keep the shape pickers read: an id, a name and a category', () => {
    for (const entry of illustrations) {
      expect(entry.id).toMatch(/^[a-z]+(-[a-z]+)*$/)
      expect(entry.name.length).toBeGreaterThan(0)
      expect(typeof entry.Component).toBe('function')
    }
  })

  test.each(illustrations.map((i) => [i.id, i] as const))('%s renders its scene, decorative by default', (id, { Component }) => {
    const { container } = renderReduced(<Component />)
    const svg = sceneOf(container)!
    expect(svg).toHaveAttribute('data-illustration', id)
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    // Something is drawn: faces, not an empty stage.
    expect(svg.querySelectorAll('polygon, path, ellipse').length).toBeGreaterThan(4)
  })

  test('every scene frames the same volume, so one swaps for another without the layout moving', () => {
    const boxes = new Set(
      illustrations.map(({ Component }) => {
        const { container, unmount } = renderReduced(<Component />)
        const box = sceneOf(container)!.getAttribute('viewBox')
        unmount()
        return box
      }),
    )
    expect(boxes.size).toBe(1)
    // Renders every scene in turn; under coverage on a shared runner that can pass the file's 20s.
  }, 60_000)

  test('a title makes it a named image', () => {
    const { getByRole } = renderReduced(<Illustration scene="deploy" title="Deploying your site" description="A rocket over its pad" />)
    const img = getByRole('img', { name: 'Deploying your site' })
    expect(img).toHaveAccessibleDescription('A rocket over its pad')
    expect(img).not.toHaveAttribute('aria-hidden')
  })

  test('under reduced motion every scene is finished and still: nothing hidden, nothing raised', () => {
    for (const { Component } of illustrations) {
      const { container, unmount } = renderReduced(<Component assemble float />)
      for (const g of container.querySelectorAll('g')) {
        const { opacity, transform } = (g as SVGGElement).style
        expect(opacity).not.toBe('0')
        expect(transform).not.toMatch(/translateY\((?!0px\))/)
      }
      unmount()
    }
    // Every registered scene, rendered one after another: give it room on a busy machine.
  }, 30_000)

  test('with motion, parts wait out of sight until the scene is seen', () => {
    const saved = globalThis.IntersectionObserver
    globalThis.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    } as never
    const { container } = render(
      <YoujProvider reducedMotion="never">
        <Illustration scene="database" />
      </YoujProvider>,
    )
    const hidden = [...container.querySelectorAll('svg > g')].filter((g) => (g as SVGGElement).style.opacity === '0')
    expect(hidden.length).toBeGreaterThan(0)
    globalThis.IntersectionObserver = saved
  })

  test('stops observing and floating on unmount', () => {
    const before = liveObservers.size
    const { unmount } = render(
      <YoujProvider reducedMotion="never">
        <Illustration scene="team" />
      </YoujProvider>,
    )
    expect(liveObservers.size).toBeGreaterThan(before)
    unmount()
    expect(liveObservers.size).toBe(before)
  })
})

describe('Illustration', () => {
  test('draws a scene by id', () => {
    const { container } = renderReduced(<Illustration scene="mail" />)
    expect(sceneOf(container)).toHaveAttribute('data-illustration', 'mail')
  })

  test('falls back when the id is left out or unknown', () => {
    const { container, rerender } = renderReduced(<Illustration fallback="search" />)
    expect(sceneOf(container)).toHaveAttribute('data-illustration', 'search')
    rerender(<Illustration scene="no-such-scene" fallback="empty" />)
    expect(sceneOf(container)).toHaveAttribute('data-illustration', 'empty')
  })

  test('draws a node as given, and nothing for null', () => {
    const { container, rerender } = renderReduced(<Illustration scene={<span data-testid="own">mine</span>} fallback="mail" />)
    expect(container.querySelector('[data-testid=own]')).toBeInTheDocument()
    expect(sceneOf(container)).toBeNull()
    rerender(<Illustration scene={null} fallback="mail" />)
    // The provider's wrapper is all that's left.
    expect(container.firstElementChild).toBeEmptyDOMElement()
  })

  test('scenes are gray until colors reaches the stage', () => {
    const { container, rerender } = renderReduced(<Illustration scene="warehouse" />)
    expect(sceneOf(container)).not.toHaveAttribute('data-yj-colors')
    rerender(<Illustration scene="warehouse" colors="theme" />)
    expect(sceneOf(container)).toHaveAttribute('data-yj-colors')
    rerender(<Illustration scene="warehouse" colors={['teal']} />)
    expect(sceneOf(container)).toHaveStyle({ '--kg-c1': 'teal' })
  })

  test('isIllustrationId and getIllustration know the registered ids only', () => {
    expect(isIllustrationId('server-rack')).toBe(true)
    expect(isIllustrationId('Server rack')).toBe(false)
    expect(isIllustrationId(undefined)).toBe(false)
    expect(getIllustration('cloud')?.name).toBe('Cloud regions')
    expect(getIllustration('nope')).toBeUndefined()
  })
})

describe('the kit', () => {
  const draw = (node: React.ReactNode) => renderReduced(<IsoScene size={[8, 8, 3]}>{node}</IsoScene>).container

  test('a Prism draws its front face and only the sides that face you, as a box does', () => {
    // A square profile on the left plane, extruded toward +y: its top and its +x side show, never its bottom or its -x side.
    const container = draw(<Prism plane="left" at={[2, 2, 0]} points={rect(0, 0, 2, 2)} depth={2} />)
    expect(container.querySelectorAll('polygon')).toHaveLength(3)
  })

  test('a Prism says where it stands on each plane, so the scene can order it', () => {
    const points = rect(0.5, 0.25, 2, 1)
    expect(Prism.isoBounds!({ plane: 'left', at: [1, 2, 3], points, depth: 0.4 })).toEqual({ x: 1.5, y: 2, z: 3.25, w: 2, d: 0.4, h: 1 })
    expect(Prism.isoBounds!({ plane: 'right', at: [1, 2, 3], points, depth: 0.4 })).toEqual({ x: 1, y: 2.5, z: 3.25, w: 0.4, d: 2, h: 1 })
    expect(Prism.isoBounds!({ plane: 'top', at: [1, 2, 3], points, depth: 0.4 })).toEqual({ x: 1.5, y: 2.25, z: 3, w: 2, d: 1, h: 0.4 })
  })

  test('a Lathe laid down runs along its axis from where it starts', () => {
    const profile = [
      [0.5, 0],
      [0.5, 3],
    ] as const
    expect(Lathe.isoBounds!({ cx: 1, cy: 4, z: 2, profile, axis: 'x' })).toEqual({ x: 1, y: 3.5, z: 1.5, w: 3, d: 1, h: 1 })
    expect(Lathe.isoBounds!({ cx: 4, cy: 1, z: 2, profile, axis: 'y' })).toEqual({ x: 3.5, y: 1, z: 1.5, w: 1, d: 3, h: 1 })
    expect(Lathe.isoBounds!({ cx: 4, cy: 4, z: 0, profile })).toEqual({ x: 3.5, y: 3.5, z: 0, w: 1, d: 1, h: 3 })
  })

  test('a laid-down Lathe draws its outline and the end that faces you', () => {
    const container = draw(<Lathe axis="x" cx={1} cy={4} z={1} profile={[[0.6, 0], [0.6, 2]]} />)
    // The hull of its rings, and its +x end on it.
    expect(container.querySelectorAll('polygon')).toHaveLength(2)
    expect(container.querySelector('linearGradient')).toHaveAttribute('gradientUnits', 'userSpaceOnUse')
  })
})
