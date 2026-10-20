import type { CSSProperties } from 'react'
import { ArrowRightIcon } from '@/components/client'
import { Family } from '@/components/landing/family'
import { HERO_BUILD_SCRIPT } from '@/components/landing/hero-build'
import { HeroStage } from '@/components/landing/hero-stage'
import { InlineScript } from '@/components/inline-script'
import { HeroWord } from '@/components/landing/hero-word'
import { InstallField } from '@/components/landing/install-field'
import { TileElement } from '@/components/landing/tile-element'
import { ButtonLink } from '@/components/ui/button-link'
import type { MenuWave, Pillar } from '@/lib/nav'

/**
 * What Youj is, in one line and one picture: a release going out, as one card made of the parts Youj is, which the
 * scroll takes apart into those parts (HeroStage). The headline holds still from the first paint (it's the
 * largest); the lede rises into place. The stage pins on a sticky track, which an overflow-hidden
 * ancestor would break, so the section clips only sideways (clip, unlike hidden, makes no scroll container) and only
 * the glow layer clips both ways.
 */
export function Hero({ pillars, waves }: { pillars: Pillar[]; waves: MenuWave[] }) {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-x-clip">
      {/* A first visit: the card builds itself (hero-build.ts); this marks it before it paints. */}
      <InlineScript code={HERO_BUILD_SCRIPT} />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[64rem] overflow-hidden">
        <div
          aria-hidden
          className="blueprint absolute inset-x-0 top-0 -z-10 h-[44rem] [mask-image:radial-gradient(ellipse_62%_58%_at_50%_0%,black_30%,transparent_100%)]"
        />
      </div>

      <HeroStage
        waves={waves}
        family={<Family pillars={pillars} element={(id) => <TileElement id={id} waves={waves} />} />}
        copy={
          <div className="gutter flex flex-col items-center pt-20 text-center sm:pt-28 md:pt-32 hero-pin:pt-[max(clamp(3rem,11vh,8rem),calc(50dvh-24.5rem))]">
            {/* What Youj is: shown from the first paint, over the intro's veil too (styles/site.css), so a first visit knows
                what the card is building. It stays where it is when the intro hands over. */}
            <div className="ho-head flex w-full flex-col items-center">
              <h1 id="hero-title" className="type-display-xl max-w-[22ch] text-fg max-sm:w-full max-sm:max-w-none max-sm:text-[2.25rem]">
                <span className="block">Build something</span>
                {/* The rotating word on a line of its own, kept to one line so typing never wraps or reflows the title. */}
                <span className="block whitespace-nowrap">
                  <HeroWord />
                </span>
              </h1>
              <p style={{ '--i': 1 } as CSSProperties} className="hero-in type-lede mt-6 max-w-[40rem]">
                Components, blocks, icons, illustrations and themes for React. Accessible, animated and open source.
              </p>
            </div>
            {/* The way in: the docs' first page and the install command (held under the intro's veil until its handoff). */}
            <div className="ho-ctas w-full sm:w-auto">
              <div style={{ '--i': 2 } as CSSProperties} className="hero-in mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-center">
                <ButtonLink href="/docs/installation" size="lg" className="h-11 justify-center px-5">
                  Get started
                  <ArrowRightIcon size={16} strokeWidth={2} className="rtl:-scale-x-100" />
                </ButtonLink>
                <InstallField className="text-start sm:w-80" />
              </div>
            </div>
          </div>
        }
      />
    </section>
  )
}
