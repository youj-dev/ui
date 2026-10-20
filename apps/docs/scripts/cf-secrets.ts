// Writes the gitignored .secrets.json from the gate's environment variables, for deploys from
// Cloudflare's Git builds (the variables are build secrets there). Fails without STEALTH_PASSWORD,
// so a build can never deploy a version without the gate. The file is owner-only (0600); the cf:ci:deploy script removes it after the deploy.
import { chmodSync, readFileSync, writeFileSync } from 'node:fs'

// The Git build deploys staging only: refuse a build output made for another mode.
const built = JSON.parse(readFileSync(new URL('../.cloudflare/output/v0/config.json', import.meta.url), 'utf8'))
if (built.buildContext?.mode !== 'staging') {
  console.error(`cf-secrets: the build output is for mode ${built.buildContext?.mode}, not staging; refusing to deploy`)
  process.exit(1)
}

const names = ['STEALTH_PASSWORD', 'STEALTH_TOKEN', 'STEALTH_SECRET'] as const
if (!process.env.STEALTH_PASSWORD) {
  console.error('cf-secrets: STEALTH_PASSWORD is not set; refusing to deploy without the gate')
  process.exit(1)
}
const secrets = Object.fromEntries(names.filter((name) => process.env[name]).map((name) => [name, process.env[name]]))
const file = new URL('../.secrets.json', import.meta.url)
writeFileSync(file, JSON.stringify(secrets), { mode: 0o600 })
chmodSync(file, 0o600) // the mode above only applies to a new file
console.log(`cf-secrets: wrote ${Object.keys(secrets).join(', ')}`)
