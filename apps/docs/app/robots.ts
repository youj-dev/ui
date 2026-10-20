import type { MetadataRoute } from 'next'
import { stealthConfig } from '@/lib/stealth'
import { siteUrl } from '@/lib/site'

export const dynamic = 'force-static'

/* Behind the stealth gate nothing is indexed (the gate also answers /robots.txt itself, ahead of this);
 * once it's off, everything is open and the sitemap is announced. */
export default function robots(): MetadataRoute.Robots {
  if (stealthConfig()) return { rules: { userAgent: '*', disallow: '/' } }
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${siteUrl()}/sitemap.xml` }
}
