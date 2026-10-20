import { GripIcon, RulerIcon, SunIcon } from '@youj/icons'
import { ColorOpacityField } from '../../../components/ui/color-opacity-field'
import { InspectorPanel, InspectorRow } from '../../../components/ui/inspector-panel'
import { ScrubNumberField } from '../../../components/ui/scrub-number-field'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import type { BlurType, EffectId, EffectsInspectorCopy, EffectsValue, ShadowType, StrokePosition } from './data'

/* The four panels. Each is an InspectorPanel with its rows; `change` merges
 * a patch into one effect. A removed effect renders nothing. Fields that a
 * mode doesn't use (a progressive blur's range under a uniform one) stay in
 * place and go inert, so the panel never changes height. */

interface PanelsProps {
  value: EffectsValue
  copy: EffectsInspectorCopy
  change: <K extends EffectId>(id: K, patch: Partial<EffectsValue[K]>) => void
  remove: (id: EffectId) => void
}

function Panels({ value, copy, change, remove }: PanelsProps) {
  const { shadow, stroke, fill, blur } = value
  const common = <K extends EffectId>(id: K, title: string) => {
    const layer = value[id]
    return {
      title,
      enabled: layer.enabled,
      onEnabledChange: (enabled: boolean) => change(id, { enabled } as Partial<EffectsValue[K]>),
      visible: layer.visible,
      onVisibleChange: (visible: boolean) => change(id, { visible } as Partial<EffectsValue[K]>),
      onRemove: () => remove(id),
    }
  }
  const handles = { x: copy.x, y: copy.y, blur: <GripIcon size={14} trigger="none" />, spread: <SunIcon size={14} trigger="none" /> }
  const number = (id: 'shadow', key: 'x' | 'y' | 'blur' | 'spread', label: string, props: { min?: number; max?: number } = {}) => (
    <ScrubNumberField
      size="sm"
      aria-label={label}
      label={handles[key]}
      value={value[id][key]}
      onValueChange={(next) => change(id, { [key]: next })}
      {...props}
    />
  )

  return (
    <>
      {shadow.present && (
        <InspectorPanel
          {...common('shadow', copy.shadowTypes[shadow.type])}
          types={(Object.keys(copy.shadowTypes) as ShadowType[]).map((t) => ({ value: t, label: copy.shadowTypes[t] }))}
          type={shadow.type}
          onTypeChange={(type) => change('shadow', { type: type as ShadowType })}
        >
          <InspectorRow label={copy.position}>
            {number('shadow', 'x', copy.x)}
            {number('shadow', 'y', copy.y)}
          </InspectorRow>
          <InspectorRow label={copy.shadowBlur}>{number('shadow', 'blur', copy.shadowBlur, { min: 0 })}</InspectorRow>
          <InspectorRow label={copy.spread}>{number('shadow', 'spread', copy.spread)}</InspectorRow>
          <InspectorRow label={copy.color}>
            <ColorOpacityField
              size="sm"
              aria-label={copy.color}
              value={{ color: shadow.color, opacity: shadow.opacity }}
              onValueChange={(v) => change('shadow', v)}
            />
          </InspectorRow>
        </InspectorPanel>
      )}
      {stroke.present && (
        <InspectorPanel {...common('stroke', copy.stroke)}>
          <InspectorRow label={copy.color}>
            <ColorOpacityField
              size="sm"
              aria-label={copy.color}
              value={{ color: stroke.color, opacity: stroke.opacity }}
              onValueChange={(v) => change('stroke', v)}
            />
          </InspectorRow>
          <InspectorRow label={copy.strokePosition}>
            <Select
              items={(Object.keys(copy.strokePositions) as StrokePosition[]).map((p) => ({ value: p, label: copy.strokePositions[p] }))}
              value={stroke.position}
              onValueChange={(position) => position && change('stroke', { position: position as StrokePosition })}
            >
              <SelectTrigger size="sm" aria-label={copy.strokePosition} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(copy.strokePositions) as StrokePosition[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {copy.strokePositions[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </InspectorRow>
          <InspectorRow label={copy.weight}>
            <ScrubNumberField
              size="sm"
              aria-label={copy.weight}
              label={<RulerIcon size={14} trigger="none" />}
              unit="px"
              min={0}
              max={24}
              step={1}
              value={stroke.weight}
              onValueChange={(weight) => change('stroke', { weight })}
            />
          </InspectorRow>
        </InspectorPanel>
      )}
      {fill.present && (
        <InspectorPanel {...common('fill', copy.fill)}>
          <InspectorRow label={copy.color}>
            <ColorOpacityField
              size="sm"
              aria-label={copy.color}
              value={{ color: fill.color, opacity: fill.opacity }}
              onValueChange={(v) => change('fill', v)}
            />
          </InspectorRow>
        </InspectorPanel>
      )}
      {blur.present && (
        <InspectorPanel {...common('blur', copy.blur)}>
          <InspectorRow label={copy.blurType}>
            <SegmentedControl
              variant="pill"
              aria-label={copy.blurType}
              value={blur.type}
              onValueChange={(type) => change('blur', { type: type as BlurType })}
            >
              {(Object.keys(copy.blurTypes) as BlurType[]).map((t) => (
                <SegmentedControlItem key={t} value={t}>
                  {copy.blurTypes[t]}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          </InspectorRow>
          <InspectorRow label={copy.amount}>
            <ScrubNumberField
              size="sm"
              aria-label={copy.amount}
              label={<GripIcon size={14} trigger="none" />}
              unit="px"
              min={0}
              max={64}
              value={blur.radius}
              onValueChange={(radius) => change('blur', { radius })}
            />
          </InspectorRow>
          <InspectorRow label={copy.start}>
            <ScrubNumberField
              size="sm"
              aria-label={copy.start}
              label={<GripIcon size={14} trigger="none" />}
              unit="%"
              min={0}
              max={100}
              disabled={blur.type !== 'progressive'}
              value={blur.start}
              onValueChange={(start) => change('blur', { start })}
            />
          </InspectorRow>
          <InspectorRow label={copy.end}>
            <ScrubNumberField
              size="sm"
              aria-label={copy.end}
              label={<GripIcon size={14} trigger="none" />}
              unit="%"
              min={0}
              max={100}
              disabled={blur.type !== 'progressive'}
              value={blur.end}
              onValueChange={(end) => change('blur', { end })}
            />
          </InspectorRow>
        </InspectorPanel>
      )}
    </>
  )
}

export { Panels }
