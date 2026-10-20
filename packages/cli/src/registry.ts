/* Reading registry items the way the CLI's own steps need them: from the registry in
 * use (YOUJ_REGISTRY_URL, else the docs site), with the bearer token when there is
 * one, and with every Youj dependency named against that same registry. */

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_TEMPLATES, REGISTRY_LATEST_ENV, REGISTRY_NAMESPACE, registryHeaders, registryTemplate, REGISTRY_TOKEN_ENV, VERSION } from './constants'
import { CliError } from './ui'

export interface RegistryFile {
  path: string
  type?: string
  target?: string
  content?: string
}

export interface RegistryItem {
  name?: string
  type?: string
  dependencies?: string[]
  registryDependencies?: string[]
  files?: RegistryFile[]
  css?: unknown
  cssVars?: unknown
}

/** Hosts whose `/r/<name>.json` (and `/r/v<version>/<name>.json`) items are Youj's: the docs site, and a local one (`pnpm -F docs dev`, or a registry built before the origin was pinned to production), so its items resolve from whichever registry is in use. */
const YOUJ_HOSTS = /^(?:www\.)?youj\.dev$|^localhost$|^127\.0\.0\.1$/

/**
 * What a registry dependency names, as the CLI fetches it: a Youj item's bare
 * name (so it comes from the registry in use, whatever origin the build wrote into
 * the URL), or another registry's URL as it is.
 */
export function dependencyRef(dep: string, env: NodeJS.ProcessEnv = process.env): string {
  if (dep.startsWith(`${REGISTRY_NAMESPACE}/`)) return dep.slice(REGISTRY_NAMESPACE.length + 1)
  const [before, after] = registryTemplate(env).split('{name}') as [string, string]
  if (dep.startsWith(before) && dep.endsWith(after) && /^[\w.-]+$/.test(dep.slice(before.length, dep.length - after.length))) return dep.slice(before.length, dep.length - after.length)
  if (!/^https?:\/\//.test(dep)) return dep
  const url = new URL(dep)
  const name = url.pathname.match(/\/r\/(?:v[\w.-]+\/)?([\w.-]+)\.json$/)?.[1]
  const active = templateOrigin(env)
  return name && (YOUJ_HOSTS.test(url.hostname) || url.origin === active) ? name : dep
}

function templateOrigin(env: NodeJS.ProcessEnv): string | null {
  try {
    return new URL(registryTemplate(env).replace('{name}', 'x')).origin
  } catch {
    return null
  }
}

/** Where a ref (a Youj name, or a URL) is fetched from. */
export const itemUrl = (ref: string, env: NodeJS.ProcessEnv = process.env) => (/^https?:\/\//.test(ref) ? ref : registryTemplate(env).replace('{name}', ref))

/**
 * A registry item's JSON. Throws a CliError saying why when it can't be had: not
 * in the registry, refused (the private registry wants YOUJ_REGISTRY_TOKEN), or
 * unreachable. `file://` templates read from disk. The token only goes to the
 * registry in use, never to another registry's URL.
 */
export async function loadRegistryItem(ref: string, env: NodeJS.ProcessEnv = process.env): Promise<RegistryItem> {
  const url = itemUrl(ref, env)
  if (url.startsWith('file://')) {
    try {
      return JSON.parse(await readFile(fileURLToPath(url), 'utf8')) as RegistryItem
    } catch {
      throw new CliError(`${ref} isn't in the registry (${url})`)
    }
  }
  const ours = /^https?:\/\//.test(ref) ? new URL(ref).origin === templateOrigin(env) : true
  const get = () => fetch(url, { headers: ours ? registryHeaders(env) : {}, signal: AbortSignal.timeout(15_000) })
  let res: Response
  try {
    // A dropped connection ("fetch failed") is usually gone a moment later, so it's tried once more; a timeout isn't.
    res = await get().catch(async (error: unknown) => {
      if (error instanceof Error && error.name === 'TimeoutError') throw error
      await new Promise((resolve) => setTimeout(resolve, 500))
      return get()
    })
  } catch (error) {
    throw new CliError(`Couldn't reach the registry for ${ref} (${url}): ${error instanceof Error ? error.message : String(error)}`)
  }
  if (res.status === 401 || res.status === 403)
    throw new CliError(
      `The registry refused ${url} (${res.status}). ${
        env[REGISTRY_TOKEN_ENV]?.trim() ? `It doesn't accept the token in ${REGISTRY_TOKEN_ENV}: check it's the current one.` : `If it's a private registry, set ${REGISTRY_TOKEN_ENV}.`
      }`,
    )
  const index = res.status === 404 && !/^https?:\/\//.test(ref) ? await registryIndex(env) : []
  if (index === null)
    throw new CliError(
      `No registry found at ${itemUrl('registry', env).replace(/registry\.json$/, '')} (it has no registry.json), so ${ref} can't be added from it.${env.YOUJ_REGISTRY_URL?.trim() ? ' Check YOUJ_REGISTRY_URL: it names the folder that holds registry.json and the items.' : ''}`,
    )
  if (res.status === 404) throw new CliError(`${ref} isn't in the registry (${url})${didYouMean(ref, index, env)}${url.startsWith(DEFAULT_TEMPLATES.versioned.split('{name}')[0]!) ? `. If it's newer than ${VERSION}, run the latest CLI (npx youj@latest), or pass --latest (${REGISTRY_LATEST_ENV}=1) to copy the latest items` : ''}`)
  if (!res.ok) throw new CliError(`The registry answered ${res.status} for ${url}`)
  try {
    return (await res.json()) as RegistryItem
  } catch {
    throw new CliError(`${url} isn't a registry item (not JSON)`)
  }
}

/** The edit distance between two names, for `didYouMean`. */
function distance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const row = [i]
    for (let j = 1; j <= b.length; j++) row[j] = Math.min(prev[j]! + 1, row[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1))
    prev = row
  }
  return prev[b.length]!
}

