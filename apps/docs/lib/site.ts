/* The site's public origin. Install commands and the hosted registry's
 * cross-item URLs are both built from it, so they always agree.
 * Kept free of imports: the Node build scripts load this file directly. */

type Env = Record<string, string | undefined>

/** The site's public origin. The apex only redirects here, so a URL naming the apex is taken to mean it. */
const CANONICAL_ORIGIN = 'https://www.youj.dev'

const canonical = (url: string) => url.replace(/^https?:\/\/youj\.dev$/, CANONICAL_ORIGIN)

export function siteUrl(env: Env = process.env): string {
  if (env.NEXT_PUBLIC_SITE_URL) {
    const url = env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/+$/, '')
    // A bare domain ("www.youj.dev") is taken to mean https.
    return canonical(/^https?:\/\//.test(url) ? url : `https://${url}`)
  }
  // Set by Vercel at build time: the project's production domain, without protocol.
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return canonical(`https://${env.VERCEL_PROJECT_PRODUCTION_URL}`)
  return 'http://localhost:3100'
}

export function registryUrl(env: Env = process.env): string {
  return `${siteUrl(env)}/r`
}

/**
 * The registry built items name their registryDependencies under (shadcn reads a bare
 * name as its own registry, so they're URLs): this deployment's, or production's in a
 * local build, where a localhost URL would only resolve on the machine that built it.
 * `youj add` fetches every Youj dependency from the registry it's using
 * (YOUJ_REGISTRY_URL) whatever origin the URL names.
 */
export function dependencyRegistryUrl(env: Env = process.env): string {
  return env.NEXT_PUBLIC_SITE_URL || env.VERCEL_PROJECT_PRODUCTION_URL ? registryUrl(env) : `${CANONICAL_ORIGIN}/r`
}

/** The homepage the published registry names: this deployment's origin, or the public site in a local build. */
export function registryHomepage(env: Env = process.env): string {
  return env.NEXT_PUBLIC_SITE_URL || env.VERCEL_PROJECT_PRODUCTION_URL ? siteUrl(env) : CANONICAL_ORIGIN
}

/** Fills `{registry}` and `{site}` placeholders with this deployment's URLs. */
export function fillUrls(text: string, env: Env = process.env): string {
  return text.replaceAll('{registry}', registryUrl(env)).replaceAll('{site}', siteUrl(env))
}

/** Whether this build is the public site: only the canonical origin is indexed, so staging, previews and local builds say noindex. */
export const isCanonicalSite = (env: Env = process.env) => siteUrl(env) === CANONICAL_ORIGIN
