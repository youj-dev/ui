import { join } from 'node:path'
import { motionEntries } from './motion-exports.mjs'
import { importPins, misroutedImports, pinImports, servedItems, shadcnTarget } from './shadcn-imports.mjs'

const root = join(import.meta.dirname, '..')

describe('shadcnTarget, as shadcn resolves an installed `@/` import', () => {
  const batch = new Set([
    'blocks/frame/shell/data.tsx',
    'blocks/app/analytics-overview/data.ts',
    'components/ui/data-table/index.ts',
    'components/ui/data-table/data-table.tsx',
    'components/ui/code-block/index.ts',
  ])

  it('reproduces both misroutes: a better-ranked namesake beats the file under the path', () => {
    expect(shadcnTarget('blocks/app/analytics-overview/data', batch)).toBe('blocks/frame/shell/data.tsx')
    expect(shadcnTarget('components/ui/data-table', batch)).toBe('components/ui/data-table/data-table.tsx')
  })

  it('resolves the pinned spellings to the file meant', () => {
    expect(shadcnTarget('components/ui/data-table/index', batch)).toBe('components/ui/data-table/index.ts')
    expect(shadcnTarget('blocks/app/analytics-overview/data.ts', batch)).toBe('blocks/app/analytics-overview/data.ts')
  })

  it('prefers the file under the path among equally ranked namesakes', () => {
    expect(shadcnTarget('blocks/frame/shell/data', batch)).toBe('blocks/frame/shell/data.tsx')
    expect(shadcnTarget('lib/utils', new Set(['blocks/x/utils.ts']), new Set(['lib/utils.ts']))).toBe('lib/utils.ts')
  })
})

describe('pinning', () => {
  const items = [
    { name: 'a', files: [{ target: 'components/ui/grid/index.ts', content: '' }, { target: 'components/ui/grid/grid.tsx', content: '' }] },
    { name: 'b', files: [{ target: 'blocks/b.tsx', content: `import { Grid } from '@/components/ui/grid'\nexport { Grid as G } from '@/components/ui/grid'\n` }] },
  ]

  it('pins what shadcn would misroute, and nothing else', () => {
    expect(misroutedImports(items)).toEqual([
      { item: 'b', file: 'blocks/b.tsx', specifier: '@/components/ui/grid', want: 'components/ui/grid/index.ts', got: 'components/ui/grid/grid.tsx' },
    ])
    const pins = importPins(items)
    expect(pins).toEqual(new Map([['@/components/ui/grid', '@/components/ui/grid/index']]))
    // Re-exports aren't re-resolved by shadcn, so they keep the plain alias.
    expect(pinImports(items[1].files[0].content, 'blocks/b.tsx', pins)).toBe(
      `import { Grid } from '@/components/ui/grid/index'\nexport { Grid as G } from '@/components/ui/grid'\n`,
    )
  })
})

describe('the served registry (UI, motion and sound items together)', () => {
  const served = servedItems(root, motionEntries())
  const pins = importPins(served)
  const pinned = served.map((item) => ({ ...item, files: item.files.map((f) => ({ ...f, content: pinImports(f.content, f.target, pins) })) }))

  it('has no import shadcn would point at a same-named file, whatever is added together', () => {
    expect(misroutedImports(pinned).map((m) => `${m.item}: ${m.file} → ${m.specifier} lands on ${m.got}`)).toEqual([])
  })

  it("imports an item's own files relatively, never through a namesake-prone alias", () => {
    const leaks = served.flatMap((item) =>
      item.files.flatMap((f) =>
        [...f.content.matchAll(/from\s+['"]@\/([^'"]+)['"]/g)]
          .map((m) => m[1])
          .filter((path) => item.files.some((g) => g !== f && g.target.replace(/\.[jt]sx?$/, '').replace(/\/index$/, '') === path))
          .map((path) => `${item.name}: ${f.target} imports its own @/${path}`),
      ),
    )
    expect(leaks).toEqual([])
  })

  it('pins folder indexes whose folder holds a file of the same name', () => {
    expect(pins.get('@/components/ui/data-table')).toBe('@/components/ui/data-table/index')
  })
})
