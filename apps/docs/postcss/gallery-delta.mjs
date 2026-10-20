// The site's stylesheet, in two. app/global.css is what every page loads: the site, the docs and the kit, without
// the classes only the blocks use (its `@source not` lines). app/gallery.css is compiled from the SAME
// imports with those sources added, and this plugin then takes out everything global.css already holds. What is
// left is what a page that renders a block or an example needs on top of global.css: their own utilities, and the
// theme variables and `@property` defaults only they use.
//
// Both sheets are compiled by the same Tailwind (optimised the same way, so one class reads the same in both). A
// rule is taken out of the gallery sheet only when global.css holds it under the same layer and media, for every
// selector in its list, declaration for declaration: a selector list the optimiser merged differently in the two
// sheets is compared selector by selector, never on its text.
import { readFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import postcss from 'postcss'
import tailwindcss from '@tailwindcss/postcss'

/** The entry this plugin trims, and the one it trims it against (both in the same folder). */
const GALLERY = 'gallery.css'
const CORE = 'global.css'

/** A selector list's members, split on the commas outside parentheses, brackets and strings. */
export function splitSelector(list) {
  const parts = []
  let depth = 0
  let quote = ''
  let start = 0
  for (let i = 0; i < list.length; i++) {
    const c = list[i]
    if (c === '\\') i++
    else if (quote) {
      if (c === quote) quote = ''
    } else if (c === '"' || c === "'") quote = c
    else if (c === '(' || c === '[') depth++
    else if (c === ')' || c === ']') depth--
    else if (c === ',' && depth === 0) {
      parts.push(list.slice(start, i).trim())
      start = i + 1
    }
  }
  parts.push(list.slice(start).trim())
  return parts
}

const decl = (d) => `${d.prop}:${d.value}${d.important ? '!' : ''}`
const header = (node) => `@${node.name} ${node.params}`
const ownDecls = (node) => (node.nodes ?? []).filter((child) => child.type === 'decl').map(decl)
const isKeyframes = (node) => node.type === 'atrule' && node.name.endsWith('keyframes')

/** Every rule and at-rule in `root` by where it sits (its layers and media, then its selector) and what it declares. */
export function index(root) {
  const seen = new Map()
  const add = (key, entries) => {
    const known = seen.get(key) ?? new Set()
    for (const entry of entries) known.add(entry)
    seen.set(key, known)
  }
  const walk = (container, path) => {
    container.each((node) => {
      if (isKeyframes(node)) return add(`${path}/${header(node)}`, [node.toString()])
      if (node.type === 'rule') {
        for (const selector of splitSelector(node.selector)) add(`${path}/${selector}`, ownDecls(node))
        walk(node, `${path}/${node.selector}`)
      } else if (node.type === 'atrule') {
        add(`${path}/${header(node)}`, ownDecls(node))
        if (node.nodes) walk(node, `${path}/${header(node)}`)
      }
    })
  }
  walk(root, '')
  return seen
}

/** Removes from `root` every rule, selector and declaration that `base` (a stylesheet as text) holds too, and returns it. */
export function withoutBase(root, base) {
  const known = index(postcss.parse(base))
  const strip = (container, path) => {
    container.each((node) => {
      if (node.type === 'comment') return node.remove()
      if (isKeyframes(node)) {
        if (known.get(`${path}/${header(node)}`)?.has(node.toString())) node.remove()
        return
      }
      if (node.type === 'rule') {
        const decls = ownDecls(node)
        const selectors = splitSelector(node.selector)
        const covers = (selector) => {
          const has = known.get(`${path}/${selector}`)
          return !!has && decls.every((d) => has.has(d))
        }
        const left = selectors.filter((selector) => !covers(selector))
        if (decls.length && !left.length) return node.remove()
        const original = node.selector
        if (decls.length && left.length < selectors.length) node.selector = left.join(',')
        // A declaration goes only when every selector still in the rule has it in the base.
        for (const child of [...node.nodes]) {
          if (child.type === 'decl' && left.every((selector) => known.get(`${path}/${selector}`)?.has(decl(child)))) child.remove()
        }
        strip(node, `${path}/${original}`)
        if (!node.nodes.length) node.remove()
      } else if (node.type === 'atrule') {
        const here = `${path}/${header(node)}`
        if (!node.nodes) {
          // A statement (`@layer a, b;`) stays: a few bytes that fix the layer order wherever the sheet loads.
          if (node.name !== 'layer' && known.has(here)) node.remove()
          return
        }
        const has = known.get(here)
        if (has) for (const child of [...node.nodes]) if (child.type === 'decl' && has.has(decl(child))) child.remove()
        strip(node, here)
        if (!node.nodes.length) node.remove()
      }
    })
  }
  strip(root, '')
  return root
}

export default function galleryDelta() {
  return {
    postcssPlugin: 'youj-gallery-delta',
    async Once(root, { result }) {
      const file = root.source?.input.file
      if (!file || basename(file) !== GALLERY) return
      const coreFile = join(dirname(file), CORE)
      // Under another name than global.css's own, so this compile never shares Tailwind's per-file cache with the one Next runs.
      const core = await postcss([tailwindcss()]).process(readFileSync(coreFile, 'utf8'), { from: join(dirname(file), '.gallery-core.css') })
      // This plugin is listed after Tailwind's, so `root` is its output by now.
      withoutBase(root, core.css)
      // What global.css read is what this sheet is measured against: a change to any of it must rebuild this one too (next dev).
      result.messages.push({ type: 'dependency', plugin: 'youj-gallery-delta', file: coreFile, parent: file })
      for (const message of core.messages) if (/dependency$/.test(message.type)) result.messages.push({ ...message, parent: file })
    },
  }
}
galleryDelta.postcss = true
