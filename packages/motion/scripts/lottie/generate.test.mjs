import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { inflateRawSync } from 'node:zlib'
import { logoSting, successCheck, uploadProgress } from './animations.mjs'
import { builds } from './generate.mjs'

const css = readFileSync(join(import.meta.dirname, '../../../core/src/styles/youj.css'), 'utf8')
const animations = { successCheck, uploadProgress, logoSting }

function walk(node, visit) {
  if (Array.isArray(node)) return node.forEach((n) => walk(n, visit))
  if (node && typeof node === 'object') {
    visit(node)
    Object.values(node).forEach((n) => walk(n, visit))
  }
}

describe.each(Object.entries(animations))('%s', (_, build) => {
  const anim = build()

  test('every color is a slot named after a youj color token', () => {
    const sids = new Set()
    walk(anim.layers, (n) => {
      if (n.ty === 'st' || n.ty === 'fl') {
        expect(n.c.sid).toBeTypeOf('string')
        sids.add(n.c.sid)
      }
    })
    expect(Object.keys(anim.slots).sort()).toEqual([...sids].sort())
    for (const sid of sids) expect(css).toContain(`--color-${sid}:`)
  })

  test('keyframes are ordered and inside the composition', () => {
    walk(anim.layers, (n) => {
      if (n.a !== 1) return
      const times = n.k.map((k) => k.t)
      expect(times).toEqual([...times].sort((a, b) => a - b))
      expect(Math.max(...times)).toBeLessThanOrEqual(anim.op)
    })
  })
})

test('the upload loader loops seamlessly: its arc ends where it began', () => {
  const ring = uploadProgress().layers.find((l) => l.nm === 'Ring')
  const arc = ring.shapes.find((s) => s.nm === 'Arc')
  const trim = arc.it.find((s) => s.ty === 'tm')
  const rotation = arc.it.find((s) => s.ty === 'tr').r.k
  const turn = rotation.at(-1).s[0] - rotation[0].s[0]
  const tailStart = trim.s.k[0].s[0]
  const tailEnd = trim.s.k.at(-1).s[0]
  expect((((tailEnd - tailStart) * 3.6 + turn) % 360 + 360) % 360).toBeCloseTo(0)
})

test('logo-sting.lottie is a dotLottie v2 zip holding the animation', () => {
  const zip = builds['logo-sting.lottie']()
  const entries = {}
  let offset = 0
  while (zip.readUInt32LE(offset) === 0x04034b50) {
    const size = zip.readUInt32LE(offset + 18)
    const nameLength = zip.readUInt16LE(offset + 26)
    const name = zip.subarray(offset + 30, offset + 30 + nameLength).toString()
    const start = offset + 30 + nameLength
    entries[name] = inflateRawSync(zip.subarray(start, start + size)).toString()
    offset = start + size
  }
  const manifest = JSON.parse(entries['manifest.json'])
  expect(manifest).toMatchObject({ version: '2', animations: [{ id: 'logo-sting' }] })
  expect(JSON.parse(entries['a/logo-sting.json']).nm).toBe('logo-sting')
})
