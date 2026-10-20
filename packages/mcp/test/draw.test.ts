import { join } from 'node:path'
import { decodeScene, generateCode, LATHE_PRESETS, MAX_PARTS, PART_TYPES, PRISM_PRESETS, TEMPLATES, toJson, type BuilderScene } from '@youj/illustrations/builder'
import { beforeAll, describe, expect, it } from 'vitest'
import { Catalog } from '../src/catalog'
import { loadCatalog } from '../src/data'
import { builderLink, checkScene, drawIllustration, illustrationGuide, sceneWarnings } from '../src/tools/draw'

let catalog: Catalog
beforeAll(() => {
  catalog = loadCatalog()
})
const fixtures = join(import.meta.dirname, 'fixtures')
const template = (id: string) => TEMPLATES.find((t) => t.id === id)!.scene
/** The scene as an agent sends it: plain JSON. */
const json = (scene: BuilderScene) => JSON.parse(toJson(scene)) as Record<string, unknown>
const box = (extra: Record<string, unknown> = {}) => ({ type: 'box', x: 3, y: 3, z: 0.5, w: 2, d: 2, h: 1, ...extra })
const problems = (scene: unknown) => checkScene(scene).problems

describe('get_illustration_guide', () => {
  it('covers every part type, preset, shade, variant and base in the model', () => {
    const guide = illustrationGuide(catalog)
    for (const t of PART_TYPES) expect(guide, t).toContain(`| \`${t}\` |`)
    for (const p of [...PRISM_PRESETS, ...LATHE_PRESETS]) expect(guide, p).toContain(`\`${p}\``)
    for (const word of ['neutral', 'raised', 'sunken', 'solid', 'wire', 'ghost', 'plinth', 'turntable', 'dots', `At most ${MAX_PARTS} parts`]) expect(guide).toContain(word)
    expect(guide).toContain('list_illustrations')
  })

  it('gives worked examples from the templates that draw as they are', () => {
    const guide = illustrationGuide(catalog)
    const examples = [...guide.matchAll(/```json\n([\s\S]*?)```/g)].map(([, body]) => JSON.parse(body!))
    expect(examples.length).toBeGreaterThanOrEqual(2)
    for (const example of examples) {
      const { scene, problems } = checkScene(example)
      expect(problems).toEqual([])
      expect(scene).toEqual(template(scene!.name.toLowerCase()))
    }
  })
})

describe('draw_illustration', () => {
  it('draws a template with the builder’s own code on the registry route', () => {
    const desk = template('desk')
    const drawn = drawIllustration(catalog, json(desk), { cwd: join(fixtures, 'registry') })
    expect(drawn.isError).toBe(false)
    expect(drawn.code).toBe(generateCode(desk, { link: drawn.link }))
    expect(drawn.text).toContain(drawn.code!.trimEnd())
    expect(drawn.link).toBe(`${catalog.index.meta.site}/illustrations/build?name=Desk&s=${drawn.link!.split('s=')[1]}`)
    expect(drawn.text).toContain('npx youj add illustration-kit iso-shapes')
    expect(drawn.text).toContain('`components/illustrations/desk.tsx`')
  })

  it('gives the same copy-in source on the package route, since the builder is not published', () => {
    const drawn = drawIllustration(catalog, json(template('workshop')), { cwd: join(fixtures, 'package') })
    expect(drawn.code).toBe(generateCode(template('workshop'), { link: drawn.link }))
    expect(drawn.code).not.toContain('@youj/illustrations/builder')
    expect(drawn.text).toContain('npx youj add illustration-kit')
    expect(drawn.text).toContain('`src/components/illustrations/workshop.tsx`')
  })

  it('names the component', () => {
    for (const name of ['Empty inbox', 'IllustrationEmptyInbox', 'EmptyInbox']) {
      expect(drawIllustration(catalog, json(template('stack')), { name, cwd: join(fixtures, 'registry') }).code).toContain('export function IllustrationEmptyInbox(')
    }
  })

  it('links to the builder so decoding the link gives the same scene', () => {
    for (const { scene } of TEMPLATES) {
      const link = new URL(builderLink(catalog.index.meta.site, scene))
      expect(link.pathname).toBe('/illustrations/build')
      expect(decodeScene(link.searchParams.get('s')!, link.searchParams.get('name'))).toEqual(scene)
    }
  })

  it('takes defaults for omitted fields and a JSON string', () => {
    const { scene } = checkScene(JSON.stringify({ parts: [box({ lit: true }), { type: 'lathe', preset: 'ball', x: 3.5, y: 3.5, z: 1.5 }] }))
    expect(scene).toMatchObject({ name: 'Untitled', base: 'plinth', parts: [{ id: 'p1', variant: 'solid', tone: 'neutral' }, { id: 'p2', r: 1, h: 1.5 }] })
  })
})

