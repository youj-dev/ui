// node --test scripts/check-surface.test.mjs
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { classExports, underscoreVariables, unknownAttributes } from './check-surface.mjs'

describe('data- prefixes', () => {
  test('data-yj-* and the standard names pass', () => {
    assert.deepEqual(unknownAttributes(`<a data-yj-trigger data-slot="x" data-state="open" data-theme="dark" className="data-disabled:opacity-50 data-[side=top]:mt-1" />`), [])
  })
  test('any other name is unknown, in JSX, selectors and class strings', () => {
    assert.deepEqual(unknownAttributes(`<a data-youj-trigger data-sheet-popup="" /> [data-reduced-motion] group-data-x:`), ['youj-trigger', 'sheet-popup', 'reduced-motion'])
  })
  test('a word that merely ends in data is not an attribute', () => {
    assert.deepEqual(unknownAttributes(`metadata-foo raw-data-bar`), [])
  })
})

describe('class constants in a barrel', () => {
  test('lists the *Class names on export lines', () => {
    assert.deepEqual(classExports(`export { Dialog, dialogPopupClass, type DialogProps } from './dialog'\nexport { cn } from './lib/utils'`), ['dialogPopupClass'])
  })
  test('ignores comments and a clean barrel', () => {
    assert.deepEqual(classExports(`// labelClass stays internal\nexport { Label } from './label'`), [])
  })
})

describe('CSS variable names', () => {
  test('flags an underscore inside a variable name', () => {
    assert.deepEqual(underscoreVariables(`gap-[calc(var(--spacing)*(3_-_0.5*var(--_ui-compact,0)))] [--my_var:1px]`), ['--_ui-compact', '--my_var'])
  })
  test('allows _ as a space around a variable, and double hyphens', () => {
    assert.deepEqual(underscoreVariables(`gap-[calc(3_-_0.5*var(--ui--compact,0))] p-[var(--a)_var(--b)] [--ui--row:1px]`), [])
  })
})
