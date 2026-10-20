// @vitest-environment node
import { flattenHas } from './flatten-has.mjs'

describe('flattenHas', () => {
  it('writes a group-has utility as a plain descendant of the :has() ancestor', () => {
    expect(flattenHas('.group-has-\\[\\:focus-visible\\]\\/head\\:opacity-60:is(:where(.group\\/head):has(:focus-visible) *)')).toBe(
      ':where(.group\\/head):has(:focus-visible) .group-has-\\[\\:focus-visible\\]\\/head\\:opacity-60',
    )
  })

  it('keeps the child combinator of a has-* child variant', () => {
    expect(flattenHas(':is(.x\\:has-\\[\\>\\[data-a\\]\\]:has(>[data-a]) > *)[data-panel]')).toBe(
      '.x\\:has-\\[\\>\\[data-a\\]\\]:has(>[data-a]) > [data-panel]',
    )
  })

  it('leaves alone a :is() that is not an ancestor form, a :has() subject, and a selector with its own combinator', () => {
    for (const s of [
      '.island-host:is([data-hot], :focus-visible, :has(:focus-visible)) .card-island',
      '.has-focus-visible\\:ring-2:has(:focus-visible)',
      '.a .u:is(:where(.g):has(:hover) *)',
      ':is([data-slot=input-group],.group\\/input-group):has([data-slot=input-group-control]:focus-visible)',
    ])
      expect(flattenHas(s)).toBe(s)
  })
})
