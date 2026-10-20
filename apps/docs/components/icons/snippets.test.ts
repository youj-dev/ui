// @vitest-environment node
import { youjEntries, type PairEntry } from './catalog'
import { cliSnippet, importSnippet, reactSnippet, snippetsFor, type SnippetOptions } from './snippets'

const youj = youjEntries({ bell: [['path', { d: 'M1 1' }, []]] }, {})
const bell = youj.find((e) => e.name === 'bell')!
const menu = youj.find((e) => e.name === 'menu')!
const copy = youj.find((e) => e.name === 'copy')!
const x = youj.find((e) => e.name === 'x')!
const o: SnippetOptions = { size: 24, strokeWidth: 1.5, ink: 'default' }

describe('React snippets', () => {
  it('imports from the icons package and leaves defaults out', () => {
    expect(reactSnippet(bell, o)).toBe(`import { BellIcon } from '@youj/icons'\n\n<BellIcon />`)
  })

  it('carries the toolbar: size, stroke and color', () => {
    expect(reactSnippet(bell, { ...o, size: 32, strokeWidth: 2, ink: 'accent' })).toContain('<BellIcon size={32} strokeWidth={2} className="text-accent" />')
    expect(reactSnippet(bell, { ...o, ink: '#ff5a1f' })).toContain(`<BellIcon style={{ color: '#ff5a1f' }} />`)
  })

  it('names a trigger only when it is not the default', () => {
    expect(reactSnippet(bell, { ...o, trigger: 'hover' })).toContain('<BellIcon />')
    expect(reactSnippet(bell, { ...o, trigger: 'loop' })).toContain('<BellIcon trigger="loop" />')
  })

  it('drives a state icon with active, and says which state is which', () => {
    const code = reactSnippet(menu, o)
    expect(code).toContain('<MenuIcon active={active} />')
    expect(code).toContain('false shows menu, true shows close')
  })

  it('writes an IconSwap for a pair', () => {
    const pair: PairEntry = { kind: 'pair', id: 'copy~x', name: 'copy → x', from: copy, to: x }
    expect(reactSnippet(pair, { ...o, transition: 'wipe', direction: 'left' })).toBe(
      [`import { CopyIcon, IconSwap, XIcon } from '@youj/icons'`, '', `<IconSwap from={CopyIcon} to={XIcon} transition="wipe" direction="left" active={active} />`].join('\n'),
    )
  })
})

describe('import lines', () => {
  it('are the React snippet without its usage', () => {
    expect(importSnippet(bell)).toBe(`import { BellIcon } from '@youj/icons'`)
    const pair: PairEntry = { kind: 'pair', id: 'copy~x', name: 'copy → x', from: copy, to: x }
    expect(importSnippet(pair)).toBe(`import { CopyIcon, IconSwap, XIcon } from '@youj/icons'`)
    for (const entry of [bell, pair]) expect(reactSnippet(entry, o).startsWith(`${importSnippet(entry)}\n\n`)).toBe(true)
  })
})

describe('install commands', () => {
  it('adds the icon, or the swap and its icons', () => {
    expect(cliSnippet(bell)).toBe('npx @youj/cli add icon-bell')
    const pair: PairEntry = { kind: 'pair', id: 'copy~x', name: 'copy → x', from: copy, to: x }
    expect(cliSnippet(pair)).toBe('npx @youj/cli add icon-swap icon-copy icon-x')
  })
})

describe('the snippet set', () => {
  it('offers SVG and JSX once the rest markup is known', () => {
    expect(snippetsFor(bell, bell.nodes, o).map((s) => s.id)).toEqual(['react', 'svg', 'jsx', 'cli'])
    expect(snippetsFor(bell, null, o).map((s) => s.id)).toEqual(['react', 'cli'])
    const svg = snippetsFor(bell, bell.nodes, { ...o, ink: '#123456', size: 40 }).find((s) => s.id === 'svg')!.code
    expect(svg).toContain('stroke="#123456"')
    expect(svg).toContain('width="40"')
  })
})
