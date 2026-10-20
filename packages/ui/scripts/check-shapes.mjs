// Shape discipline: a kit control's shape comes from the theme, in one place
// (ui.css's family tokens: --radius-button, --radius-field, --radius-choice,
// --radius-chip, --radius-surface, --radius-overlay, and the field style), so
// a block or a component that renders another kit control never
// sets that control's corner, height, border or field fill itself. It fails on
//   - a radius, height or border class on a kit control (`<Button className="rounded-full h-8">`),
//   - a fill class on a field (Input, Select trigger, Textarea, InputGroup…),
//   - a trailing `!` (important) on any class of a kit control, or an `own:` radius, height or border on one,
//   - the same through buttonVariants()/badgeVariants() or a descendant
//     selector that reaches into one (`[&_select]:border-transparent`),
//   - a local override of the tokens they read (`[--color-field:…]`,
//     `[--color-line-control:…]`, `[--radius-…]`, `data-yj-soft`).
// A genuine exception carries `// shape: <reason>` inside the tag or on one of
// the two lines above it (above the class constant, for one).
//
//   node scripts/check-shapes.mjs [ui|docs]          the check (exit 1 on a violation); both when neither is named
//   node scripts/check-shapes.mjs [ui|docs] --report every hit, allowed ones too, as JSON
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const REPO = new URL('../../..', import.meta.url).pathname
/* Each package checks its own: @youj/react's verify runs `ui`, the docs' runs `docs`. */
const ROOTS = {
  ui: ['packages/ui/src/components', 'packages/ui/src/blocks'],
  docs: ['apps/docs/examples', 'apps/docs/components'],
}

/* The kit controls by family. A component's own file may style its own parts
 * (that is where the shape is defined); it is held to the rule where it
 * renders another kit control. */
const FAMILIES = {
  button: ['Button', 'AsyncButton', 'InputGroupButton', 'DialogClose', 'ButtonGroup'],
  field: [
    'Input',
    'Textarea',
    'InputGroup',
    'SelectTrigger',
    'NativeSelect',
    'Combobox',
    'NumberInput',
    'PasswordInput',
    'PhoneInput',
    'DatePicker',
    'DateRangePicker',
    'TimePicker',
    'MultiSelect',
    'TagInput',
    'ColorOpacityField',
    'ScrubNumberField',
  ],
  choice: ['TabsList', 'TabsTrigger', 'SegmentedControl', 'SegmentedControlItem', 'ToggleGroup', 'ToggleGroupItem', 'Toggle'],
  chip: ['Badge', 'FilterChips', 'Kbd'],
  surface: ['Card'],
  overlay: [
    'DialogContent',
    'AlertDialogContent',
    'PopoverContent',
    'DropdownMenuContent',
    'SelectContent',
    'ContextMenuContent',
    'HoverCardContent',
    'SheetContent',
    'DrawerContent',
  ],
}
const FAMILY_OF = new Map(Object.entries(FAMILIES).flatMap(([family, names]) => names.map((n) => [n, family])))
const RECIPES = { buttonVariants: 'button', badgeVariants: 'chip', toggleVariants: 'choice' }

