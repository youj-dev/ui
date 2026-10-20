/* Keeps every released version of the copy-in registry served. A build writes only the current
 * public/r/v<version>/ (registry.ts), so each version is archived once on R2 (the youj-media bucket, under
 * registry-archive/) and restored into public/r at the next build. Without it the first patch release would
 * delete /r/v0.1.0/ and every 0.1.0 `youj add` would 404.
 *
 *   YOUJ_REGISTRY_ARCHIVE=r2 | <folder>   where the archive lives; registry.ts restores from it when set
 *   node scripts/registry-archive.ts archive   store the current version's folder (never overwrites)
 *   node scripts/registry-archive.ts archive --force   replace the archived copy of the current version: a
 *                                              deliberate act, for an archive taken from a build that was
 *                                              never released (run it from the release commit)
 *   node scripts/registry-archive.ts list      the archived versions
 *   node scripts/registry-archive.ts verify [--previous <version>]   every archived version is in public/r (and out/r
 *                                              when exported); --previous also demands that version be archived
 *
 * A version is one JSON object (file name → content): the registry is all text. Uses the `cf` CLI only,
 * from the repo root like media-upload.ts. A folder instead of `r2` is for rehearsing without credentials. */
import { execFile } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const DOCS = fileURLToPath(new URL('..', import.meta.url))
const REPO = join(DOCS, '../..')
const BUCKET = 'youj-media'
const PREFIX = 'registry-archive/'
const VERSION_KEY = /^registry-archive\/v(\d+\.\d+\.\d+(?:-[\w.]+)?)\.json$/

export interface Store {
  list(): Promise<string[]>
  get(version: string): Promise<string>
  /** Stores a version unless it is already there; returns whether it wrote. */
  putIfAbsent(version: string, content: string): Promise<boolean>
  /** Stores a version, replacing what is archived. Only `archive --force` calls it. */
  put(version: string, content: string): Promise<void>
}

const keyOf = (version: string) => `${PREFIX}v${version}.json`

export function folderStore(dir: string): Store {
  const file = (version: string) => join(dir, `v${version}.json`)
  return {
    async list() {
      return existsSync(dir) ? readdirSync(dir).flatMap((f) => /^v(.+)\.json$/.exec(f)?.[1] ?? []) : []
    },
    async get(version) {
      return readFileSync(file(version), 'utf8')
    },
    async putIfAbsent(version, content) {
      if (existsSync(file(version))) return false
      await this.put(version, content)
      return true
    },
    async put(version, content) {
      mkdirSync(dir, { recursive: true })
      writeFileSync(file(version), content)
    },
  }
}

export function r2Store(): Store {
  const cf = async (args: string[]) => {
    try {
      return (await run(join(DOCS, 'node_modules/.bin/cf'), args, { env: { ...process.env, CF_SEND_TELEMETRY: 'false' }, maxBuffer: 1 << 28, cwd: REPO })).stdout
    } catch (error) {
      const { stderr, message } = error as { stderr?: string; message: string }
      throw new Error(`registry archive: cf ${args.slice(0, 3).join(' ')}: ${(stderr || message).trim().split('\n')[0]}`)
    }
  }
  const list = async () => {
    const versions: string[] = []
    for (let after: string | undefined; ; ) {
      const objects: { key: string }[] = JSON.parse(await cf(['r2', 'objects', 'list', '--bucket-name', BUCKET, '--prefix', PREFIX, '--per-page', '1000', ...(after ? ['--start-after', after] : [])]))
      for (const { key } of objects) {
        const version = VERSION_KEY.exec(key)?.[1]
        if (version) versions.push(version)
      }
      if (!objects.length) return versions
      after = objects.at(-1)!.key
    }
  }
  const put = async (version: string, content: string) => {
    const tmp = join(DOCS, `.next/registry-archive-${version}.json`)
    mkdirSync(dirname(tmp), { recursive: true })
    writeFileSync(tmp, content)
    await cf(['r2', 'objects', 'put', keyOf(version), '--bucket-name', BUCKET, '--file', tmp, '--content-type', 'application/json'])
  }
  return {
    list,
    get: (version) => cf(['r2', 'objects', 'get', keyOf(version), '--bucket-name', BUCKET]),
    put,
    async putIfAbsent(version, content) {
      if ((await list()).includes(version)) return false
      await put(version, content)
      return true
    },
  }
}

