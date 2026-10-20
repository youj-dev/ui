import { readFileSync } from 'node:fs'
import { workspacePackages } from './workspace-packages.mjs'

describe('workspacePackages', () => {
  it('lists every workspace dependency of the docs app, miniatures included', () => {
    expect(workspacePackages().map((p) => p.name)).toContain('@youj/miniatures')
  })

  it('has a tsconfig path for each package whose subpaths are aliased to source', () => {
    const { compilerOptions } = JSON.parse(readFileSync('tsconfig.json', 'utf8'))
    const missing = workspacePackages()
      .filter((p) => p.aliasSubpaths)
      .filter((p) => !(`${p.name}/*` in compilerOptions.paths))
      .map((p) => p.name)
    expect(missing).toEqual([])
  })
})
