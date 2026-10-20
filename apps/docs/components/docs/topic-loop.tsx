import { LoopVideo } from '@/components/landing/loop-video'
import { readLoops, type TopicId } from '@/components/landing/promo-video'
import { Stage } from '@/components/site/stage'

/**
 * A section's loop from apps/promo, as the hero of its overview: the full
 * column width, straight under the page title. The loops are dark whatever
 * the page's scheme. Nothing without one.
 */
export function TopicLoop({ topic }: { topic: TopicId }) {
  const loop = readLoops()[topic]
  if (!loop?.wide) return null
  return (
    <Stage mode="dark" className="not-prose mb-10 aspect-video w-full overflow-hidden rounded-2xl border border-line bg-canvas text-fg shadow-lg">
      <LoopVideo title={loop.title} dark={loop.wide} sizes="(min-width: 48rem) 48rem, 100vw" controls />
    </Stage>
  )
}
