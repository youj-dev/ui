import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { add } from '../src/add'
import { setupViteAlias } from '../src/alias'
import { Project } from '../src/project'
import { silentUi } from '../src/ui'
import { fakePackage, fakeRunner, fixture, read, write } from './helpers'

/** Every file under `root` and its content, to compare before and after. */
function tree(root: string, dir = root): Record<string, string> {
  const files: Record<string, string> = {}
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) Object.assign(files, tree(root, path))
    else files[relative(root, path)] = readFileSync(path, 'utf8')
  }
  return files
}

/**
 * An app on the packages with a provider in main.tsx, asked for a component
 * with an optional peer (chart: recharts), a scene from a package it lacks
 * (@youj/illustrations, plus its stylesheet), sound (the package plus
 * YoujProvider's sound) and a block to copy in: every kind of install and edit `add` makes.
 */
function app() {
  const root = fixture('vite')
  const pkg = JSON.parse(read(root, 'package.json'))
  pkg.dependencies = { ...pkg.dependencies, '@youj/react': '^0.1.0', '@youj/core': '^0.1.0' }
  write(root, 'package.json', JSON.stringify(pkg, null, 2))
  for (const name of ['@youj/react', '@youj/core', '@youj/icons']) fakePackage(root, name)
  write(
    root,
    'src/main.tsx',
    "import { YoujProvider } from '@youj/core'\nimport App from './App.tsx'\n\nexport const app = (\n  <YoujProvider>\n    <App />\n  </YoujProvider>\n)\n",
  )
  return root
}

const ITEMS = ['chart', 'illustration-coffee', 'sound', 'auth-login']

describe('add with a preview flag installs nothing and writes nothing', () => {
  it.each(['--dry-run', '--diff', '--view', '--diff=src/blocks/auth/login.tsx'])('%s', async (flag) => {
    const root = app()
    const before = tree(root)
    const runner = fakeRunner(root)
    const ui = silentUi()
    await add(root, ITEMS, [flag], runner, ui, {})
    // Nothing runs: no package manager install, and the block is copied by the CLI itself (on the package), so no shadcn either.
    expect(runner.commands).toEqual([])
    expect(tree(root)).toEqual(before)
    const log = ui.log.join('\n')
    expect(log).toContain('src/blocks/auth/login.tsx')
    expect(log).toContain('recharts')
    expect(log).toContain('@youj/illustrations')
    expect(log).toContain('@youj/sound')
    expect(log).toContain('sound={beacon}')
  })

  it('without the flag, the same add installs and edits', async () => {
    const root = app()
    const project = new Project(root)
    setupViteAlias(project, [])
    project.commit()
    const runner = fakeRunner(root)
    await add(root, ITEMS, [], runner, silentUi(), {})
    expect(runner.commands.filter((c) => c.startsWith('bun add'))).toHaveLength(2)
    expect(read(root, 'src/main.tsx')).toContain('sound={beacon}')
  })
})
