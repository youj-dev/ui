import { copyText, formatPath, jsonModel, quote, showKey, toJson, typeOf, visibleRows, type JsonNode } from './json-viewer-model'

const keys = (nodes: JsonNode[]) => nodes.map((node) => node.key)

describe('jsonModel', () => {
  test('the top rows are the root’s keys or items; a root that holds nothing is the only row', () => {
    expect(keys(jsonModel({ a: 1, b: { c: 2 } }, 80).roots)).toEqual(['a', 'b'])
    expect(keys(jsonModel(['x', 'y'], 80).roots)).toEqual([0, 1])
    for (const value of ['text', 42, null, true, undefined, {}, []]) {
      const { roots } = jsonModel(value, 80)
      expect(roots).toHaveLength(1)
      expect(roots[0]).toMatchObject({ key: null, path: [], level: 1, parent: null })
    }
  })

  test('reads a row’s children when asked, once, and finds every row it made by id', () => {
    const model = jsonModel({ user: { name: 'Noor', roles: ['admin'] } }, 80)
    const user = model.roots[0]!
    const children = model.children(user)
    expect(keys(children)).toEqual(['name', 'roles'])
    expect(model.children(user)).toBe(children)
    expect(children[1]).toMatchObject({ path: ['user', 'roles'], level: 2, parent: user.id, type: 'array', size: 1 })
    expect(model.get(children[1]!.id)).toBe(children[1])
    // The same path keeps its id from one value to the next.
    expect(jsonModel({ user: { roles: [] } }, 80).roots[0]!.id).toBe(user.id)
  })

  test('types values as JSON names them, after toJSON', () => {
    expect([{}, [], 's', 1, 10n, true, null, undefined, () => {}].map(typeOf)).toEqual([
      'object',
      'array',
      'string',
      'number',
      'number',
      'boolean',
      'null',
      'undefined',
      'undefined',
    ])
    const when = jsonModel({ when: new Date(Date.UTC(2026, 10, 24)) }, 80).roots[0]!
    expect(when).toMatchObject({ type: 'string', value: '2026-11-24T00:00:00.000Z' })
  })

  test('opens what holds something: non-empty objects and arrays, ranges, and strings longer than the clip', () => {
    const model = jsonModel({ o: { a: 1 }, e: {}, a: [1], z: [], short: 'abc', long: 'abcdef', n: 1 }, 5)
    expect(model.roots.map((node) => model.expandable(node))).toEqual([true, false, true, false, false, true, false])
    const [text] = model.children(model.roots[5]!)
    expect(text).toMatchObject({ kind: 'text', value: 'abcdef', level: 2, path: ['long'] })
    expect(model.expandable(text!)).toBe(false)
  })

  test('opens a big array onto ranges of a hundred, and a huge one onto ranges of ten thousand first', () => {
    const model = jsonModel({ list: Array.from({ length: 250 }, (_, i) => i) }, 80)
    const ranges = model.children(model.roots[0]!)
    expect(ranges.map((node) => [node.kind, node.from, node.to])).toEqual([
      ['range', 0, 99],
      ['range', 100, 199],
      ['range', 200, 249],
    ])
    const items = model.children(ranges[2]!)
    expect(items).toHaveLength(50)
    expect(items[0]).toMatchObject({ key: 200, value: 200, path: ['list', 200], parent: ranges[2]!.id, level: 3 })

    const huge = jsonModel(Array.from({ length: 10_001 }, (_, i) => i), 80)
    expect(huge.roots.map((node) => [node.from, node.to])).toEqual([
      [0, 9999],
      [10000, 10000],
    ])
    const hundreds = huge.children(huge.roots[0]!)
    expect(hundreds).toHaveLength(100)
    expect([hundreds[99]!.from, hundreds[99]!.to]).toEqual([9900, 9999])
    expect(huge.children(huge.roots[1]!)).toMatchObject([{ key: 10000, kind: 'value' }])
    // Exactly a hundred is one page; a hundred and one is two.
    expect(jsonModel(Array.from({ length: 100 }, () => 0), 80).roots).toHaveLength(100)
    expect(jsonModel(Array.from({ length: 101 }, () => 0), 80).roots).toHaveLength(2)
  })

  test('a value that holds itself is circular there, and never opens', () => {
    const node: Record<string, unknown> = { name: 'root' }
    node.self = node
    node.list = [node]
    const model = jsonModel(node, 80)
    const [, self, list] = model.roots
    expect(self).toMatchObject({ circular: true, size: 0 })
    expect(model.expandable(self!)).toBe(false)
    expect(model.children(list!)[0]).toMatchObject({ circular: true })
    // The same object twice side by side is not a cycle.
    const shared = { a: 1 }
    expect(jsonModel({ x: shared, y: shared }, 80).roots.map((n) => n.circular)).toEqual([false, false])
  })

  test('visibleRows lists the rows on show, top to bottom', () => {
    const model = jsonModel({ a: { b: { c: 1 } }, d: [1, 2] }, 80)
    const open = new Set(['a', 'b'])
    const rows = visibleRows(model, (node) => open.has(String(node.key)))
    expect(rows.map((node) => node.key)).toEqual(['a', 'b', 'c', 'd'])
  })
})

