import { cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { Catalog } from '../src/catalog'
import { loadCatalog } from '../src/data'
import { getAddCommand } from '../src/tools/add'
import { LocalProject } from '../src/tools/project'
import { getProjectInfo, inspectProject as inspect } from '../src/tools/project-info'

let catalog: Catalog
beforeAll(() => { catalog = loadCatalog() })
const fixtures = join(import.meta.dirname, 'fixtures')
const temporary: string[] = []
function project(fixture?: string) {
  const root = mkdtempSync(join(tmpdir(), 'youj-mcp-project-'))
  temporary.push(root)
  if (fixture) cpSync(join(fixtures, fixture), root, { recursive: true })
  return root
}
function write(root: string, file: string, text: string) {
  const path = join(root, file)
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, text)
}
afterEach(() => { for (const root of temporary.splice(0)) rmSync(root, { recursive: true, force: true }) })

describe('get_project_info', () => {
  it('detects local setup and distinguishes declared versions from installed versions', () => {
    const root = project('package')
    write(root, 'node_modules/@youj/react/package.json', '{"version":"0.0.1"}')
    const info = getProjectInfo(catalog, root)
    expect(info).toContain('Framework: vite · Package manager: pnpm · Route: package')
    expect(info).toContain('@youj/react: 0.0.1 (declared ^0.0.1)')
    expect(info).toContain("differs from this MCP's version")
    expect(info).toContain('React: ^18.3.0 (declared)')
    expect(info).toContain('Youj requires 19')
    expect(info).toContain('Youj requires 4')
    expect(info).toContain('Missing Youj stylesheet import')
    write(root, 'node_modules/react/package.json', '{"version":"19.0.0"}')
    expect(getProjectInfo(catalog, root)).not.toContain('Youj requires 19')
  })

  it('detects the registry route and an uncommented stylesheet import', () => {
    const info = getProjectInfo(catalog, join(fixtures, 'registry'))
    expect(info).toContain('Framework: next-app · Package manager: yarn · Route: registry')
    expect(info).toContain('Warnings: none')
  })

  it.each(['astro', 'react-router', 'next-pages', 'vite'])('matches CLI detection for %s', (framework) => {
    const deps = { astro: { astro: '1', next: '1' }, 'react-router': { '@react-router/dev': '7', next: '1' }, 'next-pages': { next: '16' }, vite: { vite: '6', react: '19' } }[framework]
    const root = project()
    write(root, 'package.json', JSON.stringify({ dependencies: deps }))
    expect(inspect(new LocalProject(root)).framework).toBe(framework)
  })

  it('handles missing, malformed and unexpected manifest shapes', () => {
    const root = project()
    for (const cwd of [root, join(root, 'missing'), join(fixtures, 'malformed')]) {
      expect(getProjectInfo(catalog, cwd)).toContain('package.json is missing, unreadable or invalid')
      expect(inspect(new LocalProject(cwd)).pm).toBe('npm')
    }
    write(root, 'package.json', '{"dependencies":[],"packageManager":42}')
    write(root, 'components.json', '{"registries":null}')
    expect(() => getProjectInfo(catalog, root)).not.toThrow()
  })

  it('does not traverse outside cwd through configuration, package names or symlinks', async () => {
    const root = project('traversal')
    const outside = project('registry')
    write(outside, 'outside.css', "@import '@youj/react/styles.css';")
    write(outside, 'secret.json', '{"version":"SECRET"}')
    symlinkSync(join(outside, 'outside.css'), join(root, 'linked.css'))
    symlinkSync(outside, join(root, 'src'))
    symlinkSync(outside, join(root, 'node_modules'))
    const reader = new LocalProject(root)
    expect(reader.read('../outside.css')).toBeUndefined()
    expect(reader.read(join(outside, 'secret.json'))).toBeUndefined()
    expect(reader.read('src/secret.json')).toBeUndefined()
    expect(reader.installed('@youj/../../outside')).toBeUndefined()
    const info = getProjectInfo(catalog, root)
    expect(info).not.toContain('SECRET')
    expect(info).toContain('Missing Youj stylesheet import')
    expect(inspect(new LocalProject(root)).pm).toBe('npm')
    expect(await getAddCommand(catalog, ['button'], root)).toContain('npm install @youj/react')
  })

  it('ignores parent workspace files and manifests linked outside cwd', async () => {
    const parent = project('registry')
    const child = join(parent, 'child')
    mkdirSync(child)
    symlinkSync(join(parent, 'package.json'), join(child, 'package.json'))
    symlinkSync(join(parent, 'components.json'), join(child, 'components.json'))
    expect(inspect(new LocalProject(child))).toMatchObject({ framework: 'unknown', pm: 'npm', route: 'package', pkg: undefined })
    expect(getProjectInfo(catalog, child)).toContain('package.json is missing')
  })
})

