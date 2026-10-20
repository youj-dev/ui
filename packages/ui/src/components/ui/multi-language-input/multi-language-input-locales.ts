import type { CSSProperties } from 'react'

/* What the component knows about a locale, from its BCP 47 tag alone:
 * names from Intl.DisplayNames (in the interface's language, and the
 * language's own name), the script and likely region from Intl.Locale's
 * maximize(), the direction from the script, and a group for the picker.
 * Nothing here reads the runtime's default locale, so a server and a browser
 * describe a locale the same way. */

/** A language the content is written in. */
interface Locale {
  /** Its BCP 47 tag: 'en', 'fr', 'pt-BR', 'zh-Hans'. */
  code: string
  /** Its name in the interface's language. Default: from Intl.DisplayNames ('German', 'Portuguese (Brazil)'). */
  label?: string
  /** An emoji flag, shown small in the picker. Flags stand for countries, not languages, so the name and code always lead. */
  flag?: string
  /** The picker group it's listed under. Default: its region, or its script with `groupBy="script"`. */
  group?: string
}

type LocaleInput = string | Locale

interface LocaleInfo {
  code: string
  /** Its name in the interface's language: 'German'. */
  label: string
  /** Its language's name in that language, without the region: 'Português' for pt-BR. */
  native: string
  /** Its full name in its own language: 'Português (Brasil)'. */
  autonym: string
  flag?: string
  dir: 'ltr' | 'rtl'
  /** The ISO 15924 script it's written in: 'Latn', 'Arab', 'Jpan'. */
  script: string
  /** The region it's most used in: 'DE'. */
  region?: string
  /** An explicit picker group, from the Locale. */
  group?: string
}

const RTL_SCRIPTS = new Set(['Arab', 'Hebr', 'Thaa', 'Syrc', 'Nkoo', 'Adlm', 'Rohg', 'Mand', 'Samr'])
const CJK_SCRIPTS = new Set(['Jpan', 'Hans', 'Hant', 'Hani', 'Kore', 'Hira', 'Kana', 'Hang'])
/* Scripts whose marks reach far above and below the line (Indic conjuncts,
 * Thai tone marks, Arabic vowel signs) get taller lines and a larger size. */
const TALL_SCRIPTS = new Set(['Deva', 'Beng', 'Guru', 'Gujr', 'Orya', 'Taml', 'Telu', 'Knda', 'Mlym', 'Sinh', 'Thai', 'Laoo', 'Khmr', 'Mymr', 'Tibt', 'Arab'])

/* Last-resort families per script, after the theme's own stack. With `lang`
 * set on every control, browsers already pick the right system font for
 * each script (and the right Han glyphs for Japanese against Chinese); these
 * name the usual ones where a platform's generic fallback doesn't. */
const SCRIPT_FONTS: Record<string, string> = {
  Jpan: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic UI", Meiryo, "Noto Sans JP"',
  Hans: '"PingFang SC", "Microsoft YaHei", "Noto Sans SC"',
  Hant: '"PingFang TC", "Microsoft JhengHei", "Noto Sans TC"',
  Kore: '"Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR"',
  Deva: '"Kohinoor Devanagari", "Nirmala UI", "Noto Sans Devanagari"',
  Arab: '"SF Arabic", "Geeza Pro", "Segoe UI", "Noto Sans Arabic"',
  Hebr: '"SF Hebrew", "Arial Hebrew", "Segoe UI", "Noto Sans Hebrew"',
  Thai: 'Thonburi, "Leelawadee UI", "Noto Sans Thai"',
}

const names = new Map<string, Intl.DisplayNames | null>()
function displayNames(locale: string, type: 'language' | 'script'): Intl.DisplayNames | null {
  const key = `${type}:${locale}`
  if (!names.has(key)) {
    try {
      names.set(key, new Intl.DisplayNames([locale], { type, languageDisplay: 'standard', fallback: 'none' }))
    } catch {
      names.set(key, null)
    }
  }
  return names.get(key)!
}

function nameOf(code: string, displayLocale: string): string | undefined {
  try {
    return displayNames(displayLocale, 'language')?.of(code)
  } catch {
    return undefined
  }
}

const upperFirst = (text: string) => text.charAt(0).toLocaleUpperCase() + text.slice(1)

const described = new Map<string, LocaleInfo>()

/** Everything the component shows about a locale, named in `displayLocale`. */
function describeLocale(input: LocaleInput, displayLocale: string): LocaleInfo {
  const locale = typeof input === 'string' ? { code: input } : input
  const key = `${displayLocale}|${locale.code}|${locale.label ?? ''}|${locale.flag ?? ''}|${locale.group ?? ''}`
  const cached = described.get(key)
  if (cached) return cached
  let script = 'Latn'
  let region: string | undefined
  let language = locale.code
  try {
    const max = new Intl.Locale(locale.code).maximize()
    script = max.script ?? script
    region = max.region
    language = max.language
  } catch {
    // Not a valid tag: described by its code alone.
  }
  const label = locale.label ?? nameOf(locale.code, displayLocale) ?? locale.code
  // Own names, capitalized as a heading would be ("français" → "Français").
  const autonym = upperFirst(nameOf(locale.code, locale.code) ?? label)
  const native = upperFirst(nameOf(language, locale.code) ?? autonym)
  const info: LocaleInfo = {
    code: locale.code,
    label,
    native,
    autonym,
    flag: locale.flag,
    dir: RTL_SCRIPTS.has(script) ? 'rtl' : 'ltr',
    script,
    region,
    group: locale.group,
  }
  described.set(key, info)
  return info
}

/** Type that suits the script: a step up for CJK and scripts with tall marks, taller lines for the latter, and fallback families. */
function scriptTypography(script: string): { className?: string; style?: CSSProperties } {
  const fonts = SCRIPT_FONTS[script]
  const style = fonts ? { fontFamily: `var(--font-sans), ${fonts}, sans-serif` } : undefined
  if (CJK_SCRIPTS.has(script)) return { className: 'text-ui-lg', style }
  if (TALL_SCRIPTS.has(script)) return { className: 'text-ui-lg leading-6', style }
  return { style }
}

const segmenters = new Map<string, Intl.Segmenter | null>()

/** Characters as a reader counts them (grapheme clusters: an emoji or an accented letter is one). */
function countCharacters(text: string, locale: string): number {
  if (!text) return 0
  if (!segmenters.has(locale)) {
    try {
      segmenters.set(locale, new Intl.Segmenter(locale, { granularity: 'grapheme' }))
    } catch {
      segmenters.set(locale, null)
    }
  }
  const segmenter = segmenters.get(locale)
  if (!segmenter) return [...text].length
  let count = 0
  for (const _ of segmenter.segment(text)) count++
  return count
}

export { countCharacters, describeLocale, displayNames, scriptTypography }
export type { Locale, LocaleInfo, LocaleInput }
