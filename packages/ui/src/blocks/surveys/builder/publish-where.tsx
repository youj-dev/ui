'use client'

import { CodeIcon, LinkIcon, PanelBottomIcon } from '@youj/icons'
import { Field, FieldLabel, FieldTitle } from '../../../components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '../../../components/ui/input-group'
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Slider } from '../../../components/ui/slider'
import { Switch } from '../../../components/ui/switch'
import type { SurveyBuilderCopy, SurveyChannel, SurveyDeployment, SurveySegment } from './data'

/* Publish's first step, where: the channel as three cards (a link, an embed,
 * in-app), then what that channel needs. A link takes its address and who
 * may answer; an embed, its layout; in-app, the segment it's shown to, the
 * share of it asked (with the reach in people), when it appears, and whether
 * a person is asked once. */

const CHANNELS: { id: SurveyChannel; Icon: typeof LinkIcon }[] = [
  { id: 'link', Icon: LinkIcon },
  { id: 'embed', Icon: CodeIcon },
  { id: 'in-app', Icon: PanelBottomIcon },
]

interface WhereStepProps {
  deployment: SurveyDeployment
  set: (patch: Partial<SurveyDeployment>) => void
  segments: SurveySegment[]
  number: Intl.NumberFormat
  copy: SurveyBuilderCopy
}

export function WhereStep({ deployment: d, set, segments, number, copy }: WhereStepProps) {
  const segment = segments.find((s) => s.id === d.segment) ?? segments[0]
  return (
    <div className="flex flex-col gap-5">
      <h3 data-yj-step-heading tabIndex={-1} className="sr-only">
        {copy.stepWhere}
      </h3>
      <RadioGroup
        aria-label={copy.channel}
        value={d.channel}
        onValueChange={(channel) => set({ channel: channel as SurveyChannel })}
        className="grid gap-2 sm:grid-cols-3"
      >
        {CHANNELS.map(({ id, Icon }) => (
          <FieldLabel key={id} className="*:data-[slot=field]:h-full *:data-[slot=field]:p-3">
            <Field orientation="horizontal" className="items-start">
              <RadioGroupItem value={id} className="sr-only" />
              <span className="flex flex-col gap-2">
                <Icon size={16} aria-hidden className={d.channel === id ? 'text-accent-text' : 'text-fg-muted'} />
                <FieldTitle>{copy.channels[id]}</FieldTitle>
                <span className="text-ui-sm font-normal text-fg-muted">{copy.channelHints[id]}</span>
              </span>
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
      {d.channel === 'in-app' ? (
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>{copy.segment}</FieldLabel>
            <Select
              items={segments.map((s) => ({ value: s.id, label: s.label }))}
              value={d.segment}
              onValueChange={(segment) => set({ segment: segment as string })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {segments.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label} · {number.format(s.people)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <div className="flex items-baseline justify-between gap-3">
              <FieldLabel>{copy.sample}</FieldLabel>
              <span className="text-ui-sm text-fg-muted tabular-nums">
                {d.sample}% · {copy.reach(number.format(Math.round(((segment?.people ?? 0) * d.sample) / 100)))}
              </span>
            </div>
            <Slider
              min={1}
              max={100}
              value={d.sample}
              aria-label={copy.sample}
              getAriaValueText={(_, v) => `${v}%`}
              onValueChange={(v) => set({ sample: Array.isArray(v) ? v[0]! : (v as number) })}
            />
          </Field>
          <Field>
            <FieldLabel>{copy.trigger}</FieldLabel>
            <Select
              items={Object.entries(copy.triggers).map(([value, label]) => ({ value, label }))}
              value={d.trigger}
              onValueChange={(trigger) => set({ trigger: trigger as SurveyDeployment['trigger'] })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(copy.triggers).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field orientation="horizontal">
            <FieldLabel className="font-normal">{copy.once}</FieldLabel>
            <Switch checked={d.once} onCheckedChange={(once) => set({ once })} />
          </Field>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {d.channel === 'link' && (
            <Field>
              <FieldLabel>{copy.address}</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>{copy.linkBase}</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput value={d.slug} onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') })} />
              </InputGroup>
            </Field>
          )}
          {d.channel === 'embed' && (
            <Field>
              <FieldLabel>{copy.layout}</FieldLabel>
              <SegmentedControl
                variant="pill"
                value={d.survey.design?.layout ?? 'conversational'}
                onValueChange={(layout) => set({ survey: { ...d.survey, design: { ...d.survey.design, layout: layout as 'form' } } })}
                className="w-full *:flex-1"
              >
                {(['conversational', 'form', 'deck'] as const).map((l) => (
                  <SegmentedControlItem key={l} value={l} className="px-2">
                    {copy.layouts[l]}
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
            </Field>
          )}
          <Field>
            <FieldLabel>{copy.audience}</FieldLabel>
            <SegmentedControl
              variant="pill"
              value={d.audience}
              onValueChange={(audience) => set({ audience: audience as SurveyDeployment['audience'] })}
              className="w-full *:flex-1"
            >
              <SegmentedControlItem value="anyone">{copy.audiences.anyone}</SegmentedControlItem>
              <SegmentedControlItem value="members">{copy.audiences.members}</SegmentedControlItem>
            </SegmentedControl>
          </Field>
        </div>
      )}
    </div>
  )
}
