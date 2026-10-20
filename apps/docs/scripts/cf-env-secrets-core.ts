// The pure part of cf-env-secrets.ts: what goes in an environment's secrets file.
import { randomBytes } from 'node:crypto'

export const ENVIRONMENTS = ['staging', 'production'] as const
export type Environment = (typeof ENVIRONMENTS)[number]
export type Secrets = Partial<Record<'STEALTH_PASSWORD' | 'STEALTH_TOKEN' | 'STEALTH_SECRET', string>>

export const randomSecret = () => randomBytes(32).toString('base64url')

/** The file for an environment (gitignored by `.secrets.*.json`), next to package.json. */
export const secretsFile = (environment: Environment) => `.secrets.${environment}.json`

/**
 * The file's next contents. The password is always the one given; the token and the secret are kept from the
 * existing file (so testers' cookies and CLI tokens survive a password change), generated when missing, and
 * regenerated with `rotate`.
 */
export function buildSecrets(existing: Secrets, password: string, rotate = false, generate = randomSecret): Required<Secrets> {
  if (!password) throw new Error('a password is required')
  return {
    STEALTH_PASSWORD: password,
    STEALTH_TOKEN: (!rotate && existing.STEALTH_TOKEN) || generate(),
    STEALTH_SECRET: (!rotate && existing.STEALTH_SECRET) || generate(),
  }
}

/** The names a secrets file lacks, for the deploy guard (a production version must never go out without the gate). */
export function missingSecrets(secrets: Secrets): string[] {
  return (['STEALTH_PASSWORD', 'STEALTH_TOKEN', 'STEALTH_SECRET'] as const).filter((name) => !secrets[name])
}
