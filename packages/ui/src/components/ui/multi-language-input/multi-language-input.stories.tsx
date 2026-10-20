import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '../field'
import { Form, FormField, FormSubmit } from '../form'
import { SegmentedControl, SegmentedControlItem } from '../segmented-control'
import { Separator } from '../separator'
import { toast, Toaster } from '../toast'
import { DESCRIPTION_REVIEW, EIGHT, FORTY, PRODUCT, SUGGESTIONS } from './multi-language-input.fixtures'
import {
  describeLocale,
  missingTranslations,
  MultiLanguageActions,
  MultiLanguageInput,
  MultiLanguageProvider,
  MultiLanguageSwitcher,
  useMultiLanguage,
  type MultiLanguageView,
  type TranslationValue,
} from './index'

const meta: Meta<typeof MultiLanguageInput> = {
  title: 'UI/Inputs/MultiLanguageInput',
  component: MultiLanguageInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'One field for text in many languages, from two locales to forty: the value is `Record<locale, string>` and the control edits one locale at a time, named “Title, German” and marked with its `lang` and `dir`. Pinned locales are keys in a segmented track that never overflows; every other locale is a search away (by name, native name, code or region, grouped by region, with recent ones and a “Needs work” filter). Each translation is missing, outdated (the source changed since), to review (filled by a copy or a machine suggestion) or complete, shown by shape as well as color. Inside a MultiLanguageProvider every field of a form shares one switcher, one status model, bulk actions and a side-by-side view for translators that marks what changed in the source. Mod+Alt+↓ / ↑ jumps to the next or previous locale that needs work. Motion: the new text drifts in from the side it came from, keys and highlights glide, statuses pop in and a completed locale draws its check. Reduced motion: everything changes in place.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof MultiLanguageInput>

function ViewToggle() {
  const { view, setView } = useMultiLanguage()
  return (
    <SegmentedControl size="sm" aria-label="View" value={view} onValueChange={(next) => setView(next as MultiLanguageView)}>
      <SegmentedControlItem value="single">Single</SegmentedControlItem>
      <SegmentedControlItem value="side-by-side">Side by side</SegmentedControlItem>
    </SegmentedControl>
  )
}

/** The provider's toolbar: the switcher, the view and the bulk actions. */
function Toolbar() {
  return (
    // Wraps on phones: the switcher keeps a row of its own rather than shrink to a sliver.
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface p-1.5 shadow-xs">
      <MultiLanguageSwitcher className="min-w-0 flex-1" />
      <Separator orientation="vertical" className="h-5 max-sm:hidden" />
      <ViewToggle />
      <MultiLanguageActions />
    </div>
  )
}

function ProductCopy({ defaultView = 'single' as MultiLanguageView }) {
  const [name, setName] = useState(PRODUCT.name)
  const [tagline, setTagline] = useState(PRODUCT.tagline)
  const [description, setDescription] = useState(PRODUCT.description)
  return (
    <MultiLanguageProvider
      locales={EIGHT}
      pinned={['en', 'fr', 'de', 'ja']}
      requiredLocales={['en', 'fr', 'de']}
      defaultView={defaultView}
      defaultLocale={defaultView === 'side-by-side' ? 'de' : undefined}
      onBulkAction={(result) => toast(`${result.fields} ${result.fields === 1 ? 'field' : 'fields'} updated`, { action: { label: 'Undo', onClick: result.undo } })}
    >
      <div className="flex w-[min(40rem,calc(100vw-2rem))] flex-col gap-5">
        <Toolbar />
        <FieldGroup>
          <Field required>
            <FieldLabel>Product name</FieldLabel>
            <MultiLanguageInput value={name} onValueChange={setName} limit={{ en: 40, fr: 40, de: 40, ja: 20 }} />
          </Field>
          <Field>
            <FieldLabel>Tagline</FieldLabel>
            <MultiLanguageInput value={tagline} onValueChange={setTagline} />
          </Field>
          <Field required>
            <FieldLabel>Description</FieldLabel>
            <MultiLanguageInput value={description} onValueChange={setDescription} defaultReview={DESCRIPTION_REVIEW} suggestions={SUGGESTIONS} multiline />
            <FieldDescription>Shown on the product page. Missing languages fall back to English.</FieldDescription>
          </Field>
        </FieldGroup>
      </div>
      <Toaster />
    </MultiLanguageProvider>
  )
}

/** Product copy in eight languages: one switcher for every field, what's missing or outdated at a glance, and bulk actions with undo. */
export const Hero: Story = {
  render: () => <ProductCopy />,
}

export const Playground: Story = {
  args: { locales: ['en', 'fr', 'de'], multiline: false, placeholder: 'Title', disabled: false },
  render: (args) => (
    <Field className="w-[min(24rem,calc(100vw-2rem))]">
      <FieldLabel>Title</FieldLabel>
      <MultiLanguageInput {...args} />
    </Field>
  ),
}

/** Two locales: the keys read like tabs, and an empty one offers the copy. */
export const TwoLocales: Story = {
  render: () => (
    <Field className="w-[min(24rem,calc(100vw-2rem))]" required>
      <FieldLabel>Welcome message</FieldLabel>
      <MultiLanguageInput locales={['en', 'fr']} defaultValue={{ en: 'Welcome back' }} />
    </Field>
  ),
}

const fortyValue: TranslationValue = Object.fromEntries(FORTY.slice(0, 31).map((code, i) => [code, i % 7 === 3 ? '' : `Summer sale · ${code}`]))

/** Forty locales on one field: the source and three pinned markets stay one press away, the other 36 are a search away, and ↓ / ↑ step through what's left. */
export const FortyLocales: Story = {
  render: () => (
    <Field className="w-[min(34rem,calc(100vw-2rem))]" required>
      <FieldLabel>Campaign headline</FieldLabel>
      <MultiLanguageInput locales={FORTY} pinned={['en', 'de', 'fr', 'ja']} defaultValue={{ ...fortyValue, en: 'Summer sale: 30% off linen' }} />
      <FieldDescription>Search by name, native name or code: “Deutsch”, “pt-br”, “Brazil”.</FieldDescription>
    </Field>
  ),
}

/** For translators: the source beside each field, with what changed since the translation marked. */
export const SideBySide: Story = {
  render: () => <ProductCopy defaultView="side-by-side" />,
}

const REQUIRED = ['en', 'de', 'fr']
const list = new Intl.ListFormat('en', { type: 'conjunction' })

const schema = z.object({
  // The message names the languages still missing: "Add the title in German and French."
  title: z.record(z.string(), z.string()).superRefine((value, ctx) => {
    const missing = missingTranslations(value, REQUIRED).map((code) => describeLocale(code, 'en').label)
    if (missing.length) ctx.addIssue({ code: 'custom', message: `Add the title in ${list.format(missing)}.` })
  }),
})

function ProductForm() {
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { title: { en: 'Linen overshirt', de: 'Leinen-Overshirt' } } })
  return (
    <Form form={form} onSubmit={() => new Promise((resolve) => setTimeout(resolve, 800))} className="flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-4">
      <FormField name="title" label="Title" required description="English, German and French are required to publish.">
        {(field) => (
          <MultiLanguageInput
            locales={['en', 'de', 'fr', 'ja']}
            requiredLocales={REQUIRED}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
          />
        )}
      </FormField>
      <FormSubmit className="self-start">Save</FormSubmit>
    </Form>
  )
}