describe('get_add_command', () => {
  it.each([['package-lock.json', 'npm install'], ['pnpm-lock.yaml', 'pnpm add'], ['yarn.lock', 'yarn add'], ['bun.lock', 'bun add'], ['bun.lockb', 'bun add']])('uses %s and preserves the data table kit subpath and peers', async (lock, command) => {
    const root = project()
    write(root, lock, '')
    const result = await getAddCommand(catalog, ['DATATABLETOOLBAR', 'button', 'Button'], root)
    expect(result).toContain(`${command} @youj/react cmdk`)
    expect(result).toContain("from '@youj/react/data-table'")
    expect(result.match(/import \{ Button \}/g)).toHaveLength(1)
  })

  it('takes an exact registry name over a slug another item shares', async () => {
    // The Wizard component and the app-setup-wizard block (slug "wizard") both answer to "wizard".
    const root = project()
    expect(await getAddCommand(catalog, ['wizard'], root)).toContain('Wizard')
    expect(await getAddCommand(catalog, ['app-setup-wizard'], root)).toContain('npx youj add app-setup-wizard')
  })

  it('omits existing dependencies, uses packageManager fallback and defaults cwd', async () => {
    const root = project('package')
    expect(await getAddCommand(catalog, ['DataTableToolbar'], root)).toContain('No add command needed')
    write(root, 'node_modules/recharts/package.json', '{"version":"3.0.0"}')
    expect(await getAddCommand(catalog, ['chart'], root)).toContain('No add command needed')
    const empty = project()
    write(empty, 'package.json', '{"packageManager":"bun@1.0.0"}')
    expect(await getAddCommand(catalog, ['button'], empty)).toContain('bun add @youj/react')
    expect(getProjectInfo(catalog)).toContain(new LocalProject().root)
    expect(await getAddCommand(catalog, ['button'])).toBe(await getAddCommand(catalog, ['button'], process.cwd()))
  })

  it('resolves registry components and blocks case-insensitively', async () => {
    expect(await getAddCommand(catalog, ['BUTTON', 'AUTH-LOGIN', 'APP-ANALYTICS-OVERVIEW'], join(fixtures, 'registry'))).toBe('```bash\nnpx youj add button auth-login app-analytics-overview\n```')
  })

  it('gives registry configuration precedence in mixed projects', async () => {
    const root = project('registry')
    write(root, 'package.json', '{"dependencies":{"@youj/react":"0.1.0"}}')
    expect(await getAddCommand(catalog, ['Button'], root)).toContain('npx youj add button')
  })

  it('includes composition dependencies and explains copying the source', async () => {
    const result = await getAddCommand(catalog, ['app-analytics-overview', 'auth-login'], project())
    expect(result).toContain('recharts')
    expect(result).toContain("from '@youj/react/chart'")
    expect(result).toContain('get_block')
  })

  it('answers each name on its own: known ones get their command, unknown ones a suggestion beside it', async () => {
    const result = await getAddCommand(catalog, ['button', 'datatabl', 'auth-logn'], project())
    expect(result).toContain("import { Button } from '@youj/react'")
    expect(result).toMatch(/Skipped: Unknown item "datatabl".*data-table[\s\S]*Skipped: Unknown item "auth-logn".*auth-login/)
  })

  it('rejects the call when no name is known, with suggestions', async () => {
    await expect(getAddCommand(catalog, ['datatabl', 'auth-logn'], project())).rejects.toThrow(/Unknown item "datatabl".*data-table[\s\S]*Unknown item "auth-logn".*auth-login/)
    await expect(getAddCommand(catalog, ['../button', 'button; touch pwned'], project())).rejects.toThrow('Unknown item')
    await expect(getAddCommand(catalog, ['but'], project())).rejects.toThrow('Unknown item')
  })
})
