import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DEMO_TOASTERS } from './demo-toasters'

const root = join(__dirname, '..', 'examples')
const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : f.endsWith('.tsx') ? [join(dir, f)] : []))

describe('DEMO_TOASTERS', () => {
  it('lists exactly the examples that render their own Toaster', () => {
    const owners = walk(root)
      .filter((file) => /<Toaster[\s/>]/.test(readFileSync(file, 'utf8')))
      .map((file) => relative(root, file).replace(/\.tsx$/, ''))
      .sort()
    expect(owners).toEqual([...DEMO_TOASTERS].sort())
  })
})
