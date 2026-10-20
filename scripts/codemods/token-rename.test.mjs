// node --test scripts/codemods/token-rename.test.mjs
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { renameTokens } from './token-rename.mjs'

const rename = (text, file = 'x.tsx') => renameTokens(text, file).text

describe('class tokens', () => {
  test('every stem of the map, with each colour utility', () => {
    assert.equal(
      rename(`"bg-background text-foreground border-border bg-card bg-popover bg-primary text-primary-foreground"`),
      `"bg-canvas text-fg border-line bg-surface bg-overlay bg-accent text-on-accent"`,
    )
    assert.equal(rename(`"bg-muted text-muted-foreground bg-secondary bg-highlight bg-destructive bg-sidebar"`), `"bg-band text-fg-muted bg-hover bg-hover bg-danger bg-chrome"`)
    assert.equal(rename(`"text-accent-contrast text-accent-ink text-danger-ink text-action-foreground"`), `"text-on-accent text-accent-text text-danger-text text-on-action"`)
  })

  const UTILITIES = [
    ['border-t-border', 'border-t-line'],
    ['border-s-input', 'border-s-line-control'],
    ['ring-ring', 'ring-focus'],
    ['ring-offset-background', 'ring-offset-canvas'],
    ['inset-ring-foreground', 'inset-ring-fg'],
    ['outline-ring', 'outline-focus'],
    ['divide-border', 'divide-line'],
    ['fill-foreground', 'fill-fg'],
    ['stroke-muted-foreground', 'stroke-fg-muted'],
    ['from-card', 'from-surface'],
    ['via-muted', 'via-band'],
    ['to-background', 'to-canvas'],
    ['decoration-primary', 'decoration-accent'],
    ['placeholder-muted-foreground', 'placeholder-fg-muted'],
    ['caret-primary', 'caret-accent'],
    ['shadow-primary', 'shadow-accent'],
    ['accent-primary', 'accent-accent'],
  ]
  for (const [before, after] of UTILITIES) {
    test(`${before} becomes ${after}`, () => {
      assert.equal(rename(`"${before}"`), `"${after}"`)
    })
  }

  test('the longest stem wins', () => {
    assert.equal(rename(`"text-sidebar-primary-foreground text-sidebar-highlight-foreground text-sidebar-foreground"`), `"text-on-accent text-fg text-fg"`)
    assert.equal(rename(`"bg-sidebar-border bg-sidebar-ring bg-sidebar-primary bg-sidebar"`), `"bg-line bg-focus bg-accent bg-chrome"`)
  })

  test('variants, a leading or trailing ! and the alpha are kept', () => {
    assert.equal(
      rename(`"hover:bg-primary/90 data-[state=open]:bg-muted/50 dark:hover:bg-card!  !text-foreground focus-visible:ring-ring/[0.4] [&_svg]:text-muted-foreground"`),
      `"hover:bg-accent/90 data-[state=open]:bg-band/50 dark:hover:bg-surface!  !text-fg focus-visible:ring-focus/[0.4] [&_svg]:text-fg-muted"`,
    )
  })

  test('class strings in code: cva, cn, template literals', () => {
    const before = "cva('bg-card', { variants: { v: { a: cn(open && 'text-foreground', `border-border ${x}`) } } })"
    assert.equal(rename(before), "cva('bg-surface', { variants: { v: { a: cn(open && 'text-fg', `border-line ${x}`) } } })")
  })

  test('names that only look alike stay', () => {
    for (const same of [
      'ring-2',
      'border-t',
      'text-sm',
      'shadow-md',
      'bg-card-header',
      'my-bg-card',
      'text-fg bg-surface border-line',
      'bg-linear-to-r',
      'bg-accent text-success bg-action',
      'const border = 1',
      'variant="secondary"',
      'size="input"',
      'primary: true',
    ]) {
      assert.equal(rename(same), same, same)
    }
  })

  test('is idempotent', () => {
    const once = rename(`"bg-card hover:bg-primary/90 text-muted-foreground" var(--card) var(--color-border)`)
    assert.equal(rename(once), once)
  })

  test('counts each stem, and the alphas it left', () => {
    const { counts } = renameTokens(`"bg-card bg-card/50 text-muted-foreground"`, 'x.tsx')
    assert.equal(counts.get('card'), 2)
    assert.equal(counts.get('muted-foreground'), 1)
    assert.equal(counts.get('/N kept'), 1)
  })
})

