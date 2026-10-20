import { buildLucideMap, youjIconNames, loadLucide, rewriteLucideImports } from './shadcn-icons.mjs'

const youj = youjIconNames()
const map = buildLucideMap(loadLucide(), youj)

describe('buildLucideMap', () => {
  test('every target is a real Youj icon', () => {
    for (const target of new Set(map.values())) expect(youj).toContain(target)
  })

  test.each([
    ['Check', 'CheckIcon'],
    ['ChevronDown', 'ChevronDownIcon'],
    ['X', 'XIcon'],
    // lucide renamed AlertTriangle to TriangleAlert and kept the old name as an alias.
    ['TriangleAlert', 'AlertTriangleIcon'],
    ['Loader2', 'LoaderRingIcon'],
    ['PanelLeft', 'SidebarIcon'],
    ['GripVertical', 'GripIcon'],
  ])('lucide %s → %s', (lucide, youjName) => {
    expect(map.get(lucide)).toBe(youjName)
  })

  test('covers the icons shadcn base-nova components import', () => {
    const used = ['Check', 'ChevronDown', 'ChevronUp', 'ChevronRight', 'ChevronLeft', 'ChevronsUpDown', 'X', 'Circle', 'Minus', 'Search', 'MoreHorizontal', 'Calendar', 'ArrowLeft', 'ArrowRight', 'Info', 'CircleCheck', 'OctagonX', 'LoaderCircle']
    expect(used.filter((name) => !map.has(name))).toEqual([])
  })
})

describe('rewriteLucideImports', () => {
  test('swaps the import, keeps local aliases and renames unaliased uses', () => {
    const src = [
      `import { CheckIcon, ChevronDown as Down, TriangleAlertIcon } from "lucide-react"`,
      `export const a = <CheckIcon />`,
      `export const b = <Down className="size-4" />`,
      `export const c = <TriangleAlertIcon />`,
    ].join('\n')
    expect(rewriteLucideImports(src, map).split('\n')).toEqual([
      `import { CheckIcon, ChevronDownIcon as Down, AlertTriangleIcon } from '@youj/icons'`,
      `export const a = <CheckIcon />`,
      `export const b = <Down className="size-4" />`,
      `export const c = <AlertTriangleIcon />`,
    ])
  })

  test('is idempotent and leaves files without lucide alone', () => {
    const src = `import { XIcon } from 'lucide-react'\nconst x = <XIcon />`
    const once = rewriteLucideImports(src, map)
    expect(rewriteLucideImports(once, map)).toBe(once)
    expect(once).not.toContain('lucide-react')
  })

  test('fails loudly on an icon without an equivalent, naming it', () => {
    expect(() => rewriteLucideImports(`import { CheckIcon, NoSuchThingIcon } from "lucide-react"`, map, 'src/components/ui/x.tsx')).toThrow(
      /src\/components\/ui\/x\.tsx: no Youj icon for lucide NoSuchThingIcon/,
    )
  })

  test('fails loudly on a lucide type import', () => {
    expect(() => rewriteLucideImports(`import type { LucideIcon } from "lucide-react"`, map)).toThrow(/type import/)
  })
})
