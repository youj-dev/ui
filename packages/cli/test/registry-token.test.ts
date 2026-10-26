import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { fetchRegistryItem } from '../src/add'
import { loadRegistryItem } from '../src/registry'
import { run } from '../src/run'
import { VERSION } from '../src/constants'
import { init } from '../src/init'
import { CliError, silentUi } from '../src/ui'
import { fakeRunner, fixture, read, write } from './helpers'

const TOKEN = { YOUJ_REGISTRY_TOKEN: 'tok-123' }

describe('YOUJ_REGISTRY_TOKEN', () => {
  it('sends Authorization: Bearer on registry fetches when set, and nothing when not', async () => {
    const fetch = vi.fn(async () => Response.json({ files: [] }))
    vi.stubGlobal('fetch', fetch)
    await fetchRegistryItem('button', { ...TOKEN, YOUJ_REGISTRY_URL: 'https://www.youj.dev/r' })
    await fetchRegistryItem('button', {})
    const headers = fetch.mock.calls.map((call) => (call as unknown as [string, RequestInit])[1].headers)
    expect(headers).toEqual([{ Authorization: 'Bearer tok-123' }, {}])
  })

  it('sends the token only to the registry in use: a dependency URL read from a local registry file gets none', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'youj-registry-'))
    try {
      const dependency = 'https://other.test/r/extra.json'
      writeFileSync(join(dir, 'page.json'), JSON.stringify({ name: 'page', registryDependencies: [dependency, 'http://127.0.0.1:9/r/local.json'] }))
      const fetch = vi.fn(async () => Response.json({ name: 'extra', files: [] }))
      vi.stubGlobal('fetch', fetch)
      const env = { ...TOKEN, YOUJ_REGISTRY_URL: `file://${dir}/{name}.json` }
      const item = await loadRegistryItem('page', env)
      for (const dep of item.registryDependencies ?? []) await loadRegistryItem(dep, env)
      const calls = fetch.mock.calls as unknown as [string, RequestInit][]
      expect(calls.map(([url]) => url)).toEqual([dependency, 'http://127.0.0.1:9/r/local.json'])
      expect(calls.map(([, init]) => init.headers)).toEqual([{}, {}])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('makes init write the registry with an env-backed header, never the token itself', async () => {
    const root = fixture('next-app')
    await init({ cwd: root, yes: true, mode: 'registry' }, fakeRunner(root), silentUi(), TOKEN)
    const text = read(root, 'components.json')
    expect(text).not.toContain('tok-123')
    expect(JSON.parse(text).registries).toEqual({
      '@youj': { url: `https://www.youj.dev/r/v${VERSION}/{name}.json`, headers: { Authorization: 'Bearer ${YOUJ_REGISTRY_TOKEN}' } },
    })
  })

  it('adds the header to a registry init wrote before, and keeps it on a rerun without the token', async () => {
    const root = fixture('next-app')
    write(root, 'components.json', JSON.stringify({ style: 'new-york', registries: { '@youj': `https://www.youj.dev/r/v${VERSION}/{name}.json` } }))
    await init({ cwd: root, yes: true, mode: 'registry' }, fakeRunner(root), silentUi(), TOKEN)
    const withHeader = JSON.parse(read(root, 'components.json'))
    expect(withHeader.registries['@youj'].headers).toEqual({ Authorization: 'Bearer ${YOUJ_REGISTRY_TOKEN}' })

    await init({ cwd: root, yes: true, mode: 'registry' }, fakeRunner(root), silentUi(), {})
    expect(JSON.parse(read(root, 'components.json'))).toEqual(withHeader)
  })

  it('says in one line to set the token when shadcn stops for it, with no stack trace', async () => {
    const shadcn = 'Registry "@youj" requires the following environment variables:\n\n  • YOUJ_REGISTRY_TOKEN\n\nSet them and try again.'
    const failure = run({ cmd: process.execPath, args: ['-e', `console.error(${JSON.stringify(shadcn)}); process.exit(1)`] }, process.cwd(), { capture: true })
    await expect(failure).rejects.toBeInstanceOf(CliError)
    await expect(failure).rejects.toThrow(/needs YOUJ_REGISTRY_TOKEN in your shell/)
  })

  it('suggests the closest items for a name the registry does not have', async () => {
    vi.stubGlobal('fetch', async (url: string) =>
      String(url).endsWith('/registry.json') ? Response.json({ items: [{ name: 'button' }, { name: 'dialog' }, { name: 'badge' }] }) : new Response(null, { status: 404 }),
    )
    await expect(loadRegistryItem('buton', {})).rejects.toThrow(/Did you mean button\?/)
    await expect(loadRegistryItem('zzzzzzzz', {})).rejects.not.toThrow(/Did you mean/)
  })
})