/**
 * The item names in the registry's own index (registry.json), or null when it has
 * none (a 404: no registry is there at all). [] when it can't be read (best effort: never throws).
 */
async function registryIndex(env: NodeJS.ProcessEnv): Promise<string[] | null> {
  try {
    const res = await fetch(itemUrl('registry', env), { headers: registryHeaders(env), signal: AbortSignal.timeout(5_000) })
    if (res.status === 404) return null
    return ((await res.json()) as { items?: { name?: string }[] }).items?.map((i) => i.name).filter((n): n is string => Boolean(n)) ?? []
  } catch {
    return []
  }
}

/** ". Did you mean button?" from the registry's index, or '' when nothing is close. */
function didYouMean(ref: string, names: string[], env: NodeJS.ProcessEnv): string {
  const close = names
    .map((name) => ({ name, d: distance(ref, name) }))
    .filter(({ name, d }) => d <= Math.max(2, Math.floor(ref.length / 3)) || name.includes(ref) || ref.includes(name))
    .sort((a, b) => a.d - b.d)
    .slice(0, 3)
    .map(({ name }) => name)
  return close.length ? `. Did you mean ${close.join(', ')}? (every item: ${itemUrl('registry', env)})` : ''
}

/** A registry item's JSON, or null when the registry doesn't have it (or can't be reached). */
export async function fetchRegistryItem(name: string, env: NodeJS.ProcessEnv = process.env): Promise<RegistryItem | null> {
  try {
    return await loadRegistryItem(name, env)
  } catch {
    return null
  }
}


/**
 * Whether shadcn can't be left to fetch the items itself: a registry of your own
 * (the built items name their dependencies on the docs site's origin) or a private
 * one (shadcn sends the token only for the @youj namespace, not to dependency URLs).
 */
export const needsLocalRegistry = (env: NodeJS.ProcessEnv = process.env) =>
  !Object.values<string>(DEFAULT_TEMPLATES).includes(registryTemplate(env)) || Boolean(env[REGISTRY_TOKEN_ENV]?.trim())

/**
 * The items and every Youj item they depend on, fetched from the registry in use
 * (with the token) and written to a temporary folder, each one's dependencies pointing
 * at the files beside it: shadcn reads local item files and their local dependencies,
 * so it installs from the registry in use without fetching anything of Youj's.
 * Other registries' URLs stay as they are. `path` maps a ref to its file.
 */
export async function localRegistry(refs: string[], env: NodeJS.ProcessEnv = process.env): Promise<{ path: (ref: string) => string | undefined; dispose: () => Promise<void> }> {
  const dir = await mkdtemp(join(tmpdir(), 'youj-items-'))
  const file = (name: string) => join(dir, `${name.replace(/[^\w.-]/g, '_')}.json`)
  const seen = new Set<string>()
  let level = refs.map((ref) => dependencyRef(ref, env)).filter((ref) => !/^https?:/.test(ref))
  try {
    while (level.length) {
      for (const ref of level) seen.add(ref)
      const jsons = await Promise.all(level.map((ref) => loadRegistryItem(ref, env)))
      const next = new Set<string>()
      await Promise.all(
        jsons.map((json, i) => {
          const deps = (json.registryDependencies ?? []).map((dep) => {
            const ref = dependencyRef(dep, env)
            if (/^https?:/.test(ref)) return ref
            if (!seen.has(ref)) next.add(ref)
            return file(ref)
          })
          return writeFile(file(level[i]!), JSON.stringify({ ...json, registryDependencies: deps }))
        }),
      )
      level = [...next].filter((ref) => !seen.has(ref))
    }
  } catch (error) {
    await rm(dir, { recursive: true, force: true })
    throw error
  }
  return {
    path: (ref) => {
      const name = dependencyRef(ref, env)
      return seen.has(name) ? file(name) : undefined
    },
    dispose: () => rm(dir, { recursive: true, force: true }),
  }
}