describe('formatPath', () => {
  test('writes a path as JavaScript reads it', () => {
    expect(formatPath([])).toBe('')
    expect(formatPath(['request', 'headers', 'content-type'])).toBe('request.headers["content-type"]')
    expect(formatPath(['items', 0, 'id'])).toBe('items[0].id')
    expect(formatPath([3, 'a'])).toBe('[3].a')
    expect(formatPath(['my key', '$ok', '_x1', '1st'])).toBe('["my key"].$ok._x1["1st"]')
    expect(formatPath(['say "hi"'])).toBe('["say \\"hi\\""]')
  })
})

describe('toJson', () => {
  test('is two-space JSON that never throws', () => {
    expect(toJson({ a: [1, { b: null }] })).toBe('{\n  "a": [\n    1,\n    {\n      "b": null\n    }\n  ]\n}')
    const loop: Record<string, unknown> = { a: 1 }
    loop.self = loop
    expect(toJson(loop)).toBe('{\n  "a": 1,\n  "self": "[Circular]"\n}')
    const shared = { a: 1 }
    expect(JSON.parse(toJson([shared, shared]))).toEqual([{ a: 1 }, { a: 1 }])
    expect(toJson({ big: 10n })).toBe('{\n  "big": "10"\n}')
    expect(toJson(new Date(Date.UTC(2026, 0, 1)))).toBe('"2026-01-01T00:00:00.000Z"')
    expect(toJson(undefined)).toBe('undefined')
    expect(toJson('text')).toBe('"text"')
  })
})

describe('quote and showKey', () => {
  test('quote escapes as JSON does and cuts long strings before the closing quote', () => {
    expect(quote('say "hi"\n', 80)).toBe('"say \\"hi\\"\\n"')
    expect(quote('abcdefgh', 5)).toBe('"abcde…"')
    expect(quote('abcde', 5)).toBe('"abcde"')
    // Never half a character drawn with two code units.
    expect(quote('ab😀cd', 3)).toBe('"ab…"')
  })

  test('showKey leaves a plain key bare and quotes one that would read oddly', () => {
    expect(showKey('name')).toBe('name')
    expect(showKey('content-type')).toBe('content-type')
    expect(showKey('café')).toBe('café')
    expect(showKey('two words')).toBe('two words')
    expect(showKey('')).toBe('""')
    expect(showKey(' padded')).toBe('" padded"')
    expect(showKey('line\nbreak')).toBe('"line\\nbreak"')
    expect(showKey('say "hi"')).toBe('"say \\"hi\\""')
  })
})

describe('copyText', () => {
  test('gives a string as it is, an object or array as JSON, a range as its items, anything else as written', () => {
    const model = jsonModel({ s: 'a "b"', o: { x: 1 }, n: 1.5, z: null, list: Array.from({ length: 150 }, (_, i) => i) }, 80)
    const [s, o, n, z, list] = model.roots
    expect(copyText(s!)).toBe('a "b"')
    expect(copyText(o!)).toBe('{\n  "x": 1\n}')
    expect(copyText(n!)).toBe('1.5')
    expect(copyText(z!)).toBe('null')
    const second = model.children(list!)[1]!
    expect(JSON.parse(copyText(second))).toEqual(Array.from({ length: 50 }, (_, i) => i + 100))
  })
})
