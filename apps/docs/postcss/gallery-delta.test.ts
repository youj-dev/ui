// @vitest-environment node
import postcss from 'postcss'
import { splitSelector, withoutBase } from './gallery-delta.mjs'

/** What `css` keeps once everything `base` holds is taken out, with the whitespace squeezed. */
const left = (css: string, base: string) =>
  withoutBase(postcss.parse(css), base)
    .toString()
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,])\s*/g, '$1')
    .trim()

describe('splitSelector', () => {
  it('splits a list on its top-level commas only', () => {
    expect(splitSelector('.a, :is(.b,.c), [data-x="1,2"], .d\\,e')).toEqual(['.a', ':is(.b,.c)', '[data-x="1,2"]', '.d\\,e'])
    expect(splitSelector('.solo')).toEqual(['.solo'])
  })
})

describe('the gallery delta', () => {
  it('keeps the utilities the base lacks, in their layer and media, and nothing else', () => {
    const base = '@layer utilities{.flex{display:flex}@media (width>=48rem){.md\\:flex{display:flex}}}'
    const full =
      '@layer utilities{.flex{display:flex}.gap-\\[7px\\]{gap:7px}@media (width>=48rem){.md\\:flex{display:flex}.md\\:gap-\\[7px\\]{gap:7px}}}'
    expect(left(full, base)).toBe('@layer utilities{.gap-\\[7px\\]{gap:7px}@media (width>=48rem){.md\\:gap-\\[7px\\]{gap:7px}}}')
  })

  it('compares a merged selector list selector by selector, so the optimiser merging differently changes nothing', () => {
    expect(left('.b{color:red}.c{color:red}', '.a,.b{color:red}')).toBe('.c{color:red}')
    expect(left('.a,.b{color:red}', '.a{color:red}')).toBe('.b{color:red}')
    expect(left('.a,.b{color:red}', '.a{color:red}.b{color:red}')).toBe('')
  })

  it('takes out the declarations of a shared rule the base has, when every selector in it has them', () => {
    const base = '@layer theme{:root,:host{--a:1;--b:2}}'
    expect(left('@layer theme{:root,:host{--a:1;--b:2;--c:3}}', base)).toBe('@layer theme{:root,:host{--c:3}}')
    // One selector lacking the declaration keeps it for both.
    expect(left('@layer theme{:root,:host{--a:1;--c:3}}', '@layer theme{:root{--a:1}}')).toBe('@layer theme{:root,:host{--a:1;--c:3}}')
  })

  it('keeps a rule the base has under another layer, media or value', () => {
    expect(left('@layer utilities{.x{a:1}}', '@layer base{.x{a:1}}')).toBe('@layer utilities{.x{a:1}}')
    expect(left('@media (width>=40rem){.x{a:1}}', '@media (width>=48rem){.x{a:1}}')).toBe('@media (width>=40rem){.x{a:1}}')
    expect(left('.x{color:blue}', '.x{color:red}')).toBe('.x{color:blue}')
    expect(left('.x{color:red!important}', '.x{color:red}')).toBe('.x{color:red!important}')
  })

  it('drops what the base holds down to the empty layers and media around it, but keeps a layer order statement', () => {
    const base = '@layer theme,base,utilities;@layer base{a{color:red}}@media (width>=48rem){.m{a:1}}@property --tw-x{syntax:"*";inherits:false}'
    expect(left(`${base}@layer utilities{.new{a:1}}`, base)).toBe('@layer theme,base,utilities;@layer utilities{.new{a:1}}')
  })

  it('takes out a keyframes rule only when the base has the same one', () => {
    const base = '@keyframes spin{to{transform:rotate(360deg)}}'
    expect(left(`${base}@keyframes pulse{50%{opacity:.5}}`, base)).toBe('@keyframes pulse{50%{opacity:.5}}')
    expect(left('@keyframes spin{to{transform:rotate(180deg)}}', base)).toBe('@keyframes spin{to{transform:rotate(180deg)}}')
  })

  it('drops comments', () => {
    expect(left('/*! banner */.x{a:1}', '')).toBe('.x{a:1}')
  })
})
