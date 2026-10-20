import { describe, expect, it } from 'vitest'
import { cloudflareEnv } from './cf-env'

describe('cloudflare environments', () => {
  it('maps staging to youj-staging at staging.youj.dev', () => {
    expect(cloudflareEnv('staging', undefined)).toEqual({ name: 'youj-staging', domains: ['staging.youj.dev'] })
  })

  it('maps production to youj at www.youj.dev', () => {
    expect(cloudflareEnv('production', undefined)).toEqual({ name: 'youj', domains: ['www.youj.dev'] })
  })

  it('refuses a missing or unknown mode', () => {
    expect(() => cloudflareEnv(undefined, undefined)).toThrow(/--mode/)
    expect(() => cloudflareEnv('preview', undefined)).toThrow(/--mode/)
  })

  it('refuses production inside a Workers Builds run, but not staging', () => {
    expect(() => cloudflareEnv('production', '1')).toThrow(/ship\.sh/)
    expect(cloudflareEnv('staging', '1').name).toBe('youj-staging')
  })
})
