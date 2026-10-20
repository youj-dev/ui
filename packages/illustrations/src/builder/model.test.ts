import { commit, HISTORY_LIMIT, redo, startHistory, undo } from './history'
import {
  boundsOf,
  CEILING,
  cleanName,
  clampPart,
  componentNameOf,
  createPart,
  decodeScene,
  duplicateParts,
  encodeScene,
  fromJson,
  FACINGS,
  LATHE_PRESETS,
  PRISM_PRESETS,
  groupParts,
  MAX_PARTS,
  moveParts,
  nudge,
  partNames,
  placeNew,
  restingZ,
  sanitizePart,
  sanitizeScene,
  sceneSlug,
  snap,
  toJson,
  ungroupParts,
  updateParts,
  type BuilderScene,
  type Part,
} from './model'
import { TEMPLATES } from './templates'

const scene = (input: unknown) => sanitizeScene(input)!
const blank = () => scene({ name: 'Test', base: 'plinth', parts: [] })
const part = (s: BuilderScene, id: string) => s.parts.find((p) => p.id === id)!

/** Every kind of part and look, a group, and names that need escaping in a link. */
const RICH = scene({
  name: 'Rich scene: ü & co',
  base: 'turntable',
  parts: [
    { id: 'p1', name: 'Front desk', type: 'box', x: 1, y: 1, z: 0.5, w: 2, d: 1.5, h: 1, tone: 'raised', lift: 0.5 },
    { id: 'p2', type: 'box', x: 3, y: 1, w: 1, d: 1, h: 0, variant: 'ghost' },
    { id: 'p3', name: 'Lamp (lit)', type: 'cylinder', x: 5, y: 1, z: 0.5, r: 0.75, h: 1.5, variant: 'wire', lit: true, float: 0.2 },
    { id: 'p4', type: 'platform', x: 1, y: 4, w: 3, d: 3, h: 0.3, grid: true, tone: 'neutral' },
    { id: 'p5', type: 'platform', x: 5, y: 5, w: 2, d: 2, h: 0.3, round: true },
    { id: 'p6', type: 'prism', preset: 'heart', facing: 'top', x: 5, y: 3, z: 1, w: 1.5, d: 0.4, h: 1.25, lit: true, lift: 1, group: 'g1' },
    { id: 'p7', name: 'Café', type: 'lathe', preset: 'bell', x: 2, y: 2, z: 1.5, r: 0.5, h: 0.75, group: 'g1' },
  ],
  groups: [{ id: 'g1', lift: 0.8, float: 0.1 }],
})

/** One of every kind of part the palette makes, in every plane and along every axis. */
const NEW_KINDS = [...PRISM_PRESETS.map((p) => `prism:${p}` as const), ...LATHE_PRESETS.map((p) => `lathe:${p}` as const), 'pipe', 'screen', 'crate'] as const

