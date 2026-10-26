import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const read = (path) => readFileSync(join(root, path), 'utf8')

describe('registry stubs', () => {
  test("the copied theme barrel is the package's, less the check", () => {
    const real = read('src/lib/youj/theme/index.ts')
      .split('\n')
      .filter((line) => !line.includes("from './check'"))
      .join('\n')
    expect(read('registry/stubs/theme-index.ts').split('\n').slice(1).join('\n')).toBe(real)
  })

  test("the stand-in check takes what the provider passes it", () => {
    expect(read('registry/stubs/theme-check.ts')).toContain('export function warnTheme(')
    expect(read('src/lib/youj/provider.tsx')).toContain("import { warnTheme } from './theme/check'")
  })

  test('the copied useComponentLabels resolves defaults as the package does, typed by the defaults it is given', () => {
    const body = (code) => code.slice(code.indexOf('const overrides'), code.indexOf('}\n', code.indexOf('useMemo')))
    expect(body(read('registry/stubs/use-component-labels.ts'))).toBe(body(read('src/lib/youj/use-component-labels.ts')))
  })

  test('every file the provider is split into ships with youj-core, and imports only what ships', () => {
    const core = JSON.parse(read('registry/core.json')).find((item) => item.name === 'youj-core')
    const shipped = new Set(core.files.map((file) => file.path))
    const names = ['provider', 'provider-context', 'provider-hooks', 'use-youj', 'scope', 'document', 'direction', 'store']
    const find = (stem) => ['.ts', '.tsx', '/index.ts'].map((ext) => `${stem}${ext}`).find((path) => existsSync(join(root, path)))
    for (const path of names.map((name) => find(`src/lib/youj/${name}`))) {
      expect(shipped.has(path), `${path} is listed in registry/core.json`).toBe(true)
      for (const [, specifier] of read(path).matchAll(/from '(\.\/[^']+)'/g)) {
        const target = find(`src/lib/youj/${specifier.slice(2)}`)
        expect(target, `${path} imports ${specifier}`).toBeDefined()
        // The theme check is a stand-in of its own.
        expect(shipped.has(target) || /\/theme\/check\.ts$/.test(target), `${path} imports ${specifier}, which youj-core doesn't ship`).toBe(true)
      }
    }
  })

  test("the copied dictionary type is the package's own, so useLabels() reads each key as typed there", () => {
    const core = JSON.parse(read('registry/core.json')).find((item) => item.name === 'youj-core')
    const types = core.files.find((file) => file.path.endsWith('labels-types.ts'))
    expect(types.path).toBe('src/lib/youj/labels-types.ts')
    expect(types.target).toBeUndefined()
    expect(read(types.path)).not.toMatch(/\[key: string\]/)
  })
})