const RADIUS = /^rounded(?:-|$)/
const HEIGHT = /^(?:h|size|min-h)-/
const BORDER = /^border(?:-(?:[xytrblse]|0|2|4|8|none|transparent|solid|dashed|dotted|line[\w-]*|\(|\[)|$)/
const FILL = /^bg-/
const TOKEN_OVERRIDE = /\[--(?:color-field|color-line-control|color-well|color-key|color-control|radius-[\w-]+|yj-radius|yj-pill|yj-field-soft|yj-shape-[\w-]+|bz-[\w-]+)\s*:/
const SLOTS = 'button|input|input-group|textarea|select-trigger|native-select|combobox-trigger|tabs-list|tabs-trigger|tabs-indicator|toggle-group|toggle-group-item|toggle-group-indicator|segmented-control|segmented-control-item|toggle|badge|card|dialog-content|popover-content|dropdown-menu-content|select-content|kbd'
const FIELD_SLOTS = 'input|input-group|textarea|select-trigger|native-select|combobox-trigger'
// A reach into a kit control's shape (corner, edge, height), or into a field's fill.
const DESCENDANT = new RegExp(
  `\\[&[^\\]]*?(?:(?:_(?:select|input|button|textarea)\\b|data-slot=['"]?(?:${SLOTS})['"]?\\])[^\\s'"\`]*:!?(?:rounded|border|h-|size-)|(?:_(?:select|input|textarea)\\b|data-slot=['"]?(?:${FIELD_SLOTS})['"]?\\])[^\\s'"\`]*:!?bg-)`,
)

/* What a class token sets, after its variants (`hover:`, `own:`, `[&_x]:`). */
function utility(token) {
  return token.slice(variantsOf(token).length).replace(/^!|!$/g, '')
}

/* A class token's variants, with their colons (`hover:`, `own:`, `[&_x]:`). */
function variantsOf(token) {
  let depth = 0
  let cut = 0
  for (let i = 0; i < token.length; i++) {
    const c = token[i]
    if (c === '[' || c === '(') depth++
    else if (c === ']' || c === ')') depth--
    else if (c === ':' && depth === 0) cut = i + 1
  }
  return token.slice(0, cut)
}

let seen = []
function shapeKind(token, family) {
  const k = kindOf(token, family)
  if (k) seen.push(token)
  return k
}
/* The theme's own names are what a shape should be written in: a family's
 * corner (rounded-field-sm, rounded-s-button, rounded-choice-key, or a calc
 * over --radius-<family>) and the control heights (h-control-sm). */
const FAMILY_RADIUS = /^rounded(?:-(?:[setblrxy]{1,2}))?-(?:(?:button|field|choice|chip|surface|overlay)(?:-(?:xs|sm|lg|area|key))?|\[[^\]]*var\(--radius-(?:button|field|choice|chip|surface|overlay)[^\]]*\]|\(--radius-(?:button|field|choice|chip|surface|overlay)[\w-]*\))$/
const TOKEN_HEIGHT = /^(?:h|size|min-h)-control(?:-(?:xs|sm|lg))?$|^(?:h|size)-(?:full|auto|fit|min|max|px)$/

function kindOf(token, family) {
  const u = utility(token)
  // A class aimed past the control at something inside it (`[&_svg]:size-4`, `*:rounded-none`) is the
  // inside's; a reach into another kit control is caught on its own line (DESCENDANT).
  if (/(?:^|:)(?:\[&[_>~+]|\*{1,2}:)/.test(variantsOf(token))) return null
  // `!` forces a class past the control's own: fix the cause (a variant, a token) instead.
  if (/^!|!$/.test(token.slice(variantsOf(token).length))) return 'important'
  // `own:` is the control's own layer, so a shape written in it from outside is a second definition of it.
  if (/(?:^|:)own:/.test(variantsOf(token)) && (RADIUS.test(u) || HEIGHT.test(u) || BORDER.test(u))) return 'own: shape'
  // The theme's field style, read where a field is drawn.
  if (/^(?:border|bg)-\(--ui--field-/.test(u)) return null
  if (RADIUS.test(u)) return FAMILY_RADIUS.test(u) ? null : 'radius'
  // A card's or a popup's height is layout (a block keeps its size), and a textarea's is its rows.
  if (HEIGHT.test(u) && family !== 'surface' && family !== 'overlay' && !TOKEN_HEIGHT.test(u)) return 'height'
  if (BORDER.test(u) && family !== 'surface' && family !== 'overlay') return 'border'
  if (family === 'field' && FILL.test(u)) return 'fill'
  return null
}

/* String literals inside an expression (className values, cn() arguments). */
function literals(text) {
  const out = []
  const re = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g
  for (let m = re.exec(text); m; m = re.exec(text)) out.push((m[1] ?? m[2] ?? m[3] ?? '').replace(/\$\{[^}]*\}/g, ' '))
  return out
}

/* The opening tag starting at `start` (the `<`): up to its closing `>` at depth 0. */
function openingTag(src, start) {
  let depth = 0
  let quote = null
  for (let i = start + 1; i < src.length; i++) {
    const c = src[i]
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') quote = c
    else if (c === '{') depth++
    else if (c === '}') depth--
    else if (c === '>' && depth === 0 && src[i - 1] !== '=') return src.slice(start, i + 1)
  }
  return src.slice(start)
}

/* A call's argument list starting at the `(` at `open`. */
function callArgs(src, open) {
  let depth = 0
  for (let i = open; i < src.length; i++) {
    if (src[i] === '(') depth++
    else if (src[i] === ')' && --depth === 0) return src.slice(open, i + 1)
  }
  return src.slice(open)
}

const lineOf = (src, index) => src.slice(0, index).split('\n').length

function reason(src, index, text) {
  const own = /\/\/\s*shape:\s*\S|\/\*\s*shape:\s*\S/.test(text)
  if (own) return text.match(/shape:\s*([^\n*]*)/)?.[1].trim()
  const lines = src.slice(0, index).split('\n')
  const above = lines.slice(-3).join('\n')
  return above.match(/shape:\s*([^\n*]*)/)?.[1].trim()
}

/* A class constant's literals: `const SOFT = '…'` or `cn(…)`/`[…]`, in this
 * file or one it imports relatively (a block's data.ts). */
function constLiterals(name, src, file, read) {
  const def = new RegExp(`(?:^|\\n)(?:export )?const ${name}\\s*=\\s*`)
  const sources = [src]
  for (const m of src.matchAll(/from\s+'(\.{1,2}\/[^']+)'/g)) {
    const text = read?.(file, m[1])
    if (text) sources.push(text)
  }
  for (const text of sources) {
    const m = def.exec(text)
    if (!m) continue
    const start = m.index + m[0].length
    // The statement: to the first line end outside any bracket or string.
    let depth = 0
    let quote = null
    let end = text.length
    for (let i = start; i < text.length; i++) {
      const c = text[i]
      if (quote) {
        if (c === '\\') i++
        else if (c === quote) quote = null
      } else if (c === "'" || c === '"' || c === '`') quote = c
      else if ('([{'.includes(c)) depth++
      else if (')]}'.includes(c)) depth--
      else if (c === '\n' && depth <= 0) {
        end = i
        break
      }
    }
    const expr = text.slice(start, end)
    return { literals: literals(expr), text: text.slice(Math.max(0, m.index - 300), start) }
  }
  return null
}

export function scan(src, file, read) {
  const hits = []
  const ownName = file.match(/components\/ui\/([\w-]+)\.tsx$/)?.[1]
  // Kit controls rendered as JSX.
  // Bare names only: `<ToolbarPrimitive.Input>` is a primitive, not the kit's Input.
  const tagRe = /<([A-Z]\w*)[\s>/]/g
  for (let m = tagRe.exec(src); m; m = tagRe.exec(src)) {
    const name = m[1]
    const family = FAMILY_OF.get(name)
    if (!family) continue
    const tag = openingTag(src, m.index)
    seen = []
    const kinds = new Set()
    let constReason
    const cls = tag.match(/\bclassName=/)
    if (cls) {
      const rest = tag.slice(cls.index + 'className='.length)
      const value = rest.startsWith('{') ? rest.slice(0, matchBrace(rest) + 1) : rest.match(/^("[^"]*"|'[^']*')/)?.[0] ?? ''
      for (const lit of literals(value)) for (const t of lit.split(/\s+/)) if (t) kinds.add(shapeKind(t, family))
      // Class constants named in it (`className={SOFT}`, `cn('…', SOFT)`).
      const bare = value.replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g, '')
      for (const id of new Set(bare.match(/\b[A-Za-z_]\w*\b(?!\s*[(.:])/g) ?? [])) {
        if (/^(?:cn|className|undefined|null|true|false)$/.test(id)) continue
        const c = constLiterals(id, src, file, read)
        if (!c) continue
        const before = new Set(kinds)
        for (const lit of c.literals) for (const t of lit.split(/\s+/)) if (t) kinds.add(shapeKind(t, family))
        if (kinds.size > before.size && /shape:\s*\S/.test(c.text.split('\n').slice(-3).join('\n'))) constReason = c.text.match(/shape:\s*([^\n*]*)/g)?.pop()?.replace(/^shape:\s*/, '').trim()
      }
    }
    // A textarea's min-height is how many rows it opens with.
    if (name === 'Textarea' && seen.every((t) => kindOf(t, family) !== 'height' || /^min-h-/.test(utility(t)))) {
      kinds.delete('height')
      seen = seen.filter((t) => !/^min-h-/.test(utility(t)))
    }
    // The demo-data marker's dashed outline is the documented convention (CONTRIBUTING, Blocks: Demo data).
    if (name === 'Badge' && /data-slot="demo-marker"/.test(tag)) {
      kinds.delete('border')
      seen = seen.filter((t) => !BORDER.test(utility(t)))
    }
    if (/\bstyle=\{\{[^}]*\b(?:borderRadius|height|border\w*)\s*:/.test(tag)) kinds.add('inline style')
    if (/\bdata-yj-soft\b/.test(tag)) kinds.add('soft override')
    kinds.delete(null)
    if (kinds.size) hits.push({ line: lineOf(src, m.index), control: name, family, kinds: [...kinds], classes: seen, reason: reason(src, m.index, tag) ?? constReason })
    seen = []
  }
  // Recipes called with extra classes beside them: cn(buttonVariants(...), 'rounded-full').
  const cnRe = /\bcn\(/g
  for (let m = cnRe.exec(src); m; m = cnRe.exec(src)) {
    const args = callArgs(src, m.index + 2)
    const recipe = Object.keys(RECIPES).find((r) => args.includes(`${r}(`))
    if (!recipe || (ownName && `${ownName}`.startsWith(recipe.replace('Variants', '')))) continue
    seen = []
    const kinds = new Set()
    const stripped = args.replace(new RegExp(`${recipe}\\(([^()]|\\([^()]*\\))*\\)`), '')
    for (const lit of literals(stripped)) for (const t of lit.split(/\s+/)) if (t) kinds.add(shapeKind(t, RECIPES[recipe]))
    kinds.delete(null)
    if (kinds.size) hits.push({ line: lineOf(src, m.index), control: recipe, family: RECIPES[recipe], kinds: [...kinds], classes: seen, reason: reason(src, m.index, args) })
    seen = []
  }
  // Token overrides and descendant reaches, wherever they are written.
  src.split('\n').forEach((text, i) => {
    const kinds = []
    if (TOKEN_OVERRIDE.test(text)) kinds.push('token override')
    if (DESCENDANT.test(text)) kinds.push('descendant override')
    if (!kinds.length) return
    const at = src.split('\n').slice(0, i).join('\n').length
    hits.push({ line: i + 1, control: '(scope)', family: 'scope', kinds, classes: [text.trim().slice(0, 160)], reason: reason(src, at, text) })
  })
  return hits
}

function matchBrace(text) {
  let depth = 0
  let quote = null
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') quote = c
    else if (c === '{') depth++
    else if (c === '}' && --depth === 0) return i
  }
  return text.length - 1
}

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      if (name !== 'node_modules') walk(p, out)
    } else if (/\.tsx?$/.test(name) && !/\.(stories|test|spec)\.tsx?$/.test(name)) out.push(p)
  }
  return out
}

function readImport(file, spec) {
  const base = join(REPO, file, '..', spec)
  for (const p of [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'data.ts')]) if (existsSync(p) && statSync(p).isFile()) return readFileSync(p, 'utf8')
  return null
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = process.argv.includes('--report')
  const scopes = process.argv.slice(2).filter((a) => a in ROOTS)
  const results = []
  for (const root of (scopes.length ? scopes : Object.keys(ROOTS)).flatMap((s) => ROOTS[s])) {
    const dir = join(REPO, root)
    if (!existsSync(dir)) continue
    for (const file of walk(dir, [])) {
      const rel = relative(REPO, file)
      for (const hit of scan(readFileSync(file, 'utf8'), rel, readImport)) results.push({ file: rel, ...hit })
    }
  }
  if (report) {
    process.stdout.write(`${JSON.stringify(results, null, 1)}\n`)
  } else {
    const bad = results.filter((r) => !r.reason)
    for (const r of bad) console.error(`${r.file}:${r.line}  ${r.control}: ${r.kinds.join(', ')} set locally (use the theme's shape tokens, or add \`// shape: <reason>\`)`)
    if (bad.length) {
      console.error(`\nlint:shapes: ${bad.length} local shape override${bad.length === 1 ? '' : 's'} on kit controls.`)
      process.exit(1)
    }
    console.log(`lint:shapes: ok (${results.length} documented exception${results.length === 1 ? '' : 's'}).`)
  }
}