describe('every kind of part', () => {
  it('is made at a size that fits the volume', () => {
    for (const kind of NEW_KINDS) {
      const part = createPart(kind, 'p1')
      expect(clampPart(part), kind).toEqual(part)
    }
  })

  it('round-trips through the link and through JSON', () => {
    const parts = [...NEW_KINDS.map((k) => createPart(k, 'x')), ...FACINGS.flatMap((facing) => [{ ...createPart('screen', 'x'), facing }, { ...createPart('prism:arch', 'x'), facing }]), { ...createPart('pipe', 'x'), axis: 'y' as const, w: 1, d: 3 }]
    const s = scene({ name: 'All', base: 'grid', parts: parts.map((p, i) => ({ ...p, id: `p${i + 1}`, x: 1, y: 1, z: i % 2 ? 0.5 : 0, lift: 0.5, tone: 'raised' })) })
    expect(s.parts).toHaveLength(parts.length)
    expect(decodeScene(encodeScene(s), s.name)).toEqual(s)
    expect(fromJson(toJson(s))).toEqual(s)
  })

  it('keeps every old link reading as it did', () => {
    const old = decodeScene('1!P!rgr_1_1_0.5_3_2_1_sn~lc_5_5_0.5_1_1.5_sn~rht_2_2_0.5_2_0.5_2_snk~lk_1_5_0.5_1_2_sn', 'Old')!
    expect(old.parts.map((p) => (p.type === 'prism' || p.type === 'lathe' ? p.preset : p.type))).toEqual(['gable', 'cup', 'heart', 'cone'])
  })

  it('reads a code it does not know as a part it can skip, and a bad preset as the first', () => {
    expect(decodeScene('1!P!zz_1_1_0_1_1_1_sn~b_1_1_0_1_1_1_sn')!.parts).toHaveLength(1)
    expect(scene({ parts: [{ type: 'prism', preset: 'nope', x: 1, y: 1, w: 1, d: 1, h: 1 }, { type: 'lathe', preset: 'nope', x: 1, y: 1, r: 1, h: 1 }] }).parts).toMatchObject([{ preset: 'gable' }, { preset: 'cup' }])
  })

  it('keeps a pipe as round as it is long: pulling its width or its height sets both', () => {
    const pipe = createPart('pipe', 'p1')
    const wider = clampPart({ ...pipe, d: 2 }, pipe)
    expect(wider).toMatchObject({ d: 2, h: 2, w: 3 })
    const taller = clampPart({ ...wider, h: 1 }, wider)
    expect(taller).toMatchObject({ d: 1, h: 1 })
    // Laid along y, its width is w; and the ceiling holds both down together.
    const along = clampPart({ ...pipe, axis: 'y', w: 1, d: 3 }, pipe)
    expect(along).toMatchObject({ axis: 'y', w: 1, h: 1, d: 3 })
    expect(clampPart({ ...along, z: 2.5 }, along)).toMatchObject({ z: 2, h: 1 })
    expect(boundsOf(sanitizePart({ type: 'pipe', axis: 'sideways', x: 0, y: 0, w: 3, d: 1, h: 0.5 }, 'p1')!)).toMatchObject({ w: 3, d: 0.5, h: 0.5 })
  })

  it('names the new parts in the layers', () => {
    const s = scene({ parts: [createPart('pipe', 'a'), createPart('screen', 'b'), createPart('crate', 'c'), createPart('prism:ell', 'd'), createPart('lathe:funnel', 'e')] })
    expect([...partNames(s).values()]).toEqual(['Pipe', 'Screen', 'Crate', 'L-shape', 'Funnel'])
  })
})

