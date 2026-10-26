import { describe, expect, it } from 'vitest'
import { propsTable } from '../src/format'
import { createTheme } from '../src/tools/theme'
import type { ComponentDoc } from '../src/types'

/* What goes into generated text is escaped for where it lands: a string literal in the theme's code, a cell in a props table. */

/** The `defineTheme({…})` object of a create_theme answer, evaluated the way TypeScript would read it. */
function evaluated(answer: string): Record<string, unknown> {
  const source = /```ts\n([\s\S]*?)\n```/.exec(answer)![1]!
  const body = source.replace(/^import .*\n+/, '').replace(/^export const \w+ = defineTheme\(/, 'return (')
  return new Function(body)() as Record<string, unknown>
}

describe('create_theme writes strings that read back as given', () => {
  const names = [
    'Ember',
    "O'Brien",
    'Back\\slash',
    'ends with a backslash\\',
    'say "hi" <b>&</b> </script>',
    'two\nlines\r\nand\u2028separators\u2029',
    "x\\' + (globalThis.__pwned = 1) + \\'",
    "x'; globalThis.__pwned = 1; '",
  ]

  it.each(names)('the brand name %j', (name) => {
    const theme = evaluated(createTheme({ accent: '#ff5a1f', name }))
    expect(theme.name).toBe(name)
    expect((globalThis as Record<string, unknown>).__pwned).toBeUndefined()
  })

  it('leaves plain names exactly as before', () => {
    expect(createTheme({ accent: '#ff5a1f', name: 'Ember' })).toContain("  name: 'Ember',")
    expect(createTheme({ accent: '#ff5a1f', name: "O'Brien" })).toContain("  name: 'O\\'Brien',")
  })
})

describe('props tables keep every row to its cells', () => {
  /** Cells of a row the way a Markdown table reader finds them: a pipe splits unless an odd run of backslashes escapes it. */
  const cells = (row: string) => {
    const out: string[] = []
    let current = ''
    for (let i = 0; i < row.length; i++) {
      if (row[i] === '|') {
        let slashes = 0
        while (slashes < current.length && current[current.length - 1 - slashes] === '\\') slashes++
        if (slashes % 2 === 0) {
          out.push(current)
          current = ''
          continue
        }
      }
      current += row[i]
    }
    out.push(current)
    return out.slice(1, -1)
  }
  const doc = (description: string, type = 'string', def?: string): ComponentDoc => ({ name: 'X', props: [{ name: 'value', type, default: def, description } as ComponentDoc['props'][number]] })
  const row = (d: ComponentDoc) => propsTable(d).split('\n')[2]!

  it.each(['a|b', 'a\\|b', 'a\\\\|b', 'ends with a backslash \\', 'a\\ | b', 'line one\nline two'])('a description of %j is one cell', (description) => {
    expect(cells(row(doc(description)))).toHaveLength(4)
  })

  it('does the same for the type and the default', () => {
    expect(cells(row(doc('d', 'a | b\\|c', "'\\|'")))).toHaveLength(4)
  })

  it('leaves text without a backslash before a pipe as it was', () => {
    expect(row(doc('Either a|b or C:\\temp', 'A | B'))).toBe('| value | `A \\| B` |  | Either a\\|b or C:\\temp |')
  })
})
