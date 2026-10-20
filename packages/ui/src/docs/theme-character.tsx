'use client'

import { brutal, defineTheme, graphite, ThemeScope, type Theme } from '@youj/core'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Field, FieldLabel } from '../components/ui/field'
import { Input } from '../components/ui/input'
import { cn } from '../lib/utils'

/* Character, compared: the same product moment in Graphite, in Graphite's
 * colors with Brutal's character, and in Brutal. The middle pane is the
 * point: stroke, shadow, titles and labels change how a theme looks as much
 * as its palette does. Shared by the Foundations/Themes story and the docs
 * site's Theming page. */

/** Graphite's palette, type and motion with Brutal's stroke, shadow, titles and labels. */
export const graphiteWithBrutalCharacter: Theme = defineTheme({
  ...graphite,
  id: 'graphite-brutal-character',
  name: 'Graphite + Brutal’s character',
  stroke: brutal.stroke,
  shadow: brutal.shadow,
  headings: brutal.headings,
  labels: brutal.labels,
})

const PANES = [
  { theme: graphite, note: 'The contract’s baseline: hairlines, soft depth, titles and labels as set.' },
  { theme: graphiteWithBrutalCharacter, note: 'The same colors, type and corners. Only the character fields change.' },
  { theme: brutal, note: 'Its own paper, violet and square corners on top.' },
] as const

const RUNS = [
  { id: 'd-312', branch: 'main', state: 'Ready', tone: 'success' },
  { id: 'd-311', branch: 'fix/auth', state: 'Failed', tone: 'danger' },
] as const

/** A deploy card: a title, a labeled field, column heads, badges and buttons, so every character field shows. */
function CharacterSample() {
  return (
    <Card size="sm" className="bg-surface">
      <CardHeader>
        <CardTitle>Promote to production</CardTitle>
        <CardDescription>Ships the preview to every region.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Field>
          <FieldLabel>Release name</FieldLabel>
          <Input defaultValue="orion-2.4" />
        </Field>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Build</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead className="text-end">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {RUNS.map((run) => (
              <TableRow key={run.id}>
                <TableCell className="font-mono text-ui-sm">{run.id}</TableCell>
                <TableCell className="text-fg-muted">{run.branch}</TableCell>
                <TableCell className="text-end">
                  <Badge variant={run.tone}>{run.state}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline" size="sm">
          Cancel
        </Button>
        <Button size="sm">Promote</Button>
      </CardFooter>
    </Card>
  )
}

/** The three panes, side by side from md up. Each is its own scope, so it ignores the theme around it. */
export function CharacterComparison({ className }: { className?: string }) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-3', className)}>
      {PANES.map(({ theme, note }) => (
        <ThemeScope key={theme.id} theme={theme}>
          <figure className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-canvas text-fg">
            <div className="p-4">
              <CharacterSample />
            </div>
            <figcaption className="mt-auto flex flex-col gap-0.5 border-t border-line px-4 py-3">
              <span className="text-ui font-medium">{theme.name}</span>
              <span className="text-ui-sm text-fg-muted">{note}</span>
            </figcaption>
          </figure>
        </ThemeScope>
      ))}
    </div>
  )
}
