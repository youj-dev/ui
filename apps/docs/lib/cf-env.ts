// The two Cloudflare environments of the docs site, picked by `cf`'s --mode (cloudflare.config.ts).
// staging: Worker youj-staging at staging.youj.dev, deployed by Workers Builds on every push to main.
// production: Worker youj at www.youj.dev, deployed by hand with scripts/ship.sh only.
export const CF_ENVS = {
  staging: { name: 'youj-staging', domains: ['staging.youj.dev'] },
  production: { name: 'youj', domains: ['www.youj.dev'] },
} as const

export type CfEnvName = keyof typeof CF_ENVS

/** The environment for a --mode. No mode, an unknown one, or production inside a Workers Builds run (WORKERS_CI is set there) is an error, so a Git build can never ship production. */
export function cloudflareEnv(mode: string | undefined, workersCi: string | undefined = process.env.WORKERS_CI) {
  if (mode !== 'staging' && mode !== 'production') {
    throw new Error(`cloudflare.config: pass --mode staging or --mode production (got ${mode ?? 'none'})`)
  }
  if (mode === 'production' && workersCi) {
    throw new Error('cloudflare.config: production is deployed by scripts/ship.sh, never from a Workers Builds run')
  }
  return CF_ENVS[mode]
}
