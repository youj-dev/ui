import { Film } from '@/components/landing/film'
import { readHomeFilm } from '@/components/landing/promo-video'

/** The homepage's film, on the Introduction: the whole kit moving, in one picture. */
export function IntroFilm() {
  const film = readHomeFilm()
  if (!film) return null
  return (
    <div className="not-prose my-8">
      <Film film={film} />
    </div>
  )
}
