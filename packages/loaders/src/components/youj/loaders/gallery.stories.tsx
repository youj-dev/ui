/// <reference types="vite/client" />
import type { ComponentType } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { LOADER_CATEGORIES, type LoaderMeta } from './categories'
import type { LoaderLabelEffect, LoaderLabelPosition, LoaderProps } from './kit'
import { LABEL_EFFECTS, STAGE } from './story-kit'

const meta: Meta = {
  title: 'Visuals/Loaders/Gallery',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Every loader (beta), by category, found from the files themselves. Each is a polite status named "Loading" unless given a `label` (or several, which a shown label rotates through, one every `labelEvery` loops), takes `size`, `color` and `accentColor` (the primary and secondary colors), `speed`, `showLabel` (with `labelPosition` and `labelEffect`) and `paused`, draws on one shared ticker only while it is on screen, and under reduced motion holds a still frame.',
      },
    },
  },
}
export default meta

interface Entry {
  meta: LoaderMeta
  Loader: ComponentType<LoaderProps>
}

const modules = import.meta.glob<Record<string, unknown>>(['./*/*.tsx', '!./*/*.stories.tsx', '!./*/*.test.tsx'], { eager: true })
const pascal = (id: string) => id.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase())
const POSITIONS: LoaderLabelPosition[] = ['bottom', 'top', 'start', 'end']

const ENTRIES: Entry[] = Object.values(modules)
  .map((mod) => {
    const info = mod.meta as LoaderMeta
    return { meta: info, Loader: mod[`Loader${pascal(info.id)}`] as ComponentType<LoaderProps> }
  })
  .sort((a, b) => a.meta.order - b.meta.order)

