import type { ComponentType, ReactNode } from 'react'
import type { ArgTypes, StoryObj } from '@storybook/react-vite'
import { cn } from '@youj/core/lib/youj/cn'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import type { LoaderMeta } from './categories'
import type { LoaderLabelEffect, LoaderProps } from './kit'

/* Storybook-only helpers every loader's stories share. Not a registry item. */

/** Every label effect, in the order the controls list them. */
export const LABEL_EFFECTS: LoaderLabelEffect[] = ['pulse', 'wave', 'type', 'scramble', 'slide', 'none']

export const loaderArgTypes: ArgTypes<LoaderProps> = {
  size: { control: 'inline-radio', options: ['sm', 'default', 'lg'] },
  color: {
    control: 'select',
    options: [undefined, 'var(--color-fg)', 'var(--color-fg-muted)', 'var(--color-accent)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-danger)'],
  },
  accentColor: {
    control: 'select',
    options: [undefined, 'var(--color-fg)', 'var(--color-fg-muted)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-danger)'],
  },
  colors: {
    control: 'select',
    options: ['mono', 'theme', 'status'],
    mapping: { mono: undefined, theme: 'theme', status: ['var(--color-success)', 'var(--color-info)', 'var(--color-warning)', 'var(--color-danger)'] },
  },
  speed: { control: { type: 'range', min: 0.25, max: 3, step: 0.25 } },
  label: { control: 'object' },
  labelEvery: { control: { type: 'number', min: 1, max: 6, step: 1 } },
  showLabel: { control: 'boolean' },
  labelPosition: { control: 'select', options: ['bottom', 'top', 'start', 'end'], if: { arg: 'showLabel' } },
  labelEffect: { control: 'select', options: LABEL_EFFECTS, if: { arg: 'showLabel' } },
  paused: { control: 'boolean' },
}

export const loaderArgs: LoaderProps = { size: 'lg', speed: 1, labelEvery: 1, showLabel: false, labelPosition: 'bottom', labelEffect: 'pulse', paused: false }

/** The stage every loader is shown on: the canvas with a faint grid of construction dots. */
export const STAGE =
  'bg-canvas [--yj-anim-paper:var(--color-canvas)] [background-image:radial-gradient(color-mix(in_oklab,var(--color-fg)_16%,transparent)_1px,transparent_1.2px)] [background-size:16px_16px] [background-position:center]'

export function Stage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid min-h-[22rem] place-items-center p-10 text-fg', STAGE, className)}>{children}</div>
}

type Loader = ComponentType<LoaderProps>

/** A product moment: a workspace panel getting ready, and a row syncing in a list. */
export function InContext({ Loader, ...args }: LoaderProps & { Loader: Loader }) {
  return (
    <div className="grid min-h-[30rem] place-items-center bg-canvas p-8 text-fg">
      <div className="w-full max-w-[26rem] overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <span aria-hidden className="size-1.5 rounded-[1px] bg-accent" />
          <span className="font-mono text-[11px] tracking-[0.12em] text-fg-muted uppercase">New project</span>
        </div>
        <div className="flex flex-col items-center gap-4 px-8 pt-10 pb-8 text-center">
          <Loader {...args} size="lg" label={args.label ?? 'Preparing your workspace'} />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Preparing your workspace</p>
            <p className="text-[13px] text-fg-muted">Importing 248 files and building the first preview.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-line px-4 py-3 text-[13px]">
          <Loader {...args} size="sm" label="Syncing" showLabel labelPosition="end" />
          <span className="ms-auto font-mono text-[11px] text-fg-subtle">142 / 248</span>
        </div>
      </div>
    </div>
  )
}

/** Each named size, then the label shown. */
export function SizeRow({ Loader }: { Loader: Loader }) {
  return (
    <div className="flex flex-wrap items-center gap-10 bg-canvas p-10 text-fg">
      {(['sm', 'default', 'lg'] as const).map((size) => (
        <figure key={size} className="flex flex-col items-center gap-3">
          <Loader size={size} />
          <figcaption className="font-mono text-[11px] text-fg-subtle">{size}</figcaption>
        </figure>
      ))}
      <Loader size="default" label="Loading data" showLabel />
    </div>
  )
}

/** The meta every loader's stories share: the component, its description, the controls. Each file adds its own `title` and `tags`. */
export function loaderMeta<C extends Loader>(Loader: C, about: LoaderMeta, label?: string) {
  return {
    component: Loader,
    parameters: { docs: { description: { component: about.description } } },
    argTypes: loaderArgTypes,
    args: label ? { ...loaderArgs, label } : loaderArgs,
  }
}

/** The four stories every loader has: Hero, Playground, Sizes and ReducedMotion. `hero` and `heroLabel` set the Hero's description and the label its workspace panel shows. */
export function loaderStories(Loader: Loader, { hero = 'A workspace getting ready, and a row syncing in a list.', heroLabel }: { hero?: string; heroLabel?: string } = {}) {
  const describe = (story: string) => ({ docs: { description: { story } } })
  const Hero: StoryObj<Loader> = {
    parameters: { layout: 'fullscreen', ...describe(hero) },
    render: (args) => <InContext Loader={Loader} {...args} {...(heroLabel && { label: heroLabel })} />,
  }
  const Playground: StoryObj<Loader> = {
    parameters: describe('Large on the stage, with every control live.'),
    render: (args) => (
      <Stage>
        <Loader {...args} />
      </Stage>
    ),
  }
  const Sizes: StoryObj<Loader> = {
    parameters: describe('sm, md and lg, then the label shown.'),
    render: () => <SizeRow Loader={Loader} />,
  }
  const ReducedMotion: StoryObj<Loader> = {
    parameters: describe('Reduced motion holds the still frame (drawn as SVG, as the server renders it).'),
    render: (args) => (
      <YoujProvider reducedMotion="always">
        <Stage>
          <Loader {...args} />
        </Stage>
      </YoujProvider>
    ),
  }
  return { Hero, Playground, Sizes, ReducedMotion }
}
