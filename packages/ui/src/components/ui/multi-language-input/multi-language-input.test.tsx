import { useState } from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Field, FieldLabel } from '../field'
import { Form, FormField, FormSubmit } from '../form'
import {
  missingTranslations,
  MultiLanguageInput,
  MultiLanguageProgress,
  MultiLanguageProvider,
  MultiLanguageSwitcher,
  translationStatus,
  useMultiLanguage,
  type BulkResult,
  type TranslationReviews,
  type TranslationValue,
} from './index'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const status = () => screen.getAllByRole('status').map((s) => s.textContent).join(' ')
const name = (label: string, locale: string) => new RegExp(`^${label}\\s?, ${locale}$`)

function Standalone({
  initial = {},
  onChange,
  ...props
}: { initial?: TranslationValue; onChange?: (v: TranslationValue) => void } & Partial<Parameters<typeof MultiLanguageInput>[0]>) {
  const [value, setValue] = useState(initial)
  return (
    <form data-testid="form">
      <Field required>
        <FieldLabel>Product name</FieldLabel>
        <MultiLanguageInput
          locales={['en', 'fr', 'ar']}
          value={value}
          name="title"
          onValueChange={(v) => {
            setValue(v)
            onChange?.(v)
          }}
          {...props}
        />
      </Field>
    </form>
  )
}