function Gallery({ size }: { size?: LoaderProps['size'] }) {
  let n = 0
  return (
    <div className="flex flex-col gap-10 bg-canvas p-8 text-fg">
      {LOADER_CATEGORIES.map((category) => {
        const entries = ENTRIES.filter((e) => e.meta.category === category.id)
        if (!entries.length) return null
        return (
          <section key={category.id} className="flex flex-col gap-3">
            <header className="flex items-baseline gap-3">
              <h2 className="text-sm font-semibold tracking-tight">{category.title}</h2>
              <p className="text-xs text-fg-muted">{category.blurb}</p>
            </header>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-px overflow-hidden rounded-xl border border-line bg-line">
              {entries.map(({ meta: info, Loader }) => (
                <figure key={info.id} data-loader={info.id} className="flex flex-col bg-surface">
                  <div className={`relative grid h-48 place-items-center ${STAGE}`}>
                    <span className="absolute start-3 top-2.5 font-mono text-[10px] text-fg-subtle">{String(++n).padStart(2, '0')}</span>
                    <Loader size={size} />
                  </div>
                  <figcaption className="flex flex-col gap-0.5 border-t border-line px-3 py-2.5">
                    <span className="text-[13px] font-medium">{info.title}</span>
                    <span className="line-clamp-1 text-xs text-fg-muted">{info.description}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

/** Every loader at its medium size. */
export const All: StoryObj = { render: () => <Gallery /> }

/** At their large size. */
export const Large: StoryObj = { render: () => <Gallery size="lg" /> }

interface StageArgs {
  id: string
  size: number
  showLabel: boolean
  label: string
  /** Several labels, which take over from `label`: `labels[0]:Loading;labels[1]:Almost+there` in a link. */
  labels: string[]
  labelEvery: number
  labelPosition: LoaderLabelPosition
  labelEffect: LoaderLabelEffect
  accentColor: string
}

/** One loader alone on the stage, for recording: `args=id:drop;size:240`, with its label `showLabel:!true;labelEffect:type`, rotating labels `labels[0]:Loading;labels[1]:Almost+there`, and a secondary color `accentColor:var(--color-success)`. */
export const Stage: StoryObj<StageArgs> = {
  args: { id: ENTRIES[0]?.meta.id ?? '', size: 240, showLabel: false, label: 'Loading', labels: [], labelEvery: 1, labelPosition: 'bottom', labelEffect: 'pulse', accentColor: '' },
  argTypes: {
    labels: { control: 'object' },
    id: { control: 'select', options: ENTRIES.map((e) => e.meta.id) },
    size: { control: { type: 'range', min: 16, max: 320 } },
    labelEvery: { control: { type: 'number', min: 1, max: 6, step: 1 } },
    labelPosition: { control: 'select', options: POSITIONS },
    labelEffect: { control: 'select', options: LABEL_EFFECTS },
    accentColor: { control: 'select', options: ['', 'var(--color-fg)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-danger)'] },
  },
  render: ({ id, size, showLabel, label, labels, labelEvery, labelPosition, labelEffect, accentColor }) => {
    const entry = ENTRIES.find((e) => e.meta.id === id) ?? ENTRIES[0]
    return (
      <div className={`grid h-screen place-items-center text-fg ${STAGE}`}>
        {entry && (
          <entry.Loader
            size={size}
            label={labels.length ? labels : label}
            labelEvery={labelEvery}
            showLabel={showLabel}
            labelPosition={labelPosition}
            labelEffect={labelEffect}
            accentColor={accentColor || undefined}
          />
        )}
      </div>
    )
  },
}

interface LabelArgs {
  id: string
  size: number
  label: string
  speed: number
}

/** The shown label in every position (columns) with every effect (rows), each on the drawing's own clock: `args=id:tittle;size:64`. Left empty, the label is the default from the labels (Arabic under RTL). */
export const Label: StoryObj<LabelArgs> = {
  args: { id: 'tittle', size: 64, label: '', speed: 1 },
  argTypes: {
    id: { control: 'select', options: ENTRIES.map((e) => e.meta.id) },
    size: { control: { type: 'range', min: 16, max: 160 } },
    label: { control: 'text' },
    speed: { control: { type: 'range', min: 0.25, max: 3, step: 0.25 } },
  },
  render: ({ id, size, label, speed }) => {
    const entry = ENTRIES.find((e) => e.meta.id === id) ?? ENTRIES[0]
    if (!entry) return <></>
    return (
      <div className="grid grid-cols-[auto_repeat(4,minmax(0,1fr))] gap-px overflow-hidden bg-line text-fg">
        <span className="bg-canvas" />
        {POSITIONS.map((position) => (
          <span key={position} className="bg-canvas px-4 py-2.5 font-mono text-[11px] tracking-wider text-fg-muted uppercase">
            {position}
          </span>
        ))}
        {LABEL_EFFECTS.map((effect) => (
          <div key={effect} className="contents">
            <span className="grid place-items-center bg-canvas px-4 font-mono text-[11px] tracking-wider text-fg-muted uppercase [writing-mode:vertical-rl] rotate-180">{effect}</span>
            {POSITIONS.map((position) => (
              <div key={position} data-label-cell={`${effect}-${position}`} className={`grid min-h-44 place-items-center p-6 ${STAGE}`}>
                <entry.Loader size={size} speed={speed} label={label || undefined} showLabel labelPosition={position} labelEffect={effect} />
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  },
}

/** A wait in steps: what a rotating caption says, in English and (under RTL) in Arabic. */
const STEPS = {
  en: ['Loading', 'Generating results', 'Almost there', 'One more minute'],
  ar: ['جارٍ التحميل', 'جارٍ إنشاء النتائج', 'أوشكنا على الانتهاء', 'دقيقة واحدة بعد'],
}

interface RotatingArgs {
  id: string
  size: number
  labelEvery: number
  speed: number
}

/** Several labels taking turns, one every `labelEvery` loops, changing at the seam under each effect; the status says the first and only now and then a later one. Under RTL the labels are Arabic. */
export const Rotating: StoryObj<RotatingArgs> = {
  args: { id: 'tittle', size: 72, labelEvery: 1, speed: 1 },
  argTypes: {
    id: { control: 'select', options: ENTRIES.map((e) => e.meta.id) },
    size: { control: { type: 'range', min: 24, max: 160 } },
    labelEvery: { control: { type: 'number', min: 1, max: 6, step: 1 } },
    speed: { control: { type: 'range', min: 0.25, max: 3, step: 0.25 } },
  },
  render: ({ id, size, labelEvery, speed }, { globals }) => {
    const entry = ENTRIES.find((e) => e.meta.id === id) ?? ENTRIES[0]
    if (!entry) return <></>
    const steps = globals.direction === 'rtl' ? STEPS.ar : STEPS.en
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-px overflow-hidden bg-line text-fg">
        {LABEL_EFFECTS.map((effect) => (
          <figure key={effect} data-label-cell={effect} className={`relative grid min-h-64 place-items-center p-6 ${STAGE}`}>
            <figcaption className="absolute start-3 top-2.5 font-mono text-[11px] tracking-wider text-fg-muted uppercase">{effect}</figcaption>
            <entry.Loader size={size} speed={speed} label={steps} labelEvery={labelEvery} showLabel labelEffect={effect} />
          </figure>
        ))}
      </div>
    )
  },
}

/** Labels in four scripts: per-letter effects (wave, scramble) move letters one by one where they keep their shapes on their own (Latin, Hebrew, Japanese); a joined script (Arabic) takes the nearest whole-word effect, so its letters never break apart. Type and the rest clip one run of text, so every script keeps its shapes. */
const SCRIPTS = [
  { id: 'latin', label: 'Generating results', dir: 'ltr' },
  { id: 'hebrew', label: 'טוען תוצאות', dir: 'rtl' },
  { id: 'arabic', label: 'جارٍ إنشاء النتائج', dir: 'rtl' },
  { id: 'japanese', label: '結果を生成中', dir: 'ltr' },
] as const

export const Scripts: StoryObj<{ id: string; size: number }> = {
  args: { id: 'tittle', size: 56 },
  argTypes: {
    id: { control: 'select', options: ENTRIES.map((e) => e.meta.id) },
    size: { control: { type: 'range', min: 24, max: 160 } },
  },
  render: ({ id, size }) => {
    const entry = ENTRIES.find((e) => e.meta.id === id) ?? ENTRIES[0]
    if (!entry) return <></>
    return (
      <div className="grid grid-cols-[auto_repeat(4,minmax(0,1fr))] gap-px overflow-hidden bg-line text-fg">
        <span className="bg-canvas" />
        {SCRIPTS.map((script) => (
          <span key={script.id} className="bg-canvas px-4 py-2.5 font-mono text-[11px] tracking-wider text-fg-muted uppercase">
            {script.id}
          </span>
        ))}
        {LABEL_EFFECTS.map((effect) => (
          <div key={effect} className="contents">
            <span className="grid place-items-center bg-canvas px-4 font-mono text-[11px] tracking-wider text-fg-muted uppercase [writing-mode:vertical-rl] rotate-180">{effect}</span>
            {SCRIPTS.map((script) => (
              <div key={script.id} dir={script.dir} data-label-cell={`${effect}-${script.id}`} className={`grid min-h-40 place-items-center p-6 ${STAGE}`}>
                <entry.Loader size={size} label={script.label} showLabel labelEffect={effect} />
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  },
}

/** Each one large, two to a row, for studying the drawing. */
export const Closeup: StoryObj = {
  render: () => (
    <div className="grid grid-cols-2 gap-3 bg-canvas p-6 text-fg">
      {ENTRIES.map(({ meta: info, Loader }) => (
        <figure key={info.id} data-loader={info.id} className={`relative grid h-72 place-items-center rounded-xl border border-line ${STAGE}`}>
          <figcaption className="absolute start-3 top-2.5 font-mono text-[11px] tracking-wider text-fg-muted uppercase">{info.title}</figcaption>
          <Loader size={200} />
        </figure>
      ))}
    </div>
  ),
}
