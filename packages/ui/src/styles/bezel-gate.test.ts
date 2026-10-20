import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/* Bezel's recipes hang off one gate: inside a bezel scope, not inside another
 * style's scope within it. The gate walks the element's ancestors, and the
 * browser checks a compound's simple selectors in the order written, so the
 * gate (&) must close each compound: `[data-slot='card']&`, not
 * `&[data-slot='card']`. Opening it made every data-slot element walk its
 * ancestors for every recipe on each restyle. */

const css = readFileSync(resolve(__dirname, 'bezel.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

/** The gate: the selector of the rule the recipes nest in. */
const gate = css.match(/\n\s*(:where\(\[data-yj-look='bezel'\] \*\)[^{]*?)\s*\{/)![1]!

test('finds the gate', () => {
  expect(gate).toBe(
    ":where([data-yj-look='bezel'] *):not(:where([data-yj-look='bezel'] [data-yj-look]:not([data-yj-look='bezel']) *))",
  )
})

test('the gate closes every compound it is in, so the compound’s own checks run first', () => {
  const opening = [...css.matchAll(/&(?=[[.]|:(?!:))[^\s{,]*/g)].map(([m]) => m)
  expect(opening).toEqual([])
  expect(css.match(/&/g)!.length).toBeGreaterThan(150)
})

describe('the gate reaches bezel scopes and stops at another style’s scope', () => {
  const card = `[data-slot='card']:is(${gate})`
  const build = (html: string) => {
    document.body.innerHTML = html
    return document.querySelector('#target')!
  }

  test.each([
    ['under a bezel root', '<div data-yj-look="bezel"><div data-slot="card" id="target"></div></div>', true],
    ['deep under a bezel root', '<div data-yj-look="bezel"><section><div><div data-slot="card" id="target"></div></div></section></div>', true],
    ['on the bezel root itself', '<div data-yj-look="bezel" data-slot="card" id="target"></div>', false],
    ['with no style root (classic is the default)', '<div><div data-slot="card" id="target"></div></div>', false],
    ['on a classic root with no style above it', '<div data-yj-look="classic" data-slot="card" id="target"></div>', false],
    ['a light scope in a page with no style', '<div data-theme="light" data-yj-theme="graphite"><div data-slot="card" id="target"></div></div>', false],
    ['under a classic root', '<div data-yj-look="classic"><div data-slot="card" id="target"></div></div>', false],
    ['inside classic nested in bezel', '<div data-yj-look="bezel"><div data-yj-look="classic"><div data-slot="card" id="target"></div></div></div>', false],
    ['deep inside classic nested in bezel', '<div data-yj-look="bezel"><div data-yj-look="classic"><section><div data-slot="card" id="target"></div></section></div></div>', false],
    ['on a classic root nested in bezel', '<div data-yj-look="bezel"><div data-yj-look="classic" data-slot="card" id="target"></div></div>', true],
    ['bezel nested in a classic page', '<div data-yj-look="classic"><div data-yj-look="bezel"><div data-slot="card" id="target"></div></div></div>', true],
    ['a nested bezel scope inside bezel', '<div data-yj-look="bezel"><div data-yj-look="bezel"><div data-slot="card" id="target"></div></div></div>', true],
    ['a light scope inside a dark bezel page', '<div data-yj-look="bezel" data-theme="dark"><div data-theme="light" data-yj-theme="graphite"><div data-slot="card" id="target"></div></div></div>', true],
  ])('%s', (_, html, matches) => {
    expect(build(html).matches(card)).toBe(matches)
  })
})
