'use client'

import { useState, type ComponentProps, type ElementType, type ReactNode } from 'react'
import { ThemeScope, useYouj, type ThemeInput } from '@youj/core'
import { CookieIcon, ShieldCheckIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import {
  CATEGORIES,
  choicesFor,
  DEFAULT_COPY,
  demo,
  type CookieConsentCategory,
  type CookieConsentChoices,
  type CookieConsentCookie,
  type CookieConsentCopy,
} from './cookie-consent/data'
import { CategoryRow, FauxSite } from './cookie-consent/parts'

/* Cookie consent that asks once and stays out of the way. A card rises in
 * from the bottom edge over a quiet page (a CSS transition from its starting
 * style, so a choice made mid-entrance reverses it smoothly). Accept all and
 * Reject all run through Button's onAction, land on "Saved", then the card
 * sinks away and a small cookie button fades into the corner to reopen the
 * choices. Customize opens a Dialog of categories: Necessary is always on,
 * and Analytics, Marketing and Preferences are Switch rows, each with a
 * "Show cookies" disclosure whose table opens through Collapse. Reduced
 * motion: the card, the corner button and the disclosures appear and leave
 * instantly.
 *
 * Pass your own `categories`, store the choice with `onSave` (and `value` /
 * `defaultValue` for one already made), and render it beside your page (or
 * pass the page as `children`, which it renders as is); every string is in
 * `copy`. */

type LinkComponent = ElementType

interface CookieConsentProps extends Omit<ComponentProps<'div'>, 'children' | 'defaultValue'> {
  /** A theme to force on the consent card, corner button and dialog. Default: none, so they inherit the app's (YoujProvider or a ThemeScope around it). */
  theme?: ThemeInput
  /** What shows first while no choice is made: the card, or the preferences dialog. Default `banner`. */
  defaultOpen?: 'banner' | 'preferences'
  /** The cookie categories, in order. Default: the demo's necessary, analytics, marketing and preferences. */
  categories?: CookieConsentCategory[]
  /** The saved choice, to control it; `null` while the visitor hasn't chosen. */
  value?: CookieConsentChoices | null
  /** The choice already made (e.g. read from a cookie), when uncontrolled. Default `null`: ask. */
  defaultValue?: CookieConsentChoices | null
  /** Called once a choice is saved. */
  onValueChange?: (choices: CookieConsentChoices) => void
  /** Stores the choice; resolve when saved, reject to keep the card and show the error's message. Default: a short demo wait. */
  onSave?: (choices: CookieConsentChoices) => Promise<unknown> | unknown
  /** Where the cookie policy link goes. Default `#policy`. */
  policyHref?: string
  /** The page under the consent, rendered as is beside it (outside its theme). Default: a quiet demo bakery page. */
  children?: ReactNode
  /** The card's heading level. Default 2. */
  headingLevel?: 1 | 2 | 3
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<CookieConsentCopy>
  /** Renders the policy link, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: LinkComponent
}

function CookieConsent({
  theme,
  defaultOpen = 'banner',
  categories = CATEGORIES,
  value,
  defaultValue = null,
  onValueChange,
  onSave,
  policyHref = '#policy',
  children,
  headingLevel = 2,
  copy: copyProp,
  linkComponent: Link = 'a',
  className,
  ...rest
}: CookieConsentProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const Heading = `h${headingLevel}` as const
  const k = useYouj()
  const none = choicesFor(categories, false)
  const all = choicesFor(categories, true)
  const [consent, setConsent] = useControllableState(value, defaultValue)
  const [banner, setBanner] = useState(true)
  const [dialog, setDialog] = useState(defaultOpen === 'preferences' && consent === null)
  const [draft, setDraft] = useState<CookieConsentChoices>(consent ?? none)
  const [announcement, setAnnouncement] = useState('')
  const [failure, setFailure] = useState<string>()

  const decide = async (choices: CookieConsentChoices, message: string, demoMs: number) => {
    setFailure(undefined)
    try {
      await (onSave ? onSave(choices) : demo('CookieConsent: onSave', demoMs))
    } catch (cause) {
      setFailure(cause instanceof Error && cause.message ? cause.message : copy.saveFailed)
      throw cause
    }
    setConsent(choices)
    onValueChange?.(choices)
    setDraft(choices)
    setAnnouncement(message)
  }
  // Let "Saved" land before the card sinks away.
  const leaveAfterSuccess = (state: string) => {
    if (state === 'success') setTimeout(() => setBanner(false), k.ms('deliberate'))
  }
  const openPreferences = () => {
    setDraft(consent ?? none)
    setDialog(true)
  }
  const cardShown = banner && consent === null
  const cornerShown = !cardShown && consent !== null
  const error = failure && (
    <p role="alert" className="text-ui-sm text-danger">
      {failure}
    </p>
  )

  return (
    <>
      {children ?? (
        <div className="min-h-dvh bg-canvas text-fg">
          <FauxSite />
        </div>
      )}
      <ThemeScope theme={theme}>
        <div data-reduced-motion={k.reduced || undefined} {...rest} className={cn('text-fg', className)}>
          <section
            aria-labelledby="consent-title"
            inert={!cardShown}
            className={cn(
              'fixed inset-x-3 bottom-3 z-40 flex flex-col gap-4 rounded-xl border border-line bg-overlay p-5 text-fg shadow-lg sm:inset-x-auto sm:start-5 sm:bottom-5 sm:w-[26rem]',
              'transition-[opacity,translate] yj-duration-slow ease-enter starting:translate-y-6 starting:opacity-0',
              !cardShown && 'pointer-events-none translate-y-6 opacity-0 ease-exit',
            )}
          >
            <div className="flex items-start gap-3">
              <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-subtle text-accent-text">
                <CookieIcon size={18} />
              </span>
              <div className="flex flex-col gap-1">
                <Heading id="consent-title" className="font-semibold tracking-tight">
                  {copy.title}
                </Heading>
                <p className="text-ui text-fg-muted">
                  {copy.description}{' '}
                  <Link href={policyHref} className="focus-ring rounded-sm text-accent-text underline underline-offset-4">
                    {copy.policyLink}
                  </Link>
                  {copy.policySuffix}
                </p>
              </div>
            </div>
            {!dialog && error}
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" className="me-auto" onClick={openPreferences}>
                {copy.customize}
              </Button>
              <AsyncButton variant="outline" successLabel={copy.saved} onAction={() => decide(none, copy.announceNone, 500)} onActionStateChange={leaveAfterSuccess}>
                {copy.rejectAll}
              </AsyncButton>
              <AsyncButton successLabel={copy.saved} onAction={() => decide(all, copy.announceAll, 500)} onActionStateChange={leaveAfterSuccess}>
                {copy.acceptAll}
              </AsyncButton>
            </div>
          </section>

          <Button
            variant="outline"
            size="icon-lg"
            aria-label={copy.preferences}
            inert={!cornerShown}
            onClick={openPreferences}
            className={cn(
              'fixed start-5 bottom-5 z-40 bg-overlay shadow-md',
              'transition-[opacity,scale] yj-duration-base ease-enter',
              !cornerShown && 'pointer-events-none scale-75 opacity-0',
            )}
          >
            <CookieIcon size={18} />
          </Button>

          <p role="status" className="sr-only">
            {announcement}
          </p>

          <Dialog open={dialog} onOpenChange={setDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{copy.preferences}</DialogTitle>
                <DialogDescription>{copy.dialogDescription}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                {categories.map((c) => (
                  <CategoryRow
                    key={c.id}
                    category={c}
                    copy={copy}
                    checked={c.required ? true : !!draft[c.id]}
                    onCheckedChange={c.required ? undefined : (on) => setDraft((d) => ({ ...d, [c.id]: on }))}
                  />
                ))}
              </div>
              <p className="flex items-center gap-2 text-ui-sm text-fg-muted">
                <ShieldCheckIcon size={14} /> {copy.footnote}
              </p>
              {dialog && error}
              <DialogFooter>
                <Button variant="outline" className="sm:me-auto" onClick={() => setDraft(none)}>
                  {copy.rejectAll}
                </Button>
                <Button variant="outline" onClick={() => setDraft(all)}>
                  {copy.allowAll}
                </Button>
                <AsyncButton
                  successLabel={copy.saved}
                  onAction={() => decide(draft, copy.announceSaved, 600)}
                  onActionStateChange={(state) => {
                    if (state === 'success')
                      setTimeout(() => {
                        setDialog(false)
                        setBanner(false)
                      }, k.ms('deliberate'))
                  }}
                >
                  {copy.saveChoices}
                </AsyncButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </ThemeScope>
    </>
  )
}

export { CookieConsent }
export type { CookieConsentProps, CookieConsentCopy, CookieConsentCategory, CookieConsentCookie, CookieConsentChoices }
