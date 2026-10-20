/* Every page the site has, for the header to tell a real page from the 404
 * (components/site/site-header.tsx), in every page's payload. By folder, so
 * the stems the URLs share are written once: `{ '/docs/components': ['button', …] }`. */

export type PageIndex = Record<string, string[]>

export function pageIndex(urls: string[]): PageIndex {
  const index: PageIndex = {}
  for (const url of urls) {
    const cut = url.lastIndexOf('/')
    ;(index[url.slice(0, cut)] ??= []).push(url.slice(cut + 1))
  }
  return index
}

export function hasPage(index: PageIndex, url: string): boolean {
  const cut = url.lastIndexOf('/')
  return index[url.slice(0, cut)]?.includes(url.slice(cut + 1)) ?? false
}