describe('MultiLanguageInput on its own', () => {
  test('names the control by its label and locale, and marks its language and direction', async () => {
    const user = userEvent.setup()
    reduced(<Standalone initial={{ en: 'Linen shirt' }} />)
    const input = screen.getByRole('textbox', { name: name('Product name', 'English') })
    expect(input).toHaveValue('Linen shirt')
    expect(input).toHaveAttribute('lang', 'en')
    expect(input).toHaveAttribute('dir', 'ltr')
    expect(input).toBeRequired()
    await user.click(screen.getByRole('button', { name: 'Arabic, Missing' }))
    const arabic = screen.getByRole('textbox', { name: name('Product name', 'Arabic') })
    expect(arabic).toHaveAttribute('lang', 'ar')
    expect(arabic).toHaveAttribute('dir', 'rtl')
    expect(arabic).not.toBeRequired()
    // Untranslated, the source text is the reminder of what to translate.
    expect(arabic).toHaveAttribute('placeholder', 'Linen shirt')
  })

  test('keys name every locale with its status, and the ring reads the progress', () => {
    reduced(<Standalone initial={{ en: 'Linen shirt', ar: 'قميص كتان' }} />)
    const group = screen.getByRole('group', { name: 'Language' })
    expect(within(group).getByRole('button', { name: 'English, Source' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(group).getByRole('button', { name: 'French, Missing' })).toHaveAttribute('aria-pressed', 'false')
    expect(within(group).getByRole('button', { name: 'Arabic' })).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Translation progress' })).toHaveAttribute('aria-valuetext', '2 of 3 languages complete, 1 missing')
  })

  test('typing changes only the edited locale', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    reduced(<Standalone initial={{ en: 'Linen shirt' }} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'French, Missing' }))
    await user.type(screen.getByRole('textbox'), 'Chemise')
    expect(onChange).toHaveBeenLastCalledWith({ en: 'Linen shirt', fr: 'Chemise' })
    expect(screen.getByRole('button', { name: 'French' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('copies from the source into an empty locale, to review, then marks it reviewed', async () => {
    const user = userEvent.setup()
    reduced(<Standalone initial={{ en: 'Linen shirt' }} />)
    expect(screen.queryByRole('button', { name: /copy from/i })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'French, Missing' }))
    await user.click(screen.getByRole('button', { name: 'Copy from English' }))
    const input = screen.getByRole<HTMLInputElement>('textbox')
    expect(input).toHaveValue('Linen shirt')
    await waitFor(() => expect(input).toHaveFocus())
    expect(input.selectionStart).toBe('Linen shirt'.length)
    expect(status()).toContain('Copied from English')
    // A copy isn't a translation until someone has checked it.
    expect(screen.getByRole('button', { name: 'French, Needs review' })).toBeInTheDocument()
    expect(input).toHaveAccessibleDescription('Filled automatically. Check it, then mark it reviewed.')
    await user.click(screen.getByRole('button', { name: 'Mark reviewed' }))
    expect(screen.getByRole('button', { name: 'French' })).toBeInTheDocument()
    expect(status()).toContain('French marked reviewed')
  })

  test('a translation goes out of date when the source changes, and side by side shows what changed', async () => {
    const user = userEvent.setup()
    reduced(<Standalone initial={{ en: 'Linen shirt', fr: 'Chemise en lin' }} view="side-by-side" />)
    await user.type(screen.getByRole('textbox'), ', washed')
    await user.click(screen.getByRole('button', { name: 'French, Outdated' }))
    const input = screen.getByRole('textbox', { name: name('Product name', 'French') })
    // The source is read to screen readers with the translation, then the note.
    expect(input).toHaveAccessibleDescription('Linen shirt, washed English changed since this was translated.')
    const source = document.getElementById(input.getAttribute('aria-describedby')!.split(' ')[0]!)!
    expect(source).toHaveAttribute('lang', 'en')
    expect(within(source).getByText(', washed', { selector: 'ins' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Mark reviewed' }))
    expect(screen.getByRole('button', { name: 'French' })).toBeInTheDocument()
  })

  test('offers a machine suggestion in an empty locale, filled as needs review', async () => {
    const user = userEvent.setup()
    reduced(<Standalone initial={{ en: 'Linen shirt' }} suggestions={{ fr: 'Chemise en lin' }} />)
    await user.click(screen.getByRole('button', { name: 'French, Missing' }))
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'Chemise en lin')
    await user.click(screen.getByRole('button', { name: 'Use suggestion' }))
    expect(screen.getByRole('textbox')).toHaveValue('Chemise en lin')
    expect(screen.getByRole('button', { name: 'French, Needs review' })).toBeInTheDocument()
  })

  test('counts characters as a reader does, per locale, and flags text over the limit', async () => {
    const user = userEvent.setup()
    reduced(<Standalone initial={{ en: 'Linen 👕' }} limit={{ en: 8, fr: 4 }} />)
    const input = screen.getByRole('textbox')
    // The emoji is one character.
    expect(input).toHaveAccessibleDescription('7 of 8 characters')
    expect(input).not.toHaveAttribute('aria-invalid')
    await user.type(input, 'ab')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('1 character over the limit. 9 of 8 characters')
    await user.click(screen.getByRole('button', { name: 'French, Missing' }))
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('0 of 4 characters')
  })

  test('shows validation and app errors for the locale being edited', async () => {
    const user = userEvent.setup()
    reduced(<Standalone initial={{ en: 'Linen shirt', fr: 'x' }} errors={{ fr: 'Already used by another product' }} validate={(text) => text.includes('!') && 'No exclamation marks'} />)
    await user.type(screen.getByRole('textbox'), '!')
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('No exclamation marks')
    await user.click(screen.getByRole('button', { name: /^French/ }))
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription(expect.stringContaining('Already used by another product'))
  })

  test('submits every locale as name[code]', () => {
    reduced(<Standalone initial={{ en: 'Linen shirt', fr: 'Chemise' }} />)
    const data = new FormData(screen.getByTestId('form') as HTMLFormElement)
    expect(data.get('title[en]')).toBe('Linen shirt')
    expect(data.get('title[fr]')).toBe('Chemise')
    expect(data.get('title[ar]')).toBe('')
  })

  test('takes locale objects with labels, and sourceLocale as the source', async () => {
    const user = userEvent.setup()
    reduced(
      <MultiLanguageInput
        aria-label="Welcome"
        sourceLocale="de"
        defaultValue={{ de: 'Willkommen' }}
        multiline
        locales={[
          { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
          { code: 'en', label: 'English' },
        ]}
      />,
    )
    expect(screen.getByRole('textbox', { name: 'Welcome, Deutsch' }).tagName).toBe('TEXTAREA')
    await user.click(screen.getByRole('button', { name: 'English, Missing' }))
    expect(screen.getByRole('button', { name: 'Copy from Deutsch' })).toBeInTheDocument()
  })
})

const MANY = ['en', 'de', 'fr', 'es', 'it', 'pt-BR', 'nl', 'pl', 'sv', 'tr', 'ja', 'zh-Hans', 'ko', 'hi', 'ar', 'he']

describe('with many locales', () => {
  test('pins the source and puts the rest in a searchable picker, grouped by region', async () => {
    const user = userEvent.setup()
    reduced(<MultiLanguageInput aria-label="Title" locales={MANY} defaultValue={{ en: 'Linen', de: 'Leinen', ja: 'リネン' }} />)
    expect(within(screen.getByRole('group', { name: 'Language' })).getAllByRole('button')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'All languages, 15 more languages' }))
    const search = await screen.findByRole('combobox', { name: 'Search 16 languages…' })
    expect(search).toHaveFocus()
    expect(screen.getByRole('group', { name: 'Asia Pacific' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Middle East & Africa' })).toBeInTheDocument()
    // By its own name, or its code.
    await user.keyboard('Deutsch')
    expect(screen.getAllByRole('option')).toHaveLength(1)
    await user.clear(search)
    await user.keyboard('zh-hans')
    expect(screen.getByRole('option')).toHaveTextContent('Chinese (Simplified)')
    await user.keyboard('{Enter}')
    // Picked on its own, focus goes to the text in the picked language.
    const input = await screen.findByRole('textbox', { name: 'Title, Chinese (Simplified)' })
    await waitFor(() => expect(input).toHaveFocus())
    expect(input).toHaveAttribute('lang', 'zh-Hans')
    expect(status()).toContain('Chinese (Simplified), Missing')
    // The trigger now stands for the picked locale.
    expect(screen.getByRole('button', { name: 'Chinese (Simplified), All languages' })).toHaveAttribute('data-pressed')
  })

  test('"Needs work" lists only what is left to translate', async () => {
    const user = userEvent.setup()
    reduced(<MultiLanguageInput aria-label="Title" locales={['en', 'de', 'fr', 'es', 'it', 'nl']} pinned={['en']} defaultValue={{ en: 'Linen', de: 'Leinen', fr: 'Lin' }} />)
    await user.click(screen.getByRole('button', { name: /All languages/ }))
    await screen.findByRole('combobox')
    expect(screen.getAllByRole('option')).toHaveLength(6)
    await user.click(screen.getByRole('button', { name: /^Needs work/ }))
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      expect.stringContaining('Dutch'),
      expect.stringContaining('Italian'),
      expect.stringContaining('Spanish'),
    ])
  })

  test('Mod+Alt+↓ and ↑ step through the locales that need work, and say where they landed', async () => {
    const user = userEvent.setup()
    reduced(<MultiLanguageInput aria-label="Title" locales={['en', 'de', 'fr', 'ja']} defaultValue={{ en: 'Linen', de: 'Leinen' }} />)
    const input = screen.getByRole('textbox')
    await user.click(input)
    await user.keyboard('{Control>}{Alt>}{ArrowDown}{/Alt}{/Control}')
    expect(screen.getByRole('textbox', { name: 'Title, French' })).toHaveFocus()
    expect(status()).toContain('French, Missing')
    await user.keyboard('{Meta>}{Alt>}{ArrowDown}{/Alt}{/Meta}')
    expect(screen.getByRole('textbox', { name: 'Title, Japanese' })).toBeInTheDocument()
    // It wraps, skipping what's done.
    await user.keyboard('{Meta>}{Alt>}{ArrowDown}{/Alt}{/Meta}')
    expect(screen.getByRole('textbox', { name: 'Title, French' })).toBeInTheDocument()
    await user.keyboard('{Meta>}{Alt>}{ArrowUp}{/Alt}{/Meta}')
    expect(screen.getByRole('textbox', { name: 'Title, Japanese' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next language to translate' })).toHaveAttribute('aria-keyshortcuts')
  })

  test('with nothing left, stepping says so and the step buttons rest', async () => {
    const user = userEvent.setup()
    reduced(<MultiLanguageInput aria-label="Title" locales={['en', 'de', 'fr', 'ja']} defaultValue={{ en: 'a', de: 'b', fr: 'c', ja: 'd' }} />)
    await user.click(screen.getByRole('textbox'))
    await user.keyboard('{Control>}{Alt>}{ArrowDown}{/Alt}{/Control}')
    expect(status()).toContain('Every language is complete.')
    expect(screen.getByRole('button', { name: 'Next language to translate' })).toBeDisabled()
  })
})

function Entry({ onBulk }: { onBulk?: (r: BulkResult) => void }) {
  const [title, setTitle] = useState<TranslationValue>({ en: 'Linen overshirt', de: 'Leinen-Overshirt' })
  const [summary, setSummary] = useState<TranslationValue>({ en: 'Garment-dyed linen.' })
  const [showSummary, setShowSummary] = useState(true)
  return (
    <MultiLanguageProvider locales={['en', 'de', 'fr']} onBulkAction={onBulk}>
      <MultiLanguageSwitcher />
      <Field>
        <FieldLabel>Title</FieldLabel>
        <MultiLanguageInput value={title} onValueChange={setTitle} />
      </Field>
      {showSummary && (
        <Field>
          <FieldLabel>Summary</FieldLabel>
          <MultiLanguageInput value={summary} onValueChange={setSummary} multiline />
        </Field>
      )}
      <Toolbar onHide={() => setShowSummary(false)} />
    </MultiLanguageProvider>
  )
}

function Toolbar({ onHide }: { onHide: () => void }) {
  const ml = useMultiLanguage()
  return (
    <>
      <button type="button" onClick={() => ml.copyFromSource()}>Fill</button>
      <button type="button" onClick={onHide}>Hide summary</button>
      <output data-testid="german">{JSON.stringify(ml.summaries.de?.counts)}</output>
    </>
  )
}

describe('MultiLanguageProvider', () => {
  test('every field follows one switcher, and a field is named by its own label', async () => {
    const user = userEvent.setup()
    reduced(<Entry />)
    expect(screen.getAllByRole('group', { name: 'Language' })).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'German, Missing' }))
    expect(screen.getByRole('textbox', { name: name('Title', 'German') })).toHaveValue('Leinen-Overshirt')
    expect(screen.getByRole('textbox', { name: name('Summary', 'German') })).toHaveValue('')
  })

  test('sums statuses per locale across fields, and forgets a field that unmounts', async () => {
    const user = userEvent.setup()
    reduced(<Entry />)
    expect(JSON.parse(screen.getByTestId('german').textContent!)).toMatchObject({ complete: 1, missing: 1 })
    await user.click(screen.getByRole('button', { name: 'Hide summary' }))
    expect(JSON.parse(screen.getByTestId('german').textContent!)).toMatchObject({ complete: 1, missing: 0 })
    expect(screen.getByRole('button', { name: 'German' })).toBeInTheDocument()
  })

  test('a bulk fill copies the source into every empty field, says so, and can be undone', async () => {
    const user = userEvent.setup()
    const onBulk = vi.fn()
    reduced(<Entry onBulk={onBulk} />)
    await user.click(screen.getByRole('button', { name: 'French, Missing' }))
    await user.click(screen.getByRole('button', { name: 'Fill' }))
    expect(screen.getByRole('textbox', { name: name('Title', 'French') })).toHaveValue('Linen overshirt')
    expect(screen.getByRole('textbox', { name: name('Summary', 'French') })).toHaveValue('Garment-dyed linen.')
    expect(status()).toContain('Filled French in 2 fields')
    const result: BulkResult = onBulk.mock.calls[0]![0]
    expect(result).toMatchObject({ action: 'copy', locale: 'fr', fields: 2 })
    act(() => result.undo())
    expect(screen.getByRole('textbox', { name: name('Title', 'French') })).toHaveValue('')
  })

  test('a lone progress meter reads one locale across the fields', () => {
    reduced(
      <MultiLanguageProvider locales={['en', 'de']}>
        <MultiLanguageInput aria-label="A" defaultValue={{ en: 'a', de: 'b' }} />
        <MultiLanguageInput aria-label="B" defaultValue={{ en: 'a' }} />
        <MultiLanguageProgress locale="de" variant="bar" />
      </MultiLanguageProvider>,
    )
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '1 of 2 fields complete, 1 missing')
  })
})

describe('with Form', () => {
  const schema = z.object({
    title: z.record(z.string(), z.string()).refine((v) => missingTranslations(v, ['en', 'de']).length === 0, { message: 'Add the English and German title.' }),
  })
  function Product({ onSubmit }: { onSubmit: (v: z.infer<typeof schema>) => void }) {
    const form = useForm({ resolver: zodResolver(schema), defaultValues: { title: { en: 'Linen' } } })
    return (
      <Form form={form} onSubmit={onSubmit}>
        <FormField name="title" label="Title" required>
          {(field) => <MultiLanguageInput locales={['en', 'de']} requiredLocales={['en', 'de']} value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} ref={field.ref} />}
        </FormField>
        <FormSubmit>Save</FormSubmit>
      </Form>
    )
  }

  test('an incomplete translation fails the form, is described by the error, and names the missing locale', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    reduced(<Product onSubmit={onSubmit} />)
    await user.click(screen.getByRole('button', { name: 'Save' }))
    const input = screen.getByRole('textbox')
    await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'true'))
    expect(input).toHaveAccessibleDescription(expect.stringContaining('Add the English and German title.'))
    expect(onSubmit).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'German, Missing' }))
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription(expect.stringContaining('Required in German.'))
    await user.type(screen.getByRole('textbox'), 'Leinen')
    // The button holds "Check the form" for a moment after the failed submit.
    await user.click(await screen.findByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ title: { en: 'Linen', de: 'Leinen' } }))
  })
})

