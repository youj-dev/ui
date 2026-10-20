'use client'

/* The Theming and Styles pages' live blocks. The theming ones live with the
 * Storybook docs in @youj/react (src/docs), so the site and Storybook
 * show the same builder, preset cards and character comparison; Storybook
 * compares styles with its own toolbar. They run on the page's column. */

import { ThemeScope } from '@youj/core'
import { Counter } from '@youj/motion'
import { themes } from '@youj/core/lib/youj/theme'
import { DEFAULT_LOOK, looks } from '@youj/core/lib/youj/look'
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
  FieldLabel,
  Input,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@youj/react'
import { DEFAULT_FRAME } from '@youj/react/docs/create/config'
import { DEFAULT_SIZE } from '@youj/react/docs/create/size-url'
import { ThemeBuilder as Builder } from '@youj/react/docs/theme-builder'
import { CharacterComparison } from '@youj/react/docs/theme-character'
import { PresetCards } from '@youj/react/docs/theme-sample'
import { createPath } from '@/lib/create'

export function ThemePresets() {
  return <PresetCards themes={themes} className="not-prose my-6" />
}

export function ThemeCharacter() {
  return <CharacterComparison className="not-prose my-6" />
}

export function ThemeBuilder() {
  return <Builder className="not-prose my-8" createHref={(theme) => createPath({ frame: DEFAULT_FRAME, theme, style: DEFAULT_LOOK, size: DEFAULT_SIZE }, 'theme')} />
}

const RANGES = [
  { value: '24h', label: '24H', spend: 86.4, change: '+4%' },
  { value: '7d', label: '7D', spend: 612.9, change: '+12%' },
  { value: '30d', label: '30D', spend: 2418.35, change: '−3%' },
] as const

const usd = { style: 'currency', currency: 'USD' } as const

/** The same card, fields and actions, whatever the style: only its build changes. */
function Specimen() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Spend</CardTitle>
        <CardDescription>Workspace · September</CardDescription>
        <CardAction>
          <span>Cycle 9</span>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Tabs defaultValue="7d">
          <TabsList aria-label="Range">
            {RANGES.map((range) => (
              <TabsTrigger key={range.value} value={range.value}>
                {range.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {RANGES.map((range) => (
            <TabsContent key={range.value} value={range.value} className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <Counter value={range.spend} format={usd} inView={false} className="text-2xl font-semibold tracking-tight text-fg" />
              <Badge variant={range.change.startsWith('+') ? 'warning' : 'success'}>{range.change}</Badge>
            </TabsContent>
          ))}
        </Tabs>
        <Field>
          <FieldLabel>Spend cap</FieldLabel>
          <Input defaultValue="$2,500" />
        </Field>
        <Field orientation="horizontal">
          <FieldLabel>Pause at the cap</FieldLabel>
          <Switch defaultChecked />
        </Field>
      </CardContent>
      <CardFooter>
        <span className="me-auto text-ui-sm text-fg-muted">Synced 2 min ago</span>
        <Button variant="secondary">Adjust</Button>
        <Button>Add funds</Button>
      </CardFooter>
    </Card>
  )
}

/**
 * One card built in each style, side by side, in the site's theme (Graphite in light, Basalt in dark):
 * a style never picks a preset, and the previews pair either with any.
 */
export function LookComparison() {
  return (
    <div className="not-prose my-8 grid gap-6 md:grid-cols-2">
      {looks.map((style) => (
        <figure key={style.id} className="flex min-w-0 flex-col gap-3">
          <div className="blueprint flex flex-1 items-start rounded-2xl border border-line bg-canvas p-3 sm:p-4">
            <ThemeScope look={style.id}>
              <Specimen />
            </ThemeScope>
          </div>
          <figcaption className="text-ui text-fg-muted">
            <span className="font-medium text-fg">{style.name}</span>
            {style.id === DEFAULT_LOOK ? ', the default. ' : '. '}
            {style.description}
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
