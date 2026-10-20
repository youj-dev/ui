import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ThemeScope, type YoujDensity, type YoujScaling } from '@youj/core'
import { expect, within } from 'storybook/test'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Field, FieldGroup, FieldLabel } from '../components/ui/field'
import { Input } from '../components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'

const meta: Meta = {
  title: 'UI/Foundations/Density & scaling',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Two settings size the UI apart from the theme. Layout density (`density`, `data-yj-density`) is how much room panels, rows, fields and overlays give their content: roomy by default, compact for an app. Scaling (`scaling`, `data-yj-scaling`) sizes everything by one factor, from 75% to 120%: type, spacing, control heights, radii and icons, with hairlines and focus rings held crisp and touch targets kept at 100%. Apps run compact at 90%; marketing and auth pages stay roomy at 100%. Both go on YoujProvider or a ThemeScope, and nest either way. The toolbar’s Size switch puts any story at an app’s size.',
      },
    },
  },
}
export default meta

const DEPLOYS = [
  { id: 'dpl_8f2a', branch: 'main', status: 'Ready', time: '2m ago' },
  { id: 'dpl_7c19', branch: 'feat/billing', status: 'Building', time: '6m ago' },
  { id: 'dpl_6b04', branch: 'fix/edge-cache', status: 'Ready', time: '1h ago' },
]

function Panel({ label, density, scaling }: { label: string; density: YoujDensity; scaling: YoujScaling }) {
  return (
    <ThemeScope density={density} scaling={scaling}>
      <section data-testid={density} aria-label={label} className="flex min-w-0 flex-1 flex-col gap-4">
        <header className="flex items-baseline justify-between gap-3">
          <h2 className="text-ui-lg font-medium">{label}</h2>
          <span className="font-mono text-ui-xs text-fg-muted">
            density=&quot;{density}&quot; scaling=&quot;{scaling}&quot;
          </span>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Project settings</CardTitle>
            <CardDescription>Changes apply to the next deployment.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={`${density}-name`}>Project name</FieldLabel>
                <Input id={`${density}-name`} defaultValue="orion" />
              </Field>
              <Field>
                <FieldLabel htmlFor={`${density}-command`}>Build command</FieldLabel>
                <Input id={`${density}-command`} defaultValue="pnpm build" className="font-mono" />
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-end">
            <Button size="sm">Save</Button>
          </CardFooter>
        </Card>
        <Tabs defaultValue="deploys">
          <TabsList aria-label="Project">
            <TabsTrigger value="deploys">Deployments</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>
          <TabsContent value="deploys">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deployment</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-end">Age</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEPLOYS.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono">{row.id}</TableCell>
                    <TableCell>{row.branch}</TableCell>
                    <TableCell>
                      <Badge variant={row.status === 'Ready' ? 'success' : 'warning'}>{row.status}</Badge>
                    </TableCell>
                    <TableCell className="text-end text-fg-muted">{row.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value="logs">No logs yet.</TabsContent>
        </Tabs>
        <Alert variant="info">
          <AlertTitle>Preview comments are on</AlertTitle>
          <AlertDescription>Reviewers can comment on every preview deployment.</AlertDescription>
        </Alert>
      </section>
    </ThemeScope>
  )
}

function Pair({ children }: { children: ReactNode }) {
  return <div className="flex w-full max-w-6xl flex-col gap-10 md:flex-row md:items-start">{children}</div>
}

/** The same panel at the library default and at an app's size. */
export const RoomyAndApp: StoryObj = {
  name: 'Roomy and app',
  render: () => (
    <Pair>
      <Panel label="Marketing, auth" density="roomy" scaling="100%" />
      <Panel label="App" density="compact" scaling="90%" />
    </Pair>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const rowOf = (id: string) => canvas.getByTestId(id).querySelector('tbody tr') as HTMLElement
    const fieldOf = (id: string) => canvas.getByTestId(id).querySelector('[data-slot=input]') as HTMLElement
    // A compact row and a 90% control are both shorter than their roomy pair. A touch screen keeps every control at full size, so only the row shrinks there.
    await expect(rowOf('compact').getBoundingClientRect().height).toBeLessThan(rowOf('roomy').getBoundingClientRect().height)
    if (!matchMedia('(pointer: coarse)').matches) await expect(fieldOf('compact').getBoundingClientRect().height).toBeLessThan(fieldOf('roomy').getBoundingClientRect().height)
  },
}
