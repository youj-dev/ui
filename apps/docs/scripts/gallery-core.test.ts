// @vitest-environment node
import { classesToKeep, familyOf, galleryCoreClasses, literalsOf, PINNED, splitClass } from './gallery-core'

describe('splitClass', () => {
  it('takes the variants off a utility, through arbitrary values, important marks and negatives', () => {
    expect(splitClass('md:hover:-pt-2!')).toEqual({ variants: 'md:hover', utility: 'pt-2' })
    expect(splitClass('data-[state=open]:bg-[url(a:b)]')).toEqual({ variants: 'data-[state=open]', utility: 'bg-[url(a:b)]' })
    expect(splitClass('!px-2')).toEqual({ variants: '', utility: 'px-2' })
  })
})

describe('familyOf', () => {
  it('puts the utilities that can set one property together', () => {
    expect(new Set(['p-4', 'pt-2', 'px-[3px]', 'ps-1'].map(familyOf))).toEqual(new Set(['padding']))
    expect(new Set(['w-4', 'size-3', 'min-w-0', 'h-[2px]'].map(familyOf))).toEqual(new Set(['size']))
    expect(new Set(['top-0', 'inset-x-2', 'start-1'].map(familyOf))).toEqual(new Set(['inset']))
    expect(familyOf('rounded-t-lg')).toBe(familyOf('rounded-[3px]'))
    expect(familyOf('flex')).not.toBe(familyOf('pt-2'))
  })
})

describe('classesToKeep', () => {
  const only = (literals: string[]) => new Set([...classesToKeep(literals)].filter((c) => !PINNED.includes(c)))

  it('keeps classes that share a string with another of their family, under other variants or not', () => {
    expect([...only(['flex pt-20 md:pt-28 gap-4'])].sort()).toEqual(['md:pt-28', 'pt-20'])
    expect([...only(['p-4 md:pt-8'])].sort()).toEqual(['md:pt-8', 'p-4'])
    expect([...only(['col-start-2 row-span-3 row-start-1 flex'])].sort()).toEqual(['row-span-3', 'row-start-1'])
  })

  it('leaves classes that nothing else of their family sits beside', () => {
    expect(only(['flex gap-4 pt-20 items-center'])).toEqual(new Set())
    expect(only(['pt-20 pt-20'])).toEqual(new Set())
  })

  it('reads each string on its own: classes in two strings are not neighbours', () => {
    expect(only(['pt-20', 'md:pt-28'])).toEqual(new Set())
  })

  it('always keeps the pinned classes', () => {
    expect(classesToKeep([])).toEqual(new Set(PINNED))
  })
})

describe('literalsOf', () => {
  it('finds the multi-word strings of any quote, and skips single words', () => {
    const source = `const a = 'flex pt-20'; const b = "md:pt-28 gap-4"; const c = \`grid \${x} p-2\`; const d = 'one'; import x from 'y'`
    expect(literalsOf(source)).toEqual(['flex pt-20', 'md:pt-28 gap-4', 'grid ${x} p-2'])
  })
})

describe('galleryCoreClasses on the real blocks', () => {
  const classes = galleryCoreClasses()

  it('finds the responsive pairs the blocks write', () => {
    expect(classes.length).toBeGreaterThan(50)
    // hero-product: 'mx-auto max-w-6xl px-4 pt-20 pb-20 sm:px-6 md:pt-28 md:pb-28'
    expect(classes).toEqual(expect.arrayContaining(['pt-20', 'md:pt-28', 'px-4', 'sm:px-6']))
  })
})
