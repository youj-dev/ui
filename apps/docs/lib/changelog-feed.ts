import { plainText, readChangelog, type Changelog } from './changelog'
import { siteUrl } from './site'

/* /changelog.xml: RSS 2.0, one item per release. Unreleased work stays out of
 * it, and a release without a date in CHANGELOG.md goes out without one:
 * RSS makes the date optional, so the feed never invents it. */

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function changelogFeed(changelog: Changelog = readChangelog(), site = siteUrl()): string {
  const items = changelog.releases
    .filter((r) => !r.unreleased)
    .map((r) => {
      const link = `${site}/changelog#${r.id}`
      const text = r.sections.map((s) => `${s.kind === 'breaking' ? 'Breaking: ' : ''}${s.title ? `${s.title}\n` : ''}${plainText(s.body)}`).join('\n\n')
      return [
        '    <item>',
        `      <title>${escape(`Youj ${r.version}`)}</title>`,
        `      <link>${link}</link>`,
        `      <guid isPermaLink="true">${link}</guid>`,
        r.date ? `      <pubDate>${new Date(`${r.date}T00:00:00Z`).toUTCString()}</pubDate>` : '',
        `      <description>${escape(plainText(r.intro ? `${r.intro}\n\n${text}` : text))}</description>`,
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n')
    })
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    '    <title>Youj releases</title>',
    `    <link>${site}/changelog</link>`,
    `    <atom:link href="${site}/changelog.xml" rel="self" type="application/rss+xml" />`,
    '    <description>Releases of the Youj packages: components, motion, icons, illustrations and themes.</description>',
    '    <language>en</language>',
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')
}
