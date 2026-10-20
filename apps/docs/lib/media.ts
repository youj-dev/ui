import media from './media.json'
import { mediaUrl } from './media-url'

/* What scripts/media-upload.ts put on R2, committed as lib/media.json: builds trust it and never ask the network.
 *   files     a promo file's name (`home-film.mp4`) → its content-addressed key (`promo/home-film.1a2b3c4d5e.mp4`) */
export interface Media {
  files: Record<string, string>
}

/** The media-host URL of a promo file given as `/promo/<name>` or `<name>`; undefined when it isn't on R2. */
export function promoUrl(path: string, files: Media['files'] = media.files, base?: string): string | undefined {
  const key = files[path.replace(/^\/promo\//, '')]
  return key ? mediaUrl(key, base) : undefined
}
