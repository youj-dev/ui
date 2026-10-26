import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { hasUseClientDirective, isClientModule, withUseClient } from '../../../scripts/use-client.mjs'

/* The rule both package builds and both registries use to mark client modules. */

test('components and hook modules are client modules', () => {
  expect(isClientModule('icons/check.tsx', `export const CheckIcon = createIcon({})`)).toBe(true)
  expect(isClientModule('use-thing.ts', `import { useEffect, useRef } from 'react'`)).toBe(true)
  expect(isClientModule('ctx.ts', `import React, { createContext } from 'react'`)).toBe(true)
  expect(isClientModule('anim.ts', `import {\n  animate,\n} from 'motion/react'`)).toBe(true)
})

test('type-only React imports and plain helpers stay server-safe', () => {
  expect(isClientModule('tokens.ts', `export const durations = { fast: 140 }`)).toBe(false)
  expect(isClientModule('cn.ts', `import { clsx, type ClassValue } from 'clsx'`)).toBe(false)
  expect(isClientModule('types.ts', `import type { ReactNode } from 'react'`)).toBe(false)
  expect(isClientModule('types.ts', `import { type ReactNode, type Ref } from 'react'`)).toBe(false)
})

test('a style recipe (*.variants.ts) is plain class-name data, so a server component can call it', () => {
  expect(isClientModule('button.variants.ts', `import { cva } from 'class-variance-authority'\nexport const buttonVariants = cva('x')`)).toBe(false)
  // Every recipe in @youj/react stays free of React, so the barrel can export it from its own file.
  const dir = join(import.meta.dirname, '../../ui/src/components/ui')
  const recipes = readdirSync(dir).filter((f) => f.endsWith('.variants.ts'))
  expect(recipes.length).toBeGreaterThan(5)
  for (const file of recipes) expect(isClientModule(file, readFileSync(join(dir, file), 'utf8')), file).toBe(false)
})

test('withUseClient adds the directive once, after nothing but comments', () => {
  expect(withUseClient('a.tsx', `export const A = 1\n`)).toBe(`'use client'\n\nexport const A = 1\n`)
  const marked = `/* header */\n'use client'\nexport const A = 1\n`
  expect(withUseClient('a.tsx', marked)).toBe(marked)
  expect(withUseClient('tokens.ts', `export const t = 1\n`)).toBe(`export const t = 1\n`)
})

test('the directive is found after whitespace and comments, and a file of many comments is scanned in linear time', () => {
  expect(hasUseClientDirective(`'use client'`)).toBe(true)
  expect(hasUseClientDirective(`\n  // a\n/* b */ /** c */\n"use client"\n`)).toBe(true)
  expect(hasUseClientDirective(`export const a = 1\n'use client'`)).toBe(false)
  expect(hasUseClientDirective(`// 'use client'`)).toBe(false)
  expect(hasUseClientDirective(`/* never closed 'use client'`)).toBe(false)
  const comments = '/**/ '.repeat(50_000)
  const start = performance.now()
  expect(hasUseClientDirective(`${comments}export {}`)).toBe(false)
  expect(hasUseClientDirective(`${comments}'use client'`)).toBe(true)
  expect(performance.now() - start).toBeLessThan(1000)
})
