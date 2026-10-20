import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

/* One word means one thing. These hold the shared vocabulary (core's
 * lib/youj/vocabulary.ts: Size, Status, InView) the way the token lints hold
 * the colours: a component that spells an idea its own way fails here. Each
 * baseline lists the files where a non-shared spelling is allowed; a new
 * entry needs a reason in review. */

const root = join(import.meta.dirname, '..')
const motionRoot = join(root, '../motion/src')

function sources(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((f) => f.isFile() && /\.tsx?$/.test(f.name) && !/\.(test|stories|fixtures|ssr-cases)\./.test(f.name) && !f.name.endsWith('.d.ts'))
    .map((f) => join(f.parentPath, f.name))
}

const components = sources(join(root, 'src/components/ui'))
const lib = sources(join(root, 'src/lib'))
const motion = sources(motionRoot)
const read = (file) => readFileSync(file, 'utf8')
const name = (file) => relative(join(root, 'src'), file).replace(/^.*\/src\//, '')

/** Files that may contain `needle` (a RegExp), by their path ending. */
function offenders(files, needle) {
  return files.filter((file) => needle.test(read(file))).map((file) => file.slice(file.indexOf('/src/') + 1))
}
const only = (baseline) => (found) => expect(found.filter((file) => !baseline.some((ok) => file.endsWith(ok)))).toEqual([])

describe('size', () => {
  const SCALE = new Set(['xs', 'sm', 'default', 'lg', 'xl', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'])
  // md: shadcn's own SidebarMenuSubButton.
  const BASELINE_MD = ['components/ui/sidebar.tsx']

  test('a size prop takes names from the shared scale (sm | default | lg, with xs and xl where needed)', () => {
    const wrong = []
    for (const file of components) {
      for (const [, declared] of read(file).matchAll(/^\s*size\??:\s*([^\n;{]+)$/gm)) {
        if (/\b(number|string)\b|Size\[|VariantProps/.test(declared)) continue
        const literals = [...declared.matchAll(/'([\w-]+)'/g)].map((m) => m[1])
        const extra = literals.filter((l) => !SCALE.has(l) && !(l === 'md' && BASELINE_MD.some((ok) => file.endsWith(ok))))
        if (extra.length) wrong.push(`${name(file)}: size ${extra.join(', ')}`)
      }
    }
    expect(wrong).toEqual([])
  })
})

describe('status', () => {
  test("no component names a severity 'destructive': it is 'danger', after the colour role", () => {
    only([])(offenders([...components, ...lib], /['"]destructive['"]/))
  })

  test("a *Tone type uses the colour-role names, never 'error', 'critical', 'negative' or 'bad'", () => {
    const wrong = []
    for (const file of components) {
      for (const [, tone, declared] of read(file).matchAll(/\btype (\w*Tone\w*)\s*=([^\n]*(?:\n\s+\|[^\n]*)*)/g)) {
        const bad = [...declared.matchAll(/'([\w-]+)'/g)].map((m) => m[1]).filter((l) => ['error', 'critical', 'negative', 'bad', 'destructive', 'info-tone'].includes(l))
        if (bad.length) wrong.push(`${name(file)}: ${tone} has ${bad.join(', ')}`)
      }
    }
    expect(wrong).toEqual([])
  })
})

describe('errors', () => {
  test('an `error` prop is a message (string or ReactNode); a flag is `invalid`', () => {
    only([])(offenders(components, /^\s*error\??:\s*boolean\b/m))
  })
})

describe('in view', () => {
  test('a component that waits for the viewport takes `inView`, not trigger="view", once, amount or startOnView', () => {
    only([])(offenders([...components, ...motion], /\bstartOnView\??:|\btrigger\??:\s*'mount'\s*\|\s*'view'|^\s*once\??:\s*boolean/m))
  })
})
