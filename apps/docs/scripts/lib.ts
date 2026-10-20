// What the docs build scripts share: where things live, how a generated file is written and how a script reports.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** apps/docs, the folder every script's paths hang off. */
export const docsRoot = fileURLToPath(new URL('..', import.meta.url))
export const packagesDir = join(docsRoot, '../../packages')
export const generatedDir = join(docsRoot, 'generated')

/** Writes a file under generated/ (or at an absolute path), creating its folder. */
export function writeGenerated(file: string, content: string) {
  const path = isAbsolute(file) ? file : join(generatedDir, file)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

/** A package's source file, as text: `readPackageFile('loaders/package.json')`. */
export const readPackageFile = (path: string) => readFileSync(join(packagesDir, path), 'utf8')

/** A script's one summary line: `loaders: 3 → generated/loaders.ts`. */
export const report = (script: string, summary: string) => console.log(`${script}: ${summary}`)
