import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(join(__dirname, 'client.ts'), 'utf8')

describe('client boundary', () => {
  it('is a client module', () => {
    expect(source.startsWith("'use client'")).toBe(true)
  })

  it('re-exports only the lockup and icons, so server pages that import one ship little', () => {
    const from = [...source.matchAll(/^export \{[^}]*\} from '([^']+)'/gm)].map((m) => m[1]!)
    expect(from.length).toBeGreaterThan(0)
    for (const path of from) expect(path).toMatch(/^@youj\/icons\/components\/youj\/icons\/|^@youj\/core\/docs\/brand\/youj-logo$/)
  })
})