describe('validation', () => {
  it('takes only what is a scene', () => {
    for (const bad of [null, 'scene', 42, {}, { parts: 'no' }]) expect(sanitizeScene(bad)).toBeNull()
    expect(sanitizeScene({ parts: [] })).toMatchObject({ version: 1, name: 'Untitled', base: 'plinth', parts: [], groups: [] })
  })

  it('drops parts it does not know and brings the rest into the volume', () => {
    const s = scene({
      parts: [
        { type: 'spaceship', x: 1, y: 1 },
        { type: 'box', x: -3, y: 99, z: 20, w: 12, d: -1, h: 9, variant: 'plaid', tone: 'loud', lit: 'yes' },
        { type: 'prism', preset: 'nope', facing: 'down', x: 1, y: 1, w: 1, d: 1, h: 1, variant: 'wire' },
      ],
    })
    expect(s.parts).toHaveLength(2)
    const [box, prism] = s.parts as [Part, Part]
    expect(boundsOf(box)).toEqual({ x: 0, y: 7.9, z: 0, w: 8, d: 0.1, h: 3 })
    expect(box).toMatchObject({ variant: 'solid', tone: 'neutral', lit: false })
    // Prisms are solid only; unknown presets and facings fall back to the defaults.
    expect(prism).toMatchObject({ type: 'prism', preset: 'gable', facing: 'right', variant: 'solid' })
  })

  it('makes ids unique, drops groups of one, and keeps a scene to its size', () => {
    const s = scene({
      parts: [
        { id: 'p1', type: 'box', x: 0, y: 0, w: 1, d: 1, h: 1, group: 'g1' },
        { id: 'p1', type: 'box', x: 2, y: 2, w: 1, d: 1, h: 1, group: 'g9' },
        { id: 'BAD ID', type: 'box', x: 4, y: 4, w: 1, d: 1, h: 1 },
      ],
      groups: [{ id: 'g1', lift: 1, float: 0 }],
    })
    expect(new Set(s.parts.map((p) => p.id)).size).toBe(3)
    expect(s.groups).toEqual([])
    expect(s.parts.every((p) => p.group === undefined)).toBe(true)
    const many = scene({ parts: Array.from({ length: MAX_PARTS + 20 }, () => ({ type: 'box', x: 0, y: 0, w: 1, d: 1, h: 1 })) })
    expect(many.parts).toHaveLength(MAX_PARTS)
  })

  it('keeps a part’s name safe for a link and a code comment', () => {
    expect(cleanName('  Front   desk  ')).toBe('Front desk')
    expect(cleanName('a_b~c!d */ <x> {y}')).toBe('abcd x y')
    expect(cleanName('Café (lit) & co')).toBe('Café (lit) & co')
    expect(cleanName('x'.repeat(80))).toHaveLength(32)
    expect(cleanName('!!!')).toBeUndefined()
    expect(cleanName(7)).toBeUndefined()
  })

  it('names parts in the layers by their own name, else their kind, numbered when there are several', () => {
    const names = partNames(TEMPLATES.find((t) => t.id === 'desk')!.scene)
    expect(names.get('p4')).toBe('Screen')
    const plain = scene({ parts: [{ type: 'box', x: 0, y: 0, w: 1, d: 1, h: 1 }, { type: 'box', x: 2, y: 0, w: 1, d: 1, h: 1 }, { type: 'lathe', preset: 'ball', x: 4, y: 4, r: 1, h: 2 }] })
    expect([...partNames(plain).values()]).toEqual(['Box 1', 'Box 2', 'Ball'])
  })

  it('turns a scene’s name into an id and a component name', () => {
    expect(sceneSlug('Front desk')).toBe('front-desk')
    expect(sceneSlug('Café 2')).toBe('cafe-2')
    expect(sceneSlug('3D printer')).toBe('scene-3d-printer')
    expect(sceneSlug('!!!')).toBe('untitled')
    expect(componentNameOf('Front desk')).toBe('IllustrationFrontDesk')
  })
})

