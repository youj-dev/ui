import { Fragment, type CSSProperties, type ReactNode } from 'react'

/* TSX highlighting in the browser for the code Create writes, in the site's
 * code tokens (styles/theme.css) and the markup Fumadocs' shiki.css styles,
 * so it reads exactly like the server-highlighted code beside it. A small
 * tokenizer, not a grammar: the files are ours and well formed, and a full
 * highlighter would be all weight for this. */

const TOKEN = new RegExp(
  [
    String.raw`(?<comment>\/\*[\s\S]*?\*\/|\/\/[^\n]*)`,
    String.raw`(?<string>\x60(?:[^\x60\\]|\\.)*\x60|'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")`,
    String.raw`(?<tag>(?<![\w)\]])<\/?[A-Za-z][\w.]*)`,
    String.raw`(?<keyword>\b(?:import|from|export|default|function|return|const|let|var|type|interface|extends|if|else|for|of|in|new|typeof|keyof|as|async|await|true|false|null|undefined|void|satisfies|readonly|throw)\b)`,
    String.raw`(?<number>\b\d+(?:\.\d+)?\b)`,
    String.raw`(?<property>[A-Za-z_$][\w$-]*(?=\??:[^:])|[A-Za-z_$][\w$-]*(?==[^=>]))`,
    String.raw`(?<call>[A-Za-z_$][\w$]*(?=\())`,
    String.raw`(?<type>\b[A-Z][\w$]*\b)`,
    String.raw`(?<punct>[{}()[\];,.<>/=+\-*!?:&|%^~]+)`,
  ].join('|'),
  'g',
)

const COLOR: Record<string, string> = {
  comment: 'var(--code-comment)',
  string: 'var(--code-string)',
  keyword: 'var(--code-keyword)',
  number: 'var(--code-number)',
  property: 'var(--code-property)',
  call: 'var(--code-function)',
  type: 'var(--code-type)',
  punct: 'var(--code-punctuation)',
}

type Piece = { text: string; color?: string }

function tokens(code: string): Piece[] {
  const out: Piece[] = []
  let last = 0
  for (const m of code.matchAll(TOKEN)) {
    if (m.index > last) out.push({ text: code.slice(last, m.index) })
    const groups = m.groups ?? {}
    const kind = Object.keys(COLOR).find((k) => groups[k] !== undefined) ?? (groups.tag !== undefined ? 'tag' : undefined)
    if (kind === 'tag') {
      // `<` and `</` as punctuation, the name as a type.
      const open = m[0].startsWith('</') ? 2 : 1
      out.push({ text: m[0].slice(0, open), color: COLOR.punct }, { text: m[0].slice(open), color: COLOR.type })
    } else out.push({ text: m[0], color: kind ? COLOR[kind] : undefined })
    last = m.index + m[0].length
  }
  if (last < code.length) out.push({ text: code.slice(last) })
  return out
}

/** Pieces grouped into lines, splitting any piece (a comment, a template) that spans several. */
export function lines(code: string): Piece[][] {
  const rows: Piece[][] = [[]]
  for (const piece of tokens(code)) {
    piece.text.split('\n').forEach((text, i) => {
      if (i > 0) rows.push([])
      if (text) rows[rows.length - 1]!.push({ text, color: piece.color })
    })
  }
  return rows
}

const vars = (color: string) => ({ '--shiki-light': color, '--shiki-dark': color }) as CSSProperties

/** `code` as the same markup the server's shiki pass renders. */
export function highlightTsx(code: string): ReactNode {
  const rows = lines(code.replace(/\n$/, ''))
  return (
    <pre className="shiki" style={{ ...vars('var(--code-fg)'), '--shiki-light-bg': 'var(--code-bg)', '--shiki-dark-bg': 'var(--code-bg)' } as CSSProperties}>
      <code>
        {rows.map((row, i) => (
          <Fragment key={i}>
            <span className="line">
              {row.map((piece, j) =>
                piece.color ? (
                  <span key={j} style={vars(piece.color)}>
                    {piece.text}
                  </span>
                ) : (
                  <Fragment key={j}>{piece.text}</Fragment>
                ),
              )}
            </span>
            {i < rows.length - 1 ? '\n' : null}
          </Fragment>
        ))}
      </code>
    </pre>
  )
}
