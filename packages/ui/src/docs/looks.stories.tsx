import type { Meta, StoryObj } from '@storybook/react-vite'
import { ThemeScope, type YoujLook } from '@youj/core'
import { Counter } from '@youj/motion'
import { MoreHorizontalIcon } from '@youj/icons'
import { Badge, BadgeDot } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Field, FieldLabel } from '../components/ui/field'
import { Input } from '../components/ui/input'
import { Progress, ProgressLabel, ProgressValue } from '../components/ui/progress'
import { SegmentedControl, SegmentedControlItem } from '../components/ui/segmented-control'
import { Switch } from '../components/ui/switch'
import { Eyebrow } from '../components/ui/typography'

const meta: Meta = {
  title: 'UI/Foundations/Looks',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A look decides how each component is built; the theme decides its color, type and corners. The same panel in Classic, the default, and in Bezel, in the toolbar’s theme and preset. Each half is a ThemeScope with its own look, so each keeps its build whatever the toolbar’s Look says.',
      },
    },
  },
}
export default meta

function Panel({ look }: { look: YoujLook }) {
  return (
    <ThemeScope look={look}>
      <div className="flex flex-col gap-3">
        <Eyebrow>{look === 'classic' ? 'Classic, the default' : 'Bezel'}</Eyebrow>
        <Card className="w-[25rem]">
          <CardHeader>
            <CardTitle>Build minutes</CardTitle>
            <CardDescription>Pro plan · October</CardDescription>
            <CardAction>
              <Button variant="ghost" size="icon-sm" aria-label={`More (${look})`}>
                <MoreHorizontalIcon />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-end justify-between gap-3">
              <div className="flex flex-col gap-1">
                <Eyebrow>Left this month</Eyebrow>
                <Counter
                  mode="roll"
                  value={1860}
                  format={{ style: 'unit', unit: 'minute', unitDisplay: 'short' }}
                  className="text-3xl font-semibold tracking-tight text-fg"
                />
              </div>
              <SegmentedControl aria-label={`Range (${look})`} defaultValue="month" size="sm">
                <SegmentedControlItem value="day">Day</SegmentedControlItem>
                <SegmentedControlItem value="week">Week</SegmentedControlItem>
                <SegmentedControlItem value="month">Month</SegmentedControlItem>
              </SegmentedControl>
            </div>
            <Progress value={3140} max={5000} getAriaValueText={(_, v) => `${v?.toLocaleString('en-US')} of 5,000 min`}>
              <ProgressLabel>Used</ProgressLabel>
              <ProgressValue>{(_, v) => `${v?.toLocaleString('en-US')} of 5,000 min`}</ProgressValue>
            </Progress>
          </CardContent>
          <CardContent className="flex flex-col gap-4">
            <Field>
              <FieldLabel>Runner</FieldLabel>
              <Input defaultValue="linux-arm64" aria-label={`Runner (${look})`} />
            </Field>
            <label className="flex items-center justify-between gap-3 text-ui">
              Queue builds past the cap
              <Switch defaultChecked aria-label={`Queue builds past the cap (${look})`} />
            </label>
            <div className="flex gap-2">
              <Badge variant="success">
                <BadgeDot />
                Within plan
              </Badge>
              <Badge variant="secondary">6 runners</Badge>
            </div>
          </CardContent>
          <CardFooter>
            <span>Renews 1 Nov</span>
            <Button variant="secondary">Change plan</Button>
            <Button>Buy minutes</Button>
          </CardFooter>
        </Card>
      </div>
    </ThemeScope>
  )
}

export const SideBySide: StoryObj = {
  name: 'Side by side',
  render: () => (
    <div className="flex flex-wrap items-start gap-8">
      <Panel look="bezel" />
      <Panel look="classic" />
    </div>
  ),
}