describe('the link', () => {
  it.each([...TEMPLATES.map((t) => [t.name, t.scene] as const), ['Rich', RICH] as const])('round-trips %s through the address', (_, s) => {
    const url = new URL(`https://k.dev/illustrations/build?name=${encodeURIComponent(s.name)}&s=${encodeScene(s)}`)
    expect(decodeScene(url.searchParams.get('s')!, url.searchParams.get('name'))).toEqual(s)
    // Straight from storage, not yet decoded by an address, it reads the same.
    expect(decodeScene(encodeScene(s), s.name)).toEqual(s)
  })

  it('is compact, in characters a URL carries as they are', () => {
    const desk = encodeScene(TEMPLATES.find((t) => t.id === 'desk')!.scene)
    expect(desk.length).toBeLessThan(400)
    expect(encodeScene(RICH)).toMatch(/^[\w.~!%'()-]+$/)
    expect(encodeScene(blank())).toBe('1!P!!')
  })

  it('reads nothing from a link it can’t, and skips a part it can’t read', () => {
    for (const bad of ['', '2!P!b_1_1_0_1_1_1_sn', 'hello', '1', 'x'.repeat(5000)]) expect(decodeScene(bad)).toBeNull()
    const s = decodeScene('1!G!b_1_1_0_1_1_1_sn~zz_1~b_-1_1_0_1_1_1_sn~c_2_2_0_1_1_wr')!
    expect(s.base).toBe('grid')
    expect(s.parts.map((p) => p.type)).toEqual(['box', 'cylinder'])
    expect(s.parts[1]).toMatchObject({ variant: 'wire', tone: 'raised' })
  })

  it('round-trips as JSON, and reads JSON it’s given back through the same checks', () => {
    expect(fromJson(toJson(RICH))).toEqual(RICH)
    expect(fromJson('{"parts":[{"type":"box","x":1,"y":1,"w":1,"d":1,"h":1}]}')!.parts).toHaveLength(1)
    expect(fromJson('not json')).toBeNull()
  })
})

describe('history', () => {
  const a = blank()
  const b = { ...a, name: 'B' }
  const c = { ...a, name: 'C' }

  it('undoes and redoes whole scenes, and a new step drops what was undone', () => {
    let h = commit(commit(startHistory(a), b), c)
    h = undo(h)
    expect(h.present).toBe(b)
    h = undo(h)
    expect(h.present).toBe(a)
    expect(undo(h)).toBe(h)
    h = redo(h)
    expect(h.present).toBe(b)
    h = commit(h, c)
    expect(h.future).toEqual([])
    expect(redo(h)).toBe(h)
  })

  it('folds a run of edits to one field into one step, but not edits far apart or to another field', () => {
    let h = commit(startHistory(a), b, 'p1:x', 1000)
    h = commit(h, c, 'p1:x', 1300)
    expect(h.past).toEqual([a])
    h = commit(h, b, 'p1:x', 5000)
    expect(h.past).toEqual([a, c])
    h = commit(h, c, 'p1:y', 5100)
    expect(h.past).toEqual([a, c, b])
  })

  it('keeps a hundred steps', () => {
    let h = startHistory(a)
    for (let i = 0; i < HISTORY_LIMIT + 30; i++) h = commit(h, { ...a, name: `n${i}` })
    expect(h.past).toHaveLength(HISTORY_LIMIT)
  })
})

describe('snapping and placing', () => {
  it('snaps to half units, or a step it’s given', () => {
    expect([snap(1.24), snap(1.26), snap(-0.2), snap(2.1, 0.25), snap(0.1 + 0.2)]).toEqual([1, 1.5, 0, 2, 0.5])
  })

  it('lands a new part in the middle of the floor, on the plinth or on what’s under it', () => {
    let s = blank()
    const box = placeNew(s, createPart('box', 'p1'))
    expect(boundsOf(box)).toEqual({ x: 3, y: 3, z: 0.5, w: 2, d: 2, h: 1 })
    s = { ...s, parts: [box] }
    expect(placeNew(s, createPart('cylinder', 'p2'))).toMatchObject({ x: 3, y: 3, z: 1.5 })
    expect(placeNew({ ...s, base: 'none' }, createPart('tile', 'p3'), { x: 1, y: 7 })).toMatchObject({ x: 0, y: 6, z: 0 })
    expect(restingZ(s, { x: 0, y: 0, w: 1, d: 1 })).toBe(0.5)
    expect(restingZ(s, { x: 4, y: 4, w: 1, d: 1 }, ['p1'])).toBe(0.5)
  })

  it('moves several parts as one, stopping them together at the floor’s edge', () => {
    const s = scene({
      parts: [
        { id: 'a', type: 'box', x: 5, y: 1, w: 2, d: 1, h: 1 },
        { id: 'b', type: 'box', x: 3, y: 1, w: 1, d: 1, h: 1 },
      ],
    })
    const moved = moveParts(s, ['a', 'b'], 5, 0, 0)
    expect([part(moved, 'a').x, part(moved, 'b').x]).toEqual([6, 4])
    expect(moveParts(s, ['a'], 0, 0, 0)).toBe(s)
    // A top never leaves the volume.
    expect(part(moveParts(s, ['a'], 0, 0, 10), 'a').z).toBe(CEILING - 1)
  })

  it('holds a taller part to the room above it rather than pushing it down', () => {
    const [box] = scene({ parts: [{ type: 'box', x: 0, y: 0, z: 2, w: 1, d: 1, h: 0.5 }] }).parts as [Part]
    expect(clampPart({ ...box, h: 3 }, box)).toMatchObject({ z: 2, h: 1 })
    // Raised past the ceiling, it comes down to fit.
    expect(clampPart({ ...box, z: 3 }, box)).toMatchObject({ z: 2.5, h: 0.5 })
    const s = updateParts({ ...blank(), parts: [box] }, [box.id], (p) => ({ ...p, h: 9 }))
    expect(s.parts[0]).toMatchObject({ z: 2, h: 1 })
  })
})

describe('keyboard nudging', () => {
  const s = scene({ parts: [{ id: 'a', type: 'box', x: 3, y: 3, z: 0, w: 2, d: 2, h: 1 }] })
  const at = (next: BuilderScene | null) => {
    const p = part(next!, 'a')
    return [p.x, p.y, p.z]
  }

  it('moves along x with ← →, y with ↑ ↓, and z with Page Up and Down, further with Shift', () => {
    expect(at(nudge(s, ['a'], 'ArrowRight'))).toEqual([3.5, 3, 0])
    expect(at(nudge(s, ['a'], 'ArrowLeft'))).toEqual([2.5, 3, 0])
    expect(at(nudge(s, ['a'], 'ArrowDown'))).toEqual([3, 3.5, 0])
    expect(at(nudge(s, ['a'], 'ArrowUp'))).toEqual([3, 2.5, 0])
    expect(at(nudge(s, ['a'], 'ArrowRight', true))).toEqual([5, 3, 0])
    expect(at(nudge(s, ['a'], 'PageUp'))).toEqual([3, 3, 0.5])
    expect(at(nudge(s, ['a'], 'PageUp', true))).toEqual([3, 3, 1])
  })

  it('does nothing without a selection, for other keys, or where nothing can move', () => {
    expect(nudge(s, [], 'ArrowRight')).toBeNull()
    expect(nudge(s, ['a'], 'a')).toBeNull()
    expect(nudge(s, ['a'], 'PageDown')).toBeNull()
    const edge = moveParts(s, ['a'], 10, 0, 0)
    expect(nudge(edge, ['a'], 'ArrowRight')).toBeNull()
  })
})

describe('duplicating and grouping', () => {
  it('copies parts a step along, each after its original, and a group’s copies into a new group', () => {
    // The copies' ids come in the scene's order: p1's, then p6's and p7's.
    const { scene: out, ids } = duplicateParts(RICH, ['p6', 'p7', 'p1'])
    expect(ids).toHaveLength(3)
    expect(out.parts.map((p) => p.id).slice(0, 2)).toEqual(['p1', ids[0]])
    const [desk, heart, bell] = ids.map((id) => part(out, id))
    expect(heart!.group).toBe('g2')
    expect(bell!.group).toBe('g2')
    expect(out.groups.map((g) => g.id)).toEqual(['g1', 'g2'])
    expect(boundsOf(desk!)).toMatchObject({ x: 2, y: 2 })
    // At the far edge, the copy goes the other way.
    const edge = scene({ parts: [{ id: 'e', type: 'box', x: 7, y: 7, w: 1, d: 1, h: 1 }] })
    expect(part(duplicateParts(edge, ['e']).scene, 'p1')).toMatchObject({ x: 6, y: 6 })
  })

  it('groups two parts or more, and ungroups them', () => {
    const s = scene({ parts: [{ id: 'a', type: 'box', x: 0, y: 0, w: 1, d: 1, h: 1 }, { id: 'b', type: 'box', x: 2, y: 0, w: 1, d: 1, h: 1 }] })
    expect(groupParts(s, ['a']).group).toBeNull()
    const { scene: grouped, group } = groupParts(s, ['a', 'b'])
    expect(group).toBe('g1')
    expect(grouped.parts.every((p) => p.group === 'g1')).toBe(true)
    const apart = ungroupParts(grouped, ['a'])
    expect(apart.groups).toEqual([])
    expect(apart.parts.every((p) => !p.group)).toBe(true)
  })
})