/** The store `YOUJ_REGISTRY_ARCHIVE` names, or undefined when it is unset. */
export function configuredStore(value = process.env.YOUJ_REGISTRY_ARCHIVE): Store | undefined {
  if (!value) return undefined
  return value === 'r2' ? r2Store() : folderStore(value)
}

/** A version's folder as one JSON object, file name → content. */
export function packVersion(outDir: string, version: string): string {
  const dir = join(outDir, `v${version}`)
  if (!existsSync(join(dir, 'registry.json'))) throw new Error(`registry archive: ${dir} has no registry.json; run the registry build first`)
  const files = Object.fromEntries(readdirSync(dir).sort().map((f) => [f, readFileSync(join(dir, f), 'utf8')]))
  return JSON.stringify(files)
}

export function unpackVersion(content: string, outDir: string, version: string): number {
  const files = JSON.parse(content) as Record<string, string>
  if (typeof files['registry.json'] !== 'string') throw new Error(`registry archive: v${version} has no registry.json`)
  const dir = join(outDir, `v${version}`)
  mkdirSync(dir, { recursive: true })
  for (const [name, text] of Object.entries(files)) {
    if (!/^[\w.-]+\.json$/.test(name)) throw new Error(`registry archive: v${version} holds an unexpected file name ${JSON.stringify(name)}`)
    writeFileSync(join(dir, name), text)
  }
  return Object.keys(files).length
}

/** Puts every archived version except `current` (the build writes that one) back into outDir. */
export async function restoreArchive(store: Store, outDir: string, current: string): Promise<string[]> {
  const restored: string[] = []
  for (const version of (await store.list()).filter((v) => v !== current).sort()) {
    unpackVersion(await store.get(version), outDir, version)
    restored.push(version)
  }
  return restored
}

/** The archived versions whose registry.json is not under `dir`/v<version>/. */
export async function missingVersions(store: Store, dir: string): Promise<string[]> {
  return (await store.list()).filter((version) => !existsSync(join(dir, `v${version}`, 'registry.json'))).sort()
}

/** Archives a version's folder: never over an existing copy, unless `force`. */
export async function archiveVersion(store: Store, outDir: string, version: string, force = false): Promise<'stored' | 'kept' | 'replaced'> {
  const content = packVersion(outDir, version)
  if (force) {
    const existed = (await store.list()).includes(version)
    await store.put(version, content)
    return existed ? 'replaced' : 'stored'
  }
  return (await store.putIfAbsent(version, content)) ? 'stored' : 'kept'
}

async function main() {
  const [command] = process.argv.slice(2)
  const store = configuredStore()
  if (!store) throw new Error('registry archive: set YOUJ_REGISTRY_ARCHIVE to r2 or a folder')
  const publicR = join(DOCS, 'public/r')
  if (command === 'list') console.log((await store.list()).sort().join('\n'))
  else if (command === 'archive') {
    const version = (JSON.parse(readFileSync(join(REPO, 'packages/cli/package.json'), 'utf8')) as { version: string }).version
    const result = await archiveVersion(store, publicR, version, process.argv.includes('--force'))
    console.log(result === 'kept' ? `registry archive: v${version} is already archived; kept as it is (--force replaces it)` : `registry archive: ${result} v${version}`)
  } else if (command === 'verify') {
    const versions = await store.list()
    const previous = process.argv[process.argv.indexOf('--previous') + 1]
    if (process.argv.includes('--previous') && !versions.includes(previous!)) throw new Error(`registry archive: v${previous}, the version shipped before this one, is not archived; run pnpm -F docs registry:archive from its release commit first`)
    const missing = [...(await missingVersions(store, publicR)).map((v) => `public/r/v${v}`), ...(existsSync(join(DOCS, 'out/r')) ? (await missingVersions(store, join(DOCS, 'out/r'))).map((v) => `out/r/v${v}`) : [])]
    if (missing.length) throw new Error(`registry archive: ${missing.join(', ')} has no registry.json, so older CLIs would get a 404`)
    console.log(`registry archive: ${versions.length} archived version(s) all served (${versions.sort().join(', ') || 'none'})`)
  } else throw new Error('usage: registry-archive.ts archive [--force] | list | verify')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((error) => {
    console.error((error as Error).message)
    process.exit(1)
  })
