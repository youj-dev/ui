import { Explore } from '@/components/landing/explore/explore'
import { Hero } from '@/components/landing/hero'
import { Start } from '@/components/landing/start'
import { SiteFooter } from '@/components/site/site-footer'
import { catalog } from '@/lib/catalog'
import { KIT_INSTALL, siteNav, soundWaves, startLinks } from '@/lib/nav'

/* The homepage, one message per section: what Youj is (the product, which
 * comes apart into the eight parts it's made of); twenty of its pieces to try, live; and
 * how to start, whole, piece by piece or from a whole page. */
export default function Home() {
  const nav = siteNav()
  const counts = catalog()
  const ui = nav.pillars.find((p) => p.id === 'ui')
  const blocks = nav.pillars.find((p) => p.id === 'blocks')

  return (
    <>
      <main id="main" data-landing="" className="flex-1">
          <div className="frame">
            <Hero pillars={nav.pillars} waves={soundWaves()} />
            <Explore />
            <Start install={KIT_INSTALL} componentsUrl={ui?.url ?? '/docs'} screensUrl={blocks?.url ?? '/docs'} counts={counts} />
          </div>
      </main>
      <SiteFooter nav={nav} start={startLinks()} framed />
    </>
  )
}
