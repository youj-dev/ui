// Runs `playwright test` inside the official Playwright Linux image, the one
// CI runs in, so screenshots match the committed baselines pixel for pixel
// (fonts and rasterising differ between macOS and Linux). It asks for CI's
// architecture, amd64, which Apple Silicon runs under emulation: slower, but
// a baseline rendered here is the one CI compares against. Arguments pass
// through, e.g. `--project=visual --update-snapshots`. In CI, which is
// already inside the image, it runs Playwright directly.
//
// Build Storybook first (pnpm build-storybook): the container only serves the
// static build and drives the browser, with plain Node and no native tools.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const args = ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)]
const run = (command, argv) => execFileSync(command, argv, { cwd: root, stdio: 'inherit' })

try {
  if (process.env.CI) run('node', args)
  else {
    const { version } = JSON.parse(readFileSync(join(root, 'node_modules/@playwright/test/package.json'), 'utf8'))
    run('docker', [
      ...['run', '--rm', '--platform', 'linux/amd64', '--ipc=host', '-v', `${root}:/work`, '-w', '/work'],
      `mcr.microsoft.com/playwright:v${version}-noble`,
      ...['node', ...args],
    ])
  }
} catch (error) {
  process.exit(error.status ?? 1)
}
