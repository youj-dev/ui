import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, test } from 'vitest'

/* The site/preview boundary (token-audit ARCHITECTURE §5.3): the site sets library output down on a <Stage>
 * (components/site/stage.tsx) and never reaches inside one. A stage is the only site element that writes a theme
 * scope, and the site's sheets style the chrome around stages, not what stands on them. */

const root = process.cwd()

function files(dir: string, ext: RegExp): string[] {
  return readdirSync(join(root, dir)).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(join(root, path)).isDirectory()) return files(path, ext)
    return ext.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : []
  })
}

const source = [...files('components', /\.tsx$/), ...files('app', /\.tsx$/)]

describe('only a Stage writes a theme scope', () => {
  /** The stage itself, and the stealth page: a whole page in its own look (brand art), not a stage on the site. */
  const allowed = new Set(['components/site/stage.tsx', 'components/site/stealth-screen.tsx'])

  test('no other site markup sets data-yj-theme or data-theme', () => {
    const writers = source.filter((file) => !allowed.has(file) && /\sdata-(yj-)?theme=/.test(readFileSync(join(root, file), 'utf8')))
    expect(writers).toEqual([])
  })
})

/** A selector with its :not(…) groups taken out: what's left is what it matches, not what it excludes. */
function matching(selector: string): string {
  let out = ''
  for (let i = 0; i < selector.length; i++) {
    if (selector.startsWith(':not(', i)) {
      let depth = 0
      for (; i < selector.length; i++) {
        if (selector[i] === '(') depth++
        else if (selector[i] === ')' && --depth === 0) break
      }
      continue
    }
    out += selector[i]
  }
  return out
}

/** A selector list split at its top-level commas (not those inside :is(), :where() or :not()). */
function topLevel(list: string): string[] {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < list.length; i++) {
    if (list[i] === '(') depth++
    else if (list[i] === ')') depth--
    else if (list[i] === ',' && depth === 0) {
      parts.push(list.slice(start, i).trim())
      start = i + 1
    }
  }
  return [...parts, list.slice(start).trim()]
}

/** A selector's compounds, split at its top-level combinators. */
function compounds(selector: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const ch of selector.trim()) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (depth === 0 && /[\s>+~]/.test(ch)) {
      if (current) parts.push(current)
      current = ''
    } else current += ch
  }
  return current ? [...parts, current] : parts
}

/** Every selector in a sheet, nested rules joined to their parents (`&` replaced, or a descendant). */
function selectors(css: string): string[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const out: string[] = []
  const stack: string[][] = []
  let buffer = ''
  for (const ch of text) {
    if (ch === '{') {
      const head = buffer.trim()
      buffer = ''
      if (head.startsWith('@') || !head) {
        stack.push(stack.at(-1) ?? [''])
        continue
      }
      const parents = stack.at(-1) ?? ['']
      const own = topLevel(head)
      const joined = parents.flatMap((p) => own.map((s) => (s.includes('&') ? s.replaceAll('&', p) : p ? `${p} ${s}` : s)))
      // @utility bodies and @starting-style keep the parent's selector.
      if (/^(from|to|\d+%)$/.test(head)) stack.push(parents)
      else {
        out.push(...joined)
        stack.push(joined)
      }
    } else if (ch === '}') {
      stack.pop()
      buffer = ''
    } else if (ch === ';') buffer = ''
    else buffer += ch
  }
  return out
}

const sheets = ['styles/site.css', 'styles/theme.css', 'styles/prose.css']

describe('site CSS never styles inside a stage', () => {
  /** The site's own slot names (on its own markup), not the kit's hooks. */
  const siteSlots = /\[data-slot='(preview-toolbar|showroom-dock|stage-loader|loader-stage|illustration-stage)'\]/g

  test.each(sheets)('%s reaches into no stage and styles no kit part from the page', (file) => {
    const offenders = selectors(readFileSync(join(root, file), 'utf8')).filter((selector) => {
      const what = matching(selector).replace(siteSlots, '')
      // A descendant of a theme scope or a preview's stage: a stage in any compound but the last.
      if (compounds(what).slice(0, -1).some((c) => /\[data-yj-theme|\.site-stage|\[data-preview-stage/.test(c))) return true
      // A kit part, styled from the page: it must start at a site class or keep out of stages.
      if (/\[data-slot=/.test(what) && !/^\s*\./.test(what) && !/:not\(:where\(\[data-yj-theme\]:not\(html\) \*/.test(selector)) return true
      return false
    })
    expect(offenders).toEqual([])
  })
})

describe('site literals', () => {
  /**
   * Brand art and colour data: the stealth page, the colour demos and pickers, icon and illustration export (the
   * colours are the file's), the favicon's build-time colours, Wada's swatches the backdrops are drawn from.
   */
  const brandArt = [
    /^components\/site\/stealth-/,
    /^components\/examples\//,
    /^lib\/backdrops\.ts$/,
    /^components\/icons\/(download|static-svg|settings)\.ts$/,
    /^components\/illustrations\/export\.ts$/,
    /^lib\/site-brand\.ts$/,
    /^lib\/site-ink\.ts$/,
    // The site's light chrome keeps Graphite's tuned colours, which left the library's palettes.
    /^lib\/site-light\.ts$/,
    /^components\/site\/brand-marks\.tsx$/,
  ]
  const code = [...files('app', /\.tsx?$/), ...files('components', /\.tsx?$/), ...files('lib', /\.tsx?$/)].filter(
    (file) => !brandArt.some((re) => re.test(file)),
  )
  /** A colour written out: a hex, a colour function, a bracketed literal fill, or a black/white utility. */
  const literal =
    /(?<![\w&-])#[0-9a-fA-F]{3,8}\b(?![\w-])|(?<![a-zA-Z-])(?:rgba?|hsla?|oklch|oklab|lab|lch)\(\s*[\d.]|\b(?:bg|text|border|shadow|ring|fill|stroke|outline|from|via|to|decoration)-(?:black|white)\b|\b(?:bg|text|border)-\[#/

  test('the site paints with roles, not colours', () => {
    const found = code.flatMap((file) =>
      readFileSync(join(root, file), 'utf8')
        .split('\n')
        .flatMap((line, i) => (literal.test(line) ? [`${relative(root, join(root, file))}:${i + 1}: ${line.trim().slice(0, 120)}`] : [])),
    )
    expect(found).toEqual([])
  })
})
