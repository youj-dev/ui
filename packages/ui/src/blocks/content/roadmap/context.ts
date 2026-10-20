import { createContext, useContext } from 'react'
import { useLocale } from '@youj/core'
import { CATEGORIES, ME, ROADMAP_COPY, TODAY, type RoadmapCopy } from './data'

/** What every part of the board reads: its words, its areas, the reader and the day. */
interface RoadmapSettings {
  copy: RoadmapCopy
  categories: Record<string, string>
  locale: string
  /** The signed-in reader's name. */
  viewer: string
  /** Today, as YYYY-MM-DD. */
  today: string
}

const RoadmapContext = createContext<RoadmapSettings | null>(null)

/** The board's settings; outside it, the defaults in the app's locale. */
const useRoadmap = () => {
  const around = useContext(RoadmapContext)
  const locale = useLocale()
  return around ?? { copy: ROADMAP_COPY, categories: CATEGORIES, locale, viewer: ME, today: TODAY }
}

export { RoadmapContext, useRoadmap }
export type { RoadmapSettings }
