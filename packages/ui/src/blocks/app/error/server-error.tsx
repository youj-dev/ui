'use client'

import { useState, type ReactNode } from 'react'
import { Reveal, Stagger, TextSplit } from '@youj/motion'
import { CopyIcon, ExternalLinkIcon, RefreshIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { buttonVariants } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { cn } from '../../../lib/utils'
import { alignment, MainframeArt, Split } from './art'
import type { ErrorScreenCopy, ErrorScreenService, ErrorScreenServiceState, LinkComponent } from './data'
import type { MainframeState } from './mainframe'

const STATE: Record<ErrorScreenServiceState, { dot: string; badge: 'success' | 'warning' | 'danger' }> = {
  operational: { dot: 'bg-success', badge: 'success' },
  degraded: { dot: 'bg-warning', badge: 'warning' },
  outage: { dot: 'bg-danger', badge: 'danger' },
}

export function StatusLink({ href, copy, link: Link }: { href: string; copy: ErrorScreenCopy; link: LinkComponent }) {
  return (
    <Link href={href} data-yj-trigger="" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
      {copy.statusPage} <ExternalLinkIcon size={16} />
    </Link>
  )
}

interface ServerErrorProps {
  incidentId: string
  onRetry: () => Promise<unknown> | unknown
  statusHref: string
  supportHref: string
  services: readonly ErrorScreenService[]
  /** The picture beside the text; undefined for the mainframe, null for none. */
  media: ReactNode
  copy: ErrorScreenCopy
  link: LinkComponent
  headingLevel: 1 | 2 | 3
}

export function ServerError({ incidentId, onRetry, statusHref, supportHref, services, media, copy, link: Link, headingLevel }: ServerErrorProps) {
  const Title = `h${headingLevel}` as const
  const Sub = `h${headingLevel + 1}` as 'h2' | 'h3' | 'h4'
  // Why the last retry failed, from the rejection.
  const [failed, setFailed] = useState<string>()
  const [machine, setMachine] = useState<MainframeState>('down')
  const art = media === undefined ? <MainframeArt state={machine} /> : media
  const rich = art !== null && art !== false
  const align = alignment(rich)
  return (
    <>
      <Split art={art}>
        <div className={cn('flex w-full max-w-md flex-col gap-8', align, !rich && 'max-w-none')}>
          <div className={cn('flex flex-col gap-6', align)}>
            {rich ? (
              <p className="font-mono text-ui-sm tracking-widest text-fg-subtle uppercase">{copy.errorCode(copy.code)}</p>
            ) : (
              <TextSplit
                as="p"
                by="chars"
                mask
                inView={false}
                step="loose"
                duration="deliberate"
                ease="enter"
                className="font-mono text-5xl font-semibold tracking-tighter text-accent sm:text-6xl"
              >
                {copy.code}
              </TextSplit>
            )}
            <Stagger inView={false} delay={rich ? 2 : 4} variant="rise" className={cn('flex flex-col gap-6', align)}>
              <Title className={cn('text-balance text-3xl font-semibold tracking-tight text-fg sm:text-4xl', rich && 'xl:text-5xl')}>
                {copy.serverTitle}
              </Title>
              <p className="max-w-md text-pretty text-ui-lg text-fg-muted">{copy.serverDescription}</p>
              <div className={cn('flex flex-wrap justify-center gap-3', rich && 'lg:justify-start')}>
                <AsyncButton
                  size="lg"
                  data-yj-trigger=""
                  onAction={async () => {
                    setFailed(undefined)
                    setMachine('retrying')
                    try {
                      await onRetry()
                      setMachine('up')
                    } catch (reason) {
                      setMachine('down')
                      if (reason instanceof Error && reason.message) setFailed(reason.message)
                      throw reason
                    }
                  }}
                  pendingLabel={copy.retrying}
                  successLabel={copy.backOnline}
                  errorLabel={copy.stillDown}
                >
                  <RefreshIcon size={16} /> {copy.retry}
                </AsyncButton>
                <StatusLink href={statusHref} copy={copy} link={Link} />
              </div>
              {failed && (
                <p role="alert" className="text-ui-sm text-danger-text">
                  {failed}
                </p>
              )}
            </Stagger>
          </div>
          <Reveal inView={false} delay={10} className="w-full max-w-md self-center lg:self-auto">
            <section
              aria-labelledby="error-services"
              className="flex flex-col rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface/80 youj-allow-glass text-start backdrop-blur"
            >
              <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
                <Sub id="error-services" className="text-ui font-medium text-fg">
                  {copy.currentStatus}
                </Sub>
                <span className="text-ui-sm text-fg-muted">{copy.updated}</span>
              </header>
              <ul className="flex flex-col py-1">
                {services.map((s) => (
                  <li key={s.name} className="flex items-center gap-3 px-4 py-2 text-ui">
                    <span aria-hidden className={cn('size-2 shrink-0 rounded-full', STATE[s.state].dot)} />
                    <span className="flex-1 text-fg">{s.name}</span>
                    <Badge variant={STATE[s.state].badge}>{copy.serviceStates[s.state]}</Badge>
                  </li>
                ))}
              </ul>
              <footer className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line px-4 py-3">
                <span className="text-ui-sm text-fg-muted">{copy.incident}</span>
                <code className="me-auto font-mono text-ui-sm text-fg">{incidentId}</code>
                {copy.contactSupport && (
                  <Link
                    href={supportHref}
                    className="rounded-sm text-ui-sm text-fg-muted underline decoration-line underline-offset-4 transition-colors yj-duration-fast ease-standard focus-ring hover:text-fg"
                  >
                    {copy.contactSupport}
                  </Link>
                )}
                <AsyncButton
                  size="xs"
                  variant="outline"
                  aria-label={copy.copyIdLabel(incidentId)}
                  onAction={() => navigator.clipboard.writeText(incidentId)}
                  successLabel={copy.copied}
                  errorLabel={copy.copyFailed}
                >
                  <CopyIcon /> {copy.copyId}
                </AsyncButton>
              </footer>
            </section>
          </Reveal>
        </div>
      </Split>
    </>
  )
}