describe('var() references', () => {
  test('raw shadcn names and --color- names, in a fallback too', () => {
    assert.equal(rename(`color="var(--chart-1)" fill="var(--card)" b="var(--color-border)"`), `color="var(--color-chart-1)" fill="var(--color-surface)" b="var(--color-line)"`)
    assert.equal(rename(`bg-(--bz-well,var(--color-muted))`), `bg-(--bz-well,var(--color-band))`)
    assert.equal(rename(`[outline:var(--ui-focus-width)_solid_var(--ring)]`), `[outline:var(--ui-focus-width)_solid_var(--color-focus)]`)
  })

  test('private helpers that become roles or private roles', () => {
    assert.equal(rename(`var(--bz-well) var(--ui-paper) var(--ui-mark-quiet) var(--ui-shadow-color) var(--yj-dialog-dim)`), `var(--color-well) var(--yj-paper) var(--color-chart-quiet) var(--color-shadow) var(--color-scrim)`)
  })

  test('a longer name is not its prefix', () => {
    const same = `var(--bz-well-hover) var(--bz-secondary-ring) var(--yj-accent) var(--card-spacing) var(--border-width) var(--ring-width)`
    assert.equal(rename(same), same)
  })

  test('definitions are left to the phase agent', () => {
    const css = `:root { --card: var(--color-surface); --bz-well: color-mix(in oklab, var(--color-raised) 5%, var(--muted)); }`
    assert.equal(rename(css, 'a.css'), `:root { --card: var(--color-surface); --bz-well: color-mix(in oklab, var(--color-raised) 5%, var(--color-band)); }`)
  })
})

describe('CSS', () => {
  test('@apply is a class string, a selector is not', () => {
    const css = `.card { @apply bg-card text-foreground hover:bg-muted/50; border-color: var(--border); }\n.bg-card { color: red }`
    assert.equal(rename(css, 'a.css'), `.card { @apply bg-surface text-fg hover:bg-band/50; border-color: var(--color-line); }\n.bg-card { color: red }`)
  })
})

describe('MDX', () => {
  test('rewrites fenced code and inline code, not prose', () => {
    const mdx = [
      'Use `bg-card` on a card. bg-card in prose stays, and text-foreground too.',
      '',
      '```tsx',
      '<div className="bg-card text-muted-foreground" />',
      '```',
      '',
      '~~~css',
      '.a { color: var(--foreground) }',
      '~~~',
      '',
      'After the fence, text-foreground in prose again.',
    ].join('\n')
    assert.equal(
      rename(mdx, 'a.mdx'),
      [
        'Use `bg-surface` on a card. bg-card in prose stays, and text-foreground too.',
        '',
        '```tsx',
        '<div className="bg-surface text-fg-muted" />',
        '```',
        '',
        '~~~css',
        '.a { color: var(--color-fg) }',
        '~~~',
        '',
        'After the fence, text-foreground in prose again.',
      ].join('\n'),
    )
  })

  test('a longer fence is closed only by its own marker', () => {
    const mdx = '````md\n```tsx\nbg-card\n```\n````\nbg-card'
    assert.equal(rename(mdx, 'a.mdx'), '````md\n```tsx\nbg-surface\n```\n````\nbg-card')
  })
})

describe('names it will not guess', () => {
  test('raised and a leaked shadcn accent are counted and left', () => {
    const { text, manual } = renameTokens(`"bg-raised dark:bg-raised text-accent-foreground bg-sidebar-accent" var(--color-raised) var(--ui-control-edge)`, 'x.tsx')
    assert.equal(text, `"bg-raised dark:bg-raised text-accent-foreground bg-sidebar-accent" var(--color-raised) var(--ui-control-edge)`)
    assert.equal(manual.get('raised'), 2)
    assert.equal(manual.get('accent-foreground'), 1)
    assert.equal(manual.get('sidebar-accent'), 1)
    assert.equal(manual.get('var(--color-raised)'), 1)
    assert.equal(manual.get('var(--ui-control-edge)'), 1)
  })
})
