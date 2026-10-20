import { markdownToPlainText, parseBlocks, parseInline, type MarkdownInline } from './chat-markdown-parse'
import { safeHref } from '../../../lib/safe-href'

/** A compact reading of an inline tree: **b** → <strong>b</strong>. */
function show(nodes: MarkdownInline[]): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case 'text':
          return node.text
        case 'code':
          return `<code>${node.text}</code>`
        case 'break':
          return '<br>'
        case 'cite':
          return `<cite ${node.index}>`
        case 'link':
          return `<a ${node.href ?? 'null'}>${show(node.children)}</a>`
        default:
          return `<${node.type}>${show(node.children)}</${node.type}>`
      }
    })
    .join('')
}
const md = (source: string, tail = false) => show(parseInline(source, tail))

describe('parseBlocks', () => {
  test('paragraphs, headings, rules and fences', () => {
    const blocks = parseBlocks('# Title\n\nFirst line\nsecond line\n\n---\n\n```ts\nconst a = 1\n```\n')
    expect(blocks.map((b) => b.type)).toEqual(['heading', 'paragraph', 'rule', 'code'])
    expect(blocks[1]).toMatchObject({ text: 'First line\nsecond line' })
    expect(blocks[3]).toMatchObject({ lang: 'ts', code: 'const a = 1', closed: true })
  })

  test('nested and ordered lists', () => {
    const [list] = parseBlocks('1. One\n   - a\n   - b\n2. Two\n3. Three')
    expect(list).toMatchObject({ type: 'list', ordered: true, start: 1, loose: false })
    if (list?.type !== 'list') throw new Error('not a list')
    expect(list.items).toHaveLength(3)
    expect(list.items[0]!.map((b) => b.type)).toEqual(['paragraph', 'list'])
  })

  test('a list ends at a paragraph after a blank line, and blank lines between items make it loose', () => {
    const blocks = parseBlocks('- a\n\n- b\n\nAfter')
    expect(blocks.map((b) => b.type)).toEqual(['list', 'paragraph'])
    expect(blocks[0]).toMatchObject({ loose: true })
  })

  test('code inside a list item', () => {
    const [list] = parseBlocks('- Run it:\n\n  ```sh\n  pnpm dev\n  ```\n- Done')
    if (list?.type !== 'list') throw new Error('not a list')
    expect(list.items[0]!.map((b) => b.type)).toEqual(['paragraph', 'code'])
    expect(list.items).toHaveLength(2)
  })

  test('GFM tables with alignment', () => {
    const [table] = parseBlocks('| Plan | Price |\n| :--- | ---: |\n| Pro | $20 |\n| Team | $40 |')
    expect(table).toMatchObject({ type: 'table', header: ['Plan', 'Price'], align: ['left', 'right'], rows: [['Pro', '$20'], ['Team', '$40']] })
  })

  test('blockquotes parse their own blocks, with lazy continuation', () => {
    const [quote] = parseBlocks('> Quoted *text*\ncontinues\n> - item')
    if (quote?.type !== 'quote') throw new Error('not a quote')
    expect(quote.blocks.map((b) => b.type)).toEqual(['paragraph', 'list'])
  })

  test('an unclosed fence is code, still open', () => {
    const blocks = parseBlocks('Here:\n\n```js\nconst x = ', true)
    expect(blocks[1]).toMatchObject({ type: 'code', lang: 'js', code: 'const x = ', closed: false })
  })

  describe('while streaming', () => {
    test('holds back a last line that is only a marker', () => {
      expect(parseBlocks('Intro\n\n-', true).map((b) => b.type)).toEqual(['paragraph'])
      expect(parseBlocks('Intro\n\n#', true).map((b) => b.type)).toEqual(['paragraph'])
      expect(parseBlocks('Intro\n\n``', true).map((b) => b.type)).toEqual(['paragraph'])
      expect(parseBlocks('Intro\n\n--', true).map((b) => b.type)).toEqual(['paragraph'])
      // Finished text is taken as written.
      expect(parseBlocks('Intro\n\n-').map((b) => b.type)).toEqual(['paragraph', 'list'])
    })

    test('holds back a first row of pipes until its delimiter row starts, then shows a table', () => {
      expect(parseBlocks('Compare:\n\n| Plan | Price |', true).map((b) => b.type)).toEqual(['paragraph'])
      expect(parseBlocks('Compare:\n\n| Plan | Price |\n', true).map((b) => b.type)).toEqual(['paragraph'])
      const blocks = parseBlocks('Compare:\n\n| Plan | Price |\n| --', true)
      expect(blocks[1]).toMatchObject({ type: 'table', header: ['Plan', 'Price'], rows: [] })
      expect(parseBlocks('| a | b |\n|---|---|\n| 1', true)[0]).toMatchObject({ type: 'table', rows: [['1', '']] })
    })
  })
})

