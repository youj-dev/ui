import assert from 'node:assert/strict'
import { test } from 'node:test'
import { hasDatedHeading } from './check-changelog.mjs'

test('accepts a dated heading for the version', () => {
  assert.equal(hasDatedHeading('# Changelog\n\n## 0.1.0 - 2026-10-14\n\nx', '0.1.0'), true)
  assert.equal(hasDatedHeading('# Changelog\n\n## 0.1.0 (2026-10-14)\n\nx', '0.1.0'), true)
})

test('rejects an unreleased heading, another version or a missing entry', () => {
  assert.equal(hasDatedHeading('## 0.1.0 (Unreleased)', '0.1.0'), false)
  assert.equal(hasDatedHeading('## 0.1.1 (2026-10-14)', '0.1.0'), false)
  assert.equal(hasDatedHeading('## 0.10.0 (2026-10-14)', '0.1.0'), false)
  assert.equal(hasDatedHeading('', '0.1.0'), false)
})
