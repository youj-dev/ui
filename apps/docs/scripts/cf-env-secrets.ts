// Writes the gitignored secrets file of a Cloudflare environment (.secrets.staging.json, .secrets.production.json),
// for `cf deploy --secrets-file`. Never prints a value.
//
//   node scripts/cf-env-secrets.ts <staging|production> [--rotate]   write it; the password comes from
//                                                                    STEALTH_PASSWORD or a hidden prompt
//   node scripts/cf-env-secrets.ts --check <staging|production>      exit 1 unless the file holds all three
//
// STEALTH_TOKEN and STEALTH_SECRET are generated (32 random bytes) and kept on later runs, so a new password
// doesn't sign testers out; --rotate replaces them.
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { buildSecrets, ENVIRONMENTS, missingSecrets, secretsFile, type Environment, type Secrets } from './cf-env-secrets-core.ts'

const args = process.argv.slice(2)
const check = args.includes('--check')
const rotate = args.includes('--rotate')
const environment = args.find((arg) => (ENVIRONMENTS as readonly string[]).includes(arg)) as Environment | undefined
if (!environment) {
  console.error(`usage: cf-env-secrets.ts [--check] [--rotate] <${ENVIRONMENTS.join('|')}>`)
  process.exit(2)
}
const path = new URL(`../${secretsFile(environment)}`, import.meta.url)
const existing: Secrets = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {}

if (check) {
  const missing = missingSecrets(existing)
  if (missing.length) {
    console.error(`cf-env-secrets: ${secretsFile(environment)} lacks ${missing.join(', ')}; run: node scripts/cf-env-secrets.ts ${environment}`)
    process.exit(1)
  }
  console.log(`cf-env-secrets: ${secretsFile(environment)} is complete`)
  process.exit(0)
}

/** Reads a line from the terminal without echoing it. */
function promptHidden(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) return reject(new Error('no terminal to prompt on; set STEALTH_PASSWORD'))
    process.stdout.write(question)
    let value = ''
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf8')
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === '\r' || char === '\n' || char === '\u0004') {
          process.stdin.setRawMode(false)
          process.stdin.pause()
          process.stdin.off('data', onData)
          process.stdout.write('\n')
          return resolve(value)
        }
        if (char === '\u0003') process.exit(130)
        if (char === '\u007f') value = value.slice(0, -1)
        else value += char
      }
    }
    process.stdin.on('data', onData)
  })
}

let password = process.env.STEALTH_PASSWORD ?? ''
if (!password && existing.STEALTH_PASSWORD && !process.stdin.isTTY) password = existing.STEALTH_PASSWORD
if (!password) {
  password = await promptHidden(`${environment} STEALTH_PASSWORD (hidden): `)
  if (password && password !== (await promptHidden('again: '))) {
    console.error('cf-env-secrets: the two entries differ; nothing written')
    process.exit(1)
  }
}
if (!password) {
  console.error('cf-env-secrets: no password; nothing written')
  process.exit(1)
}
const secrets = buildSecrets(existing, password, rotate)
writeFileSync(path, JSON.stringify(secrets), { mode: 0o600 })
chmodSync(path, 0o600) // the mode above only applies to a new file
console.log(`cf-env-secrets: wrote ${secretsFile(environment)} (${Object.keys(secrets).join(', ')}; values not shown)`)
