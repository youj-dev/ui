// @vitest-environment node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { examplePages, format } from './stage-heights'

describe('stage heights', () => {
  it('finds the docs pages that show an example, by URL: no (group) folders, no index', () => {
    const dir = mkdtempSync(join(tmpdir(), 'stage-heights-'))
    mkdirSync(join(dir, 'components/(forms)'), { recursive: true })
    mkdirSync(join(dir, 'motion'), { recursive: true })
    writeFileSync(join(dir, 'components/(forms)/date-picker.mdx'), '<ComponentPreview name="date-picker/demo" />')
    writeFileSync(join(dir, 'motion/index.mdx'), '<ComponentPreview name="motion/demo" />')
    writeFileSync(join(dir, 'installation.mdx'), 'No examples here.')
    expect(examplePages(dir)).toEqual(['/docs/components/date-picker', '/docs/motion'])
    rmSync(dir, { recursive: true })
  })

  it('writes one example per line, in name order', () => {
    expect(format({ 'reveal/demo': [500, 288], 'button/demo': [394, 340] })).toBe('{\n  "button/demo": [394, 340],\n  "reveal/demo": [500, 288]\n}\n')
    expect(format({})).toBe('{}\n')
  })

  it('names only examples that exist, each with a phone and a wide height in whole px', () => {
    const heights: Record<string, number[]> = JSON.parse(readFileSync(join(process.cwd(), 'lib/stage-heights.json'), 'utf8'))
    for (const [name, sizes] of Object.entries(heights)) {
      expect(existsSync(join(process.cwd(), 'examples', `${name}.tsx`)), name).toBe(true)
      expect(sizes, name).toHaveLength(2)
      for (const px of sizes) expect(Number.isInteger(px) && px > 0, name).toBe(true)
    }
  })
})
