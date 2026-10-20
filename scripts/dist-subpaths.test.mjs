// node --test scripts/dist-subpaths.test.mjs (part of pnpm check:packages)
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { exposes, unexposedImports } from './dist-subpaths.mjs'

const exportsByName = {
  '@youj/core': { '.': {}, './internal': {}, './locales/*': {}, './styles.css': './dist/styles.css' },
  '@youj/icons': { '.': {} },
}

test('exposes exact entries and wildcard patterns, nothing else', () => {
  assert.equal(exposes(exportsByName['@youj/core'], './internal'), true)
  assert.equal(exposes(exportsByName['@youj/core'], './locales/en'), true)
  assert.equal(exposes(exportsByName['@youj/core'], './lib/youj/on-screen'), false)
  assert.equal(exposes(exportsByName['@youj/core'], '.'), true)
})

test('flags a deep import the target does not expose, with its line', () => {
  const code = 'import { a } from "@youj/core/internal"\nimport { observeOnScreen } from "@youj/core/lib/youj/on-screen"\n'
  assert.deepEqual(unexposedImports(code, exportsByName), [{ specifier: '@youj/core/lib/youj/on-screen', line: 2 }])
})

test('accepts the package root, wildcard entries, dynamic imports and side-effect imports', () => {
  const code = 'import "@youj/icons"\nconst x = await import("@youj/core/locales/de")\nexport * from "@youj/core"\n'
  assert.deepEqual(unexposedImports(code, exportsByName), [])
})

test('ignores other packages and @youj packages it has no exports map for', () => {
  const code = 'import x from "react/jsx-runtime"\nimport y from "@youj/mystery/deep"\n'
  assert.deepEqual(unexposedImports(code, exportsByName), [])
})
