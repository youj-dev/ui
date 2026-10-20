import { miniatures, type MiniatureKeyHint } from '@youj/miniatures'
import { capsOf, componentName, importLine, load, thumbsOf } from './catalog'
import { LOADERS } from './stage-loaders'

const hint = (keys: string[], caps: string[]): MiniatureKeyHint => ({ keys, caps, label: 'test' })
const flat = (h: MiniatureKeyHint) => capsOf(h).map((g) => ({ caps: g.caps.map((c) => `${c.label}=${c.key}`), joiner: g.joiner }))

describe('the miniatures catalogue', () => {
  it('can load every miniature the package lists: the component its import line names, and its metadata', async () => {
    expect(Object.keys(LOADERS).sort()).toEqual(miniatures.map((m) => m.id).sort())
    for (const m of miniatures) {
      const entry = await load(m.id)
      expect(typeof entry.Component, m.id).toBe('function')
      expect(entry.meta, m.id).toBe(m)
    }
  })

  it('writes the import a page uses', () => {
    expect(importLine('turntable')).toBe("import { MiniatureTurntable } from '@youj/miniatures/turntable'")
    expect(componentName('3d-printer')).toBe('MiniatureThreeDPrinter')
    expect(componentName('crt-television')).toBe('MiniatureCrtTelevision')
  })

  it('has a light and a dark thumbnail of every miniature', () => {
    for (const { id } of miniatures) {
      const t = thumbsOf(id)
      expect(t.light, id).toMatch(new RegExp(`^/thumbs/miniatures/${id}\\.webp\\?v=\\w+$`))
      expect(t.dark, id).toMatch(new RegExp(`^/thumbs/miniatures/${id}\\.dark\\.webp\\?v=\\w+$`))
    }
  })

  it('rejects a name it doesn’t know', async () => {
    await expect(load('nope')).rejects.toThrow('No miniature named nope')
  })
})

describe('a key hint’s caps', () => {
  it('gives each key its own cap when the caption prints one per key', () => {
    expect(flat(hint(['3', '4'], ['3', '4']))).toEqual([{ caps: ['3=3'] }, { caps: ['4=4'] }])
  })

  it('spells out a cap that names its keys one by one', () => {
    expect(flat(hint(['ArrowUp', 'ArrowDown'], ['↑ ↓']))).toEqual([{ caps: ['↑=ArrowUp', '↓=ArrowDown'] }])
  })

  it('shows a range by its two ends, each pressing its own key', () => {
    expect(flat(hint(['1', '2', '3', '4'], ['1–4']))).toEqual([{ caps: ['1=1', '4=4'], joiner: '–' }])
    const rows = 'qwertyuiasdfghjk'.split('')
    expect(flat(hint(rows, ['Q–I', 'A–K']))).toEqual([
      { caps: ['Q=q', 'I=i'], joiner: '–' },
      { caps: ['A=a', 'K=k'], joiner: '–' },
    ])
  })

  it('reads a span printed as its ends across two caps', () => {
    expect(flat(hint(['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"], ['A …', "'"]))).toEqual([{ caps: ['A=a', "'='"], joiner: '…' }])
  })

  it('prints a modifier to hold with other keys without pressing anything itself', () => {
    expect(flat(hint(['shift+s', 'shift+i'], ['⇧']))).toEqual([{ caps: ['⇧=null'] }])
  })
})
