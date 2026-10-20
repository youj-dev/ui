import { existsSync } from 'node:fs'
import { createMDX } from 'fumadocs-mdx/next'
import { headers } from './lib/headers.mjs'
import { siteRedirects } from './lib/redirects.mjs'
import { workspacePackages } from './lib/workspace-packages.mjs'

// The pages read generated/*.json; `pnpm generate` writes them (dev and build run it first; the tests that import this config don't need them).
if (!process.env.VITEST && !existsSync(new URL('./generated/props.json', import.meta.url))) {
  throw new Error('apps/docs/generated is missing: run `pnpm -F docs generate` before next dev or next build.')
}

// `pnpm build:static` (scripts/build-static.ts) sets this: the same site as plain files for Cloudflare, in out/.
// Vercel-only routes carry `.vercel.ts(x)` (the stealth gate's server sign-in page and login route) and static-only
// ones `.static.ts(x)` (the static sign-in page, the /docs.md index), so each build compiles only its own.
// proxy.ts keeps its name (Next reads a `proxy.vercel.ts` as edge middleware); an export has no proxy, so Next drops it.
const STATIC = process.env.YOUJ_STATIC_EXPORT === '1'

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  pageExtensions: [
    'tsx',
    'ts',
    'jsx',
    'js',
    ...(STATIC ? ['static.tsx', 'static.ts'] : ['vercel.tsx', 'vercel.ts']),
  ],
  ...(STATIC && { output: 'export' }),
  // The workspace packages ship TypeScript source, like a registry install would.
  transpilePackages: workspacePackages().map((p) => p.name),
  // Don't write AGENTS.md / CLAUDE.md into the app on `next dev`; the workspace owns its agent docs.
  agentRules: false,
  // The client router keeps pages it has visited or prefetched: every page is prerendered and only changes with a
  // deploy, so a revisit within half an hour (or a back and forth) renders from memory with no request. Both builds.
  experimental: {
    staleTimes: { dynamic: 30, static: 1800 },
    // Turbopack's persistent build cache in .next/cache (the default since Next 16.3, kept explicit: ship's speed depends on it).
    turbopackFileSystemCacheForBuild: true,
  },
  // The dev badge sits over the sidebar; the site's own chrome is the thing under review.
  devIndicators: false,
  // Pages rendered per request (the stealth gate, the .md twins) still build the nav from content/docs.
  // Only /stealth is a function (every other page and the .md twins are prerendered), so only it needs them.
  // Its trace keeps the packages' source and registry too: /stealth renders the layout per request, and the nav
  // reads the showcase (block and story sources) from disk, so excluding them made the sign-in page fail (ENOENT).
  outputFileTracingIncludes: { '/stealth': ['./content/**/*'] },
  // Cache headers (lib/headers.mjs). The static export can't carry them: scripts/build-static.ts writes the same list as _headers.
  ...(!STATIC && { headers: async () => headers() }),
  // /graphics (lib/redirects.mjs); _redirects on Cloudflare.
  ...(!STATIC && { redirects: async () => siteRedirects() }),
  // Every docs page as Markdown at its own URL plus `.md` (the llms.txt convention), served by app/llms.md.
  // The static export writes the twins at these URLs as files instead (scripts/build-static.ts).
  ...(!STATIC && {
    rewrites: async () => [
      { source: '/docs.md', destination: '/llms.md' },
      { source: '/docs/:path*.md', destination: '/llms.md/:path*' },
    ],
  }),
}

export default createMDX()(config)
