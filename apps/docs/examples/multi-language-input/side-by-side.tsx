'use client'

import { useState } from 'react'
import {
  Field,
  FieldGroup,
  FieldLabel,
  MultiLanguageActions,
  MultiLanguageInput,
  MultiLanguageProvider,
  MultiLanguageSwitcher,
  SegmentedControl,
  SegmentedControlItem,
  useMultiLanguage,
  type MultiLanguageView,
} from '@youj/react'

function ViewToggle() {
  const { view, setView } = useMultiLanguage()
  return (
    <SegmentedControl size="sm" aria-label="View" value={view} onValueChange={(next) => setView(next as MultiLanguageView)}>
      <SegmentedControlItem value="single">Single</SegmentedControlItem>
      <SegmentedControlItem value="side-by-side">Side by side</SegmentedControlItem>
    </SegmentedControl>
  )
}

export default function MultiLanguageInputSideBySide() {
  const [title, setTitle] = useState<Record<string, string>>({ en: 'Linen overshirt', de: 'Leinen-Overshirt', fr: 'Surchemise en lin' })
  const [summary, setSummary] = useState<Record<string, string>>({
    en: 'Garment-dyed European linen with horn buttons. Relaxed through the body, cut to wear open over a tee.',
    de: 'Stückgefärbtes Leinen mit Hornknöpfen. Offen über einem T-Shirt zu tragen.',
  })
  return (
    // One provider: every field below follows one switcher and one status model.
    <MultiLanguageProvider locales={['en', 'de', 'fr', 'es', 'ja']} defaultLocale="de" defaultView="side-by-side">
      <div className="flex w-full max-w-[40rem] flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface p-1.5">
          <MultiLanguageSwitcher className="min-w-0 flex-1" />
          <ViewToggle />
          <MultiLanguageActions />
        </div>
        <FieldGroup>
          <Field required>
            <FieldLabel>Title</FieldLabel>
            <MultiLanguageInput value={title} onValueChange={setTitle} />
          </Field>
          <Field required>
            <FieldLabel>Summary</FieldLabel>
            {/* German was translated before English gained "European" and "Relaxed through the body". */}
            <MultiLanguageInput
              value={summary}
              onValueChange={setSummary}
              defaultReview={{ de: { basis: 'Garment-dyed linen with horn buttons. Cut to wear open over a tee.' } }}
              multiline
            />
          </Field>
        </FieldGroup>
      </div>
    </MultiLanguageProvider>
  )
}