describe('invalid scenes', () => {
  it('reports too many parts', () => {
    const parts = Array.from({ length: MAX_PARTS + 2 }, (_, i) => box({ x: i % 8 === 7 ? 0 : 0, w: 0.5, d: 0.5, h: 0.1, z: 0.5 + (i % 5) * 0.5 }))
    expect(problems({ parts })).toContain(`${MAX_PARTS + 2} parts: a scene holds at most ${MAX_PARTS}; drop 2, or merge rows of small parts into one box or platform.`)
  })

  it('reports a part out of bounds with the value that fits', () => {
    const found = problems({ parts: [box({ x: 7 }), box({ z: 2.5, h: 1 }), { type: 'cylinder', x: 3, y: 3, r: 5, h: 1 }] })
    expect(found).toEqual([
      expect.stringMatching(/^parts\[0\]: x 7 is out of range; use 6: the footprint stays on the 8 × 8 floor/),
      expect.stringMatching(/^parts\[1\]: z 2.5 is out of range; use 2: the top stays under the ceiling/),
      expect.stringMatching(/^parts\[2\]: x 3 is out of range; use 0/),
      expect.stringMatching(/^parts\[2\]: y 3 is out of range; use 0/),
      expect.stringMatching(/^parts\[2\]: r 5 is out of range; use 4: a radius runs from 0.25 to 4/),
    ])
  })

  it('reports an unknown preset, type or base with the ones there are', () => {
    const found = problems({
      base: 'table',
      parts: [
        { type: 'prism', preset: 'moon', x: 2, y: 2, z: 0.5 },
        { type: 'lathe', preset: 'star', x: 2, y: 2, z: 0.5 },
        { type: 'cup', x: 2, y: 2 },
        { type: 'sphere' },
      ],
    })
    expect(found).toEqual([
      expect.stringContaining('base "table" is unknown; use one of "plinth"'),
      expect.stringContaining('parts[0]: preset "moon" isn\'t a prism preset; use one of "gable", "wedge"'),
      expect.stringContaining('parts[1]: preset "star" is a prism preset (set "type": "prism"); use one of "cup"'),
      'parts[2]: "cup" is a lathe preset, not a type: use "type": "lathe", "preset": "cup".',
      expect.stringContaining('parts[3]: type "sphere" is unknown; use one of "box", "cylinder"'),
    ])
  })

  it('reports wrong types and stray fields', () => {
    const found = problems({ parts: [box({ w: '2', lit: 'yes', r: 1 }), { ...box(), type: 'prism', preset: 'star', variant: 'ghost' }, 'box'], groups: {} })
    expect(found).toEqual([
      'groups must be an array of {"id", "lift", "float"}.',
      expect.stringContaining('parts[0]: a box has no field "r"; drop it'),
      'parts[0]: lit must be true or false, not "yes".',
      'parts[0]: w must be a number (grid units), not "2".',
      expect.stringContaining('parts[1]: a prism is solid only; drop "variant"'),
      expect.stringContaining('parts[2] must be an object'),
    ])
    expect(problems([])).toEqual([expect.stringContaining('scene must be an object')])
    expect(problems({ parts: 'box' })).toEqual([expect.stringContaining('parts must be an array')])
  })

  it('reports ids, names and groups the builder would change', () => {
    const found = problems({ parts: [box({ id: 'a' }), box({ id: 'a', x: 0, group: 'g1' }), box({ id: 'Top', x: 5, name: 'Lid <b>' }), box({ x: 1, group: 'g9' })], groups: [{ id: 'g1', lift: 0.5 }] })
    expect(found).toEqual([
      'parts[1]: id "a" is already parts[0]\'s; use "p1".',
      'parts[2] ("Lid <b>"): id "Top" must be lowercase letters, digits and -, starting with a letter, up to 16; use "p1".',
      'parts[2] ("Lid <b>"): name "Lid <b>" keeps letters, digits, spaces and \' . , ( ) & - (up to 32 characters); use "Lid b".',
      'parts[3]: group "g9" isn\'t in `groups`; add {"id": "g9", "lift": 0, "float": 0} there, or drop the field.',
      'group "g1" holds one part: a group holds two or more; give another part "group": "g1", or drop the group.',
    ])
  })

  it('answers as a tool error that lists every problem', () => {
    const drawn = drawIllustration(catalog, { parts: [box({ x: 9 }), { type: 'blob' }] })
    expect(drawn.isError).toBe(true)
    expect(drawn.text).toMatch(/^The scene has 2 problems; fix them and call draw_illustration again/)
    expect(drawn.text.split('\n- ')).toHaveLength(3)
  })
})

describe('warnings', () => {
  it('flags parts that sink, hover or cut through each other, and a scene with nothing lit', () => {
    const scene = checkScene({ parts: [box({ z: 0 }), box({ x: 4, z: 0.75 }), box({ x: 0.5, y: 0.5, z: 1.5, w: 1, d: 1 })] }).scene!
    const found = sceneWarnings(scene)
    expect(found).toEqual([
      expect.stringContaining('Nothing is lit'),
      expect.stringContaining('p1 sinks into the plinth'),
      'p1 and p2 cut through each other; isometric sorting draws that wrongly: move one, or stack it (z = the other\'s z + h).',
      'p3 hovers 1 above what is under it and touches nothing; to rest it, set z to 0.5.',
    ])
  })

  it('stays quiet on the templates, parts leaning on a wall included', () => {
    for (const { id, scene } of TEMPLATES) {
      // The desk's screen is held under the ceiling, down through the desktop (z 2.5 asked, 1.5 kept).
      if (id === 'desk') continue
      expect(sceneWarnings(scene).filter((w) => !w.startsWith('Nothing is lit')), id).toEqual([])
    }
  })
})
