import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SHADCN_NOTICE } from '../src/notice'

const shadcnLicence = () => readFileSync(join(import.meta.dirname, '../../../node_modules/shadcn/LICENSE.md'), 'utf8')

describe('the shadcn notice', () => {
  it('is shadcn’s licence word for word', () => {
    expect(SHADCN_NOTICE).toContain(shadcnLicence().trim())
  })

  it('is the one @youj/react ships', () => {
    const shipped = readFileSync(join(import.meta.dirname, '../../ui/THIRD_PARTY_NOTICES.md'), 'utf8')
    expect(shipped).toContain(shadcnLicence().trim())
  })
})
