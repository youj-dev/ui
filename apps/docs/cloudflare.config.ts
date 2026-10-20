// The Cloudflare copy of the site (README → Deploying to Cloudflare): the static export in out/
// (`pnpm build:static`), served as Workers static assets, with worker/index.ts in front of the
// paths the stealth gate covers. Written by hand, not by `cf init` (which would rewrite package.json
// and run npm in this pnpm workspace). The assets folder is in wrangler.config.ts, which builds it.
// Secrets (STEALTH_PASSWORD, and optionally STEALTH_TOKEN and STEALTH_SECRET) are set in Cloudflare,
// never here; without STEALTH_PASSWORD the Worker gates nothing.
// Two environments, chosen by `--mode staging|production` (lib/cf-env.ts): the Worker's name and domains differ, nothing else.
import { bindings, defineConfig } from 'cf/config'
import { cloudflareEnv } from './lib/cf-env.ts'
import { RUN_WORKER_FIRST } from './lib/static-host.ts'

export default defineConfig(({ mode }) => {
  const env = cloudflareEnv(mode)
  return {
    worker: {
      name: env.name,
      compatibilityDate: '2026-09-25',
      entrypoint: './worker/index.ts',
      env: { ASSETS: bindings.assets() },
      assets: {
        // /docs/button serves docs/button.html, and /docs/button.html redirects to it.
        htmlHandling: 'auto-trailing-slash',
        // A path with no file gets out/404.html (the site's not-found page) with a 404.
        notFoundHandling: '404-page',
        // Only these reach the Worker first; the build's JS and CSS, screenshots, loops and media go straight to assets.
        runWorkerFirst: RUN_WORKER_FIRST,
      },
      observability: { enabled: true },
      // Attached on deploy (the youj.dev zone must be on the account; one level deep, so the free certificate covers it).
      domains: [...env.domains],
    },
  }
})
