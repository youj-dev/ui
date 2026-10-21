/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest'

const modules = import.meta.glob<Record<string, Record<string, unknown>>>('./labels/*Labels.ts', { eager: true })

describe('English label defaults', () => {
  it('finds every labels module', () => {
    expect(Object.keys(modules).length).toBeGreaterThan(100)
  })

  for (const [path, mod] of Object.entries(modules)) {
    it(`${path.replace('./labels/', '')} gives a non-empty English string for every label`, () => {
      const group = Object.values(mod as object)[0] as Record<string, string | ((...args: unknown[]) => string)>
      expect(Object.keys(group).length).toBeGreaterThan(0)
      // Labels take names, counts or lists: each one must render some text for at least one of these argument sets.
      const argSets: unknown[][] = [
        ['Alpha', 'Beta', 'Gamma'],
        [1, 2, 3],
        [5, 2, 3],
        [['Alpha', 'Beta', 'Gamma'], 2, 3],
        [['Alpha'], 1, 1],
      ]
      for (const [key, label] of Object.entries(group)) {
        if (typeof label === 'string') {
          expect(label.trim(), key).not.toBe('')
          continue
        }
        const results = argSets.flatMap((args) => {
          try {
            return [label(...args)]
          } catch {
            return []
          }
        })
        expect(results.every((text) => typeof text === 'string'), key).toBe(true)
        expect(results.some((text) => text.trim() !== ''), key).toBe(true)
      }
    })
  }
})
