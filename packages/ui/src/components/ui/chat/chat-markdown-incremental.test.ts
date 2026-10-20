import { createBlockParser, parseBlocks } from './chat-markdown-parse'

/* Streaming must give what a full parse gives, at every step: the incremental
 * parser keeps finished blocks and re-parses only the open end. */

const SAMPLES = [
  '# Title\n\nA paragraph with **bold**, `code` and a [link](https://youj.io).\nSecond line.\n\n- one\n- two\n  - nested\n\n  continued para\n- three\n\n1. a\n2. b\n\n> quote\n> more\nlazy\n\n```ts\nconst x = 1\n\nconst y = 2\n```\n\n| a | b |\n|---|:-:|\n| 1 | 2 |\n| 3 | 4 |\n\n---\n\nTail text [1] and ~~gone~~ <b>raw</b> [bad](javascript:alert(1)).\n',
  'Intro\n- list right after\n- second\n\n\n\n```\nunclosed fence\n\n- not a list\n',
  'para\n|a|b|\n|-|-|\n|1|2|\n- x\n\n  y\n\n2. two\n1. one\n\n    indented\n\n\tTabbed\r\nCRLF line\r\n',
  '1. one\n\n   two\n\n2. three\n\n- a\n\n- b\n\n- c\n##\n#\n-\n``\n',
]

function lcg(seed: number) {
  let s = seed
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296
}

const ATOMS = ['a', 'word ', 'foo bar', '\n', '\n\n', '- ', '* ', '1. ', '2) ', '# ', '> ', '```', '~~~', '|', '| a | b |', '|---|---|', '---', '**', '*', '`', '[x](', 'https://youj.io', ')', '  ', '\t', '[1]', ':', '\n   ', '~~', '<i>']

function randomDoc(rand: () => number, parts: number) {
  let out = ''
  for (let i = 0; i < parts; i++) out += ATOMS[Math.floor(rand() * ATOMS.length)]
  return out
}

function checkStream(doc: string, chunk: (i: number) => number, streaming: boolean) {
  const parse = createBlockParser()
  for (let end = chunk(0); ; end += chunk(end)) {
    const text = doc.slice(0, Math.min(end, doc.length))
    expect(parse(text, streaming), JSON.stringify(text)).toEqual(parseBlocks(text, streaming))
    if (end >= doc.length) break
  }
}

describe('incremental parsing equals a full parse at every step', () => {
  test.each(SAMPLES.map((s, i) => [i, s] as const))('sample %i, character by character', (_, doc) => {
    checkStream(doc, () => 1, true)
    checkStream(doc, () => 1, false)
  })

  test('sample documents, in token-sized chunks', () => {
    const rand = lcg(7)
    for (const doc of SAMPLES) checkStream(doc, () => 1 + Math.floor(rand() * 6), true)
  })

  test('random markdown soup, token by token', () => {
    const rand = lcg(42)
    for (let n = 0; n < 150; n++) checkStream(randomDoc(rand, 10 + Math.floor(rand() * 50)), () => 1 + Math.floor(rand() * 3), rand() < 0.7)
  })

  test('text that is replaced or shortened is parsed afresh', () => {
    const parse = createBlockParser()
    for (const text of ['a\n\nb\n\nc\n\nd', 'x\n\ny', 'x\n\ny\n\nz\n\nw', 'q']) expect(parse(text, true)).toEqual(parseBlocks(text, true))
    expect(parse('q', false)).toEqual(parseBlocks('q', false))
  })
})

describe('work per token', () => {
  test('stays bounded however long the message gets', () => {
    const doc = Array.from({ length: 300 }, (_, i) => (i % 5 === 4 ? `- item ${i}\n- item ${i}b` : `Paragraph ${i} with **bold** and \`code\`.`)).join('\n\n')
    const scanned: number[] = []
    const parse = createBlockParser((lines) => scanned.push(lines))
    for (let end = 1; end <= doc.length; end += 3) parse(doc.slice(0, end), true)
    const window = (from: number, to: number) => Math.max(...scanned.slice(from, to))
    // The most lines any step scans, early on and late: the same.
    const early = window(100, 300)
    const late = window(scanned.length - 200, scanned.length)
    expect(late).toBeLessThanOrEqual(early + 1)
    expect(late).toBeLessThan(12)
  })
})
