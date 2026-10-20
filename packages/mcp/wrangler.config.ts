// Build settings for the remote server (cloudflare.config.ts): where the assets are (the block and template files).
// The scripts build with Wrangler's cf delegate (`pnpm cf:build` writes .cloudflare/output/v0) and
// deploy that with `cf deploy --prebuilt`, as apps/docs does.
import { defineWranglerConfig } from 'wrangler/experimental-config'

export default defineWranglerConfig({
  assetsDirectory: './data/sources',
  sendMetrics: false,
})
