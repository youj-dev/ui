// @vitest-environment node
import { posix } from 'node:path'
import { installedFiles, type InstalledFile } from './installed-files'

const SPECIFIERS = /(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g
/** Imports an app can't resolve: the workspace packages, and relative paths to files outside the item. */
const packageImports = ({ path, code }: InstalledFile, item: InstalledFile[]) =>
  [...code.matchAll(SPECIFIERS)]
    .map((m) => m[1]!)
    .filter((s) => s.startsWith('@youj/') || (s.startsWith('.') && !item.some((f) => f.path.replace(/\.tsx?$/, '') === posix.join(posix.dirname(path), s))))

describe('installedFiles', () => {
  it("shows a block's files at their install paths, with the app's import aliases", () => {
    const files = installedFiles(['packages/ui/src/blocks/app/money-overview.tsx', 'packages/ui/src/blocks/app/money-overview/components/send-drawer.tsx'])
    expect(files.map((f) => f.path)).toEqual(['blocks/app/money-overview.tsx', 'blocks/app/money-overview/components/send-drawer.tsx'])
    const shell = files[0]!.code
    expect(shell.startsWith("'use client'")).toBe(true)
    expect(shell).toContain(`from '@/lib/utils'`)
    expect(shell).toContain(`from './money-overview/components/send-drawer'`)
    expect(shell).toContain(`from '@/lib/youj/provider'`)
    expect(files[1]!.code).toContain(`from '@/hooks/use-mobile'`)
    for (const file of files) expect(packageImports(file, files)).toEqual([])
  })

  it('rewrites a block the way its registry item installs it', () => {
    // The login page's form lives in the auth layout's folder, shared with the auth flow.
    const [block] = installedFiles(['packages/ui/src/blocks/auth/shell/sign-in-form.tsx'])
    expect(block!.path).toBe('blocks/auth/shell/sign-in-form.tsx')
    expect(block!.code).toContain(`from '@/components/ui/form'`)
    expect(packageImports(block!, [block!])).toEqual([])
  })
})