describe('the model', () => {
  test('statuses: missing, source, outdated against the basis, review, complete', () => {
    const value = { en: 'New', de: 'Neu', fr: 'Nouveau', ja: '' }
    const review: TranslationReviews = { de: { basis: 'Old' }, fr: { basis: 'New', unreviewed: true } }
    expect(translationStatus(value, 'ja', 'en', review.ja)).toBe('missing')
    expect(translationStatus(value, 'en', 'en')).toBe('source')
    expect(translationStatus(value, 'de', 'en', review.de)).toBe('outdated')
    expect(translationStatus(value, 'fr', 'en', review.fr)).toBe('review')
    expect(translationStatus({ en: 'New', it: 'Nuovo' }, 'it', 'en', undefined, 'New')).toBe('complete')
    expect(missingTranslations(value, ['en', 'ja', 'ko'])).toEqual(['ja', 'ko'])
  })
})

describe('motion', () => {
  test('under reduced motion a locale switch changes the text in place', async () => {
    const user = userEvent.setup()
    reduced(<Standalone initial={{ en: 'Linen shirt', fr: 'Chemise' }} />)
    expect(screen.getByRole('textbox').closest('[data-slot=multi-language-input]')).toHaveAttribute('data-reduced-motion')
    await user.click(screen.getByRole('button', { name: 'French' }))
    expect(screen.getByRole('textbox')).toHaveValue('Chemise')
    expect(screen.getByRole('textbox').style.opacity).toBe('')
  })

  test('with motion, the new text drifts in, and a quick switch back retargets', async () => {
    const user = userEvent.setup()
    render(<Standalone initial={{ en: 'Linen shirt', fr: 'Chemise' }} />)
    await user.click(screen.getByRole('button', { name: 'French' }))
    fireEvent.click(screen.getByRole('button', { name: 'English, Source' }))
    expect(screen.getByRole('textbox')).toHaveValue('Linen shirt')
  })
})
