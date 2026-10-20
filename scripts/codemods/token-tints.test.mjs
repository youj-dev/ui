import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { sweepTints } from './token-tints.mjs'

const sweep = (code, file = 'x.tsx') => sweepTints(code, file).text

describe('ink tints', () => {
  test('bg-<ink>/4-15 becomes <ink>-subtle, variants kept', () => {
    assert.equal(sweep(`"bg-accent/10 hover:bg-danger/8 data-[x]:bg-success/[0.12] bg-warning/15"`), `"bg-accent-subtle hover:bg-danger-subtle data-[x]:bg-success-subtle bg-warning-subtle"`)
  })
  test('border and ring /20-40 become <ink>-line, a focus ring stays', () => {
    assert.equal(sweep(`"border-accent/40 border-s-danger/30 ring-success/25 focus-visible:ring-accent/30"`), `"border-accent-line border-s-danger-line ring-success-line focus-visible:ring-accent/30"`)
  })
  test('alphas outside the band stay', () => {
    const same = `"bg-accent/90 bg-accent/25 border-accent/60 bg-accent/50"`
    assert.equal(sweep(same), same)
  })
})

describe('neutral tints', () => {
  test('bg-fg/4-8 is band, /6 and hover states are hover', () => {
    assert.equal(sweep(`"bg-fg/5 bg-fg/8 bg-fg/6 bg-fg/[0.06] hover:bg-fg/5 hover:bg-fg/10 bg-fg/10"`), `"bg-band bg-band bg-hover bg-hover hover:bg-hover hover:bg-hover bg-fg/10"`)
  })
  test('faint bands and hovers collapse onto their role', () => {
    assert.equal(sweep(`"bg-band/40 hover:bg-band/60 bg-hover/70 bg-band/90"`), `"bg-band hover:bg-hover bg-hover bg-band/90"`)
  })
  test('text steps', () => {
    assert.equal(sweep(`"text-fg/70 text-fg/55 text-fg/80 text-fg/85 text-fg-muted/60"`), `"text-fg-muted text-fg-muted text-fg text-fg text-fg-muted/60"`)
  })
  test('lines', () => {
    assert.equal(sweep(`"border-line/60 border-t-fg/15 border-fg/25 border-fg/40 border-fg/50"`), `"border-line-subtle border-t-line-subtle border-line-strong border-line-strong border-fg/50"`)
  })
})

describe('glass', () => {
  test('bg-chrome/NN on a chrome tone becomes yj-glass and the blur goes', () => {
    assert.equal(
      sweep(`<header data-yj-tone="chrome" className="sticky top-0 border-b border-line bg-chrome/85 backdrop-blur-md">`),
      `<header data-yj-tone="chrome" className="sticky top-0 border-b border-line yj-glass">`,
    )
  })
  test('canvas with a blur on a chrome tone too', () => {
    assert.match(sweep(`<div data-yj-tone="chrome" className="bg-canvas/70 backdrop-blur px-2">`), /className="yj-glass px-2"/)
  })
  test('not on a chrome tone, the alpha stays', () => {
    const same = `<div className="border border-line bg-surface/80 backdrop-blur-md">`
    assert.equal(sweep(same), same)
  })
  test('the tone of another element does not count', () => {
    const same = `<header data-yj-tone="chrome" className="x">\n  <div className="bg-surface/80 backdrop-blur">`
    assert.equal(sweep(same), same)
  })
})

describe('left for a hand edit', () => {
  test('selected vs well vs decor stays and is listed', () => {
    const { text, left } = sweepTints(`"bg-fg/12 fill-fg/25 bg-accent/90"`, 'x.tsx')
    assert.equal(text, `"bg-fg/12 fill-fg/25 bg-accent/90"`)
    assert.deepEqual(left.map((l) => l.token), ['bg-fg/12', 'fill-fg/25', 'bg-accent/90'])
  })
  test('gradient stops, shadow colors and youj-allow lines are not listed', () => {
    const code = [`"bg-linear-to-r from-accent/20 via-fg/10 to-transparent shadow-fg/5"`, `"bg-surface/80 youj-allow-glass"`, `// youj-allow: veil`, `"bg-canvas/50"`].join('\n')
    const { left, allowed } = sweepTints(code, 'x.tsx')
    assert.deepEqual(left, [])
    assert.equal(allowed, 2)
  })
  test('names that only look alike stay', () => {
    const same = `"bg-red-500/10 bg-black/10 text-fg bg-accent-subtle my-bg-accent/10 w-1/2 bg-linear-to-r"`
    assert.equal(sweep(same), same)
  })
})

describe('files', () => {
  test('MDX only changes code', () => {
    assert.equal(sweep('Use bg-accent/10 here.\n\n```tsx\n<i className="bg-accent/10" />\n```\n`bg-danger/10`\n', 'a.mdx'), 'Use bg-accent/10 here.\n\n```tsx\n<i className="bg-accent-subtle" />\n```\n`bg-danger-subtle`\n')
  })
  test('CSS changes @apply only', () => {
    assert.equal(sweep('.a { @apply bg-accent/10 text-fg; }\n.b { color: red; } /* bg-accent/10 */', 'a.css'), '.a { @apply bg-accent-subtle text-fg; }\n.b { color: red; } /* bg-accent/10 */')
  })
  test('a second run finds nothing', () => {
    const once = sweep(`<div data-yj-tone="chrome" className="bg-chrome/85 backdrop-blur bg-accent/10 border-fg/30">`)
    assert.equal(sweep(once), once)
  })
})

describe('scan (the lint)', () => {
  test('lists every alpha on a role, mappable or not, and keeps /0, gradients, shadows and youj-allow out', () => {
    const code = [`"bg-accent/10 bg-fg/12 bg-canvas/0 from-accent/30 shadow-fg/5 text-fg/70"`, `"bg-surface/80 youj-allow-glass"`, `// youj-allow: veil`, `"bg-canvas/50"`].join('\n')
    assert.deepEqual(sweepTints(code, 'x.tsx', { scan: true }).left.map((l) => l.token), ['bg-accent/10', 'bg-fg/12', 'text-fg/70'])
  })
})
