const ESCAPED: Record<string, string> = { '\\': '\\\\', '"': '\\"', "'": "\\'" }

/** The text of a script string literal in either quote: escaped so it can't end the string, the script (`</script>`) or a line. */
const literal = (value: string) => value.replace(/[\\"'<\p{Cc}\u2028\u2029]/gu, (c) => ESCAPED[c] ?? `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)

/**
 * A script for a page that is static (the server can't read the address): when `?param=` names anything but the
 * flagship, it marks the document with `attr` before first paint, so the page can hide the flagship's words until the
 * browser has drawn the one the link names.
 */
export const linkScript = (param: string, flagship: string, attr: string) =>
  `(function(){try{var s=new URLSearchParams(location.search).get('${literal(param)}');if(s&&s!=="${literal(flagship)}")document.documentElement.setAttribute('${literal(attr)}','')}catch(e){}})()`
