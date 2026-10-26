import { mkdirSync, mkdtempSync, realpathSync as realRealpath, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

/* LocalProject checks that a file resolves inside the app, then reads it. Between the two a link can be swapped in
 * (another process, a build script), so the read must hold on to the file it checked. The swap happens here, in the
 * window right after the check, on the file or on a folder above it. */

let afterCheck: ((resolved: string) => void) | undefined

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  const realpathSync = Object.assign(
    (...args: Parameters<typeof actual.realpathSync>) => {
      const resolved = actual.realpathSync(...args)
      const hook = afterCheck
      if (hook && typeof resolved === 'string') {
        afterCheck = undefined
        hook(resolved)
      }
      return resolved
    },
    { native: actual.realpathSync.native },
  )
  return { ...actual, realpathSync }
})

const { LocalProject } = await import('../src/tools/project')

const temporary: string[] = []
const directory = () => {
  const dir = mkdtempSync(join(tmpdir(), 'youj-mcp-race-'))
  temporary.push(dir)
  return realRealpath(dir)
}
afterEach(() => {
  afterCheck = undefined
  for (const dir of temporary.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('LocalProject.read when a link is swapped in after the check', () => {
  it('does not follow a file swapped for a link to a file outside the app', () => {
    const outside = directory()
    writeFileSync(join(outside, 'secret.txt'), 'SECRET')
    const root = directory()
    writeFileSync(join(root, 'notes.txt'), 'mine')
    const project = new LocalProject(root)
    expect(project.read('notes.txt')).toBe('mine')
    afterCheck = (resolved) => {
      if (!resolved.endsWith('notes.txt')) return
      rmSync(resolved)
      symlinkSync(join(outside, 'secret.txt'), resolved)
    }
    expect(project.read('notes.txt')).toBeUndefined()
  })

  it('does not follow a folder swapped for a link to a folder outside the app', () => {
    const outside = directory()
    writeFileSync(join(outside, 'notes.txt'), 'SECRET')
    const root = directory()
    mkdirSync(join(root, 'docs'))
    writeFileSync(join(root, 'docs', 'notes.txt'), 'mine')
    const project = new LocalProject(root)
    afterCheck = (resolved) => {
      if (!resolved.endsWith('notes.txt')) return
      renameSync(join(root, 'docs'), join(root, 'docs-moved'))
      symlinkSync(outside, join(root, 'docs'))
    }
    expect(project.read('docs/notes.txt')).toBeUndefined()
  })

  it('still reads files inside the app, and refuses big ones and folders', () => {
    const root = directory()
    mkdirSync(join(root, 'sub'))
    writeFileSync(join(root, 'sub', 'a.json'), '{"a":1}')
    writeFileSync(join(root, 'big.txt'), 'x'.repeat(1_000_001))
    const project = new LocalProject(root)
    expect(project.read('sub/a.json')).toBe('{"a":1}')
    expect(project.json('sub/a.json')).toEqual({ a: 1 })
    expect(project.read('big.txt')).toBeUndefined()
    expect(project.read('sub')).toBeUndefined()
    expect(project.read('missing.txt')).toBeUndefined()
  })
})
