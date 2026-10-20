/* Basic syntax highlighting for code blocks (CodeBlock, chat): a few sticky regular
 * expressions per language family, run left to right. It returns tokens
 * (text plus a kind), never HTML, and it is forgiving of code that is still
 * streaming: an unterminated string or comment runs to the end. Families:
 * JS/TS, C-like (Go, Rust, Java, C#, Swift, Kotlin, PHP), Python, Ruby,
 * shell, JSON, CSS, HTML/XML, SQL, YAML and diffs. Anything else is plain. */

export type CodeTokenKind = 'keyword' | 'string' | 'number' | 'comment' | 'function' | 'type' | 'property' | 'tag' | 'punctuation' | 'inserted' | 'deleted' | 'meta'

export interface CodeToken {
  text: string
  kind?: CodeTokenKind
}

type Rule = [RegExp, CodeTokenKind | undefined]

const words = (list: string, flags = 'y') => new RegExp(`(?:${list.trim().split(/\s+/).join('|')})(?![\\w$])`, flags)

const DOUBLE = /"(?:\\[\s\S]|[^"\\\n])*"?/y
const SINGLE = /'(?:\\[\s\S]|[^'\\\n])*'?/y
const BACKTICK = /`(?:\\[\s\S]|[^`\\])*`?/y
const NUMBER = /(?:0[xob][\da-f_]+|\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?)n?(?![\w$])/iy
const LINE_COMMENT = /\/\/[^\n]*/y
const BLOCK_COMMENT = /\/\*[\s\S]*?(?:\*\/|$)/y
const HASH_COMMENT = /#[^\n]*/y
const CALL = /[A-Za-z_$][\w$]*(?=\s*\()/y
const TYPE = /[A-Z][\w$]*/y
const IDENT = /[A-Za-z_$][\w$]*/y
const PUNCTUATION = /[{}[\]();,.:?<>=!+\-*/%&|^~@]+/y

const JS_KEYWORDS =
  'break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new return super switch this throw try typeof var void while with yield async await of static get set as from type interface enum implements declare readonly private protected public abstract namespace keyof satisfies'
const C_KEYWORDS =
  'auto break case catch char class const continue default defer do double else enum extern final float fn for func go goto if impl import in int interface let long match mod mut namespace new package private protected pub public return self Self short signed sizeof static struct super switch this throw throws trait try type typedef union unsigned use using var void volatile where while async await override virtual fun val when is as object companion guard extension protocol init string bool byte echo function'
const CONSTANTS = 'true false null undefined nil None NULL nullptr NaN Infinity'

const cLike = (keywords: string): Rule[] => [
  [LINE_COMMENT, 'comment'],
  [BLOCK_COMMENT, 'comment'],
  [BACKTICK, 'string'],
  [DOUBLE, 'string'],
  [SINGLE, 'string'],
  [words(CONSTANTS), 'number'],
  [words(keywords), 'keyword'],
  [NUMBER, 'number'],
  [CALL, 'function'],
  [TYPE, 'type'],
  [IDENT, undefined],
  [PUNCTUATION, 'punctuation'],
]

const GRAMMARS: Record<string, Rule[]> = {
  js: cLike(JS_KEYWORDS),
  c: cLike(C_KEYWORDS),
  python: [
    [HASH_COMMENT, 'comment'],
    [/[rbuf]{0,2}("""|''')[\s\S]*?(?:\1|$)/iy, 'string'],
    [/[rbuf]{0,2}(?:"(?:\\[\s\S]|[^"\\\n])*"?|'(?:\\[\s\S]|[^'\\\n])*'?)/iy, 'string'],
    [words('True False None'), 'number'],
    [
      words(
        'and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case self',
      ),
      'keyword',
    ],
    [/@[\w.]+/y, 'meta'],
    [NUMBER, 'number'],
    [CALL, 'function'],
    [TYPE, 'type'],
    [IDENT, undefined],
    [PUNCTUATION, 'punctuation'],
  ],
  ruby: [
    [HASH_COMMENT, 'comment'],
    [DOUBLE, 'string'],
    [SINGLE, 'string'],
    [/:[A-Za-z_]\w*/y, 'number'],
    [words('true false nil self'), 'number'],
    [
      words(
        'alias and begin break case class def defined do else elsif end ensure for if in module next not or redo rescue retry return super then undef unless until when while yield require attr_accessor attr_reader',
      ),
      'keyword',
    ],
    [NUMBER, 'number'],
    [CALL, 'function'],
    [TYPE, 'type'],
    [IDENT, undefined],
    [PUNCTUATION, 'punctuation'],
  ],
  shell: [
    [/(?:^|(?<=\s))#[^\n]*/y, 'comment'],
    [DOUBLE, 'string'],
    [SINGLE, 'string'],
    [/\$(?:\{[^}\n]*\}?|[\w@#?$!*-]+)/y, 'property'],
    [words('if then else elif fi for while until do done case esac function in return export local readonly unset source'), 'keyword'],
    // The command: first word on a line, or after a pipe, && or ;.
    [/(?:(?<=^)|(?<=\n)|(?<=[|;&]\s*)|(?<=^\$\s)|(?<=\n\$\s))[\w./-]+/y, 'function'],
    [/(?<=\s)--?[\w-]+/y, 'meta'],
    [NUMBER, 'number'],
    [/[\w./-]+/y, undefined],
    [/[|&;<>()=]+/y, 'punctuation'],
  ],
  json: [
    [LINE_COMMENT, 'comment'],
    [/"(?:\\[\s\S]|[^"\\\n])*"(?=\s*:)/y, 'property'],
    [DOUBLE, 'string'],
    [words('true false null'), 'number'],
    [/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/iy, 'number'],
    [/[{}[\],:]/y, 'punctuation'],
  ],
  css: [
    [BLOCK_COMMENT, 'comment'],
    [DOUBLE, 'string'],
    [SINGLE, 'string'],
    [/@[\w-]+/y, 'keyword'],
    [/--?[\w-]+(?=\s*:(?![\w-]))|[\w-]+(?=\s*:(?![\w-]))/y, 'property'],
    [/#[\da-f]{3,8}(?![\w-])/iy, 'number'],
    [/-?(?:\d+\.?\d*|\.\d+)(?:[a-z]+|%)?/iy, 'number'],
    [/[\w-]+(?=\()/y, 'function'],
    [/[.#]?[\w-]+/y, undefined],
    [/[{}();:,>+~*[\]=]+/y, 'punctuation'],
  ],
  html: [
    [/<!--[\s\S]*?(?:-->|$)/y, 'comment'],
    [/<\/?[A-Za-z][\w:-]*/y, 'tag'],
    [/\/?>/y, 'tag'],
    [/[A-Za-z_:@][\w:.-]*(?==)/y, 'property'],
    [DOUBLE, 'string'],
    [SINGLE, 'string'],
  ],
  sql: [
    [/--[^\n]*/y, 'comment'],
    [BLOCK_COMMENT, 'comment'],
    [SINGLE, 'string'],
    [DOUBLE, 'string'],
    [
      words(
        'select from where and or not insert into values update set delete create table index view drop alter add column primary key foreign references join left right inner outer full on group by order having limit offset as distinct union all case when then else end is in exists like between default returning with asc desc count sum avg min max',
        'iy',
      ),
      'keyword',
    ],
    [words('null true false', 'iy'), 'number'],
    [NUMBER, 'number'],
    [/[A-Za-z_][\w$]*/y, undefined],
    [/[(),;.=<>*+-]+/y, 'punctuation'],
  ],
  yaml: [
    [/(?:(?<=^)|(?<=\s))#[^\n]*/y, 'comment'],
    [/[\w.-]+(?=\s*:(?:\s|$))/y, 'property'],
    [DOUBLE, 'string'],
    [SINGLE, 'string'],
    [words('true false yes no null on off', 'iy'), 'number'],
    [/-?\d+(?:\.\d+)?(?![\w.])/y, 'number'],
    [/[\w./-]+/y, undefined],
    [/[:\-[\]{},|>&*!]+/y, 'punctuation'],
  ],
  diff: [
    [/(?:(?<=^)|(?<=\n))\+[^\n]*/y, 'inserted'],
    [/(?:(?<=^)|(?<=\n))-[^\n]*/y, 'deleted'],
    [/(?:(?<=^)|(?<=\n))@@[^\n]*/y, 'meta'],
  ],
}

const ALIASES: Record<string, keyof typeof GRAMMARS> = {
  js: 'js',
  javascript: 'js',
  jsx: 'js',
  ts: 'js',
  typescript: 'js',
  tsx: 'js',
  mjs: 'js',
  cjs: 'js',
  c: 'c',
  h: 'c',
  cpp: 'c',
  'c++': 'c',
  cs: 'c',
  csharp: 'c',
  java: 'c',
  kotlin: 'c',
  kt: 'c',
  swift: 'c',
  go: 'c',
  golang: 'c',
  rust: 'c',
  rs: 'c',
  php: 'c',
  dart: 'c',
  scala: 'c',
  py: 'python',
  python: 'python',
  rb: 'ruby',
  ruby: 'ruby',
  sh: 'shell',
  bash: 'shell',
  shell: 'shell',
  zsh: 'shell',
  console: 'shell',
  terminal: 'shell',
  json: 'json',
  jsonc: 'json',
  css: 'css',
  scss: 'css',
  less: 'css',
  html: 'html',
  xml: 'html',
  svg: 'html',
  vue: 'html',
  sql: 'sql',
  yaml: 'yaml',
  yml: 'yaml',
  diff: 'diff',
  patch: 'diff',
}

/** Splits code into highlighted tokens. Unknown languages come back as one plain token. */
export function highlight(code: string, lang: string): CodeToken[] {
  const rules = GRAMMARS[ALIASES[lang.toLowerCase()] ?? '']
  if (!rules) return [{ text: code }]
  const tokens: CodeToken[] = []
  let plain = ''
  const flush = () => {
    if (plain) tokens.push({ text: plain })
    plain = ''
  }
  let i = 0
  scan: while (i < code.length) {
    for (const [pattern, kind] of rules) {
      pattern.lastIndex = i
      const match = pattern.exec(code)
      if (!match || match[0].length === 0) continue
      if (kind) {
        flush()
        tokens.push({ text: match[0], kind })
      } else plain += match[0]
      i += match[0].length
      continue scan
    }
    plain += code[i]
    i++
  }
  flush()
  return tokens
}
