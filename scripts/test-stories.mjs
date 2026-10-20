// Runs the stories that have a `play()` as tests, in Chromium (vitest.storybook.config.ts).
//
// Vite finds the dependencies of a story while the first files load and, on a
// cold cache, reloads the page under the files that are open. A first pass that
// only collects the stories fills the cache; the second pass is the real run.
//
//   node scripts/test-stories.mjs
import { spawnSync } from 'node:child_process'

const run = (...args) =>
  spawnSync('pnpm', ['exec', 'vitest', 'run', '--config', 'vitest.storybook.config.ts', ...args], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, YOUJ_PLAY_ONLY: '1' },
    stdio: args.includes('--silent') ? 'ignore' : 'inherit',
  })

run('--silent', '--testNamePattern', '^$')
process.exit(run().status ?? 1)
