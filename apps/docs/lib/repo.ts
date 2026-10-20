/* Where the source lives. The repository may move or be renamed, so every
 * link to it on the site, in the Markdown twins and in /llms.txt is built
 * here, from NEXT_PUBLIC_YOUJ_REPO_URL and NEXT_PUBLIC_YOUJ_REPO_BRANCH.
 * MDX writes `repo:` links instead of URLs (`[CONTRIBUTING.md](repo:file/CONTRIBUTING.md)`,
 * `[open an issue](repo:issues/new)`); source.config.ts and lib/markdown.ts resolve them.
 * Kept free of imports: the MCP index loads this file outside Next. */

type Env = Record<string, string | undefined>

export const DEFAULT_REPO_URL = 'https://github.com/youj-dev/ui'
export const DEFAULT_REPO_BRANCH = 'main'

// Spelled out so Next inlines them into client bundles.
const processEnv: Env = {
  NEXT_PUBLIC_YOUJ_REPO_URL: process.env.NEXT_PUBLIC_YOUJ_REPO_URL,
  NEXT_PUBLIC_YOUJ_REPO_BRANCH: process.env.NEXT_PUBLIC_YOUJ_REPO_BRANCH,
}

/** The repository's https URL, without a trailing slash. Throws on anything else, so a bad value fails the build. */
export function repoUrl(env: Env = processEnv): string {
  const value = env.NEXT_PUBLIC_YOUJ_REPO_URL?.trim().replace(/\/+$/, '') || DEFAULT_REPO_URL
  let url: URL | undefined
  try {
    url = new URL(value)
  } catch {}
  if (!url || url.protocol !== 'https:' || url.search || url.hash || url.pathname === '/') {
    throw new Error(`NEXT_PUBLIC_YOUJ_REPO_URL must be a repository's https URL, like ${DEFAULT_REPO_URL}; got "${value}"`)
  }
  return value
}

/** The default branch, for links to files. */
export function repoBranch(env: Env = processEnv): string {
  const branch = env.NEXT_PUBLIC_YOUJ_REPO_BRANCH?.trim() || DEFAULT_REPO_BRANCH
  if (!/^[\w.][\w./-]*$/.test(branch)) throw new Error(`NEXT_PUBLIC_YOUJ_REPO_BRANCH is not a branch name: "${branch}"`)
  return branch
}

export const REPO_URL = repoUrl()
export const REPO_BRANCH = repoBranch()

/** A file in the repository, on the default branch: `repoFile('LICENSE')`, `repoFile('CONTRIBUTING.md#improving-a-language')`. */
export const repoFile = (path: string) => `${REPO_URL}/blob/${REPO_BRANCH}/${path.replace(/^\.?\//, '')}`

export const repo = {
  url: REPO_URL,
  issues: `${REPO_URL}/issues`,
  newIssue: `${REPO_URL}/issues/new`,
  discussions: `${REPO_URL}/discussions`,
  releases: `${REPO_URL}/releases`,
  /** GitHub's private vulnerability report form. */
  newAdvisory: `${REPO_URL}/security/advisories/new`,
  file: repoFile,
}

/** A `repo:` href as a URL: `repo:` is the repository, `repo:file/<path>` a file on the default branch, `repo:<path>` any page under it. Other hrefs pass through. */
export function resolveRepoHref(href: string): string {
  if (!href.startsWith('repo:')) return href
  const rest = href.slice('repo:'.length).replace(/^\/+/, '')
  if (rest.startsWith('file/')) return repoFile(rest.slice('file/'.length))
  return rest ? `${REPO_URL}/${rest}` : REPO_URL
}

/** Resolves the `repo:` links in Markdown text. */
export const resolveRepoLinks = (text: string) => text.replace(/\]\((repo:[^)\s]*)\)/g, (_, href: string) => `](${resolveRepoHref(href)})`)

/** Points text written against the default repository (SECURITY.md, read at build time) at the configured one. */
export function retargetRepo(text: string, to = REPO_URL): string {
  if (to === DEFAULT_REPO_URL) return text
  const slug = (url: string) => `\`${new URL(url).pathname.slice(1)}\``
  return text.replaceAll(DEFAULT_REPO_URL, to).replaceAll(slug(DEFAULT_REPO_URL), slug(to))
}
