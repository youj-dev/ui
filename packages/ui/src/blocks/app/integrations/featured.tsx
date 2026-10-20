'use client'

import { Reveal } from '@youj/motion'
import { MeshGradient } from '@youj/motion/backgrounds'
import { ArrowRightIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import type { App, IntegrationFeature, IntegrationsCopy } from './data'
import { Monogram } from './monogram'

function Featured({ app, feature, installed, onOpen, copy }: { app: App; feature: IntegrationFeature; installed: boolean; onOpen: () => void; copy: IntegrationsCopy }) {
  return (
    <Reveal inView={false} variant="rise">
      <section aria-label={copy.featured} className="relative isolate overflow-hidden rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface">
        <div aria-hidden className="absolute inset-0 -z-10 opacity-80">
          <MeshGradient intensity={1.2} speed={0.6} className="absolute inset-0" />
        </div>
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-r from-surface from-35% via-surface/70 to-transparent rtl:bg-linear-to-l" />
        <div className="flex flex-col gap-4 px-(--ui--panel-x) py-(--ui--panel-y) sm:flex-row sm:items-center">
          <Monogram app={app} size="lg" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-ui-xs font-medium tracking-wide text-accent-text uppercase">{feature.eyebrow}</span>
            <h2 className="text-lg font-semibold tracking-tight text-fg">{feature.title}</h2>
            <p className="text-ui text-fg-muted">{feature.description}</p>
          </div>
          <Button variant={installed ? 'outline' : 'default'} onClick={onOpen} className="self-start sm:self-center">
            {installed ? copy.manage : copy.seeHow} <ArrowRightIcon size={14} className="rtl:-scale-x-100" />
          </Button>
        </div>
      </section>
    </Reveal>
  )
}

export { Featured }
