'use client'

import { useState } from 'react'
import { CheckIcon, PlugIcon, ShieldCheckIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { Carousel, CarouselContent, CarouselDots, CarouselItem, CarouselNext, CarouselPrevious } from '../../../components/ui/carousel'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '../../../components/ui/sheet'
import { cn } from '../../../lib/utils'
import { TONE, type App, type IntegrationsCopy } from './data'
import { Monogram } from './monogram'
import { Eyebrow } from '../../../components/ui/typography'

function Shot({ app, variant }: { app: App; variant: number }) {
  // Placeholder screenshots drawn from tokens: swap for real images.
  return (
    <div aria-hidden className="flex size-full flex-col gap-2 bg-transparent p-4">
      <div className="flex items-center gap-2">
        <span className={cn('size-5 rounded-md', TONE[app.tone])} />
        <span className="h-2 w-24 rounded-full bg-well" />
        <span className="ms-auto h-2 w-10 rounded-full bg-well" />
      </div>
      <div className={cn('grid flex-1 gap-2', variant === 1 ? 'grid-cols-3' : 'grid-cols-1')}>
        {Array.from({ length: variant === 1 ? 6 : 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-2 rounded-md border border-line bg-surface px-2.5">
            <span className={cn('size-2 rounded-full', i === variant ? 'bg-accent' : 'bg-well')} />
            <span className="h-1.5 flex-1 rounded-full bg-well" style={{ maxWidth: `${50 + ((i * 17 + variant * 11) % 45)}%` }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function AppSheet({
  open,
  app,
  installed,
  onOpenChange,
  onInstall,
  onUninstall,
  copy,
  compact,
}: {
  open: boolean
  app?: App
  installed: boolean
  onOpenChange: (open: boolean) => void
  /** Installs on your side; the sheet flips to installed once it resolves. */
  onInstall: () => Promise<unknown> | unknown
  onUninstall: () => Promise<unknown> | unknown
  copy: IntegrationsCopy
  compact: (n: number) => string
}) {
  const [failure, setFailure] = useState<string>()
  // Runs an install or uninstall, keeping a rejection's message on screen.
  const run = (action: () => Promise<unknown> | unknown) => async () => {
    setFailure(undefined)
    try {
      await action()
    } catch (failed) {
      setFailure(failed instanceof Error && failed.message ? failed.message : copy.failed)
      throw failed
    }
  }
  const shots = app?.screenshots ?? [0, 1, 2].map((i) => app && <Shot key={i} app={app} variant={i} />)
  return (
    <Sheet open={open} onOpenChange={onOpenChange} onOpenChangeComplete={(next) => !next && setFailure(undefined)}>
      <SheetContent side="end" className="sm:max-w-md">
        {app && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <Monogram app={app} size="lg" />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <SheetTitle>{app.name}</SheetTitle>
                  <SheetDescription>
                    {copy.byVendor(app.vendor, compact(app.installs))}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <SheetBody className="flex flex-col gap-6">
              <Carousel aria-label={copy.screenshots(app.name)} opts={{ loop: true }} className="group/shots overflow-hidden rounded-lg border border-line">
                <CarouselContent className="ms-0">
                  {shots.map((shot, i) => (
                    <CarouselItem key={i} aria-label={copy.screenshot(i + 1, shots.length)} className="aspect-video ps-0">
                      {shot}
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="start-2 opacity-0 group-hover/shots:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100" />
                <CarouselNext className="end-2 opacity-0 group-hover/shots:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100" />
                <CarouselDots className="border-t border-line bg-surface py-2" />
              </Carousel>
              <p className="text-ui text-fg">{app.blurb}</p>
              <section aria-labelledby="abilities" className="flex flex-col gap-2">
                <Eyebrow render={<h3 id="abilities" />} className="text-ui-sm font-medium text-fg-muted">
                  {copy.abilities}
                </Eyebrow>
                <ul className="flex flex-col gap-1.5">
                  {app.abilities.map((a) => (
                    <li key={a} className="flex items-start gap-2 text-ui">
                      <PlugIcon size={14} className="mt-0.5 shrink-0 text-accent-text" />
                      {a}
                    </li>
                  ))}
                </ul>
              </section>
              <section aria-labelledby="permissions" className="flex flex-col gap-2 rounded-lg border border-line p-3">
                <h3 id="permissions" className="flex items-center gap-2 text-ui-sm font-medium text-fg">
                  <ShieldCheckIcon size={14} className="text-success-text" /> {copy.permissions}
                </h3>
                <ul className="flex flex-col gap-1.5">
                  {app.permissions.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-ui text-fg-muted">
                      <CheckIcon size={14} strokeWidth={2.25} className="mt-0.5 shrink-0 text-success-text" />
                      {p}
                    </li>
                  ))}
                </ul>
              </section>
            </SheetBody>
            <SheetFooter className="flex-row flex-wrap items-center justify-end">
              {failure && (
                <p role="alert" className="me-auto text-ui-sm text-danger-text">
                  {failure}
                </p>
              )}
              {installed ? (
                <>
                  <AsyncButton variant="ghost" onAction={run(onUninstall)} pendingLabel={copy.removing} successLabel={copy.removed}>
                    {copy.uninstall}
                  </AsyncButton>
                  <Button variant="outline" disabled>
                    <CheckIcon size={14} /> {copy.installed}
                  </Button>
                </>
              ) : (
                <AsyncButton onAction={run(onInstall)} pendingLabel={copy.installing} successLabel={copy.installed}>
                  {copy.install(app.name)}
                </AsyncButton>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

export { AppSheet }
