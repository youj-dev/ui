import { describe, expect, it } from 'vitest'
import { Project } from '../src/project'
import { settle, snapshot } from '../src/copy'
import { fixture, read, write } from './helpers'

const STAND_IN = 'export const youjStandIn = true\nexport function warnTheme(_theme: unknown) {}\n'
const REAL = 'export function warnTheme(theme: unknown) { console.warn(theme) }\n'
const PATH = 'src/lib/youj/theme/check.ts'

/** A copy as shadcn leaves it: the app's file before, `incoming` written over it. */
function copy(before: string, incoming: string, overwrite = false) {
  const root = fixture('vite')
  write(root, PATH, before)
  const project = new Project(root)
  const snap = snapshot(project)
  write(root, PATH, incoming)
  return { root, outcome: settle(new Project(root), snap, overwrite) }
}

describe('a placeholder in the core', () => {
  it('gives way to the real file an item of its own copies', () => {
    const { root, outcome } = copy(STAND_IN, REAL)
    expect(outcome.conflicts).toEqual([])
    expect(read(root, PATH)).toBe(REAL)
  })

  it('stays out of the way of the real file when the core is copied again', () => {
    const { root, outcome } = copy(REAL, STAND_IN)
    expect(outcome.conflicts).toEqual([])
    expect(read(root, PATH)).toBe(REAL)
  })

  it("keeps a file of the app's own as theirs", () => {
    const { root, outcome } = copy('export const mine = 1\n', STAND_IN)
    expect(outcome.conflicts).toEqual([])
    expect(read(root, PATH)).toBe('export const mine = 1\n')
  })
})
