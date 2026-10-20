import { readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { add, addCommand } from '../src/add'
import { BASE_UI_INSTALL, DEFAULT_TEMPLATES, MOTION_INSTALL, PACKAGES, VERSION, withCorePeer } from '../src/constants'
import { doctor } from '../src/doctor'
import { init } from '../src/init'
import { dependencyRef, loadRegistryItem, needsLocalRegistry } from '../src/registry'
import { format } from '../src/run'
import { silentUi } from '../src/ui'
import { fakeRunner, fixture, read, write } from './helpers'

const LATEST = { YOUJ_REGISTRY_LATEST: '1' }

describe('which registry the CLI reads', () => {
  it('copies items from its own version by default, and from the latest alias with --latest', () => {
    const root = fixture('vite')
    expect(format(addCommand(root, ['button'], [], {}))).toBe(`bunx shadcn@4.21.0 add https://www.youj.dev/r/v${VERSION}/button.json`)
    expect(format(addCommand(root, ['button'], [], LATEST))).toBe('bunx shadcn@4.21.0 add https://www.youj.dev/r/button.json')
  })

  it('maps the namespace in components.json to the same URL', async () => {
    const pinned = fixture('next-app')
    await init({ cwd: pinned, yes: true, mode: 'registry' }, fakeRunner(pinned), silentUi(), {})
    expect(JSON.parse(read(pinned, 'components.json')).registries['@youj']).toBe(DEFAULT_TEMPLATES.versioned)
    const latest = fixture('next-app')
    await init({ cwd: latest, yes: true, mode: 'registry' }, fakeRunner(latest), silentUi(), LATEST)
    expect(JSON.parse(read(latest, 'components.json')).registries['@youj']).toBe(DEFAULT_TEMPLATES.latest)
  })

  it('reads a dependency named at any version of the site as an item of the registry in use', () => {
    expect(dependencyRef('https://www.youj.dev/r/v0.1.0/button.json', {})).toBe('button')
    expect(dependencyRef('https://www.youj.dev/r/v0.2.0-beta.1/youj-core.json', LATEST)).toBe('youj-core')
    expect(dependencyRef('https://www.youj.dev/r/button.json', {})).toBe('button')
    expect(dependencyRef('https://other.example/r/v1/button.json', {})).toBe('https://other.example/r/v1/button.json')
  })

  it('lets shadcn fetch from either of the site’s registries itself, but not from one of your own', () => {
    expect(needsLocalRegistry({})).toBe(false)
    expect(needsLocalRegistry(LATEST)).toBe(false)
    expect(needsLocalRegistry({ YOUJ_REGISTRY_URL: 'http://localhost:4000/r' })).toBe(true)
  })

  it('says how to get an item this version doesn’t have', async () => {
    vi.stubGlobal('fetch', async (url: string) => (url.endsWith('/registry.json') ? Response.json({ items: [{ name: 'button' }] }) : new Response(null, { status: 404 })))
    await expect(loadRegistryItem('new-thing', {})).rejects.toThrow(/v0\.1\.0\/new-thing\.json\)\. If it's newer than .+ pass --latest/)
    await expect(loadRegistryItem('new-thing', LATEST)).rejects.toThrow(/^new-thing isn't in the registry \(https:\/\/www\.youj\.dev\/r\/new-thing\.json\)$/)
  })

  it('says no registry is there when YOUJ_REGISTRY_URL names a folder without one, rather than that the item is missing', async () => {
    vi.stubGlobal('fetch', async () => new Response(null, { status: 404 }))
    await expect(loadRegistryItem('button', { YOUJ_REGISTRY_URL: 'https://example.test/wrong' })).rejects.toThrow(
      /^No registry found at https:\/\/example\.test\/wrong\/ \(it has no registry\.json\), so button can't be added from it\. Check YOUJ_REGISTRY_URL/,
    )
  })

  it('tries a dropped connection once more before saying the registry is unreachable', async () => {
    const dropped = (): Promise<Response> => Promise.reject(new TypeError('fetch failed'))
    const fetch = vi.fn(dropped).mockImplementationOnce(dropped).mockImplementationOnce(async () => Response.json({ name: 'button' }))
    vi.stubGlobal('fetch', fetch)
    await expect(loadRegistryItem('button', {})).resolves.toEqual({ name: 'button' })
    expect(fetch).toHaveBeenCalledTimes(2)
    fetch.mockClear()
    await expect(loadRegistryItem('button', {})).rejects.toThrow(/^Couldn't reach the registry for button .*fetch failed$/)
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})

describe('@youj/core, a peer the app owns', () => {
  it('joins any install of another Youj package the app doesn’t list it for', () => {
    expect(withCorePeer(['@youj/sound'], {})).toEqual(['@youj/sound', '@youj/core'])
    expect(withCorePeer(['@youj/sound'], { '@youj/core': '^0.1.0' })).toEqual(['@youj/sound'])
    expect(withCorePeer(['recharts'], {})).toEqual(['recharts'])
    expect(withCorePeer(['@youj/core'], {})).toEqual(['@youj/core'])
  })

  it('is installed with sound in an app that lists @youj/react alone', async () => {
    const root = fixture('vite')
    const pkg = JSON.parse(read(root, 'package.json'))
    write(root, 'package.json', JSON.stringify({ ...pkg, dependencies: { ...pkg.dependencies, '@youj/react': '^0.1.0' } }))
    const runner = fakeRunner(root)
    await add(root, ['sound'], [], runner, silentUi(), {})
    expect(runner.commands).toEqual([`bun add @youj/sound@^${VERSION} @youj/core@^${VERSION}`])
  })

  it('is installed by init with the components', async () => {
    const root = fixture('vite')
    const runner = fakeRunner(root)
    await init({ cwd: root, yes: true }, runner, silentUi(), {})
    expect(runner.commands.join('\n')).toContain(`${PACKAGES.motion}@^${VERSION}`)
  })
})

/** Fakes what an install leaves in node_modules. */
function installed(root: string, versions: Record<string, string>, at = 'node_modules') {
  for (const [name, version] of Object.entries(versions)) write(root, `${at}/${name}/package.json`, JSON.stringify({ name, version }))
}

describe('doctor and @youj/core', () => {
  async function app() {
    const root = fixture('next-app')
    await init({ cwd: root, yes: true }, fakeRunner(root), silentUi(), {})
    installed(root, { react: '19.2.0', tailwindcss: '4.1.13', motion: '13.4.4', '@base-ui/react': '1.9.0', '@youj/react': '0.1.0', '@youj/core': '0.1.0', '@youj/motion': '0.1.0', '@youj/icons': '0.1.0' })
    write(root, 'node_modules/@youj/react/dist/styles.css', "@import '@youj/core/styles.css';\n@source './';\n")
    return root
  }
  const errors = (root: string) => doctor(root, {}).filter((c) => c.level === 'error').map((c) => c.message)

  it('finds a second copy nested under another package (npm, Yarn, Bun)', async () => {
    const root = await app()
    expect(errors(root)).toEqual([])
    installed(root, { '@youj/core': '0.2.0' }, 'node_modules/@youj/react/node_modules')
    expect(errors(root)).toEqual([expect.stringMatching(/^2 copies of @youj\/core are installed \(0\.1\.0, 0\.2\.0\): components from one don't see the provider/)])
  })

  it('finds the same version resolved twice in pnpm’s store', async () => {
    const root = await app()
    write(root, 'node_modules/.pnpm/@youj+core@0.1.0_react@19.2.0/node_modules/@youj/core/package.json', '{}')
    write(root, 'node_modules/.pnpm/@youj+core@0.1.0_react@18.3.1/node_modules/@youj/core/package.json', '{}')
    write(root, 'node_modules/.pnpm/motion@13.4.4/node_modules/motion/package.json', '{}')
    expect(errors(root)).toEqual([expect.stringMatching(/^2 copies of @youj\/core are installed \(0\.1\.0, resolved against different peers\)/)])
  })

  it('accepts motion 13.4 and 14, installs ^14, and flags anything else', async () => {
    expect(MOTION_INSTALL).toBe('^14')
    const root = await app()
    for (const motion of ['13.4.4', '14.0.0']) {
      installed(root, { motion })
      expect(errors(root)).toEqual([])
    }
    installed(root, { motion: '15.0.0' })
    expect(doctor(root, {}).find((c) => c.message.startsWith('motion 15.0.0'))).toMatchObject({ level: 'error' })
    installed(root, { motion: '12.9.0' })
    expect(doctor(root, {}).find((c) => c.message.startsWith('motion 12.9.0'))).toMatchObject({ level: 'error', fix: expect.stringMatching(/ motion@\^14$/) })
  })

  it('accepts Base UI 1.8 and 1.9, installs ~1.9.0, and flags anything else', async () => {
    expect(BASE_UI_INSTALL).toBe('~1.9.0')
    const root = await app()
    for (const version of ['1.8.0', '1.9.0']) {
      installed(root, { '@base-ui/react': version })
      expect(errors(root)).toEqual([])
    }
    installed(root, { '@base-ui/react': '1.10.0' })
    expect(doctor(root, {}).find((c) => c.message.startsWith('@base-ui/react 1.10.0'))).toMatchObject({ level: 'error', fix: expect.stringMatching(/ @base-ui\/react@~1\.9\.0$/) })
  })

  it('asks the app to list it, or to install it when it’s missing', async () => {
    const root = await app()
    const pkg = JSON.parse(read(root, 'package.json'))
    delete pkg.dependencies['@youj/core']
    write(root, 'package.json', JSON.stringify(pkg))
    expect(doctor(root, {}).find((c) => c.message.startsWith('@youj/core isn’t in package.json'))).toMatchObject({ level: 'warn', fix: expect.stringContaining('@youj/core@^0.1.0') })
    rmSync(join(root, 'node_modules/@youj/core'), { recursive: true })
    expect(errors(root)).toContain('@youj/core isn’t installed (a peer dependency of @youj/react, @youj/motion, @youj/icons: it holds YoujProvider)')
  })
})

describe('the packages’ manifests', () => {
  const manifest = (dir: string) =>
    JSON.parse(readFileSync(join(import.meta.dirname, '../..', dir, 'package.json'), 'utf8')) as Record<string, Record<string, string> | undefined>

  it('declare @youj/core (and @youj/motion for the components) as a peer, never a dependency, and build against it as a devDependency', () => {
    const peers = { '@youj/core': ['motion', 'ui', 'icons', 'sound', 'illustrations', 'loaders'], '@youj/motion': ['ui'] }
    for (const [name, dirs] of Object.entries(peers))
      for (const dir of dirs) {
        const pkg = manifest(dir)
        expect(pkg.dependencies?.[name], `${dir} ${name}`).toBeUndefined()
        expect(pkg.peerDependencies?.[name], `${dir} ${name}`).toBe('workspace:*')
        expect(pkg.devDependencies?.[name], `${dir} ${name}`).toBe('workspace:*')
      }
  })

  it('leave react and react-dom to the app', () => {
    for (const dir of ['core', 'motion', 'ui', 'icons', 'sound', 'illustrations']) {
      const pkg = manifest(dir)
      for (const name of ['react', 'react-dom']) expect(pkg.dependencies?.[name], `${dir}: ${name}`).toBeUndefined()
      expect(pkg.peerDependencies?.react, dir).toBe('^19')
    }
  })
})
