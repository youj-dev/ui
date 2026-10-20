// @vitest-environment node
import { copyFileSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { figmaPluginFiles } from './figma-kit'

const figma = join(import.meta.dirname, '../../../packages/figma')

/** A copy of the real manifest, with or without a bundle beside it. */
function plugin(withBundle: boolean) {
  const dir = mkdtempSync(join(tmpdir(), 'figma-kit-'))
  copyFileSync(join(figma, 'manifest.json'), join(dir, 'manifest.json'))
  if (withBundle) {
    mkdirSync(join(dir, 'dist'))
    writeFileSync(join(dir, 'dist/code.js'), 'figma.closePlugin()')
  }
  return dir
}

test('packs the bundle where the manifest looks for it, next to a README, in one folder', () => {
  const files = figmaPluginFiles(plugin(true))
  const manifest = files.find((f) => f.path.endsWith('/manifest.json'))!
  const root = manifest.path.slice(0, -'manifest.json'.length)
  const { main } = JSON.parse(manifest.content) as { main: string }
  expect(files.find((f) => f.path === root + main)?.content).toBe('figma.closePlugin()')
  expect(files.map((f) => f.path).sort()).toEqual([`${root}README.txt`, root + main, `${root}manifest.json`].sort())
  const readme = files.find((f) => f.path.endsWith('README.txt'))!.content
  expect(readme).toMatch(/Import plugin from manifest/)
  expect(readme).toMatch(/desktop app/)
  expect(readme).toMatch(/Troubleshooting/)
})

test('fails the build, naming the command, when the plugin hasn’t been built', () => {
  expect(() => figmaPluginFiles(plugin(false))).toThrow(/pnpm -F @youj\/figma build/)
})
