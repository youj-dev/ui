// Build settings for the Cloudflare copy (cloudflare.config.ts): where the assets are.
// `cf build` and `cf dev` would detect Next.js and run `next build` / `next dev` through npx, so the
// scripts build with Wrangler's cf delegate instead (`pnpm cf:build` writes .cloudflare/output/v0)
// and deploy that with `cf deploy --prebuilt`. out/ is written by `pnpm build:static`.
import { defineWranglerConfig } from 'wrangler/experimental-config'

export default defineWranglerConfig({
  assetsDirectory: './out',
  sendMetrics: false,
})
