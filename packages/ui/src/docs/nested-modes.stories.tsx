import type { Meta, StoryObj } from '@storybook/react-vite'
import { ThemeScope } from '@youj/core'
import { expect } from 'storybook/test'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'

const meta: Meta = {
  title: 'UI/Foundations/Nested modes',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A light region inside a dark page, and a dark one inside a light page, under Bezel. Every surface resolves against its own region: the nested card takes its own mode’s card, border, popover and shadow, never the page’s.',
      },
    },
  },
}
export default meta

function Region({ mode, other }: { mode: 'light' | 'dark'; other: 'light' | 'dark' }) {
  return (
    <div data-theme={mode} data-testid={`${mode}-region`} className="flex flex-wrap items-start gap-6 rounded-xl bg-canvas p-6 text-fg">
      <Sample label={`${mode} page`} />
      <div data-theme={other} data-testid={`${other}-in-${mode}`} className="rounded-xl bg-canvas p-6 text-fg">
        <Sample label={`${other} inside ${mode}`} />
      </div>
    </div>
  )
}

function Sample({ label }: { label: string }) {
  return (
    <Card className="w-[20rem]">
      <CardHeader>
        <CardTitle>Build minutes</CardTitle>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <span className="font-mono text-ui-sm">1,860 left</span>
        <Badge variant="solid">Pro</Badge>
      </CardContent>
      <CardFooter className="justify-end">
        <Button size="sm">Upgrade</Button>
      </CardFooter>
    </Card>
  )
}

export const Bezel: StoryObj = {
  render: () => (
    <ThemeScope look="bezel">
      <div className="flex flex-col gap-6">
        <Region mode="dark" other="light" />
        <Region mode="light" other="dark" />
      </div>
    </ThemeScope>
  ),
  // Each nested card's head must wear its own region's card color, the one
  // the same card has on a page of that mode.
  play: async ({ canvasElement }) => {
    const head = (region: string) =>
      getComputedStyle(canvasElement.querySelector(`[data-testid="${region}"] [data-slot="card-header"]`)!).backgroundColor
    await expect(head('light-in-dark')).toBe(head('light-region'))
    await expect(head('dark-in-light')).toBe(head('dark-region'))
  },
}
