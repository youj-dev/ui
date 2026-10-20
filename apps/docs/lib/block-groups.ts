import cards from '@/content/docs/blocks/(cards)/meta.json'
import screens from '@/content/docs/blocks/(screens)/meta.json'
import sections from '@/content/docs/blocks/(sections)/meta.json'
import specialized from '@/content/docs/blocks/(specialized)/meta.json'

/* The Blocks docs groups and their pages, from each group's meta.json, so the
 * browser can tell a Blocks page's kind from its URL alone: ⌘K files
 * /docs/blocks/media under Cards, as it filed the cards' own pages. */

const PAGES = new Map<string, string>([cards, sections, screens, specialized].flatMap((group) => group.pages.map((page): [string, string] => [`/docs/blocks/${page}`, group.title])))

/** The Blocks group a docs page is in (`Cards`, `Sections`, `Screens`, `Specialized`), by its path; none for any other page. */
export const blockGroupOf = (path: string): string | undefined => PAGES.get(path)
