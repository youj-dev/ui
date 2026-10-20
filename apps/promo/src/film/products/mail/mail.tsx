'use client'

import { graphite, ThemeScope, type ThemeInput } from '@youj/core'
import { Toaster } from '@youj/react/components/ui/toast'
import { useIsMobile } from '@youj/react/hooks/use-mobile'
import { Commands } from './components/commands'
import { Compose } from './components/compose'
import { Desk } from './components/desk'
import { LetterIndex } from './components/letter-index'
import { Phone } from './components/phone'
import { TopBar } from './components/top-bar'
import { useFolio, type Draft } from './use-folio'
import { useShortcuts } from './use-shortcuts'

/* Folio: mail, one letter at a time. The inbox is sorted by what each letter
 * needs from you (Needs you, Reading, Paper trail) and handed to you as a
 * sheet on a desk, with the rest of the pile beneath it.
 * - Keyboard first (use-shortcuts): J / K move, E is done, H sets a letter
 *   aside until later, R replies in place, # deletes, S stars, Z undoes,
 *   C writes, / searches, ⌘K does anything (commands). The legend at the foot
 *   of the desk shows the keys, and each presses in when it's used.
 * - Motion: a filed letter folds out of the index while the rest glide up,
 *   the next sheet settles in from the pile (which thins, sheet by sheet), the
 *   counts roll and the morning's progress fills. When the pile is gone, the
 *   desk is clear.
 * - Phone: the index first; a letter slides over it with its actions at the
 *   foot.
 * - Reduced motion: every change lands at once. */

interface MailExampleProps {
  /** Resolve once a letter is on its way. */
  onSend?: (draft: Draft) => Promise<unknown>
  /** The letter on the desk to begin with, by id ('estate' is the long one). Default: the first that needs you. */
  defaultLetter?: string
  /** Open with the inbox already dealt with, to see the clear desk. */
  cleared?: boolean
  /** The theme it wears. Default: Graphite. */
  theme?: ThemeInput
}

function MailExample({ theme = graphite, ...props }: MailExampleProps) {
  return (
    <ThemeScope theme={theme}>
      <Folio {...props} />
    </ThemeScope>
  )
}

function Folio({ onSend = () => new Promise((resolve) => setTimeout(resolve, 700)), defaultLetter, cleared }: Omit<MailExampleProps, 'theme'>) {
  const phone = useIsMobile()
  const folio = useFolio({ onSend, defaultLetter, cleared })
  useShortcuts(folio, phone)
  return (
    <div className="flex h-dvh flex-col bg-canvas text-fg">
      <h1 className="sr-only">Folio</h1>
      <TopBar folio={folio} phone={phone} />
      {phone ? (
        <main className="min-h-0 flex-1">
          <Phone folio={folio} />
        </main>
      ) : (
        <main className="grid min-h-0 flex-1 grid-cols-[19rem_minmax(0,1fr)] lg:grid-cols-[21rem_minmax(0,1fr)]">
          <section aria-label="Letters" className="flex min-h-0 flex-col overflow-y-auto border-e border-line yj-scrollbar">
            <LetterIndex folio={folio} />
          </section>
          <Desk folio={folio} />
        </main>
      )}
      <Commands folio={folio} />
      <Compose open={folio.composing} onOpenChange={folio.setComposing} draft={folio.draft} onSend={folio.send} />
      {/* Above the legend (or the phone's actions), not on it. */}
      <Toaster className={phone ? 'bottom-20' : 'bottom-16'} />
    </div>
  )
}

export { MailExample }
export type { MailExampleProps }
