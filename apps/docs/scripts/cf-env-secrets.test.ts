import { describe, expect, it } from 'vitest'
import { buildSecrets, missingSecrets, secretsFile } from './cf-env-secrets-core'

const sequence = () => {
  let n = 0
  return () => `generated-${++n}`
}

describe('cf env secrets', () => {
  it('generates a token and a secret for a new file and keeps the given password', () => {
    expect(buildSecrets({}, 'pw', false, sequence())).toEqual({ STEALTH_PASSWORD: 'pw', STEALTH_TOKEN: 'generated-1', STEALTH_SECRET: 'generated-2' })
  })

  it('keeps an existing token and secret when the password changes', () => {
    const next = buildSecrets({ STEALTH_PASSWORD: 'old', STEALTH_TOKEN: 't', STEALTH_SECRET: 's' }, 'new', false, sequence())
    expect(next).toEqual({ STEALTH_PASSWORD: 'new', STEALTH_TOKEN: 't', STEALTH_SECRET: 's' })
  })

  it('replaces the token and secret when rotating', () => {
    const next = buildSecrets({ STEALTH_TOKEN: 't', STEALTH_SECRET: 's' }, 'pw', true, sequence())
    expect(next.STEALTH_TOKEN).toBe('generated-1')
    expect(next.STEALTH_SECRET).toBe('generated-2')
  })

  it('refuses an empty password', () => {
    expect(() => buildSecrets({}, '')).toThrow()
  })

  it('makes strong random values by default', () => {
    const { STEALTH_TOKEN, STEALTH_SECRET } = buildSecrets({}, 'pw')
    expect(STEALTH_TOKEN).toMatch(/^[\w-]{43}$/)
    expect(STEALTH_SECRET).toMatch(/^[\w-]{43}$/)
    expect(STEALTH_TOKEN).not.toBe(STEALTH_SECRET)
  })

  it('reports what a file lacks', () => {
    expect(missingSecrets({ STEALTH_PASSWORD: 'pw' })).toEqual(['STEALTH_TOKEN', 'STEALTH_SECRET'])
    expect(missingSecrets({ STEALTH_PASSWORD: 'a', STEALTH_TOKEN: 'b', STEALTH_SECRET: 'c' })).toEqual([])
  })

  it('names one gitignored file per environment', () => {
    expect(secretsFile('staging')).toBe('.secrets.staging.json')
    expect(secretsFile('production')).toBe('.secrets.production.json')
  })
})
