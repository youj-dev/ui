// @vitest-environment node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { archiveVersion, folderStore, missingVersions, packVersion, restoreArchive, unpackVersion } from './registry-archive'

let dir: string
beforeEach(() => void (dir = mkdtempSync(join(tmpdir(), 'registry-archive-'))))
afterEach(() => rmSync(dir, { recursive: true, force: true }))

const served = (version: string, items: Record<string, string> = {}) => {
  const folder = join(dir, 'r', `v${version}`)
  mkdirSync(folder, { recursive: true })
  for (const [name, text] of Object.entries({ 'registry.json': `{"v":"${version}"}`, ...items })) writeFileSync(join(folder, name), text)
}

describe('registry archive', () => {
  it('brings an archived version back after a build that wrote only the current one', async () => {
    served('0.1.0', { 'button.json': '{"b":1}' })
    const store = folderStore(join(dir, 'archive'))
    expect(await store.putIfAbsent('0.1.0', packVersion(join(dir, 'r'), '0.1.0'))).toBe(true)

    rmSync(join(dir, 'r'), { recursive: true }) // what registry.ts does at the start of a build
    served('0.1.1')
    expect(await restoreArchive(store, join(dir, 'r'), '0.1.1')).toEqual(['0.1.0'])
    expect(readFileSync(join(dir, 'r/v0.1.0/button.json'), 'utf8')).toBe('{"b":1}')
    expect(await missingVersions(store, join(dir, 'r'))).toEqual([])
  })

  it('never overwrites an archived version and does not restore over the current one', async () => {
    served('0.1.0')
    const store = folderStore(join(dir, 'archive'))
    await store.putIfAbsent('0.1.0', packVersion(join(dir, 'r'), '0.1.0'))
    expect(await store.putIfAbsent('0.1.0', '{"registry.json":"changed"}')).toBe(false)
    expect(JSON.parse(await store.get('0.1.0'))['registry.json']).toBe('{"v":"0.1.0"}')
    expect(await restoreArchive(store, join(dir, 'r'), '0.1.0')).toEqual([])
  })

  it('reports an archived version that is not served', async () => {
    served('0.1.0')
    const store = folderStore(join(dir, 'archive'))
    await store.putIfAbsent('0.1.0', packVersion(join(dir, 'r'), '0.1.0'))
    rmSync(join(dir, 'r/v0.1.0'), { recursive: true })
    expect(await missingVersions(store, join(dir, 'r'))).toEqual(['0.1.0'])
  })

  it('refuses to pack a folder without registry.json and to unpack odd file names', () => {
    expect(() => packVersion(join(dir, 'r'), '9.9.9')).toThrow(/no registry.json/)
    expect(() => unpackVersion('{"registry.json":"{}","../x.json":"{}"}', join(dir, 'r'), '1.0.0')).toThrow(/unexpected file name/)
    expect(existsSync(join(dir, 'x.json'))).toBe(false)
  })

  it('archives a version once and keeps it when archived again without --force', async () => {
    served('0.1.0', { 'button.json': '{"b":1}' })
    const store = folderStore(join(dir, 'archive'))
    expect(await archiveVersion(store, join(dir, 'r'), '0.1.0')).toBe('stored')
    served('0.1.0', { 'button.json': '{"b":2}' })
    expect(await archiveVersion(store, join(dir, 'r'), '0.1.0')).toBe('kept')
    expect(JSON.parse(await store.get('0.1.0'))['button.json']).toBe('{"b":1}')
  })

  it('replaces an archived version only with --force', async () => {
    served('0.1.0', { 'button.json': '{"b":1}' })
    const store = folderStore(join(dir, 'archive'))
    await archiveVersion(store, join(dir, 'r'), '0.1.0')
    served('0.1.0', { 'button.json': '{"b":2}' })
    expect(await archiveVersion(store, join(dir, 'r'), '0.1.0', true)).toBe('replaced')
    expect(JSON.parse(await store.get('0.1.0'))['button.json']).toBe('{"b":2}')
    expect(await archiveVersion(folderStore(join(dir, 'fresh')), join(dir, 'r'), '0.1.0', true)).toBe('stored')
  })
})