describe('parseInline', () => {
  test('emphasis, strong, strikethrough and code', () => {
    expect(md('**bold** and *em* and _em_ and ~~gone~~ and `code`')).toBe(
      '<strong>bold</strong> and <em>em</em> and <em>em</em> and <del>gone</del> and <code>code</code>',
    )
    expect(md('***both***')).toBe('<strong><em>both</em></strong>')
    expect(md('**bold *nested* bold**')).toBe('<strong>bold <em>nested</em> bold</strong>')
    expect(md('*em **strong** em*')).toBe('<em>em <strong>strong</strong> em</em>')
  })

  test('underscores inside words and spaced asterisks stay literal', () => {
    expect(md('snake_case_name and 2 * 3 * 4')).toBe('snake_case_name and 2 * 3 * 4')
  })

  test('code spans keep their contents literal', () => {
    expect(md('`**not bold**` and `` a`b ``')).toBe('<code>**not bold**</code> and <code>a`b</code>')
  })

  test('links, autolinks, bare URLs and citations', () => {
    expect(md('[Docs](https://youj.io/docs "Title")')).toBe('<a https://youj.io/docs>Docs</a>')
    expect(md('<https://youj.io>')).toBe('<a https://youj.io/>https://youj.io</a>')
    expect(md('See https://youj.io/a_(b). Next')).toBe('See <a https://youj.io/a_(b)>https://youj.io/a_(b)</a>. Next')
    expect(md('As shown [1] and [^2].')).toBe('As shown <cite 1> and <cite 2>.')
  })

  test('newlines are line breaks and escapes are literal', () => {
    expect(md('one\ntwo \\*three\\*')).toBe('one<br>two *three*')
  })

  describe('at a streaming tail', () => {
    test('closes emphasis, code and links optimistically', () => {
      expect(md('This is **impor', true)).toBe('This is <strong>impor</strong>')
      expect(md('This is **important*', true)).toBe('This is <strong>important</strong>')
      expect(md('Run `pnpm de', true)).toBe('Run <code>pnpm de</code>')
      expect(md('Read [the docs](https://kin', true)).toBe('Read <a null>the docs</a>')
      expect(md('Read [the do', true)).toBe('Read <a null>the do</a>')
    })

    test('drops a formatting run that has nothing to format yet', () => {
      expect(md('Next **', true)).toBe('Next ')
      expect(md('Next `', true)).toBe('Next ')
      expect(md('Next [', true)).toBe('Next ')
    })

    test('finished text shows unclosed syntax as written', () => {
      expect(md('This is **impor')).toBe('This is **impor')
    })
  })
})

describe('sanitising', () => {
  test('only http(s) and mailto URLs link', () => {
    expect(safeHref('https://example.com')).toBe('https://example.com/')
    expect(safeHref('mailto:ada@example.com')).toBe('mailto:ada@example.com')
    for (const url of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'java\tscript:alert(1)', ' javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:msgbox', '/relative', '//evil.com', 'file:///etc/passwd']) {
      expect(safeHref(url)).toBeNull()
    }
  })

  test('script links render as their label, images as links, HTML as text', () => {
    expect(md('[click](javascript:alert(1))')).toBe('<a null>click</a>')
    expect(md('![a cat](https://example.com/cat.png)')).toBe('<a https://example.com/cat.png>a cat</a>')
    expect(md('<script>alert(1)</script>')).toBe('<script>alert(1)</script>')
  })
})

test('plain text for announcements drops formatting and keeps structure readable', () => {
  expect(markdownToPlainText('## Plan\n\n**Ship** it with [docs](https://x.dev):\n\n- one\n- two')).toBe('Plan\n\nShip it with docs:\n\n• one\n• two')
})
