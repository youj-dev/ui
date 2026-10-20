import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { add } from '../src/add'
import { VERSION } from '../src/constants'
import { doctor } from '../src/doctor'
import { hashOf, MANIFEST } from '../src/stamp'
import { silentUi } from '../src/ui'
import { blockItem, fakePackage, fakeRunner, fixture, read, stubRegistry, write } from './helpers'

const REGISTRY = [
  { ...blockItem('frame-demo', [{ target: 'blocks/frame/demo.tsx', content: 'export function Demo() {}\n' }]), registryDependencies: ['frame-part'] },
  { name: 'frame-part', files: [{ path: 'src/blocks/frame/part.tsx', target: 'blocks/frame/part.tsx', content: 'export const Part = 1\n' }] },
]

function onPackage() {
  const root = fixture('vite')
  const pkg = JSON.parse(read(root, 'package.json'))
  pkg.dependencies = { ...pkg.dependencies, '@youj/react': '^0.1.0' }
  write(root, 'package.json', JSON.stringify(pkg, null, 2))
  write(root, 'src/index.css', "@import 'tailwindcss';\n@import '@youj/react/styles.css';\n")
  for (const name of ['@youj/react', '@youj/core', '@youj/icons']) fakePackage(root, name)
  return root
}

const addDemo = (root: string, flags: string[] = []) => add(root, ['frame-demo'], flags, fakeRunner(root), silentUi(), stubRegistry(REGISTRY))
const manifest = (root: string) => JSON.parse(read(root, MANIFEST))

describe('the copy-in stamp (youj.json)', () => {
  it('records each copied file under its item, with the version and a hash of what was written', async () => {
    const root = onPackage()
    await addDemo(root)
    const m = manifest(root)
    expect(m.items['frame-demo']).toEqual({ version: VERSION, files: { 'src/blocks/frame/demo.tsx': hashOf(read(root, 'src/blocks/frame/demo.tsx')) } })
    expect(m.items['frame-part'].files['src/blocks/frame/part.tsx']).toBe(hashOf('export const Part = 1\n'))
  })

  it('adding again rewrites nothing', async () => {
    const root = onPackage()
    await addDemo(root)
    const before = readFileSync(join(root, MANIFEST), 'utf8')
    const ui = silentUi()
    await add(root, ['frame-demo'], [], fakeRunner(root), ui, stubRegistry(REGISTRY))
    expect(readFileSync(join(root, MANIFEST), 'utf8')).toBe(before)
    expect(ui.log.join('\n')).not.toMatch(/\+ src\//)
  })

  it('keeps an edited copy and its recorded hash, until --overwrite', async () => {
    const root = onPackage()
    await addDemo(root)
    const original = read(root, 'src/blocks/frame/demo.tsx')
    const recorded = manifest(root).items['frame-demo'].files['src/blocks/frame/demo.tsx']
    write(root, 'src/blocks/frame/demo.tsx', 'export function Demo() { return 1 }\n')
    const ui = silentUi()
    await add(root, ['frame-demo'], [], fakeRunner(root), ui, stubRegistry(REGISTRY))
    expect(ui.log.join('\n')).toContain('Kept your version')
    expect(read(root, 'src/blocks/frame/demo.tsx')).toContain('return 1')
    expect(manifest(root).items['frame-demo'].files['src/blocks/frame/demo.tsx']).toBe(recorded)
    await addDemo(root, ['--overwrite'])
    expect(manifest(root).items['frame-demo'].files['src/blocks/frame/demo.tsx']).toBe(recorded)
    expect(read(root, 'src/blocks/frame/demo.tsx')).toBe(original)
  })
})

describe('doctor, with a stamp', () => {
  const messages = (root: string) => doctor(root, {}).map((c) => `${c.level}: ${c.message}`)

  it('says nothing about untouched copies', async () => {
    const root = onPackage()
    await addDemo(root)
    expect(messages(root).join('\n')).not.toMatch(/edited|older/)
  })

  it('reports edited copies', async () => {
    const root = onPackage()
    await addDemo(root)
    write(root, 'src/blocks/frame/demo.tsx', 'export function Demo() { return 1 }\n')
    expect(messages(root).join('\n')).toContain('1 copied file is edited')
  })

  it('reports copies from an older version', async () => {
    const root = onPackage()
    await addDemo(root)
    const m = manifest(root)
    m.items['frame-demo'].version = '0.0.1'
    write(root, MANIFEST, JSON.stringify(m))
    expect(messages(root).join('\n')).toMatch(/warn: 1 copied item is from an older Youj than .*frame-demo \(0\.0\.1\)/)
  })
})