/** With Form: a schema checks the required locales, the error describes the field, and the empty required locale says so. */
export const WithForm: Story = {
  render: () => <ProductForm />,
}

/** A right-to-left interface with Arabic as the source: the chrome mirrors, and each field runs in its own direction. */
export const RightToLeft: Story = {
  render: () => (
    <div dir="rtl" lang="ar" className="w-[min(30rem,calc(100vw-2rem))]">
      <YoujProvider locale="ar">
        <FieldGroup>
          <Field required>
            <FieldLabel>اسم المنتج</FieldLabel>
            <MultiLanguageInput locales={['ar', 'he', 'en', 'fr']} defaultValue={{ ar: 'قميص علوي من الكتان', en: 'Linen overshirt' }} />
          </Field>
          <Field>
            <FieldLabel>الوصف</FieldLabel>
            <MultiLanguageInput
              locales={['ar', 'he', 'en', 'fr']}
              multiline
              defaultValue={{ ar: 'كتان أوروبي بأزرار من القرن، يُرتدى مفتوحًا فوق قميص قطني.', he: 'פשתן אירופאי עם כפתורי קרן, ללבוש פתוח מעל חולצת טי.' }}
            />
          </Field>
        </FieldGroup>
      </YoujProvider>
    </div>
  ),
}

/** Soft limits per locale, counted as a reader counts characters: search titles run shorter in Japanese. */
export const CharacterLimits: Story = {
  render: () => (
    <Field className="w-[min(24rem,calc(100vw-2rem))]">
      <FieldLabel>Search title</FieldLabel>
      <MultiLanguageInput
        locales={['en', 'de', 'ja']}
        limit={{ en: 60, de: 60, ja: 30 }}
        defaultValue={{ en: 'Linen overshirt, garment-dyed in Portugal · Northwind', de: 'Leinen-Overshirt, stückgefärbt in Portugal, mit Hornknöpfen · Northwind', ja: 'リネンオーバーシャツ｜ポルトガルで製品染め｜Northwind' }}
      />
    </Field>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Field className="w-[min(24rem,calc(100vw-2rem))]" disabled>
      <FieldLabel>Archived title</FieldLabel>
      <MultiLanguageInput locales={['en', 'fr', 'de']} defaultValue={{ en: 'Spring collection', fr: 'Collection printemps' }} />
    </Field>
  ),
}

/** Reduced motion: text swaps in place, keys and highlights jump, statuses appear drawn. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <ProductCopy />
    </YoujProvider>
  ),
}
