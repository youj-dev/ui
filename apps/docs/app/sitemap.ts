import type { MetadataRoute } from 'next'
import { siteUrls } from '@/lib/nav'
import { siteUrl } from '@/lib/site'

export const revalidate = false

/* The public pages: the header's URLs plus the standalone pages. With the
 * stealth gate on, /sitemap.xml gets the same 401 as every other machine
 * endpoint and /robots.txt disallows everything, so this indexes nothing
 * until launch. */
const STANDALONE = ['/about', '/faq', '/roadmap', '/changelog', '/security']

export default function sitemap(): MetadataRoute.Sitemap {
  const site = siteUrl()
  return [...new Set([...siteUrls(), ...STANDALONE])].map((url) => ({ url: `${site}${url === '/' ? '' : url}` }))
}
