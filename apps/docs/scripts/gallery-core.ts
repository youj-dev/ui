// Writes generated/gallery-core.txt: the classes of the blocks and examples that stay in the sheet every page loads.
//
// The blocks' and examples' own utilities load only where they render (app/gallery.css), after app/global.css. Tailwind
// orders a stylesheet by variant first (`pt-20`, then `md:pt-28`) and by property after that (`p-4`, then `pt-20`), so
// two rules that set one property must sit in one sheet to keep that order: split across two, the later sheet's rule
// wins whatever the order was. A class that a block writes beside another of the same property family
// (`pt-20 md:pt-28`, `p-4 md:pt-8`, `row-span-3 row-start-1`) is therefore kept in global.css with its neighbours,
// wherever it is used (tailwind.css names this file as a source). A class in a string of its own, or beside classes of
// other properties, is free to load with the blocks.
//
// It reads strings, not elements, so it holds what a block writes together. What a block adds to a component through
// `className` sits beside that component's own classes in another file: those pairs are found by rendering (the
// computed styles of every block and example page, in one sheet and in two, must match; see apps/docs/README.md) and
// named in PINNED.
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = fileURLToPath(new URL('../../..', import.meta.url))
/** The folders app/global.css leaves out of its scan (its `@source not` lines). */
export const GALLERY_SOURCES = ['packages/ui/src/blocks']

/** The variants and the utility of a class: `md:hover:-pt-2!` is `md:hover:` and `pt-2`. */
export function splitClass(token: string): { variants: string; utility: string } {
  let depth = 0
  let cut = -1
  for (let i = 0; i < token.length; i++) {
    const c = token[i]
    if (c === '[' || c === '(') depth++
    else if (c === ']' || c === ')') depth--
    else if (c === ':' && depth === 0) cut = i
  }
  const utility = (cut < 0 ? token : token.slice(cut + 1)).replace(/^!/, '').replace(/!$/, '').replace(/^-/, '')
  return { variants: cut < 0 ? '' : token.slice(0, cut), utility }
}

/**
 * The property family a utility belongs to. Utilities in one family can set the same property (padding and its
 * sides, a radius and its corners, a width and a size), so they are ordered against each other; the rest cannot.
 */
export function familyOf(utility: string): string {
  const root = utility.replace(/\[.*$/, '').split('-')[0] ?? utility
  if (/^p[xytblrse]?$/.test(root)) return 'padding'
  if (/^m[xytblrse]?$/.test(root)) return 'margin'
  if (/^(inset|top|right|bottom|left|start|end)$/.test(root)) return 'inset'
  if (/^(w|h|size|min|max)$/.test(root)) return 'size'
  return root
}

/**
 * Classes a block adds to a component whose own classes set the same property, found by comparing pages in one sheet
 * and in two. Each stays in global.css beside the component's, so Tailwind's order between them holds.
 */
export const PINNED = [
  // marketing-hero-motion: Button's outline variant sets `bg-transparent`, which Tailwind puts after this one, so it has never shown.
  'bg-canvas/70', // youj-allow: the class hero-motion's string carries
]

/** The classes of `literals` that share a string with a different class of their own family, and the pinned ones. */
export function classesToKeep(literals: string[]): Set<string> {
  const keep = new Set<string>()
  for (const text of literals) {
    const families = new Map<string, { token: string; variants: string }[]>()
    for (const token of text.split(/\s+/)) {
      if (!token) continue
      const { variants, utility } = splitClass(token)
      if (!utility) continue
      const family = familyOf(utility)
      families.set(family, [...(families.get(family) ?? []), { token, variants }])
    }
    for (const members of families.values()) {
      if (new Set(members.map((m) => m.token)).size < 2) continue
      for (const m of members) keep.add(m.token)
    }
  }
  for (const token of PINNED) keep.add(token)
  return keep
}

/** Every string literal in a source file that holds more than one word: the classes a component writes are among them. */
export function literalsOf(source: string): string[] {
  const out: string[] = []
  for (const m of source.matchAll(/'((?:\\.|[^'\\\n])*)'|"((?:\\.|[^"\\\n])*)"|`((?:\\.|[^`\\])*)`/g)) {
    const text = m[1] ?? m[2] ?? m[3] ?? ''
    if (/\s/.test(text.trim())) out.push(text)
  }
  return out
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (/\.(tsx?|jsx?)$/.test(name) && !/\.(test|stories)\./.test(name)) out.push(path)
  }
  return out
}

export function galleryCoreClasses(root = ROOT): string[] {
  const literals = GALLERY_SOURCES.flatMap((dir) => walk(join(root, dir))).flatMap((file) => literalsOf(readFileSync(file, 'utf8')))
  return [...classesToKeep(literals)].sort()
}

function main() {
  const classes = galleryCoreClasses()
  const out = fileURLToPath(new URL('../generated/gallery-core.txt', import.meta.url))
  mkdirSync(fileURLToPath(new URL('../generated', import.meta.url)), { recursive: true })
  writeFileSync(out, `${classes.join('\n')}\n`)
  console.log(`gallery core: ${classes.length} classes kept in global.css → generated/gallery-core.txt`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
