import { physicalAllowed, physicalViolations, unmirroredIcons } from './direction.mjs'

const tokens = (line) => physicalViolations(line).map(({ token, use }) => `${token} → ${use}`)

describe('physical sides', () => {
  test('flags physical spacing, inset, radius, border and alignment utilities with their logical twins', () => {
    expect(tokens(`'ml-2 -mr-1 pl-3 pr-[4px] left-0 right-full rounded-l-md rounded-tr-lg border-r text-left float-right md:hover:pl-4 [&>svg]:ml-auto'`)).toEqual([
      'ml-2 → ms',
      '-mr-1 → me',
      'pl-3 → ps',
      'pr-[4px] → pe',
      'left-0 → start',
      'right-full → end',
      'rounded-l-md → rounded-s',
      'rounded-tr-lg → rounded-se',
      'border-r → border-e',
      'text-left → text-start',
      'float-right → float-end',
      'md:hover:pl-4 → ps',
      '[&>svg]:ml-auto → ms',
    ])
    expect(tokens(`style={{ marginLeft: 4, textAlign: 'right' }}`)).toEqual(['marginLeft → marginInlineStart', 'textAlign: right → textAlign: end'])
  })

  test('passes logical utilities, per-direction variants, Base UI sides, centering and prose', () => {
    expect(
      tokens(
        `'ms-2 me-1 ps-3 pe-4 start-0 end-full rounded-s-md border-e text-start inset-x-0 mx-auto px-2 border-x rtl:left-auto ltr:pl-2 md:rtl:-mr-1 data-[side=left]:before:left-full left-1/2 -translate-x-1/2'`,
      ),
    ).toEqual([])
    expect(tokens(`// the chevron on the right-hand side; a right-click opens it`)).toEqual([])
    expect(tokens(`import { ChevronLeftIcon } from '@youj/icons/components/youj/icons/chevron-left'`)).toEqual([])
    expect(tokens(`<Sheet side="left" align="right" />`)).toEqual([])
  })

  test('is escaped on the line or the line above by a physical-side allow', () => {
    expect(physicalAllowed(`'left-0', // youj-allow: physical side, map coordinates`)).toBe(true)
    expect(physicalAllowed(`<svg className="left-0">`, `  {/* youj-allow: physical side, map coordinates */}`)).toBe(true)
    expect(physicalAllowed(`'left-0'`, `// youj-allow: raw color`)).toBe(false)
  })
})

describe('directional icons', () => {
  test('a chevron, arrow, send, reply or undo has to mirror under RTL', () => {
    const source = ['<Button>', '  Next', '  <ChevronRightIcon size={14} />', '</Button>', '<SendIcon />'].join('\n')
    expect(unmirroredIcons(source)).toEqual([
      { line: 3, icon: 'ChevronRightIcon' },
      { line: 5, icon: 'SendIcon' },
    ])
  })

  test('mirrored on the icon, on a wrapper just above it, or marked, it passes; media and two-way glyphs are never asked to', () => {
    expect(unmirroredIcons(`<ArrowLeftIcon className="size-4 rtl:-scale-x-100" />`)).toEqual([])
    expect(unmirroredIcons(['<m.span className="grid rtl:-scale-x-100" animate={{ rotate: 90 }}>', '  <ChevronRightIcon />', '</m.span>'].join('\n'))).toEqual([])
    expect(unmirroredIcons(['{/* youj-allow: unmirrored icon, the lane runs left to right */}', '<ChevronLeftIcon />'].join('\n'))).toEqual([])
    expect(unmirroredIcons(`<PlayIcon /><SkipForwardIcon /><ClockIcon /><ArrowLeftRightIcon /><ChevronsLeftRightIcon />`)).toEqual([])
  })
})
