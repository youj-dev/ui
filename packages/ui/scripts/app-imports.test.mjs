import { toAppImports } from './app-imports.mjs'
import { motionEntries } from './motion-exports.mjs'

const entries = motionEntries()
const rewrite = (code) => toAppImports(code, 'src/components/ui/x.tsx', entries)

test('package-relative imports become the app aliases shadcn maps', () => {
  expect(rewrite(`import { cn } from '../../lib/utils'\nimport { Button } from "./button"\n`)).toBe(
    `import { cn } from '@/lib/utils'\nimport { Button } from "@/components/ui/button"\n`,
  )
  expect(rewrite(`import { useIsMobile } from '../../hooks/use-mobile'`)).toBe(`import { useIsMobile } from '@/hooks/use-mobile'`)
  expect(toAppImports(`import { cn } from '../lib/utils'`, 'src/hooks/use-thing.ts', entries)).toBe(`import { cn } from '@/lib/utils'`)
})

test("an item's own files keep importing each other relatively, so shadcn leaves them alone", () => {
  const own = ['src/blocks/app/analytics-overview.tsx', 'src/blocks/app/analytics-overview/data.ts', 'src/blocks/app/analytics-overview/kpis.tsx']
  const code = `import { KPIS } from './analytics-overview/data'\nimport { Kpis } from './analytics-overview/kpis'\nimport { Button } from '../../components/ui/button'\n`
  expect(toAppImports(code, own[0], entries, own)).toBe(
    `import { KPIS } from './analytics-overview/data'\nimport { Kpis } from './analytics-overview/kpis'\nimport { Button } from '@/components/ui/button'\n`,
  )
  expect(toAppImports(`import { KPIS } from './data'`, own[2], entries, own)).toBe(`import { KPIS } from './data'`)
  // A folder's index counts as the folder.
  const table = ['src/components/ui/data-table/index.ts', 'src/components/ui/data-table/data-table.tsx']
  expect(toAppImports(`export * from '.'`, table[1], entries, table)).toBe(`export * from '.'`)
})

test('core and icon source paths point at the files their items install', () => {
  expect(rewrite(`import { useYouj } from '@youj/core/lib/youj/provider'`)).toBe(`import { useYouj } from '@/lib/youj/provider'`)
  expect(rewrite(`import { CheckIcon as Check } from '@youj/icons/components/youj/icons/check'`)).toBe(
    `import { CheckIcon as Check } from '@/components/youj/icons/check'`,
  )
})

test('entry imports split into one import per declaring file, keeping type and as', () => {
  const out = rewrite(`import {\n  ThemeScope as scope,\n  type YoujProviderProps,\n  useSoundCue,\n} from '@youj/core'\nimport { SlidingIndicator } from '@youj/motion'`)
  expect(out).toBe(
    [
      `import { ThemeScope as scope, type YoujProviderProps } from '@/lib/youj/provider'`,
      `import { useSoundCue } from '@/lib/youj/sound-cue'`,
      `import { SlidingIndicator } from '@/components/youj/transitions/sliding-indicator'`,
    ].join('\n'),
  )
})

test('type-only imports and re-exports keep their form', () => {
  expect(rewrite(`import type { YoujProviderProps, DurationToken } from '@youj/core'`)).toBe(
    `import type { YoujProviderProps } from '@/lib/youj/provider'\nimport type { DurationToken } from '@/lib/youj/tokens'`,
  )
  expect(rewrite(`export { CheckIcon } from '@youj/icons'`)).toBe(`export { CheckIcon } from '@/components/youj/icons/check'`)
})

test('other imports are left alone', () => {
  const code = `import { Select } from '@base-ui/react/select'\nimport { motion } from 'motion/react'\n`
  expect(rewrite(code)).toBe(code)
})

test('names an entry does not export fail loudly', () => {
  expect(() => rewrite(`import { Nope } from '@youj/motion'`)).toThrow(/doesn't export Nope/)
  expect(() => rewrite(`import { Reveal } from '@youj/core'`)).toThrow(/doesn't export Reveal/)
  expect(() => rewrite(`import * as K from '@youj/motion'`)).toThrow(/named imports/)
})
