// @vitest-environment node
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { icons } from '@youj/icons/components/youj/icons'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { cleanIcon, parseMarkup, reactProps, svgJsx, svgMarkup, svgString, type IconNode } from './static-svg'

/** An icon at rest, the way scripts/icon-svgs.ts renders it. */
function rest(name: string): IconNode[] {
  const Icon = icons.find((i) => i.meta.name === name)!
  const html = renderToStaticMarkup(createElement(YoujProvider, { reducedMotion: 'always', children: createElement(Icon, { trigger: 'none' }) }))
  return cleanIcon(parseMarkup(html), `ki-${name}-`)
}

const tags = (nodes: IconNode[]): string[] => nodes.flatMap(([tag, , children]) => [tag, ...tags(children)])
const all = (nodes: IconNode[]): IconNode[] => nodes.flatMap((n) => [n, ...all(n[2])])

describe('cleaning an icon to its rest pose', () => {
  it('drops parts hidden at rest, keeping what shows', () => {
    const markup =
      '<div><svg viewBox="0 0 24 24"><path d="M1 1" style="opacity:0"></path><path d="M2 2" pathLength="1" stroke-dasharray="0 1"></path><path d="M3 3" style="transform:scaleX(0)"></path><path d="M4 4"></path></svg></div>'
    expect(cleanIcon(parseMarkup(markup), 'x')).toEqual([['path', { d: 'M4 4' }, []]])
  })

  it('removes the dash bookkeeping of fully drawn strokes, and keeps a partial one', () => {
    const markup =
      '<svg><path d="M1 1" pathLength="1" stroke-dashoffset="0" stroke-dasharray="1.03 1" style="opacity:1"></path><path d="M2 2" pathLength="1" stroke-dashoffset="0" stroke-dasharray="0.25 1"></path></svg>'
    expect(cleanIcon(parseMarkup(markup), 'x')).toEqual([
      ['path', { d: 'M1 1' }, []],
      ['path', { d: 'M2 2', pathLength: '1', 'stroke-dashoffset': '0', 'stroke-dasharray': '0.25 1' }, []],
    ])
  })

  it('drops identity transforms and unwraps the groups they leave bare', () => {
    const markup = '<svg><g style="transform-box:view-box;transform:none;transform-origin:50% 14.583333333333334% 0"><path d="M1 1"></path></g></svg>'
    expect(cleanIcon(parseMarkup(markup), 'x')).toEqual([['path', { d: 'M1 1' }, []]])
  })

  it('keeps a real transform, with its long fractions rounded', () => {
    const markup = '<svg><path d="M1 1" style="transform:translateY(4.5px);transform-origin:50% 31.25555555% 0"></path></svg>'
    expect(cleanIcon(parseMarkup(markup), 'x')[0]![1].style).toBe('transform:translateY(4.5px);transform-origin:50% 31.256% 0')
  })

  it('removes a mask left with nothing to hide, and names the ones that stay', () => {
    const noop = '<svg><mask id="R0-m"><rect width="24" height="24" fill="white"></rect><path d="M3 3" style="opacity:0"></path></mask><g mask="url(#R0-m)"><path d="M1 1"></path></g></svg>'
    expect(cleanIcon(parseMarkup(noop), 'x')).toEqual([['path', { d: 'M1 1' }, []]])

    const real = '<svg><mask id="R0-m"><rect width="24" height="24" fill="white"></rect><path d="M3 3" stroke="black"></path></mask><g mask="url(#R0-m)"><path d="M1 1"></path></g></svg>'
    const nodes = cleanIcon(parseMarkup(real), 'bell-off-')
    expect(nodes[0]![1].id).toBe('bell-off-0')
    expect(nodes[1]![1].mask).toBe('url(#bell-off-0)')
  })

  it('renders real icons at rest: a masked slash only when it shows', () => {
    // The eye rests open: its slash and the mask cutting the gap for it are hidden, so both go.
    expect(tags(rest('eye'))).not.toContain('mask')
    // Bell-off rests with its slash drawn, so the mask stays, with a stable id.
    const bellOff = rest('bell-off')
    expect(tags(bellOff)).toContain('mask')
    expect(all(bellOff).find(([tag]) => tag === 'mask')![1].id).toBe('ki-bell-off-0')
    // A drawn check is just its path.
    expect(rest('check')).toEqual([['path', { d: 'M4 12.5 L9 17.5 L20 6.5' }, []]])
    // Nothing motion-specific survives anywhere.
    for (const name of ['bell', 'menu', 'play', 'copy', 'theme']) {
      for (const [, attrs] of all(rest(name))) {
        expect(attrs.style ?? '').not.toContain('transform:none')
        expect(attrs.style ?? '').not.toContain('opacity:0')
      }
    }
  })

  it('renders every icon in the set to something visible', () => {
    for (const Icon of icons) expect(rest(Icon.meta.name).length, Icon.meta.name).toBeGreaterThan(0)
  })
})

describe('writing SVG and JSX', () => {
  const nodes: IconNode[] = [
    ['path', { d: 'M4 12.5 L9 17.5', 'stroke-width': '2' }, []],
    ['g', { style: 'transform:translateY(4.5px);transform-origin:50% 50%' }, [['circle', { cx: '12', cy: '12', r: '3' }, []]]],
  ]

  it('writes a standalone, indented SVG with the chosen size, stroke and color', () => {
    expect(svgMarkup(nodes, { size: 32, strokeWidth: 2, color: '#ff5a1f' })).toBe(
      [
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff5a1f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
        '  <path d="M4 12.5 L9 17.5" stroke-width="2" />',
        '  <g style="transform:translateY(4.5px);transform-origin:50% 50%">',
        '    <circle cx="12" cy="12" r="3" />',
        '  </g>',
        '</svg>',
      ].join('\n'),
    )
    expect(svgString(nodes)).toMatch(/^<svg [^>]*stroke="currentColor"[^>]*><path /)
  })

  it('writes JSX with React spellings and style objects', () => {
    const jsx = svgJsx(nodes)
    expect(jsx).toContain('strokeWidth="1.5"')
    expect(jsx).toContain('strokeLinecap="round"')
    expect(jsx).toContain(`style={{ transform: 'translateY(4.5px)', transformOrigin: '50% 50%' }}`)
    expect(jsx).not.toContain('xmlns')
    expect(jsx).not.toMatch(/stroke-width|stroke-linecap/)
  })

  it('turns attributes into React props', () => {
    expect(reactProps({ 'stroke-dasharray': '0.25 1', pathLength: '1', class: 'x', style: 'transform-origin:50% 50%' })).toEqual({
      strokeDasharray: '0.25 1',
      pathLength: '1',
      className: 'x',
      style: { transformOrigin: '50% 50%' },
    })
  })
})
