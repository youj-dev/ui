// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const page = readFileSync(fileURLToPath(new URL('../content/docs/comparison.mdx', import.meta.url)), 'utf8')

describe('comparison page', () => {
  it('carries an as-of date', () => {
    expect(page).toMatch(/As of (January|February|March|April|May|June|July|August|September|October|November|December) 20\d\d/)
  })
})
