// node --test scripts/surface-snapshot.test.mjs
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { declaredVariables, usedAttributes } from './surface-snapshot.mjs'

describe('declared variables', () => {
  test('lists declarations, not uses, and skips private and Tailwind ones', () => {
    const css = `:root { --color-fg: red; --ui--compact: 0; --tw-ring: 1; --yj-scale: var(--color-fg) }\n@theme { --radius-md: 4px; }`
    assert.deepEqual(declaredVariables(css), ['--color-fg', '--radius-md', '--yj-scale'])
  })
})

describe('used attributes', () => {
  test('splits data-yj-* from the standard names and drops the rest', () => {
    const { own, standard } = usedAttributes(`<a data-yj-trigger data-slot="x" data-sheet-popup="" />`)
    assert.deepEqual([...own], ['data-yj-trigger'])
    assert.deepEqual([...standard], ['data-slot'])
  })
})
