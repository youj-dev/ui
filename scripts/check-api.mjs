// The public-API checks, one step at a time, stopping at the first that fails (`pnpm check:api`, part of `pnpm verify`):
// the snapshots of the API and the surface names, then the MCP catalog and the surface tests.
import { spawnSync } from 'node:child_process'

const node = (...args) => ['node', ...args]
const test = (...files) => node('--test', '--test-reporter=dot', ...files)
const STEPS = [
  test('scripts/api-snapshot.test.mjs'),
  node('scripts/api-snapshot.mjs', '--check'),
  test('scripts/check-surface.test.mjs', 'scripts/surface-snapshot.test.mjs', 'scripts/codemods/surface-rename.test.mjs'),
  node('scripts/surface-snapshot.mjs', '--check'),
  node('scripts/check-surface.mjs'),
  ['pnpm', '-F', '@youj/mcp', 'generate'],
  ['pnpm', '-F', '@youj/cli', '-F', '@youj/mcp', 'exec', 'vitest', 'run', 'test/surface.test.ts'],
]

for (const [cmd, ...args] of STEPS) {
  const { status } = spawnSync(cmd, args, { stdio: 'inherit', env: { ...process.env, CI: '1' } })
  if (status !== 0) process.exit(status ?? 1)
}
