import { parseCsv, sniffDelimiter, toCsv } from './import-mapper-csv'

describe('CSV reader', () => {
  test('reads a header and rows, with a trailing newline adding no empty row', () => {
    const parsed = parseCsv('name,email\nAda,ada@example.com\nGrace,grace@example.com\n')
    expect(parsed.headers).toEqual(['name', 'email'])
    expect(parsed.rows).toEqual([
      ['Ada', 'ada@example.com'],
      ['Grace', 'grace@example.com'],
    ])
    expect(parsed.problems).toEqual([])
  })

  test('quoted values keep the delimiter, line breaks and doubled quotes', () => {
    const parsed = parseCsv('name,note\n"Lane, Hart","said ""hi""\nthen left"\nplain,x\n')
    expect(parsed.rows).toEqual([
      ['Lane, Hart', 'said "hi"\nthen left'],
      ['plain', 'x'],
    ])
    // The second record starts on the line after the break inside the first.
    expect(parsed.lines).toEqual([2, 4])
  })

  test('reads CRLF, bare CR and LF line endings alike', () => {
    for (const eol of ['\r\n', '\r', '\n'])
      expect(parseCsv(`a,b${eol}1,2${eol}3,4`).rows).toEqual([
        ['1', '2'],
        ['3', '4'],
      ])
  })

  test('drops a byte-order mark and skips blank lines', () => {
    const parsed = parseCsv('﻿name,email\r\n\r\nAda,a@x.io\r\n\r\n')
    expect(parsed.headers).toEqual(['name', 'email'])
    expect(parsed.rows).toEqual([['Ada', 'a@x.io']])
  })

  test('keeps empty values and a final value without a newline', () => {
    expect(parseCsv('a,b,c\n1,,3\n,,').rows).toEqual([
      ['1', '', '3'],
      ['', '', ''],
    ])
  })

  test('finds the delimiter: comma, semicolon or tab', () => {
    expect(sniffDelimiter('a,b,c\n1,2,3')).toBe(',')
    expect(sniffDelimiter('a;b;c\n1;2;3')).toBe(';')
    expect(sniffDelimiter('a\tb\tc\n1\t2\t3')).toBe('\t')
    // Commas inside quotes and decimals don't outvote the real delimiter.
    expect(sniffDelimiter('name;price\n"Lane, Hart";1,50\nx;2,25')).toBe(';')
    expect(parseCsv('name;price\nAda;1,50').rows).toEqual([['Ada', '1,50']])
  })

  test('reports an unclosed quote at the line it opened on, and still reads what it can', () => {
    const parsed = parseCsv('a,b\n1,2\n3,"oops\n4,5\n')
    expect(parsed.problems).toContainEqual({ kind: 'unclosed-quote', line: 3 })
    expect(parsed.rows[0]).toEqual(['1', '2'])
  })

  test('pads a short row, cuts a long one and reports both', () => {
    const parsed = parseCsv('a,b,c\n1,2\n1,2,3,4\n')
    expect(parsed.rows).toEqual([
      ['1', '2', ''],
      ['1', '2', '3'],
    ])
    expect(parsed.problems).toEqual([
      { kind: 'ragged', line: 2, found: 2, expected: 3 },
      { kind: 'ragged', line: 3, found: 4, expected: 3 },
    ])
  })

  test('writes values back, quoting only where needed', () => {
    const text = toCsv([['a', 'b,c', 'say "x"', 'two\nlines']])
    expect(text).toBe('a,"b,c","say ""x""","two\nlines"\r\n')
    expect(parseCsv(text, ',').headers).toEqual(['a', 'b,c', 'say "x"', 'two\nlines'])
  })
})
