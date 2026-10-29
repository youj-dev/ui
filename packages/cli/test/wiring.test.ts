import { describe, expect, it } from 'vitest'
import { isClientFile } from '../src/wiring'

describe('isClientFile', () => {
  it('finds the directive first in the file, after whitespace and comments', () => {
    expect(isClientFile("'use client'\nimport x from 'x'\n")).toBe(true)
    expect(isClientFile('"use client";\n')).toBe(true)
    expect(isClientFile("\n  \n'use client'\n")).toBe(true)
    expect(isClientFile("/* license */\n'use client'\n")).toBe(true)
    expect(isClientFile("// a note\n// another\n  'use client'\n")).toBe(true)
    expect(isClientFile("/** one */ // two\n/* three\n   lines */\n\"use client\"\n")).toBe(true)
  })

  it('is false without the directive, or when it is not first', () => {
    expect(isClientFile('')).toBe(false)
    expect(isClientFile('export const a = 1\n')).toBe(false)
    expect(isClientFile("import x from 'x'\n'use client'\n")).toBe(false)
    expect(isClientFile("'use client\"\n")).toBe(false)
    expect(isClientFile("/* open comment\n'use client'\n")).toBe(false)
    expect(isClientFile("// no newline after 'use client'")).toBe(false)
    expect(isClientFile("/* a */ import x from 'x'\n/* b */ 'use client'\n")).toBe(false)
  })

  it('answers a crafted file quickly (no ReDoS)', () => {
    // The earlier pattern doubled its time with every comment: 28 of them took over a second, 40 would take hours.
    const crafted = [
      `${'/* a */ '.repeat(28)}x`,
      `${'/* a */ '.repeat(10_000)}x`,
      `${'/**/'.repeat(12_000)}x`,
      `${'/*'.repeat(25_000)}`,
      `${'// a\n'.repeat(10_000)}x`,
      `${' '.repeat(50_000)}x`,
    ]
    for (const source of crafted) {
      const start = performance.now()
      expect(isClientFile(source)).toBe(false)
      expect(performance.now() - start).toBeLessThan(50)
    }
  })
})
