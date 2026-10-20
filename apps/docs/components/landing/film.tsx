import { LoopVideo } from "@/components/landing/loop-video-on-view";
import type { HomeFilm } from "@/components/landing/promo-video";

/**
 * The homepage's film, made for this section in apps/promo and rendered once
 * per scheme: it plays the cut that matches the page and follows a theme
 * switch mid-play without a flash. Its first frame is its poster, painted
 * first and all that shows under reduced motion or Save-Data. It is silent
 * and has no narration, so it is one image to assistive technology, named by
 * what it shows, with a pause button.
 */
export function Film({ film }: { film: HomeFilm }) {
  return (
    <div className="site-card rounded-2xl p-[3px] shadow-lg">
      <div className="relative aspect-video overflow-hidden rounded-[calc(var(--radius-2xl)-3px)] bg-canvas">
        <LoopVideo
          title={film.title}
          dark={film.dark}
          light={film.light}
          controls
          sizes="(min-width: 1200px) 1136px, calc(100vw - 2.5rem)"
          className="absolute inset-0"
        />
      </div>
    </div>
  );
}
