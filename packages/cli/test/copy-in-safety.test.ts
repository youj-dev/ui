import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { writeCopyIn } from '../src/copy-in'
import { Project } from '../src/project'
import { fixture } from './helpers'

const file = (path: string) => ({ path, content: 'x', item: 'button' })

describe('copy-in writes', () => {
  it('stay under the app root', () => {
    const root = fixture('vite')
    const project = new Project(root)
    expect(() => writeCopyIn(project, [file('../../x.txt')], false)).toThrow(/outside the app/)
    expect(() => writeCopyIn(project, [file('src/../../x.txt')], false)).toThrow(/outside the app/)
    expect(() => writeCopyIn(project, [file('/tmp/youj-x.txt')], false)).toThrow(/outside the app/)
    expect(project.pending).toEqual([])
  })

  it('write a target inside the app', () => {
    const project = new Project(fixture('vite'))
    writeCopyIn(project, [file('src/components/ui/button.tsx')], false)
    expect(project.commit().map((c) => c.path)).toEqual(['src/components/ui/button.tsx'])
  })

  it('refuse a path that leaves the app through a symlink', () => {
    const root = fixture('vite')
    const outside = mkdtempSync(join(tmpdir(), 'youj-outside-'))
    try {
      mkdirSync(join(root, 'src'), { recursive: true })
      symlinkSync(outside, join(root, 'src/linked'))
      const project = new Project(root)
      expect(() => writeCopyIn(project, [file('src/linked/x.txt')], false)).toThrow(/outside the app/)
      expect(existsSync(join(outside, 'x.txt'))).toBe(false)
    } finally {
      rmSync(outside, { recursive: true, force: true })
    }
  })
})
