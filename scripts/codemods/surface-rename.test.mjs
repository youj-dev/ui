// node --test scripts/codemods/surface-rename.test.mjs
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { PRIVATE_UI_VARS, PUBLIC_UI_VARS, renameSurface } from './surface-rename.mjs'

const rename = (text) => renameSurface(text).text

describe('attributes', () => {
  test('data-youj-* becomes data-yj-*, in selectors, JSX and class strings', () => {
    assert.equal(rename(`<a data-youj-trigger="x" /> [data-youj-trigger] data-[youj-x]:`), `<a data-yj-trigger="x" /> [data-yj-trigger] data-[youj-x]:`)
  })
  test('the dataset form follows', () => {
    assert.equal(rename(`link.dataset.youjFont = id`), `link.dataset.yjFont = id`)
  })
  test('standard and already-prefixed attributes are untouched', () => {
    const same = `data-state data-slot data-theme data-yj-theme data-yj-trigger`
    assert.equal(rename(same), same)
  })
})

describe('private variables', () => {
  test('--ui-<private> becomes --ui--<private>, whole names only', () => {
    assert.equal(rename(`var(--ui-compact, 0) --ui-panel-title-leading: 1; --ui-panel-title: 2`), `var(--ui--compact, 0) --ui--panel-title-leading: 1; --ui--panel-title: 2`)
    assert.equal(rename(`[--ui-press-depth:2px] calc(var(--ui-row))`), `[--ui--press-depth:2px] calc(var(--ui--row))`)
  })
  test('public variables keep their names', () => {
    const same = PUBLIC_UI_VARS.map((n) => `var(--ui-${n})`).join(' ')
    assert.equal(rename(same), same)
  })
  test('a longer public name is not caught by a shorter private prefix', () => {
    assert.equal(rename(`var(--ui-shadow-sm) var(--ui-shadow-sm-soft)`), `var(--ui-shadow-sm) var(--ui--shadow-sm-soft)`)
  })
  test('the token migration’s names are left to it', () => {
    const same = `var(--ui-paper) var(--ui-mark-quiet) var(--ui-shadow-color) var(--ui-control-edge)`
    assert.equal(rename(same), same)
  })
  test('the public and private lists do not overlap', () => {
    assert.deepEqual(PRIVATE_UI_VARS.filter((n) => PUBLIC_UI_VARS.includes(n)), [])
  })
  test('is idempotent', () => {
    const once = rename(`--ui-compact data-youj-trigger`)
    assert.equal(rename(once), once)
  })
})
