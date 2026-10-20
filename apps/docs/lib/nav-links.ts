/* A menu column's links, kept small because every page carries the menus in
 * its payload: a link is `[title, slug]` and its URL is its column's URL and
 * its slug (`/docs/components` + `button`). Plain data and plain functions, so the
 * client's menus read it without the server's navigation model. */

export interface ColumnLinks {
  /** The column's own page: `/docs/components`. */
  url: string
  links: readonly (readonly [title: string, slug: string])[]
}

/** A column's links as the menus draw them: a title and a URL. */
export function columnLinks(column: ColumnLinks): { title: string; url: string }[] {
  return column.links.map(([title, slug]) => ({ title, url: `${column.url}/${slug}` }))
}
