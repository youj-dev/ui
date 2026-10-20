import { illustrationCategories, illustrations } from '@youj/illustrations'
import { categoryEntries, componentName, indexScenes, sceneEntries, searchScenes } from './catalog'
import { contextFor, contextLabel } from './context-copy'
import { fileName, paintOf, serializeScene, type ColorProbe } from './export'
import { DEFAULT_QUERY, parseQuery, serializeQuery } from './query'
import { motionState } from './hero'
import { byIdSnippet, copiedSnippet, directSnippet, itemName } from './snippets'

const scenes = sceneEntries()
const find = (q: string) => searchScenes(indexScenes(scenes), q).map((s) => s.id)

describe('the catalog', () => {
  it('is the registry: every scene, in its order, under its category', () => {
    expect(scenes.map((s) => s.id)).toEqual(illustrations.map((e) => e.id))
    expect(categoryEntries(scenes).map((c) => c.id)).toEqual(illustrationCategories.map((c) => c.id))
    expect(categoryEntries(scenes).reduce((sum, c) => sum + c.count, 0)).toBe(illustrations.length)
    expect(scenes.find((s) => s.id === 'coffee')).toMatchObject({ categoryName: 'Food', component: 'IllustrationCoffee' })
  })

  it('names a scene’s component by the convention its export follows, until its item says so', () => {
    expect(componentName('server-rack')).toBe('IllustrationServerRack')
    expect(componentName('not-found')).toBe('IllustrationNotFound')
    expect(sceneEntries({ coffee: { component: 'IllustrationEspresso', description: 'x' } }).find((s) => s.id === 'coffee')?.component).toBe('IllustrationEspresso')
  })
})

describe('search', () => {
  it('finds a scene by its tags, not only its name', () => {
    expect(find('cafe')[0]).toBe('coffee')
    expect(find('404')[0]).toBe('not-found')
    expect(find('luggage')[0]).toBe('suitcase')
  })

  it('finds by name and category, and forgives a typo', () => {
    expect(find('rack')[0]).toBe('server-rack')
    expect(find('finance')).toEqual(expect.arrayContaining(['payment', 'wallet', 'savings']))
    expect(find('calender')[0]).toBe('calendar')
  })

  it('needs every word to match, and an empty search is every scene in order', () => {
    expect(find('coffee rocket')).toEqual([])
    expect(find('')).toEqual(illustrations.map((e) => e.id))
  })
})

describe('the address', () => {
  it('round-trips the scene, leaving defaults out', () => {
    const state = { scene: 'coffee', strip: null }
    expect(serializeQuery(state)).toBe('scene=coffee')
    expect(parseQuery(`?${serializeQuery(state)}`)).toEqual(state)
    expect(serializeQuery(DEFAULT_QUERY)).toBe('')
  })

  it('keeps where the strip stands, and drops a place that isn’t one', () => {
    expect(serializeQuery({ ...DEFAULT_QUERY, scene: 'coffee', strip: 'column' })).toBe('scene=coffee&strip=column')
    expect(parseQuery('?strip=column').strip).toBe('column')
    expect(parseQuery('?strip=sideways').strip).toBeNull()
  })

  it('drops what isn’t an id, and what it doesn’t keep', () => {
    expect(parseQuery('?scene=<script>&q=coffee&category=food')).toEqual(DEFAULT_QUERY)
  })
})

describe('the code', () => {
  const coffee = scenes.find((s) => s.id === 'coffee')!
  it('uses the scene by id, as its component, and as the copy the CLI makes', () => {
    expect(byIdSnippet(coffee)).toBe(`import { Illustration } from '@youj/illustrations'\n\n<Illustration scene="coffee" />`)
    expect(directSnippet(coffee)).toBe(`import { IllustrationCoffee } from '@youj/illustrations'\n\n<IllustrationCoffee />`)
    expect(copiedSnippet(coffee)).toContain(`from '@/components/youj/graphics/illustrations/scenes/coffee'`)
  })

  it('says colors="theme", or the hues picked, only when the panel has colour on', () => {
    expect(byIdSnippet(coffee, { colors: 'theme' })).toContain('<Illustration scene="coffee" colors="theme" />')
    expect(byIdSnippet(coffee)).toContain('<Illustration scene="coffee" />')
    expect(byIdSnippet(coffee, { colors: ['#ff0000', ''] })).toContain(`<Illustration scene="coffee" colors={['#ff0000', '']} />`)
    expect(byIdSnippet(coffee, { colors: ['', ''] })).toContain('<Illustration scene="coffee" />')
  })

  it('installs the scene’s own item', () => {
    expect(itemName(coffee.id)).toBe('illustration-coffee')
  })
})

