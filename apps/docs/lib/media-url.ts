/* Where the site's media (promo videos and posters) is served from: the R2 bucket's custom
 * domain. Client-safe; lib/media.ts holds what's on it. */
export const MEDIA_URL = (process.env.NEXT_PUBLIC_MEDIA_URL || 'https://media.youj.dev').replace(/\/$/, '')

/** The URL of an object key on the media host. */
export const mediaUrl = (key: string, base: string = MEDIA_URL) => `${base}/${key}`
