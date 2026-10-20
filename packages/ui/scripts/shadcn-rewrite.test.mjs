import { relativeSpecifier, renameShadcnAccent, relativizeImports, rewriteShadcnSource } from './shadcn-rewrite.mjs'

describe('renameShadcnAccent', () => {
  test.each([
    ['bg-accent', 'bg-hover'],
    ['text-accent-foreground', 'text-fg'],
    ['hover:bg-accent', 'hover:bg-hover'],
    ['focus:bg-accent focus:text-accent-foreground', 'focus:bg-hover focus:text-fg'],
    ['data-highlighted:bg-accent/50', 'data-highlighted:bg-hover/50'],
    ['data-[state=open]:bg-accent', 'data-[state=open]:bg-hover'],
    ['not-data-[variant=destructive]:focus:**:text-accent-foreground', 'not-data-[variant=destructive]:focus:**:text-fg'],
    ['dark:hover:bg-accent/50!', 'dark:hover:bg-hover/50!'],
    ['border-l-accent ring-offset-accent', 'border-l-hover ring-offset-hover'],
    ['bg-sidebar-accent text-sidebar-accent-foreground', 'bg-hover text-fg'],
    ['bg-[color-mix(in_oklch,var(--accent),var(--foreground)_5%)]', 'bg-[color-mix(in_oklch,var(--color-hover),var(--foreground)_5%)]'],
    ['var(--color-accent-foreground)', 'var(--color-fg)'],
  ])('%s → %s', (input, output) => {
    expect(renameShadcnAccent(`"${input}"`)).toBe(`"${output}"`)
  })

  test.each([
    'text-accent-contrast',
    'bg-accent-contrast',
    'accent-color',
    'youj-accent',
    'const accent = true',
    'var(--yj-accent)',
  ])('leaves %s alone', (input) => {
    expect(renameShadcnAccent(input)).toBe(input)
  })

  test('rewrites every token in a cva string', () => {
    const src = `cva("bg-accent hover:bg-accent text-accent-foreground", { variants: { v: { a: "border-accent" } } })`
    expect(renameShadcnAccent(src)).toBe(`cva("bg-hover hover:bg-hover text-fg", { variants: { v: { a: "border-hover" } } })`)
  })
})

describe('rewriteShadcnSource names', () => {
  test("maps shadcn's names onto youj's roles, the hover accent to hover and primary to the brand accent", () => {
    const src = `cn("bg-background text-foreground bg-card border-border bg-primary text-primary-foreground bg-accent text-accent-foreground text-muted-foreground bg-muted ring-ring/50 border-input")`
    expect(rewriteShadcnSource(src, 'components/ui/x.tsx')).toBe(
      `cn("bg-canvas text-fg bg-surface border-line bg-accent text-on-accent bg-hover text-fg text-fg-muted bg-band ring-focus/50 border-line-control")`,
    )
  })

  test("maps shadcn's variables too", () => {
    expect(rewriteShadcnSource('style={{ color: "var(--muted-foreground)", background: "var(--primary)" }}', 'components/ui/x.tsx')).toBe(
      'style={{ color: "var(--color-fg-muted)", background: "var(--color-accent)" }}',
    )
  })
})

describe('relativizeImports', () => {
  test('relative specifiers stay inside the package', () => {
    expect(relativeSpecifier('components/ui/field.tsx', 'components/ui/label')).toBe('./label')
    expect(relativeSpecifier('components/ui/field.tsx', 'lib/utils')).toBe('../../lib/utils')
    expect(relativeSpecifier('hooks/use-mobile.ts', 'lib/utils')).toBe('../lib/utils')
  })

  test('rewrites @/ imports, re-exports and the cn package', () => {
    const src = [
      `import { cn } from "cn"`,
      `import { Label } from "@/components/ui/label"`,
      `import type { X } from '@/lib/types'`,
      `export { useMobile } from "@/hooks/use-mobile"`,
      `const lazy = import("@/components/ui/dialog")`,
      `import { Slot } from "@base-ui/react/slot"`,
      `import "./local.css"`,
    ].join('\n')
    expect(relativizeImports(src, 'components/ui/field.tsx').split('\n')).toEqual([
      `import { cn } from "../../lib/utils"`,
      `import { Label } from "./label"`,
      `import type { X } from '../../lib/types'`,
      `export { useMobile } from "../../hooks/use-mobile"`,
      `const lazy = import("./dialog")`,
      `import { Slot } from "@base-ui/react/slot"`,
      `import "./local.css"`,
    ])
  })

  test('does not touch packages whose name only starts with cn', () => {
    expect(relativizeImports(`import x from "cnfast"`, 'components/ui/a.tsx')).toBe(`import x from "cnfast"`)
  })
})

describe('rewriteShadcnSource', () => {
  const shadcnFile = [
    `"use client"`,
    `import { cn } from "cn"`,
    `import { Button } from "@/components/ui/button"`,
    `export const item = cn("focus:bg-accent focus:text-accent-foreground", "text-accent-contrast")`,
  ].join('\n')

  test('rewrites imports and names in one pass', () => {
    const once = rewriteShadcnSource(shadcnFile, 'components/ui/menu.tsx')
    expect(once).toContain('from "../../lib/utils"')
    expect(once).toContain('from "./button"')
    expect(once).toContain('focus:bg-hover focus:text-fg')
    expect(once).toContain('text-on-accent')
    expect(rewriteShadcnSource(once, 'components/ui/menu.tsx')).toBe(once)
  })

  test('leaves non-source files untouched', () => {
    expect(rewriteShadcnSource('.a { @apply bg-accent }', 'styles/x.css')).toBe('.a { @apply bg-accent }')
  })
})