describe('the downloads', () => {
  /** A probe that knows a few named colors, as the canvas would resolve them. */
  const probe: ColorProbe = {
    rgba: (c) => ({ red: [255, 0, 0, 255], 'rgba(0, 0, 255, 0.5)': [0, 0, 255, 128], blue: [0, 0, 255, 255] })[c] as [number, number, number, number] ?? [0, 0, 0, 0],
  }

  it('turns any color into sRGB hex and its alpha, and keeps a gradient a reference', () => {
    expect(paintOf('red', probe)).toEqual({ paint: '#ff0000' })
    expect(paintOf('rgba(0, 0, 255, 0.5)', probe)).toEqual({ paint: '#0000ff', alpha: 0.502 })
    expect(paintOf('url("#kg-_r_1_")', probe)).toEqual({ paint: 'url(#kg-_r_1_)' })
    expect(paintOf('none', probe)).toEqual({ paint: 'none' })
  })

  it('writes the computed paint as attributes on a copy with no styles, custom properties or data attributes', () => {
    document.body.innerHTML = `<svg viewBox="-10 -5 100 80" data-slot="iso-scene" style="width:100px" aria-hidden="true" focusable="false"><title>old</title>
      <g data-slot="iso-box" style="--kg-top: var(--color-fg); transform: translateY(-4px)">
        <defs><linearGradient id="kg-_r_1_"><stop offset="0" style="stop-color: var(--kg-left)"></stop></linearGradient></defs>
        <polygon points="0,0 1,1" style="fill: var(--kg-top); stroke: var(--kg-edge); vector-effect: non-scaling-stroke; stroke-width: 1"></polygon>
        <path d="M0 0" style="fill: url(#kg-_r_1_)"></path>
      </g></svg>`
    const svg = document.querySelector('svg')!
    const styles: Record<string, Record<string, string>> = {
      g: { transform: 'matrix(1, 0, 0, 1, 0, -4)' },
      stop: { 'stop-color': 'blue' },
      polygon: { fill: 'red', stroke: 'rgba(0, 0, 255, 0.5)', 'vector-effect': 'non-scaling-stroke', 'stroke-width': '1px' },
      path: { fill: 'url("#kg-_r_1_")', stroke: 'none' },
    }
    const computed = (el: Element) => ({ getPropertyValue: (prop: string) => styles[el.tagName.toLowerCase()]?.[prop] ?? '' })
    const out = serializeScene(svg, { title: 'Coffee', scale: 2, background: 'red', probe, computed })
    const doc = new DOMParser().parseFromString(out, 'image/svg+xml')
    const root = doc.documentElement
    expect(out.startsWith('<?xml')).toBe(true)
    // A well-formed SVG document: parsed without errors, in the SVG namespace, declared once.
    expect(doc.querySelector('parsererror')).toBeNull()
    expect(root.namespaceURI).toBe('http://www.w3.org/2000/svg')
    expect(out.match(/xmlns=/g)).toHaveLength(1)
    expect([root.getAttribute('width'), root.getAttribute('height')]).toEqual(['200', '160'])
    expect(root.querySelector('title')?.textContent).toBe('Coffee')
    expect(root.querySelectorAll('title')).toHaveLength(1)
    // Nothing that only means something inside the page.
    expect(out).not.toMatch(/style=|var\(|data-|aria-|focusable/)
    const polygon = root.querySelector('polygon')!
    expect(polygon.getAttribute('fill')).toBe('#ff0000')
    expect(polygon.getAttribute('stroke')).toBe('#0000ff')
    expect(polygon.getAttribute('stroke-opacity')).toBe('0.502')
    // A hairline stays a hairline at 2×: two pixels on a canvas twice the size.
    expect(polygon.getAttribute('stroke-width')).toBe('2')
    expect(root.querySelector('path')!.getAttribute('fill')).toBe('url(#kg-_r_1_)')
    expect(root.querySelector('stop')!.getAttribute('stop-color')).toBe('#0000ff')
    expect(root.querySelector('g')!.getAttribute('transform')).toBe('matrix(1 0 0 1 0 -4)')
    // The background fills the viewBox, under everything.
    const rect = root.querySelector('rect')!
    expect([rect.getAttribute('x'), rect.getAttribute('y'), rect.getAttribute('width'), rect.getAttribute('height'), rect.getAttribute('fill')]).toEqual(['-10', '-5', '100', '80', '#ff0000'])
  })

  it('names files after the scene', () => {
    expect(fileName('coffee', 'svg')).toBe('youj-coffee.svg')
    expect(fileName('coffee', 'png')).toBe('youj-coffee.png')
    expect(fileName('coffee', 'png', 2)).toBe('youj-coffee@2x.png')
  })
})

describe('the screen a scene is shown in', () => {
  it('gives every scene a screen, with all of its words', () => {
    for (const scene of scenes) {
      const copy = contextFor(scene)
      expect(['empty', 'onboarding', 'hero']).toContain(copy.kind)
      for (const words of [copy.title, copy.heading, copy.body, copy.primary, copy.secondary]) expect(words.trim()).not.toBe('')
    }
  })

  it('gives each category a screen of its own, and the classic states theirs', () => {
    const headings = illustrationCategories.map((c) => contextFor({ id: '', category: c.id }).heading)
    expect(new Set(headings).size).toBe(illustrationCategories.length)
    expect(contextFor({ id: 'search', category: 'app' }).heading).toMatch(/^No results/)
    expect(contextFor({ id: 'not-found', category: 'lifecycle' })).toMatchObject({ kind: 'hero', title: 'Error 404' })
    expect(contextFor({ id: 'team', category: 'lifecycle' })).toMatchObject({ kind: 'onboarding', title: 'Step 2 of 3' })
  })

  it('says in words what the stage shows', () => {
    expect(contextLabel('Coffee', contextFor({ id: 'coffee', category: 'food' }))).toBe('Coffee in a website’s hero: Fresh, every morning.')
  })
})

describe('the motion readout', () => {
  it('says what the scene is doing now, reduced motion first', () => {
    const base = { still: false, assembling: false, apart: false, hovering: false }
    expect(motionState(base)).toEqual({ value: 'Floating', state: 'Point at it to take it apart' })
    expect(motionState({ ...base, touch: true }).state).toBe('Press Apart to take it apart')
    expect(motionState({ ...base, hovering: true }).value).toBe('Apart')
    expect(motionState({ ...base, apart: true }).state).toMatch(/Held apart/)
    expect(motionState({ ...base, assembling: true, hovering: true }).value).toBe('Assembling')
    expect(motionState({ still: true, assembling: true, apart: true, hovering: true }).value).toBe('Still')
  })
})
