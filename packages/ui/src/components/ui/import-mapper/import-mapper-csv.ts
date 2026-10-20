/* A small RFC 4180 reader and writer, so the component needs no CSV library:
 * quoted values may hold the delimiter, line breaks and doubled quotes; lines
 * end in LF, CRLF or CR; a leading byte-order mark is dropped; blank lines are
 * skipped; and the delimiter (comma, semicolon or tab) is sniffed from the
 * first lines. Nothing here throws: what looks wrong comes back as `problems`
 * and the rest is still read. */

export type Delimiter = ',' | ';' | '\t'

export type CsvProblem = { kind: 'unclosed-quote'; line: number } | { kind: 'ragged'; line: number; found: number; expected: number }

export interface ParsedCsv {
  delimiter: Delimiter
  headers: string[]
  /** Data rows, each padded or cut to the header's width. */
  rows: string[][]
  /** The file line each data row starts on (1-based), for messages. */
  lines: number[]
  problems: CsvProblem[]
}

const DELIMITERS: Delimiter[] = [',', ';', '\t']

/** Records as they stand, with the line each starts on. `limit` stops early (for sniffing). */
function records(text: string, delimiter: Delimiter, limit = Infinity) {
  const out: string[][] = []
  const lines: number[] = []
  let unclosed: number | null = null
  let record: string[] = []
  let field = ''
  let quoted = false
  let line = 1
  let start = 1
  let touched = false

  const endField = () => {
    record.push(field)
    field = ''
  }
  const endRecord = () => {
    endField()
    // A blank line is one empty field: skip it.
    if (record.length > 1 || record[0] !== '') {
      out.push(record)
      lines.push(start)
    }
    record = []
    touched = false
  }

  for (let i = 0; i < text.length && out.length < limit; i++) {
    const c = text[i]!
    if (!touched) {
      start = line
      touched = true
    }
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else {
        if (c === '\n') line++
        else if (c === '\r' && text[i + 1] !== '\n') line++
        field += c
      }
    } else if (c === '"' && field === '') {
      quoted = true
    } else if (c === delimiter) {
      endField()
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      line++
      endRecord()
    } else {
      field += c
    }
  }
  if (quoted) unclosed = start
  if (out.length < limit && (touched || field !== '' || record.length)) endRecord()
  return { out, lines, unclosed }
}

/** The delimiter that splits the first lines most evenly: the same width on every line beats a wider header. */
export function sniffDelimiter(text: string): Delimiter {
  const body = text.replace(/^﻿/, '')
  let best: Delimiter = ','
  let bestScore = -1
  for (const delimiter of DELIMITERS) {
    const sample = records(body, delimiter, 6).out
    const width = sample[0]?.length ?? 0
    if (width < 2) continue
    const score = (sample.every((r) => r.length === width) ? 1000 : 0) + width
    if (score > bestScore) {
      best = delimiter
      bestScore = score
    }
  }
  return best
}

/** Reads CSV text. The first record is the header; ragged rows are padded or cut and reported. */
export function parseCsv(text: string, delimiter?: Delimiter): ParsedCsv {
  const body = text.replace(/^﻿/, '')
  const used = delimiter ?? sniffDelimiter(body)
  const { out, lines, unclosed } = records(body, used)
  const problems: CsvProblem[] = []
  if (unclosed !== null) problems.push({ kind: 'unclosed-quote', line: unclosed })
  const headers = (out[0] ?? []).map((h) => h.trim())
  const rows: string[][] = []
  const rowLines: number[] = []
  out.slice(1).forEach((record, i) => {
    if (record.length !== headers.length) problems.push({ kind: 'ragged', line: lines[i + 1]!, found: record.length, expected: headers.length })
    rows.push(headers.map((_, c) => record[c] ?? ''))
    rowLines.push(lines[i + 1]!)
  })
  return { delimiter: used, headers, rows, lines: rowLines, problems }
}

/** CSV text from rows: a value is quoted when it holds the delimiter, a quote or a line break. Lines end in CRLF. */
export function toCsv(rows: readonly (readonly string[])[], delimiter: Delimiter = ','): string {
  const cell = (value: string) => (value.includes(delimiter) || /["\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value)
  return rows.map((row) => row.map(cell).join(delimiter)).join('\r\n') + '\r\n'
}
