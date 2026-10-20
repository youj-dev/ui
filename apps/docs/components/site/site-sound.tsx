'use client'

import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { YoujProvider, type SoundRuntime, type YoujProviderProps } from '@youj/core'
import { useSiteSound } from '@/lib/site-sound'

/* The site's sound is off until the visitor turns it on (lib/site-sound).
 * Then the Beacon pack, @youj/sound and its player are fetched, in a chunk of
 * their own, and given to the provider as its `sound`; nothing sound-related
 * is in a page's load before that. The toggle is the provider's mute from then
 * on, so turning sound on or off never remounts the page. */
export function SiteSound({ children, ...provider }: { children: ReactNode } & Omit<YoujProviderProps, 'sound'>) {
  const on = useSiteSound()
  const [loaded, setLoaded] = useState<{ pack: SoundRuntime; Answer: ComponentType } | null>(null)
  useEffect(() => {
    if (!on || loaded) return
    let live = true
    import('@/components/site/site-sound-on').then((mod) => live && setLoaded({ pack: mod.beacon, Answer: mod.SoundAnswer }))
    return () => {
      live = false
    }
  }, [on, loaded])
  return (
    <YoujProvider {...provider} sound={{ pack: loaded?.pack, muted: !on, whenReduced: true }}>
      {children}
      {loaded && <loaded.Answer />}
    </YoujProvider>
  )
}
