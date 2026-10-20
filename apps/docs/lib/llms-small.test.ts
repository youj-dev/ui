import { describe, expect, it, vi } from 'vitest'

vi.mock('./source', () => ({ source: {} }))

import { llmsSmall } from './llms'

describe('llmsSmall', () => {
  const text = llmsSmall()

  it('lists a component with its import and main props', () => {
    expect(text).toContain("import { Button } from '@youj/react'")
    expect(text).toMatch(/Props of `Button`: .*`variant\?/)
  })

  it('stays small enough to load whole', () => {
    expect(text.length).toBeLessThan(300_000)
  })
})
