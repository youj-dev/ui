import { InlineScript } from '@/components/inline-script'

/**
 * Cloudflare Web Analytics: only in the static (Cloudflare) build, and only when NEXT_PUBLIC_CF_ANALYTICS_TOKEN is set. The token is the site's public beacon id, not a secret.
 * The beacon loads once the page is shown: a page the browser prerendered (components/site/intent-link.tsx) and never opened isn't a visit.
 */
export function CloudflareAnalytics() {
  const token = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN
  if (process.env.YOUJ_STATIC_EXPORT !== '1' || !token) return null
  const beacon = JSON.stringify(JSON.stringify({ token }))
  const js =
    "(function(){function l(){var s=document.createElement('script');s.defer=true;s.src='https://static.cloudflareinsights.com/beacon.min.js';" +
    `s.setAttribute('data-cf-beacon',${beacon});document.body.appendChild(s)}` +
    "document.prerendering?document.addEventListener('prerenderingchange',l,{once:true}):l()})()"
  return <InlineScript code={js.replace(/</g, '\\u003c')} />
}
