/* The last few pages opened from the palette, kept in this browser only, and listed first when nothing is typed. */
const RECENT_KEY = 'youj:search-recent'
export interface Recent {
  url: string
  title: string
}

export function readRecent(): Recent[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
    if (!Array.isArray(stored)) return []
    return stored
      .filter((r): r is Recent => typeof r?.url === 'string' && r.url.startsWith('/') && !r.url.startsWith('//') && typeof r?.title === 'string')
      .slice(0, 4)
  } catch {
    return []
  }
}

export function remember(recent: Recent) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify([recent, ...readRecent().filter((r) => r.url !== recent.url)].slice(0, 4)))
  } catch {}
}
