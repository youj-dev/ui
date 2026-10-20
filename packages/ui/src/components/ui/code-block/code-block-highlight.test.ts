import { highlight } from './code-block-highlight'

const kinds = (code: string, lang: string) =>
  highlight(code, lang)
    .filter((t) => t.kind)
    .map((t) => `${t.kind}:${t.text}`)

describe('highlight', () => {
  test('TypeScript: keywords, strings, numbers, calls, types and comments', () => {
    expect(kinds('const total: Price = sum(items, 2) // cents', 'ts')).toEqual([
      'keyword:const',
      'punctuation::',
      'type:Price',
      'punctuation:=',
      'function:sum',
      'punctuation:(',
      'punctuation:,',
      'number:2',
      'punctuation:)',
      'comment:// cents',
    ])
    expect(kinds('return `hi ${name}`', 'js')).toEqual(['keyword:return', 'string:`hi ${name}`'])
  })

  test('keywords only match whole words', () => {
    expect(kinds('iffy', 'js')).toEqual([])
  })

  test('JSON keys are properties, values are strings', () => {
    expect(kinds('{"plan": "pro", "seats": 3, "sso": true}', 'json')).toEqual([
      'punctuation:{',
      'property:"plan"',
      'punctuation::',
      'string:"pro"',
      'punctuation:,',
      'property:"seats"',
      'punctuation::',
      'number:3',
      'punctuation:,',
      'property:"sso"',
      'punctuation::',
      'number:true',
      'punctuation:}',
    ])
  })

  test('shell: the command, flags, variables and comments', () => {
    expect(kinds('pnpm add motion --save-exact # pin it', 'bash')).toEqual(['function:pnpm', 'meta:--save-exact', 'comment:# pin it'])
    expect(kinds('echo $HOME', 'sh')).toEqual(['function:echo', 'property:$HOME'])
  })

  test('python strings, decorators and constants', () => {
    expect(kinds('@cache\ndef f(x=None): return f"{x}"', 'python')).toEqual([
      'meta:@cache',
      'keyword:def',
      'function:f',
      'punctuation:(',
      'punctuation:=',
      'number:None',
      'punctuation:):',
      'keyword:return',
      'string:f"{x}"',
    ])
  })

  test('an unterminated string or comment still streaming runs to the end', () => {
    expect(kinds('const s = "still typ', 'ts')).toEqual(['keyword:const', 'punctuation:=', 'string:"still typ'])
    expect(kinds('/* half a comm', 'css')).toEqual(['comment:/* half a comm'])
  })

  test('diff lines', () => {
    expect(kinds('@@ -1 +1 @@\n-old\n+new', 'diff')).toEqual(['meta:@@ -1 +1 @@', 'deleted:-old', 'inserted:+new'])
  })

  test('unknown languages are plain, and the text always round-trips', () => {
    expect(highlight('whatever <b>', 'brainfuck')).toEqual([{ text: 'whatever <b>' }])
    const code = 'SELECT id FROM users WHERE plan = \'pro\'; -- all'
    expect(
      highlight(code, 'sql')
        .map((t) => t.text)
        .join(''),
    ).toBe(code)
  })
})
